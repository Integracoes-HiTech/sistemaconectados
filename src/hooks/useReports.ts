// hooks/useReports.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface ReportData {
  usersByLocation: Record<string, number>
  registrationsByDay: Array<{ date: string; count: number }>
  usersByStatus: Array<{ name: string; value: number; color: string }>
  recentActivity: Array<{
    id: string
    name: string
    action: string
    date: string
  }>
}

export const useReports = (referrer?: string) => {
  const [reportData, setReportData] = useState<ReportData>({
    usersByLocation: {},
    registrationsByDay: [],
    usersByStatus: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [referrer])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para usuários
      let query = supabase.from('users').select('*')
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }

      const { data: users, error } = await query

      if (error) throw error

      // Calcular dados para relatórios
      const usersByLocation = calculateUsersByLocation(users || [])
      const registrationsByDay = calculateRegistrationsByDay(users || [])
      const usersByStatus = calculateUsersByStatus(users || [])
      const recentActivity = calculateRecentActivity(users || [])

      setReportData({
        usersByLocation,
        registrationsByDay,
        usersByStatus,
        recentActivity
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados dos relatórios')
    } finally {
      setLoading(false)
    }
  }

  const calculateUsersByLocation = (users: any[]) => {
    return users.reduce((acc, user) => {
      const location = `${user.city} - ${user.neighborhood}`
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const calculateRegistrationsByDay = (users: any[]) => {
    const registrationsByDay = []
    
    // Últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const count = users.filter(user => user.registration_date === dateStr).length
      registrationsByDay.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count
      })
    }
    
    return registrationsByDay
  }

  const calculateUsersByStatus = (users: any[]) => {
    const activeUsers = users.filter(user => user.status === 'Ativo').length
    const inactiveUsers = users.filter(user => user.status === 'Inativo').length
    
    return [
      { name: "Ativos", value: activeUsers, color: "#10B981" },
      { name: "Inativos", value: inactiveUsers, color: "#EF4444" }
    ]
  }

  const calculateRecentActivity = (users: any[]) => {
    return users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(user => ({
        id: user.id,
        name: user.name,
        action: 'Cadastro realizado',
        date: new Date(user.created_at).toLocaleDateString('pt-BR')
      }))
  }

  return {
    reportData,
    loading,
    error,
    refetch: fetchReportData
  }
}
