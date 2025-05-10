import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // If there's an error (like user cancelled), redirect back to home
  if (error) {
    return NextResponse.redirect(new URL('/home?error=access_denied', req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/home?error=no_code', req.url));
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    const expiresIn = data.expires_in;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toUTCString();

    // Set the cookie with the access token
    const cookie = `spotify_access_token=${data.access_token}; expires=${expiresAt}; path=/; SameSite=Lax`;

    // Redirect to the home page with the cookie
    return NextResponse.redirect(new URL('/', req.url), {
      headers: {
        'Set-Cookie': cookie,
      },
    });
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    return NextResponse.redirect(new URL('/home?error=token_failed', req.url));
  }
}
