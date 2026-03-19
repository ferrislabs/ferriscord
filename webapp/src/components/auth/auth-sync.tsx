import { useOidc, useOidcAccessToken, useOidcIdToken, useOidcUser } from '@axa-fr/react-oidc'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

/**
 * AuthSync — composant renderless monté dans __root.tsx.
 * Lit l'état OIDC et l'écrit dans les stores Zustand.
 * Doit être rendu à l'intérieur de OidcProvider.
 */
export function AuthSync() {
  const { isAuthenticated } = useOidc()
  const { accessToken, accessTokenPayload } = useOidcAccessToken()
  const { idToken } = useOidcIdToken()
  const { oidcUser, oidcUserLoadingState } = useOidcUser()

  const { setTokens } = useAuthStore()
  const { setAuthenticated, setUser, setExpiration, setLoading } = useUserStore()

  useEffect(() => {
    const isLoading = oidcUserLoadingState === 'Loading user'
    setLoading(isLoading)
    setAuthenticated(isAuthenticated)

    if (isAuthenticated && oidcUser) {
      setUser({
        avatar: oidcUser.picture ?? '',
        preferred_username: oidcUser.preferred_username ?? '',
        email: oidcUser.email ?? '',
        name: oidcUser.name ?? '',
      })
      setExpiration(accessTokenPayload?.exp ?? null)
    } else if (!isLoading) {
      setUser(null)
      setExpiration(null)
    }
  }, [isAuthenticated, oidcUser, oidcUserLoadingState, accessTokenPayload])

  useEffect(() => {
    setTokens(accessToken ?? null, null, idToken ?? null)
  }, [accessToken, idToken])

  return null
}
