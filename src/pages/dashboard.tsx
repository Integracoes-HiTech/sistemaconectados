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
  UserCheck,
  Settings,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { useUserLinks } from "@/hooks/useUserLinks";
import { useMembers } from "@/hooks/useMembers";
import type { Member } from "@/hooks/useMembers";
import { useFriendsRanking } from "@/hooks/useFriendsRanking";
import type { FriendRanking } from "@/hooks/useFriendsRanking";
import { useExportReports } from "@/hooks/useExportReports";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export default function Dashboard() {
  
  const [userLink, setUserLink] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneSearchTerm, setPhoneSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterReferrer, setFilterReferrer] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterSector, setFilterSector] = useState("");
  
  // Filtros para amigos
  const [friendsSearchTerm, setFriendsSearchTerm] = useState("");
  const [friendsPhoneSearchTerm, setFriendsPhoneSearchTerm] = useState("");
  const [friendsMemberFilter, setFriendsMemberFilter] = useState("");
  
  // Estados de paginação
  const [membersCurrentPage, setMembersCurrentPage] = useState(1);
  const [friendsCurrentPage, setFriendsCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // 50 itens por página para melhor performance com grandes volumes
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isMembro, isAmigo, isConvidado, canViewAllUsers, canViewOwnUsers, canViewStats, canGenerateLinks } = useAuth();

  // Função para remover membro (soft delete - apenas administradores)
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem remover membros.",
        variant: "destructive",
      });
      return;
    }

    const confirmRemove = window.confirm(
      `Tem certeza que deseja excluir o membro "${memberName}"?`
    );

    if (!confirmRemove) return;

    try {
      // Usar a função de soft delete do hook useMembers
      const result = await softDeleteMember(memberId);
      
      if (result.success) {
        toast({
          title: "Membro excluído",
          description: `O membro "${memberName}" foi excluído com sucesso. Acesso ao sistema e links foram removidos definitivamente.`,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir membro",
        description: "Ocorreu um erro ao tentar excluir o membro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para remover amigo (soft delete - apenas administradores)
  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!isAdmin()) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem remover amigos.",
        variant: "destructive",
      });
      return;
    }

    const confirmRemove = window.confirm(
      `Tem certeza que deseja excluir o amigo "${friendName}"?`
    );

    if (!confirmRemove) return;

    try {
      const result = await softDeleteFriend(friendId);
      
      if (result.success) {
        toast({
          title: "✅ Amigo excluído",
          description: `O amigo "${friendName}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error(result.error || "Erro desconhecido");
      }
    } catch (error) {
      // Erro ao excluir amigo
      toast({
        title: "❌ Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro ao excluir amigo",
        variant: "destructive",
      });
    }
  };

  // Lógica de filtro por referrer:
  // Usuário vê todos os usuários (sem filtro)
  // - Outros roles: vê apenas usuários que eles indicaram (filtro por user.full_name)
  const isAdminUser = isAdmin();
  const referrerFilter = isAdminUser ? undefined : user?.full_name;
  const userIdFilter = isAdminUser ? undefined : user?.id;
  
  // Verificar se usuário está sendo detectado corretamente
  // Verificar todas as funções de role
  // Verificar o que está sendo passado para os hooks
  // Verificar dados carregados
  const { users: allUsers, loading: usersLoading } = useUsers(referrerFilter);
  const { stats, loading: statsLoading } = useStats(referrerFilter);
  const { reportData, loading: reportsLoading } = useReports(referrerFilter);
  const { userLinks, createLink, loading: linksLoading } = useUserLinks(userIdFilter);
  
  // Novos hooks para o sistema de membros
  const { 
    members, 
    memberStats, 
    systemSettings, 
    loading: membersLoading,
    getRankingStatusColor,
    getRankingStatusIcon,
    getTopMembers,
    getMembersByStatus,
    getMemberRole,
    softDeleteMember
  } = useMembers(referrerFilter);

  // Hook para ranking de amigos
  const { 
    friends, 
    loading: friendsLoading,
    error: friendsError,
    getFriendsStats,
    softDeleteFriend
  } = useFriendsRanking();
  
  
  const { 
    exportToPDF, 
    exportMembersToExcel, 
    exportContractsToExcel, 
    exportStatsToExcel,
    exportFriendsToExcel
  } = useExportReports();
  
  const { 
    settings, 
    phases, 
    loading: settingsLoading,
    shouldShowMemberLimitAlert,
    getMemberLimitStatus,
    canActivatePaidContracts,
    activatePaidContractsPhase,
    updateMemberLinksType
  } = useSystemSettings();

  // Verificar o que está sendo passado para os hooks
  // Verificar dados carregados

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


  // Filtrar membros baseado na pesquisa e filtros específicos (apenas membros, não amigos)
  const filteredMembers = members.filter(member => {
    // Filtrar apenas membros (não amigos)
    if (member.is_friend) return false;
    
    const matchesSearch = searchTerm === "" || 
      // Campos da primeira pessoa
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.referrer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Campos do parceiro
      member.couple_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.couple_instagram.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.couple_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.couple_sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Campos adicionais
      member.contracts_completed.toString().includes(searchTerm) ||
      member.ranking_position?.toString().includes(searchTerm) ||
      member.ranking_status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPhone = phoneSearchTerm === "" || 
      member.phone.includes(phoneSearchTerm) ||
      member.couple_phone.includes(phoneSearchTerm);

    const matchesStatus = filterStatus === "" || member.ranking_status === filterStatus;
    
    const matchesReferrer = filterReferrer === "" || member.referrer.toLowerCase().includes(filterReferrer.toLowerCase());
    
    const matchesCity = filterCity === "" || member.city.toLowerCase().includes(filterCity.toLowerCase());
    
    const matchesSector = filterSector === "" || member.sector.toLowerCase().includes(filterSector.toLowerCase());

    return matchesSearch && matchesPhone && matchesStatus && matchesReferrer && matchesCity && matchesSector;
  }).sort((a, b) => {
    // Ordenar por ranking_position (menor número = melhor posição = mais contratos)
    // Se ranking_position for null, colocar no final
    if (a.ranking_position === null && b.ranking_position === null) return 0;
    if (a.ranking_position === null) return 1;
    if (b.ranking_position === null) return -1;
    return a.ranking_position - b.ranking_position;
  });

  // Filtrar amigos baseado na pesquisa e filtros específicos
  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friendsSearchTerm === "" || 
      // Campos da primeira pessoa
      friend.name.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.instagram.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.city.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.sector.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.referrer.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      // Campos do parceiro
      friend.couple_name.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.couple_instagram.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.couple_city.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      friend.couple_sector.toLowerCase().includes(friendsSearchTerm.toLowerCase()) ||
      // Campos adicionais
      friend.contracts_completed.toString().includes(friendsSearchTerm) ||
      friend.ranking_position?.toString().includes(friendsSearchTerm);

    const matchesPhone = friendsPhoneSearchTerm === "" || 
      friend.phone.includes(friendsPhoneSearchTerm) ||
      friend.couple_phone.includes(friendsPhoneSearchTerm);

    const matchesMember = friendsMemberFilter === "" || friend.member_name.toLowerCase().includes(friendsMemberFilter.toLowerCase());

    return matchesSearch && matchesPhone && matchesMember;
  }).sort((a, b) => {
    // Ordenar por contracts_completed (mais usuários cadastrados = melhor posição)
    if (a.contracts_completed !== b.contracts_completed) {
      return b.contracts_completed - a.contracts_completed;
    }
    // Se contracts_completed for igual, ordenar por data de criação
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Funções de paginação
  const getTotalPages = (totalItems: number) => Math.ceil(totalItems / itemsPerPage);
  
  const getPaginatedData = (data: Member[] | FriendRanking[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Dados paginados
  const paginatedMembers = getPaginatedData(filteredMembers, membersCurrentPage);
  const paginatedFriends = getPaginatedData(filteredFriends, friendsCurrentPage);

  // Adicionar posição calculada aos amigos
  const friendsWithPosition = paginatedFriends.map((friend, index) => ({
    ...friend,
    calculated_position: ((friendsCurrentPage - 1) * itemsPerPage) + index + 1
  }));
  
  // Total de páginas
  const totalMembersPages = getTotalPages(filteredMembers.length);
  const totalFriendsPages = getTotalPages(filteredFriends.length);

  // Funções para navegar entre páginas
  const goToMembersPage = (page: number) => {
    setMembersCurrentPage(Math.max(1, Math.min(page, totalMembersPages)));
  };

  const goToFriendsPage = (page: number) => {
    setFriendsCurrentPage(Math.max(1, Math.min(page, totalFriendsPages)));
  };

  // Resetar paginação quando filtros mudarem
  const resetMembersPagination = () => {
    setMembersCurrentPage(1);
  };

  const resetFriendsPagination = () => {
    setFriendsCurrentPage(1);
  };


  // Loading state
  if (usersLoading || statsLoading || reportsLoading || linksLoading || membersLoading || settingsLoading) {
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
                <span className="text-institutional-blue font-medium">Bem-vindo, {user?.display_name || user?.name}</span>
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
              Dashboard - Sistema de Membros Conectados
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

        {/* Controle de Tipo de Links - Apenas Administradores */}
        {isAdmin() && (
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Settings className="w-5 h-5" />
                Tipo de Links de Cadastro de Membros
              </CardTitle>
              <CardDescription>
                Mudar para cadastrar novos membros ou amigos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informação sobre Configurações */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações do Sistema
                  </h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Tipo de links atual: <strong>
                      {settings?.member_links_type === 'members' 
                        ? 'Novos Membros (duplas)'
                        : 'Amigos'
                      }
                    </strong>
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate('/settings')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gerenciar Configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


      {/* Alerta de Limite de Membros */}
      {shouldShowMemberLimitAlert() && (() => {
        const limitStatus = getMemberLimitStatus();
        const isExceeded = limitStatus.status === 'exceeded';
        const isReached = limitStatus.status === 'reached';
        const isNear = limitStatus.status === 'near';
        
        let bgColor, textColor, iconColor, icon;
        
        if (isExceeded) {
          bgColor = 'bg-red-50 border-red-200';
          textColor = 'text-red-800';
          iconColor = 'text-red-600';
          icon = '🚨';
        } else if (isReached) {
          bgColor = 'bg-green-50 border-green-200';
          textColor = 'text-green-800';
          iconColor = 'text-green-600';
          icon = '🎯';
        } else {
          bgColor = 'bg-yellow-50 border-yellow-200';
          textColor = 'text-yellow-800';
          iconColor = 'text-yellow-600';
          icon = '⚠️';
        }
        
        return (
          <div className={`mb-8 p-4 ${bgColor} border rounded-lg`}>
            <div className="flex items-center gap-3">
              <div className={`${iconColor} text-2xl`}>{icon}</div>
              <div>
                <h3 className={`font-semibold ${textColor}`}>Alerta: {limitStatus.message}</h3>
                <p className={`${textColor.replace('800', '700')} text-sm`}>
                  {isExceeded ? (
                    <>
                      O sistema excedeu o limite de {memberStats?.max_member_limit || 1500} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos ou ajustar o limite."}
                    </>
                  ) : isReached ? (
                    <>
                      O sistema atingiu o limite de {memberStats?.max_member_limit || 1500} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos."}
                    </>
                  ) : (
                    <>
                      O sistema está próximo do limite de {memberStats?.max_member_limit || 1500} membros. 
                      Atualmente temos {memberStats?.current_member_count || 0} membros cadastrados 
                      ({limitStatus.percentage.toFixed(1)}% do limite).
                      {isAdmin() && " Considere ativar a fase de amigos ou ajustar o limite."}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

  

        {/* Gráficos de Estatísticas - Primeira Linha (Apenas Administradores) */}
        {isAdmin() && (
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

          </div>
        )}

        {/* Gráficos de Estatísticas - Segunda Linha (Apenas Administradores) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Setores Agrupados por Cidade */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <MapPin className="w-5 h-5" />
                Setores por Cidade
              </CardTitle>
              <CardDescription>
                Setores disponíveis em cada cidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {Object.entries(reportData.sectorsGroupedByCity)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([city, data]) => (
                    <div key={city} className="border-l-4 border-institutional-gold pl-4 py-2 bg-gray-50 rounded-r-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-institutional-blue text-lg">
                          {city}
                        </h4>
                        <div className="text-sm text-gray-600">
                          <span className="bg-institutional-gold text-white px-2 py-1 rounded-full text-xs mr-2">
                            {data.totalSectors} setores
                          </span>
                          <span className="bg-institutional-blue text-white px-2 py-1 rounded-full text-xs">
                            {data.count} membros
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {data.sectors.map((sector, index) => (
                          <span
                            key={index}
                            className="inline-block bg-white text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 hover:bg-institutional-light transition-colors"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                {Object.keys(reportData.sectorsGroupedByCity).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum dado de setores por cidade encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Pessoas Cadastradas por Cidade */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Membros por Cidade
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
        )}

        {/* Gráficos de Estatísticas - Terceira Linha (Apenas Administradores) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Linha - Cadastros Recentes */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <TrendingUp className="w-5 h-5" />
                Cadastros Recentes de Membros
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

          {/* Gráfico de Membro com mais Amigos */}
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-institutional-blue">
                <Users className="w-5 h-5" />
                Membro com mais amigos
              </CardTitle>
              <CardDescription>
                Membro que cadastrou mais amigos no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFriends.length > 0 ? (
                (() => {
                  // Contar amigos por membro (excluindo admin)
                  const friendsByMember = filteredFriends.reduce((acc, friend) => {
                    if (friend.member_name && friend.member_name.toLowerCase() !== 'admin') {
                      acc[friend.member_name] = (acc[friend.member_name] || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>);

                  // Encontrar o membro com mais amigos
                  const topMember = Object.entries(friendsByMember).reduce((max, [member, count]) => 
                    count > max.count ? { member, count } : max
                  , { member: '', count: 0 });

                  if (topMember.count === 0) {
                    return (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>Nenhum membro com amigos cadastrados</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-institutional-gold mb-2">
                          {topMember.count}
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          Amigos cadastrados
                        </div>
                        <div className="bg-institutional-light p-4 rounded-lg">
                          <div className="text-sm font-medium text-institutional-blue mb-1">
                            Membro: {topMember.member}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total de {Object.keys(friendsByMember).length} membros ativos
                          </div>
                        </div>
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-institutional-gold h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((topMember.count / Math.max(...Object.values(friendsByMember))) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhum amigo cadastrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Novos Reports - Engagement Rate e Registration Count (Apenas Administradores) */}
        {isAdmin() && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          </div>
        )}

        {/* Seção para Membros Não-Administradores */}
        {!isAdmin() && (
          <div className="mb-8">
            {/* Informações sobre Amigos */}
            <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-institutional-blue">
                  <CalendarDays className="w-5 h-5" />
                  Amigos
                </CardTitle>
                <CardDescription>
                  Informações sobre a fase de amigos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">📅 Fase de Amigos</h4>
                    <p className="text-blue-700 text-sm mb-2">
                      A fase de amigos será liberada em julho de 2026. 
                      Cada membro poderá cadastrar até 15 duplas pagas quando ativada.
                    </p>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CalendarDays className="w-4 h-4" />
                      <span className="text-sm font-medium">Disponível em Julho 2026</span>
                    </div>
                  </div>
                  
               
                </div>
              </CardContent>
            </Card>


            {/* Tabela dos Seus Amigos */}
            {settings?.paid_contracts_phase_active && (
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-institutional-blue">
                    <UserCheck className="w-5 h-5" />
                    Seus Amigos
                  </CardTitle>
                  <CardDescription>
                    Amigos que você cadastrou
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Dupla</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-500">
                            <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Sistema unificado - Use a tabela de amigos abaixo</p>
                            <p className="text-sm">Amigos são exibidos na seção de ranking de amigos.</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      
        {/* Cards de Resumo - Sistema de Membros (Apenas Administradores) */}
        {isAdmin() && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-institutional-blue">Resumo do Sistema</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    try {
                      // Verificar se há dados para exportar
                      if (!memberStats || (memberStats.total_members === 0 && memberStats.current_member_count === 0)) {
                        toast({
                          title: "⚠️ Nenhum dado para exportar",
                          description: "Não é possível gerar um relatório sem dados",
                          variant: "destructive",
                        });
                        return;
                      }

                      exportStatsToExcel(memberStats as unknown as Record<string, unknown>);
                      toast({
                        title: "✅ Excel exportado",
                        description: "Arquivo Excel das estatísticas foi baixado com sucesso!",
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Erro na exportação",
                        description: error instanceof Error ? error.message : "Erro ao exportar Excel",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Exportar Estatísticas Excel
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Membros</p>
                  <p className="text-2xl font-bold text-institutional-blue">{memberStats?.total_members || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {memberStats?.current_member_count || 0} / {memberStats?.max_member_limit || 1500}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-institutional-light">
                  <Users className="w-6 h-6 text-institutional-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros Verdes</p>
                  <p className="text-2xl font-bold text-green-600">{memberStats?.green_members || 0}</p>
                  <p className="text-xs text-green-600">15 contratos completos</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <div className="text-2xl">🟢</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros Amarelos</p>
                  <p className="text-2xl font-bold text-yellow-600">{memberStats?.yellow_members || 0}</p>
                  <p className="text-xs text-yellow-600">1-14 contratos</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <div className="text-2xl">🟡</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membros Vermelhos</p>
                  <p className="text-2xl font-bold text-red-600">{memberStats?.red_members || 0}</p>
                  <p className="text-xs text-red-600">0 contratos</p>
                </div>
                <div className="p-3 rounded-full bg-red-50">
                  <div className="text-2xl">🔴</div>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        )}


        {/* Cards de Amigos (se a fase estiver ativa) - Apenas Administradores */}
        {isAdmin() && settings?.paid_contracts_phase_active && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Contratos</p>
                    <p className="text-2xl font-bold text-blue-600">{filteredFriends.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-50">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Seção de Ranking de Membros (Apenas Administradores) */}
        {isAdmin() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <Users className="w-5 h-5" />
              {isAdminUser ? 'Ranking Completo de Membros' : 'Meu Ranking de Membros'}
            </CardTitle>
            <CardDescription>
              {isAdminUser
                ? "Ranking completo de todos os membros cadastrados no sistema"
                : "Seu ranking pessoal e membros vinculados ao seu link"
              }
            </CardDescription>
            {isAdmin() && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      // Verificar se há dados para exportar
                      if (!filteredMembers || filteredMembers.length === 0) {
                        toast({
                          title: "⚠️ Nenhum dado para exportar",
                          description: "Não é possível gerar um relatório sem dados",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Exportar TODOS os membros filtrados, não apenas os da página atual
                      await exportMembersToExcel(filteredMembers as unknown as Record<string, unknown>[]);
                      toast({
                        title: "✅ Excel exportado",
                        description: `Arquivo Excel com ${filteredMembers.length} membros foi baixado com sucesso!`,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Erro na exportação",
                        description: error instanceof Error ? error.message : "Erro ao exportar Excel",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      // Verificar se há dados para exportar
                      if (!filteredMembers || filteredMembers.length === 0) {
                        toast({
                          title: "⚠️ Nenhum dado para exportar",
                          description: "Não é possível gerar um relatório sem dados",
                          variant: "destructive",
                        });
                        return;
                      }

                      await exportToPDF('members-table', 'ranking_membros.pdf');
                      toast({
                        title: "✅ PDF exportado",
                        description: `Arquivo PDF com ${filteredMembers.length} membros foi baixado com sucesso!`,
                      });
                    } catch (error) {
                      toast({
                        title: "❌ Erro na exportação",
                        description: error instanceof Error ? error.message : "Erro ao exportar PDF",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            )}
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por qualquer campo (nome, Instagram, cidade, setor, parceiro, contratos, ranking)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por telefone..."
                value={phoneSearchTerm}
                onChange={(e) => {
                  setPhoneSearchTerm(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por indicador..."
                value={filterReferrer}
                onChange={(e) => {
                  setFilterReferrer(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>


            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por cidade..."
                value={filterCity}
                onChange={(e) => {
                  setFilterCity(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por setor..."
                value={filterSector}
                onChange={(e) => {
                  setFilterSector(e.target.value);
                  resetMembersPagination();
                }}
                className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
              />
            </div>

            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  resetMembersPagination();
                }}
                className="w-full pl-10 pr-4 py-2 border border-institutional-light rounded-md focus:border-institutional-gold focus:ring-institutional-gold bg-white"
              >
                <option value="">Todos os Status</option>
                <option value="Verde">🟢 Verde (15+ contratos)</option>
                <option value="Amarelo">🟡 Amarelo (1-14 contratos)</option>
                <option value="Vermelho">🔴 Vermelho (0 contratos)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Membros */}
          <div className="overflow-x-auto" id="members-table">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-institutional-light">
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Posição</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Membro e Parceiro</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Setor</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Contratos</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Indicado por</th>
                  {isAdmin() && (
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-institutional-blue">
                          {member.ranking_position || 'N/A'}
                        </span>
                        {member.is_top_1500 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            TOP 1500
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-institutional-gold" />
                        </div>
                        <div>
                          <span className="font-medium text-institutional-blue">{member.name}</span>
                          <div className="text-xs text-gray-500">
                            {getMemberRole(member)}
                          </div>
                          {member.couple_name && (
                            <div className="text-xs text-gray-400 mt-1">
                              👫 {member.couple_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-pink-600">{member.instagram}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{member.sector}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-institutional-blue">
                          {member.contracts_completed}/15
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRankingStatusIcon(member.ranking_status)}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankingStatusColor(member.ranking_status)}`}>
                          {member.ranking_status}
                        </span>
                        {member.can_be_replaced && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            SUBSTITUÍVEL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-institutional-gold font-medium">{member.referrer}</span>
                      </div>
                    </td>
                    {isAdmin() && (
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <UserIcon className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Nenhum membro encontrado com os critérios de pesquisa.</p>
              </div>
            )}
          </div>

          {/* Paginação para Membros */}
          {filteredMembers.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {((membersCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(membersCurrentPage * itemsPerPage, filteredMembers.length)} de {filteredMembers.length} membros
                <span className="ml-2 text-blue-600 font-medium">(Limite máximo: 1.500)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(1)}
                  disabled={membersCurrentPage === 1}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(membersCurrentPage - 1)}
                  disabled={membersCurrentPage === 1}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalMembersPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalMembersPages - 4, membersCurrentPage - 2)) + i;
                    if (pageNum > totalMembersPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === membersCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToMembersPage(pageNum)}
                        className={pageNum === membersCurrentPage 
                          ? "bg-institutional-gold text-institutional-blue hover:bg-institutional-gold/90" 
                          : "border-institutional-light hover:bg-institutional-light"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(membersCurrentPage + 1)}
                  disabled={membersCurrentPage === totalMembersPages}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToMembersPage(totalMembersPages)}
                  disabled={membersCurrentPage === totalMembersPages}
                  className="border-institutional-light hover:bg-institutional-light"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="mt-6 p-4 bg-institutional-light rounded-lg">
            <div className="flex items-center justify-between">
              <div>
             
        
              </div>
            
           
            </div>
          </div>
        </CardContent>
      </Card>
        )}

        {/* Card de Total de Amigos (Apenas Administradores) */}
        {isAdmin() && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-institutional-blue">Resumo dos Amigos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-[var(--shadow-card)] border-l-4 border-l-institutional-gold">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Amigos</p>
                      <p className="text-2xl font-bold text-institutional-blue">{friends.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {friends.length} amigos cadastrados
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-institutional-light">
                      <UserCheck className="w-6 h-6 text-institutional-blue" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Seção de Ranking de Amigos (Apenas Administradores) */}
        {isAdmin() && (
        <Card className="shadow-[var(--shadow-card)] mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-institutional-blue">
              <UserCheck className="w-5 h-5" />
              Ranking dos Amigos 
            </CardTitle>
            <CardDescription>
              Ranking dos amigos 
            </CardDescription>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    // Verificar se há dados para exportar
                    if (!filteredFriends || filteredFriends.length === 0) {
                      toast({
                        title: "⚠️ Nenhum dado para exportar",
                        description: "Não é possível gerar um relatório sem dados",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Exportar TODOS os amigos filtrados, não apenas os da página atual
                    await exportFriendsToExcel(filteredFriends);
                    toast({
                      title: "✅ Excel exportado",
                      description: `Arquivo Excel com ${filteredFriends.length} amigos foi baixado com sucesso!`,
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Erro na exportação",
                      description: error instanceof Error ? error.message : "Erro ao exportar Excel",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    // Verificar se há dados para exportar
                    if (!filteredFriends || filteredFriends.length === 0) {
                      toast({
                        title: "⚠️ Nenhum dado para exportar",
                        description: "Não é possível gerar um relatório sem dados",
                        variant: "destructive",
                      });
                      return;
                    }

                    await exportToPDF('friends-table', 'ranking_amigos.pdf');
                    toast({
                      title: "✅ PDF exportado",
                      description: `Arquivo PDF com ${filteredFriends.length} amigos foi baixado com sucesso!`,
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Erro na exportação",
                      description: error instanceof Error ? error.message : "Erro ao exportar PDF",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros para Amigos */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar amigos por qualquer campo (nome, Instagram, cidade, setor, parceiro, contratos, ranking)..."
                  value={friendsSearchTerm}
                  onChange={(e) => {
                    setFriendsSearchTerm(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar por telefone..."
                  value={friendsPhoneSearchTerm}
                  onChange={(e) => {
                    setFriendsPhoneSearchTerm(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>

              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtrar por membro responsável..."
                  value={friendsMemberFilter}
                  onChange={(e) => {
                    setFriendsMemberFilter(e.target.value);
                    resetFriendsPagination();
                  }}
                  className="pl-10 border-institutional-light focus:border-institutional-gold focus:ring-institutional-gold"
                />
              </div>
            </div>

            {/* Tabela de Ranking dos Amigos */}
            <div className="overflow-x-auto" id="friends-ranking-table">
              <table id="friends-table" className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-institutional-light">
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Posição</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Amigo e Parceiro</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">WhatsApp</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Instagram</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Cidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Setor</th>
                    <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Indicado por</th>
                    {isAdmin() && (
                      <th className="text-left py-3 px-4 font-semibold text-institutional-blue">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {friendsWithPosition.map((friend) => (
                    <tr key={friend.id} className="border-b border-institutional-light/50 hover:bg-institutional-light/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-institutional-blue">
                            {friend.calculated_position}º
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-institutional-gold/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-institutional-gold" />
                          </div>
                          <div>
                            <span className="font-medium text-institutional-blue">{friend.name}</span>
                            <div className="text-xs text-gray-500">
                              Amigo
                            </div>
                            {friend.couple_name && (
                              <div className="text-xs text-gray-400 mt-1">
                                👫 {friend.couple_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{friend.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-pink-600">{friend.instagram}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{friend.city || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{friend.sector || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">{friend.member_name}</span>
                            <div className="text-xs text-gray-500">Membro</div>
                          </div>
                        </div>
                      </td>
                      {isAdmin() && (
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveFriend(friend.id, friend.name)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <UserIcon className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredFriends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum amigo encontrado com os critérios de pesquisa.</p>
                </div>
              )}
            </div>

            {/* Paginação para Amigos */}
            {filteredFriends.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((friendsCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(friendsCurrentPage * itemsPerPage, filteredFriends.length)} de {filteredFriends.length} amigos
                  <span className="ml-2 text-blue-600 font-medium">(Limite máximo: 22.500)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(1)}
                    disabled={friendsCurrentPage === 1}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(friendsCurrentPage - 1)}
                    disabled={friendsCurrentPage === 1}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalFriendsPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalFriendsPages - 4, friendsCurrentPage - 2)) + i;
                      if (pageNum > totalFriendsPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === friendsCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToFriendsPage(pageNum)}
                          className={pageNum === friendsCurrentPage 
                            ? "bg-institutional-gold text-institutional-blue hover:bg-institutional-gold/90" 
                            : "border-institutional-light hover:bg-institutional-light"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(friendsCurrentPage + 1)}
                    disabled={friendsCurrentPage === totalFriendsPages}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToFriendsPage(totalFriendsPages)}
                    disabled={friendsCurrentPage === totalFriendsPages}
                    className="border-institutional-light hover:bg-institutional-light"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}