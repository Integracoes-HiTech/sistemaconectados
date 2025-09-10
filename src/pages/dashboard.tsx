import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { 
  Users, 
  MessageSquare, 
  Link as LinkIcon, 
  TrendingUp, 
  Calendar,
  Share2,
  ChevronRight,
  BarChart3,
  Search,
  Phone,
  Mail,
  Instagram,
  User as UserIcon,
  MapPin,
  Building,
  Home
} from "lucide-react";

export default function Dashboard() {
  const [userLink, setUserLink] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstagram, setFilterInstagram] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterReferrer, setFilterReferrer] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Obter informações do usuário logado
  const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
  const userName = loggedUser.fullName || "Usuário";

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
  };

  const generateLink = () => {
    // Geração de link específico para o usuário logado
    const userSpecificId = `${loggedUser.username}-${Date.now()}`;
    const newLink = `${window.location.origin}/cadastro/${userSpecificId}`;
    setUserLink(newLink);
    
    toast({
      title: "Link gerado com sucesso!",
      description: `Link específico para ${loggedUser.name} copiado para a área de transferência.`,
    });
    
    navigator.clipboard.writeText(newLink);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(userLink);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  // Dados específicos por usuário
  const getUserSpecificData = (username: string) => {
    // Dados consolidados para admin
    const allUsersData = [
      // Usuários do João
      { id: 1, name: "Maria Silva Santos", address: "Rua das Flores, 123", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Centro", phone: "62987654321", email: "maria.silva@email.com", instagram: "@mariasilva", referrer: "João Silva - Coordenador", registrationDate: "2024-01-15", status: "Ativo" },
      { id: 2, name: "João Pedro Oliveira", address: "Av. Independência, 456", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Olímpico", phone: "62976543210", email: "joao.pedro@email.com", instagram: "@joaopedro", referrer: "João Silva - Coordenador", registrationDate: "2024-01-14", status: "Ativo" },
      { id: 3, name: "Ana Carolina Costa", address: "Rua 7, 789", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Vila São José", phone: "62965432109", email: "ana.carolina@email.com", instagram: "@anacarolina", referrer: "João Silva - Coordenador", registrationDate: "2024-01-13", status: "Ativo" },
      { id: 4, name: "Carlos Eduardo Lima", address: "Rua 9, 321", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Nova Era", phone: "62954321098", email: "carlos.eduardo@email.com", instagram: "@carloseduardo", referrer: "João Silva - Coordenador", registrationDate: "2024-01-12", status: "Ativo" },
      { id: 5, name: "Fernanda Rodrigues", address: "Av. Perimetral Norte, 654", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Central", phone: "62943210987", email: "fernanda.rodrigues@email.com", instagram: "@fernandarodrigues", referrer: "João Silva - Coordenador", registrationDate: "2024-01-11", status: "Ativo" },
      
      
      // Usuários do Marcos
      { id: 6, name: "Camila Ribeiro", address: "Rua 20, 600", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim dos Ipês", phone: "62987654321", email: "camila.ribeiro@email.com", instagram: "@camilaribeiro", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-05", status: "Ativo" },
      { id: 7, name: "Diego Pereira", address: "Av. Perimetral Sul, 700", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Bueno", phone: "62966554433", email: "diego.pereira@email.com", instagram: "@diegoapereira", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-04", status: "Ativo" },
      { id: 8, name: "Larissa Oliveira", address: "Rua 25, 800", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Vila Redenção", phone: "62955443322", email: "larissa.oliveira@email.com", instagram: "@larissaoliveira", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-03", status: "Ativo" },
      { id: 9, name: "Thiago Silva", address: "Av. Independência, 900", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Olímpico", phone: "62944332211", email: "thiago.silva@email.com", instagram: "@thiagosilva", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-02", status: "Ativo" },
      { id: 10, name: "Beatriz Costa", address: "Rua 30, 1000", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Central", phone: "62933221100", email: "beatriz.costa@email.com", instagram: "@beatrizcosta", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-01", status: "Ativo" },
      
      // Usuários adicionais para admin
      { id: 11, name: "Eduardo Martins", address: "Rua 35, 150", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Nova Esperança", phone: "62987654321", email: "eduardo.martins@email.com", instagram: "@eduardomartins", referrer: "João Silva - Coordenador", registrationDate: "2024-01-20", status: "Ativo" },
      { id: 12, name: "Felipe Nunes", address: "Rua 40, 350", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Vila São João", phone: "62987654321", email: "felipe.nunes@email.com", instagram: "@felipenunes", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-18", status: "Ativo" },
      { id: 13, name: "Mariana Dias", address: "Av. Perimetral Norte, 450", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Central", phone: "62976543210", email: "mariana.dias@email.com", instagram: "@marianadias", referrer: "João Silva - Coordenador", registrationDate: "2024-01-17", status: "Inativo" },
    ];

    const userData = {
      joao: {
        stats: [
    {
      title: "Total de Cadastros",
      value: "1,247",
      change: "+12%",
      icon: Users,
      color: "text-institutional-blue",
      bgColor: "bg-institutional-light"
    },
    {
      title: "Postagens Hoje",
      value: "89",
      subtitle: "de 1,247 cadastrados",
      change: "+5%",
      icon: MessageSquare,
      color: "text-institutional-gold",
      bgColor: "bg-institutional-gold/10"
    },
    {
      title: "Taxa de Engajamento",
      value: "7.1%",
      change: "+2.4%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Novos Hoje",
      value: "23",
      change: "+8",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
        ],
        users: [
          { id: 1, name: "Maria Silva Santos", address: "Rua das Flores, 123", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Centro", phone: "62987654321", email: "maria.silva@email.com", instagram: "@mariasilva", referrer: "João Silva - Coordenador", registrationDate: "2024-01-15", status: "Ativo" },
          { id: 2, name: "João Pedro Oliveira", address: "Av. Independência, 456", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Olímpico", phone: "62976543210", email: "joao.pedro@email.com", instagram: "@joaopedro", referrer: "João Silva - Coordenador", registrationDate: "2024-01-14", status: "Ativo" },
          { id: 3, name: "Ana Carolina Costa", address: "Rua 7, 789", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Vila São José", phone: "62965432109", email: "ana.carolina@email.com", instagram: "@anacarolina", referrer: "João Silva - Coordenador", registrationDate: "2024-01-13", status: "Ativo" },
          { id: 4, name: "Carlos Eduardo Lima", address: "Rua 9, 321", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Nova Era", phone: "62954321098", email: "carlos.eduardo@email.com", instagram: "@carloseduardo", referrer: "João Silva - Coordenador", registrationDate: "2024-01-12", status: "Ativo" },
          { id: 5, name: "Fernanda Rodrigues", address: "Av. Perimetral Norte, 654", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Central", phone: "62943210987", email: "fernanda.rodrigues@email.com", instagram: "@fernandarodrigues", referrer: "João Silva - Coordenador", registrationDate: "2024-01-11", status: "Ativo" }
        ]
      },
      marcos: {
        stats: [
          {
            title: "Total de Cadastros",
            value: "432",
            change: "+15%",
            icon: Users,
            color: "text-institutional-blue",
            bgColor: "bg-institutional-light"
          },
          {
            title: "Postagens Hoje",
            value: "34",
            subtitle: "de 432 cadastrados",
            change: "+7%",
            icon: MessageSquare,
            color: "text-institutional-gold",
            bgColor: "bg-institutional-gold/10"
          },
          {
            title: "Taxa de Engajamento",
            value: "7.9%",
            change: "+3.1%",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50"
          },
          {
            title: "Novos Hoje",
            value: "12",
            change: "+4",
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
          }
        ],
        users: [
          { id: 1, name: "Camila Santos", address: "Rua 20, 600", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim dos Ipês", phone: "62987654321", email: "camila.santos@email.com", instagram: "@camilasantos", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-05", status: "Ativo" },
          { id: 2, name: "Diego Pereira", address: "Av. Perimetral Sul, 700", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Bueno", phone: "62966554433", email: "diego.pereira@email.com", instagram: "@diegoapereira", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-04", status: "Ativo" },
          { id: 3, name: "Larissa Oliveira", address: "Rua 25, 800", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Vila Redenção", phone: "62955443322", email: "larissa.oliveira@email.com", instagram: "@larissaoliveira", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-03", status: "Ativo" },
          { id: 4, name: "Thiago Silva", address: "Av. Independência, 900", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Jardim Olímpico", phone: "62944332211", email: "thiago.silva@email.com", instagram: "@thiagosilva", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-02", status: "Ativo" },
          { id: 5, name: "Beatriz Costa", address: "Rua 30, 1000", state: "GO", city: "Aparecida de Goiânia", neighborhood: "Setor Central", phone: "62933221100", email: "beatriz.costa@email.com", instagram: "@beatrizcosta", referrer: "Marcos Santos - Colaborador", registrationDate: "2024-01-01", status: "Ativo" }
        ]
      },
      admin: {
        stats: [
          {
            title: "Total de Cadastros",
            value: "1,891",
            change: "+12%",
            icon: Users,
            color: "text-institutional-blue",
            bgColor: "bg-institutional-light"
          },
          {
            title: "Usuários Ativos",
            value: "1,890",
            subtitle: "de 1,891 cadastrados",
            change: "+8%",
            icon: MessageSquare,
            color: "text-institutional-gold",
            bgColor: "bg-institutional-gold/10"
          },
          {
            title: "Taxa de Engajamento",
            value: "99.9%",
            change: "+3.2%",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50"
          },
          {
            title: "Novos Hoje",
            value: "29",
            change: "+7",
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
          }
        ],
        users: allUsersData
      }
    };

    // Se for admin ou wegneycosta, retorna dados consolidados
    if (username === 'admin' || username === 'wegneycosta') {
      return userData.admin;
    }

    return userData[username as keyof typeof userData] || userData.joao;
  };

  const userData = getUserSpecificData(loggedUser.username);
  const mockUsers = userData.users;

  // Filtrar usuários baseado na pesquisa e filtros
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.referrer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesInstagram = filterInstagram === "" || user.instagram.toLowerCase().includes(filterInstagram.toLowerCase());
    const matchesEmail = filterEmail === "" || user.email.toLowerCase().includes(filterEmail.toLowerCase());
    const matchesPhone = filterPhone === "" || user.phone.includes(filterPhone);
    const matchesAddress = filterAddress === "" || user.address.toLowerCase().includes(filterAddress.toLowerCase());
    const matchesCity = filterCity === "" || user.city.toLowerCase().includes(filterCity.toLowerCase());
    const matchesNeighborhood = filterNeighborhood === "" || user.neighborhood.toLowerCase().includes(filterNeighborhood.toLowerCase());
    const matchesStatus = filterStatus === "" || user.status === filterStatus;
    const matchesReferrer = filterReferrer === "" || user.referrer.toLowerCase().includes(filterReferrer.toLowerCase());

    return matchesSearch && matchesInstagram && matchesEmail && matchesPhone && matchesAddress && matchesCity && matchesNeighborhood && matchesStatus && matchesReferrer;
  });

  // Calcular estatísticas dinâmicas baseadas nos dados filtrados
  const calculateStats = () => {
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(user => user.status === "Ativo").length;
    
    // Usuários por cidade/bairro
    const usersByLocation = filteredUsers.reduce((acc, user) => {
      const location = `${user.city} - ${user.neighborhood}`;
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Cadastros recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = filteredUsers.filter(user => {
      const regDate = new Date(user.registrationDate);
      return regDate >= sevenDaysAgo;
    });
    
    // Cadastros por dia (últimos 7 dias)
    const registrationsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = filteredUsers.filter(user => user.registrationDate === dateStr).length;
      registrationsByDay.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count
      });
    }
    
    return {
      totalUsers,
      activeUsers,
      usersByLocation,
      recentRegistrations: recentRegistrations.length,
      registrationsByDay,
      engagementRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0"
    };
  };

  const dynamicStats = calculateStats();

  return (
    <div className="min-h-screen bg-institutional-blue">
      {/* Header Personalizado */}
      <header className="bg-white shadow-md border-b-2 border-institutional-gold">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <span className="text-institutional-blue font-medium">Bem-vindo, {userName}</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
      {/* Header Fixed */}
      <div className="bg-white shadow-[var(--shadow-card)] rounded-lg p-6 mb-8 border border-institutional-light">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-institutional-blue">
              Dashboard - Projeto Base Eleitoral
              {(loggedUser.username === 'admin' || loggedUser.username === 'wegneycosta') && (
                <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  {loggedUser.username === 'admin' ? 'ADMIN' : 'VEREADOR'}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {(loggedUser.username === 'admin' || loggedUser.username === 'wegneycosta')
                ? "Visão geral completa do sistema - Todos os usuários e dados consolidados"
                : "Gerencie sua rede eleitoral e acompanhe resultados"
              }
            </p>
          </div>
          
          {loggedUser.username !== 'admin' && loggedUser.username !== 'wegneycosta' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={generateLink}
              className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Gerar Link Único
            </Button>
            
            {userLink && (
              <Button
                onClick={copyLink}
                variant="outline"
                className="border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
            )}
          </div>
          )}
        </div>

        {userLink && (
          <div className="mt-4 p-3 bg-institutional-light rounded-lg border border-institutional-gold/30">
            <p className="text-sm text-institutional-blue font-medium mb-1">Seu link único:</p>
            <code className="text-xs break-all text-muted-foreground">{userLink}</code>
          </div>
        )}
      </div>

        {/* Gráficos de Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Barras - Usuários por Cidade/Bairro */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                Usuários por Localização
              </CardTitle>
              <CardDescription>
                Distribuição por cidade e bairro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(dynamicStats.usersByLocation).map(([location, count]) => ({ location, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Linha - Cadastros Recentes */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <TrendingUp className="w-5 h-5" />
                Cadastros Recentes
              </CardTitle>
              <CardDescription>
                Últimos 7 dias - {dynamicStats.recentRegistrations} novos cadastros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dynamicStats.registrationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Pizza - Status dos Usuários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Status dos Usuários
              </CardTitle>
              <CardDescription>
                Distribuição por status de cadastro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Ativos", value: dynamicStats.activeUsers, color: "#10B981" },
                      { name: "Inativos", value: dynamicStats.totalUsers - dynamicStats.activeUsers, color: "#EF4444" }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Ativos", value: dynamicStats.activeUsers, color: "#10B981" },
                      { name: "Inativos", value: dynamicStats.totalUsers - dynamicStats.activeUsers, color: "#EF4444" }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Cadastros</p>
                  <p className="text-2xl font-bold text-institutional-blue">{dynamicStats.totalUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-institutional-light">
                  <Users className="w-6 h-6 text-institutional-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{dynamicStats.activeUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cadastros Recentes</p>
                  <p className="text-2xl font-bold text-blue-600">{dynamicStats.recentRegistrations}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Engajamento</p>
                  <p className="text-2xl font-bold text-institutional-gold">{dynamicStats.engagementRate}%</p>
                </div>
                <div className="p-3 rounded-full bg-institutional-gold/10">
                  <MessageSquare className="w-6 h-6 text-institutional-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <BarChart3 className="w-5 h-5" />
              Gráfico de Cadastros
            </CardTitle>
            <CardDescription>
              Integração com Metabase - Cadastros por período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-institutional-light rounded-lg flex items-center justify-center border-2 border-dashed border-institutional-gold/50">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-institutional-gold mx-auto mb-2" />
                <p className="text-institutional-blue font-medium">Gráfico Metabase</p>
                <p className="text-sm text-muted-foreground">
                  Iframe será integrado aqui
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <TrendingUp className="w-5 h-5" />
              Relatório de Postagens
            </CardTitle>
            <CardDescription>
              Análise de engajamento diário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-institutional-light rounded-lg">
                <div>
                  <p className="font-medium text-institutional-blue">Hoje</p>
                  <p className="text-sm text-muted-foreground">89 de 1,247 postaram</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-institutional-gold">7.1%</p>
                  <p className="text-sm text-green-600">+2.4%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meta do mês</span>
                  <span className="text-institutional-blue font-medium">10%</span>
                </div>
                <div className="w-full bg-institutional-light rounded-full h-2">
                  <div
                    className="bg-institutional-gold rounded-full h-2"
                    style={{ width: "71%" }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Pesquisa de Usuários */}
      <Card className="shadow-[var(--shadow-card)] mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-institutional-blue">
            <Users className="w-5 h-5" />
            {(loggedUser.username === 'admin' || loggedUser.username === 'wegneycosta') ? 'Todos os Usuários do Sistema' : 'Usuários Cadastrados'}
          </CardTitle>
          <CardDescription>
            {(loggedUser.username === 'admin' || loggedUser.username === 'wegneycosta')
              ? "Visão consolidada de todos os usuários cadastrados no sistema"
              : "Gerencie e visualize todos os usuários vinculados ao seu link"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros Avançados */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por qualquer campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>
            
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por Instagram..."
                value={filterInstagram}
                onChange={(e) => setFilterInstagram(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por email..."
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por telefone..."
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por endereço..."
                value={filterAddress}
                onChange={(e) => setFilterAddress(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por cidade..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por bairro..."
                value={filterNeighborhood}
                onChange={(e) => setFilterNeighborhood(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-institutional-light rounded-md focus:border-institutional-gold focus:ring-institutional-gold bg-white"
              >
                <option value="">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por indicador..."
                value={filterReferrer}
                onChange={(e) => setFilterReferrer(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-institutional-light">
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Endereço</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">UF</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Bairro</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Telefone</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Indicado por</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Data Cadastro</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-institutional-gold" />
                        </div>
                        <span className="font-medium text-institutional-blue">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{user.state}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.neighborhood}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-pink-600">{user.instagram}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-institutional-gold font-medium">{user.referrer}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(user.registrationDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum usuário encontrado com os critérios de pesquisa.</p>
              </div>
            )}
          </div>

          {/* Resumo */}
          <div className="mt-6 p-4 bg-institutional-light rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de usuários cadastrados</p>
                <p className="text-2xl font-bold text-institutional-blue">{mockUsers.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Resultados encontrados</p>
                <p className="text-2xl font-bold text-institutional-gold">{filteredUsers.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Taxa de engajamento</p>
                <p className="text-2xl font-bold text-green-600">{dynamicStats.engagementRate}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </main>s
    </div>
  );
}