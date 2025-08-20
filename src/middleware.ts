import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token');
    const { pathname } = request.nextUrl;

    // 1. Arahkan dari root ('/') ke '/login'
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Jika pengguna sudah login dan mencoba mengakses /login, arahkan ke dashboard
    if (token && pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 3. Lindungi semua rute di dalam (app), contohnya /dashboard
    // Jika tidak ada token dan pengguna mencoba mengakses rute yang dilindungi,
    // arahkan ke halaman login.
    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/projects'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Jika semua kondisi di atas tidak terpenuhi, lanjutkan request seperti biasa.
    return NextResponse.next();
}

// Konfigurasi Matcher untuk menjalankan middleware pada rute yang relevan.
export const config = {
    matcher: [
        /*
         * Masukan semua path request kecuali untuk:
         * - /api (rute API)
         * - /_next/static (file statis)
         * - /_next/image (optimasi gambar)
         * - /favicon.ico (file favicon)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
