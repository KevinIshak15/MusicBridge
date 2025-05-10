'use client';

import { useRouter } from 'next/navigation';
import { useMusicKit } from '@/lib/useMusicKit';
import { FaApple } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function AppleMusicLogin() {
  const music = useMusicKit();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state if component unmounts while loading
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  const handleLogin = async () => {
    if (!music) return;

    setIsLoading(true);
    
    // Short timeout to reset loading state if popup is closed
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    try {
      music.unauthorize();
      localStorage.removeItem('apple_user_token');
      localStorage.setItem('musicbridge_service', 'apple');

      const token = await music.authorize();
      clearTimeout(timeoutId);
      
      try {
        await music.api.library.playlists();
        localStorage.setItem('apple_user_token', token);
        router.push('/');
      } catch {
        music.unauthorize();
        localStorage.removeItem('apple_user_token');
        setIsLoading(false);
      }
    } catch {
      clearTimeout(timeoutId);
      music.unauthorize();
      localStorage.removeItem('apple_user_token');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`flex flex-col items-center bg-[#FA243C] hover:bg-[#ff4757] text-white font-semibold py-6 px-8 rounded-xl shadow-md transition duration-300 w-64 ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <FaApple size={40} className="mb-3" />
      <span className="text-xl">{isLoading ? 'Connecting...' : 'Apple Music'}</span>
    </button>
  );
}
