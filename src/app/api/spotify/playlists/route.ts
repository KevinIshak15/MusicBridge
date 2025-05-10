// import { NextRequest, NextResponse } from 'next/server';
// import { getUserPlaylists } from '@/lib/spotify';

// export async function GET(req: NextRequest) {
//   const accessToken = req.nextUrl.searchParams.get('token');

//   if (!accessToken) {
//     return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
//   }

//   try {
//     const playlists = await getUserPlaylists(accessToken);
//     return NextResponse.json({ playlists });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// /api/spotify/playlists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserPlaylists } from '@/lib/spotify';

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 403 });
  }

  try {
    const playlists = await getUserPlaylists(accessToken);
    return NextResponse.json({ playlists });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
