import { useOidc, useOidcUser } from "@axa-fr/react-oidc";
import { useMemo } from "react";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "busy" | "offline";
  isBot?: boolean;
  joinedAt: string;
}

export function useAuth() {
  const { isAuthenticated, login, logout } = useOidc();
  const { oidcUser } = useOidcUser();

  // Transform OIDC user to our app user format
  const user = useMemo((): AuthUser | null => {
    if (!isAuthenticated || !oidcUser) {
      return null;
    }

    return {
      id: oidcUser.sub || "unknown",
      username: oidcUser.preferred_username || oidcUser.name || "Unknown User",
      email: oidcUser.email || "no-email@example.com",
      avatar: oidcUser.picture,
      status: "online" as const,
      isBot: false,
      joinedAt: new Date().toISOString(),
    };
  }, [isAuthenticated, oidcUser]);

  const signIn = () => {
    login("/");
  };

  const signOut = () => {
    logout("/");
  };

  return {
    user,
    isAuthenticated,
    isLoading: false, // v7 doesn't expose loading state directly
    signIn,
    signOut,
    rawOidcUser: oidcUser,
  };
}

export default useAuth;
