// hooks/useExportReports.ts
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

export const useExportReports = () => {
  // Função para formatar telefone para exportação
  const formatPhoneForExport = (phone: string): string => {
    if (!phone) return '';
    
    // Remove todos os caracteres especiais e espaços
    let cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Remove código do país se já existir (55 no início)
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Remove o 9 inicial se existir (após o DDD) para números de 11 dígitos
    if (cleanPhone.length === 11 && cleanPhone.charAt(2) === '9') {
      cleanPhone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
    }
    
    // Garantir que tenha pelo menos 10 dígitos (DDD + número)
    if (cleanPhone.length < 10) {
      return '';
    }
    
    // Adiciona o código do país 55
    return `55${cleanPhone}`;
  };
  // Exportar para PDF (método antigo - print da tela)
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

  // Função auxiliar para criar tabela PDF manualmente
  const createPDFTable = (pdf: jsPDF, headers: string[], data: string[][], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 5
    const tableWidth = pageWidth - (margin * 2)
    
    // Definir larguras específicas para cada coluna (otimizado para 14 colunas)
    const columnWidths = [
      15, // Pos.
      25, // Nome
      20, // WhatsApp
      18, // Instagram
      18, // Cidade
      15, // Setor
      25, // Nome Cônjuge/Parceiro
      20, // WhatsApp Cônjuge/Parceiro
      18, // Instagram Cônjuge/Parceiro
      18, // Cidade Cônjuge/Parceiro
      15, // Setor Cônjuge/Parceiro
      12, // Contratos
      20, // Indicado por
      16  // Data
    ]
    
    const rowHeight = 7
    let currentY = startY

    // Cabeçalho
    pdf.setFillColor(41, 128, 185)
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    
    let currentX = margin
    columnWidths.forEach((width, index) => {
      pdf.rect(currentX, currentY, width, rowHeight, 'F')
      if (headers[index]) {
        const headerText = headers[index].substring(0, 12) // Limitar cabeçalho
        pdf.text(headerText, currentX + 1, currentY + 5)
      }
      currentX += width
    })
    
    currentY += rowHeight

    // Dados
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(5)

    data.forEach((row, rowIndex) => {
      // Verificar se precisa de nova página
      if (currentY + rowHeight > pageHeight - 20) {
        pdf.addPage()
        currentY = 20
        
        // Repetir cabeçalho na nova página
        pdf.setFillColor(41, 128, 185)
        pdf.setTextColor(255, 255, 255)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7)
        
        currentX = margin
        columnWidths.forEach((width, index) => {
          pdf.rect(currentX, currentY, width, rowHeight, 'F')
          if (headers[index]) {
            const headerText = headers[index].substring(0, 12)
            pdf.text(headerText, currentX + 1, currentY + 5)
          }
          currentX += width
        })
        
        currentY += rowHeight
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(5)
      }

      // Linha alternada
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(245, 245, 245)
        currentX = margin
        columnWidths.forEach(width => {
          pdf.rect(currentX, currentY, width, rowHeight, 'F')
          currentX += width
        })
      }

      // Dados da linha
      currentX = margin
      row.forEach((cell, colIndex) => {
        if (colIndex < columnWidths.length) {
          const width = columnWidths[colIndex]
          const maxChars = Math.floor(width / 2.5) // Calcular caracteres baseado na largura
          const cellText = String(cell || '').substring(0, maxChars)
          pdf.text(cellText, currentX + 1, currentY + 5)
          currentX += width
        }
      })

      currentY += rowHeight
    })
  }

  // Criar PDF com layout de cards (6 membros por página - 3x2) otimizado
  const createPDFCards = (pdf: jsPDF, members: Record<string, unknown>[], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const cardsPerRow = 3
    const rowsPerPage = 2
    const cardWidth = (pageWidth - (margin * 2) - ((cardsPerRow - 1) * 6)) / cardsPerRow // 3 cards por linha, espaçamento menor
    const cardHeight = (pageHeight - startY - 20 - ((rowsPerPage - 1) * 6)) / rowsPerPage // 2 linhas por página, espaçamento menor
    let currentX = margin
    let currentY = startY

    members.forEach((member, index) => {
      const cardsPerPage = cardsPerRow * rowsPerPage // 6 cards por página
      
      // Verificar se precisa de nova página (6 cards por página: 3x2)
      if (index > 0 && index % cardsPerPage === 0) {
        pdf.addPage()
        currentY = startY
        currentX = margin
      }

      // Verificar se precisa quebrar linha (3 cards por linha)
      if (index > 0 && index % cardsPerRow === 0 && index % cardsPerPage !== 0) {
        currentY += cardHeight + 8
        currentX = margin
      }

      // Desenhar card
      pdf.setFillColor(245, 245, 245)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F')
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'S')

      // Função para truncar texto se necessário
      const truncateText = (text: string, maxWidth: number, fontSize: number) => {
        const avgCharWidth = fontSize * 0.6 // Estimativa da largura do caractere
        const maxChars = Math.floor(maxWidth / avgCharWidth)
        return text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text
      }

      // Título do card com posição (sem truncar nomes)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text(`#${member.ranking_position || 'N/A'} - ${String(member.name || '')}`, currentX + 2, currentY + 8)

      // Dados da pessoa principal
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      let textY = currentY + 15
      pdf.text(`WhatsApp: ${formatPhoneForExport(member.phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(member.instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(member.sector || '')} - ${String(member.city || '')}`, currentX + 2, textY)
      
      // Dados do parceiro
      textY += 6
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text(`Parceiro: ${String(member.couple_name || '')}`, currentX + 2, textY)
      
      pdf.setFont('helvetica', 'normal')
      textY += 4.5
      pdf.text(`WhatsApp: ${formatPhoneForExport(member.couple_phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(member.couple_instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(member.couple_sector || '')} - ${String(member.couple_city || '')}`, currentX + 2, textY)

      // Informações adicionais
      textY += 6
      pdf.setFontSize(6)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Contratos: ${member.contracts_completed || '0'} | Por: ${String(member.referrer || '')}`, currentX + 2, textY)

      // Próximo card (3 por linha)
      if ((index + 1) % cardsPerRow === 0) {
        currentX = margin // Volta para o início da linha
      } else {
        currentX += cardWidth + 8 // Próximo card na mesma linha
      }
    })
  }

  // Exportar membros para PDF estruturado (layout de cards)
  const exportMembersToPDF = useCallback((members: Record<string, unknown>[]) => {
    try {
      if (!members || members.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      // Criar PDF estruturado
      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape
      
      // Título
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Relatório Completo de Membros', 20, 15)
      
      // Data de geração e total
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 25)
      pdf.text(`Total: ${members.length} membros`, 200, 25)
      
      // Criar cards
      createPDFCards(pdf, members, 35)

      pdf.save('membros_completo.pdf')
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Criar PDF de amigos com layout de cards (6 por página - 3x2) otimizado
  const createFriendsPDFCards = (pdf: jsPDF, friends: unknown[], startY: number) => {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const cardsPerRow = 3
    const rowsPerPage = 2
    const cardWidth = (pageWidth - (margin * 2) - ((cardsPerRow - 1) * 6)) / cardsPerRow // 3 cards por linha, espaçamento menor
    const cardHeight = (pageHeight - startY - 20 - ((rowsPerPage - 1) * 6)) / rowsPerPage // 2 linhas por página, espaçamento menor
    let currentX = margin
    let currentY = startY

    friends.forEach((friend, index) => {
      const f = friend as Record<string, unknown>
      const cardsPerPage = cardsPerRow * rowsPerPage // 6 cards por página
      
      // Verificar se precisa de nova página (6 cards por página: 3x2)
      if (index > 0 && index % cardsPerPage === 0) {
        pdf.addPage()
        currentY = startY
        currentX = margin
      }

      // Verificar se precisa quebrar linha (3 cards por linha)
      if (index > 0 && index % cardsPerRow === 0 && index % cardsPerPage !== 0) {
        currentY += cardHeight + 8
        currentX = margin
      }

      // Desenhar card
      pdf.setFillColor(245, 245, 245)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F')
      pdf.setDrawColor(200, 200, 200)
      pdf.rect(currentX, currentY, cardWidth, cardHeight, 'S')

      // Função para truncar texto se necessário
      const truncateText = (text: string, maxWidth: number, fontSize: number) => {
        const avgCharWidth = fontSize * 0.6 // Estimativa da largura do caractere
        const maxChars = Math.floor(maxWidth / avgCharWidth)
        return text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text
      }

      // Título do card com posição (sem truncar nomes)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text(`#${f.calculated_position || f.ranking_position || 'N/A'} - ${String(f.name || '')}`, currentX + 2, currentY + 8)

      // Dados da pessoa principal
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      
      let textY = currentY + 15
      pdf.text(`WhatsApp: ${formatPhoneForExport(f.phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(f.instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(f.sector || '')} - ${String(f.city || '')}`, currentX + 2, textY)
      
      // Dados do parceiro
      textY += 6
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(7)
      pdf.text(`Parceiro: ${String(f.couple_name || '')}`, currentX + 2, textY)
      
      pdf.setFont('helvetica', 'normal')
      textY += 4.5
      pdf.text(`WhatsApp: ${formatPhoneForExport(f.couple_phone as string)}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Instagram: ${String(f.couple_instagram || '')}`, currentX + 2, textY)
      textY += 4.5
      pdf.text(`Setor-Cidade: ${String(f.couple_sector || '')} - ${String(f.couple_city || '')}`, currentX + 2, textY)

      // Informações adicionais
      textY += 6
      pdf.setFontSize(6)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Contratos: ${f.contracts_completed || '0'} | Por: ${String(f.member_name || f.referrer || '')}`, currentX + 2, textY)

      // Próximo card (3 por linha)
      if ((index + 1) % cardsPerRow === 0) {
        currentX = margin // Volta para o início da linha
      } else {
        currentX += cardWidth + 8 // Próximo card na mesma linha
      }
    })
  }

  // Exportar amigos para PDF estruturado (layout de cards)
  const exportFriendsToPDF = useCallback((friends: unknown[]) => {
    try {
      if (!friends || friends.length === 0) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape
      
      // Título
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Relatório Completo de Amigos', 20, 15)
      
      // Data de geração e total
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 25)
      pdf.text(`Total: ${friends.length} amigos`, 200, 25)
      
      // Criar cards
      createFriendsPDFCards(pdf, friends, 35)

      pdf.save('amigos_completo.pdf')
    } catch (error) {
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
    // Exportando membros com dados completos organizados
    
    const data = members.map(member => ({
      // Posição como primeira coluna
      'Posição': member.ranking_position || 'N/A',
      
      // Dados da Pessoa Principal
      'Nome': member.name,
      'WhatsApp': formatPhoneForExport(member.phone as string),
      'Instagram': member.instagram,
      'Cidade': member.city,
      'Setor': member.sector,
      
      // Dados do Parceiro
      'Nome Parceiro': member.couple_name || '',
      'WhatsApp Parceiro': formatPhoneForExport(member.couple_phone as string),
      'Instagram Parceiro': member.couple_instagram || '',
      'Cidade Parceiro': member.couple_city || '',
      'Setor Parceiro': member.couple_sector || '',
      
      // Informações do Sistema
      'Contratos Completos': member.contracts_completed || 0,
      'Indicado por': member.referrer || '',
      'Data de Cadastro': member.registration_date ? new Date(member.registration_date as string).toLocaleDateString('pt-BR') : ''
    }))

    exportToExcel(data, 'membros.xlsx', 'Membros')
  }, [exportToExcel])

  // Exportar contratos para Excel
  const exportContractsToExcel = useCallback((contracts: Record<string, unknown>[]) => {
    // Exportando contratos com dados completos organizados
    
    const data = contracts.map(contract => ({
      // Dados da Primeira Pessoa
      'Nome Pessoa 1': contract.couple_name_1,
      'WhatsApp Pessoa 1': formatPhoneForExport(contract.couple_phone_1 as string),
      'Instagram Pessoa 1': contract.couple_instagram_1,
      'Cidade Pessoa 1': contract.couple_city_1 || '',
      'Setor Pessoa 1': contract.couple_sector_1 || '',
      
      // Dados da Segunda Pessoa
      'Nome Pessoa 2': contract.couple_name_2,
      'WhatsApp Pessoa 2': formatPhoneForExport(contract.couple_phone_2 as string),
      'Instagram Pessoa 2': contract.couple_instagram_2,
      'Cidade Pessoa 2': contract.couple_city_2 || '',
      'Setor Pessoa 2': contract.couple_sector_2 || '',
      
      // Informações do Contrato
      'ID Contrato': contract.id,
      'Membro Responsável': (contract.member_data as Record<string, unknown>)?.name || 'N/A',
      'Data do Contrato': contract.contract_date ? new Date(contract.contract_date as string).toLocaleDateString('pt-BR') : '',
      'Data de Conclusão': contract.completion_date ? new Date(contract.completion_date as string).toLocaleDateString('pt-BR') : '',
      'Post Verificado 1': contract.post_verified_1 ? 'Sim' : 'Não',
      'Post Verificado 2': contract.post_verified_2 ? 'Sim' : 'Não'
    }))

    exportToExcel(data, 'contratos.xlsx', 'Contratos')
  }, [exportToExcel])

  // Exportar dados do relatório para PDF (formato cards)
  const exportReportDataToPDF = useCallback((reportData: Record<string, unknown>, memberStats: Record<string, unknown>, topMembersData?: Array<{member: string, count: number, position: number}>) => {
    try {
      if (!reportData || !memberStats) {
        throw new Error('Não é possível gerar um relatório sem dados')
      }

      const pdf = new jsPDF('p', 'mm', 'a4') // Portrait para relatórios
      
      // Título principal
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('Relatório de Dados do Sistema', 20, 20)
      
      // Data de geração
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 30)
      
      let currentY = 45

      // Seção 1: Estatísticas Gerais
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('ESTATISTICAS GERAIS', 20, currentY)
      currentY += 10

      const statsData = [
        { label: 'Total de Membros', value: memberStats.total_members || 0 },
        { label: 'Membros Verdes', value: memberStats.green_members || 0 },
        { label: 'Membros Amarelos', value: memberStats.yellow_members || 0 },
        { label: 'Membros Vermelhos', value: memberStats.red_members || 0 },
        { label: 'Top 1500', value: memberStats.top_1500_members || 0 },
        { label: 'Limite Máximo', value: memberStats.max_member_limit || 1500 }
      ]

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      statsData.forEach((stat, index) => {
        if (currentY > 250) {
          pdf.addPage()
          currentY = 20
        }
        pdf.text(`${stat.label}: ${stat.value}`, 25, currentY)
        currentY += 6
      })

      currentY += 10

      // Seção 2: Membros por Cidade
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('MEMBROS POR CIDADE', 20, currentY)
      currentY += 10

      const usersByCity = reportData.usersByCity as Record<string, number> || {}
      Object.entries(usersByCity)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([city, count]) => {
          if (currentY > 250) {
            pdf.addPage()
            currentY = 20
          }
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          pdf.text(`${city}: ${count} membros`, 25, currentY)
          currentY += 6
        })

      currentY += 10

      // Seção 3: Setores por Cidade
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('SETORES POR CIDADE', 20, currentY)
      currentY += 10

      const sectorsGroupedByCity = reportData.sectorsGroupedByCity as Record<string, any> || {}
      Object.entries(sectorsGroupedByCity)
        .sort(([, a], [, b]) => (b as any).count - (a as any).count)
        .forEach(([city, data]) => {
          if (currentY > 240) {
            pdf.addPage()
            currentY = 20
          }
          
          const cityData = data as { count: number, totalSectors: number, sectors: string[] }
          
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(41, 128, 185)
          pdf.text(`${city}`, 25, currentY)
          currentY += 6
          
          pdf.setFontSize(8)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          pdf.text(`${cityData.totalSectors} setores | ${cityData.count} membros`, 25, currentY)
          currentY += 5
          
          // Listar setores
          pdf.setFontSize(7)
          pdf.setTextColor(100, 100, 100)
          const sectorsText = cityData.sectors.join(', ')
          const lines = pdf.splitTextToSize(sectorsText, 160)
          lines.forEach((line: string) => {
            if (currentY > 280) {
              pdf.addPage()
              currentY = 20
            }
            pdf.text(line, 30, currentY)
            currentY += 4
          })
          currentY += 6
        })

      // Seção 4: Distribuição por Status
      currentY += 5
      if (currentY > 220) {
        pdf.addPage()
        currentY = 20
      }
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('DISTRIBUICAO POR STATUS', 20, currentY)
      currentY += 10

      const usersByStatus = reportData.usersByStatus as Array<{ name: string, value: number, color: string }> || []
      usersByStatus.forEach((status) => {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        pdf.text(`${status.name}: ${status.value} membros`, 25, currentY)
        currentY += 6
      })

      // Seção 5: Cadastros Recentes por Data
      currentY += 10
      if (currentY > 220) {
        pdf.addPage()
        currentY = 20
      }
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('CADASTROS RECENTES POR DATA', 20, currentY)
      currentY += 10

      const registrationsByDay = reportData.registrationsByDay as Array<{ date: string, quantidade: number }> || []
      registrationsByDay
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10) // Últimos 10 dias
        .forEach((reg) => {
          if (currentY > 250) {
            pdf.addPage()
            currentY = 20
          }
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          const dateFormatted = new Date(reg.date).toLocaleDateString('pt-BR')
          pdf.text(`${dateFormatted}: ${reg.quantidade} cadastros`, 25, currentY)
          currentY += 6
        })

      // Seção 6: Top 5 Membros com mais Amigos
      if (topMembersData && topMembersData.length > 0) {
        currentY += 10
        if (currentY > 220) {
          pdf.addPage()
          currentY = 20
        }
        
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(41, 128, 185)
        pdf.text('TOP 5 - MEMBROS COM MAIS AMIGOS', 20, currentY)
        currentY += 10

        topMembersData.forEach((member) => {
          if (currentY > 250) {
            pdf.addPage()
            currentY = 20
          }
          
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          pdf.text(`${member.position}º - ${member.member}: ${member.count} amigos`, 25, currentY)
          currentY += 6
        })
      }

      // Seção 7: Cidades e Membros (com percentuais)
      currentY += 10
      if (currentY > 220) {
        pdf.addPage()
        currentY = 20
      }
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(41, 128, 185)
      pdf.text('CIDADES E MEMBROS (DETALHADO)', 20, currentY)
      currentY += 10

      const totalMembers = memberStats.total_members as number || 1
      
      Object.entries(usersByCity)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([city, count]) => {
          if (currentY > 250) {
            pdf.addPage()
            currentY = 20
          }
          
          const percentage = ((count as number / totalMembers) * 100).toFixed(1)
          
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0)
          pdf.text(`${city}: ${count} membros (${percentage}%)`, 25, currentY)
          currentY += 6
        })

      pdf.save('dados_relatorio.pdf')
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [])

  // Exportar amigos para Excel
  const exportFriendsToExcel = useCallback((friends: unknown[]) => {
    // Exportando amigos com dados completos organizados
    
    const data = friends.map(friend => {
      const f = friend as Record<string, unknown>
      return {
        // Posição como primeira coluna
        'Posição': f.calculated_position || f.ranking_position || 'N/A',
        
        // Dados da Pessoa Principal
        'Nome': f.name,
        'WhatsApp': formatPhoneForExport(f.phone as string),
        'Instagram': f.instagram,
        'Cidade': f.city,
        'Setor': f.sector,
        
        // Dados do Parceiro
        'Nome Parceiro': f.couple_name || '',
        'WhatsApp Parceiro': formatPhoneForExport(f.couple_phone as string),
        'Instagram Parceiro': f.couple_instagram || '',
        'Cidade Parceiro': f.couple_city || '',
        'Setor Parceiro': f.couple_sector || '',
        
        // Informações do Sistema
        'Contratos Completos': f.contracts_completed || 0,
        'Indicado por': f.member_name || f.referrer || '',
        'Data de Cadastro': (f.created_at || f.registration_date) ? new Date((f.created_at || f.registration_date) as string).toLocaleDateString('pt-BR') : ''
      }
    })

    exportToExcel(data, 'amigos.xlsx', 'Amigos')
  }, [exportToExcel])

  return {
    exportToPDF,
    exportToExcel,
    exportMembersToExcel,
    exportContractsToExcel,
    exportReportDataToPDF,
    exportFriendsToExcel,
    exportMembersToPDF,
    exportFriendsToPDF
  }
}
