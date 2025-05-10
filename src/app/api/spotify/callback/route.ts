import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.json({ error: tokenData.error_description }, { status: 400 });
  }

  // Manually set the Set-Cookie header
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/`);
  response.headers.set(
    'Set-Cookie',
    `spotify_access_token=${tokenData.access_token}; Path=/; Max-Age=${tokenData.expires_in}; SameSite=Lax`
  );

  return response;
}
