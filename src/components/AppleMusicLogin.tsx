'use client';

import { useMusicKit } from '@/lib/useMusicKit';
import { FaApple } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AppleMusicLogin() {
  const { music, error } = useMusicKit();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const token = localStorage.getItem('apple_user_token');
      setIsConnected(!!token);
    };
    checkConnection();
  }, []);

  // Show error toast when token is expired
  useEffect(() => {
    if (error === 'expired') {
      toast.error(
        'Apple Music developer token has expired. Please regenerate it using: npm run generate-token',
        { duration: 8000 }
      );
    } else if (error) {
      toast.error(`Apple Music error: ${error}`, { duration: 6000 });
    }
  }, [error]);

  // Reset loading state if component unmounts while loading
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  const handleLogin = async () => {
    if (!music) {
      if (error === 'expired') {
        toast.error(
          'Apple Music developer token has expired. Please regenerate it using: npm run generate-token',
          { duration: 8000 }
        );
      } else {
        toast.error('Apple Music is not available. Please check the configuration.', { duration: 6000 });
      }
      return;
    }

    setIsLoading(true);
    
    // Short timeout to reset loading state if popup is closed
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    try {
      music.unauthorize();
      localStorage.removeItem('apple_user_token');

      const token = await music.authorize();
      clearTimeout(timeoutId);
      
      try {
        await music.api.library.playlists();
        localStorage.setItem('apple_user_token', token);
        setIsConnected(true);
        toast.success('Successfully connected to Apple Music!');
        window.location.href = '/home';
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify connection';
        console.error('[MusicBridge] Apple Music verification error:', errorMessage);
        music.unauthorize();
        localStorage.removeItem('apple_user_token');
        setIsConnected(false);
        setIsLoading(false);
        toast.error(`Connection failed: ${errorMessage}`, { duration: 6000 });
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage = err instanceof Error ? err.message : 'Authorization failed';
      console.error('[MusicBridge] Apple Music authorization error:', errorMessage);
      
      if (music) {
        music.unauthorize();
      }
      localStorage.removeItem('apple_user_token');
      setIsConnected(false);
      setIsLoading(false);
      toast.error(`Authorization failed: ${errorMessage}`, { duration: 6000 });
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleLogin}
        disabled={isLoading || isConnected || error === 'expired'}
        className={`flex flex-col items-center bg-[#FA243C] hover:bg-[#ff4757] text-white font-semibold py-6 px-8 rounded-xl shadow-md transition duration-300 w-64 ${
          (isLoading || isConnected || error === 'expired') ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <FaApple size={40} className="mb-3" />
        <span className="text-xl">Apple Music</span>
      </button>
      {error === 'expired' && (
        <p className="mt-2 text-sm text-red-400 text-center max-w-xs">
          Developer token expired. Run: <code className="bg-gray-800 px-2 py-1 rounded">npm run generate-token</code>
        </p>
      )}
    </div>
  );
}
