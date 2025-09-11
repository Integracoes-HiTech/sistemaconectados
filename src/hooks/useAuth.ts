// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const loggedUser = localStorage.getItem('loggedUser')
    if (loggedUser) {
      try {
        setUser(JSON.parse(loggedUser))
      } catch (error) {
        localStorage.removeItem('loggedUser')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)

      // Buscar usuário na tabela auth_users por username OU email
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .or(`username.eq.${username.toLowerCase()},email.eq.${username.toLowerCase()}`)
        .eq('password', password) // Em produção, usar hash da senha
        .single()

      if (error) throw error

      if (data) {
        const userData: AuthUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role,
          full_name: data.full_name,
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        setUser(userData)
        localStorage.setItem('loggedUser', JSON.stringify(userData))
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.name}!`,
        })

        return { success: true, user: userData }
      } else {
        throw new Error('Usuário ou senha incorretos')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no login'
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      })
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('loggedUser')
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
  }

  const isAuthenticated = () => {
    return user !== null
  }

  const isUsuario = () => {
    return user?.role === 'Usuário'
  }

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'Administrador' || user?.username === 'wegneycosta'
  }

  const isCoordenador = () => {
    return user?.role === 'Coordenador' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Usuário' || user?.username === 'wegneycosta'
  }

  const isColaborador = () => {
    return user?.role === 'Colaborador' || user?.role === 'Coordenador' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Usuário' || user?.username === 'wegneycosta'
  }

  const isVereador = () => {
    return user?.role === 'Vereador' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Usuário' || user?.username === 'wegneycosta'
  }

  const canViewAllUsers = () => {
    return isAdmin()
  }

  const canViewOwnUsers = () => {
    return isAdmin() || isVereador() || isCoordenador() || isColaborador()
  }

  const canViewStats = () => {
    return isAdmin() || isCoordenador() || isVereador()
  }

  const canGenerateLinks = () => {
    return isAdmin() || isCoordenador() || isVereador() || isColaborador()
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isCoordenador,
    isColaborador,
    isVereador,
    canViewAllUsers,
    canViewOwnUsers,
    canViewStats,
    canGenerateLinks
  }
}
