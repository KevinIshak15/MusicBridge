// src/app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { transferToAppleMusic, getAppleMusicPlaylists } from '@/lib/apple';
import { transferToSpotify, getPlaylistTracks } from '@/lib/spotify';
import Navbar from '@/components/Navbar';
import TrackModal from '@/components/TrackModal';
import toast from 'react-hot-toast';
import { Search, Info } from 'lucide-react';
import PlaylistDetails from '@/components/PlaylistDetails';
import { addTransferToHistory } from '@/lib/transferHistory';
import { auth } from '@/lib/firebase';
import { useTransferHistory } from '@/context/TransferHistoryContext';


type Playlist = {
  id: string;
  name: string;
  images: { url: string }[];
};

type Track = {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
};

// Define a type for Apple Music track data from the API response
interface AppleMusicApiTrack {
  id: string;
  type: string; // e.g., 'songs'
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    artwork?: {
      url: string;
      width: number;
      height: number;
      // other properties might exist
    };
    // other attributes might exist
  };
  // other properties might exist
}

export default function Page() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [allSelected, setAllSelected] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [userName, setUserName] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const { refreshHistory } = useTransferHistory();

  useEffect(() => {
    const selectedService = localStorage.getItem('musicbridge_service');
    console.log('[MusicBridge] Detected service in localStorage:', selectedService);
    setService(selectedService);

    if (!selectedService) {
      router.push('/home');
    }
    setIsInitializing(false);
  }, [router]);

  useEffect(() => {
    if (!service) return;

    if (service === 'spotify') {
      const getTokenFromCookie = () => {
        const match = document.cookie.match(/spotify_access_token=([^;]+)/);
        return match ? match[1] : null;
      };

      const accessToken = getTokenFromCookie();
      if (accessToken) {
        setToken(accessToken);
      }
    } else if (service === 'apple') {
      const appleToken = localStorage.getItem('apple_user_token');
      if (!appleToken) {
        // If no token is found, redirect back to home
        router.push('/home');
        return;
      }

      // Verify the token is still valid
      const music = window.MusicKit.getInstance();
      music.authorize().then(() => {
        setToken(appleToken);
      }).catch((error: unknown) => {
        console.error('[MusicBridge] Token validation failed:', error);
        // If token is invalid, clear it and redirect to home
        localStorage.removeItem('apple_user_token');
        router.push('/home');
      });
    }
  }, [service, router]);

  useEffect(() => {
    if (!token || !service) return;

    const fetchPlaylists = async () => {
      setLoading(true);
      try {
        // Check cache first
        const cachedPlaylists = localStorage.getItem(`${service}_playlists`);
        const cachedTimestamp = localStorage.getItem(`${service}_playlists_timestamp`);
        const now = Date.now();
        
        // Use cache if it's less than 5 minutes old
        if (cachedPlaylists && cachedTimestamp && (now - parseInt(cachedTimestamp)) < 300000) {
          setPlaylists(JSON.parse(cachedPlaylists));
          setLoading(false);
          return;
        }

        if (service === 'spotify') {
          const res = await fetch(`/api/spotify/playlists?token=${token}`);
          if (!res.ok) {
            const html = await res.text();
            console.error("Non-JSON response (likely an error page):", html);
            throw new Error(`Failed to fetch playlists. Status: ${res.status}`);
          }
          const data = await res.json();
          const playlists = data.playlists || [];
          setPlaylists(playlists);
          // Cache the results
          localStorage.setItem(`${service}_playlists`, JSON.stringify(playlists));
          localStorage.setItem(`${service}_playlists_timestamp`, now.toString());
        } else if (service === 'apple') {
          console.log('[MusicBridge] Fetching Apple Music playlists...');
          const data = await getAppleMusicPlaylists();
          console.log('[MusicBridge] Retrieved Apple playlists:', data);
          setPlaylists(data || []);
          // Cache the results
          localStorage.setItem(`${service}_playlists`, JSON.stringify(data));
          localStorage.setItem(`${service}_playlists_timestamp`, now.toString());
        }
      } catch (err) {
        console.error("Error fetching playlists:", err);
      }
      setLoading(false);
    };

    const fetchUserProfile = async () => {
      try {
        if (service === 'spotify') {
          const res = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUserName(data.display_name);
          } else {
            // Handle non-OK response for Spotify profile fetch
            console.error('Failed to fetch Spotify user profile:', res.status, await res.text());
            setUserName('Spotify User'); // Set a default or error name
          }
        } else if (service === 'apple') {
          // For Apple Music, the profile info is tied to MusicKit auth, often simpler
          // We set a default name here, as detailed profile fetching is less common
          setUserName('Your Library');
        }
      } catch (error: unknown) {
        console.error('Error fetching user profile:', error);
        // If there was an error, set a default or error name based on service
        if (service === 'spotify') {
           setUserName('Spotify User');
        } else if (service === 'apple') {
           setUserName('Your Library'); // Explicitly set if error occurs for Apple Music
        }
      }
    };

    // Fetch playlists and user profile in parallel
    const fetchData = async () => {
      await Promise.all([
        fetchPlaylists(),
        fetchUserProfile()
      ]);
    };

    fetchData();
  }, [token, service]);

  const handleSelect = async (playlist: Playlist) => {
    setIsLoadingTracks(true);
    setSelectedPlaylist(playlist);
    try {
      if (service === 'spotify') {
        const fetchedTracks = await getPlaylistTracks(token!, playlist.id);
        setTracks(fetchedTracks);
        setSelectedTrackIds(new Set(fetchedTracks.map((t: Track) => t.id)));
      } else if (service === 'apple') {
        const music = window.MusicKit.getInstance();
        const res = await music.api.library.playlist(playlist.id);
        const fetchedTracks = res.relationships.tracks.data.map((track: AppleMusicApiTrack) => ({
          id: track.id,
          name: track.attributes.name,
          artist: track.attributes.artistName,
          albumArt: track.attributes.artwork?.url
            ? track.attributes.artwork.url.replace('{w}x{h}', '300x300')
            : '',
        }));
        setTracks(fetchedTracks);
        setSelectedTrackIds(new Set(fetchedTracks.map((t: Track) => t.id)));
      }
      setShowModal(true);
    } catch (error: unknown) {
      console.error('Error selecting playlist:', error);
      setTracks([]);
    }
    setIsLoadingTracks(false);
  };

  const handleToggleTrack = (id: string) => {
    setSelectedTrackIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(tracks.map((t) => t.id)));
    }
    setAllSelected(!allSelected);
  };

  const handleTransfer = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to transfer playlists.');
      return;
    }

    if (!service || !selectedPlaylist) {
      alert('Please select a service and a playlist.');
      return;
    }

    setLoading(true);
    setShowModal(false); // Close the modal when transfer starts

    const targetService = service === 'spotify' ? 'apple' : 'spotify';
    const newName = newPlaylistName || `${selectedPlaylist.name} (Transferred)`;
    const newDescription = newPlaylistDescription || 'Created by MusicBridge';
    const selectedTrackObjects = tracks.filter((t) => selectedTrackIds.has(t.id));

    let success = false;
    let errorMessage = '';

    if (service === 'spotify' && targetService === 'apple') {
      const result = await transferToAppleMusic(
        newName,
        selectedTrackObjects,
        newDescription
      );
      if (result.success) {
        toast.success(result.message);
        success = true;
      } else {
        toast.error(result.message || 'Failed to transfer playlist');
        errorMessage = result.message || 'Unknown error';
      }
    } else if (service === 'apple' && targetService === 'spotify') {
      const getFreshToken = () => {
        const match = document.cookie.match(/spotify_access_token=([^;]+)/);
        return match ? match[1] : null;
      };
      const freshToken = getFreshToken();
      if (!freshToken && !token) {
        toast.error('No valid Spotify token found');
        return;
      }
      const result = await transferToSpotify(
        newName,
        selectedTrackObjects,
        freshToken || token!,
        newDescription
      );
      if (result.success) {
        toast.success(result.message);
        success = true;
      } else {
        toast.error(result.message || 'Failed to transfer playlist');
        errorMessage = result.message || 'Unknown error';
      }
    }

    await addTransferToHistory({
      userId: user.uid,
      sourceService: service as 'spotify' | 'apple',
      destinationService: targetService as 'spotify' | 'apple',
      sourcePlaylistName: selectedPlaylist.name,
      destinationPlaylistName: newName,
      trackCount: selectedTrackIds.size,
      status: success ? 'success' : 'failed',
      ...(success ? {} : { errorMessage }),
    });

    if (success) {
      setSelectedTrackIds(new Set());
      setShowModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      await refreshHistory();
    } else {
      toast.error(`Transfer failed: ${errorMessage}`);
    }

    setLoading(false);
  };

  const filteredPlaylists = playlists
    .filter(pl => pl.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // If you have date information, you can sort by that
      return 0;
    });

  return (
    <>
      <Navbar />
      <main className="p-10 bg-gray-50 min-h-screen">
        {isInitializing ? (
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">
              {service === 'apple' ? 'Apple Music' : 'Spotify'} Playlists
              {userName && (
                <span className="text-xl font-normal text-gray-600 ml-2">
                  {service === 'apple' ? userName : `for ${userName}`}
                </span>
              )}
            </h1>

            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search playlists..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date Created</option>
              </select>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {loading ? (
            // Loading skeleton for playlists
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="p-4 bg-white rounded shadow animate-pulse">
                <div className="w-full h-40 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))
          ) : filteredPlaylists.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchQuery ? 'No playlists match your search' : 'No playlists found'}
            </div>
          ) : (
            filteredPlaylists.map((pl) => (
              <div
                key={pl.id}
                className={`p-4 bg-white rounded shadow hover:shadow-md transition border-2 ${
                  selectedPlaylist?.id === pl.id ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <div className="relative">
                  <img
                    src={pl.images[0]?.url}
                    alt={pl.name}
                    className="w-full h-40 object-contain rounded mb-2 bg-white"
                    loading="lazy"
                  />
                  <button
                    onClick={() => {
                      setSelectedPlaylist(pl);
                      setShowDetails(true);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all shadow-sm hover:shadow"
                  >
                    <Info size={18} className="text-gray-600" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{pl.name}</h2>
                <button
                  onClick={() => handleSelect(pl)}
                  disabled={isLoadingTracks}
                  className={`mt-2 bg-purple-600 text-white px-3 py-1 cursor-pointer rounded hover:bg-purple-700 ${
                    isLoadingTracks ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoadingTracks && selectedPlaylist?.id === pl.id ? 'Loading...' : 'View & Transfer'}
                </button>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">New Playlist Options (for transfer target)</h3>
            <input
              type="text"
              placeholder="Playlist name"
              className="border p-2 rounded w-full mb-2"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              className="border p-2 rounded w-full"
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
            />
          </div>
        )}

        {showDetails && selectedPlaylist && (
          <PlaylistDetails
            playlist={selectedPlaylist}
            onClose={() => {
              setShowDetails(false);
              setSelectedPlaylist(null);
            }}
            service={service as 'spotify' | 'apple'}
          />
        )}
      </main>

      {showModal && selectedPlaylist && service && (
        <TrackModal
          playlistName={selectedPlaylist.name}
          tracks={tracks}
          selectedTracks={selectedTrackIds}
          onToggleTrack={handleToggleTrack}
          onTransfer={handleTransfer}
          onClose={() => {
            setShowModal(false);
            setSelectedPlaylist(null);
            setNewPlaylistName('');
            setNewPlaylistDescription('');
          }}
          onToggleAll={handleToggleAll}
          allSelected={allSelected}
          service={service as 'apple' | 'spotify'}
          newPlaylistName={newPlaylistName}
          newPlaylistDescription={newPlaylistDescription}
          setNewPlaylistName={setNewPlaylistName}
          setNewPlaylistDescription={setNewPlaylistDescription}
        />
      )}
    </>
  );
}
