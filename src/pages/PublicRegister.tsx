import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Instagram, UserPlus, MapPin, Building, AlertCircle, LogIn, ExternalLink } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserLinks, UserLink } from "@/hooks/useUserLinks";

// Interface estendida para incluir link_type
interface ExtendedUserLink extends UserLink {
  link_type: 'members' | 'friends';
}
import { useCredentials } from "@/hooks/useCredentials";
import { useMembers } from "@/hooks/useMembers";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useFriends } from "@/hooks/useFriends";
import { emailService, generateCredentials } from "@/services/emailService";
import { buscarCep, validarFormatoCep, formatarCep, limparCep, CepData } from "@/services/cepService";
// COMENTADO: Validação do Instagram (não está pronta)
// import { validateInstagramAccount } from "@/services/instagramValidation";
import { AuthUser, supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function PublicRegister() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    instagram: "",
    cep: "",
    city: "",
    sector: "",
    referrer: "",
    // Dados do parceiro (obrigatório)
    couple_name: "",
    couple_phone: "",
    couple_instagram: "",
    couple_cep: "",
    couple_city: "",
    couple_sector: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referrerData, setReferrerData] = useState<AuthUser | null>(null);
  const [linkData, setLinkData] = useState<ExtendedUserLink | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [coupleCepLoading, setCoupleCepLoading] = useState(false);
  
  // Estados para dados do CEP (cidade e setor)
  const [cepData, setCepData] = useState<CepData | null>(null);
  const [coupleCepData, setCoupleCepData] = useState<CepData | null>(null);
  const hasFetchedData = useRef(false);
  
  // Estados para nome de exibição personalizado
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  
  
  // COMENTADO: Estados de validação do Instagram (não estão prontos)
  // const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  // const [instagramValidationError, setInstagramValidationError] = useState<string | null>(null);
  
  const { addUser, checkUserExists } = useUsers();
  const { getUserByLinkId, incrementClickCount } = useUserLinks();
  const { createUserWithCredentials } = useCredentials();
  const { addMember } = useMembers();
  const { shouldShowMemberLimitAlert, checkMemberLimit } = useSystemSettings();
  const { addFriend } = useFriends();
  const { toast } = useToast();



  // Funções de validação
  const validateEmail = (email: string) => {
    // Validação mais rigorosa de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim()) && email.trim().length > 0;
  };

  const validateName = (name: string) => {
    // Deve conter apenas letras e ter pelo menos duas palavras separadas por espaço
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    const words = name.trim().split(/\s+/);
    return nameRegex.test(name) && words.length >= 2 && words.every(word => word.length > 0);
  };

  const validatePhone = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Deve ter exatamente 11 dígitos (DDD + 9 dígitos)
    return cleanPhone.length === 11;
  };

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (62) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const validateInstagram = async (instagram: string) => {
    if (!instagram.trim()) {
      return { isValid: false, error: 'Instagram é obrigatório' };
    }

    // Remove @ se o usuário digitou
    const cleanInstagram = instagram.replace('@', '');
    
    // Validação de comprimento mínimo
    if (cleanInstagram.length < 3) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve ter pelo menos 3 caracteres' };
    }

    // Validação de comprimento máximo (limite do Instagram)
    if (cleanInstagram.length > 30) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve ter no máximo 30 caracteres' };
    }

    // Validação de caracteres permitidos (letras, números, pontos e underscores)
    const instagramRegex = /^[a-zA-Z0-9._]+$/;
    if (!instagramRegex.test(cleanInstagram)) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve conter apenas letras, números, pontos (.) e underscores (_). Não são permitidos espaços ou símbolos especiais' };
    }

    // Validação adicional: não pode começar ou terminar com ponto ou underscore
    if (cleanInstagram.startsWith('.') || cleanInstagram.endsWith('.') || 
        cleanInstagram.startsWith('_') || cleanInstagram.endsWith('_')) {
      return { isValid: false, error: 'Nome de usuário do Instagram não pode começar ou terminar com ponto (.) ou underscore (_)' };
    }

    // Validação adicional: não pode ter pontos ou underscores consecutivos
    if (cleanInstagram.includes('..') || cleanInstagram.includes('__') || 
        cleanInstagram.includes('._') || cleanInstagram.includes('_.')) {
      return { isValid: false, error: 'Nome de usuário do Instagram não pode ter pontos ou underscores consecutivos' };
    }

    // COMENTADO: Validação via API do Instagram (não está pronta)
    /*
    setIsValidatingInstagram(true);
    setInstagramValidationError(null);

    try {
      const result = await validateInstagramAccount(cleanInstagram);
      
      if (result.status) {
        return { isValid: true, error: null };
      } else {
        return { isValid: false, error: result.message };
      }
    } catch (error) {
      return { isValid: false, error: 'Erro ao validar conta do Instagram' };
    } finally {
      setIsValidatingInstagram(false);
    }
    */

    // Validação básica passou
    return { isValid: true, error: null };
  };

  // Função para validar duplicatas entre membros e amigos
  // Função para buscar CEP e preencher campos automaticamente
  const buscarCepEPreencher = async (cep: string, isCouple: boolean = false) => {
    try {
      if (isCouple) {
        setCoupleCepLoading(true);
      } else {
        setCepLoading(true);
      }

      // Limpar erros anteriores
      setFormErrors(prev => ({
        ...prev,
        [isCouple ? 'couple_cep' : 'cep']: ''
      }));

      const dadosCep = await buscarCep(cep);
      
      // Armazenar dados do CEP
      if (isCouple) {
        setCoupleCepData(dadosCep);
      } else {
        setCepData(dadosCep);
      }

      // Limpar campos primeiro e depois preencher com novos dados
      setFormData(prev => ({
        ...prev,
        [isCouple ? 'couple_city' : 'city']: dadosCep.cidade,
        [isCouple ? 'couple_sector' : 'sector']: dadosCep.bairro
      }));

      console.log('✅ CEP encontrado e campos preenchidos:', dadosCep);

    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar CEP';
      
      setFormErrors(prev => ({
        ...prev,
        [isCouple ? 'couple_cep' : 'cep']: errorMessage
      }));

      // Limpar dados do CEP em caso de erro
      if (isCouple) {
        setCoupleCepData(null);
      } else {
        setCepData(null);
      }

      toast({
        title: "Erro ao buscar CEP",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (isCouple) {
        setCoupleCepLoading(false);
      } else {
        setCepLoading(false);
      }
    }
  };

  // Função para atualizar contadores do membro após cadastro de amigo
  const updateMemberCountersAfterRegistration = async (referrerName: string) => {
    try {
      console.log('🔄 Atualizando contadores do membro após cadastro:', referrerName);
      
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

      console.log(`📊 Contratos atuais: ${currentContracts}, Amigos cadastrados: ${friendsCount}`);

      // Atualizar contracts_completed
      console.log(`📈 Atualizando contratos após cadastro: ${currentContracts} → ${friendsCount}`);
      
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
      
      console.log('✅ Contadores do membro atualizados após cadastro');

    } catch (err) {
      console.error('❌ Erro ao atualizar contadores após cadastro:', err);
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

  const validateDuplicates = async () => {
    const errors: Record<string, string> = {};
    
    try {
      // Normalizar telefones para comparação
      const normalizedPhone = formData.phone.replace(/\D/g, '');
      const normalizedCouplePhone = formData.couple_phone.replace(/\D/g, '');
      
      // Verificar duplicatas dentro da mesma dupla
      if (normalizedPhone === normalizedCouplePhone) {
        errors.couple_phone = 'O telefone do parceiro não pode ser igual ao seu telefone';
      }
      
      if (formData.instagram.toLowerCase() === formData.couple_instagram.toLowerCase()) {
        errors.couple_instagram = 'O Instagram do parceiro não pode ser igual ao seu Instagram';
      }

      // Verificar duplicatas com membros existentes
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('name, phone, instagram, couple_name, couple_phone, couple_instagram')
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (membersError) {
        console.error('Erro ao verificar membros:', membersError);
        return errors;
      }

      // Verificar duplicatas com amigos existentes
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('name, phone, instagram, couple_name, couple_phone, couple_instagram')
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (friendsError) {
        console.error('Erro ao verificar amigos:', friendsError);
        return errors;
      }

      // Combinar dados de membros e amigos
      const allUsers = [...(membersData || []), ...(friendsData || [])];

      // Verificar duplicatas
      for (const user of allUsers) {
        const userPhone = user.phone?.replace(/\D/g, '') || '';
        const userCouplePhone = user.couple_phone?.replace(/\D/g, '') || '';
        const userInstagram = user.instagram?.toLowerCase() || '';
        const userCoupleInstagram = user.couple_instagram?.toLowerCase() || '';

        // Verificar telefone principal
        if (userPhone === normalizedPhone) {
          errors.phone = `Este telefone já está cadastrado para ${user.name}`;
        }

        // Verificar telefone do parceiro
        if (userPhone === normalizedCouplePhone) {
          errors.couple_phone = `Este telefone já está cadastrado para ${user.name}`;
        }
        if (userCouplePhone === normalizedCouplePhone) {
          errors.couple_phone = `Este telefone já está cadastrado para ${user.couple_name}`;
        }

        // Verificar Instagram principal
        if (userInstagram === formData.instagram.toLowerCase()) {
          errors.instagram = `Este Instagram já está cadastrado para ${user.name}`;
        }

        // Verificar Instagram do parceiro
        if (userInstagram === formData.couple_instagram.toLowerCase()) {
          errors.couple_instagram = `Este Instagram já está cadastrado para ${user.name}`;
        }
        if (userCoupleInstagram === formData.couple_instagram.toLowerCase()) {
          errors.couple_instagram = `Este Instagram já está cadastrado para ${user.couple_name}`;
        }
      }

    } catch (error) {
      console.error('Erro na validação de duplicatas:', error);
    }

    return errors;
  };

  const validateRequiredFields = async () => {
    const errors: Record<string, string> = {};
    
    // Validação da primeira pessoa
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (!validateName(formData.name)) {
      errors.name = 'Deve conter nome e sobrenome';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'WhatsApp é obrigatório';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)';
    }
    
    if (!formData.instagram.trim()) {
      errors.instagram = 'Instagram é obrigatório';
    } else {
      const instagramValidation = await validateInstagram(formData.instagram);
      if (!instagramValidation.isValid) {
        errors.instagram = instagramValidation.error || 'Instagram inválido';
      }
    }
    
    if (!formData.cep.trim()) {
      errors.cep = 'CEP é obrigatório';
    } else if (!validarFormatoCep(formData.cep)) {
      errors.cep = 'CEP deve ter 8 dígitos (ex: 12345-678)';
    } else if (!cepData) {
      errors.cep = 'CEP não encontrado - verifique se o CEP está correto';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }
    
    if (!formData.sector.trim()) {
      errors.sector = 'Setor é obrigatório';
    }

    // Validação do parceiro (obrigatório)
    if (!formData.couple_name.trim()) {
      errors.couple_name = 'Nome do parceiro é obrigatório';
    } else if (!validateName(formData.couple_name)) {
      errors.couple_name = 'Deve conter nome e sobrenome';
    }
    
    if (!formData.couple_phone.trim()) {
      errors.couple_phone = 'WhatsApp do parceiro é obrigatório';
    } else if (!validatePhone(formData.couple_phone)) {
      errors.couple_phone = 'WhatsApp deve ter 11 dígitos (DDD + 9 dígitos)';
    }
    
    if (!formData.couple_instagram.trim()) {
      errors.couple_instagram = 'Instagram do parceiro é obrigatório';
    } else {
      const coupleInstagramValidation = await validateInstagram(formData.couple_instagram);
      if (!coupleInstagramValidation.isValid) {
        errors.couple_instagram = coupleInstagramValidation.error || 'Instagram inválido';
      }
    }
    
    if (!formData.couple_cep.trim()) {
      errors.couple_cep = 'CEP do parceiro é obrigatório';
    } else if (!validarFormatoCep(formData.couple_cep)) {
      errors.couple_cep = 'CEP deve ter 8 dígitos (ex: 12345-678)';
    } else if (!coupleCepData) {
      errors.couple_cep = 'CEP não encontrado - verifique se o CEP está correto';
    }
    
    if (!formData.couple_city.trim()) {
      errors.couple_city = 'Cidade do parceiro é obrigatória';
    }
    
    if (!formData.couple_sector.trim()) {
      errors.couple_sector = 'Setor do parceiro é obrigatório';
    }
    
    // Validar duplicatas
    const duplicateErrors = await validateDuplicates();
    Object.assign(errors, duplicateErrors);
    
    setFormErrors(errors);
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'phone' || field === 'couple_phone') {
      processedValue = formatPhone(value);
    } else if ((field === 'instagram' || field === 'couple_instagram') && value && !value.startsWith('@')) {
      processedValue = '@' + value;
    } else if (field === 'name' || field === 'couple_name') {
      // Permite apenas letras e espaços
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'city' || field === 'couple_city') {
      // Permite apenas letras e espaços para cidade
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'sector' || field === 'couple_sector') {
      // Permite apenas letras e espaços para setor
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (field === 'cep' || field === 'couple_cep') {
      // Formatar CEP e buscar automaticamente quando completo
      processedValue = formatarCep(value);
      
      // Limpar campos relacionados quando CEP for apagado
      if (value.trim() === '') {
        if (field === 'cep') {
          setFormData(prev => ({ ...prev, city: '', sector: '' }));
          setCepData(null);
        } else {
          setFormData(prev => ({ ...prev, couple_city: '', couple_sector: '' }));
          setCoupleCepData(null);
        }
      } else {
        // Buscar CEP automaticamente quando tiver 8 dígitos
        const cepLimpo = limparCep(value);
        if (cepLimpo.length === 8 && validarFormatoCep(cepLimpo)) {
          buscarCepEPreencher(cepLimpo, field === 'couple_cep');
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpa o erro do campo quando o usuário começa a digitar
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  // Função memoizada para buscar dados do referrer
  const fetchReferrerData = useCallback(async () => {
    if (!linkId || hasFetchedData.current) return;
    
    hasFetchedData.current = true;
      
      try {
        const result = await getUserByLinkId(linkId);
        if (result.success && result.data) {
          setLinkData(result.data);
          setReferrerData(result.data.user_data);
          setFormData(prev => ({ 
            ...prev, 
            referrer: result.data.user_data?.name || 'Usuário do Sistema' 
          }));
          
          // Incrementar contador de cliques quando o link for acessado
          await incrementClickCount(linkId);
        } else {
          // Fallback se não encontrar no banco
          setFormData(prev => ({ ...prev, referrer: 'Usuário do Sistema' }));
        }
      } catch (error) {
        console.error('Erro ao buscar dados do referrer:', error);
        setFormData(prev => ({ ...prev, referrer: 'Usuário do Sistema' }));
      }
  }, [linkId, getUserByLinkId, incrementClickCount]);

  // Buscar dados do referrer quando o componente carregar
  useEffect(() => {
    if (linkId) {
      fetchReferrerData();
    }
  }, [linkId, fetchReferrerData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida todos os campos obrigatórios
    const validationErrors = await validateRequiredFields();
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }

    // VALIDAÇÃO FINAL: Verificar se cidade e setor estão exatos no banco
    try {
      setIsLoading(true);
      
      // Validação de CEP já foi feita na função validateRequiredFields
      // Os dados de cidade e setor vêm da consulta do CEP

      console.log('✅ Validação de CEP concluída');

    } catch (error) {
      console.error('💥 Erro na validação/criação:', error);
      toast({
        title: "Erro na validação",
        description: error instanceof Error ? error.message : "Erro ao validar cidade e setor. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Continuar com o cadastro do membro
    try {

      // IDENTIFICAR TIPO DE LINK - Verificar se é para cadastrar membro ou amigo
      const isFriendRegistration = linkData?.link_type === 'friends';
      
      console.log('🔍 Dados do link:', linkData);
      console.log('🔍 Tipo de link identificado:', linkData?.link_type);
      console.log('🔍 É cadastro de amigo?', isFriendRegistration);
      
      // Verificar configuração atual do sistema
      const { data: currentSettings, error: settingsError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single();
      
      console.log('🔍 Configuração atual do sistema:', currentSettings?.setting_value);
      
      // Se for cadastro de amigo, não verificar limite de membros
      if (!isFriendRegistration) {
        // Verificar limite de membros apenas para novos membros
        const limitCheck = await checkMemberLimit();
        if (!limitCheck.canRegister) {
          toast({
            title: "Limite de membros atingido",
            description: `O sistema atingiu o limite de ${limitCheck.max} membros. Não é possível cadastrar novos membros no momento.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      if (isFriendRegistration) {
        // CADASTRO DE AMIGO (CADASTRO ESPECIAL) - Usar tabela friends
        console.log('📝 Cadastrando amigo (cadastro especial)...');
        
        // Preparar dados do amigo para tabela friends
        const friendData = {
          name: formData.name.trim(),
          phone: formData.phone,
          instagram: formData.instagram.trim(),
          city: formData.city.trim(),
          sector: formData.sector.trim(),
          referrer: formData.referrer,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Ativo' as const,
          // Dados do parceiro (obrigatório)
          couple_name: formData.couple_name.trim(),
          couple_phone: formData.couple_phone,
          couple_instagram: formData.couple_instagram.trim(),
          couple_city: formData.couple_city.trim(),
          couple_sector: formData.couple_sector.trim(),
          // Campos obrigatórios para tabela friends
          member_id: '', // Será preenchido pelo hook
          deleted_at: null
        };

        console.log('📝 Dados do amigo a serem salvos:', friendData);

        // Salvar amigo na tabela friends
        const friendResult = await addFriend(friendData);
        
        if (!friendResult.success) {
          throw new Error(friendResult.error || "Erro ao salvar amigo");
        }

        // Sucesso - Amigo cadastrado
        setIsSuccess(true);
        
        // Atualizar contadores do membro referrer após cadastro bem-sucedido
        if (formData.referrer) {
          console.log('🔄 Atualizando contadores do membro após cadastro:', formData.referrer);
          await updateMemberCountersAfterRegistration(formData.referrer);
        }
        
        toast({
          title: "Amigo dupla cadastrado com sucesso!",
          description: `Você foi cadastrado como amigo dupla por ${formData.referrer}. Este é um cadastro especial.`,
        });

      } else {
        // CADASTRO DE MEMBRO (NORMAL)
        console.log('📝 Cadastrando membro...');
        
        // Preparar dados para salvar no banco
        const memberData = {
          name: formData.name.trim(),
          phone: formData.phone,
          instagram: formData.instagram.trim(),
          city: formData.city.trim(),
          sector: formData.sector.trim(),
          referrer: formData.referrer,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Ativo' as const,
          // Dados do parceiro (obrigatório)
          couple_name: formData.couple_name.trim(),
          couple_phone: formData.couple_phone,
          couple_instagram: formData.couple_instagram.trim(),
          couple_city: formData.couple_city.trim(),
          couple_sector: formData.couple_sector.trim()
        };

        console.log('📝 Dados do membro a serem salvos:', memberData);

        // 1. Salvar membro na tabela members
        const memberResult = await addMember(memberData);
        
        if (!memberResult.success) {
          throw new Error(memberResult.error || "Erro ao salvar membro");
        }

        // 2. Salvar também na tabela users (para compatibilidade)
        const userData = {
          name: formData.name.trim(),
          phone: formData.phone,
          instagram: formData.instagram.trim(),
          city: formData.city.trim(),
          sector: formData.sector.trim(),
          referrer: formData.referrer,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'Ativo' as const
        };

        const userResult = await addUser(userData);
        
        if (!userResult.success) {
          console.warn('Aviso: Erro ao salvar na tabela users:', userResult.error);
        }

        // 3. Criar credenciais compartilhadas para a dupla
        const userDataForCouple = {
          ...userData,
          full_name: `${formData.name} e ${formData.couple_name} - Dupla`,
          display_name: `${formData.name} & ${formData.couple_name}`,
          role: 'Membro'
        };
        
        const credentialsResult = await createUserWithCredentials(userDataForCouple);
        
        if (!credentialsResult.success) {
          throw new Error((credentialsResult as { error: string }).error);
        }

        // 4. Sucesso - Membro cadastrado
        setIsSuccess(true);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Dupla cadastrada e vinculada a ${formData.referrer}. Uma conta compartilhada foi criada para ambos.`,
        });
      }

    } catch (error) {
      console.error('Erro no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para abrir página de login em nova aba
  const handleOpenLogin = () => {
    // Abrir página de login em nova aba
    const loginUrl = `${window.location.origin}/login`;
    window.open(loginUrl, '_blank');
    
    toast({
      title: "Página de login aberta!",
      description: "Use suas credenciais acima para fazer login no sistema.",
    });
  };


  if (isSuccess) {
    return (
      <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
        {/* Logo no topo */}
        <div className="mb-8">
          <Logo size="lg" showText={true} layout="vertical" textColor="white" />
        </div>

        {/* Tela de Sucesso */}
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <UserPlus className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-institutional-blue mb-2">
              Cadastro Realizado!
            </h2>
            <div className="bg-institutional-light rounded-lg p-4 mb-4">
              <p className="text-sm text-institutional-blue mb-2">
               
            </p>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">👫 Conta Compartilhada</p>
                  <p className="text-blue-700"><strong>Usuário:</strong> {formData.instagram.replace('@', '')}</p>
                  <p className="text-blue-700"><strong>Senha:</strong> {formData.instagram.replace('@', '')}{formData.phone.slice(-4)}</p>
                  <p className="text-blue-600 text-xs mt-2">
                    Esta conta é compartilhada entre <strong>{formData.name}</strong> e <strong>{formData.couple_name}</strong>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-institutional-light rounded-lg p-4 mb-4">
              <p className="text-sm text-institutional-blue">
                <strong>Cadastro vinculado a:</strong><br />
                {formData.referrer}
              </p>
              {linkData?.link_type === 'friends' && (
                <p className="text-sm text-green-600 mt-2">
                 Você foi cadastrado como amigo dupla por um membro com cadastro especial.
                </p>
              )}
            </div>
            <p className="text-sm text-institutional-blue bg-institutional-light p-3 rounded-lg mb-4">
              <strong>Como acessar:</strong> {linkData?.link_type === 'friends' 
                ? 'Este é um cadastro de amigo  O membro responsável receberá as informações de acesso.'
                : 'Ambos podem usar a mesma conta compartilhada para fazer login no sistema. A dupla compartilha o mesmo usuário, senha e link de cadastro. Clique no botão abaixo para entrar.'
              }
            </p>
            
            {/* Botão para Entrar no Sistema - Só aparece para membros */}
            {linkData?.link_type !== 'friends' && (
              <Button
                onClick={() => {
                  // Definir nome padrão baseado no formulário
                  const defaultName = `${formData.name} & ${formData.couple_name}`;
                  setDisplayName(defaultName);
                  setShowDisplayNameModal(true);
                }}
                className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Clique aqui para entrar
                </div>
              </Button>
            )}
          </div>
        </div>

        {/* Modal de Nome de Exibição Personalizado */}
        {showDisplayNameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-institutional-blue mb-4">
                Como você quer ser chamado?
              </h3>
              <p className="text-gray-600 mb-4">
                Escolha um nome de exibição personalizado para aparecer no sistema:
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Exibição
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ex: João & Maria, Dupla Silva, etc."
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDisplayNameModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!displayName.trim()) {
                        toast({
                          title: "Nome obrigatório",
                          description: "Por favor, digite um nome de exibição.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        const username = formData.instagram.replace('@', '');
                        const password = `${formData.instagram.replace('@', '')}${formData.phone.slice(-4)}`;
                        
                        const result = await login(username, password);
                        
                        if (result.success) {
                          // Atualizar nome de exibição no perfil do usuário (se diferente do padrão)
                          const defaultName = `${formData.name} & ${formData.couple_name}`;
                          if (displayName.trim() !== defaultName) {
                            try {
                              const { error } = await supabase
                                .from('auth_users')
                                .update({ display_name: displayName.trim() })
                                .eq('username', username);
                              
                              if (error) {
                                console.warn('Erro ao atualizar nome de exibição:', error);
                              }
                            } catch (updateError) {
                              console.warn('Erro ao atualizar nome de exibição:', updateError);
                            }
                          }
                          
                          toast({
                            title: "Login realizado com sucesso!",
                            description: `Bem-vindo, ${displayName}! Redirecionando...`,
                          });
                          
                          setShowDisplayNameModal(false);
                          
                          // Redirecionar para o dashboard após 1 segundo
                          setTimeout(() => {
                            navigate("/dashboard");
                          }, 1000);
                        } else {
                          toast({
                            title: "Erro no login",
                            description: "Não foi possível fazer login. Verifique suas credenciais.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Erro no login",
                          description: "Não foi possível fazer login. Verifique suas credenciais.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="flex-1 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue"
                  >
                    Clique aqui para entrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="text-center text-white text-sm">
          <p>Todos os direitos reservados HitechDesenvolvimento 2025</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
      {/* Logo no topo */}
      <div className="mb-8">
        <Logo size="lg" showText={true} layout="vertical" textColor="white" />
      </div>

      {/* Informação do Link */}
      <div className="mb-6 text-center">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
          <p className="text-white text-sm">
            <strong>Link gerado por:</strong>
          </p>
          {referrerData ? (
            <>
              <p className="font-bold text-institutional-gold">{referrerData.name}</p>
              <p className="text-gray-300 text-xs mt-1">{referrerData.role}</p>
            </>
          ) : (
            <p className="font-bold text-institutional-gold">{formData.referrer}</p>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">
          {linkData?.link_type === 'friends' 
            ? 'Membro Cadastrando Amigo' 
            : 'Cadastre-se como Membro Conectado'
          }
        </h1>
        <p className="text-gray-300">
          {linkData?.link_type === 'friends' ? (
            <>
               Você está sendo cadastrado por um membro como amigo. Preencha os dados de ambos (você e sua parceira/parceiro) abaixo.
            </>
          ) : (
            <>
              
            </>
          )}
        </p>
      </div>

      {/* Formulário de Cadastro */}
      <div className="w-full max-w-md space-y-6">
        {/* Campo Nome */}
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Nome Completo (ex: João Silva)"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.name ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.name && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.name}</span>
            </div>
          )}
        </div>

        {/* Campo CEP */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="CEP (12345-678)"
              value={formData.cep}
              onChange={(e) => handleInputChange('cep', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.cep ? 'border-red-500' : ''}`}
              maxLength={9}
              required
            />
            {cepLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {formErrors.cep && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.cep}</span>
            </div>
          )}
        </div>


        {/* Campo Cidade */}
        <div className="space-y-1">
          <div className="relative">
            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cidade (preenchida automaticamente pelo CEP)"
            value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.city ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.city && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.city}</span>
            </div>
          )}
        </div>

        {/* Campo Setor */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Setor (preenchido automaticamente pelo CEP)"
            value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.sector ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.sector && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.sector}</span>
            </div>
          )}
        </div>

        {/* Campo WhatsApp */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="WhatsApp (62) 99999-9999"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.phone ? 'border-red-500' : ''}`}
              maxLength={15}
              required
            />
          </div>
          {formErrors.phone && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.phone}</span>
            </div>
          )}
        </div>

        {/* Campo Instagram */}
        <div className="space-y-1">
          <div className="relative">
            <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Instagram (@seuusuario)"
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value.replace('@', ''))}
              // COMENTADO: onBlur para validação automática (não está pronta)
              // onBlur={handleInstagramBlur}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.instagram ? 'border-red-500' : ''}`}
              required
              // COMENTADO: disabled durante validação (não está pronta)
              // disabled={isValidatingInstagram}
            />
            {/* COMENTADO: Indicador de carregamento da validação (não está pronta)
            {isValidatingInstagram && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            */}
          </div>
          {formErrors.instagram && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.instagram}</span>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-gray-400 text-sm font-medium">Dados da Segunda Pessoa</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* Campo Nome da Segunda Pessoa */}
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Nome Completo do Parceiro (ex: Maria Silva)"
              value={formData.couple_name}
              onChange={(e) => handleInputChange('couple_name', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_name ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.couple_name && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_name}</span>
            </div>
          )}
        </div>

        {/* Campo CEP do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="CEP do Parceiro (12345-678)"
              value={formData.couple_cep}
              onChange={(e) => handleInputChange('couple_cep', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_cep ? 'border-red-500' : ''}`}
              maxLength={9}
              required
            />
            {coupleCepLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
          </div>
            )}
          </div>
          {formErrors.couple_cep && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_cep}</span>
            </div>
          )}
        </div>


        {/* Campo Cidade do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cidade do Parceiro (preenchida automaticamente pelo CEP)"
            value={formData.couple_city}
              onChange={(e) => handleInputChange('couple_city', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.couple_city ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.couple_city && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_city}</span>
            </div>
          )}
        </div>

        {/* Campo Setor do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Setor do Parceiro (preenchido automaticamente pelo CEP)"
            value={formData.couple_sector}
              onChange={(e) => handleInputChange('couple_sector', e.target.value)}
              className={`pl-12 h-12 bg-gray-600 border-gray-600 text-white placeholder-gray-500 rounded-lg cursor-not-allowed ${formErrors.couple_sector ? 'border-red-500' : ''}`}
              disabled
              required
            />
          </div>
          {formErrors.couple_sector && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_sector}</span>
            </div>
          )}
        </div>

        {/* Campo WhatsApp do Parceiro */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="WhatsApp do Parceiro (62) 99999-9999"
              value={formData.couple_phone}
              onChange={(e) => handleInputChange('couple_phone', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_phone ? 'border-red-500' : ''}`}
              maxLength={15}
              required
            />
          </div>
          {formErrors.couple_phone && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_phone}</span>
            </div>
          )}
        </div>

        {/* Campo Instagram da Segunda Pessoa */}
        <div className="space-y-1">
          <div className="relative">
            <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Instagram da Segunda Pessoa (@seuusuario)"
              value={formData.couple_instagram}
              onChange={(e) => handleInputChange('couple_instagram', e.target.value.replace('@', ''))}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.couple_instagram ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.couple_instagram && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.couple_instagram}</span>
            </div>
          )}
        </div>

        {/* Campo Nome da pessoa que indicou (readonly) */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Nome da pessoa que indicou"
            value={formData.referrer}
            readOnly
            className="pl-12 h-12 bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-400 rounded-lg cursor-not-allowed"
          />
        </div>

        {/* Botão Cadastrar */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-institutional-blue border-t-transparent rounded-full animate-spin" />
              Cadastrando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Finalizar Cadastro
            </div>
          )}
        </Button>

        {/* Informação adicional */}
       
      </div>

      {/* Rodapé */}
      <div className="mt-12 text-center text-white text-sm">
        <p>Todos os direitos reservados HitechDesenvolvimento 2025</p>
      </div>
    </div>
  );
}