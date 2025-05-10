import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const scope = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-email'
  ].join(' ');

  const spotifyAuthUrl = new URL('https://accounts.spotify.com/authorize');
  spotifyAuthUrl.searchParams.set('response_type', 'code');
  spotifyAuthUrl.searchParams.set('client_id', clientId);
  spotifyAuthUrl.searchParams.set('scope', scope);
  spotifyAuthUrl.searchParams.set('redirect_uri', redirectUri);
  spotifyAuthUrl.searchParams.set('show_dialog', 'true');

  return NextResponse.redirect(spotifyAuthUrl.toString());
}
