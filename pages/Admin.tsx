
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { sqliteService } from '../services/sqliteService';
import { toastService } from '../services/toastService';
import type { Setting, User, Client } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

interface AdminStats {
    clients: number;
    payments: number;
    expenses: number;
    users: number;
}

const StatDisplay: React.FC<{ icon: string; label: string; value: number }> = ({ icon, label, value }) => (
    <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        <i data-lucide={icon} className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mr-3"></i>
        <div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</div>
        </div>
    </div>
);


const WipeConfirmationModal: React.FC<{ show: boolean; onClose: () => void; onConfirm: () => void; }> = ({ show, onClose, onConfirm }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const CONFIRMATION_PHRASE = "APAGAR DADOS";
    const isConfirmed = confirmationText === CONFIRMATION_PHRASE;
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [show]);

    if (!show || !modalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] fade-in-backdrop" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg flex flex-col scale-in p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full mr-3">
                        <i data-lucide="alert-triangle" className="w-6 h-6 text-red-600 dark:text-red-400"></i>
                    </div>
                    <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Ação Irreversível</h2>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Você está prestes a apagar permanentemente todos os dados de associados, pagamentos, despesas e declarações.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Esta ação <strong>não pode ser desfeita</strong>. As configurações do sistema e as contas de usuário não serão afetadas.
                </p>
                <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
                    <label htmlFor="confirm-input" className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        Para confirmar, digite <strong className="text-red-700 dark:text-red-400">{CONFIRMATION_PHRASE}</strong> no campo abaixo:
                    </label>
                    <input
                        id="confirm-input"
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-red-500 transition bg-transparent dark:border-gray-600"
                        autoComplete="off"
                    />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-all duration-200">Cancelar</button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!isConfirmed}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed shadow-md disabled:shadow-none"
                    >
                        Confirmar e Apagar
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
};

const RichTextEditor: React.FC<{
    value: string;
    onChange: (newValue: string) => void;
    placeholders: { label: string; value: string }[];
}> = ({ value, onChange, placeholders }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    
    // To prevent cursor jumping, only update from props if content differs
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '<p><br></p>';
        }
    }, [value]);

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, []);

    const handleCommand = (command: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        editorRef.current?.focus();
        document.execCommand(command, false);
        // Manually trigger input event for state update if execCommand doesn't
        const event = new Event('input', { bubbles: true, cancelable: true });
        editorRef.current?.dispatchEvent(event);
    };

    const handleInsertPlaceholder = (placeholder: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        editorRef.current?.focus();
        document.execCommand('insertText', false, placeholder);
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    return (
        <div className="border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition bg-white dark:bg-gray-800 dark:border-gray-600">
            <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 space-x-1 flex-wrap">
                <button title="Negrito" onClick={handleCommand('bold')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i data-lucide="bold" className="w-4 h-4 pointer-events-none"></i></button>
                <button title="Itálico" onClick={handleCommand('italic')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i data-lucide="italic" className="w-4 h-4 pointer-events-none"></i></button>
                <button title="Sublinhado" onClick={handleCommand('underline')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i data-lucide="underline" className="w-4 h-4 pointer-events-none"></i></button>
                <div className="h-5 border-l border-gray-300 dark:border-gray-500 mx-2"></div>
                {placeholders.map(p => (
                    <button key={p.value} onClick={handleInsertPlaceholder(p.value)} title={`Inserir ${p.label}`} className="m-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors">
                        {p.label}
                    </button>
                ))}
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-3 min-h-[150px] outline-none font-mono text-sm"
                dangerouslySetInnerHTML={{ __html: value || '' }}
            />
        </div>
    );
};


const Admin: React.FC = () => {
    const [settings, setSettings] = useState<{ [key: string]: any }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [showWipeModal, setShowWipeModal] = useState(false);
    
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
    const [users, setUsers] = useState<User[]>([]);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

    const associationPlaceholders = [
        { label: "Nome", value: "{{NOME_ASSOCIADO}}" },
        { label: "CPF", value: "{{CPF}}" },
        { label: "RG", value: "{{RG}}" },
        { label: "Filiação", value: "{{DATA_FILIACAO}}" },
    ];
    const paymentPlaceholders = [
        { label: "Nome", value: "{{NOME_ASSOCIADO}}" },
        { label: "CPF", value: "{{CPF}}" },
        { label: "Mês Pag.", value: "{{MES_ULTIMO_PAGAMENTO}}" },
        { label: "Ano Pag.", value: "{{ANO_ULTIMO_PAGAMENTO}}" },
    ];

    const fetchAdminData = useCallback(async () => {
        setIsLoading(true);
        try {
            const settingsArray = await sqliteService.getAll<Setting>('settings');
            const settingsObj = settingsArray.reduce((acc, setting) => {
                try {
                    acc[setting.key] = JSON.parse(setting.value);
                } catch(e) {
                    acc[setting.key] = setting.value;
                }
                return acc;
            }, {} as { [key: string]: any });
            setSettings(settingsObj);

            const userData = await sqliteService.getAll<User>('users');
            setUsers(userData);

            const clientCount = await sqliteService.getTableCount('clients');
            const paymentCount = await sqliteService.getTableCount('payments');
            const expenseCount = await sqliteService.getTableCount('expenses');
            setStats({
                clients: clientCount,
                payments: paymentCount,
                expenses: expenseCount,
                users: userData.length,
            });

        } catch (error) {
            console.error("Failed to load admin data:", error);
            toastService.show('error', 'Erro!', 'Falha ao carregar os dados de administração.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [isLoading, users, stats, userToDelete, settings, showRestoreConfirm]);

    const handleSettingsChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            handleSettingsChange('syndicateSignature', base64);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveSettings = async () => {
        try {
            for (const [key, value] of Object.entries(settings)) {
                await sqliteService.updateSetting(key, value);
            }
            toastService.show('success', 'Sucesso!', 'Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Failed to save settings:", error);
            toastService.show('error', 'Erro!', 'Falha ao salvar as configurações.');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !newPassword.trim()) {
            toastService.show('info', 'Atenção', 'Por favor, preencha o nome de usuário e a senha.');
            return;
        }
        try {
            await sqliteService.insert('users', {
                username: newUsername.trim(),
                password: newPassword,
                role: newRole,
                createdAt: new Date().toISOString(),
            });
            toastService.show('success', 'Sucesso!', 'Novo usuário adicionado.');
            setNewUsername('');
            setNewPassword('');
            setNewRole('user');
            fetchAdminData();
        } catch (error) {
            console.error("Failed to add user:", error);
            toastService.show('error', 'Erro!', 'Falha ao adicionar usuário. O nome de usuário pode já existir.');
        }
    };

    const handleDeleteUser = (user: User) => {
        if (user.username === 'admin') {
            toastService.show('info', 'Ação Bloqueada', 'Não é possível excluir o usuário administrador principal.');
            return;
        }
        setUserToDelete(user);
    };
    
    const handleConfirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await sqliteService.delete('users', userToDelete.id!);
            toastService.show('success', 'Sucesso!', 'Usuário excluído.');
            fetchAdminData();
        } catch (error) {
            console.error("Failed to delete user:", error);
            toastService.show('error', 'Erro!', 'Falha ao excluir o usuário.');
        } finally {
            setUserToDelete(null);
        }
    };

    const convertToCSV = (data: any[]) => {
        if (!data || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const replacer = (key: string, value: any) => value === null ? '' : value;
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n');
        return csv;
    };

    const downloadCSV = (csvString: string, filename: string) => {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = async (tableName: 'clients' | 'payments' | 'expenses', fileName: string) => {
        try {
            const data = await sqliteService.getAll(tableName);
            if (data.length === 0) {
                toastService.show('info', 'Atenção', `Não há dados na tabela "${tableName}" para exportar.`);
                return;
            }
            const csv = convertToCSV(data);
            downloadCSV(csv, `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
        } catch (error) {
            console.error(`Failed to export ${tableName}:`, error);
            toastService.show('error', 'Erro!', `Falha ao exportar dados de ${tableName}.`);
        }
    };
    
    const handleWipeDataConfirmed = async () => {
        setShowWipeModal(false);
        try {
            await sqliteService.wipeTransactionalData();
            toastService.show('success', 'Operação Concluída', 'Todos os dados de associados, pagamentos e despesas foram apagados.');
            fetchAdminData(); // Refresh stats
        } catch (error) {
            console.error("Failed to wipe data:", error);
            toastService.show('error', 'Erro!', 'Ocorreu um erro ao apagar os dados.');
        }
    };
    
    const handleConfirmRestore = async () => {
        setShowRestoreConfirm(false);
        try {
            const result = await sqliteService.restoreDatabaseFromFile();
            if(result.success) {
                toastService.show('success', 'Restauração Concluída', 'O banco de dados foi restaurado. A aplicação será reiniciada.');
                // In a real Electron app, we might send a message back to main to reload.
                // For now, a delayed reload simulates this.
                setTimeout(() => window.location.reload(), 3000);
            } else if (result.message && !result.message.includes('cancelada')) {
                toastService.show('error', 'Erro de Restauração', result.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Um erro desconhecido ocorreu.";
            toastService.show('error', 'Erro de Restauração', message);
        }
    };

    const handleTestClientDeletion = async () => {
        const testId = `TEST_${Date.now()}`;
        const mockClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: string, updatedAt: string } = {
            nomeCompleto: `Associado Teste ${testId}`,
            cpf: `000.000.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}`,
            rg: '1234567',
            endereco: 'Rua Teste',
            telefone: '(00) 00000-0000',
            email: 'teste@teste.com',
            dataFiliacao: '2023-01-01',
            status: 'Ativo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        let newClientId: number | undefined;
    
        try {
            console.log('--- INICIANDO TESTE DE EXCLUSÃO DE ASSOCIADO ---');
    
            // 1. Inserir associado
            console.log('Passo 1: Inserindo associado de teste...');
            const insertedId = await sqliteService.insert('clients', mockClient);
            if (typeof insertedId !== 'number') {
                throw new Error('Falha ao inserir associado de teste. O ID retornado não é um número.');
            }
            newClientId = insertedId;
            console.log(`Associado de teste inserido com sucesso. ID: ${newClientId}`);
    
            // 2. Verificar inserção
            console.log('Passo 2: Verificando se o associado existe no banco de dados...');
            const insertedClient = await sqliteService.getById<Client>('clients', newClientId);
            if (!insertedClient || insertedClient.id !== newClientId) {
                throw new Error(`Falha na verificação. O associado com ID ${newClientId} não foi encontrado após a inserção.`);
            }
            console.log('Verificação bem-sucedida. Associado encontrado.');
            
            // 3. Excluir associado
            console.log(`Passo 3: Solicitando a exclusão do associado de teste (ID: ${newClientId})...`);
            await sqliteService.deleteClientAndRelations(newClientId);
            console.log('Função de exclusão executada.');
    
            // 4. Verificar exclusão
            console.log('Passo 4: Verificando se o associado foi removido do banco de dados...');
            const deletedClient = await sqliteService.getById<Client>('clients', newClientId);
            if (deletedClient) {
                throw new Error(`Falha na verificação final. O associado com ID ${newClientId} ainda existe após a exclusão.`);
            }
            console.log('Verificação final bem-sucedida. Associado não encontrado.');
            
            console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
            toastService.show('success', 'Teste Concluído', 'A função de exclusão está funcionando corretamente. Verifique o console para detalhes.');
    
        } catch (error: any) {
            console.error('--- TESTE FALHOU ---');
            console.error(error);
            toastService.show('error', 'Teste Falhou', `Causa: ${error.message}. Verifique o console para detalhes.`);
            // Cleanup in case of failure during verification
            if (newClientId) {
                try {
                    console.log('Tentando limpar associado de teste que pode ter restado...');
                    await sqliteService.deleteClientAndRelations(newClientId);
                } catch (cleanupError) {
                    console.error('Falha ao limpar o associado de teste após o erro:', cleanupError);
                }
            }
        }
    };


    return (
        <div className="dark:text-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Administração</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-600 pb-2">Gerenciamento de Usuários</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Adicionar Novo Usuário</h3>
                            <form onSubmit={handleAddUser} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                                    <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Função</label>
                                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600 dark:bg-gray-800">
                                        <option value="user">Usuário</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                                    <i data-lucide="user-plus" className="w-4 h-4 mr-2 pointer-events-none"></i> Adicionar Usuário
                                </button>
                            </form>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Usuários Existentes</h3>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto pr-2">
                                {users?.map(user => (
                                    <li key={user.id} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteUser(user)} 
                                            className="text-red-500 hover:text-red-700 p-1 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-125" 
                                            title="Excluir"
                                            disabled={user.username === 'admin'}
                                        >
                                            <i data-lucide="trash-2" className="w-4 h-4 pointer-events-none"></i>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Data Management Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl transition-shadow duration-300 hover:shadow-2xl flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-600 pb-2">Dados e Sistema</h2>
                    
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Visão Geral do Banco de Dados</h3>
                        {stats ? (
                             <div className="grid grid-cols-2 gap-3">
                                <StatDisplay icon="users" label="Associados" value={stats.clients} />
                                <StatDisplay icon="dollar-sign" label="Pagamentos" value={stats.payments} />
                                <StatDisplay icon="trending-down" label="Despesas" value={stats.expenses} />
                                <StatDisplay icon="shield" label="Usuários" value={stats.users} />
                            </div>
                        ) : <p className="text-sm text-gray-500">Carregando estatísticas...</p>}
                    </div>

                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Exportar Dados</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={() => handleExport('clients', 'associados')} className="flex-1 flex items-center justify-center text-sm px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 transform hover:scale-105">
                                <i data-lucide="download" className="w-4 h-4 mr-2"></i> Associados (CSV)
                            </button>
                             <button onClick={() => handleExport('payments', 'pagamentos')} className="flex-1 flex items-center justify-center text-sm px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 transform hover:scale-105">
                                <i data-lucide="download" className="w-4 h-4 mr-2"></i> Pagamentos (CSV)
                            </button>
                             <button onClick={() => handleExport('expenses', 'despesas')} className="flex-1 flex items-center justify-center text-sm px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 transform hover:scale-105">
                                <i data-lucide="download" className="w-4 h-4 mr-2"></i> Despesas (CSV)
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto border-t-4 border-red-200 dark:border-red-900/50 pt-3">
                         <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Zona de Perigo</h3>
                         <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">Apagar Dados Transacionais</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Remove todos associados, pagamentos e despesas.</p>
                            </div>
                            <button onClick={() => setShowWipeModal(true)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm">
                                Apagar
                            </button>
                         </div>
                         <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg mt-2">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">Restaurar Backup</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Substitui todos os dados por um arquivo de backup.</p>
                            </div>
                            <button onClick={() => setShowRestoreConfirm(true)} className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors shadow-sm">
                                Restaurar
                            </button>
                         </div>
                    </div>
                </div>

                {/* System Diagnostics */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-600 pb-2">Diagnóstico do Sistema</h2>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg">
                        <div className="flex items-start">
                            <i data-lucide="bug" className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-3 mt-1 flex-shrink-0"></i>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Teste de Integridade do Banco de Dados</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 my-2">
                                    Se estiver com problemas para excluir associados, este teste fará uma verificação completa: irá criar um novo associado, verificar se ele foi salvo, tentar excluí-lo e, em seguida, verificar se a exclusão foi bem-sucedida.
                                </p>
                                <button onClick={handleTestClientDeletion} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                                    <i data-lucide="play-circle" className="w-4 h-4 mr-2 pointer-events-none"></i> Executar Teste
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl lg:col-span-2 transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-600 pb-2">Configurações Gerais</h2>
                    {isLoading ? <p>Carregando...</p> : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Sindicato</label>
                                    <input value={settings.syndicateName || ''} onChange={(e) => handleSettingsChange('syndicateName', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ</label>
                                    <input value={settings.syndicateCnpj || ''} onChange={(e) => handleSettingsChange('syndicateCnpj', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                                </div>
                                 <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                                    <input value={settings.syndicateAddress || ''} onChange={(e) => handleSettingsChange('syndicateAddress', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone para Contato</label>
                                    <input value={settings.syndicatePhone || ''} onChange={(e) => handleSettingsChange('syndicatePhone', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition bg-transparent dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assinatura da Diretoria (Imagem)</label>
                                    <input type="file" accept="image/png, image/jpeg" onChange={handleSignatureUpload} className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 dark:file:bg-gray-700 file:text-emerald-700 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-gray-600 cursor-pointer"/>
                                    {settings.syndicateSignature && (
                                        <div className="mt-2 p-2 border dark:border-gray-600 rounded-md inline-block bg-gray-50 dark:bg-gray-700">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assinatura Atual:</p>
                                            <img src={settings.syndicateSignature} alt="Assinatura" className="h-16 border bg-white dark:border-gray-500"/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Templates de Declaração</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Association Declaration Template */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <i data-lucide="file-text" className="w-4 h-4 inline-block mr-2 align-middle"></i>
                                            Declaração de Vínculo Associativo
                                        </label>
                                        <RichTextEditor
                                            value={settings.declarationTemplate || ''}
                                            onChange={(newValue) => handleSettingsChange('declarationTemplate', newValue)}
                                            placeholders={associationPlaceholders}
                                        />
                                    </div>

                                    {/* Payment Status Declaration Template */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            <i data-lucide="receipt" className="w-4 h-4 inline-block mr-2 align-middle"></i>
                                            Declaração de Situação de Pagamento
                                        </label>
                                        <RichTextEditor
                                            value={settings.paymentDeclarationTemplate || ''}
                                            onChange={(newValue) => handleSettingsChange('paymentDeclarationTemplate', newValue)}
                                            placeholders={paymentPlaceholders}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={handleSaveSettings} className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 mt-6">
                                <i data-lucide="save" className="w-5 h-5 mr-2 pointer-events-none"></i> Salvar Todas as Configurações
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <WipeConfirmationModal 
                show={showWipeModal}
                onClose={() => setShowWipeModal(false)}
                onConfirm={handleWipeDataConfirmed}
            />
            <ConfirmationModal
                show={!!userToDelete}
                title="Confirmar Exclusão de Usuário"
                message={<p>Tem certeza que deseja excluir o usuário <strong>{userToDelete?.username}</strong>?</p>}
                onConfirm={handleConfirmDeleteUser}
                onCancel={() => setUserToDelete(null)}
                confirmText="Sim, Excluir"
            />
             <ConfirmationModal
                show={showRestoreConfirm}
                title="Confirmar Restauração de Backup"
                message={
                    <>
                        <p>Uma janela para seleção de arquivo será aberta.</p>
                        <p className="mt-2 text-red-700 font-bold dark:text-red-400">Esta ação irá substituir TODOS os dados atuais no sistema. A operação não pode ser desfeita.</p>
                        <p className="mt-2">Deseja continuar?</p>
                    </>
                }
                onConfirm={handleConfirmRestore}
                onCancel={() => setShowRestoreConfirm(null)}
                confirmText="Sim, Restaurar Backup"
                confirmButtonClass="bg-amber-500 hover:bg-amber-600"
            />
        </div>
    );
};

export default Admin;
