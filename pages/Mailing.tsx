import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { sqliteService } from '../services/sqliteService';
import type { Client } from '../types';

const Mailing: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
    
    const fetchClients = useCallback(async () => {
        const clientData = await sqliteService.getAll<Client>('clients');
        setClients(clientData.sort((a,b) => a.nomeCompleto.localeCompare(b.nomeCompleto)));
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [clients, filter]);

    const filteredClients = useMemo(() => {
        if (filter === 'all') return clients;
        if (filter === 'active') return clients.filter(c => c.status === 'Ativo');
        if (filter === 'inactive') return clients.filter(c => c.status !== 'Ativo');
        return [];
    }, [clients, filter]);
    
    const handleWhatsAppClick = (phone: string) => {
        const sanitizedPhone = `55${phone.replace(/\D/g, '')}`;
        window.open(`https://wa.me/${sanitizedPhone}`, '_blank', 'noopener,noreferrer');
    };

    const generateLabels = () => {
        const labelContent = filteredClients.map(client => `
            <div class="label">
                <p>${client.nomeCompleto}</p>
                <p>${client.endereco}</p>
            </div>
        `).join('');

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`
                <html>
                    <head>
                        <title>Etiquetas de Endereçamento</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
                            @page {
                                size: A4;
                                margin: 1.27cm 0.635cm;
                            }
                            body {
                                font-family: 'Inter', sans-serif;
                                margin: 0;
                                padding: 0;
                                display: grid;
                                grid-template-columns: repeat(3, 1fr);
                                grid-template-rows: repeat(10, 1fr);
                                grid-gap: 0;
                                height: 27.16cm; /* A4 height - margins */
                                width: 19.73cm; /* A4 width - margins */
                            }
                            .label {
                                width: 6.35cm;
                                height: 2.54cm;
                                padding: 5px;
                                border: 1px dotted #ccc;
                                box-sizing: border-box;
                                overflow: hidden;
                                font-size: 9pt;
                            }
                            .label p {
                                margin: 0;
                                line-height: 1.3;
                            }
                             @media print {
                                body {
                                    width: auto;
                                    height: auto;
                                }
                                .label {
                                    border: none;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        ${labelContent}
                    </body>
                </html>
            `);
            newWindow.document.close();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mala Direta e Contato</h1>
                <button onClick={generateLabels} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                    <i data-lucide="printer" className="w-5 h-5 mr-2 pointer-events-none"></i> Gerar Etiquetas
                </button>
            </div>

            <div className="mb-4 flex items-center space-x-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
                <span className="font-medium text-gray-700 dark:text-gray-300">Filtrar:</span>
                <div className="flex space-x-2">
                    <button onClick={() => setFilter('active')} className={`px-3 py-1 text-sm rounded-full ${filter === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Ativos</button>
                    <button onClick={() => setFilter('inactive')} className={`px-3 py-1 text-sm rounded-full ${filter === 'inactive' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Inativos/Suspensos</button>
                    <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Todos</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Nome</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Telefone</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Endereço</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                    <td className="p-3">{client.nomeCompleto}</td>
                                    <td className="p-3">{client.telefone}</td>
                                    <td className="p-3">{client.endereco}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => handleWhatsAppClick(client.telefone)} 
                                            className="text-green-500 hover:text-green-700 p-1 transition-transform transform hover:scale-125" 
                                            title="Abrir no WhatsApp"
                                        >
                                            <i data-lucide="message-circle" className="w-5 h-5 pointer-events-none"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredClients.length === 0 && (
                        <p className="text-center p-4 text-gray-500 dark:text-gray-400">Nenhum associado encontrado para este filtro.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Mailing;
