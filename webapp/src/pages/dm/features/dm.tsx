import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { mockApi } from '@/lib/mock-data';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getStatusColor } from '@/lib/utils';
import {
  Users,
  MessageCircle,
  Plus,
  Search,
  MoreHorizontal,
  Phone,
  Video,
  UserPlus,

  Crown
} from 'lucide-react';

type TabType = 'online' | 'all' | 'pending' | 'blocked';

export function DMFeature() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('online');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch DM conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['dm-conversations'],
    queryFn: mockApi.getDMConversations,
  });

  // Fetch friends list
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: mockApi.getFriends,
  });

  // Filter friends based on active tab
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.username.toLowerCase().includes(searchQuery.toLowerCase());

    switch (activeTab) {
      case 'online':
        return matchesSearch && friend.status === 'online';
      case 'all':
        return matchesSearch;
      case 'pending':
        return matchesSearch && friend.status === 'pending';
      case 'blocked':
        return matchesSearch && friend.status === 'blocked';
      default:
        return matchesSearch;
    }
  });

  const handleDMClick = (userId: string) => {
    navigate({ to: '/channels/$userId', params: { userId } });
  };

  const handleStartCall = (friendId: string, type: 'voice' | 'video') => {
    console.log(`Starting ${type} call with friend:`, friendId);
    // In a real app, this would initiate a call
  };

  const tabs = [
    { id: 'online' as const, label: 'Online', count: friends.filter(f => f.status === 'online').length },
    { id: 'all' as const, label: 'All', count: friends.length },
    { id: 'pending' as const, label: 'Pending', count: friends.filter(f => f.status === 'pending').length },
    { id: 'blocked' as const, label: 'Blocked', count: friends.filter(f => f.status === 'blocked').length },
  ];

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - DM List */}
      <div className="w-60 bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-700 px-4 flex items-center">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-white">Direct Messages</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 text-gray-400 hover:text-white">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* DM Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Friends shortcut */}
            <div className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-700/50 cursor-pointer text-gray-300 hover:text-gray-100">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">Friends</span>
            </div>

            {/* DM Conversations */}
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleDMClick(conversation.participant.id)}
                className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700/50 cursor-pointer group"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversation.participant.avatar} alt={conversation.participant.username} />
                    <AvatarFallback className="bg-gray-500 text-white text-xs">
                      {conversation.participant.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800",
                    getStatusColor(conversation.participant.status as "online" | "away" | "busy" | "offline")
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-300 truncate">
                    {conversation.participant.username}
                  </div>
                  {conversation.lastMessage && (
                    <div className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage.content}
                    </div>
                  )}
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Friends List */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Users className="h-5 w-5 text-gray-500" />
            <h1 className="text-base font-semibold text-gray-700">Friends</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.id
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Friends List */}
        <ScrollArea className="flex-1 bg-white">
          <div className="p-6">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No friends found' : `No ${activeTab} friends`}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : `You don't have any ${activeTab} friends right now.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar} alt={friend.username} />
                          <AvatarFallback className="bg-gray-500 text-white">
                            {friend.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                          getStatusColor(friend.status as "online" | "away" | "busy" | "offline")
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{friend.username}</span>
                          {friend.isBot && (
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded">
                              BOT
                            </span>
                          )}
                          {friend.isPremium && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {friend.status === 'online' && friend.activity
                            ? friend.activity
                            : friend.status
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDMClick(friend.id)}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                        title="Send Message"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartCall(friend.id, 'voice')}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                        title="Voice Call"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartCall(friend.id, 'video')}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                        title="Video Call"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-700"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
