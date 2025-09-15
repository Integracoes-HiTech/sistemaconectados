import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface FriendRanking {
  id: string;
  member_id: string;
  // Dados do amigo (mesma estrutura de membros)
  name: string;
  phone: string;
  instagram: string;
  city: string;
  sector: string;
  referrer: string;
  registration_date: string;
  status: string;
  couple_name: string;
  couple_phone: string;
  couple_instagram: string;
  couple_city: string;
  couple_sector: string;
  contracts_completed: number; // Quantos usuários este amigo cadastrou
  ranking_position: number;
  ranking_status: 'Verde' | 'Amarelo' | 'Vermelho';
  is_top_1500: boolean;
  can_be_replaced: boolean;
  post_verified_1: boolean;
  post_verified_2: boolean;
  post_url_1: string | null;
  post_url_2: string | null;
  created_at: string;
  updated_at: string;
  // Dados do membro que cadastrou
  member_name: string;
  member_instagram: string;
  member_phone: string;
  member_city: string;
  member_sector: string;
}

export const useFriendsRanking = () => {
  const [friends, setFriends] = useState<FriendRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendsRanking = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando ranking dos amigos...');

      const { data, error: fetchError } = await supabase
        .from('v_friends_ranking')
        .select('*')
        .order('contracts_completed', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Erro ao buscar ranking dos amigos:', fetchError);
        setError(`Erro ao buscar dados: ${fetchError.message}`);
        return;
      }

      console.log('✅ Ranking dos amigos carregado:', data);
      setFriends(data || []);
    } catch (err) {
      console.error('❌ Erro geral ao buscar ranking dos amigos:', err);
      setError('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const addFriendReferral = async (friendId: string, referralData: {
    name: string;
    phone: string;
    instagram: string;
    city: string;
    sector: string;
    instagram_post?: string;
    hashtag?: string;
  }) => {
    try {
      console.log('🔍 Adicionando referência de amigo:', { friendId, referralData });

      const { data, error } = await supabase
        .from('friend_referrals')
        .insert([{
          friend_id: friendId,
          referred_user_name: referralData.name,
          referred_user_phone: referralData.phone,
          referred_user_instagram: referralData.instagram,
          referred_user_city: referralData.city,
          referred_user_sector: referralData.sector,
          instagram_post: referralData.instagram_post,
          hashtag: referralData.hashtag,
          post_verified: false
        }])
        .select();

      if (error) {
        console.error('❌ Erro ao adicionar referência:', error);
        throw new Error(`Erro ao adicionar referência: ${error.message}`);
      }

      console.log('✅ Referência adicionada com sucesso:', data);
      
      // Atualizar contador de usuários cadastrados no amigo
      await updateUsersCadastradosCount(friendId);
      
      // Recarrega o ranking após adicionar uma nova referência
      await fetchFriendsRanking();
      
      return data;
    } catch (err) {
      console.error('❌ Erro geral ao adicionar referência:', err);
      throw err;
    }
  };

  const getFriendsByMember = async (memberId: string) => {
    try {
      console.log('🔍 Buscando amigos do membro:', memberId);

      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          members!inner(name, instagram, phone, city, sector)
        `)
        .eq('member_id', memberId)
        .eq('status', 'Ativo')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar amigos do membro:', error);
        throw new Error(`Erro ao buscar amigos: ${error.message}`);
      }

      console.log('✅ Amigos do membro carregados:', data);
      return data || [];
    } catch (err) {
      console.error('❌ Erro geral ao buscar amigos do membro:', err);
      throw err;
    }
  };

  const getFriendReferrals = async (friendId: string) => {
    try {
      console.log('🔍 Buscando referências do amigo:', friendId);

      const { data, error } = await supabase
        .from('friend_referrals')
        .select('*')
        .eq('friend_id', friendId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar referências do amigo:', error);
        throw new Error(`Erro ao buscar referências: ${error.message}`);
      }

      console.log('✅ Referências do amigo carregadas:', data);
      return data || [];
    } catch (err) {
      console.error('❌ Erro geral ao buscar referências do amigo:', err);
      throw err;
    }
  };

  const verifyInstagramPost = async (referralId: string, verified: boolean) => {
    try {
      console.log('🔍 Verificando post do Instagram:', { referralId, verified });

      const { data, error } = await supabase
        .from('friend_referrals')
        .update({ post_verified: verified })
        .eq('id', referralId)
        .select();

      if (error) {
        console.error('❌ Erro ao verificar post:', error);
        throw new Error(`Erro ao verificar post: ${error.message}`);
      }

      console.log('✅ Post verificado com sucesso:', data);
      
      // Recarrega o ranking após verificar o post
      await fetchFriendsRanking();
      
      return data;
    } catch (err) {
      console.error('❌ Erro geral ao verificar post:', err);
      throw err;
    }
  };

  const updateUsersCadastradosCount = async (friendId: string) => {
    try {
      console.log('🔍 Atualizando contador de usuários cadastrados:', friendId);

      // Contar referências ativas para este amigo
      const { count, error: countError } = await supabase
        .from('friend_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', friendId)
        .eq('referral_status', 'Ativo');

      if (countError) {
        console.error('❌ Erro ao contar referências:', countError);
        return;
      }

      // Atualizar contador na tabela friends
      const { error: updateError } = await supabase
        .from('friends')
        .update({ 
          contracts_completed: count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', friendId);

      if (updateError) {
        console.error('❌ Erro ao atualizar contador:', updateError);
        return;
      }

      console.log('✅ Contador atualizado:', count);
    } catch (err) {
      console.error('❌ Erro geral ao atualizar contador:', err);
    }
  };

  const getFriendsStats = () => {
    const total = friends.length;
    const verde = friends.filter(f => f.ranking_status === 'Verde').length;
    const amarelo = friends.filter(f => f.ranking_status === 'Amarelo').length;
    const vermelho = friends.filter(f => f.ranking_status === 'Vermelho').length;

    return {
      total,
      verde,
      amarelo,
      vermelho
    };
  };

  useEffect(() => {
    fetchFriendsRanking();
  }, []);

  return {
    friends,
    loading,
    error,
    fetchFriendsRanking,
    addFriendReferral,
    getFriendsByMember,
    getFriendReferrals,
    verifyInstagramPost,
    getFriendsStats
  };
};
