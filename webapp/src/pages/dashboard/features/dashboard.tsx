import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardOverview } from '../ui/dashboard-overview';
import { mockApi, mockUsers, currentUser } from '@/lib/mock-data';
import { useRouter } from '@/components/layout/router';

export function DashboardFeature() {
  const { navigate } = useRouter();

  // Fetch servers
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: mockApi.getServers,
  });

  // Fetch direct messages
  const { data: directMessages = [], isLoading: dmLoading } = useQuery({
    queryKey: ['direct-messages'],
    queryFn: mockApi.getDirectMessages,
  });

  // Mock recent activity data
  const recentActivity = [
    {
      user: mockUsers[1],
      action: 'sent a message in',
      channel: 'general',
      server: 'Rust Community',
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      user: mockUsers[2],
      action: 'joined',
      channel: 'help',
      server: 'Rust Community',
      timestamp: '2024-01-15T10:25:00Z',
    },
    {
      user: mockUsers[3],
      action: 'shared a file in',
      channel: 'showcase',
      server: 'Rust Community',
      timestamp: '2024-01-15T10:20:00Z',
    },
    {
      user: mockUsers[4],
      action: 'started a voice chat in',
      channel: 'voice-lobby',
      server: 'Gaming Hub',
      timestamp: '2024-01-15T10:15:00Z',
    },
    {
      user: mockUsers[0],
      action: 'created a new channel',
      channel: 'design-feedback',
      server: 'Design Team',
      timestamp: '2024-01-15T10:10:00Z',
    },
  ];

  const handleServerClick = (serverId: string) => {
    navigate(`/servers/${serverId}`);
  };

  const handleDmClick = (dmId: string) => {
    navigate(`/dm/${dmId}`);
  };

  const handleCreateServer = () => {
    navigate('/servers/create');
  };

  if (serversLoading || dmLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <DashboardOverview
      servers={servers}
      directMessages={directMessages}
      recentActivity={recentActivity}
      onServerClick={handleServerClick}
      onDmClick={handleDmClick}
      onCreateServer={handleCreateServer}
    />
  );
}
