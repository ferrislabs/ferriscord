import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { mockApi } from '@/lib/mock-data';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Users,
  Globe,
  Lock,
  Star,
  TrendingUp,
  Gamepad2,
  Music,
  Code,
  Palette,
  BookOpen,
  Coffee,
  Heart,
  Zap
} from 'lucide-react';

type CategoryType = 'all' | 'gaming' | 'music' | 'education' | 'technology' | 'art' | 'community' | 'study';
type SortType = 'popular' | 'newest' | 'members' | 'active';

const categories = [
  { id: 'all' as const, label: 'All Categories', icon: Globe },
  { id: 'gaming' as const, label: 'Gaming', icon: Gamepad2 },
  { id: 'music' as const, label: 'Music', icon: Music },
  { id: 'education' as const, label: 'Education', icon: BookOpen },
  { id: 'technology' as const, label: 'Technology', icon: Code },
  { id: 'art' as const, label: 'Art', icon: Palette },
  { id: 'community' as const, label: 'Community', icon: Heart },
  { id: 'study' as const, label: 'Study', icon: Coffee },
];

const sortOptions = [
  { id: 'popular' as const, label: 'Most Popular', icon: Star },
  { id: 'newest' as const, label: 'Newest', icon: Zap },
  { id: 'members' as const, label: 'Most Members', icon: Users },
  { id: 'active' as const, label: 'Most Active', icon: TrendingUp },
];

export function ServerDiscoveryFeature() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch public servers
  const { data: servers = [], isLoading, error } = useQuery({
    queryKey: ['public-servers', selectedCategory, sortBy, searchQuery],
    queryFn: () => mockApi.getPublicServers({ category: selectedCategory, sort: sortBy, search: searchQuery }),
  });

  // Fetch featured servers
  const { data: featuredServers = [] } = useQuery({
    queryKey: ['featured-servers'],
    queryFn: mockApi.getFeaturedServers,
  });

  const handleJoinServer = async (serverId: string) => {
    try {
      await mockApi.joinServer(serverId);
      // Navigate to the server after joining
      const channels = await mockApi.getChannels(serverId);
      const firstChannel = channels.find(c => c.type === 'text') || channels[0];
      if (firstChannel) {
        navigate({
          to: '/channels/$serverId/$channelId',
          params: { serverId, channelId: firstChannel.id }
        });
      }
    } catch (error) {
      console.error('Failed to join server:', error);
      // In a real app, show a toast notification
    }
  };

  const handlePreviewServer = (serverId: string) => {
    // In a real app, this would open a server preview modal
    console.log('Preview server:', serverId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Discovering servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Failed to load server discovery. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      <div className="h-full overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Discover Servers</h1>
                <p className="text-gray-600 mt-1">Find your community and make new friends</p>
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                              "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              selectedCategory === category.id
                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{category.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Sort By</h3>
                    <div className="flex flex-wrap gap-2">
                      {sortOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={cn(
                              "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              sortBy === option.id
                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Featured Servers */}
          {featuredServers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-gray-900">Featured Communities</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredServers.slice(0, 6).map((server) => (
                  <Card key={server.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                            {server.icon || server.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate group-hover:text-indigo-600 transition-colors">
                              {server.name}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                Featured
                              </Badge>
                              {server.category && (
                                <Badge variant="outline" className="text-xs">
                                  {server.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
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
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{Math.floor(server.memberCount * 0.3).toLocaleString()} online</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoinServer(server.id)}
                          className="flex-1"
                        >
                          Join Server
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewServer(server.id)}
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Servers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'All Servers' : `${categories.find(c => c.id === selectedCategory)?.label} Servers`}
              </h2>
              <span className="text-sm text-gray-500">
                {servers.length} server{servers.length !== 1 ? 's' : ''} found
              </span>
            </div>

            {servers.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No servers found' : 'No servers in this category'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search terms or filters'
                    : 'Check back later for new communities to discover'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {servers.map((server) => (
                  <Card key={server.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                            {server.icon || server.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm truncate group-hover:text-indigo-600 transition-colors">
                              {server.name}
                            </CardTitle>
                            <div className="flex items-center space-x-1 mt-1">
                              {server.isPublic ? (
                                <Globe className="h-3 w-3 text-green-500" />
                              ) : (
                                <Lock className="h-3 w-3 text-gray-400" />
                              )}
                              {server.category && (
                                <Badge variant="outline" className="text-xs">
                                  {server.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {server.description && (
                        <CardDescription className="text-xs text-gray-600 line-clamp-2">
                          {server.description}
                        </CardDescription>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{server.memberCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>{Math.floor(server.memberCount * 0.2).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleJoinServer(server.id)}
                          className="flex-1 text-xs py-1.5"
                        >
                          Join
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewServer(server.id)}
                          className="text-xs py-1.5"
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
