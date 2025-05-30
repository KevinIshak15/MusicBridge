'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthRedirect } from '@/lib/useAuthRedirect';
import AppleMusicLogin from '@/components/AppleMusicLogin';
import { FaSpotify } from 'react-icons/fa';
import { SiApplemusic } from 'react-icons/si';
import Navbar from '@/components/Navbar';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthRedirect();
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  const [isAppleMusicAuthenticated, setIsAppleMusicAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Check Spotify authentication
      const spotifyToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('spotify_access_token='));
      setIsSpotifyAuthenticated(!!spotifyToken);

      // Check Apple Music authentication
      const appleToken = localStorage.getItem('apple_user_token');
      setIsAppleMusicAuthenticated(!!appleToken);
    }
  }, [mounted]);

  if (!mounted || loading) {
    return null;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleTransferDirection = (direction: 'spotify-to-apple' | 'apple-to-spotify') => {
    if (direction === 'spotify-to-apple') {
      localStorage.setItem('musicbridge_service', 'spotify');
      router.push('/playlists');
    } else {
      localStorage.setItem('musicbridge_service', 'apple');
      router.push('/playlists');
    }
  };

  const handleSpotifyLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/login`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-white dark:text-white">
            Welcome to MusicBridge
          </h1>
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Transfer your playlists between Spotify and Apple Music
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Step 1: Connect Your Music Services
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <FaSpotify className="w-12 h-12 text-[#1DB954] mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Spotify
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
                  {isSpotifyAuthenticated
                    ? 'Connected to Spotify'
                    : 'Connect your Spotify account'}
                </p>
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={handleSpotifyLogin}
                    disabled={isSpotifyAuthenticated}
                    className={`flex flex-col items-center bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-6 px-8 rounded-xl shadow-md transition duration-300 w-64 ${
                      isSpotifyAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaSpotify size={40} className="mb-3" />
                    <span className="text-xl">Spotify</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <SiApplemusic className="w-12 h-12 text-[#FC3C44] mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Apple Music
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
                  {isAppleMusicAuthenticated
                    ? 'Connected to Apple Music'
                    : 'Connect your Apple Music account'}
                </p>
                <AppleMusicLogin />
              </div>
            </div>
          </div>

          {isSpotifyAuthenticated && isAppleMusicAuthenticated && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Step 2: Choose Transfer Direction
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleTransferDirection('spotify-to-apple')}
                  className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <FaSpotify className="w-8 h-8 text-[#1DB954]" />
                    <span className="text-2xl text-gray-400">→</span>
                    <SiApplemusic className="w-8 h-8 text-[#FC3C44]" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Spotify to Apple Music
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    Transfer your Spotify playlists to Apple Music
                  </p>
                </button>

                <button
                  onClick={() => handleTransferDirection('apple-to-spotify')}
                  className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <SiApplemusic className="w-8 h-8 text-[#FC3C44]" />
                    <span className="text-2xl text-gray-400">→</span>
                    <FaSpotify className="w-8 h-8 text-[#1DB954]" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Apple Music to Spotify
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    Transfer your Apple Music playlists to Spotify
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
