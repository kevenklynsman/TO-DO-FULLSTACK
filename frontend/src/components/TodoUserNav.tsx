import { Button } from "@/components/ui/button"
import {
    
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, User2Icon } from "lucide-react"

export function PopoverDemo() {
    const { user, logout } = useAuth();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="cursor-pointer"><User2Icon size={16} /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-40">
        <div className="flex flex-col gap-2">

              {user && (
            <div className="flex items-center gap-2">
              <User2Icon size={16} />
              <span className="text-sm text-zinc-500">{user.name}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
