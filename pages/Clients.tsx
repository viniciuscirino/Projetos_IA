import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { sqliteService } from '../services/sqliteService';
import { toastService } from '../services/toastService';
import type { Client, Document, Attendance, Payment } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

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
                await sqliteService.update('clients', client.id, { ...formData, updatedAt: new Date().toISOString() });
                toastService.show('success', 'Sucesso!', 'Associado atualizado com sucesso!');
            } else {
                const newClient = { ...formData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                await sqliteService.insert('clients', newClient);
                toastService.show('success', 'Sucesso!', 'Associado cadastrado com sucesso!');
            }
            onSave();
        } catch (error) {
            console.error("Failed to save client:", error);
            toastService.show('error', 'Erro!', 'Falha ao salvar associado. Verifique se o CPF já está cadastrado.');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                    <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                    <input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} placeholder="Nome Completo do Associado" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                </div>

                {/* CPF */}
                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                    <input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" maxLength={14} />
                </div>

                {/* RG */}
                <div>
                    <label htmlFor="rg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">RG</label>
                    <input id="rg" name="rg" value={formData.rg} onChange={handleChange} placeholder="RG" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                </div>

                {/* Telefone */}
                <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                    <input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(99) 99999-9999" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" maxLength={15} />
                </div>

                {/* E-mail */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                    <input id="email" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="email@exemplo.com" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                </div>
                
                {/* Data de Filiação */}
                <div>
                    <label htmlFor="dataFiliacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Filiação</label>
                    <input id="dataFiliacao" name="dataFiliacao" value={formData.dataFiliacao} onChange={handleChange} type="date" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                </div>
                
                {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition h-[42px] bg-transparent dark:border-gray-600 dark:bg-gray-800">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Suspenso">Suspenso</option>
                    </select>
                </div>

                {/* Foto */}
                <div className="md:col-span-2">
                    <label htmlFor="foto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto</label>
                    <input id="foto" type="file" onChange={handleFileChange} accept="image/*" className="mt-1 block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-gray-700 dark:file:text-emerald-300 dark:hover:file:bg-gray-600 cursor-pointer"/>
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                    <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                    <input id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} placeholder="Endereço completo do associado" required className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                </div>
            </div>
            
            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-all duration-200 transform hover:scale-105">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">{client ? 'Atualizar Associado' : 'Salvar Associado'}</button>
            </div>
        </form>
    );
};

const DocumentPreviewModal: React.FC<{ doc: Document; onClose: () => void }> = ({ doc, onClose }) => {
    const [contentUrl, setContentUrl] = useState<string | null>(null);
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        if (doc && doc.content) {
            const blob = new Blob([doc.content], { type: doc.type });
            const url = URL.createObjectURL(blob);
            setContentUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [doc]);
    
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);
    
    const handleDownload = () => {
        if (contentUrl) {
            const a = document.createElement('a');
            a.href = contentUrl;
            a.download = doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };


    const renderContent = () => {
        if (!contentUrl) {
            return <div className="flex justify-center items-center h-full"><p>Carregando visualização...</p></div>;
        }

        if (doc.type.startsWith('image/')) {
            return <img src={contentUrl} alt={doc.name} className="max-w-full max-h-full object-contain" />;
        }
        
        if (doc.type === 'application/pdf') {
             return <iframe src={contentUrl} title={doc.name} className="w-full h-full border-0"></iframe>;
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <i data-lucide="file" className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"></i>
                <h3 className="text-lg font-semibold">Visualização não suportada</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">O arquivo <span className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded text-sm">{doc.name}</span> não pode ser exibido diretamente.</p>
                <button onClick={handleDownload} className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                   <i data-lucide="download" className="w-5 h-5 mr-2"></i> Baixar Arquivo
                </button>
            </div>
        );
    };

    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] fade-in-backdrop" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col scale-in" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" title={doc.name}>{doc.name}</h2>
                     <div className="flex items-center space-x-2">
                         <button onClick={handleDownload} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition p-1" title="Baixar Arquivo">
                            <i data-lucide="download" className="w-5 h-5"></i>
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition p-1" title="Fechar">
                            <i data-lucide="x" className="w-6 h-6"></i>
                        </button>
                    </div>
                </header>
                <div className="p-4 flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    {renderContent()}
                </div>
            </div>
        </div>,
        modalRoot
    );
};

const ClientDetailsModal: React.FC<{ client: Client; onClose: () => void; username: string; }> = ({ client, onClose, username }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewingDoc, setPreviewingDoc] = useState<Document | null>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRoot = document.getElementById('modal-root');
    const [activeTab, setActiveTab] = useState<'documents' | 'attendances'>('documents');
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [newAttendanceNote, setNewAttendanceNote] = useState('');

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const docs = await sqliteService.getDocumentsByClientId(client.id!);
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            toastService.show('error', 'Erro!', 'Falha ao buscar documentos.');
        } finally {
            setIsLoading(false);
        }
    }, [client.id]);

    const fetchAttendances = useCallback(async () => {
        setIsLoading(true);
        try {
            const atts = await sqliteService.getAttendancesByClientId(client.id!);
            setAttendances(atts);
        } catch (error) {
            console.error("Failed to fetch attendances:", error);
            toastService.show('error', 'Erro!', 'Falha ao buscar atendimentos.');
        } finally {
            setIsLoading(false);
        }
    }, [client.id]);

    useEffect(() => {
        if (activeTab === 'documents') {
            fetchDocuments();
        } else if (activeTab === 'attendances') {
            fetchAttendances();
        }
    }, [activeTab, fetchDocuments, fetchAttendances]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [documents, isLoading, attendances, activeTab]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const content = new Uint8Array(arrayBuffer);
            await sqliteService.insert('documents', {
                clientId: client.id!,
                name: file.name,
                type: file.type || 'application/octet-stream',
                content: content,
                createdAt: new Date().toISOString()
            });
            toastService.show('success', 'Sucesso!', 'Documento enviado com sucesso!');
            fetchDocuments();
        } catch (error) {
            console.error("Failed to upload document:", error);
            toastService.show('error', 'Erro!', 'Falha ao enviar documento.');
        } finally {
             if (event.target) event.target.value = '';
        }
    };

    const handleConfirmDeleteDoc = async () => {
        if (!docToDelete) return;
        try {
            await sqliteService.delete('documents', docToDelete.id!);
            toastService.show('success', 'Sucesso!', 'Documento excluído com sucesso!');
            fetchDocuments();
        } catch (error) {
            console.error("Failed to delete document:", error);
            toastService.show('error', 'Erro!', 'Falha ao excluir documento.');
        } finally {
            setDocToDelete(null);
        }
    };

    const handleAddAttendance = async () => {
        if (!newAttendanceNote.trim()) return;
        try {
            await sqliteService.insert('attendances', {
                clientId: client.id!,
                notes: newAttendanceNote,
                createdAt: new Date().toISOString(),
                createdBy: username,
            });
            toastService.show('success', 'Sucesso!', 'Atendimento registrado.');
            setNewAttendanceNote('');
            fetchAttendances();
        } catch (error) {
            toastService.show('error', 'Erro!', 'Falha ao registrar atendimento.');
            console.error(error);
        }
    };

    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 fade-in-backdrop">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-3xl scale-in h-[80vh] flex flex-col">
                    <header className="flex items-start justify-between pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Detalhes de {client.nomeCompleto}</h2>
                            <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
                                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                    <button onClick={() => setActiveTab('documents')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Documentos</button>
                                    <button onClick={() => setActiveTab('attendances')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendances' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Atendimentos</button>
                                </nav>
                            </div>
                        </div>
                         <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"><i data-lucide="x" className="w-6 h-6"></i></button>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto mt-2 pr-2">
                        {isLoading ? <p className="text-center text-gray-500">Carregando...</p> : (
                            <>
                                {activeTab === 'documents' && (
                                    <div>
                                        {documents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400"><i data-lucide="folder-open" className="w-12 h-12 mx-auto mb-2"></i><p>Nenhum documento encontrado.</p></div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {documents.map(doc => (
                                                    <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                        <div className="flex items-center truncate"><i data-lucide="file-text" className="w-5 h-5 mr-3 text-emerald-600"></i><div className="truncate"><p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={doc.name}>{doc.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">Adicionado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p></div></div>
                                                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                                            <button onClick={() => setPreviewingDoc(doc)} className="text-blue-500 hover:text-blue-700 p-1 transition-transform transform hover:scale-125" title="Visualizar/Baixar"><i data-lucide="eye" className="w-5 h-5 pointer-events-none"></i></button>
                                                            <button onClick={() => setDocToDelete(doc)} className="text-red-500 hover:text-red-700 p-1 transition-transform transform hover:scale-125" title="Excluir"><i data-lucide="trash-2" className="w-5 h-5 pointer-events-none"></i></button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <footer className="mt-4 pt-4 border-t dark:border-gray-700">
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"><i data-lucide="upload" className="w-5 h-5 mr-2"></i> Adicionar Documento</button>
                                        </footer>
                                    </div>
                                )}
                                {activeTab === 'attendances' && (
                                    <div>
                                        <div className="mb-4"><textarea value={newAttendanceNote} onChange={(e) => setNewAttendanceNote(e.target.value)} rows={3} placeholder="Descreva o atendimento ou ocorrência..." className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 transition"></textarea><button onClick={handleAddAttendance} disabled={!newAttendanceNote.trim()} className="mt-2 flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-md transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"><i data-lucide="plus" className="w-5 h-5 mr-2"></i> Adicionar Registro</button></div>
                                        {attendances.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400"><i data-lucide="message-square-off" className="w-12 h-12 mx-auto mb-2"></i><p>Nenhum atendimento registrado.</p></div>
                                        ) : (
                                            <ul className="space-y-3">
                                                {attendances.map(att => (<li key={att.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{att.notes}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Registrado por <strong>{att.createdBy}</strong> em {new Date(att.createdAt).toLocaleString('pt-BR')}</p></li>))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            {previewingDoc && <DocumentPreviewModal doc={previewingDoc} onClose={() => setPreviewingDoc(null)} />}
            <ConfirmationModal show={!!docToDelete} title="Confirmar Exclusão de Documento" message={<p>Tem certeza que deseja excluir o documento <strong>{docToDelete?.name}</strong>? Esta ação não pode ser desfeita.</p>} onConfirm={handleConfirmDeleteDoc} onCancel={() => setDocToDelete(null)} confirmText="Sim, Excluir"/>
        </>,
        modalRoot
    );
};

const StatusBadge: React.FC<{ status: Client['status'] }> = ({ status }) => {
    const colors = {
        Ativo: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        Inativo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Suspenso: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]} shadow-sm`}>{status}</span>;
};


const Clients: React.FC<{ username: string }> = ({ username }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const modalRoot = document.getElementById('modal-root');
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [overdueClientIds, setOverdueClientIds] = useState<Set<number>>(new Set());

    const fetchClients = useCallback(async () => {
        const clients = await sqliteService.getAll<Client>('clients');
        const payments = await sqliteService.getAll<Payment>('payments');
        setAllClients(clients);

        const today = new Date();
        // Use UTC dates to avoid timezone issues when comparing just dates.
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

        // The reference month for which payment is required is the previous month.
        const lastMonth = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), 0));
        const lastMonthRef = `${lastMonth.getUTCFullYear()}-${String(lastMonth.getUTCMonth() + 1).padStart(2, '0')}`;
    
        // Get the first day of the current month to check against affiliation date.
        const firstDayOfThisMonth = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), 1));

        const paidLastMonthIds = new Set(
            payments.filter(p => p.referencia === lastMonthRef).map(p => p.clientId)
        );

        const newOverdueIds = new Set<number>();
        clients.forEach(client => {
            if (client.status !== 'Ativo' || !client.id) {
                return; // Skip inactive or invalid clients
            }

            // Parse affiliation date as UTC to match other dates
            const filiacaoDateParts = client.dataFiliacao.split('-').map(Number);
            const filiacaoDate = new Date(Date.UTC(filiacaoDateParts[0], filiacaoDateParts[1] - 1, filiacaoDateParts[2]));
            
            // A client is only considered for an overdue check if they were a member *before* the start of the current month.
            // If they joined this month, they are not considered overdue for last month's payment.
            if (filiacaoDate >= firstDayOfThisMonth) {
                return; // Skip new members from this month
            }

            if (!paidLastMonthIds.has(client.id)) {
                newOverdueIds.add(client.id);
            }
        });
        setOverdueClientIds(newOverdueIds);
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

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
    }, [filteredClients, showModal, showDetailsModal, clientToDelete]);

    const handleAdd = () => {
        setEditingClient(undefined);
        setShowModal(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setShowModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;

        try {
            await sqliteService.deleteClientAndRelations(clientToDelete.id!);
            toastService.show('success', 'Sucesso!', 'Associado e todos os seus dados foram excluídos.');
            fetchClients(); // Refresh list
        } catch (error) {
            console.error("Falha ao excluir associado:", error);
            toastService.show('error', 'Erro!', 'Ocorreu um erro ao excluir o associado.');
        } finally {
            setClientToDelete(null);
        }
    };

    const handleSave = () => {
        setShowModal(false);
        setEditingClient(undefined);
        fetchClients(); // Refresh list
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Associados</h1>
                <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                    <i data-lucide="plus" className="w-5 h-5 mr-2 pointer-events-none"></i> Novo Associado
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    className="p-2 border rounded w-full max-w-sm shadow-sm focus:ring-2 focus:ring-emerald-500 transition-shadow bg-transparent dark:border-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Nome</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">CPF</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Telefone</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredClients?.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                    <td className="p-3 flex items-center">
                                        <img src={client.foto || genericAvatar} alt="Foto" className="w-10 h-10 rounded-full mr-3 object-cover bg-gray-200 shadow-sm"/>
                                        <div className="flex items-center">
                                          {client.nomeCompleto}
                                          {overdueClientIds.has(client.id!) && (
                                              <span title="Pagamento do último mês em aberto" className="ml-2 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse"></span>
                                          )}
                                        </div>
                                    </td>
                                    <td className="p-3">{client.cpf}</td>
                                    <td className="p-3">{maskPhone(client.telefone)}</td>
                                    <td className="p-3"><StatusBadge status={client.status} /></td>
                                    <td className="p-3 space-x-1">
                                        <button onClick={() => setShowDetailsModal(client)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 p-1 transition-transform transform hover:scale-125" title="Detalhes"><i data-lucide="folder" className="w-4 h-4 pointer-events-none"></i></button>
                                        <button onClick={() => handleEdit(client)} className="text-blue-500 hover:text-blue-700 p-1 transition-transform transform hover:scale-125" title="Editar"><i data-lucide="edit" className="w-4 h-4 pointer-events-none"></i></button>
                                        <button onClick={() => setClientToDelete(client)} className="text-red-500 hover:text-red-700 p-1 transition-transform transform hover:scale-125" title="Excluir"><i data-lucide="trash-2" className="w-4 h-4 pointer-events-none"></i></button>
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
                        className="relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl scale-in w-full max-w-4xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <button 
                            onClick={() => setShowModal(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            aria-label="Fechar"
                        >
                            <i data-lucide="x" className="w-6 h-6 pointer-events-none"></i>
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{editingClient ? 'Editar' : 'Novo'} Associado</h2>
                        <ClientForm client={editingClient} onSave={handleSave} onCancel={() => setShowModal(false)} />
                    </div>
                </div>,
                modalRoot
            )}
            {showDetailsModal && <ClientDetailsModal client={showDetailsModal} onClose={() => setShowDetailsModal(null)} username={username} />}
            <ConfirmationModal
                show={!!clientToDelete}
                title="Confirmar Exclusão de Associado"
                message={
                    <>
                        <p>Você está prestes a excluir permanentemente o associado:</p>
                        <p className="font-semibold my-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">{clientToDelete?.nomeCompleto}</p>
                        <p className="text-red-700 font-bold">Todos os pagamentos, declarações e documentos relacionados também serão apagados. Esta ação não pode ser desfeita.</p>
                        <p className="mt-2">Deseja continuar?</p>
                    </>
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setClientToDelete(null)}
                confirmText="Sim, Excluir Permanentemente"
            />
        </div>
    );
};

export default Clients;
