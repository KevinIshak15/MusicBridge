import { NextResponse } from 'next/server';

export async function GET() {
  const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_SITE_URL);
  redirectUrl.searchParams.set('forceAppleLogin', 'true');

  return NextResponse.redirect(redirectUrl.toString());
}
