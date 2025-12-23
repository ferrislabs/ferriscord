import { Compass, Ellipsis, Inbox, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Link, useNavigate } from "@tanstack/react-router"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Server } from "@/lib/queries/community-types"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useCreateServer, useServers, useChannels } from "@/lib/queries/community-queries"
import { useInView } from "react-intersection-observer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddServerForm } from "@/components/forms/add-server-form"
import { useForm } from "react-hook-form"
import type z from "zod"
import { addServerFormSchema } from "@/lib/validation/add-server-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"


interface NavLinkButtonProps {
  to: string
  icon: LucideIcon
  tooltip: string
}

function NavLinkButton({ to, icon: Icon, tooltip }: NavLinkButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={to}>
          <Button variant="nav" size="icon-sm" aria-label={tooltip} className="cursor-pointer">
            <Icon className="text-muted-foreground h-4 w-4" />
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

interface ServerButtonProps {
  server: Server
}

function ServerButton({ server }: ServerButtonProps) {
  const navigate = useNavigate()
  const { data: channels } = useChannels(server.id)

  const handleServerClick = async () => {
    // Navigate to first text channel, or first channel if no text channel exists
    const firstChannel = channels?.find(ch => ch.type === 'text') || channels?.[0]
    if (firstChannel) {
      navigate({
        to: '/channels/$serverId/$channelId',
        params: { serverId: String(server.id), channelId: String(firstChannel.id) }
      })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="nav"
          size="icon-sm"
          className="cursor-pointer bg-transparent"
          onClick={handleServerClick}
        >
          <Avatar className="h-7 w-7 rounded-sm">
            <AvatarImage src={server.picture_url ?? undefined} alt={server.name} />
            <AvatarFallback className="text-sm">
              {server.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{server.name}</TooltipContent>
    </Tooltip>
  )
}

export default function ServerNav() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { ref, inView } = useInView()
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState<boolean>(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const {
    data: servers,
    isError: serversError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useServers()
  const {
    mutateAsync: createServer,
    isPending: isCreatingServer,
    isError: isCreateServerError,
    isSuccess: isCreateServerSuccess,
    data: createdServer,
  } = useCreateServer()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Handle errors (Could be replaced with a toast notification)
  useEffect(() => {
    if (serversError) {
      toast.error(t("serverNav.error_loading_servers"))
    }
  }, [serversError, t])

  const addServerForm = useForm<z.infer<typeof addServerFormSchema>>({
    resolver: zodResolver(addServerFormSchema),
    defaultValues: {
      name: "",
      description: "",
      picture_url: "",
      banner_url: "",
      visibility: "Public",
    },
  })

  const onSubmitAddServer = async (values: z.infer<typeof addServerFormSchema>) => {
    createServer({
      name: values.name,
      description: values.description,
      picture_url: values.picture_url,
      banner_url: values.banner_url,
      visibility: values.visibility,
    })
  }

  useEffect(() => {
    if (isCreateServerSuccess && createdServer) {
      queryClient.invalidateQueries({ queryKey: ["servers"] })
      setIsCreateServerModalOpen(false)
      toast.success(t("serverNav.success_creating_server"))
      // Will be handled by clicking the server button
    } else if (isCreateServerError) {
      toast.error(t("serverNav.error_creating_server"))
    }
  }, [isCreateServerError, isCreateServerSuccess, createdServer, t, queryClient])

  useEffect(() => {
    if (!isCreateServerModalOpen) {
      addServerForm.reset()
    }
  }, [isCreateServerModalOpen, addServerForm])

  return (
    <TooltipProvider>
      <nav className="bg-sidebar border-sidebar-border flex h-screen flex-col items-center gap-2 border-l p-2">
        <NavLinkButton to="/channels/@me" icon={Inbox} tooltip={t("serverNav.messages")} />
        <NavLinkButton to="/explore" icon={Compass} tooltip={t("serverNav.explore")} />

        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="nav" size="icon-sm" className="cursor-pointer">
                  <Ellipsis className="text-muted-foreground h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{t("serverNav.more_options")}</TooltipContent>
            <DropdownMenuContent side="left" align="start" sideOffset={4}>
              <DropdownMenuItem
                className="text-responsive-base!"
                onSelect={(e) => {
                  e.preventDefault()
                  setIsCreateServerModalOpen(true)
                }}
              >
                {t("serverNav.create_server")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-responsive-base!">
                {t("serverNav.join_server")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tooltip>

        <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto">
          {servers?.pages
            .flatMap((page) => page.data)
            .map((server) => (
              <ServerButton key={server.id} server={server} />
            ))}
          <button
            ref={ref}
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          ></button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="nav"
              size="icon-sm"
              className="cursor-pointer"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="text-muted-foreground h-4 w-4" />
              ) : (
                <Sun className="text-muted-foreground h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {theme === 'light' ? t("serverNav.dark_mode") : t("serverNav.light_mode")}
          </TooltipContent>
        </Tooltip>

        <Dialog open={isCreateServerModalOpen} onOpenChange={setIsCreateServerModalOpen}>
          <form>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("serverNav.modal.title")}</DialogTitle>
              </DialogHeader>
              <AddServerForm
                form={addServerForm}
                loading={isCreatingServer}
                onSubmit={onSubmitAddServer}
              />
            </DialogContent>
          </form>
        </Dialog>
      </nav>
    </TooltipProvider>
  )
}
