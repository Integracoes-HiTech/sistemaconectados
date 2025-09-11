// hooks/useCredentials.ts
import { useState } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'

export interface Credentials {
  username: string
  password: string
  login_url: string
}

export const useCredentials = () => {
  const [loading, setLoading] = useState(false)

  // Gerar credenciais automáticas baseadas no email
  const generateCredentials = (userData: any): Credentials => {
    const username = userData.email.split('@')[0].toLowerCase()
    const password = Math.random().toString(36).slice(-8) // Senha aleatória de 8 caracteres
    
    return {
      username,
      password,
      login_url: `${window.location.origin}/login`
    }
  }

  // Criar usuário de autenticação com credenciais geradas
  const createAuthUser = async (userData: any, credentials: Credentials) => {
    try {
      setLoading(true)

      const authUserData = {
        username: credentials.username,
        password: credentials.password,
        name: userData.name,
        role: 'Usuário',
        full_name: `${userData.name} - Usuário`,
        email: userData.email,
        phone: userData.phone,
        is_active: true
      }

      const { data, error } = await supabase
        .from('auth_users')
        .insert([authUserData])
        .select()

      if (error) throw error

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar usuário de autenticação' 
      }
    } finally {
      setLoading(false)
    }
  }

  // Verificar se username já existe
  const checkUsernameExists = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('username')
        .eq('username', username)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      
      return { exists: !!data }
    } catch (err) {
      return { 
        exists: false, 
        error: err instanceof Error ? err.message : 'Erro ao verificar username' 
      }
    }
  }

  // Gerar username único
  const generateUniqueUsername = async (baseUsername: string) => {
    let username = baseUsername
    let counter = 1

    while (true) {
      const { exists } = await checkUsernameExists(username)
      if (!exists) break
      
      username = `${baseUsername}${counter}`
      counter++
    }

    return username
  }

  // Processo completo: gerar credenciais únicas e criar usuário
  const createUserWithCredentials = async (userData: any): Promise<{
    success: true;
    credentials: Credentials;
    authUser: any;
  } | {
    success: false;
    error: string;
  }> => {
    try {
      setLoading(true)

      // Gerar credenciais base
      const baseCredentials = generateCredentials(userData)
      
      // Garantir username único
      const uniqueUsername = await generateUniqueUsername(baseCredentials.username)
      
      const finalCredentials = {
        ...baseCredentials,
        username: uniqueUsername
      }

      // Criar usuário de autenticação
      const authResult = await createAuthUser(userData, finalCredentials)
      
      if (!authResult.success) {
        return authResult
      }

      return { 
        success: true, 
        credentials: finalCredentials,
        authUser: authResult.data
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar usuário com credenciais' 
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    generateCredentials,
    createAuthUser,
    checkUsernameExists,
    generateUniqueUsername,
    createUserWithCredentials
  }
}
