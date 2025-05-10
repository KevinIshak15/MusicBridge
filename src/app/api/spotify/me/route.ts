// // src/app/api/spotify/me/route.ts
// import { NextResponse } from 'next/server';

// export async function GET(req: Request) {
//   const token = req.headers.get('cookie')?.match(/spotify_access_token=([^;]+)/)?.[1];

//   if (!token) {
//     return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
//   }

//   const res = await fetch('https://api.spotify.com/v1/me', {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!res.ok) {
//     return NextResponse.json({ error: 'Failed to fetch Spotify user' }, { status: res.status });
//   }

//   const data = await res.json();
//   return NextResponse.json(data);
// }

// /api/spotify/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('spotify_access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json({ error: `Spotify API error: ${res.status}`, details: errorBody }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Unknown error', details: String(err) }, { status: 500 });
  }
}

