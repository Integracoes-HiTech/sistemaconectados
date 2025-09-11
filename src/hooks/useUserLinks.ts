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

export const useUserLinks = () => {
  const [userLinks, setUserLinks] = useState<UserLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserLinks()
  }, [])

  const fetchUserLinks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

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

  // Função para criar link (wrapper para createUserLink)
  const createLink = async (userId: string, referrerName: string, expiresAt?: string) => {
    // Gerar linkId único baseado no username e timestamp
    const username = referrerName.split(' ')[0].toLowerCase();
    const timestamp = Date.now();
    const linkId = `${username}-${timestamp}`;
    
    return await createUserLink(userId, linkId, referrerName, expiresAt);
  };

  return {
    userLinks,
    loading,
    error,
    fetchUserLinks,
    getUserByLinkId,
    createUserLink,
    createLink,
    deactivateUserLink
  }
}