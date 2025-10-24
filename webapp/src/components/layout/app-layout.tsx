import React, { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { mockApi, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/hooks/use-auth';
import { cn, getStatusColor } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import {
  Hash,
  Volume2,
  Settings,
  Plus,
  Bell,
  Search,
  MoreHorizontal,
  LogOut,
  UserCircle,
  Users
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  const { user, signOut } = useAuth();
  const selectedServerId = params.serverId || 'server-1';
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if we're in different DM states
  const isDMHome = window.location.pathname === '/channels/@me';
  const isDMConversation = window.location.pathname.startsWith('/channels/') && params.userId;
  const isDMView = isDMHome || isDMConversation;

  // Fetch servers
  const { data: servers = [] } = useQuery({
    queryKey: ['servers'],
    queryFn: mockApi.getServers,
  });

  // Fetch channels for selected server
  const { data: channels = [] } = useQuery({
    queryKey: ['channels', selectedServerId],
    queryFn: () => mockApi.getChannels(selectedServerId),
    enabled: !!selectedServerId,
  });

  // Fetch server members
  const { data: members = [] } = useQuery({
    queryKey: ['server-members', selectedServerId],
    queryFn: () => mockApi.getServerMembers(selectedServerId),
    enabled: !!selectedServerId,
  });

  const selectedServer = servers.find(s => s.id === selectedServerId);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/' });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Server Sidebar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-3 space-y-2">
        {/* Direct Messages Button */}
        <Link to="/channels/@me">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-indigo-700 transition-colors cursor-pointer">
            @
          </div>
        </Link>

        <div className="w-8 h-px bg-gray-600"></div>

        {/* Server Icons */}
        {servers.map((server) => {
          const handleServerClick = async () => {
            // Auto-navigate to first channel when clicking server
            const channels = await mockApi.getChannels(server.id);
            const firstChannel = channels.find(c => c.type === 'text') || channels[0];
            if (firstChannel) {
              navigate({
                to: '/channels/$serverId/$channelId',
                params: { serverId: server.id, channelId: firstChannel.id }
              });
            }
          };

          return (
            <div
              key={server.id}
              onClick={handleServerClick}
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold transition-all cursor-pointer",
                selectedServerId === server.id
                  ? "bg-indigo-600"
                  : "bg-gray-700 hover:bg-gray-600 hover:rounded-xl"
              )}
            >
              {server.icon || server.name[0]}
            </div>
          );
        })}

        {/* Server Discovery Button */}
        <Link to="/discovery/servers">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-green-600 transition-all cursor-pointer group">
            <Plus className="h-6 w-6" />
          </div>
        </Link>
      </div>

      {/* Channel Sidebar - Only show for server channels */}
      {selectedServer && !isDMView && (
        <div className={cn(
          "bg-gray-800 flex flex-col transition-all duration-200",
          isCollapsed ? "w-16" : "w-60"
        )}>
          {/* Server Header */}
          <div className="h-16 border-b border-gray-700 px-4 flex items-center justify-between">
            <h1 className={cn(
              "font-semibold text-white truncate transition-opacity",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}>
              {selectedServer.name}
            </h1>
            {!isCollapsed && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Channels */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  to="/channels/$serverId/$channelId"
                  params={{ serverId: selectedServerId, channelId: channel.id }}
                >
                  <div className={cn(
                    "flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-700/50 cursor-pointer group transition-colors",
                    params.channelId === channel.id ? "bg-gray-700 text-white" : "text-gray-300 hover:text-gray-100"
                  )}>
                    {channel.type === 'voice' ? (
                      <Volume2 className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Hash className="h-4 w-4 text-gray-400" />
                    )}
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {channel.name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>

          {/* User Panel */}
          <div className="h-14 bg-gray-900/50 border-t border-gray-700 px-2 flex items-center">
            <div className="flex items-center flex-1 space-x-2">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs">
                    {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900",
                  getStatusColor(user?.status || 'offline')
                )} />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.username || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {user?.status || 'offline'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DM Sidebar - Show when in DM conversation */}
      {isDMConversation && (
        <div className="w-60 bg-gray-800 flex flex-col">
          {/* DM Header */}
          <div className="h-16 border-b border-gray-700 px-4 flex items-center justify-between">
            <h1 className="font-semibold text-white truncate">
              Direct Messages
            </h1>
          </div>

          {/* DM List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* Friends shortcut */}
              <Link to="/channels/@me">
                <div className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-700/50 cursor-pointer text-gray-300 hover:text-gray-100">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">Friends</span>
                </div>
              </Link>

              {/* Recent DM conversations */}
              {mockUsers.filter(u => u.id !== user?.id).slice(0, 5).map((dmUser) => (
                <Link
                  key={dmUser.id}
                  to="/channels/$userId"
                  params={{ userId: dmUser.id }}
                >
                  <div className={cn(
                    "flex items-center space-x-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer group",
                    params.userId === dmUser.id ? "bg-gray-700 text-white" : "text-gray-300 hover:text-gray-100"
                  )}>
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={dmUser.avatar} alt={dmUser.username} />
                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                          {dmUser.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800",
                        getStatusColor(dmUser.status)
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {dmUser.username}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {dmUser.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>

          {/* User Panel - Same as server sidebar */}
          <div className="h-14 bg-gray-900/50 border-t border-gray-700 px-2 flex items-center">
            <div className="flex items-center flex-1 space-x-2">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs">
                    {user?.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900",
                  getStatusColor(user?.status || 'offline')
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user?.username || 'Unknown User'}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {user?.status || 'offline'}
                </div>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            {/* Toggle button - only show for server channels */}
            {!isDMView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Hash className="h-5 w-5" />
              </Button>
            )}

            {params.channelId && selectedServer && !isDMView ? (
              // Channel view - show channel info
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xl font-semibold">
                    {channels.find(c => c.id === params.channelId)?.type === 'voice' ? '🔊' : '#'}
                  </span>
                  <h1 className="text-base font-semibold text-gray-700 truncate">
                    {channels.find(c => c.id === params.channelId)?.name}
                  </h1>
                </div>
                {channels.find(c => c.id === params.channelId)?.description && (
                  <>
                    <div className="w-px h-4 bg-gray-300 mx-2" />
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {channels.find(c => c.id === params.channelId)?.description}
                    </p>
                  </>
                )}
              </div>
            ) : isDMConversation ? (
              // DM conversation - show user info
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-xl font-semibold">@</span>
                  <h1 className="text-base font-semibold text-gray-700 truncate">
                    {mockUsers.find(u => u.id === params.userId)?.username || 'Unknown User'}
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
                <span className="font-semibold text-gray-900">
                  {selectedServer.name}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center space-x-4">
            {params.channelId && !isDMView && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <span className="text-gray-400">👥</span>
                <span>{channels.find(c => c.id === params.channelId)?.memberCount || 0}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
              </Button>
              <Link to="/users/$userId" params={{ userId: user?.id || 'unknown' }}>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Member List - Hide when in DM view */}
      {selectedServer && params.channelId && !isDMView && (
        <div className="w-60 bg-gray-100 border-l border-gray-200">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Members — {members.length}
            </h3>
            <ScrollArea className="space-y-2">
              {members.map((member) => (
                <Link key={member.id} to="/users/$userId" params={{ userId: member.id }}>
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200 cursor-pointer">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.username} />
                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                          {member.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-100",
                        getStatusColor(member.status)
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-medium truncate",
                        member.status === 'online' ? "text-gray-900" : "text-gray-500"
                      )}>
                        {member.username}
                        {member.isBot && (
                          <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 px-1 rounded">
                            BOT
                          </span>
                        )}
                      </div>
                      {member.status !== 'offline' && (
                        <div className="text-xs text-gray-400 capitalize">
                          {member.status}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
