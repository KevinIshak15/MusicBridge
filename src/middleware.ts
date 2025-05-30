import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If the user is trying to access the root path '/'
  if (request.nextUrl.pathname === '/') {
    // Redirect them to the home page
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Continue to the requested page for other paths
  return NextResponse.next();
}

// Configure the paths the middleware should apply to
export const config = {
  matcher: [
    '/', // Apply middleware to the root path
    // Add other paths here if you need middleware logic for them later
  ],
}; 