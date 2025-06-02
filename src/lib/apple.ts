// src/lib/apple.ts

export type Track = {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  
  // Define a type for Apple Music playlist data from the API response
  export interface AppleMusicApiPlaylist {
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
  
  // Define a type for Apple Music track data from the API response
  export interface AppleMusicApiTrack {
    id: string;
    type: string; // e.g., 'songs'
    attributes: {
      name: string;
      artistName: string;
      albumName?: string;
      artwork?: {
        url: string;
        width: number;
        height: number;
      };
      // include other relevant attributes if needed
    };
    // include other relevant top-level properties if needed
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
      const notFoundTracks: Track[] = [];
      
      for (const track of tracks) {
        const query = `${track.name} ${track.artist}`;
        const result = await music.api.search(query, { types: ['songs'], limit: 1 });
        const match = result?.songs?.data?.[0];
        if (match) {
          appleTrackIds.push(match.id);
        } else {
          console.warn(`[MusicBridge] Not found: ${query}`);
          notFoundTracks.push(track);
        }
      }
  
      if (appleTrackIds.length === 0) {
        return { 
          success: false, 
          message: 'No matching tracks found in Apple Music.' 
        };
      }

      // Split tracks into smaller chunks to avoid overwhelming the API
      const chunkSize = 50;
      const trackChunks = [];
      for (let i = 0; i < appleTrackIds.length; i += chunkSize) {
        trackChunks.push(appleTrackIds.slice(i, i + chunkSize));
      }

      let playlistId = '';
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
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
                  data: trackChunks[0].map((id) => ({ id, type: 'songs' })),
                },
              },
            }),
          });
  
          if (!res.ok) {
            const errorData = await res.json();
            if (errorData.errors?.[0]?.code === '50001' && retryCount < maxRetries - 1) {
              retryCount++;
              // Wait for 2 seconds before retrying
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
            throw new Error(`Apple Music playlist creation failed: ${JSON.stringify(errorData)}`);
          }

          const playlistData = await res.json();
          playlistId = playlistData.data[0].id;

          // Add remaining tracks in chunks
          for (let i = 1; i < trackChunks.length; i++) {
            await fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${developerToken}`,
                'Music-User-Token': userToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                data: trackChunks[i].map((id) => ({ id, type: 'songs' })),
              }),
            });
          }

          let message = `Playlist "${playlistName}" created in Apple Music with ${appleTrackIds.length} track(s)!`;
          if (notFoundTracks.length > 0) {
            message += `\n${notFoundTracks.length} track(s) could not be found in Apple Music.`;
          }
          
          return { success: true, message };
        } catch (error) {
          if (retryCount === maxRetries - 1) throw error;
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
  
      throw new Error('Failed to create playlist after multiple retries');
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
  
  
  
  
  
  
  