'use client';

import { useState, useEffect, useRef } from 'react';
import { User, History } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthRedirect } from '@/lib/useAuthRedirect';
import { auth } from '@/lib/firebase';
import TransferHistoryModal from '@/components/TransferHistoryModal';
import { useTransferHistory } from '@/context/TransferHistoryContext';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthRedirect();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const pathname = usePathname();

  const { transferHistory } = useTransferHistory();

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const user = auth.currentUser;
    if (user) {
      // Clear history from Firestore before logging out
      // This will be handled by the context's cleanup if needed, or can be triggered manually if we add a context function for it.
      // For now, let's rely on the context updating after auth state changes.
      // await clearTransferHistory(user.uid);
    }
    auth.signOut();
    
    // Clear all service-related data
    localStorage.removeItem('musicbridge_service');
    localStorage.removeItem('spotify_playlists');
    localStorage.removeItem('spotify_playlists_timestamp');
    localStorage.removeItem('apple_playlists');
    localStorage.removeItem('apple_playlists_timestamp');
    localStorage.removeItem('apple_user_token');
    
    // Clear Spotify cookie
    document.cookie = 'spotify_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear MusicKit instance if it exists
    if (window.MusicKit) {
      const music = window.MusicKit.getInstance();
      if (music) {
        music.unauthorize();
      }
    }
    
    router.push('/home'); // Redirect to home page after logout
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm">
      <Link href="/home">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition">
          MusicBridge
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        {pathname !== '/login' && pathname !== '/home' && (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            title="Transfer History"
          >
            <History size={20} />
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
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

          {dropdownOpen && mounted && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
              <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                {user?.displayName || user?.email || 'User'}
              </div>
              <ul className="py-1" aria-labelledby="user-menu-button">
                <li>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white w-full text-left"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {showHistoryModal && (
        <TransferHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </nav>
  );
}
