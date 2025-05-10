'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    MusicKit: any;
  }
}

export function useMusicKit() {
  const [music, setMusic] = useState<any>(null);

  useEffect(() => {
    const developerToken = process.env.NEXT_PUBLIC_APPLE_MUSIC_TOKEN;

    if (!developerToken) {
      console.error('Apple Music token is missing in .env.local');
      return;
    }

    const configure = () => {
      window.MusicKit.configure({
        developerToken,
        app: {
          name: 'MusicBridge',
          build: '1.0.0',
        },
      });
      setMusic(window.MusicKit.getInstance());
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
