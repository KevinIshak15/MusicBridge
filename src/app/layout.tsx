import React from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { TransferHistoryProvider } from '@/context/TransferHistoryContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicBridge",
  description: "Transfer playlists between Spotify and Apple Music",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Remove the old script tags */}
        {/* <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener("musickitloaded", function() {
                MusicKit.configure({
                  developerToken: "${process.env.NEXT_PUBLIC_APPLE_MUSIC_TOKEN}",
                  app: {
                    name: "MusicBridge",
                    build: "1.0.0"
                  }
                });
              });
            `,
          }}
        />
        <script src="https://js-cdn.music.apple.com/musickit/v1/musickit.js" /> */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <TransferHistoryProvider>
          {children}
        </TransferHistoryProvider>
      </body>
    </html>
  );
}
