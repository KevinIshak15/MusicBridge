'use client';

import { useEffect, useState } from 'react';
import { Moon, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<{ name: string; image: string } | null>(null);

  useEffect(() => {
    const service = localStorage.getItem('musicbridge_service');

    if (service === 'spotify') {
      const fetchSpotifyUser = async () => {
        try {
          const res = await fetch('/api/spotify/me');
          if (!res.ok) {
            const errMsg = await res.text();
            throw new Error(`Spotify /me error: ${errMsg}`);
          }
          const data = await res.json();
          setUser({
            name: data.display_name || 'Spotify User',
            image: data.images?.[0]?.url || '',
          });
        } catch (err) {
          console.error('[MusicBridge] Failed to fetch Spotify user info:', err);
        }
      };
      fetchSpotifyUser();
    }

    if (service === 'apple') {
      const fetchAppleUser = async () => {
        try {
          const token = localStorage.getItem('apple_user_token');
          if (typeof window !== 'undefined' && window.MusicKit && token) {
            const music = window.MusicKit.getInstance();
            const storefront = await music.api.storefront();
            const name = storefront?.attributes?.name || 'Apple User';
            setUser({ name, image: '' });
          }
        } catch (err) {
          console.warn('[MusicBridge] Failed to fetch Apple Music user info:', err);
        }
      };
      fetchAppleUser();
    }
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLogout = () => {
    document.cookie =
      'spotify_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('apple_user_token');
    localStorage.removeItem('musicbridge_service');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
      <Link href="/home">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition">
          MusicBridge
        </h1>
      </Link>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
              {user?.name || 'User'}
            </div>
            <button
              onClick={toggleDarkMode}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Moon className="inline-block w-4 h-4 mr-2" />
              Toggle Dark Mode
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="inline-block w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
