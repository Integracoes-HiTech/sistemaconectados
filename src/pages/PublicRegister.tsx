import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Instagram, UserPlus, CheckCircle, MapPin, Building, AlertCircle, LogIn, ExternalLink } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserLinks, UserLink } from "@/hooks/useUserLinks";
import { useCredentials } from "@/hooks/useCredentials";
import { emailService, generateCredentials } from "@/services/emailService";
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
    city: "",
    sector: "",
    referrer: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referrerData, setReferrerData] = useState<AuthUser | null>(null);
  const [linkData, setLinkData] = useState<UserLink | null>(null);
  const hasFetchedData = useRef(false);
  
  
  // COMENTADO: Estados de validação do Instagram (não estão prontos)
  // const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  // const [instagramValidationError, setInstagramValidationError] = useState<string | null>(null);
  
  const { addUser, checkUserExists } = useUsers();
  const { getUserByLinkId, incrementClickCount } = useUserLinks();
  const { createUserWithCredentials } = useCredentials();
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
    
    if (cleanInstagram.length < 3) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve ter pelo menos 3 caracteres' };
    }

    // Validação básica - apenas formato
    const instagramRegex = /^[a-zA-Z0-9._]+$/;
    if (!instagramRegex.test(cleanInstagram)) {
      return { isValid: false, error: 'Nome de usuário do Instagram deve conter apenas letras, números, pontos e underscores' };
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

  const validateRequiredFields = () => {
    const errors: Record<string, string> = {};
    
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
    }
    
    if (!formData.city.trim()) {
      errors.city = 'Cidade é obrigatória - selecione uma cidade válida da lista';
    }
    
    if (!formData.sector.trim()) {
      errors.sector = 'Setor é obrigatório - selecione um setor válido da lista';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'phone') {
      processedValue = formatPhone(value);
    } else if (field === 'instagram' && value && !value.startsWith('@')) {
      processedValue = '@' + value;
    } else if (field === 'name') {
      // Permite apenas letras e espaços
      processedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
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
            referrer: result.data.user_data?.full_name || 'Usuário do Sistema' 
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
    if (!validateRequiredFields()) {
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
      
      // 1. VALIDAR CIDADE - Deve existir exatamente no banco
      console.log('🔍 Validando cidade:', formData.city);
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('id, name')
        .eq('state', 'GO')
        .ilike('name', formData.city.trim())
        .single();

      if (cityError || !cityData) {
        toast({
          title: "❌ Cidade inválida",
          description: `A cidade "${formData.city}" não foi encontrada no banco de dados. Por favor, selecione uma cidade válida da lista de sugestões.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verificar se o nome está exatamente igual (case-insensitive)
      if (cityData.name.toLowerCase() !== formData.city.trim().toLowerCase()) {
        toast({
          title: "❌ Nome da cidade incorreto",
          description: `O nome deve ser exatamente "${cityData.name}". Corrija o nome da cidade.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ Cidade válida:', cityData.name);

      // 2. VALIDAR SETOR - Deve existir exatamente no banco para a cidade
      console.log('🔍 Validando setor:', formData.sector, 'em', cityData.name);
      const { data: existingSector, error: sectorError } = await supabase
        .from('sectors')
        .select('id, name')
        .eq('name', formData.sector.trim())
        .eq('city_id', cityData.id)
        .single();

      if (sectorError || !existingSector) {
        toast({
          title: "❌ Setor inválido",
          description: `O setor "${formData.sector}" não foi encontrado em ${cityData.name}. Por favor, selecione um setor válido da lista de sugestões.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verificar se o nome está exatamente igual (case-insensitive)
      if (existingSector.name.toLowerCase() !== formData.sector.trim().toLowerCase()) {
        toast({
          title: "❌ Nome do setor incorreto",
          description: `O nome deve ser exatamente "${existingSector.name}". Corrija o nome do setor.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ Setor válido:', existingSector.name);

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

    // Continuar com o cadastro do usuário
    try {
      // Verificar se usuário já existe antes de salvar
      const userExistsCheck = await checkUserExists(formData.instagram.trim(), formData.phone);
      
      if (userExistsCheck.exists) {
        toast({
          title: "Usuário já cadastrado",
          description: userExistsCheck.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Preparar dados para salvar no banco
      const userData = {
        name: formData.name.trim(),
        phone: formData.phone,
        instagram: formData.instagram.trim(),
        city: formData.city,
        sector: formData.sector,
        referrer: formData.referrer,
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Inativo' as const
      };

      // 1. Salvar usuário na tabela users
      const userResult = await addUser(userData);
      
      if (!userResult.success) {
        throw new Error(userResult.error || "Erro ao salvar usuário");
      }

      // 2. Criar credenciais e usuário de autenticação
      const credentialsResult = await createUserWithCredentials(userData);
      
      if (!credentialsResult.success) {
        throw new Error((credentialsResult as { error: string }).error);
      }

      // 3. Sucesso
      setIsSuccess(true);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Cadastro vinculado a ${formData.referrer}. Suas credenciais de acesso foram geradas automaticamente.`,
      });

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

  // Login automático quando a tela de sucesso aparecer
  useEffect(() => {
    if (isSuccess) {
      const autoLogin = async () => {
        try {
          const username = formData.instagram.replace('@', '');
          const password = `${formData.instagram.replace('@', '')}${formData.phone.slice(-4)}`;
          
          const result = await login(username, password);
          
          if (result.success) {
            toast({
              title: "Login automático realizado!",
              description: "Redirecionando para o dashboard...",
            });
            
            // Redirecionar para o dashboard após 2 segundos
            setTimeout(() => {
              navigate("/dashboard");
            }, 2000);
          }
        } catch (error) {
          console.log("Login automático falhou, usuário pode fazer login manual");
        }
      };
      
      // Executar login automático após 1 segundo
      setTimeout(autoLogin, 1000);
    }
  }, [isSuccess, formData.instagram, formData.phone, login, navigate, toast]);

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
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-institutional-blue mb-2">
              Cadastro Realizado!
            </h2>
            <div className="bg-institutional-light rounded-lg p-4 mb-4">
              <p className="text-sm text-institutional-blue mb-2">
                <strong>Suas credenciais de acesso:</strong>
            </p>
              <div className="space-y-2 text-sm">
                <p><strong>Instagram:</strong> {formData.instagram.replace('@', '')}</p>
                <p><strong>Senha:</strong> {formData.instagram.replace('@', '')}{formData.phone.slice(-4)}</p>
              </div>
            </div>
            <div className="bg-institutional-light rounded-lg p-4 mb-4">
              <p className="text-sm text-institutional-blue">
                <strong>Cadastro vinculado a:</strong><br />
                {formData.referrer}
              </p>
            </div>
            <p className="text-sm text-institutional-blue bg-institutional-light p-3 rounded-lg mb-4">
              <strong>Login automático:</strong> Você será redirecionado automaticamente para o dashboard em alguns segundos. Se isso não acontecer, clique no botão "Fazer Login Automático" abaixo.
            </p>
            
            {/* Botão para Entrar no Sistema */}
            <Button
              onClick={async () => {
                try {
                  const username = formData.instagram.replace('@', '');
                  const password = `${formData.instagram.replace('@', '')}${formData.phone.slice(-4)}`;
                  
                  const result = await login(username, password);
                  
                  if (result.success) {
                    toast({
                      title: "Login realizado com sucesso!",
                      description: "Redirecionando para o dashboard...",
                    });
                    
                    // Redirecionar para o dashboard após 1 segundo
                    setTimeout(() => {
                      navigate("/dashboard");
                    }, 1000);
                  } else {
                    toast({
                      title: "Erro no login automático",
                      description: "Por favor, faça login manualmente.",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Erro no login automático",
                    description: "Por favor, faça login manualmente.",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Fazer Login Automático
              </div>
            </Button>
          </div>
        </div>

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
          Cadastre-se no Conectados
        </h1>
        <p className="text-gray-300">
          Preencha os dados abaixo para fazer parte da nossa rede
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

        {/* Campo Cidade - AUTCOMPLETE */}
        <div className="space-y-1">
          <Autocomplete
            value={formData.city}
            onChange={(value) => handleInputChange('city', value)}
            placeholder="Digite a cidade..."
            icon={<Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
            type="city"
            error={formErrors.city}
          />
        </div>

        {/* Campo Setor - AUTCOMPLETE */}
        <div className="space-y-1">
          <Autocomplete
            value={formData.sector}
            onChange={(value) => handleInputChange('sector', value)}
            placeholder="Digite o setor..."
            icon={<MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
            type="sector"
            cityValue={formData.city}
            error={formErrors.sector}
          />
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
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-300">
            <strong>Após o cadastro:</strong> Suas credenciais de acesso serão geradas automaticamente e exibidas na tela de sucesso. Você poderá acessar o sistema e gerar seus próprios links de cadastro.
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-12 text-center text-white text-sm">
        <p>Todos os direitos reservados HitechDesenvolvimento 2025</p>
      </div>
    </div>
  );
}