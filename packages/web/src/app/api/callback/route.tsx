import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // For react-oidc-context, we just need to redirect to complete the signin
  // The library handles the token exchange automatically
  const redirectUrl = new URL('/', request.url);
  
  // Preserve the code and state for the OIDC library to process
  if (code) redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);

  return NextResponse.redirect(redirectUrl);
}
