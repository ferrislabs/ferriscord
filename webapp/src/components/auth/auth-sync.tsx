import { useOidc, useOidcAccessToken, useOidcIdToken } from '@axa-fr/react-oidc'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function AuthSync() {
  const { isAuthenticated } = useOidc()
  const { accessToken, accessTokenPayload } = useOidcAccessToken()
  const { idToken, idTokenPayload } = useOidcIdToken()

  const { setTokens } = useAuthStore()
  const { setAuthenticated, setUser, setExpiration, setLoading } = useUserStore()

  useEffect(() => {
    setLoading(false)
    setAuthenticated(isAuthenticated)

    if (isAuthenticated && idTokenPayload) {
      setUser({
        avatar: idTokenPayload.picture ?? '',
        preferred_username: idTokenPayload.preferred_username ?? idTokenPayload.sub ?? '',
        email: idTokenPayload.email ?? '',
        name: idTokenPayload.name ?? '',
      })
      setExpiration(accessTokenPayload?.exp ?? null)
    } else if (!isAuthenticated) {
      setUser(null)
      setExpiration(null)
    }
  }, [isAuthenticated, idTokenPayload, accessTokenPayload])

  useEffect(() => {
    setTokens(accessToken ?? null, null, idToken ?? null)
  }, [accessToken, idToken])

  return null
}
