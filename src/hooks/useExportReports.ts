// hooks/useExportReports.ts
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export const useExportReports = () => {
  // Exportar para PDF
  const exportToPDF = useCallback(async (elementId: string, filename: string = 'relatorio.pdf') => {
    try {
      // Tentando exportar PDF para elemento
      
      const element = document.getElementById(elementId)
      if (!element) {
        // Elemento não encontrado
        throw new Error(`Elemento com ID "${elementId}" não encontrado`)
      }

      // Verificar se o elemento tem conteúdo (tabela com dados)
      const tableRows = element.querySelectorAll('tbody tr')
      if (tableRows.length === 0) {
        // Tabela vazia detectada
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      // Elemento encontrado, gerando canvas
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      })

      // Canvas gerado, criando PDF
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // PDF criado, salvando arquivo
      pdf.save(filename)
      
      // PDF exportado com sucesso
    } catch (error) {
      // Erro ao exportar PDF
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar dados para Excel
  const exportToExcel = useCallback((data: Record<string, unknown>[], filename: string = 'relatorio.xlsx', sheetName: string = 'Relatório') => {
    try {
      // Tentando exportar Excel
      
      if (!data || data.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      // Para grandes volumes (>10.000 registros), usar processamento em chunks
      if (data.length > 10000) {
        // Processando grande volume de dados em chunks
        
        const chunkSize = 5000
        const chunks = []
        
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize))
        }
        
        const workbook = XLSX.utils.book_new()
        
        chunks.forEach((chunk, index) => {
          const worksheet = XLSX.utils.json_to_sheet(chunk)
          const sheetNameChunk = chunks.length > 1 ? `${sheetName} - Parte ${index + 1}` : sheetName
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetNameChunk)
        })
        
        // Excel criado com múltiplas abas, salvando arquivo
        XLSX.writeFile(workbook, filename)
      } else {
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        
        // Excel criado, salvando arquivo
        XLSX.writeFile(workbook, filename)
      }
      
      // Excel exportado com sucesso
    } catch (error) {
      // Erro ao exportar Excel
      throw new Error(`Erro ao exportar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar membros para Excel
  const exportMembersToExcel = useCallback((members: Record<string, unknown>[]) => {
    // Exportando membros
    
    const data = members.map(member => ({
      'Posição': member.ranking_position || 'N/A',
      'Nome': member.name,
      'Cônjuge': member.couple_name || 'N/A',
      'WhatsApp': member.phone,
      'Instagram': member.instagram,
      'Cidade': member.city,
      'Setor': member.sector,
      'Contratos Completos': member.contracts_completed,
      'Status': member.ranking_status,
      'Indicado por': member.referrer,
      'Data de Cadastro': new Date(member.registration_date as string).toLocaleDateString('pt-BR'),
      'Top 1500': member.is_top_1500 ? 'Sim' : 'Não'
    }))

    exportToExcel(data, 'membros.xlsx', 'Membros')
  }, [exportToExcel])

  // Exportar amigos para Excel
  const exportContractsToExcel = useCallback((contracts: Record<string, unknown>[]) => {
    const data = contracts.map(contract => ({
      'ID': contract.id,
      'Membro Responsável': (contract.member_data as Record<string, unknown>)?.name || 'N/A',
      'Dupla 1': contract.couple_name_1,
      'Dupla 2': contract.couple_name_2,
      'WhatsApp 1': contract.couple_phone_1,
      'WhatsApp 2': contract.couple_phone_2,
      'Instagram 1': contract.couple_instagram_1,
      'Instagram 2': contract.couple_instagram_2,
      'Status': contract.contract_status,
      'Data do Contrato': new Date(contract.contract_date as string).toLocaleDateString('pt-BR'),
      'Data de Conclusão': contract.completion_date ? new Date(contract.completion_date as string).toLocaleDateString('pt-BR') : 'N/A',
      'Post Verificado 1': contract.post_verified_1 ? 'Sim' : 'Não',
      'Post Verificado 2': contract.post_verified_2 ? 'Sim' : 'Não'
    }))

    exportToExcel(data, 'amigos.xlsx', 'Amigos')
  }, [exportToExcel])

  // Exportar estatísticas para Excel
  const exportStatsToExcel = useCallback((stats: Record<string, unknown>) => {
    // Exportando estatísticas do sistema
    
    // Verificar se há dados válidos para exportar
    const totalMembers = Number(stats.total_members) || 0
    const currentCount = Number(stats.current_member_count) || 0
    
    if (totalMembers === 0 && currentCount === 0) {
      throw new Error('Não é possível gerar um relatório sem dados')
    }

    const data = [
      { 'Métrica': 'Total de Membros', 'Valor': stats.total_members || 0 },
      { 'Métrica': 'Membros Verdes', 'Valor': stats.green_members || 0 },
      { 'Métrica': 'Membros Amarelos', 'Valor': stats.yellow_members || 0 },
      { 'Métrica': 'Membros Vermelhos', 'Valor': stats.red_members || 0 },
      { 'Métrica': 'Top 1500', 'Valor': stats.top_1500_members || 0 },
      { 'Métrica': 'Contagem Atual', 'Valor': stats.current_member_count || 0 },
      { 'Métrica': 'Limite Máximo', 'Valor': stats.max_member_limit || 1500 }
    ]

    exportToExcel(data, 'estatisticas.xlsx', 'Estatísticas')
  }, [exportToExcel])

  // Exportar amigos para Excel
  const exportFriendsToExcel = useCallback((friends: unknown[]) => {
    // Exportando amigos
    
    const data = friends.map(friend => {
      const f = friend as Record<string, unknown>
      return {
        'Posição': f.calculated_position || f.ranking_position || 'N/A',
        'Nome': f.name,
        'Parceiro': f.couple_name || 'N/A',
        'WhatsApp': f.phone,
        'Instagram': f.instagram,
        'Cidade': f.city,
        'Setor': f.sector,
        'Contratos Completos': f.contracts_completed,
        'Status': f.ranking_status,
        'Indicado por': f.member_name || f.referrer,
        'Data de Cadastro': new Date((f.created_at || f.registration_date) as string).toLocaleDateString('pt-BR'),
        'Top 1500': f.is_top_1500 ? 'Sim' : 'Não'
      }
    })

    exportToExcel(data, 'amigos.xlsx', 'Amigos')
  }, [exportToExcel])

  return {
    exportToPDF,
    exportToExcel,
    exportMembersToExcel,
    exportContractsToExcel,
    exportStatsToExcel,
    exportFriendsToExcel
  }
}
