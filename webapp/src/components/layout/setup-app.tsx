import { OidcProvider } from "@axa-fr/react-oidc"
import type { PropsWithChildren } from "react"
import { Spinner } from "../ui/spinner"

export function SetupAppLayout({ children }: PropsWithChildren) {
  if (!window.oidcConfiguration) {
    return (
      <div className='h-screen flex items-center justify-center text-gray-500'>
        <Spinner />
      </div>
    )
  }

  return (
    <OidcProvider configuration={window.oidcConfiguration}>
      {children}
    </OidcProvider>
  )
}
