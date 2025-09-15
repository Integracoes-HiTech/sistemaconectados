import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Friend {
  id: string
  member_id: string
  // Mesma estrutura de membros
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
  // Campos específicos do sistema de amigos (mesma lógica de membros)
  contracts_completed: number
  ranking_position: number | null
  ranking_status: 'Verde' | 'Amarelo' | 'Vermelho'
  is_top_1500: boolean
  can_be_replaced: boolean
  // Campos de verificação de posts (específicos de amigos)
  post_verified_1: boolean
  post_verified_2: boolean
  post_url_1: string | null
  post_url_2: string | null
  // Campo para soft delete
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })

      if (fetchError) throw fetchError

      setFriends(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar amigos')
    } finally {
      setLoading(false)
    }
  }, [])

  const addFriend = async (friendData: Omit<Friend, 'id' | 'created_at' | 'updated_at' | 'contracts_completed' | 'ranking_position' | 'ranking_status' | 'is_top_1500' | 'can_be_replaced' | 'post_verified_1' | 'post_verified_2' | 'post_url_1' | 'post_url_2'>) => {
    try {
      console.log('🔍 Hook useFriends - Dados recebidos:', friendData);
      
      // Buscar o ID do membro que está cadastrando o amigo
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('name', friendData.referrer)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .single();

      if (memberError || !memberData) {
        throw new Error(`Membro referrer "${friendData.referrer}" não encontrado`);
      }

      console.log('🔍 Membro referrer encontrado:', memberData);

      const insertData = {
        ...friendData,
        member_id: memberData.id,
        contracts_completed: 0,
        ranking_status: 'Vermelho' as const,
        is_top_1500: false,
        can_be_replaced: false,
        post_verified_1: false,
        post_verified_2: false,
        post_url_1: null,
        post_url_2: null
      };
      
      console.log('🔍 Dados para inserção:', insertData);

      const { data, error } = await supabase
        .from('friends')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro na inserção:', error);
        throw error;
      }

      console.log('✅ Amigo inserido com sucesso:', data);

      // Atualizar contratos do membro referrer
      await updateReferrerContracts(friendData.referrer);

      // Recarregar dados
      await fetchFriends()

      return { success: true, data }
    } catch (err) {
      console.error('❌ Erro geral no addFriend:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao adicionar amigo' 
      }
    }
  }

  const updateReferrerContracts = async (referrerName: string) => {
    try {
      console.log('🔄 Atualizando contratos do referrer:', referrerName);
      
      // Buscar o membro referrer pelo nome
      const { data: referrerMember, error: referrerError } = await supabase
        .from('members')
        .select('id, name, contracts_completed')
        .eq('name', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .single();

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
      // Atualizar ranking dos membros
      const { error: membersError } = await supabase.rpc('update_complete_ranking')
      if (membersError) throw membersError

      // Atualizar ranking dos amigos
      await updateFriendsRanking()

      // Recarregar dados após atualizar ranking
      await fetchFriends()
    } catch (err) {
      console.error('Erro ao atualizar ranking:', err)
    }
  }

  const updateFriendsRanking = async () => {
    try {
      // Atualizar ranking_position dos amigos baseado em contracts_completed
      const { error } = await supabase.rpc('update_friends_ranking')
      if (error) throw error
    } catch (err) {
      console.error('Erro ao atualizar ranking dos amigos:', err)
    }
  }

  const softDeleteFriend = async (friendId: string) => {
    try {
      console.log('🗑️ Executando soft delete do amigo:', friendId);
      
      const { data, error } = await supabase
        .from('friends')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'Inativo'
        })
        .eq('id', friendId)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro no soft delete:', error);
        throw error;
      }

      console.log('✅ Soft delete executado com sucesso:', data);

      // Recarregar dados após exclusão
      await fetchFriends();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Erro geral no softDeleteFriend:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao excluir amigo' 
      };
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return {
    friends,
    loading,
    error,
    addFriend,
    updateRanking,
    softDeleteFriend,
    refetch: fetchFriends
  }
}