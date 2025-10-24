
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime, getStatusColor } from "@/lib/utils";
import type { Server, DirectMessage } from "@/lib/mock-data";
import {
  MessageSquare,
  Users,
  Server as ServerIcon,
  Clock,
  Hash,
  Plus,
  Bell
} from "lucide-react";

interface DashboardOverviewProps {
  servers: Server[];
  directMessages: DirectMessage[];
  recentActivity: Array<{
    user: { id: string; username: string; avatar?: string; status: string };
    action: string;
    channel: string;
    server: string;
    timestamp: string;
  }>;
  onServerClick: (serverId: string) => void;
  onDmClick: (dmId: string) => void;
  onCreateServer: () => void;
  className?: string;
}

export function DashboardOverview({
  servers,
  directMessages,
  recentActivity,
  onServerClick,
  onDmClick,
  onCreateServer,
  className
}: DashboardOverviewProps) {
  return (
    <div className={cn("h-full bg-gray-50 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back to Ferriscord!
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with your communities and friends
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Your Servers
                </CardTitle>
                <ServerIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Communities you're part of
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Direct Messages
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{directMessages.length}</div>
                <p className="text-xs text-muted-foreground">
                  Private conversations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Online Friends
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Servers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Servers</CardTitle>
                    <CardDescription>
                      Communities and workspaces you're part of
                    </CardDescription>
                  </div>
                  <Button onClick={onCreateServer} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {servers.map((server) => (
                      <div
                        key={server.id}
                        onClick={() => onServerClick(server.id)}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                          {server.icon || server.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {server.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {server.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {server.memberCount} members
                            </Badge>
                            {server.isPublic && (
                              <Badge variant="outline" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Direct Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Direct Messages</CardTitle>
                <CardDescription>
                  Recent private conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {directMessages.map((dm) => {
                      const otherParticipant = dm.participants.find(p => p.id !== 'user-1'); // Assuming current user is user-1

                      return (
                        <div
                          key={dm.id}
                          onClick={() => onDmClick(dm.id)}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.username} />
                              <AvatarFallback className="bg-gray-500 text-white">
                                {otherParticipant?.username?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                              getStatusColor(otherParticipant?.status || 'offline')
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {otherParticipant?.username}
                            </h3>
                            {dm.lastMessage && (
                              <p className="text-sm text-gray-500 truncate">
                                {dm.lastMessage.content}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {dm.lastMessage && formatTime(dm.lastMessage.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                What's been happening in your servers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user?.avatar} alt={activity.user?.username} />
                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                          {activity.user?.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user?.username}</span>
                          {' '}
                          <span className="text-gray-600">{activity.action}</span>
                          {' '}
                          <span className="font-medium">#{activity.channel}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Hash className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{activity.server}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{formatTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col space-y-2" onClick={onCreateServer}>
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Create Server</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Find Friends</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Bell className="h-6 w-6" />
                  <span className="text-sm">Notifications</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-sm">Start Chat</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
