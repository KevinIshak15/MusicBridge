'use client';

import { useEffect, useState } from 'react';
import { AppleMusicApiPlaylist, AppleMusicApiTrack } from '../lib/apple';

// Define a basic interface for the parts of MusicKit we use
interface BasicMusicKit {
  configure: (options: object) => void;
  getInstance: () => BasicMusicKit; // Use BasicMusicKit as return type
  api: {
    library: {
      playlists: () => Promise<AppleMusicApiPlaylist[]>; // Removed | any
      playlist: (id: string) => Promise<{ relationships: { tracks: { data: AppleMusicApiTrack[] } } }>; // Updated return type for playlist to match observed structure
      // other library methods used
    };
    // Added search method to the API interface
    search: (
      term: string,
      options?: { types?: string[]; limit?: number }
    ) => Promise<{ songs?: { data: AppleMusicApiTrack[] } }>;
    // other api methods used
  };
  unauthorize: () => void;
  authorize: () => Promise<string>; // authorize returns a token string
}

declare global {
  interface Window {
    MusicKit: BasicMusicKit; // Use the basic interface
  }
}

export function useMusicKit() {
  const [music, setMusic] = useState<BasicMusicKit | null>(null); // Use the basic interface or null
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const developerToken = process.env.NEXT_PUBLIC_APPLE_MUSIC_TOKEN;

    if (!developerToken) {
      console.error('Apple Music token is missing in .env.local');
      setError('Apple Music developer token is missing. Please check your environment variables.');
      return;
    }

    const configure = () => {
      try {
        // Type assertion for window.MusicKit to ensure it matches our interface
        (window.MusicKit as BasicMusicKit).configure({
          developerToken,
          app: {
            name: 'MusicBridge',
            build: '1.0.0',
          },
        });
        setMusic((window.MusicKit as BasicMusicKit).getInstance());
        setError(null); // Clear any previous errors
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[MusicBridge] Error configuring MusicKit:', errorMessage);
        
        if (errorMessage.includes('expired') || errorMessage.includes('token')) {
          setError('expired');
        } else {
          setError(errorMessage);
        }
      }
    };

    // Add global error handler for MusicKit initialization errors
    const handleMusicKitError = (event: ErrorEvent) => {
      if (event.message && (event.message.includes('expired') || event.message.includes('token'))) {
        console.error('[MusicBridge] MusicKit initialization error:', event.message);
        setError('expired');
      }
    };

    window.addEventListener('error', handleMusicKitError);

    if (window.MusicKit) {
      configure();
    } else {
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      script.async = true;
      script.onload = configure;
      script.onerror = () => {
        setError('Failed to load MusicKit library. Please check your internet connection.');
      };
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener('error', handleMusicKitError);
    };
  }, []);

  return { music, error };
}
