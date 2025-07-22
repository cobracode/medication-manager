
'use client';

import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MedicationDashboard from '../components/MedicationDashboard';

export default function Home() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const signOutRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_LOGOUT_URI || "";
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const url = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    auth.signoutRedirect();
    // window.location.href = url;
    router.replace(url);
    console.log("redirecting to", url);
  };
  
  useEffect(() => {
    // Get the OIDC code and state from query parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      // Handle OIDC callback

      // Remove the URL parameters from the address bar
      const params = new URLSearchParams(searchParams)
      params.delete('code');
      params.delete('state');
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams]);

  if (auth.isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">{auth.error.message}</p>
          <button 
            onClick={() => auth.clearStaleState()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Clear and Retry
          </button>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <MedicationDashboard user={auth.user || null} onSignOut={() => signOutRedirect()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Medication Manager
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Track medication schedules for your care recipients
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <button
              onClick={() => auth.signinRedirect()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In with Cognito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
