import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { DashboardOverview } from '../ui/dashboard-overview';
import { mockApi, mockUsers } from '@/lib/mock-data';

export function DashboardFeature() {
  const navigate = useNavigate();

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

  const handleServerClick = async (serverId: string) => {
    // Navigate to first channel of the selected server
    const channels = await mockApi.getChannels(serverId);
    const firstChannel = channels.find(c => c.type === 'text') || channels[0];
    if (firstChannel) {
      navigate({
        to: '/channels/$serverId/$channelId',
        params: { serverId, channelId: firstChannel.id }
      });
    }
  };

  const handleDmClick = (dmId: string) => {
    navigate({ to: '/dm/$dmId', params: { dmId } });
  };

  const handleCreateServer = () => {
    navigate({ to: '/discovery/servers' });
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
