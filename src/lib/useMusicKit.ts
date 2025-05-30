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

  useEffect(() => {
    const developerToken = process.env.NEXT_PUBLIC_APPLE_MUSIC_TOKEN;

    if (!developerToken) {
      console.error('Apple Music token is missing in .env.local');
      return;
    }

    const configure = () => {
      // Type assertion for window.MusicKit to ensure it matches our interface
      (window.MusicKit as BasicMusicKit).configure({
        developerToken,
        app: {
          name: 'MusicBridge',
          build: '1.0.0',
        },
      });
      setMusic((window.MusicKit as BasicMusicKit).getInstance());
    };

    if (window.MusicKit) {
      configure();
    } else {
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      script.async = true;
      script.onload = configure;
      document.body.appendChild(script);
    }
  }, []);

  return music;
}
