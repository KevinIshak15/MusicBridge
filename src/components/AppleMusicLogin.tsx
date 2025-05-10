'use client';

import { useRouter } from 'next/navigation';
import { useMusicKit } from '@/lib/useMusicKit';
import { FaApple } from 'react-icons/fa';

export default function AppleMusicLogin() {
  const music = useMusicKit();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      if (!music) return;

      // Always force re-authentication
      music.unauthorize();
      localStorage.removeItem('apple_user_token');
      localStorage.setItem('musicbridge_service', 'apple');

      const token = await music.authorize();
      localStorage.setItem('apple_user_token', token);

      router.push('/'); // or '/page' if your playlist page is there
    } catch (err) {
      console.error('[MusicBridge] Apple Music login failed:', err);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="flex flex-col items-center bg-[#FA243C] hover:bg-[#ff4757] text-white font-semibold py-6 px-8 rounded-xl shadow-md transition duration-300 w-64"
    >
      <FaApple size={40} className="mb-3" />
      <span className="text-xl">Apple Music</span>
    </button>
  );
}
