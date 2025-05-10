// src/lib/apple.ts

export type Track = {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  
  export async function transferToAppleMusic(
    playlistName: string,
    tracks: Track[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const music = window.MusicKit.getInstance();
      const userToken = localStorage.getItem('apple_user_token');
      const developerToken = process.env.NEXT_PUBLIC_APPLE_MUSIC_TOKEN;
  
      if (!userToken || !developerToken) {
        throw new Error('Missing Apple Music token(s)');
      }
  
      // Search for each track
      const appleTrackIds: string[] = [];
      for (const track of tracks) {
        const query = `${track.name} ${track.artist}`;
        const result = await music.api.search(query, { types: ['songs'], limit: 1 });
        const match = result?.songs?.data?.[0];
        if (match) {
          appleTrackIds.push(match.id);
        } else {
          console.warn(`[MusicBridge] Not found: ${query}`);
        }
      }
  
      if (appleTrackIds.length === 0) {
        return { success: false, message: 'No matching tracks found.' };
      }
  
      // Create the playlist via Apple Music API
      const res = await fetch('https://api.music.apple.com/v1/me/library/playlists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${developerToken}`,
          'Music-User-Token': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: {
            name: playlistName,
            description: 'Created by MusicBridge',
          },
          relationships: {
            tracks: {
              data: appleTrackIds.map((id) => ({ id, type: 'songs' })),
            },
          },
        }),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Apple Music playlist creation failed: ${errorText}`);
      }
  
      return {
        success: true,
        message: `Playlist "${playlistName}" created in Apple Music with ${appleTrackIds.length} track(s)!`,
      };
    } catch (err: any) {
      console.error('[MusicBridge] Error transferring to Apple Music:', err);
      return {
        success: false,
        message: err.message || 'An error occurred during transfer.',
      };
    }
  }
  
  
  
   
export const handleAppleMusicLogin = () => {
if (typeof window !== 'undefined' && window.MusicKit) {
    const music = window.MusicKit.getInstance();
    music.authorize().then((token: string) => {
    console.log('Apple Music Token:', token);
    // You can now send this token to your backend or save it
    });
} else {
    console.error('MusicKit not available');
}
};

type Playlist = {
    id: string;
    name: string;
    images: { url: string }[];
  };
  
  export async function getAppleMusicPlaylists(): Promise<Playlist[]> {
    const music = window.MusicKit.getInstance();
  
    const response = await music.api.library.playlists();
    console.log('[MusicBridge] Raw Apple playlists:', response);
  
    if (!Array.isArray(response)) {
      console.warn('[MusicBridge] Unexpected Apple playlist structure');
      return [];
    }
  
    const mapped = response.map((item: any) => {
      const name = item.attributes?.name || 'Untitled';
      const artworkUrl = item.attributes?.artwork?.url
        ?.replace('{w}', '300')
        ?.replace('{h}', '300');
  
      return {
        id: item.id,
        name,
        images: artworkUrl ? [{ url: artworkUrl }] : [],
      };
    });
  
    console.log('[MusicBridge] Final Apple playlists:', mapped);
    return mapped;
  }
  
  
  
  
  
  
  