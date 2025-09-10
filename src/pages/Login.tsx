import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Credenciais mockadas para demonstração
  const mockCredentials = {
    joao: "coordenador",
    marcos: "colaborador",
    admin: "admin123",
    wegneycosta: "vereador"
  };

  // Informações dos usuários
  const userInfo = {
    joao: { name: "João Silva", role: "Coordenador", fullName: "João Silva - Coordenador" },
    marcos: { name: "Marcos Santos", role: "Colaborador", fullName: "Marcos Santos - Colaborador" },
    admin: { name: "Admin", role: "Administrador", fullName: "Admin - Administrador" },
    wegneycosta: { name: "Wegney Costa", role: "Vereador", fullName: "Wegney Costa - Vereador" }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulação de login - aqui seria integrado com Supabase
    setTimeout(() => {
      const normalizedUsername = username.toLowerCase().trim();
      const expectedPassword = mockCredentials[normalizedUsername as keyof typeof mockCredentials];
      
      // Debug logs (remover em produção)
      console.log('Tentativa de login:', {
        username: normalizedUsername,
        password: password,
        expectedPassword: expectedPassword,
        isValid: expectedPassword === password
      });
      
      const isValidUser = expectedPassword === password;
      
      if (isValidUser) {
        const user = userInfo[normalizedUsername as keyof typeof userInfo];
        
        if (!user) {
          toast({
            title: "Erro no sistema",
            description: "Usuário não encontrado no sistema.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${user.name}! Redirecionando para o dashboard...`,
        });
        
        // Armazenar informações do usuário no localStorage
        localStorage.setItem('loggedUser', JSON.stringify({
          username: normalizedUsername,
          ...user
        }));
        
        // Redirecionamento para o dashboard após 1 segundo
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        toast({
          title: "Erro no login",
          description: `Usuário ou senha incorretos. Verifique as credenciais e tente novamente.`,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-institutional-blue flex flex-col items-center justify-center p-4">
      {/* Logo no topo */}
      <div className="mb-12">
        <Logo size="lg" showText={true} layout="vertical" textColor="white" />
      </div>

      {/* Formulário de Login */}
      <div className="w-full max-w-md space-y-6">
        {/* Campo Username */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg transition-all duration-200"
            required
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        {/* Campo Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-12 pr-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg transition-all duration-200"
            required
            autoComplete="current-password"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e as React.FormEvent<HTMLInputElement>);
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-institutional-gold transition-colors duration-200"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Botão Log In */}
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full h-12 bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-semibold text-lg rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-institutional-blue border-t-transparent rounded-full animate-spin" />
              Entrando...
            </div>
          ) : (
            "Entrar"
          )}
        </Button>
      </div>
    </div>
  );
}