import type { Client, Payment, Setting } from '../types';
import { sqliteService } from './sqliteService';

declare const window: any;

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// FIX: Add explicit return type and type the result of `getAll` to resolve multiple 'Property does not exist on type unknown' errors.
const getSettings = async (): Promise<{ [key: string]: any }> => {
    const settingsArray = await sqliteService.getAll<Setting>('settings');
    const settingsObj = settingsArray.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {} as { [key:string]: any });
    return settingsObj;
};

/**
 * Renders an HTML string with ABNT-style formatting onto a jsPDF document.
 * Supports: <p>, <b>, <i>, <u>, <br>.
 * Features: Justified text, 1.5 line spacing, first-line paragraph indentation.
 * @returns The final Y position after rendering.
 */
const renderHTML = (doc: any, html: string, x: number, y: number, options: { maxWidth: number; }) => {
    const ABNT_INDENT_PT = 35.4; // 1.25 cm in points
    const ABNT_LINE_HEIGHT_FACTOR = 1.5;

    let state = {
        y: y,
        styles: [] as string[],
        isFirstLineOfParagraph: true,
    };

    const lineHeight = doc.getLineHeight() * ABNT_LINE_HEIGHT_FACTOR / doc.internal.scaleFactor;
    const spaceWidth = doc.getTextWidth(' ');
    
    const paragraphs = html.split(/<\/?p>/).filter(p => p.trim().length > 0);

    const applyStyles = () => {
        const isBold = state.styles.includes('b');
        const isItalic = state.styles.includes('i');
        
        let style = 'normal';
        if (isBold && isItalic) style = 'bolditalic';
        else if (isBold) style = 'bold';
        else if (isItalic) style = 'italic';
        
        doc.setFont('helvetica', style);
    };

    for (const [pIndex, paragraph] of paragraphs.entries()) {
        state.isFirstLineOfParagraph = true;
        let lineBuffer: { text: string; width: number; styles: string[] }[] = [];
        
        const sanitizedParagraph = paragraph.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' ').trim();
        const tokens = sanitizedParagraph.split(/(<\/?(?:b|i|u)>)/g).filter(Boolean);

        const flushLine = (isLastLine: boolean) => {
            if (lineBuffer.length === 0) return;

            const lineX = state.isFirstLineOfParagraph ? x + ABNT_INDENT_PT : x;
            const effectiveMaxWidth = state.isFirstLineOfParagraph ? options.maxWidth - ABNT_INDENT_PT : options.maxWidth;
            
            const totalWordsWidth = lineBuffer.reduce((acc, word) => acc + word.width, 0);
            
            let justificationSpace = 0;
            const canJustify = !isLastLine && lineBuffer.length > 1;

            if (canJustify) {
                const totalSpaceAvailable = effectiveMaxWidth - totalWordsWidth;
                justificationSpace = totalSpaceAvailable / (lineBuffer.length - 1);
            }

            let currentX = lineX;
            for (const word of lineBuffer) {
                state.styles = word.styles;
                applyStyles();
                doc.text(word.text, currentX, state.y);

                if (word.styles.includes('u')) {
                    const underlineY = state.y + (doc.getFontSize() * 0.1);
                    doc.setDrawColor(0);
                    doc.line(currentX, underlineY, currentX + word.width, underlineY);
                }
                
                currentX += word.width + spaceWidth + justificationSpace;
            }

            state.y += lineHeight;
            lineBuffer = [];
            state.isFirstLineOfParagraph = false;
        };

        for (const token of tokens) {
            if (token.startsWith('</')) {
                const tag = token.substring(2, token.length - 1);
                const index = state.styles.lastIndexOf(tag);
                if (index > -1) state.styles.splice(index, 1);
            } else if (token.startsWith('<')) {
                const tag = token.substring(1, token.length - 1);
                state.styles.push(tag);
            } else {
                const words = token.split(/\s+/).filter(Boolean);
                for (const word of words) {
                    applyStyles();
                    const wordWidth = doc.getTextWidth(word);
                    
                    const effectiveMaxWidth = state.isFirstLineOfParagraph ? options.maxWidth - ABNT_INDENT_PT : options.maxWidth;
                    const currentLineWidth = lineBuffer.reduce((acc, w) => acc + w.width + spaceWidth, 0) - (lineBuffer.length > 0 ? spaceWidth : 0);

                    if (currentLineWidth + spaceWidth + wordWidth > effectiveMaxWidth) {
                        flushLine(false);
                    }
                    lineBuffer.push({ text: word, width: wordWidth, styles: [...state.styles] });
                }
            }
        }
        
        flushLine(true);

        if (pIndex < paragraphs.length - 1) {
             state.y += lineHeight * 0.5;
        }
    }

    return state.y;
};

export const generatePaymentReceipt = async (client: Client, payment: Payment) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const settings = await getSettings();

  doc.setFontSize(18);
  doc.text('Comprovante de Pagamento', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(settings.syndicateName || 'Sindicato Rural de Indiaroba', 105, 30, { align: 'center' });

  doc.line(20, 35, 190, 35);

  const [year, month] = payment.referencia.split('-');
  const formattedReference = `${month}/${year}`;

  doc.text(`Recebemos de: ${client.nomeCompleto}`, 20, 50);
  doc.text(`CPF: ${client.cpf}`, 20, 60);
  doc.text(`Referente a: ${formattedReference}`, 20, 70);
  doc.text(`Data do Pagamento: ${formatDate(payment.dataPagamento)}`, 20, 80);
  
  doc.setFontSize(14);
  doc.text(`Valor Pago: R$ ${payment.valor.toFixed(2).replace('.', ',')}`, 20, 95);

  doc.line(20, 110, 190, 110);

  doc.setFontSize(10);
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 120);
  if (payment.registeredBy) {
    doc.text(`Registrado por: ${payment.registeredBy}`, 20, 125);
  }

  doc.save(`recibo_${client.nomeCompleto.split(' ')[0]}_${year}_${month}.pdf`);
};

const generateDeclarationBase = async (doc: any, settings: { [key: string]: any }, title: string, bodyText: string) => {
    const today = new Date();
    const formattedToday = today.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    // ABNT Margins in points (1cm = 28.35pt)
    const topMargin = 85; // 3cm
    const leftMargin = 85; // 3cm
    const rightMargin = 57; // 2cm
    const bottomMargin = 57; // 2cm

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const contentCenterX = leftMargin + contentWidth / 2;
    let currentY = topMargin;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.syndicateName || 'SINDICATO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`CNPJ: ${settings.syndicateCnpj || 'N/A'}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;
    doc.text(settings.syndicateAddress || '', pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;
    
    doc.setLineWidth(0.5);
    doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
    currentY += 60;

    // --- Title ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), contentCenterX, currentY, { align: 'center' });
    currentY += 60;

    // --- Body ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const finalY = renderHTML(doc, bodyText, leftMargin, currentY, { maxWidth: contentWidth });
    currentY = finalY + 25; // Space after body

    // --- Date ---
    doc.text(`Indiaroba, Sergipe, em ${formattedToday}.`, pageWidth - rightMargin, currentY, { align: 'right' });
    currentY += 100;
    
    const signatureY = currentY;

    // --- Signature ---
    if (settings.syndicateSignature) {
        try {
            const img = new Image();
            img.src = settings.syndicateSignature;
            const imgWidth = 60; 
            const imgHeight = (img.height * imgWidth) / img.width;
            const imgX = contentCenterX - (imgWidth / 2);
            doc.addImage(settings.syndicateSignature, 'PNG', imgX, signatureY - imgHeight - 2, imgWidth, imgHeight);
        } catch (e) {
            console.error("Error adding signature image:", e);
        }
    }
    
    doc.line(contentCenterX - 50, signatureY, contentCenterX + 50, signatureY);
    doc.setFontSize(11);
    doc.text('A Diretoria', contentCenterX, signatureY + 10, { align: 'center' });
    
    // --- Footer ---
    const footerY = pageHeight - bottomMargin;
    doc.setLineWidth(0.2);
    doc.line(leftMargin, footerY, pageWidth - rightMargin, footerY);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128); // Gray color
    doc.text(`A veracidade deste documento pode ser confirmada através do telefone: ${settings.syndicatePhone || ''}`, pageWidth / 2, footerY + 15, { align: 'center' });
    doc.text('Este documento tem validade de 30 dias a partir da data de emissão.', pageWidth / 2, footerY + 25, { align: 'center' });
}

export const generateDeclarationPDF = async (client: Client) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = await getSettings();
    
    let declarationText = settings.declarationTemplate || '<p>O associado {{NOME_ASSOCIADO}} (CPF: {{CPF}}) é filiado desde {{DATA_FILIACAO}}.</p>';
    declarationText = declarationText
        .replace(/{{NOME_ASSOCIADO}}/g, client.nomeCompleto.toUpperCase())
        .replace(/{{CPF}}/g, client.cpf)
        .replace(/{{RG}}/g, client.rg)
        .replace(/{{DATA_FILIACAO}}/g, formatDate(client.dataFiliacao));
    
    await generateDeclarationBase(doc, settings, 'Declaração de Vínculo Associativo', declarationText);

    doc.save(`declaracao_${client.nomeCompleto.split(' ')[0]}_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const generatePaymentStatusDeclarationPDF = async (client: Client, lastPayment: Payment) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = await getSettings();
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const [lastPaymentYear, lastPaymentMonth] = lastPayment.referencia.split('-');
    const lastPaymentMonthName = monthNames[parseInt(lastPaymentMonth, 10) - 1];

    let declarationText = settings.paymentDeclarationTemplate || `<p>O associado {{NOME_ASSOCIADO}} está em dia, com último pagamento para <b>{{MES_ULTIMO_PAGAMENTO}} de {{ANO_ULTIMO_PAGAMENTO}}</b>.</p>`;
    
    declarationText = declarationText
        .replace(/{{NOME_ASSOCIADO}}/g, client.nomeCompleto.toUpperCase())
        .replace(/{{CPF}}/g, client.cpf)
        .replace(/{{MES_ULTIMO_PAGAMENTO}}/g, lastPaymentMonthName)
        .replace(/{{ANO_ULTIMO_PAGAMENTO}}/g, lastPaymentYear);

    await generateDeclarationBase(doc, settings, 'Declaração de Situação de Pagamento', declarationText);
    
    doc.save(`declaracao_pagamento_${client.nomeCompleto.split(' ')[0]}_${new Date().toISOString().slice(0,10)}.pdf`);
};
