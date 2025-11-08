import type { Client, Payment, Setting } from '../types';
import { db } from './db';

declare const window: any;

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const getSettings = async () => {
    const settingsArray = await db.settings.toArray();
    const settingsObj = settingsArray.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {} as { [key: string]: any });
    return settingsObj;
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

export const generateDeclarationPDF = async (client: Client) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = await getSettings();
    
    const today = new Date();
    const formattedToday = today.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.syndicateName || 'SINDICATO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`CNPJ: ${settings.syndicateCnpj || 'N/A'}`, pageWidth / 2, 32, { align: 'center' });
    doc.text(settings.syndicateAddress || '', pageWidth / 2, 37, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(margin, 45, pageWidth - margin, 45);

    // --- Title ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO DE VÍNCULO ASSOCIATIVO', pageWidth / 2, 65, { align: 'center' });

    // --- Body ---
    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'normal');
    
    const bodyYStart = 85;
    
    let declarationText = settings.declarationTemplate || 'O associado {{NOME_ASSOCIADO}} (CPF: {{CPF}}) é filiado desde {{DATA_FILIACAO}}.';
    declarationText = declarationText
        .replace('{{NOME_ASSOCIADO}}', client.nomeCompleto)
        .replace('{{CPF}}', client.cpf)
        .replace('{{RG}}', client.rg)
        .replace('{{DATA_FILIACAO}}', formatDate(client.dataFiliacao));

    const textLines = doc.splitTextToSize(declarationText, contentWidth);
    doc.text(textLines, margin, bodyYStart, { align: 'justify' });
    
    const textHeight = doc.getTextDimensions(textLines).h;
    let currentY = bodyYStart + textHeight + 25;

    // --- Date ---
    doc.text(`Indiaroba, Sergipe, em ${formattedToday}.`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 40;
    
    const signatureY = currentY;

    // --- Signature ---
    if (settings.syndicateSignature) {
        try {
            const img = new Image();
            img.src = settings.syndicateSignature;
            const imgWidth = 50;
            const imgHeight = (img.height * imgWidth) / img.width;
            const imgX = (pageWidth / 2) - (imgWidth / 2);
            doc.addImage(settings.syndicateSignature, 'PNG', imgX, signatureY - imgHeight - 2, imgWidth, imgHeight);
        } catch (e) {
            console.error("Error adding signature image:", e);
        }
    }
    
    doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
    doc.setFontSize(11);
    doc.text('A Diretoria', pageWidth / 2, signatureY + 7, { align: 'center' });
    
    // --- Footer ---
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128); // Gray color
    doc.text(`A veracidade deste documento pode ser confirmada através do telefone: ${settings.syndicatePhone || ''}`, pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text('Este documento tem validade de 30 dias a partir da data de emissão.', pageWidth / 2, pageHeight - 13, { align: 'center' });

    doc.save(`declaracao_${client.nomeCompleto.split(' ')[0]}_${today.toISOString().slice(0,10)}.pdf`);
};

export const generatePaymentStatusDeclarationPDF = async (client: Client, lastPayment: Payment) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = await getSettings();
    
    const today = new Date();
    const formattedToday = today.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.syndicateName || 'SINDICATO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`CNPJ: ${settings.syndicateCnpj || 'N/A'}`, pageWidth / 2, 32, { align: 'center' });
    doc.text(settings.syndicateAddress || '', pageWidth / 2, 37, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(margin, 45, pageWidth - margin, 45);

    // --- Title ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DECLARAÇÃO DE SITUAÇÃO DE PAGAMENTO', pageWidth / 2, 65, { align: 'center' });

    // --- Body ---
    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'normal');
    
    const bodyYStart = 85;
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const [lastPaymentYear, lastPaymentMonth] = lastPayment.referencia.split('-');
    const lastPaymentMonthName = monthNames[parseInt(lastPaymentMonth, 10) - 1];

    let declarationText = `Declaramos, para os devidos fins, que o(a) Sr(a). {{NOME_ASSOCIADO}}, inscrito(a) no CPF sob o nº {{CPF}}, associado(a) desta entidade, encontra-se em dia com suas obrigações financeiras, tendo o último pagamento registrado referente à competência de ${lastPaymentMonthName} de ${lastPaymentYear}.\n\nPor ser expressão da verdade, firmamos a presente declaração.`;
    
    declarationText = declarationText
        .replace('{{NOME_ASSOCIADO}}', client.nomeCompleto)
        .replace('{{CPF}}', client.cpf);

    const textLines = doc.splitTextToSize(declarationText, contentWidth);
    doc.text(textLines, margin, bodyYStart, { align: 'justify' });
    
    const textHeight = doc.getTextDimensions(textLines).h;
    let currentY = bodyYStart + textHeight + 25;

    // --- Date ---
    doc.text(`Indiaroba, Sergipe, em ${formattedToday}.`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 40;
    
    const signatureY = currentY;

    // --- Signature ---
    if (settings.syndicateSignature) {
        try {
            const img = new Image();
            img.src = settings.syndicateSignature;
            const imgWidth = 50; 
            const imgHeight = (img.height * imgWidth) / img.width;
            const imgX = (pageWidth / 2) - (imgWidth / 2);
            doc.addImage(settings.syndicateSignature, 'PNG', imgX, signatureY - imgHeight - 2, imgWidth, imgHeight);
        } catch (e) {
            console.error("Error adding signature image:", e);
        }
    }
    
    doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
    doc.setFontSize(11);
    doc.text('A Diretoria', pageWidth / 2, signatureY + 7, { align: 'center' });
    
    // --- Footer ---
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128); // Gray color
    doc.text(`A veracidade deste documento pode ser confirmada através do telefone: ${settings.syndicatePhone || ''}`, pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text('Este documento tem validade de 30 dias a partir da data de emissão.', pageWidth / 2, pageHeight - 13, { align: 'center' });

    doc.save(`declaracao_pagamento_${client.nomeCompleto.split(' ')[0]}_${today.toISOString().slice(0,10)}.pdf`);
};