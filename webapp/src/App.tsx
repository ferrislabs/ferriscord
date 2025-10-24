import { useState, useEffect } from 'react';
import { useOidc } from "@axa-fr/react-oidc";
import { Router, useRouter, matchRoute } from './components/layout/router';
import { AppLayout } from './components/layout/app-layout';
import { LoginFeature } from './pages/auth/features/login';
import { DashboardFeature } from './pages/dashboard/features/dashboard';
import { ServersFeature } from './pages/servers/features/servers';
import { ChatRoomFeature } from './pages/chat/features/chat-room';
import { mockStorage, currentUser } from './lib/mock-data';

// Simple page components for different routes
function LoginPage() {
  const { navigate } = useRouter();

  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LoginFeature onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

function DashboardPage() {
  return (
    <AppLayout>
      <DashboardFeature />
    </AppLayout>
  );
}

function ServersPage() {
  return (
    <AppLayout>
      <ServersFeature />
    </AppLayout>
  );
}

function ServerDetailPage() {
  const { currentRoute } = useRouter();

  // Extract server ID from route
  const match = matchRoute('/servers/:serverId', currentRoute);

  return (
    <AppLayout>
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Server: {match.params.serverId || 'server-1'}
          </h2>
          <p className="text-gray-600 mb-6">
            Select a channel from the sidebar to start chatting
          </p>
          <div className="text-sm text-gray-500">
            Use the channel list on the left to navigate to specific channels
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChannelPage() {
  const { currentRoute } = useRouter();

  // Extract IDs from route
  const match = matchRoute('/servers/:serverId/channels/:channelId', currentRoute);
  const channelId = match.params.channelId || 'channel-1';

  return (
    <AppLayout>
      <ChatRoomFeature
        channelId={channelId}
        currentUserId={currentUser.id}
      />
    </AppLayout>
  );
}

function DirectMessagePage() {
  const { currentRoute } = useRouter();

  // Extract DM ID from route
  const match = matchRoute('/dm/:dmId', currentRoute);
  const dmId = match.params.dmId || 'dm-1';

  return (
    <AppLayout>
      <ChatRoomFeature
        channelId={dmId}
        currentUserId={currentUser.id}
      />
    </AppLayout>
  );
}

function UserProfilePage() {
  const { currentRoute } = useRouter();

  // Extract user ID from route
  const match = matchRoute('/users/:userId', currentRoute);
  const userId = match.params.userId || currentUser.id;

  return (
    <AppLayout>
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            User Profile: {userId}
          </h2>
          <p className="text-gray-600">
            User profile page would go here
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsPage() {
  return (
    <AppLayout>
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Settings
          </h2>
          <p className="text-gray-600">
            Settings page would go here
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function NotFoundPage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// Main router component
function AppRouter() {
  const { currentRoute } = useRouter();

  // Route matching logic
  if (currentRoute === '/' || currentRoute === '/dashboard') {
    return <DashboardPage />;
  }

  if (currentRoute === '/login') {
    return <LoginPage />;
  }

  if (currentRoute === '/servers') {
    return <ServersPage />;
  }

  if (matchRoute('/servers/:serverId/channels/:channelId', currentRoute).match) {
    return <ChannelPage />;
  }

  if (matchRoute('/servers/:serverId', currentRoute).match) {
    return <ServerDetailPage />;
  }

  if (matchRoute('/dm/:dmId', currentRoute).match) {
    return <DirectMessagePage />;
  }

  if (matchRoute('/users/:userId', currentRoute).match) {
    return <UserProfilePage />;
  }

  if (currentRoute === '/settings') {
    return <SettingsPage />;
  }

  return <NotFoundPage />;
}

// Authentication wrapper
function AuthenticatedApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = mockStorage.getAuthToken();
    const user = mockStorage.getUser();

    if (token && user) {
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const { currentRoute } = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated and not on login page, show login
  if (!isAuthenticated && currentRoute !== '/login') {
    return <LoginPage />;
  }

  // If authenticated and on login page, redirect to dashboard
  if (isAuthenticated && currentRoute === '/login') {
    window.history.replaceState({}, '', '/dashboard');
    return <DashboardPage />;
  }

  return <AppRouter />;
}

// Main App component
export default function App() {
  const { isAuthenticated, login } = useOidc();
  const [useOidcAuth] = useState(true);

  // You can toggle between OIDC and mock authentication
  useEffect(() => {

    if (!isAuthenticated) {
      login('/');
    }
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

    return (
      <Router defaultRoute="/dashboard">
        <AppRouter />
      </Router>
    );
  }

  // Mock Authentication flow
  return (
    <Router defaultRoute="/dashboard">
      <AuthenticatedApp />
    </Router>
  );
}
