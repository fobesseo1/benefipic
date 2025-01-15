import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // 인앱 브라우저 체크
  const userAgent = request.headers.get('user-agent') || '';
  const isInAppBrowser = userAgent.includes('instagram') || userAgent.includes('threads');

  // auth 페이지에서 인앱 브라우저 감지된 경우
  if (request.nextUrl.pathname === '/auth' && isInAppBrowser) {
    return NextResponse.redirect('https://benefipic.vercel.app/auth');
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

// auth 페이지에만 적용
export const config = {
  matcher: ['/auth'],
};
