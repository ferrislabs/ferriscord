import { useOidc } from '@axa-fr/react-oidc'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function useAuth() {
  const { login, logout } = useOidc()

  const { accessToken, idToken } = useAuthStore()
  const { isAuthenticated, isLoading, user, expiration } = useUserStore()

  const signIn = () => login('/')
  const signOut = () => logout('/')

  return {
    user,
    isAuthenticated,
    isLoading,
    expiration,
    accessToken,
    idToken,
    signIn,
    signOut,
  }
}

export default useAuth
