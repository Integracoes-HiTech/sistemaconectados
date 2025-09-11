// hooks/useUsers.ts
import { useState, useEffect } from 'react'
import { supabase, User } from '@/lib/supabase'

export const useUsers = (referrer?: string) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Limpar estado anterior antes de buscar novos dados
    setUsers([])
    setError(null)
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

  const checkUserExists = async (email: string, phone: string) => {
    try {
      // Normalizar telefone para comparação (remover formatação)
      const normalizedPhone = phone.replace(/\D/g, '');
      
      // Verificar se já existe usuário com este email ou telefone
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone')

      if (error) throw error

      // Verificar manualmente para comparar telefones normalizados
      const existingUser = data?.find(user => {
        const userEmailMatch = user.email === email;
        const userPhoneMatch = user.phone?.replace(/\D/g, '') === normalizedPhone;
        return userEmailMatch || userPhoneMatch;
      });

      if (existingUser) {
        const conflictType = existingUser.email === email ? 'email' : 'telefone'
        const conflictValue = existingUser.email === email ? email : phone
        
        return {
          exists: true,
          user: existingUser,
          conflictType,
          conflictValue,
          message: `Usuário já cadastrado com este ${conflictType}: ${conflictValue}`
        }
      }

      return { exists: false }
    } catch (err) {
      return { 
        exists: false,
        error: err instanceof Error ? err.message : 'Erro ao verificar usuário existente' 
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
    deleteUser,
    checkUserExists
  }
}
