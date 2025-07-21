'use client';

// import dynamic from 'next/dynamic'
import { AuthProvider } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';

const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_COGNITO_ISSUER!, // e.g., https://cognito-idp.region.amazonaws.com/userPoolId
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/api/callback',
  response_type: 'code',
  scope: 'openid profile email',
  // userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  silent_redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/silent-callback',
};

// const ClientOnlyAuthProvider = dynamic(
//   () => Promise.resolve(AuthProvider),
//   { ssr: false }
// );

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider {...oidcConfig}>
      {children}
    </AuthProvider>
  );
}