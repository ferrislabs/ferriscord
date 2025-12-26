import { useOidc } from '@axa-fr/react-oidc';
import { useEffect } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, login } = useOidc();

  useEffect(() => {
    if (!isAuthenticated) {
      login('/');
    }
  }, [isAuthenticated, login]);

  // If not authenticated, return null (will redirect to Keycloak)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render the app
  return <>
    {children}
  </>;
}
