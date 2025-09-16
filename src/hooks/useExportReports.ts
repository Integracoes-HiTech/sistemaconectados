// hooks/useExportReports.ts
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export const useExportReports = () => {
  // Exportar para PDF
  const exportToPDF = useCallback(async (elementId: string, filename: string = 'relatorio.pdf') => {
    try {
      console.log('🔍 Tentando exportar PDF para elemento:', elementId)
      
      const element = document.getElementById(elementId)
      if (!element) {
        console.error('❌ Elemento não encontrado:', elementId)
        throw new Error(`Elemento com ID "${elementId}" não encontrado`)
      }

      console.log('✅ Elemento encontrado, gerando canvas...')
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      })

      console.log('✅ Canvas gerado, criando PDF...')
      
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

      console.log('✅ PDF criado, salvando arquivo:', filename)
      pdf.save(filename)
      
      console.log('✅ PDF exportado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error)
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar dados para Excel
  const exportToExcel = useCallback((data: any[], filename: string = 'relatorio.xlsx', sheetName: string = 'Relatório') => {
    try {
      console.log('🔍 Tentando exportar Excel:', filename, 'com', data.length, 'registros')
      
      if (!data || data.length === 0) {
        throw new Error('Nenhum dado para exportar')
      }

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      
      console.log('✅ Excel criado, salvando arquivo:', filename)
      XLSX.writeFile(workbook, filename)
      
      console.log('✅ Excel exportado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao exportar Excel:', error)
      throw new Error(`Erro ao exportar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar membros para Excel
  const exportMembersToExcel = useCallback((members: any[]) => {
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
      'Data de Cadastro': new Date(member.registration_date).toLocaleDateString('pt-BR'),
      'Top 1500': member.is_top_1500 ? 'Sim' : 'Não'
    }))

    exportToExcel(data, 'membros.xlsx', 'Membros')
  }, [exportToExcel])

  // Exportar contratos pagos para Excel
  const exportContractsToExcel = useCallback((contracts: any[]) => {
    const data = contracts.map(contract => ({
      'ID': contract.id,
      'Membro Responsável': contract.member_data?.name || 'N/A',
      'Casal 1': contract.couple_name_1,
      'Casal 2': contract.couple_name_2,
      'WhatsApp 1': contract.couple_phone_1,
      'WhatsApp 2': contract.couple_phone_2,
      'Instagram 1': contract.couple_instagram_1,
      'Instagram 2': contract.couple_instagram_2,
      'Status': contract.contract_status,
      'Data do Contrato': new Date(contract.contract_date).toLocaleDateString('pt-BR'),
      'Data de Conclusão': contract.completion_date ? new Date(contract.completion_date).toLocaleDateString('pt-BR') : 'N/A',
      'Post Verificado 1': contract.post_verified_1 ? 'Sim' : 'Não',
      'Post Verificado 2': contract.post_verified_2 ? 'Sim' : 'Não'
    }))

    exportToExcel(data, 'contratos_pagos.xlsx', 'Contratos Pagos')
  }, [exportToExcel])

  // Exportar estatísticas para Excel
  const exportStatsToExcel = useCallback((stats: any) => {
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
  const exportFriendsToExcel = useCallback((friends: any[]) => {
    const data = friends.map(friend => ({
      'Posição': friend.calculated_position || friend.ranking_position || 'N/A',
      'Nome': friend.name,
      'Parceiro': friend.couple_name || 'N/A',
      'WhatsApp': friend.phone,
      'Instagram': friend.instagram,
      'Cidade': friend.city,
      'Setor': friend.sector,
      'Contratos Completos': friend.contracts_completed,
      'Status': friend.ranking_status,
      'Indicado por': friend.member_name || friend.referrer,
      'Data de Cadastro': new Date(friend.created_at || friend.registration_date).toLocaleDateString('pt-BR'),
      'Top 1500': friend.is_top_1500 ? 'Sim' : 'Não'
    }))

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
