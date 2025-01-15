import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // URL에서 리다이렉션 카운트 파라미터 확인
  const redirectCount = Number(request.nextUrl.searchParams.get('rc')) || 0;

  // 리다이렉션 횟수가 1회를 초과하면 더 이상 리다이렉트하지 않음
  if (redirectCount > 1) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  const isInAppBrowser =
    userAgent.includes('instagram') ||
    userAgent.includes('threads') ||
    /instagram|threads|\.threads\.net/i.test(userAgent);

  if (request.nextUrl.pathname === '/auth' && isInAppBrowser) {
    // 리다이렉트할 URL 생성
    const redirectUrl = new URL('https://benefipic.vercel.app/auth');
    redirectUrl.searchParams.set('rc', String(redirectCount + 1));

    return NextResponse.redirect(redirectUrl);
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
