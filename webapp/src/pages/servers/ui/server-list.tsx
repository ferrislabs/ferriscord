import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Server } from "@/lib/mock-data";
import {
  Users,
  Crown,
  Globe,
  Lock,
  Plus,
  Settings,
  MoreVertical
} from "lucide-react";

interface ServerListProps {
  servers: Server[];
  onServerSelect: (serverId: string) => void;
  onCreateServer: () => void;
  onJoinServer: () => void;
  className?: string;
}

export function ServerList({
  servers,
  onServerSelect,
  onCreateServer,
  onJoinServer,
  className
}: ServerListProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Servers</h1>
          <p className="text-gray-600">Manage and explore your communities</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={onJoinServer} variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            Join Server
          </Button>
          <Button onClick={onCreateServer}>
            <Plus className="h-4 w-4 mr-2" />
            Create Server
          </Button>
        </div>
      </div>

      {/* Server Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <Card
            key={server.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onServerSelect(server.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                    {server.icon || server.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-indigo-600 transition-colors">
                      {server.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {server.isPublic ? (
                        <Globe className="h-3 w-3 text-green-500" />
                      ) : (
                        <Lock className="h-3 w-3 text-gray-400" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {server.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle server settings
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {server.description && (
                <CardDescription className="text-sm text-gray-600 line-clamp-2">
                  {server.description}
                </CardDescription>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{server.memberCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Crown className="h-4 w-4" />
                    <span>Owner</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Created {new Date(server.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle server settings
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create Server Card */}
        <Card
          className="border-dashed border-2 border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer group bg-gray-50 hover:bg-gray-100"
          onClick={onCreateServer}
        >
          <CardContent className="flex flex-col items-center justify-center h-full py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                Create a Server
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Start your own community
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Join Server Card */}
        <Card
          className="border-dashed border-2 border-gray-300 hover:border-green-400 transition-colors cursor-pointer group bg-gray-50 hover:bg-gray-100"
          onClick={onJoinServer}
        >
          <CardContent className="flex flex-col items-center justify-center h-full py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 group-hover:bg-green-100 flex items-center justify-center transition-colors">
              <Globe className="h-8 w-8 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                Join a Server
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Discover new communities
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {servers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No servers yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create your first server or join an existing community to get started.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={onCreateServer}>
              <Plus className="h-4 w-4 mr-2" />
              Create Server
            </Button>
            <Button variant="outline" onClick={onJoinServer}>
              <Globe className="h-4 w-4 mr-2" />
              Join Server
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
