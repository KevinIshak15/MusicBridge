'use client';

import { useEffect, useState, useRef } from 'react';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthRedirect } from '@/lib/useAuthRedirect';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuthRedirect();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Close the dropdown menu
      setOpen(false);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear any existing music service tokens
      document.cookie =
        'spotify_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.removeItem('apple_user_token');
      localStorage.removeItem('musicbridge_service');
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still redirect to login page even if there's an error
      router.push('/login');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
      <Link href="/home">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition">
          MusicBridge
        </h1>
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          {mounted && user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || user.email || 'User'}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </button>

        {open && mounted && (
          <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
              {user?.displayName || user?.email || 'User'}
            </div>
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
