import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ServerList } from '../ui/server-list';
import { mockApi } from '@/lib/mock-data';
import { useRouter } from '@/components/layout/router';

export function ServersFeature() {
  const { navigate } = useRouter();

  // Fetch servers
  const { data: servers = [], isLoading, error } = useQuery({
    queryKey: ['servers'],
    queryFn: mockApi.getServers,
  });

  const handleServerSelect = (serverId: string) => {
    navigate(`/servers/${serverId}`);
  };

  const handleCreateServer = () => {
    // In a real app, this would open a create server modal/form
    console.log('Creating new server...');
    // For now, just navigate to first available channel of first server
    if (servers.length > 0) {
      navigate(`/servers/${servers[0].id}`);
    }
  };

  const handleJoinServer = () => {
    // In a real app, this would open a join server modal/form
    console.log('Joining server...');
    // For now, just navigate to first available server
    if (servers.length > 0) {
      navigate(`/servers/${servers[0].id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Failed to load servers. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      <div className="h-full overflow-auto p-6">
        <ServerList
          servers={servers}
          onServerSelect={handleServerSelect}
          onCreateServer={handleCreateServer}
          onJoinServer={handleJoinServer}
        />
      </div>
    </div>
  );
}
