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
  Home,
  CalendarDays,
  UserCheck
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useUserLinks } from "@/hooks/useUserLinks";

export default function Dashboard() {
  const [userLink, setUserLink] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterReferrer, setFilterReferrer] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isMembro, isAmigo, isConvidado, canViewAllUsers, canViewOwnUsers, canViewStats, canGenerateLinks } = useAuth();

  // Lógica de filtro por referrer:
  // - Admin: vê todos os usuários (sem filtro)
  // - Outros roles: vê apenas usuários que eles indicaram (filtro por user.full_name)
  const isAdminUser = isAdmin();
  const referrerFilter = isAdminUser ? undefined : user?.full_name;
  const userIdFilter = isAdminUser ? undefined : user?.id;
  
  // Debug: verificar se admin está sendo detectado corretamente
  console.log('🔍 Debug Admin:', {
    user: user?.username,
    role: user?.role,
    isAdmin: isAdminUser,
    referrerFilter,
    userIdFilter
  });

  // Debug adicional: verificar todas as funções de role
  console.log('🔍 Debug Roles:', {
    username: user?.username,
    role: user?.role,
    isAdmin: isAdmin(),
    isMembro: isMembro(),
    isAmigo: isAmigo(),
    isConvidado: isConvidado(),
    fullName: user?.full_name
  });

  const { users: allUsers, loading: usersLoading } = useUsers(referrerFilter);
  const { stats, loading: statsLoading } = useStats(referrerFilter);
  const { reportData, loading: reportsLoading } = useReports(referrerFilter);
  const { userLinks, createLink, loading: linksLoading } = useUserLinks(userIdFilter);

  // Debug: verificar o que está sendo passado para os hooks
  console.log('🔍 Debug Hooks:', {
    referrerFilter,
    userIdFilter,
    allUsersCount: allUsers.length,
    firstUserReferrer: allUsers[0]?.referrer
  });

  // Debug: verificar dados carregados
  console.log('📊 Debug Dados:', {
    totalUsers: allUsers.length,
    firstUserReferrer: allUsers[0]?.referrer,
    userFullName: user?.full_name,
    shouldSeeAll: isAdminUser,
    shouldSeeOnly: user?.full_name
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const generateLink = async () => {
    if (!user?.id || !user?.full_name) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    const result = await createLink(user.id, user.full_name);
    
    if (result.success && result.data) {
      const newLink = `${window.location.origin}/cadastro/${result.data.link_id}`;
      setUserLink(newLink);
      
      // Copiar para área de transferência
      navigator.clipboard.writeText(newLink);
      
      toast({
        title: "Link gerado e copiado!",
        description: `Link específico para ${user.name} foi copiado para a área de transferência.`,
      });
    } else {
      toast({
        title: "Erro ao gerar link",
        description: 'error' in result ? result.error : "Tente novamente.",
        variant: "destructive",
      });
    }
  };


  // Filtrar usuários baseado na pesquisa e filtros específicos
  const filteredUsers = allUsers.filter(userItem => {
    const matchesSearch = searchTerm === "" || 
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.phone.includes(searchTerm) ||
      userItem.instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.referrer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "" || userItem.status === filterStatus;
    
    const matchesDate = filterDate === "" || userItem.registration_date === filterDate;
    
    const matchesReferrer = filterReferrer === "" || userItem.referrer.toLowerCase().includes(filterReferrer.toLowerCase());

    return matchesSearch && matchesStatus && matchesDate && matchesReferrer;
  });

  // Loading state
  if (usersLoading || statsLoading || reportsLoading || linksLoading) {
    return (
      <div className="min-h-screen bg-institutional-blue flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando dados do banco...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-institutional-blue">
      {/* Header Personalizado */}
      <header className="bg-white shadow-md border-b-2 border-institutional-gold">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-institutional-blue font-medium">Bem-vindo, {user?.name}</span>
                <div className="text-sm text-muted-foreground">{user?.role}</div>
              </div>
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
              Dashboard - Projeto Base de Membros
                {isAdmin() && (
                <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {user?.username === 'admin' ? 'ADMIN' : 'VEREADOR'}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
                {isAdminUser
                ? "Visão geral completa do sistema - Todos os usuários e dados consolidados"
                : "Gerencie sua rede de membros e acompanhe resultados"
              }
            </p>
          </div>
          
            {(canGenerateLinks() || isAdminUser) && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={generateLink}
              className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue font-medium"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {isAdminUser ? 'Gerar e Copiar Link' : 'Gerar e Copiar Link'}
            </Button>
            
          </div>
          )}
        </div>

        {userLink && (
          <div className="mt-4 p-3 bg-institutional-light rounded-lg border border-institutional-gold/30">
            <p className="text-sm text-institutional-blue font-medium mb-1">
              {isAdminUser ? 'Link para cadastro de Membro:' : 'Seu link único:'}
            </p>
            <code className="text-xs break-all text-muted-foreground">{userLink}</code>
          </div>
        )}
      </div>


        {/* Gráficos de Estatísticas - Primeira Linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Barras - Usuários por Localização */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                  Setor por cidade
              </CardTitle>
              <CardDescription>
                {isAdminUser 
                  ? 'Distribuição por setor - Todos os usuários' 
                  : ''
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(reportData.usersByLocation).map(([location, count]) => ({ location, quantidade: count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Status dos Usuários */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Status dos Usuários
              </CardTitle>
              <CardDescription>
                Distribuição por atividade no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.usersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.usersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Estatísticas - Segunda Linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Barras - Setores por Cidade */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                 Pessoas por Setor
              </CardTitle>
              <CardDescription>
                Quantidade de Pessoas cadastrados em cada setor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(reportData.usersByLocation).map(([location, count]) => {
                  const [city, sector] = location.split(' - ');
                  return { setor: sector, quantidade: count };
                }).reduce((acc, item) => {
                  const existing = acc.find(x => x.setor === item.setor);
                  if (existing) {
                    existing.quantidade += item.quantidade;
                  } else {
                    acc.push(item);
                  }
                  return acc;
                }, [] as { setor: string; quantidade: number }[])}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="setor" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Pessoas Cadastradas por Cidade */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Pessoas Cadastradas por Cidade
              </CardTitle>
              <CardDescription>
                Total de pessoas cadastradas em cada cidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(reportData.usersByCity).map(([city, count]) => ({ city, quantidade: count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Estatísticas - Terceira Linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Linha - Cadastros Recentes */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <TrendingUp className="w-5 h-5" />
                Cadastros Recentes
              </CardTitle>
              <CardDescription>
                Últimos 7 dias - {stats.recent_registrations} novos cadastros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.registrationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Registros por Links */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Share2 className="w-5 h-5" />
                Pessoas com mais cadastros
              </CardTitle>
              <CardDescription>
                {isAdminUser 
                  ? 'Link com maior número de registros do sistema' 
                  : 'Seu link com maior número de registros'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userLinks.length > 0 ? (
                (() => {
                  const topLink = userLinks.reduce((max, link) => 
                    link.registration_count > max.registration_count ? link : max
                  );
                  
                  return (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-institutional-gold mb-2">
                          {topLink.registration_count}
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Registros via link
                        </div>
                        <div className="bg-institutional-light p-4 rounded-lg">
                          <div className="text-sm font-medium text-institutional-blue mb-1">
                            Link de: {topLink.referrer_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {topLink.click_count} cliques • Criado em {new Date(topLink.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-institutional-gold h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((topLink.registration_count / Math.max(...userLinks.map(l => l.registration_count))) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhum link encontrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Novos Reports - Engagement Rate e Registration Count */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Taxa de Engajamento */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <TrendingUp className="w-5 h-5" />
                Taxa de Uso do sistema
              </CardTitle>
              <CardDescription>
                {isAdminUser 
                  ? 'Taxa de engajamento geral do sistema' 
                  : 'Sua taxa de engajamento'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="text-4xl font-bold text-institutional-gold mb-2">
                    {stats.engagement_rate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.engagement_rate >= 80 ? 'Excelente engajamento!' : 
                     stats.engagement_rate >= 60 ? 'Bom engajamento' : 
                     stats.engagement_rate >= 40 ? 'Engajamento moderado' : 
                     'Engajamento baixo'}
                  </div>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-institutional-gold h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.engagement_rate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card vazio para manter alinhamento */}
          <div></div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Cadastros</p>
                  <p className="text-2xl font-bold text-institutional-blue">{stats.total_users}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Usuários Ativos no Sistema</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_users}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Cadastros Hoje</p>
                  <p className="text-2xl font-bold text-green-600">{stats.today_registrations}</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Calendar className="w-6 h-6 text-green-600" />
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
              {isAdminUser ? 'Todos os Usuários do Sistema' : 'Meus Usuários Cadastrados'}
            </CardTitle>
            <CardDescription>
              {isAdminUser
                ? "Visão consolidada de todos os usuários cadastrados no sistema"
                : "Gerencie e visualize todos os usuários vinculados ao seu link"
              }
            </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por indicador..."
                value={filterReferrer}
                onChange={(e) => setFilterReferrer(e.target.value)}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Filtrar por data..."
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
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
                <option value="Ativo">Ativo no Sistema</option>
                <option value="Inativo">Inativo no Sistema</option>
              </select>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-institutional-light">
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Setor</th>
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
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.phone}</span>
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
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{user.sector}</span>
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
                          <span className="text-sm">{new Date(user.registration_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'Ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'Ativo' ? 'Ativo no Sistema' : 'Inativo no Sistema'}
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
             
        
              </div>
            
           
            </div>
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}