import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

export default async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return null;
  }

  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // Role-based access control
  if (token.role === 'employee') {
    if (req.nextUrl.pathname.startsWith('/employees') ||
        req.nextUrl.pathname.startsWith('/pending-expenses') ||
        req.nextUrl.pathname.startsWith('/signed-expenses')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  if (token.role === 'manager') {
    if (req.nextUrl.pathname.startsWith('/signed-expenses')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return null;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employees/:path*',
    '/submit-expense/:path*',
    '/pending-expenses/:path*',
    '/signed-expenses/:path*',
    '/login',
  ],
};
