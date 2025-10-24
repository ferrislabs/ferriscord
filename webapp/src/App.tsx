import { useState, useEffect } from 'react';
import { useOidc } from "@axa-fr/react-oidc";
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Main App component
export default function App() {
  const { isAuthenticated, login } = useOidc();
  const [useOidcAuth] = useState(false);

  // You can toggle between OIDC and mock authentication
  useEffect(() => {
    // Uncomment the following lines to use OIDC authentication instead of mock
    // if (!isAuthenticated) {
    //   login('/');
    // }
    // setUseOidcAuth(true);
  }, [isAuthenticated, login]);

  if (useOidcAuth) {
    // OIDC Authentication flow
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Ferriscord!
            </h1>
            <p className="text-gray-600 mb-6">
              Please wait while we authenticate you...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      );
    }
  }

  // Mock Authentication flow with TanStack Router
  return <RouterProvider router={router} />;
}
