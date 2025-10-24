import React, { createContext, useContext, useState, useEffect } from 'react';

// Simple router context
interface RouterContextType {
  currentRoute: string;
  navigate: (route: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a Router');
  }
  return context;
}

interface RouterProps {
  children: React.ReactNode;
  defaultRoute?: string;
}

export function Router({ children, defaultRoute = '/' }: RouterProps) {
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname || defaultRoute;
  });
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);

    // Parse params from route
    const urlParams = new URLSearchParams(window.location.search);
    const parsedParams: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      parsedParams[key] = value;
    });
    setParams(parsedParams);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

interface RouteProps {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
}

export function Route({ path, component: Component, exact = false }: RouteProps) {
  const { currentRoute } = useRouter();

  const isMatch = exact
    ? currentRoute === path
    : currentRoute.startsWith(path);

  if (!isMatch) {
    return null;
  }

  return <Component />;
}

interface LinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Link({ to, children, className, onClick }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
    onClick?.();
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// Route matching utility
export function matchRoute(pattern: string, path: string): { match: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { match: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // Dynamic parameter
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      // Static part doesn't match
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

// Routes configuration
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CHAT: '/chat/:channelId',
  SERVERS: '/servers',
  SERVER_DETAIL: '/servers/:serverId',
  CHANNEL: '/servers/:serverId/channels/:channelId',
  DIRECT_MESSAGE: '/dm/:userId',
  USER_PROFILE: '/users/:userId',
  SETTINGS: '/settings',
} as const;
