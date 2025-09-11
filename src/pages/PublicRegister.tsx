import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Instagram, UserPlus, CheckCircle, MapPin, Building, AlertCircle } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserLinks, UserLink } from "@/hooks/useUserLinks";
import { useCredentials } from "@/hooks/useCredentials";
import { emailService, generateCredentials } from "@/services/emailService";
import { validateInstagramAccount } from "@/services/instagramValidation";
import { AuthUser } from "@/lib/supabase";

export default function PublicRegister() {
  const { linkId } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    city: "",
    neighborhood: "",
    phone: "",
    email: "",
    instagram: "",
    referrer: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referrerData, setReferrerData] = useState<AuthUser | null>(null);
  const [linkData, setLinkData] = useState<UserLink | null>(null);
  const [isValidatingInstagram, setIsValidatingInstagram] = useState(false);
  const [instagramValidationError, setInstagramValidationError] = useState<string | null>(null);
  
  const { addUser, checkUserExists } = useUsers();
  const { getUserByLinkId } = useUserLinks();
  const { createUserWithCredentials } = useCredentials();
  const { toast } = useToast();

  // Dados mockados para UF e Cidades
  const estadosECidades = {
    "GO": ["Aparecida de Goiânia", "Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama"],
    "SP": ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "Ribeirão Preto", "Sorocaba", "Mauá", "São José dos Campos"],
    "RJ": ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Campos dos Goytacazes", "Petrópolis", "Volta Redonda"],
    "MG": ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga"],
    "PR": ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá"],
    "RS": ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande"],
    "BA": ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Juazeiro", "Itabuna", "Lauro de Freitas", "Ilhéus", "Jequié", "Alagoinhas"],
    "PE": ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão"],
    "CE": ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá"],
    "DF": ["Brasília", "Ceilândia", "Samambaia", "Taguatinga", "Plano Piloto", "Gama", "Santa Maria", "São Sebastião", "Recanto das Emas", "Lago Sul"]
  };

  const estados = Object.keys(estadosECidades);

  // Função fallback para dados mockados (caso não encontre no banco)
  const getUserFromLinkIdFallback = (linkId: string | undefined) => {
    if (!linkId) return "Usuário do Sistema";
    
    const username = linkId.split('-')[0];
    const userMap: Record<string, string> = {
      joao: "João Silva - Coordenador",
      marcos: "Marcos Santos - Colaborador",
      admin: "Admin - Administrador",
      wegneycosta: "Wegney Costa - Vereador"
    };
    
    return userMap[username] || "Usuário do Sistema";
  };

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
  };

  const validateRequiredFields = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (!validateName(formData.name)) {
      errors.name = 'Deve conter nome e sobrenome';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Endereço é obrigatório';
    }
    
    if (!formData.state) {
      errors.state = 'UF é obrigatório';
    }
    
    if (!formData.city) {
      errors.city = 'Cidade é obrigatória';
    }
    
    if (!formData.neighborhood.trim()) {
      errors.neighborhood = 'Bairro é obrigatório';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Telefone deve ter 11 dígitos (DDD + 9 dígitos)';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email deve ter formato válido (ex: usuario@dominio.com)';
    }
    
    if (!formData.instagram.trim()) {
      errors.instagram = 'Instagram é obrigatório';
    } else if (instagramValidationError) {
      errors.instagram = instagramValidationError;
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

    // Limpa erro de validação do Instagram
    if (field === 'instagram' && instagramValidationError) {
      setInstagramValidationError(null);
    }
  };

  const handleInstagramBlur = async () => {
    if (formData.instagram.trim()) {
      const validation = await validateInstagram(formData.instagram);
      if (!validation.isValid) {
        setInstagramValidationError(validation.error);
        setFormErrors(prev => ({ ...prev, instagram: validation.error }));
      }
    }
  };

  const handleStateChange = (state: string) => {
    setFormData(prev => ({ ...prev, state, city: '' })); // Limpa a cidade quando muda o estado
    if (formErrors.state) {
      setFormErrors(prev => ({ ...prev, state: '' }));
    }
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    if (formErrors.city) {
      setFormErrors(prev => ({ ...prev, city: '' }));
    }
  };

  // Buscar dados do referrer quando o componente carregar
  useEffect(() => {
    const fetchReferrerData = async () => {
      if (!linkId) return;
      
      try {
        const result = await getUserByLinkId(linkId);
        if (result.success && result.data) {
          setLinkData(result.data);
          setReferrerData(result.data.user_data);
          setFormData(prev => ({ 
            ...prev, 
            referrer: result.data.user_data?.full_name || 'Usuário do Sistema' 
          }));
        } else {
          // Fallback para dados mockados se não encontrar no banco
          const fallbackData = getUserFromLinkIdFallback(linkId);
          setFormData(prev => ({ ...prev, referrer: fallbackData }));
        }
      } catch (error) {
        console.error('Erro ao buscar dados do referrer:', error);
        const fallbackData = getUserFromLinkIdFallback(linkId);
        setFormData(prev => ({ ...prev, referrer: fallbackData }));
      }
    };

    if (linkId) {
      fetchReferrerData();
    }
  }, [linkId, getUserByLinkId]);

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

    setIsLoading(true);

    try {
      // Verificar se usuário já existe antes de salvar
      const userExistsCheck = await checkUserExists(formData.email.trim().toLowerCase(), formData.phone);
      
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
        address: formData.address.trim(),
        state: formData.state,
        city: formData.city,
        neighborhood: formData.neighborhood.trim(),
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        instagram: formData.instagram,
        referrer: formData.referrer,
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo' as const
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

      // 3. Enviar email com credenciais
      const emailData = {
        to_email: userData.email,
        to_name: userData.name,
        from_name: "Sistema Conectados",
        login_url: credentialsResult.credentials!.login_url,
        username: credentialsResult.credentials!.username,
        password: credentialsResult.credentials!.password,
        referrer_name: formData.referrer,
        system_url: 'https://sistemaconectados.vercel.app/'
      };

      console.log("Enviando email com dados:", emailData);
      const emailResult = await emailService.sendWelcomeEmail(emailData);
      
      if (!emailResult.success) {
        console.error("❌ Email não foi enviado:", emailResult.error);
        toast({
          title: "Email não enviado",
          description: `Erro: ${emailResult.error}. Verifique o console para mais detalhes.`,
          variant: "destructive",
        });
      } else {
        console.log("✅ Email enviado com sucesso!");
      }

      // 4. Sucesso
      setIsSuccess(true);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Cadastro vinculado a ${formData.referrer}. As credenciais de acesso foram enviadas para seu email.`,
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
            <p className="text-muted-foreground mb-4">
              Suas credenciais de acesso foram enviadas para <strong>{formData.email}</strong>
            </p>
            <div className="bg-institutional-light rounded-lg p-4 mb-4">
              <p className="text-sm text-institutional-blue">
                <strong>Cadastro vinculado a:</strong><br />
                {formData.referrer}
              </p>
            </div>
            <p className="text-sm text-institutional-blue bg-institutional-light p-3 rounded-lg">
              Verifique sua caixa de entrada e spam. Você poderá acessar o sistema e gerar seus próprios links!
            </p>
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

        {/* Campo Endereço */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Endereço"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.address ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.address && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.address}</span>
            </div>
          )}
        </div>

        {/* Campos UF e Cidade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="relative">
              <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
              <Select value={formData.state} onValueChange={handleStateChange}>
                <SelectTrigger className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.state ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado} className="text-white hover:bg-gray-700">
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formErrors.state && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.state}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="relative">
              <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
              <Select value={formData.city} onValueChange={handleCityChange} disabled={!formData.state}>
                <SelectTrigger className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.city ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {formData.state && estadosECidades[formData.state as keyof typeof estadosECidades]?.map((cidade) => (
                    <SelectItem key={cidade} value={cidade} className="text-white hover:bg-gray-700">
                      {cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formErrors.city && (
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors.city}</span>
              </div>
            )}
          </div>
        </div>

        {/* Campo Bairro */}
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Bairro"
              value={formData.neighborhood}
              onChange={(e) => handleInputChange('neighborhood', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.neighborhood ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.neighborhood && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.neighborhood}</span>
            </div>
          )}
        </div>

        {/* Campo Telefone */}
        <div className="space-y-1">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="tel"
              placeholder="(62) 99999-9999"
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

        {/* Campo Email */}
        <div className="space-y-1">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <Input
              type="email"
              placeholder="Email (ex: usuario@dominio.com)"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.email ? 'border-red-500' : ''}`}
              required
            />
          </div>
          {formErrors.email && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.email}</span>
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
              onBlur={handleInstagramBlur}
              className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${formErrors.instagram ? 'border-red-500' : ''}`}
              required
              disabled={isValidatingInstagram}
            />
            {isValidatingInstagram && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
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
          type="submit"
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
            <strong>Após o cadastro:</strong> Você receberá um email com login e senha para acessar o sistema e poderá gerar seus próprios links de cadastro.
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