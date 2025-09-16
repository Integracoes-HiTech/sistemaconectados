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
      console.log('🔍 Buscando membro referrer:', friendData.referrer);
      
      // Primeiro tentar busca exata
      const { data: membersData, error: memberError } = await supabase
        .from('members')
        .select('id, name')
        .eq('name', friendData.referrer)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      console.log('🔍 Resultado da busca exata:', { membersData, memberError });

      if (memberError) {
        console.error('❌ Erro ao buscar membro:', memberError);
        throw new Error(`Erro ao buscar membro referrer: ${memberError.message}`);
      }

      let memberData = membersData?.[0]; // Pegar o primeiro resultado

      if (!memberData) {
        // Tentar buscar com ILIKE para case-insensitive
        console.log('🔍 Tentando busca case-insensitive...');
        const { data: membersDataCaseInsensitive, error: memberErrorCaseInsensitive } = await supabase
          .from('members')
          .select('id, name')
          .ilike('name', friendData.referrer)
          .eq('status', 'Ativo')
          .is('deleted_at', null);

        console.log('🔍 Resultado da busca case-insensitive:', { membersDataCaseInsensitive, memberErrorCaseInsensitive });

        if (memberErrorCaseInsensitive) {
          throw new Error(`Erro ao buscar membro referrer: ${memberErrorCaseInsensitive.message}`);
        }

        memberData = membersDataCaseInsensitive?.[0]; // Pegar o primeiro resultado

        if (!memberData) {
          throw new Error(`Membro referrer "${friendData.referrer}" não encontrado na tabela members`);
        }
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
      console.log('🔄 Atualizando ranking dos membros...');
      
      // Atualizar ranking dos membros
      const { error: membersError } = await supabase.rpc('update_complete_ranking')
      if (membersError) {
        console.error('❌ Erro ao atualizar ranking dos membros:', membersError);
        // Continuar mesmo se falhar
      } else {
        console.log('✅ Ranking dos membros atualizado');
      }

      // Atualizar ranking dos amigos
      await updateFriendsRanking()

      // Recarregar dados após atualizar ranking
      await fetchFriends()
    } catch (err) {
      console.error('❌ Erro ao atualizar ranking:', err)
    }
  }

  const updateFriendsRanking = async () => {
    try {
      console.log('🔄 Atualizando ranking dos amigos...');
      
      // Atualizar ranking_position dos amigos baseado em contracts_completed
      const { error } = await supabase.rpc('update_friends_ranking')
      if (error) {
        console.error('❌ Erro ao atualizar ranking dos amigos:', error);
        // Tentar atualização manual se a função RPC falhar
        await updateFriendsRankingManually();
      } else {
        console.log('✅ Ranking dos amigos atualizado via RPC');
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar ranking dos amigos:', err)
    }
  }

  const updateFriendsRankingManually = async () => {
    try {
      console.log('🔄 Atualizando ranking dos amigos manualmente...');
      
      // Atualizar ranking_position dos amigos baseado em contracts_completed
      const { error } = await supabase
        .from('friends')
        .update({ 
          ranking_position: null, // Será recalculado
          updated_at: new Date().toISOString()
        })
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (error) {
        console.error('❌ Erro ao limpar ranking dos amigos:', error);
        return;
      }

      // Recalcular ranking_position
      const { data: friendsData, error: fetchError } = await supabase
        .from('friends')
        .select('id, contracts_completed, created_at')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Erro ao buscar amigos para ranking:', fetchError);
        return;
      }

      // Atualizar ranking_position
      for (let i = 0; i < friendsData.length; i++) {
        const friend = friendsData[i];
        const { error: updateError } = await supabase
          .from('friends')
          .update({ 
            ranking_position: i + 1,
            ranking_status: friend.contracts_completed >= 15 ? 'Verde' : 
                          friend.contracts_completed >= 1 ? 'Amarelo' : 'Vermelho',
            is_top_1500: i < 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', friend.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar ranking do amigo:', updateError);
        }
      }

      console.log('✅ Ranking dos amigos atualizado manualmente');
    } catch (err) {
      console.error('❌ Erro na atualização manual do ranking:', err);
    }
  }

  const softDeleteFriend = async (friendId: string) => {
    try {
      console.log('🗑️ Executando soft delete do amigo:', friendId);
      
      // Buscar dados do amigo antes de deletar
      const { data: friendData, error: fetchError } = await supabase
        .from('friends')
        .select('referrer')
        .eq('id', friendId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar dados do amigo:', fetchError);
        throw fetchError;
      }

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

      // Atualizar contadores do membro referrer
      if (friendData?.referrer) {
        console.log('🔄 Atualizando contadores após exclusão do amigo:', friendData.referrer);
        await updateMemberCountersAfterDelete(friendData.referrer);
      }

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

  // Função para atualizar contadores do membro após exclusão de amigo
  const updateMemberCountersAfterDelete = async (referrerName: string) => {
    try {
      console.log('🔄 Atualizando contadores após exclusão:', referrerName);
      
      // Buscar o membro referrer
      const { data: referrerMembers, error: referrerError } = await supabase
        .from('members')
        .select('id, name, contracts_completed')
        .eq('name', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      const referrerMember = referrerMembers?.[0];

      if (referrerError) {
        console.error('❌ Erro ao buscar referrer:', referrerError);
        return;
      }

      if (!referrerMember) {
        console.warn('⚠️ Referrer não encontrado:', referrerName);
        return;
      }

      // Contar amigos ativos cadastrados por este membro
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('id')
        .eq('referrer', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (friendsError) {
        console.error('❌ Erro ao contar amigos:', friendsError);
        return;
      }

      const friendsCount = friendsData?.length || 0;
      const currentContracts = referrerMember.contracts_completed;

      console.log(`📊 Contratos atuais: ${currentContracts}, Amigos ativos: ${friendsCount}`);

      // Atualizar contracts_completed
      console.log(`📉 Atualizando contratos após exclusão: ${currentContracts} → ${friendsCount}`);
      
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          contracts_completed: friendsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrerMember.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar contratos do membro:', updateError);
        return;
      }

      // Atualizar ranking e status
      await updateMemberRankingAndStatus(referrerMember.id, friendsCount);
      
      console.log('✅ Contadores do membro atualizados após exclusão');

    } catch (err) {
      console.error('❌ Erro ao atualizar contadores após exclusão:', err);
    }
  }

  // Função para atualizar ranking e status do membro
  const updateMemberRankingAndStatus = async (memberId: string, contractsCount: number) => {
    try {
      console.log('🔄 Atualizando ranking e status do membro:', memberId, 'Contratos:', contractsCount);
      
      // Calcular status baseado no número de contratos
      let rankingStatus = 'Vermelho';
      if (contractsCount >= 15) {
        rankingStatus = 'Verde';
      } else if (contractsCount >= 1) {
        rankingStatus = 'Amarelo';
      }

      // Atualizar status do membro
      const { error: statusError } = await supabase
        .from('members')
        .update({ 
          ranking_status: rankingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (statusError) {
        console.error('❌ Erro ao atualizar status do membro:', statusError);
      }

      // Atualizar ranking de todos os membros
      await updateAllMembersRanking();

    } catch (err) {
      console.error('❌ Erro ao atualizar ranking e status:', err);
    }
  }

  // Função para atualizar ranking de todos os membros
  const updateAllMembersRanking = async () => {
    try {
      console.log('🔄 Atualizando ranking de todos os membros...');
      
      // Buscar todos os membros ordenados por contratos
      const { data: membersData, error: fetchError } = await supabase
        .from('members')
        .select('id, contracts_completed, created_at')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Erro ao buscar membros para ranking:', fetchError);
        return;
      }

      // Atualizar ranking_position de cada membro
      for (let i = 0; i < membersData.length; i++) {
        const member = membersData[i];
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            ranking_position: i + 1,
            is_top_1500: i < 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar ranking do membro:', updateError);
        }
      }

      console.log('✅ Ranking de todos os membros atualizado');

    } catch (err) {
      console.error('❌ Erro ao atualizar ranking geral:', err);
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