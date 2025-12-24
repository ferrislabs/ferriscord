import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getStatusColor } from '@/lib/utils';
import type { Member } from './types';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberListProps {
  members: Member[];
  isLoading?: boolean;
}

export function MemberList({ members, isLoading = false }: MemberListProps) {
  return (
    <Sidebar side="right" className="w-60 bg-gray-100 border-l border-gray-200">
      <SidebarHeader className="layout-header-sidebar-light">
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <h3 className="text-sm font-semibold text-gray-700">
            Members — {members.length}
          </h3>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-gray-100">
        <ScrollArea className="h-full">
          <div className="space-y-2 p-2">
            {isLoading ? (
              <>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              members.map((member) => (
                <Link key={member.id} to="/users/$userId" params={{ userId: member.id }}>
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200 cursor-pointer">
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.username} />
                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                          {member.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-100',
                          getStatusColor(member.status as 'online' | 'offline' | 'away' | 'busy')
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'text-sm font-medium truncate',
                          member.status === 'online' ? 'text-gray-900' : 'text-gray-500'
                        )}
                      >
                        {member.username}
                        {member.isBot && (
                          <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 px-1 rounded">
                            BOT
                          </span>
                        )}
                      </div>
                      {member.status !== 'offline' && (
                        <div className="text-xs text-gray-400 capitalize">{member.status}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
