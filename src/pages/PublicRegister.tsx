import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Instagram, UserPlus, CheckCircle, MapPin, Building } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Extrair informações do usuário do linkId
  const getUserFromLinkId = (linkId: string | undefined) => {
    if (!linkId) return "Usuário do Sistema";
    
    // Extrair username do linkId (formato: username-timestamp)
    const username = linkId.split('-')[0];
    
    // Mapear username para nome completo
    const userMap: Record<string, string> = {
      joao: "João Silva - Coordenador",
      marcos: "Marcos Santos - Colaborador",
      admin: "Admin - Administrador"
    };
    
    return userMap[username] || "Usuário do Sistema";
  };

  const referrerName = getUserFromLinkId(linkId);

  const validateInstagram = (value: string) => {
    const instagramRegex = /^@?[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/;
    return instagramRegex.test(value.replace('@', ''));
  };

  const validatePhone = (value: string) => {
    const phoneRegex = /^\d{10,11}$/;
    return phoneRegex.test(value.replace(/\D/g, ''));
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'phone') {
      processedValue = value.replace(/\D/g, '');
    } else if (field === 'instagram' && value && !value.startsWith('@')) {
      processedValue = '@' + value;
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  // Preencher automaticamente o campo referrer com o nome de quem gerou o link
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, referrer: referrerName }));
  }, [referrerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações
    if (!validatePhone(formData.phone)) {
      toast({
        title: "Telefone inválido",
        description: "Digite um telefone válido com 10 ou 11 dígitos.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!validateInstagram(formData.instagram)) {
      toast({
        title: "Instagram inválido",
        description: "Digite um nome de usuário válido do Instagram.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulação de cadastro - seria integrado com Supabase
    setTimeout(() => {
      setIsSuccess(true);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Cadastro vinculado a ${referrerName}. As credenciais de acesso foram enviadas para seu email.`,
      });
      setIsLoading(false);
    }, 2000);
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
                {referrerName}
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
          <p className="font-bold text-institutional-gold">{referrerName}</p>
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
        <div className="relative">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Nome Completo"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            required
          />
        </div>

        {/* Campo Endereço */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Endereço"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            required
          />
        </div>

        {/* Campos UF e Cidade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="UF"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
              maxLength={2}
              required
            />
          </div>
          <div className="relative">
            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Cidade"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
              required
            />
          </div>
        </div>

        {/* Campo Bairro */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Bairro"
            value={formData.neighborhood}
            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            required
          />
        </div>

        {/* Campo Telefone */}
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="tel"
            placeholder="Telefone (11999999999)"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            maxLength={11}
            required
          />
        </div>

        {/* Campo Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            required
          />
        </div>

        {/* Campo Instagram */}
        <div className="relative">
          <Instagram className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Instagram (@seuusuario)"
            value={formData.instagram}
            onChange={(e) => handleInputChange('instagram', e.target.value.replace('@', ''))}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg"
            required
          />
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