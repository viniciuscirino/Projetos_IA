import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
// FIX: Import Dexie for type casting to resolve inherited method errors.
import Dexie from 'dexie';
import { db } from '../services/db';
import type { Client, Document } from '../types';

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

// Generic avatar for clients without a photo
const genericAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMWExYWEiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iNSIvPjxwYXRoIGQ9Ik0yMCAyMWE4IDggMCAwIDAtMTYgMCIvPjwvc3ZnPg==';

// Input masking functions
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length > 10) { // Celular com 9º dígito
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    } else { // Fixo ou celular sem 9º dígito
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
};


const ClientForm: React.FC<{ client?: Client; onSave: () => void; onCancel: () => void }> = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>({
        nomeCompleto: client?.nomeCompleto || '',
        cpf: client?.cpf || '',
        rg: client?.rg || '',
        endereco: client?.endereco || '',
        telefone: client?.telefone || '',
        email: client?.email || '',
        dataFiliacao: client?.dataFiliacao || '',
        status: client?.status || 'Ativo',
        foto: client?.foto || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;
        if (name === 'cpf') {
            maskedValue = maskCPF(value);
        } else if (name === 'telefone') {
            maskedValue = maskPhone(value);
        }
        setFormData(prev => ({ ...prev, [name]: maskedValue }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setFormData(prev => ({ ...prev, foto: base64 }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (client?.id) {
                await db.clients.update(client.id, { ...formData, updatedAt: new Date() });
                alert('Associado atualizado com sucesso!');
            } else {
                await db.clients.add({ ...formData, createdAt: new Date(), updatedAt: new Date() });
                alert('Associado cadastrado com sucesso!');
            }
            onSave();
        } catch (error) {
            console.error("Failed to save client:", error);
            alert("Erro ao salvar associado. Verifique se o CPF já está cadastrado.");
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                    <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} placeholder="Nome Completo do Associado" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" />
                </div>

                {/* CPF */}
                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                    <input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" maxLength={14} />
                </div>

                {/* RG */}
                <div>
                    <label htmlFor="rg" className="block text-sm font-medium text-gray-700">RG</label>
                    <input id="rg" name="rg" value={formData.rg} onChange={handleChange} placeholder="RG" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" />
                </div>

                {/* Telefone */}
                <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(99) 99999-9999" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" maxLength={15} />
                </div>

                {/* E-mail */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input id="email" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="email@exemplo.com" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                
                {/* Data de Filiação */}
                <div>
                    <label htmlFor="dataFiliacao" className="block text-sm font-medium text-gray-700">Data de Filiação</label>
                    <input id="dataFiliacao" name="dataFiliacao" value={formData.dataFiliacao} onChange={handleChange} type="date" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                
                {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition h-[42px]">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Suspenso">Suspenso</option>
                    </select>
                </div>

                {/* Foto */}
                <div className="md:col-span-2">
                    <label htmlFor="foto" className="block text-sm font-medium text-gray-700">Foto</label>
                    <input id="foto" type="file" onChange={handleFileChange} accept="image/*" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"/>
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                    <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço</label>
                    <input id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Endereço completo do associado" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
            </div>
            
            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200 transform hover:scale-105">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">{client ? 'Atualizar Associado' : 'Salvar Associado'}</button>
            </div>
        </form>
    );
};

const DocumentModal: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
    const documents = useLiveQuery(() => db.documents.where({ clientId: client.id! }).toArray(), [client.id]);
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [documents]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                await db.documents.add({
                    clientId: client.id!,
                    name: file.name,
                    type: file.type,
                    content: file,
                    createdAt: new Date(),
                });
            } catch (error) {
                console.error("Failed to upload document:", error);
                alert("Erro ao enviar documento.");
            }
        }
    };

    const handleDelete = async (docId: number) => {
        if (window.confirm("Tem certeza que deseja excluir este documento?")) {
            await db.documents.delete(docId);
        }
    };

    const handleDownload = (doc: Document) => {
        const url = URL.createObjectURL(doc.content);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 fade-in-backdrop">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl scale-in">
                <h2 className="text-xl font-bold mb-4">Documentos de {client.nomeCompleto}</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Adicionar novo documento</label>
                    <input type="file" onChange={handleUpload} className="p-1 border rounded w-full text-sm" />
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <ul className="space-y-2">
                        {documents?.map(doc => (
                            <li key={doc.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 transition-colors">
                                <span className="truncate">{doc.name}</span>
                                <div>
                                    <button onClick={() => handleDownload(doc)} className="text-blue-500 p-1 transition-transform transform hover:scale-110" title="Baixar"><i data-lucide="download" className="w-4 h-4 pointer-events-none"></i></button>
                                    <button onClick={() => handleDelete(doc.id!)} className="text-red-500 p-1 transition-transform transform hover:scale-110" title="Excluir"><i data-lucide="trash-2" className="w-4 h-4 pointer-events-none"></i></button>
                                </div>
                            </li>
                        ))}
                         {documents?.length === 0 && <p className="text-center text-gray-500">Nenhum documento encontrado.</p>}
                    </ul>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-all duration-200 transform hover:scale-105">Fechar</button>
                </div>
            </div>
        </div>,
        modalRoot
    );
};

const StatusBadge: React.FC<{ status: Client['status'] }> = ({ status }) => {
    const colors = {
        Ativo: 'bg-green-100 text-green-800',
        Inativo: 'bg-yellow-100 text-yellow-800',
        Suspenso: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]} shadow-sm`}>{status}</span>;
};


const Clients: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDocModal, setShowDocModal] = useState<Client | null>(null);
    const modalRoot = document.getElementById('modal-root');
    
    const allClients = useLiveQuery(() => db.clients.toArray(), []);

    const filteredClients = useMemo(() => {
        if (!allClients) return [];
        const sortedClients = [...allClients].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
        if (!searchTerm) return sortedClients;
        return sortedClients.filter(client =>
            client.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.cpf.includes(searchTerm)
        );
    }, [allClients, searchTerm]);
    
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [filteredClients, showModal, showDocModal]);

    const handleAdd = () => {
        setEditingClient(undefined);
        setShowModal(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setShowModal(true);
    };

    const handleDelete = async (clientId: number) => {
        if (window.confirm('Tem certeza que deseja excluir este associado? Todos os pagamentos, declarações e documentos relacionados também serão excluídos.')) {
            try {
                // FIX: Cast `db` to `Dexie` to access the `transaction` method.
                await (db as Dexie).transaction('rw', db.clients, db.payments, db.declarations, db.documents, async () => {
                    await db.payments.where({ clientId }).delete();
                    await db.declarations.where({ clientId }).delete();
                    await db.documents.where({ clientId }).delete();
                    await db.clients.delete(clientId);
                });
                alert('Associado excluído com sucesso!');
            } catch (error) {
                console.error("Failed to delete client:", error);
                alert("Ocorreu um erro ao excluir o associado.");
            }
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setEditingClient(undefined);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Associados</h1>
                <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                    <i data-lucide="plus" className="w-5 h-5 mr-2 pointer-events-none"></i> Novo Associado
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    className="p-2 border rounded w-full max-w-sm shadow-sm focus:ring-2 focus:ring-emerald-500 transition-shadow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Nome</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">CPF</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Telefone</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredClients?.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="p-3 flex items-center">
                                        <img src={client.foto || genericAvatar} alt="Foto" className="w-10 h-10 rounded-full mr-3 object-cover bg-gray-200 shadow-sm"/>
                                        {client.nomeCompleto}
                                    </td>
                                    <td className="p-3">{client.cpf}</td>
                                    <td className="p-3">{maskPhone(client.telefone)}</td>
                                    <td className="p-3"><StatusBadge status={client.status} /></td>
                                    <td className="p-3 space-x-1">
                                        <button onClick={() => setShowDocModal(client)} className="text-gray-500 hover:text-gray-700 p-1 transition-transform transform hover:scale-125" title="Documentos"><i data-lucide="folder" className="w-4 h-4 pointer-events-none"></i></button>
                                        <button onClick={() => handleEdit(client)} className="text-blue-500 hover:text-blue-700 p-1 transition-transform transform hover:scale-125" title="Editar"><i data-lucide="edit" className="w-4 h-4 pointer-events-none"></i></button>
                                        <button onClick={() => handleDelete(client.id!)} className="text-red-500 hover:text-red-700 p-1 transition-transform transform hover:scale-125" title="Excluir"><i data-lucide="trash-2" className="w-4 h-4 pointer-events-none"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && modalRoot && ReactDOM.createPortal(
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 fade-in-backdrop px-4 py-12 overflow-y-auto" 
                    onClick={() => setShowModal(false)}
                >
                    <div 
                        className="relative bg-white p-8 rounded-lg shadow-2xl scale-in w-full max-w-4xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <button 
                            onClick={() => setShowModal(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                            aria-label="Fechar"
                        >
                            <i data-lucide="x" className="w-6 h-6 pointer-events-none"></i>
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-gray-800">{editingClient ? 'Editar' : 'Novo'} Associado</h2>
                        <ClientForm client={editingClient} onSave={handleSave} onCancel={() => setShowModal(false)} />
                    </div>
                </div>,
                modalRoot
            )}
            {showDocModal && <DocumentModal client={showDocModal} onClose={() => setShowDocModal(null)} />}
        </div>
    );
};

export default Clients;