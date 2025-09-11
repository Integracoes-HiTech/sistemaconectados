// hooks/useUsers.ts
import { useState, useEffect } from 'react'
import { supabase, User } from '@/lib/supabase'

export const useUsers = (referrer?: string) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [referrer])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (referrer) {
        query = query.eq('referrer', referrer)
      }

      const { data, error } = await query

      if (error) throw error

      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()

      if (error) throw error

      if (data) {
        setUsers(prev => [data[0], ...prev])
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao adicionar usuário' 
      }
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      if (data) {
        setUsers(prev => prev.map(user => 
          user.id === id ? { ...user, ...data[0] } : user
        ))
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao atualizar usuário' 
      }
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error

      setUsers(prev => prev.filter(user => user.id !== id))
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao deletar usuário' 
      }
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser
  }
}
