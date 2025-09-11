// hooks/useUserLinks.ts
import { useState, useEffect } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'

export interface UserLink {
  id: string
  link_id: string
  user_id: string
  referrer_name: string
  is_active: boolean
  click_count: number
  registration_count: number
  created_at: string
  expires_at?: string
  updated_at: string
  user_data?: AuthUser
}

export const useUserLinks = (userId?: string) => {
  const [userLinks, setUserLinks] = useState<UserLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserLinks()
  }, [userId])

  const fetchUserLinks = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Se userId for fornecido, filtrar por usuário
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      setUserLinks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar links')
    } finally {
      setLoading(false)
    }
  }

  const getUserByLinkId = async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('link_id', linkId)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Link não encontrado' 
      }
    }
  }

  const createUserLink = async (userId: string, linkId: string, referrerName: string, expiresAt?: string) => {
    try {
      const { data, error } = await supabase
        .from('user_links')
        .insert([{
          user_id: userId,
          link_id: linkId,
          referrer_name: referrerName,
          expires_at: expiresAt,
          is_active: true,
          click_count: 0,
          registration_count: 0
        }])
        .select()

      if (error) throw error

      if (data) {
        setUserLinks(prev => [data[0], ...prev])
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar link' 
      }
    }
  }

  const deactivateUserLink = async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_links')
        .update({ is_active: false })
        .eq('link_id', linkId)
        .select()

      if (error) throw error

      if (data) {
        setUserLinks(prev => prev.map(link => 
          link.link_id === linkId ? { ...link, is_active: false } : link
        ))
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao desativar link' 
      }
    }
  }

  // Função para incrementar contador de cliques
  const incrementClickCount = async (linkId: string) => {
    try {
      // Primeiro buscar o valor atual do click_count
      const { data: currentData, error: fetchError } = await supabase
        .from('user_links')
        .select('click_count')
        .eq('link_id', linkId)
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError

      const { data, error } = await supabase
        .from('user_links')
        .update({ 
          click_count: (currentData?.click_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('link_id', linkId)
        .eq('is_active', true)
        .select()

      if (error) throw error

      if (data) {
        // Atualizar estado local
        setUserLinks(prev => prev.map(link => 
          link.link_id === linkId ? { ...link, click_count: link.click_count + 1 } : link
        ))
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao incrementar contador de cliques' 
      }
    }
  }

  // Função para criar link único por usuário
  const createLink = async (userId: string, referrerName: string, expiresAt?: string) => {
    try {
      // Verificar se já existe um link ativo para este usuário
      const { data: existingLinks, error: fetchError } = await supabase
        .from('user_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (fetchError) throw fetchError

      if (existingLinks && existingLinks.length > 0) {
        // Se já existe, retornar o link existente
        const existingLink = existingLinks[0]
        return { 
          success: true, 
          data: existingLink,
          message: 'Link já existe para este usuário'
        }
      }

      // Gerar linkId único baseado no userId
      const linkId = `user-${userId}`
      
      return await createUserLink(userId, linkId, referrerName, expiresAt)
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar link' 
      }
    }
  }

  return {
    userLinks,
    loading,
    error,
    fetchUserLinks,
    getUserByLinkId,
    createUserLink,
    createLink,
    deactivateUserLink,
    incrementClickCount
  }
}