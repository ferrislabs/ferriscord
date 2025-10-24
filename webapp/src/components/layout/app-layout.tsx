import React, { useState, useEffect } from 'react';
import { useRouter, Link } from './router';
import { mockApi, mockStorage, User, Server, Channel, currentUser } from '@/lib/mock-data';
import { cn, getStatusColor, getChannelIcon } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import {
  Hash,
  Volume2,
  Settings,
  Plus,
  Users,
  Bell,
  Search,
  MoreHorizontal,
  LogOut,
  UserCircle
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentRoute, navigate } = useRouter();
  const [selectedServerId, setSelectedServerId] = useState<string>('server-1');
  const [user, setUser] = useState<User>(currentUser);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const handleLogout = () => {
    mockStorage.removeAuthToken();
    mockStorage.removeUser();
    navigate('/login');
  };

  const selectedServer = servers.find(s => s.id === selectedServerId);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Server Sidebar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-3 space-y-2">
        {/* Home/DM Button */}
        <Link to="/dashboard">
          <div className={cn(
            "w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg hover:bg-indigo-500 transition-colors cursor-pointer",
            currentRoute === '/dashboard' && "bg-indigo-500"
          )}>
            F
          </div>
        </Link>

        <div className="w-8 h-px bg-gray-700 my-2" />

        {/* Server List */}
        <ScrollArea className="flex-1 w-full">
          <div className="space-y-2 px-2">
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => {
                  setSelectedServerId(server.id);
                  navigate(`/servers/${server.id}`);
                }}
                className={cn(
                  "w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition-colors cursor-pointer text-lg",
                  selectedServerId === server.id && "bg-indigo-600 hover:bg-indigo-500"
                )}
                title={server.name}
              >
                {server.icon || server.name[0]}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Add Server Button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-gray-700 hover:bg-green-600 text-white"
          title="Add Server"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Channel Sidebar */}
      {selectedServer && (
        <div className={cn(
          "bg-gray-800 text-gray-100 flex flex-col transition-all duration-300",
          isCollapsed ? "w-0 overflow-hidden" : "w-64"
        )}>
          {/* Server Header */}
          <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4">
            <h1 className="font-semibold text-white truncate">{selectedServer.name}</h1>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Channel List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* Text Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Text Channels
                  </span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400 hover:text-white">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {channels
                  .filter(channel => channel.type === 'text')
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/servers/${selectedServerId}/channels/${channel.id}`}
                    >
                      <div className={cn(
                        "flex items-center px-2 py-1 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-700 cursor-pointer",
                        currentRoute.includes(channel.id) && "bg-gray-700 text-gray-100"
                      )}>
                        <Hash className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate">{channel.name}</span>
                      </div>
                    </Link>
                  ))}
              </div>

              {/* Voice Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Voice Channels
                  </span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400 hover:text-white">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {channels
                  .filter(channel => channel.type === 'voice')
                  .map((channel) => (
                    <Link
                      key={channel.id}
                      to={`/servers/${selectedServerId}/channels/${channel.id}`}
                    >
                      <div className={cn(
                        "flex items-center px-2 py-1 rounded text-gray-400 hover:text-gray-100 hover:bg-gray-700 cursor-pointer",
                        currentRoute.includes(channel.id) && "bg-gray-700 text-gray-100"
                      )}>
                        <Volume2 className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate">{channel.name}</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </ScrollArea>

          {/* User Panel */}
          <div className="h-16 bg-gray-900 flex items-center justify-between px-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900",
                  getStatusColor(user.status)
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.username}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {user.status}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Hash className="h-5 w-5" />
            </Button>

            {selectedServer && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {selectedServer.name}
                </span>
                {currentRoute.includes('/channels/') && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600">
                      {channels.find(c => currentRoute.includes(c.id))?.name}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
              <Bell className="h-5 w-5" />
            </Button>
            <Link to={`/users/${user.id}`}>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <UserCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Member List (conditionally shown) */}
      {selectedServer && currentRoute.includes('/channels/') && (
        <div className="w-60 bg-gray-100 border-l border-gray-200">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Members — {members.length}
            </h3>
            <ScrollArea className="space-y-2">
              {members.map((member) => (
                <Link key={member.id} to={`/users/${member.id}`}>
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
