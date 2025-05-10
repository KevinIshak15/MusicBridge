'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FaSpotify } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import AppleMusicLogin from '@/components/AppleMusicLogin';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSpotifyLoading, setIsSpotifyLoading] = useState(false);

  // Handle error parameters silently
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'access_denied') {
      localStorage.removeItem('musicbridge_service');
      router.replace('/home');
    }
  }, [searchParams, router]);

  const handleSpotifyLogin = () => {
    setIsSpotifyLoading(true);
    localStorage.setItem('musicbridge_service', 'spotify');
    window.location.href = '/api/spotify/login';
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white px-6 pt-20">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
          Transfer Playlists Between Music Services
        </h1>
        <p className="mb-12 text-lg text-gray-300 max-w-xl text-center">
          Seamlessly move your music library between Spotify and Apple Music. Quick, secure, and hassle-free.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={handleSpotifyLogin}
            disabled={isSpotifyLoading}
            className={`flex flex-col items-center bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-6 px-8 rounded-xl shadow-md transition duration-300 w-64 ${
              isSpotifyLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FaSpotify size={40} className="mb-3" />
            <span className="text-xl">{isSpotifyLoading ? 'Connecting...' : 'Spotify'}</span>
          </button>

          <AppleMusicLogin />
        </div>
      </div>
    </>
  );
}
