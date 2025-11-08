import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Client, DeclarationLog } from '../types';
import { generateDeclarationPDF, generatePaymentStatusDeclarationPDF } from '../services/pdfService';

const Declarations: React.FC = () => {
    const [selectedClientId, setSelectedClientId] = useState<number | string>('');
    const [declarationType, setDeclarationType] = useState<'association' | 'paymentStatus'>('association');
    const clients = useLiveQuery(() => db.clients.toArray(), []);
    const declarations = useLiveQuery(() => db.declarations.orderBy('createdAt').reverse().toArray(), []);
    
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const clientMap = useMemo(() => {
        if (!clients) return new Map();
        return new Map(clients.map(c => [c.id, c.nomeCompleto]));
    }, [clients]);

    const handleGenerate = async () => {
        if (!selectedClientId) {
            alert('Por favor, selecione um associado.');
            return;
        }
        
        const client = clients?.find(c => c.id === Number(selectedClientId));
        if (!client) return;

        try {
            if (declarationType === 'association') {
                await generateDeclarationPDF(client);
            } else if (declarationType === 'paymentStatus') {
                const lastPaymentArray = await db.payments
                    .where({ clientId: client.id! })
                    .reverse()
                    .sortBy('referencia');
                
                if (lastPaymentArray.length === 0) {
                    alert('Este associado não possui pagamentos registrados para gerar a declaração de pagamento.');
                    return;
                }
    
                await generatePaymentStatusDeclarationPDF(client, lastPaymentArray[0]);
            }

            // Log the declaration
            await db.declarations.add({
                clientId: client.id!,
                dataEmissao: new Date().toISOString().split('T')[0],
                createdAt: new Date()
            });
            
        } catch (error) {
            console.error("Failed to generate declaration:", error);
            alert("Ocorreu um erro ao gerar a declaração.");
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Declarações</h1>

            <div className="p-6 bg-white rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Gerar Nova Declaração</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">Associado</label>
                        <select 
                            id="client-select"
                            value={selectedClientId} 
                            onChange={e => setSelectedClientId(e.target.value)} 
                            className="p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition"
                        >
                            <option value="">Selecione um associado</option>
                            {clients?.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)).map(c => <option key={c.id} value={c.id}>{c.nomeCompleto} - {c.cpf}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="declaration-type-select" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Declaração</label>
                        <select 
                            id="declaration-type-select"
                            value={declarationType} 
                            onChange={e => setDeclarationType(e.target.value as 'association' | 'paymentStatus')} 
                            className="p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition"
                        >
                            <option value="association">Vínculo Associativo</option>
                            <option value="paymentStatus">Situação de Pagamento</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        <i data-lucide="file-text" className="w-4 h-4 mr-2 pointer-events-none"></i>
                        Gerar PDF
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg">
                 <h2 className="text-xl font-semibold text-gray-700 p-4 border-b">Histórico de Declarações</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                             <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Associado</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Data de Emissão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {declarations?.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="p-3">{clientMap.get(d.clientId)}</td>
                                    <td className="p-3">{new Date(d.dataEmissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Declarations;