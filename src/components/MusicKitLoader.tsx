'use client';

import Script from 'next/script';

export default function MusicKitLoader() {
  return (
    <Script
      src="https://js-cdn.music.apple.com/musickit/v1/musickit.js"
      onLoad={() => {
        // Configure MusicKit once the script is loaded
        document.addEventListener("musickitloaded", function() {
          MusicKit.configure({
            developerToken: `${process.env.NEXT_PUBLIC_APPLE_MUSIC_TOKEN}`,
            app: {
              name: "MusicBridge",
              build: "1.0.0"
            }
          });
        });
      }}
      strategy="afterInteractive" // Load script after the page is interactive
    />
  );
} 