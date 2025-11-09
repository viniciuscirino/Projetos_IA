import React, { useState, useEffect, useCallback } from 'react';
import { sqliteService } from '../services/sqliteService';
import type { Payment, Client } from '../types';

const StatCard: React.FC<{ icon: string; title: string; value: string | number; color: string }> = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center transition-all duration-300 ease-in-out transform hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className={`p-3 rounded-full mr-4 ${color} shadow-md`}>
            <i data-lucide={icon} className="w-6 h-6 text-white"></i>
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState({
        totalClients: 0,
        paymentsThisMonth: 0,
        revenueThisMonth: 0,
    });

    const fetchData = useCallback(async () => {
        const clientData = await sqliteService.getAll<Client>('clients');
        const paymentData = await sqliteService.getAll<Payment>('payments');
        setClients(clientData);
        setPayments(paymentData);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (clients && payments) {
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            const currentReference = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

            const thisMonthPayments = payments.filter(p => p.referencia === currentReference);

            const revenue = thisMonthPayments.reduce((sum, p) => sum + p.valor, 0);

            setStats({
                totalClients: clients.length,
                paymentsThisMonth: thisMonthPayments.length,
                revenueThisMonth: revenue,
            });
        }
    }, [clients, payments]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [stats]);
    
    const recentPayments = payments
        ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5) || [];

    const getClientName = (clientId: number) => {
        return clients?.find(c => c.id === clientId)?.nomeCompleto || 'Desconhecido';
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard icon="users" title="Total de Associados" value={stats.totalClients} color="bg-blue-500" />
                <StatCard icon="calendar-check" title="Pagamentos Este Mês" value={stats.paymentsThisMonth} color="bg-emerald-500" />
                <StatCard icon="banknote" title="Receita do Mês" value={`R$ ${stats.revenueThisMonth.toFixed(2)}`} color="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Pagamentos Recentes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Associado</th>
                                    <th className="p-3">Referência</th>
                                    <th className="p-3">Valor</th>
                                    <th className="p-3">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.length > 0 ? (
                                    recentPayments.map(p => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                                            <td className="p-3">{getClientName(p.clientId)}</td>
                                            <td className="p-3">{p.referencia ? p.referencia.split('-').reverse().join('/') : 'N/A'}</td>
                                            <td className="p-3">R$ {p.valor.toFixed(2)}</td>
                                            <td className="p-3">{new Date(p.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-3 text-center text-gray-500">Nenhum pagamento recente.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;