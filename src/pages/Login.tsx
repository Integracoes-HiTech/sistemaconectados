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

  const handleGoogleLogin = () => {
    toast({
      title: "Login com Google",
      description: "Funcionalidade em desenvolvimento. Use o login tradicional por enquanto.",
      variant: "default",
    });
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

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-institutional-blue text-gray-400">ou</span>
          </div>
        </div>

        {/* Botão Login com Google */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="outline"
          className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 font-medium text-lg rounded-lg border border-gray-300 transition-all duration-200 flex items-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}