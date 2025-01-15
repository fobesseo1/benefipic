import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // 모든 경로에서 인앱 브라우저 체크
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const referrer = request.headers.get('referer')?.toLowerCase() || '';

  const isInAppBrowser =
    referrer.includes('instagram.com') ||
    referrer.includes('threads.net') ||
    userAgent.includes('instagram') ||
    userAgent.includes('threads');

  // 인앱 브라우저에서 접속 시 새 창에서 열기
  if (isInAppBrowser && !request.cookies.get('external_browser')) {
    const response = NextResponse.redirect('https://benefipic.vercel.app', {
      status: 303, // Force new window/tab
    });
    response.headers.set('X-Frame-Options', 'DENY');
    response.cookies.set('external_browser', 'true', {
      maxAge: 300, // 5분
      sameSite: 'lax',
    });
    return response;
  }

  // 기존 Supabase 인증 로직
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  await supabase.auth.getSession();

  return response;
}

// 모든 경로에 대해 미들웨어 적용
export const config = {
  matcher: '/:path*',
};
