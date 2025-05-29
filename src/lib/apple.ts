// src/lib/apple.ts

export type Track = {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  
  // Define a type for Apple Music playlist data from the API response
  interface AppleMusicApiPlaylist {
    id: string;
    type: string; // e.g., 'playlists'
    attributes?: {
      name?: string;
      artwork?: {
        url: string;
        width: number;
        height: number;
        // other properties might exist
      };
      // other attributes might exist
    };
    // other properties might exist
  }
  
  export async function transferToAppleMusic(
    playlistName: string,
    tracks: Track[],
    newPlaylistDescription?: string
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
            description: newPlaylistDescription || 'Created by MusicBridge',
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
    } catch (error: unknown) {
      console.error('[MusicBridge] Error transferring to Apple Music:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during transfer.';
      return {
        success: false,
        message: errorMessage,
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
  
    // The Apple Music API response for playlists is often an array of playlist objects directly.
    // However, the MusicKit JS library might wrap it. Let's assume `response` is the array or has a data property that is the array.
    // Based on the usage below (`response.map`), it seems `response` itself might be the array or an object with a `data` array.
    // Let's add a check for the `data` property if response is not an array.
    const playlistData = Array.isArray(response) ? response : (response as { data: AppleMusicApiPlaylist[] }).data; // Refined type assertion

    if (!Array.isArray(playlistData)) {
      console.warn('[MusicBridge] Unexpected Apple playlist structure:', response);
      return [];
    }
  
    const mapped = playlistData.map((item: AppleMusicApiPlaylist) => { // Use the new interface
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
  
  
  
  
  
  
  