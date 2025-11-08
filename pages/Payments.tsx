import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Client, Payment } from '../types';
import { generatePaymentReceipt } from '../services/pdfService';

const PaymentForm: React.FC<{ onSave: () => void, clients: Client[], username: string }> = ({ onSave, clients, username }) => {
    const today = new Date();
    const currentMonthRef = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [clientId, setClientId] = useState<number | string>('');
    const [referencia, setReferencia] = useState<string>(currentMonthRef);
    const [valor, setValor] = useState<number | ''>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || valor === '' || !referencia) return;
        
        const today = new Date();
        try {
            await db.payments.add({
                clientId: Number(clientId),
                referencia,
                dataPagamento: today.toISOString().split('T')[0],
                valor: Number(valor),
                createdAt: new Date(),
                registeredBy: username,
            });
            // Reset form on successful submission
            setClientId('');
            setValor('');
            setReferencia(currentMonthRef);
            onSave();
        } catch(error) {
            console.error("Failed to save payment:", error);
            alert("Erro ao salvar pagamento. Este associado já possui um pagamento para este mês de referência.");
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Registrar Novo Pagamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Associado</label>
                    <select value={clientId} onChange={e => setClientId(Number(e.target.value))} required className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition">
                        <option value="">Selecione...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.nomeCompleto}</option>)}
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                    <input type="number" value={valor} onChange={e => setValor(Number(e.target.value))} placeholder="Valor" required min="0.01" step="0.01" className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mês Ref.</label>
                    <input type="month" value={referencia} onChange={e => setReferencia(e.target.value)} required className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 h-10 shadow-md hover:shadow-lg transition-all transform hover:scale-105">Registrar</button>
            </div>
        </form>
    );
};

interface PaymentsProps {
    username: string;
}

const Payments: React.FC<PaymentsProps> = ({ username }) => {
    const [filter, setFilter] = useState('');
    const clients = useLiveQuery(() => db.clients.toArray(), []);
    const payments = useLiveQuery(() => db.payments.orderBy('dataPagamento').reverse().toArray(), []);

    const clientMap = useMemo(() => {
        if (!clients) return new Map();
        return new Map(clients.map(c => [c.id, c.nomeCompleto]));
    }, [clients]);

    const filteredPayments = useMemo(() => {
        if (!payments) return [];
        if (!filter) return payments;
        return payments.filter(p => clientMap.get(p.clientId)?.toLowerCase().includes(filter.toLowerCase()));
    }, [payments, filter, clientMap]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [filteredPayments]);

    const handleReceipt = async (payment: Payment) => {
        const client = clients?.find(c => c.id === payment.clientId);
        if(client) {
            await generatePaymentReceipt(client, payment);
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Pagamentos</h1>
            
            <PaymentForm onSave={() => {}} clients={clients || []} username={username} />

            <div className="mt-8 bg-white rounded-lg shadow-lg">
                 <div className="p-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome do associado..."
                        className="p-2 border rounded w-full max-w-sm shadow-sm focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                             <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Associado</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Referência</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Valor</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Data Pag.</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Registrado por</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredPayments?.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="p-3">{clientMap.get(p.clientId)}</td>
                                    <td className="p-3">{p.referencia ? p.referencia.split('-').reverse().join('/') : 'N/A'}</td>
                                    <td className="p-3">R$ {p.valor.toFixed(2)}</td>
                                    <td className="p-3">{new Date(p.dataPagamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td className="p-3">{p.registeredBy || 'N/A'}</td>
                                    <td className="p-3">
                                        <button onClick={() => handleReceipt(p)} className="text-green-600 hover:text-green-800 p-1 transition-transform transform hover:scale-125" title="Gerar Recibo"><i data-lucide="receipt" className="w-4 h-4 pointer-events-none"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;