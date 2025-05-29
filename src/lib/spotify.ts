export type Track = {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  
  // Define a type for Spotify API track item data from the getPlaylistTracks response
  interface SpotifyApiTrackItem {
    track: {
      id: string;
      name: string;
      artists: { name: string }[];
      album: {
        images: { url: string }[];
        // other album properties
      };
      // other track properties
    };
    // other item properties
  }
  
  export async function transferToSpotify(
playlistName: string, tracks: Track[], token: string, newPlaylistDescription: string  ): Promise<{ success: boolean; message: string }> {
    try {
      // Step 1: Get Spotify user profile
      const userRes = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const userText = await userRes.text();
      console.log('[MusicBridge] /me status:', userRes.status);
      console.log('[MusicBridge] /me response:', userText);
      console.log('[MusicBridge] Using token for /me call:', token);
  
      if (!userRes.ok) {
        throw new Error(`Spotify user fetch failed: ${userText}`);
      }
  
      const user = JSON.parse(userText);
      const userId = user.id;
  
      // Step 2: Create a new playlist
      const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          description: newPlaylistDescription || 'Created by MusicBridge',
          public: false,
        }),
      });
  
      const createText = await createRes.text();
      if (!createRes.ok) {
        throw new Error(`Spotify playlist creation failed: ${createText}`);
      }
  
      const playlist = JSON.parse(createText);
  
      // Step 3: Search for each track and collect their Spotify URIs
      const uris: string[] = [];
  
      for (const track of tracks) {
        const query = encodeURIComponent(`${track.name} ${track.artist}`);
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!searchRes.ok) continue;
  
        const searchData = await searchRes.json();
        const found = searchData.tracks?.items?.[0];
  
        if (found?.uri) {
          uris.push(found.uri);
        }
      }
  
      if (uris.length === 0) {
        return { success: false, message: 'No matching Spotify tracks found.' };
      }
  
      // Step 4: Add tracks to the playlist
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris }),
      });
  
      return {
        success: true,
        message: `Transferred ${uris.length} track(s) to your new Spotify playlist.`,
      };
    } catch (error: unknown) {
      console.error('[MusicBridge] Error transferring to Spotify:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during Spotify transfer.';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
  
  export async function getUserPlaylists(accessToken: string) {
    const res = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  
    if (!res.ok) {
      throw new Error(`Failed to fetch playlists: ${res.status}`);
    }
  
    const data = await res.json();
    return data.items; // an array of playlists
  }
  
  export async function getPlaylistTracks(accessToken: string, playlistId: string) {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  
    if (!res.ok) {
      throw new Error(`Failed to fetch tracks: ${res.status}`);
    }
  
    const data = await res.json();
  
    return data.items.map((item: SpotifyApiTrackItem) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists[0]?.name,
      albumArt: item.track.album?.images[0]?.url || '',
    }));
  }
  