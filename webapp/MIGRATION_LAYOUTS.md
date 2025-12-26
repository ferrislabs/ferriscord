# Migration Guide: Layouts et Routes

Ce guide explique comment migrer les routes existantes vers la nouvelle architecture de layouts.

## 🎯 Objectif

Simplifier la structure des routes en utilisant un layout parent protégé au lieu de répéter le code d'authentification sur chaque route.

## 📋 Changements Principaux

### 1. Nouvelle Structure de Dossiers

```
src/
├── layouts/                    # ✨ NOUVEAU - Layouts de haut niveau
│   ├── setup-app-layout.tsx   # Configuration OIDC
│   ├── authenticated-layout.tsx # Protection auth + AppLayout
│   ├── public-layout.tsx       # Pages publiques
│   ├── app-layout.tsx          # Layout principal (déplacé)
│   └── index.ts
├── components/                 # Composants réutilisables
│   ├── ui/                     # Composants UI primitifs
│   ├── layout/                 # Composants de layout (sidebars, etc.)
│   └── auth/                   # ⚠️ auth-wrapper.tsx deprecated
└── routes/                     # Routes TanStack Router
    └── _app.tsx                # ✨ Route parent protégée
```

### 2. Routes Protégées vs Routes Publiques

#### Route Parent Protégée: `_app.tsx`

Toutes les routes sous `_app.*` sont automatiquement protégées par authentification.

**Avant:**
```tsx
// Chaque route devait répéter ce code
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { AppLayout } from '@/components/layout/app-layout'

function MyRoute() {
  return (
    <AuthWrapper>
      <AppLayout>
        <MyContent />
      </AppLayout>
    </AuthWrapper>
  )
}
```

**Après:**
```tsx
// _app.tsx (une seule fois)
import { AuthenticatedLayout } from '@/layouts'

export const Route = createFileRoute('/_app')({
  component: () => (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  )
})

// _app.channels.$serverId.$channelId.tsx (route enfant)
export const Route = createFileRoute('/_app/channels/$serverId/$channelId')({
  component: ChannelPage
})

function ChannelPage() {
  // Plus besoin de AuthWrapper ni AppLayout !
  return <MyContent />
}
```

## 🔄 Migration des Routes Existantes

### Routes à Migrer

Les routes suivantes utilisent encore l'ancien pattern et doivent être migrées:

1. ❌ `routes/channels.$serverId.$channelId.tsx`
2. ❌ `routes/channels.$userId.tsx`
3. ❌ `routes/channels.@me.tsx`
4. ❌ `routes/discovery.servers.tsx`
5. ❌ `routes/users.$userId.tsx`
6. ❌ `routes/index.tsx`

### Étapes de Migration

#### Étape 1: Identifier le type de route

- **Route protégée** (nécessite authentification) → Sous `_app/`
- **Route publique** (accessible sans auth) → Racine ou sous `_public/`

#### Étape 2: Déplacer/Renommer le fichier

**Exemple: Route protégée**
```bash
# Avant
src/routes/discovery.servers.tsx

# Après
src/routes/_app.discovery.servers.tsx
```

**Exemple: Route publique**
```bash
# Avant
src/routes/index.tsx

# Après
src/routes/index.tsx (peut rester à la racine)
# OU
src/routes/_public.index.tsx (si vous créez un layout public parent)
```

#### Étape 3: Simplifier le composant

**Avant:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/layouts/app-layout'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { ServerDiscoveryFeature } from '@/pages/discovery/features/server-discovery'

export const Route = createFileRoute('/discovery/servers')({
  component: ServerDiscovery,
})

function ServerDiscovery() {
  return (
    <AuthWrapper>
      <AppLayout>
        <ServerDiscoveryFeature />
      </AppLayout>
    </AuthWrapper>
  )
}
```

**Après:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { ServerDiscoveryFeature } from '@/pages/discovery/features/server-discovery'

export const Route = createFileRoute('/_app/discovery/servers')({
  component: ServerDiscovery,
})

function ServerDiscovery() {
  return <ServerDiscoveryFeature />
}
```

## 📝 Exemples Concrets

### Exemple 1: Route de Channel

**Avant:** `routes/channels.$serverId.$channelId.tsx`
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/layouts/app-layout'
import { ChatRoomFeature } from '@/pages/chat/features/chat-room'
import { AuthWrapper } from '@/components/auth/auth-wrapper'

export const Route = createFileRoute('/channels/$serverId/$channelId')({
  loader: async ({ params }) => {
    // ... loader logic
  },
  component: ChannelPage,
})

function ChannelPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <ChatRoomFeature />
      </AppLayout>
    </AuthWrapper>
  )
}
```

**Après:** `routes/_app.channels.$serverId.$channelId.tsx`
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { ChatRoomFeature } from '@/pages/chat/features/chat-room'

export const Route = createFileRoute('/_app/channels/$serverId/$channelId')({
  loader: async ({ params }) => {
    // ... loader logic (identique)
  },
  component: ChannelPage,
})

function ChannelPage() {
  return <ChatRoomFeature />
}
```

### Exemple 2: Page d'Accueil (Décision à prendre)

**Option A: Route Publique (Accessible sans auth)**
```tsx
// routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '@/layouts'
import { LandingPage } from '@/pages/landing'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  )
}
```

**Option B: Route Protégée (Redirige vers channels/@me si authentifié)**
```tsx
// routes/_app.index.tsx
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/')({
  component: () => <Navigate to="/channels/@me" />,
})
```

### Exemple 3: Page Utilisateur

**Avant:** `routes/users.$userId.tsx`
```tsx
function UserProfile() {
  return (
    <AuthWrapper>
      <AppLayout>
        <UserProfileContent />
      </AppLayout>
    </AuthWrapper>
  )
}
```

**Après:** `routes/_app.users.$userId.tsx`
```tsx
function UserProfile() {
  return <UserProfileContent />
}
```

## 🗺️ Nouvelle Arborescence des Routes

```
routes/
├── __root.tsx                          # Root layout
├── _app.tsx                            # ✨ Route parent protégée
├── _app.channels.@me.tsx               # DM home
├── _app.channels.@me.$userId.tsx       # DM conversation
├── _app.channels.$serverId.$channelId.tsx  # Channel de serveur
├── _app.discovery.servers.tsx          # Découverte de serveurs
├── _app.users.$userId.tsx              # Profil utilisateur
├── _app.explore.tsx                    # Exploration
└── index.tsx                           # Landing page (publique)
```

## ✅ Checklist de Migration

### Pour chaque route protégée:

- [ ] Le fichier est sous `_app.*` (ex: `_app.channels.$serverId.tsx`)
- [ ] Le composant ne contient PLUS `<AuthWrapper>` ni `<AppLayout>`
- [ ] Le path dans `createFileRoute()` commence par `/_app/`
- [ ] Les imports d'`AuthWrapper` et `AppLayout` sont supprimés
- [ ] La route fonctionne correctement (test manuel)

### Pour chaque route publique:

- [ ] Le fichier utilise `<PublicLayout>` si nécessaire
- [ ] Pas de `<AuthWrapper>` (car pas d'auth requise)
- [ ] La route est accessible sans être connecté

## 🚨 Deprecated

Les éléments suivants sont maintenant **deprecated** et ne devraient plus être utilisés:

- ❌ `@/components/auth/auth-wrapper.tsx` → Utiliser `AuthenticatedLayout`
- ❌ Import direct de `AppLayout` dans les routes → Inclus dans `AuthenticatedLayout`
- ❌ Routes protégées sans préfixe `_app` → Renommer en `_app.*`

## 🧪 Tests

Après migration, vérifier:

1. ✅ Les routes protégées redirigent vers login si non authentifié
2. ✅ Les routes protégées affichent le contenu si authentifié
3. ✅ Le layout (sidebar, nav) s'affiche correctement
4. ✅ Les routes publiques sont accessibles sans auth
5. ✅ Pas de flash de contenu non autorisé
6. ✅ Les loaders fonctionnent correctement

## 📚 Ressources

- [TanStack Router - Route Trees](https://tanstack.com/router/latest/docs/framework/react/guide/route-trees)
- [TanStack Router - Layouts](https://tanstack.com/router/latest/docs/framework/react/guide/layouts)
- `src/layouts/README.md` - Documentation des layouts

## 🤝 Support

Si vous rencontrez des problèmes lors de la migration, vérifiez:

1. Le nom du fichier respecte bien la convention `_app.*`
2. Le path dans `createFileRoute()` correspond au nom du fichier
3. Pas de double wrapping (ex: `AuthWrapper` dans une route `_app`)
4. Les imports sont mis à jour (de `@/components/layout` vers `@/layouts`)

## 🎉 Avantages

Après migration, vous bénéficierez de:

- ✨ **Moins de code répétitif** - Plus besoin de wrapper chaque route
- 🎯 **Code plus clair** - La protection d'auth est évidente via le préfixe `_app`
- 🛠️ **Maintenance facilitée** - Un seul endroit pour modifier le layout auth
- 🚀 **Meilleure performance** - Pas de re-render inutiles du layout
- 📦 **Architecture scalable** - Facile d'ajouter de nouvelles routes protégées
