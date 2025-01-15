import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // 이전 리다이렉트 여부 확인
  const hasRedirected = request.cookies.get('redirected')?.value === 'true';

  if (!hasRedirected) {
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

    // 인앱 브라우저 감지를 위한 조건 확장
    const isInAppBrowser =
      userAgent.includes('instagram') ||
      userAgent.includes('i.') ||
      userAgent.includes('t.') ||
      userAgent.includes('threads');

    if (request.nextUrl.pathname === '/auth' && isInAppBrowser) {
      const response = NextResponse.redirect('https://benefipic.vercel.app/auth');
      // 리다이렉트 발생 표시
      response.cookies.set('redirected', 'true', {
        maxAge: 60, // 1분 후 쿠키 만료
        sameSite: 'strict',
      });
      return response;
    }
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

export const config = {
  matcher: ['/auth'],
};
