# Layout Components

This directory contains the main layout components for the Ferriscord application.

## Structure

```
layout/
├── sidebar/
│   ├── server-sidebar.tsx    # Server navigation (left-most sidebar)
│   ├── channel-sidebar.tsx   # Channel list for selected server (uses ShadCN)
│   ├── dm-sidebar.tsx         # Direct messages list (uses ShadCN)
│   ├── user-panel.tsx         # Bottom user info panel
│   └── index.ts               # Exports for sidebar components
├── app-layout.tsx             # Main layout container
├── top-bar.tsx                # Top navigation bar
├── member-list.tsx            # Member list (uses ShadCN)
├── types.ts                   # Shared TypeScript types
└── README.md                  # This file
```

## ShadCN Sidebar Components

All sidebars (except ServerSidebar) use ShadCN UI Sidebar components:
- `Sidebar` - Main container
- `SidebarHeader` - Header section (h-16 for alignment)
- `SidebarContent` - Scrollable content area
- `SidebarFooter` - Footer section (min-h-14 for user panel)

These provide consistent styling, animations, and structure.

## Components

### AppLayout

The main layout container that orchestrates all layout components.

**Props:**
- `children: React.ReactNode` - Main content area

**Features:**
- Automatic routing detection (DM vs Server views)
- Conditional sidebar rendering based on current route
- Server/channel/member data fetching with React Query
- Collapsible channel sidebar

### ServerSidebar

Left-most sidebar showing server icons and navigation.

**Props:**
- `servers: Server[]` - List of servers
- `selectedServerId?: string` - Currently selected server ID
- `onServerClick: (serverId: string) => void` - Server click handler

**Features:**
- Direct Messages button (@)
- Server icons with hover effects
- Server discovery button (+)
- Auto-navigation to first channel on server click

### ChannelSidebar

Displays channels for the selected server using ShadCN Sidebar components.

**Props:**
- `serverName: string` - Server name for header
- `serverId: string` - Current server ID
- `channels: Channel[]` - List of channels
- `user: BaseUser | null` - Current user
- `isCollapsed?: boolean` - Collapse state
- `onLogout: () => void` - Logout handler

**Features:**
- Uses ShadCN `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`
- Collapsible sidebar (64px collapsed, 240px expanded)
- Text and voice channel icons with shrink-0 for stability
- User panel at bottom
- Smooth transitions
- Perfect header alignment with TopBar (h-16)

### DMSidebar

Displays direct message conversations using ShadCN Sidebar components.

**Props:**
- `dmUsers: Member[]` - List of DM users
- `currentUser: BaseUser | null` - Current user
- `onLogout: () => void` - Logout handler

**Features:**
- Friends shortcut
- Recent DM conversations
- User avatars with status indicators
- User panel at bottom

### TopBar

Top navigation bar with contextual information.

**Props:**
- `selectedServer?: Server | null` - Current server
- `channels?: Channel[]` - Channel list
- `isDMView?: boolean` - DM view flag
- `isDMHome?: boolean` - DM home flag
- `isDMConversation?: boolean` - DM conversation flag
- `dmUsers?: Member[]` - DM users list
- `currentUser?: BaseUser | null` - Current user
- `onToggleCollapse?: () => void` - Collapse toggle handler

**Features:**
- Contextual title (channel, DM user, or friends)
- Channel/server description
- Member count display
- Search, notifications, and profile buttons
- Sidebar collapse toggle (for server view)

### UserPanel

Bottom user info panel (used in sidebars).

**Props:**
- `user: BaseUser | null` - Current user
- `isCollapsed?: boolean` - Collapse state
- `onLogout: () => void` - Logout handler

**Features:**
- User avatar with status indicator
- Username and status display
- Settings and logout buttons
- Responsive to collapse state

### MemberList

Right sidebar showing server members.

**Props:**
- `members: Member[]` - List of members

**Features:**
- Member count header
- Member avatars with status indicators
- Bot badges
- Clickable member profiles
- Online/offline visual distinction

## Types

### BaseUser
```typescript
interface BaseUser {
  id: string;
  username: string;
  avatar?: string;
  status?: UserStatus;
}
```

### Channel
```typescript
interface Channel {
  id: string;
  name: string;
  type: ChannelType; // 'text' | 'voice' | 'announcement'
  description?: string;
  memberCount?: number;
}
```

### Server
```typescript
interface Server {
  id: string;
  name: string;
  icon?: string;
}
```

### Member
```typescript
interface Member extends BaseUser {
  status: UserStatus;
  isBot?: boolean;
}
```

### UserStatus
```typescript
type UserStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'away' | 'busy';
```

## Layout Behavior

### Server View
When navigating to a server channel (`/channels/$serverId/$channelId`):
- ServerSidebar: Always visible
- ChannelSidebar: Visible (shows server channels)
- TopBar: Shows channel info with collapse toggle
- MemberList: Visible (shows server members)
- DMSidebar: Hidden

### DM Home View
When navigating to friends (`/channels/@me`):
- ServerSidebar: Always visible
- ChannelSidebar: Hidden
- TopBar: Shows "Friends" title
- MemberList: Hidden
- DMSidebar: Hidden

### DM Conversation View
When navigating to a DM (`/channels/$userId`):
- ServerSidebar: Always visible
- ChannelSidebar: Hidden
- TopBar: Shows DM user info
- MemberList: Hidden
- DMSidebar: Visible (shows DM list)

## Alignment

The layout uses a consistent 64px (h-16) height for all headers:
- `ChannelSidebar` header: 64px
- `DMSidebar` header: 64px
- `TopBar`: 64px

This ensures perfect vertical alignment across all sidebars and the main content area.

All sidebars use `shrink-0` on their headers to prevent collapse and maintain consistent alignment.

## Styling

- Background colors:
  - Server sidebar: `bg-gray-900`
  - Channel/DM sidebars: `bg-gray-800`
  - Main content: `bg-white`
  - Member list: `bg-gray-100`
  
- Heights:
  - All headers: `h-16` (64px)
  - User panel: `h-14` (56px)

- Transitions:
  - Sidebar collapse: `transition-all duration-200`
  - Hover effects: Default transitions

## Usage Example

```tsx
import { AppLayout } from '@/components/layout/app-layout';

function App() {
  return (
    <AppLayout>
      {/* Your page content here */}
    </AppLayout>
  );
}
```

## Notes

- The layout automatically detects the current route to show appropriate sidebars
- All data fetching is handled in `AppLayout` using React Query
- Type conversions are performed to maintain type safety across different data sources
- The collapse state is managed locally with `useState` in `AppLayout`
