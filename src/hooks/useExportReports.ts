// hooks/useExportReports.ts
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export const useExportReports = () => {
  // Exportar para PDF
  const exportToPDF = useCallback(async (elementId: string, filename: string = 'relatorio.pdf') => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Elemento não encontrado')
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

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

      pdf.save(filename)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      throw error
    }
  }, [])

  // Exportar dados para Excel
  const exportToExcel = useCallback((data: any[], filename: string = 'relatorio.xlsx', sheetName: string = 'Relatório') => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      XLSX.writeFile(workbook, filename)
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      throw error
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

  return {
    exportToPDF,
    exportToExcel,
    exportMembersToExcel,
    exportContractsToExcel,
    exportStatsToExcel
  }
}
