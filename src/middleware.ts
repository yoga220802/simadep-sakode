import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware untuk menangani pengalihan (redirect).
 */
export function middleware(request: NextRequest) {
    // Cek apakah path yang diakses adalah halaman utama ('/')
    if (request.nextUrl.pathname === '/') {
        // Jika ya, arahkan pengguna langsung ke halaman '/login'.
        // Ini memastikan bahwa halaman utama aplikasi adalah halaman login.
        return NextResponse.redirect(new URL('/login', request.url))
    }
}

// Konfigurasi Matcher
export const config = {
    matcher: '/',
}
