import { Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Hash, Search, Bell, UserCircle, Users } from 'lucide-react';
import type { Channel, Server, Member, BaseUser } from './types';

interface TopBarProps {
  selectedServer?: Server | null;
  channels?: Channel[];
  isDMView?: boolean;
  isDMHome?: boolean;
  isDMConversation?: boolean;
  dmUsers?: Member[];
  currentUser?: BaseUser | null;
  onToggleCollapse?: () => void;
}

export function TopBar({
  selectedServer,
  channels = [],
  isDMView = false,
  isDMHome = false,
  isDMConversation = false,
  dmUsers = [],
  currentUser,
  onToggleCollapse,
}: TopBarProps) {
  const params = useParams({ strict: false });

  const currentChannel = channels.find((c) => c.id === params.channelId);
  const currentDMUser = dmUsers.find((u) => u.id === params.userId);

  return (
    <div className="justify-between">
      <div className="flex items-center space-x-4 min-w-0">
        {/* Toggle button - only show for server channels */}
        {!isDMView && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700 shrink-0"
          >
            <Hash className="h-5 w-5" />
          </Button>
        )}

        {params.channelId && selectedServer && !isDMView ? (
          // Channel view - show channel info
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-gray-400 text-xl font-semibold">
                {currentChannel?.type === 'voice' ? '🔊' : '#'}
              </span>
              <h1 className="text-base font-semibold text-gray-700 truncate">
                {currentChannel?.name}
              </h1>
            </div>
            {currentChannel?.description && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-2" />
                <p className="text-sm text-gray-500 truncate max-w-xs">
                  {currentChannel.description}
                </p>
              </>
            )}
          </div>
        ) : isDMConversation ? (
          // DM conversation - show user info
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-gray-400 text-xl font-semibold">@</span>
              <h1 className="text-base font-semibold text-gray-700 truncate">
                {currentDMUser?.username || 'Unknown User'}
              </h1>
            </div>
          </div>
        ) : isDMHome ? (
          // DM home - show friends title
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h1 className="text-base font-semibold text-gray-700">Friends</h1>
          </div>
        ) : selectedServer ? (
          // Server view - show server name
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{selectedServer.name}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center space-x-4 shrink-0">
        {params.channelId && !isDMView && currentChannel?.memberCount && (
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span className="text-gray-400">👥</span>
            <span>{currentChannel.memberCount}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
          </Button>
          <Link to="/users/$userId" params={{ userId: currentUser?.id || 'unknown' }}>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <UserCircle className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
