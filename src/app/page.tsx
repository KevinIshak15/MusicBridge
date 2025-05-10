// src/app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { transferToAppleMusic, getAppleMusicPlaylists } from '@/lib/apple';
import { transferToSpotify, getPlaylistTracks } from '@/lib/spotify';
import Navbar from '@/components/Navbar';
import TrackModal from '@/components/TrackModal';
import toast from 'react-hot-toast';


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

  useEffect(() => {
    const selectedService = localStorage.getItem('musicbridge_service');
    console.log('[MusicBridge] Detected service in localStorage:', selectedService);
    setService(selectedService);

    if (!selectedService) {
      router.push('/home');
    }
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
      }).catch((error) => {
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
        if (service === 'spotify') {
          const res = await fetch(`/api/spotify/playlists?token=${token}`);
          if (!res.ok) {
            const html = await res.text();
            console.error("Non-JSON response (likely an error page):", html);
            throw new Error(`Failed to fetch playlists. Status: ${res.status}`);
          }
          const data = await res.json();
          setPlaylists(data.playlists || []);
        } else if (service === 'apple') {
          console.log('[MusicBridge] Fetching Apple Music playlists...');
          const data = await getAppleMusicPlaylists();
          console.log('[MusicBridge] Retrieved Apple playlists:', data);
          setPlaylists(data || []);
        }
      } catch (err) {
        console.error("Error fetching playlists:", err);
      }
      setLoading(false);
    };

    fetchPlaylists();
  }, [token, service]);

  const handleSelect = async (playlist: Playlist) => {
    setLoading(true);
    setSelectedPlaylist(playlist);
    try {
      if (service === 'spotify') {
        const fetchedTracks = await getPlaylistTracks(token!, playlist.id);
        setTracks(fetchedTracks);
        setSelectedTrackIds(new Set(fetchedTracks.map((t: Track) => t.id)));
      } else if (service === 'apple') {
        const music = window.MusicKit.getInstance();
        const res = await music.api.library.playlist(playlist.id);
        const fetchedTracks = res.relationships.tracks.data.map((track: any) => ({
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
    } catch (err) {
      console.error(err);
      setTracks([]);
    }
    setLoading(false);
  };

  const handleToggleTrack = (id: string) => {
    setSelectedTrackIds((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
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
    if (!selectedPlaylist || !token) return;

    setLoading(true);
    const selectedTrackObjects = tracks.filter((t) => selectedTrackIds.has(t.id));

    let result;
    if (service === 'spotify') {
      result = await transferToAppleMusic(
        selectedPlaylist.name,
        selectedTrackObjects,
        newPlaylistDescription
      );
    } else if (service === 'apple') {
      const getFreshToken = () => {
        const match = document.cookie.match(/spotify_access_token=([^;]+)/);
        return match ? match[1] : null;
      };
      const freshToken = getFreshToken();
      result = await transferToSpotify(
        newPlaylistName || selectedPlaylist.name,
        selectedTrackObjects,
        freshToken || token,
        newPlaylistDescription
      );
    }

    setLoading(false);
    if (result?.success) {
      toast.success(result.message);
    } else {
      toast.error(result?.message || 'Transfer failed.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="p-10 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900">
          {service === 'apple' ? 'Apple Music' : 'Spotify'} Playlists
        </h1>

        {loading}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`p-4 bg-white rounded shadow hover:shadow-md transition border-2 ${
                selectedPlaylist?.id === pl.id ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img
                src={pl.images[0]?.url}
                alt={pl.name}
                className="w-full h-40 object-contain rounded mb-2 bg-white"
              />
              <h2 className="text-xl font-bold text-gray-900">{pl.name}</h2>
              <button
                onClick={() => handleSelect(pl)}
                className="bg-purple-600 text-white px-3 py-1 cursor-pointer rounded hover:bg-purple-700"
              >
                View & Transfer
              </button>
            </div>
          ))}
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
        }}
        onToggleAll={handleToggleAll}
        allSelected={allSelected}
        service={service as 'apple' | 'spotify'} // safely cast
        newPlaylistName={newPlaylistName}
        newPlaylistDescription={newPlaylistDescription}
        setNewPlaylistName={setNewPlaylistName}
        setNewPlaylistDescription={setNewPlaylistDescription}
      />
    )}
    </>
  );
}
