# Pages Structure - Domain-Driven Design (DDD)

This directory follows Domain-Driven Design principles to organize the frontend application into logical business domains. Each domain contains its own UI components and business logic features.

## Structure Overview

```
pages/
├── auth/           # Authentication domain
├── chat/           # Real-time messaging domain
├── channels/       # Channel management domain
├── dashboard/      # Main dashboard domain
├── servers/        # Server/workspace management domain
├── users/          # User management domain
└── index.ts        # Central exports and types
```

## Domain Architecture

Each domain follows a consistent structure:

```
domain/
├── ui/             # Pure UI components (no business logic)
├── features/       # Business logic + UI composition
└── index.ts        # Domain exports and types
```

### UI Layer (`ui/`)
- **Purpose**: Pure presentation components
- **Characteristics**:
  - No API calls or business logic
  - Receives data via props
  - Focuses on user interface and interactions
  - Reusable across different features
  - Easy to test and maintain

### Features Layer (`features/`)
- **Purpose**: Business logic and feature orchestration
- **Characteristics**:
  - Contains React Query hooks for data fetching
  - Manages component state and side effects
  - Coordinates between UI components
  - Handles business rules and validation
  - Integrates with external APIs

## Domain Descriptions

### 🔐 Auth Domain
Handles user authentication and authorization:
- Login/logout functionality
- User registration
- Password reset
- Session management

**Key Components:**
- `LoginForm` - UI for user login
- `LoginFeature` - Login business logic with API integration

### 💬 Chat Domain
Real-time messaging functionality:
- Message display and sending
- Real-time updates via WebSocket
- Message history
- Typing indicators

**Key Components:**
- `MessageList` - Display chat messages
- `MessageInput` - Send new messages
- `ChatRoomFeature` - Chat room business logic

### 📢 Channels Domain
Channel management and navigation:
- Channel listing
- Channel creation/editing
- Channel permissions
- Channel settings

### 🏠 Dashboard Domain
Main application dashboard:
- Overview widgets
- Recent activity
- Quick actions
- Navigation hub

### 🖥️ Servers Domain
Server/workspace management:
- Server creation and configuration
- Member management
- Server settings
- Invitations

### 👥 Users Domain
User profile and settings:
- User profiles
- Account settings
- Privacy controls
- Friend management

## Usage Patterns

### Importing Components

```typescript
// Import from domain index for clean imports
import { LoginFeature, LoginForm } from '@/pages/auth';
import { ChatRoomFeature, MessageList } from '@/pages/chat';

// Or import specific components
import { LoginForm } from '@/pages/auth/ui/login-form';
import { ChatRoomFeature } from '@/pages/chat/features/chat-room';
```

### Creating New Features

1. **Choose the appropriate domain** based on business functionality
2. **Create UI components** in the `ui/` folder
3. **Create feature components** in the `features/` folder
4. **Export from domain index** for clean imports

### Example: Adding a new chat feature

```typescript
// 1. Create UI component
// pages/chat/ui/emoji-picker.tsx
export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  // Pure UI logic
}

// 2. Create feature component
// pages/chat/features/enhanced-message-input.tsx
export function EnhancedMessageInputFeature() {
  // Business logic + UI composition
  return (
    <div>
      <MessageInput />
      <EmojiPicker />
    </div>
  );
}

// 3. Export from domain index
// pages/chat/index.ts
export { EmojiPicker } from './ui/emoji-picker';
export { EnhancedMessageInputFeature } from './features/enhanced-message-input';
```

## Technology Stack Integration

### TanStack Query
- Used in `features/` components for data fetching
- Handles caching, synchronization, and error states
- Optimistic updates for better UX

### TanStack Router
- Navigation between domains and features
- Route-based code splitting
- Type-safe routing

### shadcn/ui + Tailwind CSS
- UI components used in the `ui/` layer
- Consistent design system
- Responsive and accessible components

## Best Practices

### 1. Separation of Concerns
- Keep business logic in `features/`
- Keep UI logic in `ui/`
- Avoid mixing concerns

### 2. Domain Boundaries
- Each domain should be relatively independent
- Cross-domain communication through well-defined interfaces
- Avoid tight coupling between domains

### 3. Component Design
- Make UI components reusable and testable
- Use TypeScript interfaces for prop definitions
- Follow single responsibility principle

### 4. State Management
- Use React Query for server state
- Use React state for local UI state
- Consider context for domain-specific shared state

### 5. Error Handling
- Handle errors gracefully in features
- Provide meaningful error messages
- Implement retry mechanisms where appropriate

## Testing Strategy

### UI Components (`ui/`)
```typescript
// Test UI behavior and rendering
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/pages/auth/ui/login-form';

test('renders login form with email and password fields', () => {
  render(<LoginForm onSubmit={jest.fn()} />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

### Feature Components (`features/`)
```typescript
// Test business logic and integration
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginFeature } from '@/pages/auth/features/login';

test('handles login flow correctly', async () => {
  // Test business logic, API calls, and state changes
});
```

## Performance Considerations

- **Code Splitting**: Each domain can be lazy-loaded
- **Bundle Size**: Keep domains focused to avoid unnecessary code
- **Caching**: Leverage React Query caching strategies
- **Memoization**: Use React.memo for expensive UI components

## Migration Guide

When refactoring existing code to this structure:

1. **Identify business domains** in your current codebase
2. **Extract UI components** and move to appropriate `ui/` folders
3. **Extract business logic** and move to `features/` folders
4. **Update imports** to use domain index files
5. **Test thoroughly** to ensure functionality is preserved

This structure promotes maintainability, testability, and scalability as your application grows.
