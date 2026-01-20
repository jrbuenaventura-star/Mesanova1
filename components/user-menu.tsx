'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, LayoutDashboard, Settings, LogOut, Building2, Users } from 'lucide-react'
import type { UserRole } from '@/lib/db/types'

interface UserData {
  email: string
  full_name?: string
  role: UserRole
}

export function UserMenu() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, role')
          .eq('id', authUser.id)
          .single()

        setUser({
          email: authUser.email || '',
          full_name: profile?.full_name,
          role: profile?.role || 'end_user',
        })
      }
      setIsLoading(false)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!session || event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getPanelLink = () => {
    switch (user?.role) {
      case 'superadmin':
        return '/admin'
      case 'distributor':
        return '/distributor'
      case 'aliado':
        return '/aliado'
      default:
        return '/perfil'
    }
  }

  const getPanelLabel = () => {
    switch (user?.role) {
      case 'superadmin':
        return 'Panel de Control'
      case 'distributor':
        return 'Panel Distribuidor'
      case 'aliado':
        return 'Panel Aliado'
      default:
        return 'Mi Perfil'
    }
  }

  const getPanelIcon = () => {
    switch (user?.role) {
      case 'superadmin':
        return <LayoutDashboard className="mr-2 h-4 w-4" />
      case 'distributor':
        return <Building2 className="mr-2 h-4 w-4" />
      case 'aliado':
        return <Users className="mr-2 h-4 w-4" />
      default:
        return <User className="mr-2 h-4 w-4" />
    }
  }

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="ghost" onClick={() => router.push('/auth/login')}>
        Iniciar Sesión
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user.full_name && (
              <p className="text-sm font-medium leading-none">{user.full_name}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(getPanelLink())}>
          {getPanelIcon()}
          {getPanelLabel()}
        </DropdownMenuItem>
        {user.role !== 'superadmin' && (
          <DropdownMenuItem onClick={() => router.push('/perfil/configuracion')}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
