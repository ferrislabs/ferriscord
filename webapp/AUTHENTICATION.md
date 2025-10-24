# Authentication Implementation with @axa-fr/react-oidc

This document describes the authentication implementation in the FerrisCord webapp using `@axa-fr/react-oidc` for Keycloak integration.

## Overview

The application uses OpenID Connect (OIDC) for authentication through Keycloak. The `@axa-fr/react-oidc` library provides React components and hooks to handle the OIDC flow.

## Configuration

### Keycloak Setup

The application expects a Keycloak instance running at `http://localhost:8080` with:
- Realm: `ferriscord`
- Client ID: `front`
- Client Type: Public (SPA)

### OIDC Configuration

The OIDC configuration is defined in `src/main.tsx`:

```typescript
const configuration: OidcConfiguration = {
  client_id: 'front',
  redirect_uri: window.location.origin,
  scope: 'openid profile email',
  authority: 'http://localhost:8080/realms/ferriscord'
}
```

## Architecture

### Core Components

1. **OidcProvider** (`src/main.tsx`)
   - Wraps the entire application
   - Provides OIDC context to all components
   - Manages authentication state

2. **AuthWrapper** (`src/components/auth/auth-wrapper.tsx`)
   - Protects routes that require authentication
   - Automatically redirects unauthenticated users to login
   - Shows loading state during authentication checks

3. **useAuth Hook** (`src/hooks/use-auth.ts`)
   - Provides app-specific user interface
   - Transforms OIDC user data into application format
   - Exposes sign-in/sign-out methods

### Route Structure

The application uses the default OIDC callback handling provided by `@axa-fr/react-oidc`. No custom authentication routes are needed as users are redirected directly to Keycloak's login page.

### Protected Routes

All main application routes are wrapped with `AuthWrapper`:

- `/` (Dashboard)
- `/servers`
- `/servers/$serverId`
- `/servers/$serverId/channels/$channelId`
- `/dm/$dmId`
- `/users/$userId`

## Implementation Details

### Authentication Flow

1. User accesses a protected route
2. `AuthWrapper` checks authentication status via `useOidc()`
3. If not authenticated:
   - Automatically redirects to Keycloak login page
4. User completes login in Keycloak
5. Keycloak redirects back to the application
6. OIDC library handles the callback automatically
7. User can now access the protected content

### User Data Transformation

The `useAuth` hook transforms OIDC user claims into the application's user format:

```typescript
interface AuthUser {
  id: string;           // from oidcUser.sub
  username: string;     // from oidcUser.preferred_username || name
  email: string;        // from oidcUser.email
  avatar?: string;      // from oidcUser.picture
  status: 'online' | 'away' | 'busy' | 'offline';
  isBot?: boolean;
  joinedAt: string;
}
```

### Error Handling

- Network errors during authentication are handled by the OIDC library
- Missing Keycloak configuration shows user-friendly error messages
- Debug page (`/debug/auth`) provides detailed authentication status

## Usage

### Protecting Components

Use the `useAuth` hook to access user data and authentication status:

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      Welcome, {user.username}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protecting Routes

Wrap route components with `AuthWrapper`:

```typescript
function MyRoute() {
  return (
    <AuthWrapper>
      <MyProtectedComponent />
    </AuthWrapper>
  );
}
```

## Development

### Running with Keycloak

1. Start Keycloak server at `http://localhost:8080`
2. Create the `ferriscord` realm
3. Create a public client with ID `front`
4. Configure valid redirect URIs:
   - `http://localhost:5173/*`

### Debugging Authentication

Use the browser's developer tools to debug authentication:
- Check the Network tab for OIDC requests
- Inspect Local Storage for authentication tokens
- Use the `useAuth` hook to access user data in components
- Check console logs for authentication flow information

### Common Issues

1. **Keycloak not running**: Check that Keycloak is accessible at `http://localhost:8080`
2. **Invalid redirect URI**: Ensure the client configuration allows `http://localhost:5173/*`
3. **CORS issues**: Configure Keycloak client to allow the development server origin
4. **Token expiration**: The library handles token renewal automatically
5. **Login loop**: Check that the Keycloak client is configured as a public client

## Security Considerations

- All authentication tokens are managed by the OIDC library
- No sensitive data is stored in localStorage manually
- Silent token renewal prevents session interruption
- Public client configuration is appropriate for SPA architecture

## Future Enhancements

- Add role-based access control (RBAC)
- Implement server-side user profile synchronization
- Add offline authentication support
- Enhanced error handling and retry logic
- Multi-factor authentication support
