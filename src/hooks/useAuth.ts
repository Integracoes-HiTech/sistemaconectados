// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se há usuário logado no localStorage com validação
    const loggedUser = localStorage.getItem('loggedUser')
    if (loggedUser) {
      try {
        const userData = JSON.parse(loggedUser)
        
        // Validar estrutura dos dados
        if (!userData.id || !userData.username || !userData.role) {
          console.warn('🚨 Dados de usuário inválidos no localStorage, removendo...')
          localStorage.removeItem('loggedUser')
          setUser(null)
        } else {
          // Validar se o usuário ainda existe no banco
          validateUserSession(userData)
        }
      } catch (error) {
        console.warn('🚨 Erro ao parsear dados do localStorage, removendo...', error)
        localStorage.removeItem('loggedUser')
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  // Função para validar se a sessão ainda é válida
  const validateUserSession = async (userData: AuthUser) => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, username, role, is_active, display_name')
        .eq('id', userData.id)
        .eq('username', userData.username)
        .single()

      if (error || !data || !data.is_active) {
        console.warn('🚨 Sessão inválida, fazendo logout...')
        localStorage.removeItem('loggedUser')
        setUser(null)
        return
      }

      // Atualizar dados do usuário se necessário
      if (data.role !== userData.role || data.display_name !== userData.display_name) {
        console.log('🔄 Dados atualizados, sincronizando...')
        const updatedUser = { 
          ...userData, 
          role: data.role,
          display_name: data.display_name
        }
        setUser(updatedUser)
        localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
      } else {
        setUser(userData)
      }
    } catch (error) {
      console.warn('🚨 Erro ao validar sessão, fazendo logout...', error)
      localStorage.removeItem('loggedUser')
      setUser(null)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)

      // Normalizar username (remover @ e converter para minúsculo)
      const normalizedUsername = username.replace('@', '').toLowerCase()

      // Buscar usuário na tabela auth_users por username
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', normalizedUsername)
        .eq('password', password) // Em produção, usar hash da senha
        .single()

      if (error) throw error

      if (data) {
        // Ativar usuário após login bem-sucedido
        await supabase
          .from('auth_users')
          .update({ 
            is_active: true,
            last_login: new Date().toISOString()
          })
          .eq('id', data.id)

        // Atualizar status do usuário na tabela users para "Ativo"
        await supabase
          .from('users')
          .update({ 
            status: 'Ativo',
            updated_at: new Date().toISOString()
          })
          .eq('instagram', data.instagram)

        const userData: AuthUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role,
          full_name: data.full_name,
          display_name: data.display_name,
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        setUser(userData)
        localStorage.setItem('loggedUser', JSON.stringify(userData))
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.display_name || data.name}!`,
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

  const isMembro = () => {
    return user?.role === 'Membro' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Convidado' || user?.username === 'wegneycosta'
  }

  const isAmigo = () => {
    return user?.role === 'Amigo' || user?.role === 'Membro' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Convidado' || user?.username === 'wegneycosta'
  }

  const isConvidado = () => {
    return user?.role === 'Convidado' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Convidado' || user?.username === 'wegneycosta'
  }

  const canViewAllUsers = () => {
    return isAdmin()
  }

  const canViewOwnUsers = () => {
    return isAdmin() || isConvidado() || isMembro() || isAmigo()
  }

  const canViewStats = () => {
    return isAdmin() || isMembro() || isConvidado()
  }

  const canGenerateLinks = () => {
    return isAdmin() || isMembro() || isConvidado() || isAmigo()
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isMembro,
    isAmigo,
    isConvidado,
    canViewAllUsers,
    canViewOwnUsers,
    canViewStats,
    canGenerateLinks
  }
}