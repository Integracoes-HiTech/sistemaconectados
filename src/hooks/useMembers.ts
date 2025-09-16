// hooks/useMembers.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Member {
  id: string
  name: string
  phone: string
  instagram: string
  city: string
  sector: string
  referrer: string
  registration_date: string
  status: 'Ativo' | 'Inativo'
  // Dados da segunda pessoa (obrigatório - regra do casal)
  couple_name: string
  couple_phone: string
  couple_instagram: string
  couple_city: string
  couple_sector: string
  // Campos específicos do sistema de membros
  contracts_completed: number
  ranking_position: number | null
  ranking_status: 'Verde' | 'Amarelo' | 'Vermelho'
  is_top_1500: boolean
  can_be_replaced: boolean
  // Campo para distinguir membros de amigos
  is_friend?: boolean
  // Campo para soft delete
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export interface MemberStats {
  total_members: number
  green_members: number
  yellow_members: number
  red_members: number
  top_1500_members: number
  current_member_count: number
  max_member_limit: number
  can_register_more: boolean
}

export interface SystemSettings {
  max_members: number
  contracts_per_member: number
  ranking_green_threshold: number
  ranking_yellow_threshold: number
  paid_contracts_phase_active: boolean
  paid_contracts_start_date: string
}

export const useMembers = (referrer?: string) => {
  const [members, setMembers] = useState<Member[]>([])
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para membros - filtrar apenas os não excluídos
      let query = supabase.from('members').select('*').is('deleted_at', null)
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }

      const { data: membersData, error: membersError } = await query
      if (membersError) throw membersError

      setMembers(membersData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }, [referrer])

  const fetchMemberStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_system_stats')
        .select('*')
        .single()

      if (error) throw error

      const stats: MemberStats = {
        total_members: data.total_members || 0,
        green_members: data.green_members || 0,
        yellow_members: data.yellow_members || 0,
        red_members: data.red_members || 0,
        top_1500_members: data.top_1500_members || 0,
        current_member_count: data.current_member_count || 0,
        max_member_limit: data.max_member_limit || 1500,
        can_register_more: (data.current_member_count || 0) < (data.max_member_limit || 1500)
      }

      setMemberStats(stats)
    } catch (err) {
      console.error('Erro ao carregar estatísticas dos membros:', err)
    }
  }, [])

  const fetchSystemSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')

      if (error) throw error

      const settings: SystemSettings = {
        max_members: 1500,
        contracts_per_member: 15,
        ranking_green_threshold: 15,
        ranking_yellow_threshold: 1,
        paid_contracts_phase_active: false,
        paid_contracts_start_date: '2025-07-01'
      }

      // Converter dados do banco para objeto
      data?.forEach(item => {
        switch (item.setting_key) {
          case 'max_members':
            settings.max_members = parseInt(item.setting_value)
            break
          case 'contracts_per_member':
            settings.contracts_per_member = parseInt(item.setting_value)
            break
          case 'ranking_green_threshold':
            settings.ranking_green_threshold = parseInt(item.setting_value)
            break
          case 'ranking_yellow_threshold':
            settings.ranking_yellow_threshold = parseInt(item.setting_value)
            break
          case 'paid_contracts_phase_active':
            settings.paid_contracts_phase_active = item.setting_value === 'true'
            break
          case 'paid_contracts_start_date':
            settings.paid_contracts_start_date = item.setting_value
            break
        }
      })

      setSystemSettings(settings)
    } catch (err) {
      console.error('Erro ao carregar configurações do sistema:', err)
    }
  }, [])

  const addMember = async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'contracts_completed' | 'ranking_position' | 'ranking_status' | 'is_top_1500' | 'can_be_replaced'>) => {
    try {
      console.log('🔍 Hook useMembers - Dados recebidos:', memberData);
      
      // Verificar se pode cadastrar mais membros
      console.log('🔍 Verificando se pode cadastrar mais membros...');
      const { data: canRegister, error: canRegisterError } = await supabase
        .rpc('can_register_member')

      console.log('🔍 Resultado da verificação:', { canRegister, canRegisterError });

      if (canRegisterError) {
        console.error('❌ Erro na verificação de limite:', canRegisterError);
        throw canRegisterError;
      }

      if (!canRegister) {
        throw new Error('Limite de 1.500 membros atingido. Não é possível cadastrar novos membros.')
      }

      console.log('🔍 Inserindo membro no banco...');
      const insertData = {
        ...memberData,
        contracts_completed: 0,
        ranking_status: 'Vermelho',
        is_top_1500: false,
        can_be_replaced: false,
        is_friend: memberData.is_friend || false
      };
      
      console.log('🔍 Dados para inserção:', insertData);

      const { data, error } = await supabase
        .from('members')
        .insert([insertData])
        .select()
        .single()

      console.log('🔍 Resultado da inserção:', { data, error });

      if (error) {
        console.error('❌ Erro na inserção:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Membro inserido com sucesso:', data);

      // Se é um amigo (contrato pago), atualizar contratos do referrer
      if (memberData.is_friend && memberData.referrer) {
        await updateReferrerContracts(memberData.referrer);
      }

      // Atualizar ranking após adicionar membro
      await updateRanking()
      
      // Recarregar estatísticas para atualizar contadores
      await fetchMemberStats()

      return { success: true, data }
    } catch (err) {
      console.error('❌ Erro geral no addMember:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao adicionar membro' 
      }
    }
  }

  const updateReferrerContracts = async (referrerName: string) => {
    try {
      console.log('🔄 Atualizando contratos do referrer:', referrerName);
      
      // Buscar o membro referrer pelo nome
      const { data: referrerMembers, error: referrerError } = await supabase
        .from('members')
        .select('id, name, contracts_completed')
        .eq('name', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      const referrerMember = referrerMembers?.[0]; // Pegar o primeiro resultado

      if (referrerError) {
        console.error('❌ Erro ao buscar referrer:', referrerError);
        return;
      }

      if (!referrerMember) {
        console.warn('⚠️ Referrer não encontrado:', referrerName);
        return;
      }

      // Incrementar contratos completados
      const newContractsCount = referrerMember.contracts_completed + 1;
      
      console.log(`📈 Incrementando contratos de ${referrerMember.name}: ${referrerMember.contracts_completed} → ${newContractsCount}`);

      // Atualizar contratos do referrer
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          contracts_completed: newContractsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrerMember.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar contratos do referrer:', updateError);
        return;
      }

      console.log('✅ Contratos do referrer atualizados com sucesso');
      
      // Atualizar ranking após mudança nos contratos
      await updateRanking();
      
    } catch (err) {
      console.error('❌ Erro ao atualizar contratos do referrer:', err);
    }
  }

  const updateRanking = async () => {
    try {
      const { error } = await supabase.rpc('update_complete_ranking')
      if (error) throw error

      // Recarregar dados após atualizar ranking
      await fetchMembers()
      await fetchMemberStats()
    } catch (err) {
      console.error('Erro ao atualizar ranking:', err)
    }
  }

  const getRankingStatusColor = (status: 'Verde' | 'Amarelo' | 'Vermelho') => {
    switch (status) {
      case 'Verde':
        return 'text-green-600 bg-green-100'
      case 'Amarelo':
        return 'text-yellow-600 bg-yellow-100'
      case 'Vermelho':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRankingStatusIcon = (status: 'Verde' | 'Amarelo' | 'Vermelho') => {
    switch (status) {
      case 'Verde':
        return '🟢'
      case 'Amarelo':
        return '🟡'
      case 'Vermelho':
        return '🔴'
      default:
        return '⚪'
    }
  }

  const canReplaceMember = (member: Member) => {
    return member.ranking_status === 'Vermelho' && !member.is_top_1500
  }

  const getMembersByStatus = (status: 'Verde' | 'Amarelo' | 'Vermelho') => {
    return members.filter(member => member.ranking_status === status)
  }

  const getTopMembers = (limit: number = 10) => {
    return members
      .filter(member => member.status === 'Ativo')
      .sort((a, b) => (a.ranking_position || 999) - (b.ranking_position || 999))
      .slice(0, limit)
  }

  const getReplaceableMembers = () => {
    return members.filter(member => canReplaceMember(member))
  }

  const getMemberRole = (member: Member) => {
    switch (member.ranking_status) {
      case 'Verde':
        return 'Coordenador'
      case 'Amarelo':
        return 'Membro Ativo'
      case 'Vermelho':
        return 'Membro'
      default:
        return 'Membro'
    }
  }

  // Função para soft delete (exclusão lógica)
  const softDeleteMember = async (memberId: string) => {
    try {
      console.log('🗑️ Executando soft delete do membro:', memberId);
      
      const { data, error } = await supabase
        .rpc('soft_delete_member', { member_id: memberId })

      if (error) {
        console.error('❌ Erro no soft delete:', error);
        throw error;
      }

      console.log('✅ Soft delete executado com sucesso:', data);

      // Recarregar dados após exclusão
      await fetchMembers();
      await fetchMemberStats();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Erro geral no softDeleteMember:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao excluir membro' 
      };
    }
  }



  useEffect(() => {
    fetchMembers()
    fetchMemberStats()
    fetchSystemSettings()
  }, [fetchMembers, fetchMemberStats, fetchSystemSettings])

  return {
    members,
    memberStats,
    systemSettings,
    loading,
    error,
    addMember,
    updateRanking,
    getRankingStatusColor,
    getRankingStatusIcon,
    canReplaceMember,
    getMembersByStatus,
    getTopMembers,
    getReplaceableMembers,
    getMemberRole,
    softDeleteMember,
    refetch: fetchMembers
  }
}
