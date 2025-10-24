# Ferriscord Webapp

A Discord/Slack-like chat application built with React, TypeScript, and modern web technologies.

## 🚀 Features

- **Domain-Driven Design (DDD)** architecture
- **Real-time messaging** with mock WebSocket implementation
- **Server and channel management**
- **Direct messaging**
- **User authentication** (both OIDC and mock)
- **Responsive design** with Tailwind CSS
- **Type-safe** with TypeScript

## 🏗️ Architecture

The application follows Domain-Driven Design principles with the following structure:

```
src/
├── components/          # Shared UI components
│   ├── layout/         # Layout components (routing, app layout)
│   └── ui/             # Basic UI components (buttons, inputs, etc.)
├── pages/              # Domain-specific pages
│   ├── auth/           # Authentication domain
│   ├── chat/           # Messaging domain
│   ├── dashboard/      # Dashboard domain
│   └── servers/        # Server management domain
├── lib/                # Utilities and mock data
│   ├── mock-data.ts    # Comprehensive mock data
│   └── utils.ts        # Utility functions
└── app.tsx             # Main application component
```

Each domain follows the pattern:
- `ui/` - Pure presentation components
- `features/` - Business logic + UI composition
- `index.ts` - Domain exports and types

## 🛠️ Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React OIDC** - Authentication (optional)
- **Vite** - Build tool

## 📦 Installation

1. Navigate to the webapp directory:
```bash
cd ferriscord/webapp
```

2. Install dependencies:
```bash
pnpm install
```

## 🚀 Running the Application

### Development Mode

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## 🔐 Authentication

The application supports two authentication modes:

### 1. Mock Authentication (Default)
- Use email: `admin@ferriscord.com`
- Use password: `password`
- Perfect for development and testing

### 2. OIDC Authentication
To enable OIDC authentication, update `app.tsx`:

```typescript
const [useOidcAuth] = useState(true); // Change to true
```

Make sure your OIDC server is running on `http://localhost:8080/realms/ferriscord`

## 🎯 Usage

### Navigation

1. **Dashboard** (`/dashboard`) - Overview of servers and recent activity
2. **Servers** (`/servers`) - List and manage your servers
3. **Server Channels** (`/servers/:serverId/channels/:channelId`) - Chat in specific channels
4. **Direct Messages** (`/dm/:dmId`) - Private conversations

### Features Available

- ✅ User authentication (mock and OIDC)
- ✅ Dashboard with server overview
- ✅ Server listing and navigation
- ✅ Real-time chat interface
- ✅ Channel navigation
- ✅ User status indicators
- ✅ Mock WebSocket events
- ✅ Responsive design
- ✅ Message history
- ✅ Typing indicators (mock)

### Mock Data

The application includes comprehensive mock data:

- **6 Users** with different statuses and roles
- **4 Servers** with various configurations
- **9 Channels** across different servers
- **13+ Messages** with reactions and replies
- **2 Direct Message** conversations
- **Mock WebSocket events** for real-time updates

## 🎨 Styling

The application uses a modern design system with:

- **CSS Variables** for theming
- **Tailwind CSS** for utility-first styling
- **Custom components** following shadcn/ui patterns
- **Responsive design** for all screen sizes
- **Dark mode ready** (CSS variables prepared)

## 🧪 Development

### Adding New Domains

1. Create domain folder in `pages/`
2. Add `ui/` and `features/` subfolders
3. Create `index.ts` for exports
4. Update main `pages/index.ts`

Example:
```bash
mkdir -p src/pages/notifications/{ui,features}
touch src/pages/notifications/index.ts
```

### Mock Data

All mock data is centralized in `lib/mock-data.ts`:

- **Users**: User profiles with status
- **Servers**: Server information and settings
- **Channels**: Text, voice, and announcement channels
- **Messages**: Chat messages with reactions
- **API Functions**: Mock API calls with realistic delays

### Adding New Routes

Update the `AppRouter` function in `app.tsx`:

```typescript
if (matchRoute('/new-route/:param', currentRoute).match) {
  return <NewPage />;
}
```

## 🚧 TODO / Roadmap

- [ ] Voice channel support
- [ ] File upload functionality
- [ ] Emoji reactions interface
- [ ] User settings page
- [ ] Server creation modal
- [ ] Real WebSocket integration
- [ ] Push notifications
- [ ] Mobile app support
- [ ] Dark mode toggle
- [ ] Internationalization

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **Dependencies not found**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **TypeScript errors**
   ```bash
   pnpm tsc --noEmit
   ```

### Development Tips

- Use browser dev tools to inspect mock data
- Check console for WebSocket mock events
- Use React DevTools for component debugging
- TanStack Query DevTools are available in development

## 📄 License

This project is part of the Ferriscord application suite.

## 🤝 Contributing

1. Follow the DDD architecture patterns
2. Add proper TypeScript types
3. Include mock data for new features
4. Test responsive design
5. Update documentation

---

**Happy coding!** 🦀
