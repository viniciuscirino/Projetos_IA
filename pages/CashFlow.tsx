import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { sqliteService } from '../services/sqliteService';
import type { Payment, Expense, Client } from '../types';

type Transaction = {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    type: 'Receita' | 'Despesa';
};

const StatCard: React.FC<{ title: string; value: string; color: string, icon: string }> = ({ title, value, color, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            <i data-lucide={icon} className="w-6 h-6 text-white"></i>
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const CashFlow: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [clients, setClients] = useState<Map<number, string>>(new Map());
    const [dateFilter, setDateFilter] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const fetchData = useCallback(async () => {
        const [payments, expenses, clientData] = await Promise.all([
            sqliteService.getAll<Payment>('payments'),
            sqliteService.getAll<Expense>('expenses'),
            sqliteService.getAll<Client>('clients'),
        ]);

        const clientMap = new Map(clientData.map(c => [c.id!, c.nomeCompleto]));
        setClients(clientMap);

        const revenueTransactions: Transaction[] = payments.map(p => ({
            id: `p-${p.id}`,
            date: p.dataPagamento,
            description: `Pagamento de ${clientMap.get(p.clientId) || 'Associado desconhecido'}`,
            category: 'Mensalidade',
            amount: p.valor,
            type: 'Receita',
        }));

        const expenseTransactions: Transaction[] = expenses.map(e => ({
            id: `e-${e.id}`,
            date: e.date,
            description: e.description,
            category: e.category,
            amount: e.amount,
            type: 'Despesa',
        }));

        setTransactions([...revenueTransactions, ...expenseTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [transactions]);
    
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            const startDate = new Date(dateFilter.start);
            const endDate = new Date(dateFilter.end);
            // Adjust for timezone differences by comparing dates only
            tDate.setUTCHours(0,0,0,0);
            startDate.setUTCHours(0,0,0,0);
            endDate.setUTCHours(0,0,0,0);
            
            return tDate >= startDate && tDate <= endDate;
        });
    }, [transactions, dateFilter]);
    
    const summary = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.type === 'Receita') {
                acc.revenue += t.amount;
            } else {
                acc.expenses += t.amount;
            }
            acc.net = acc.revenue - acc.expenses;
            return acc;
        }, { revenue: 0, expenses: 0, net: 0 });
    }, [filteredTransactions]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Fluxo de Caixa</h1>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Início</label>
                        <input type="date" value={dateFilter.start} onChange={e => setDateFilter(prev => ({...prev, start: e.target.value}))} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Fim</label>
                        <input type="date" value={dateFilter.end} onChange={e => setDateFilter(prev => ({...prev, end: e.target.value}))} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600"/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total de Receitas" value={`R$ ${summary.revenue.toFixed(2)}`} color="bg-emerald-500" icon="arrow-up-circle"/>
                <StatCard title="Total de Despesas" value={`R$ ${summary.expenses.toFixed(2)}`} color="bg-red-500" icon="arrow-down-circle"/>
                <StatCard title="Resultado Líquido" value={`R$ ${summary.net.toFixed(2)}`} color={summary.net >= 0 ? "bg-blue-500" : "bg-orange-500"} icon="scale"/>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Data</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Descrição</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Categoria</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                    <td className="p-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="p-3">{t.description}</td>
                                    <td className="p-3">{t.category}</td>
                                    <td className={`p-3 font-semibold ${t.type === 'Receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {t.type === 'Receita' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredTransactions.length === 0 && (
                        <p className="text-center p-4 text-gray-500 dark:text-gray-400">Nenhuma transação encontrada para o período selecionado.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashFlow;
