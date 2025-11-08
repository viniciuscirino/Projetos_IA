import React, { useState, useCallback, useEffect } from 'react';
import { db } from '../services/db';
import type { Client, Payment } from '../types';
import { openReportInNewTab } from '../services/reportService';

const Reports: React.FC = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const generatePaidReport = useCallback(async () => {
        try {
            const reference = `${year}-${String(month).padStart(2, '0')}`;
            const paymentsInPeriod = await db.payments.where({ referencia: reference }).toArray();
            const clientIds = paymentsInPeriod.map(p => p.clientId);
            const clients = await db.clients.where('id').anyOf(clientIds).toArray() as Client[];
            const clientMap = new Map(clients.map(c => [c.id, c]));

            const data = paymentsInPeriod.map(p => {
                const client = clientMap.get(p.clientId);
                return {
                    nome: client?.nomeCompleto || 'N/A',
                    cpf: client?.cpf || 'N/A',
                    valor: `R$ ${p.valor.toFixed(2).replace('.', ',')}`,
                    data: new Date(p.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                };
            }).sort((a,b) => a.nome.localeCompare(b.nome));
            
            const title = `Relatório de Pagantes - ${String(month).padStart(2,'0')}/${year}`;
            const columns = [
                { header: 'Nome', dataKey: 'nome' },
                { header: 'CPF', dataKey: 'cpf' },
                { header: 'Data Pag.', dataKey: 'data' },
                { header: 'Valor Pago', dataKey: 'valor' },
            ];
            
            openReportInNewTab(title, columns, data);

        } catch (error) {
            console.error("Error generating paid report:", error);
            alert("Erro ao gerar relatório de pagantes.");
        }
    }, [month, year]);

    const generateUnpaidReport = useCallback(async () => {
        try {
            const allClients = await db.clients.where({ status: 'Ativo' }).toArray();
            const reference = `${year}-${String(month).padStart(2, '0')}`;
            const paymentsInPeriod = await db.payments.where({ referencia: reference }).toArray();
            const paidClientIds = new Set(paymentsInPeriod.map(p => p.clientId));
            
            const unpaidClients = allClients.filter(c => !paidClientIds.has(c.id!));
            
            const data = unpaidClients.map(c => ({
                nome: c.nomeCompleto,
                cpf: c.cpf,
                telefone: c.telefone,
            })).sort((a,b) => a.nome.localeCompare(b.nome));
            
            const title = `Relatório de Inadimplentes - ${String(month).padStart(2, '0')}/${year}`;
            const columns = [
                { header: 'Nome', dataKey: 'nome' },
                { header: 'CPF', dataKey: 'cpf' },
                { header: 'Telefone', dataKey: 'telefone' },
            ];
            openReportInNewTab(title, columns, data);
        } catch (error) {
            console.error("Error generating unpaid report:", error);
            alert("Erro ao gerar relatório de inadimplentes.");
        }
    }, [month, year]);

    const generateFinancialBalanceReport = useCallback(async () => {
        try {
            // Dexie's `startsWith` is for string indexes. For dates within a year, we need to query between the start and end of the year.
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            
            const paymentsInYear = await db.payments.where('dataPagamento').between(startDate, endDate, true, true).toArray();
            const expensesInYear = await db.expenses.where('date').between(startDate, endDate, true, true).toArray();

            const totalRevenue = paymentsInYear.reduce((sum, p) => sum + p.valor, 0);
            const totalExpenses = expensesInYear.reduce((sum, e) => sum + e.amount, 0);
            const netResult = totalRevenue - totalExpenses;

            const summary = [
                `Total de Receitas (Pagamentos): R$ ${totalRevenue.toFixed(2).replace('.', ',')}`,
                `Total de Despesas: R$ ${totalExpenses.toFixed(2).replace('.', ',')}`,
                `Resultado Líquido: R$ ${netResult.toFixed(2).replace('.', ',')}`
            ];
            
            const paymentData = paymentsInYear.map(p => ({
                description: `Pagamento de associado`,
                value: `R$ ${p.valor.toFixed(2).replace('.', ',')}`,
                date: new Date(p.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                type: 'Receita',
                rawDate: new Date(p.dataPagamento)
            }));
            const expenseData = expensesInYear.map(e => ({
                description: e.description,
                value: `R$ -${e.amount.toFixed(2).replace('.', ',')}`,
                date: new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                type: 'Despesa',
                rawDate: new Date(e.date)
            }));

            const combinedData = [...paymentData, ...expenseData].sort((a,b) => b.rawDate.getTime() - a.rawDate.getTime());
            
            const title = `Balanço Financeiro - ${year}`;
            const columns = [
                { header: 'Descrição', dataKey: 'description' },
                { header: 'Tipo', dataKey: 'type' },
                { header: 'Data', dataKey: 'date' },
                { header: 'Valor', dataKey: 'value' },
            ];
            
            openReportInNewTab(title, columns, combinedData, summary);

        } catch(error) {
            console.error("Error generating financial report:", error);
            alert("Erro ao gerar balanço financeiro.");
        }
    }, [year]);


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios</h1>

            <div className="p-6 bg-white rounded-lg shadow-xl mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Gerar Relatório</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Monthly Reports */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 shadow-inner">
                        <h3 className="font-semibold text-gray-800">Relatórios Mensais</h3>
                         <div className="flex items-end space-x-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mês</label>
                                <input type="number" value={month} onChange={e => setMonth(Number(e.target.value))} min="1" max="12" className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ano</label>
                                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min="2000" className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                         </div>
                         <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <button onClick={generatePaidReport} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm">
                                <i data-lucide="user-check" className="w-4 h-4 mr-2 pointer-events-none"></i> Gerar Relatório de Pagantes
                            </button>
                            <button onClick={generateUnpaidReport} className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm">
                                 <i data-lucide="user-x" className="w-4 h-4 mr-2 pointer-events-none"></i> Gerar Relatório de Inadimplentes
                            </button>
                         </div>
                    </div>
                    {/* Annual Reports */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 shadow-inner">
                        <h3 className="font-semibold text-gray-800">Relatórios Anuais</h3>
                         <div className="flex items-end space-x-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Ano</label>
                                <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min="2000" className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                         </div>
                         <div className="flex items-end">
                            <button onClick={generateFinancialBalanceReport} className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg text-sm">
                                <i data-lucide="scale" className="w-4 h-4 mr-2 pointer-events-none"></i> Gerar Balanço Financeiro
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;