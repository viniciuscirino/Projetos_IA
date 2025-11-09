import { sqliteService } from './sqliteService';

const getSyndicateName = async () => {
    const setting = await sqliteService.getSetting('syndicateName');
    return setting?.value || 'Sindicato Rural de Indiaroba';
};

const generateHtml = async (title: string, columns: any[], body: any[], summaryLines?: string[]) => {
    const syndicateName = await getSyndicateName();

    const tableHeaders = columns.map(col => `<th>${col.header}</th>`).join('');
    
    const tableBody = body.length > 0 ? body.map(row => {
        const cells = columns.map(col => {
            let cellClass = '';
            if (col.dataKey === 'valor' || (col.dataKey === 'value' && (row[col.dataKey].includes('R$') || row[col.dataKey].includes('-')))) {
                cellClass = 'text-right';
            }
            if (row.type === 'Despesa') {
                 cellClass += ' text-red';
            }
            return `<td class="${cellClass}">${row[col.dataKey]}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('') : `<tr><td colspan="${columns.length}" class="no-data">Nenhum dado encontrado para este período.</td></tr>`;

    const summaryHtml = summaryLines && summaryLines.length > 0 
        ? `<div class="summary">${summaryLines.map(line => `<p>${line.replace(/R\$\s*([\d,.-]+)/g, '<strong>R$ $1</strong>')}</p>`).join('')}</div>`
        : '';

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { 
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    padding: 1rem; 
                    background-color: #f3f4f6; 
                    color: #111827; 
                    -webkit-print-color-adjust: exact;
                }
                .container { 
                    max-width: 1100px; 
                    margin: auto; 
                    background-color: #ffffff; 
                    padding: 2rem; 
                    border-radius: 0.5rem; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                }
                header { 
                    border-bottom: 2px solid #e5e7eb; 
                    padding-bottom: 1rem; 
                    margin-bottom: 2rem; 
                }
                header h1 { 
                    font-size: 1.5rem; 
                    font-weight: 700;
                    color: #047857; /* emerald-700 */ 
                    margin: 0; 
                }
                header p { 
                    color: #4b5563; 
                    margin: 0.25rem 0 0; 
                    font-size: 1.125rem;
                }
                 header .subtitle {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                .summary { 
                    background-color: #f0fdf4; 
                    border-left: 4px solid #10b981; 
                    padding: 1.5rem; 
                    margin-bottom: 2rem; 
                    border-radius: 0.25rem;
                }
                .summary p { 
                    margin: 0.5rem 0; 
                    font-size: 1.1rem; 
                }
                .summary p strong { 
                    color: #059669; 
                    font-weight: 600;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    font-size: 0.875rem;
                }
                th, td { 
                    padding: 0.75rem 1rem; 
                    text-align: left; 
                    border-bottom: 1px solid #e5e7eb; 
                }
                thead th { 
                    background-color: #064e3b; /* emerald-900 */
                    color: white; 
                    font-weight: 600;
                    text-transform: uppercase; 
                    letter-spacing: 0.05em; 
                }
                tbody tr:nth-child(even) { 
                    background-color: #f9fafb; 
                }
                tbody tr:hover { 
                    background-color: #ecfdf5; 
                }
                .text-right { text-align: right; font-variant-numeric: tabular-nums; }
                .text-red { color: #dc2626; }
                .no-data { text-align: center; padding: 2rem; color: #6b7280; }
                footer { 
                    margin-top: 2rem; 
                    text-align: center; 
                    font-size: 0.875rem; 
                    color: #9ca3af; 
                }
                 @media print {
                    body { padding: 0; background-color: #fff; }
                    .container { box-shadow: none; border-radius: 0; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>${syndicateName}</h1>
                    <p>${title}</p>
                    <p class="subtitle">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                </header>

                ${summaryHtml}

                <table>
                    <thead>
                        <tr>${tableHeaders}</tr>
                    </thead>
                    <tbody>
                        ${tableBody}
                    </tbody>
                </table>

                <footer>
                    Sistema de Gestão - Sindicato Rural de Indiaroba
                </footer>
            </div>
        </body>
        </html>
    `;
};


export const openReportInNewTab = async (title: string, columns: any[], body: any[], summaryLines?: string[]) => {
    try {
        const htmlContent = await generateHtml(title, columns, body, summaryLines);
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        } else {
            alert('Por favor, habilite pop-ups para este site.');
        }
    } catch (error) {
        console.error("Failed to generate or open report:", error);
        alert("Ocorreu um erro ao gerar o relatório.");
    }
};