import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Setting, User } from '../types';
import Dexie from 'dexie';

const Admin: React.FC = () => {
    const [settings, setSettings] = useState<{ [key: string]: any }>({});
    const [isLoading, setIsLoading] = useState(true);

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
    const users = useLiveQuery(() => db.users.toArray(), []);


    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const settingsArray = await db.settings.toArray();
            const settingsObj = settingsArray.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {} as { [key: string]: any });
            setSettings(settingsObj);
        } catch (error) {
            console.error("Failed to load settings:", error);
            alert("Erro ao carregar configurações.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [isLoading, users]);

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
            const settingsToSave: Setting[] = Object.entries(settings).map(([key, value]) => ({ key, value }));
            await db.settings.bulkPut(settingsToSave);
            alert("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Erro ao salvar configurações.");
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !newPassword.trim()) {
            alert("Por favor, preencha o nome de usuário e a senha.");
            return;
        }
        try {
            await db.users.add({
                username: newUsername.trim(),
                password: newPassword,
                role: newRole,
                createdAt: new Date(),
            });
            alert('Usuário adicionado com sucesso!');
            setNewUsername('');
            setNewPassword('');
            setNewRole('user');
        } catch (error) {
            console.error("Failed to add user:", error);
            alert("Erro ao adicionar usuário. O nome de usuário já pode existir.");
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (user.username === 'admin') {
            alert("Não é possível excluir o usuário administrador principal.");
            return;
        }
        if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.username}"?`)) {
            try {
                await db.users.delete(user.id!);
                alert("Usuário excluído com sucesso!");
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Erro ao excluir usuário.");
            }
        }
    };
    
    const handleExportData = async () => {
        try {
            const data: { [key: string]: any[] } = {};
            // FIX: Cast `db` to `Dexie` to access the `tables` property.
            for (const table of (db as Dexie).tables) {
                const tableData = await table.toArray();
                data[table.name] = tableData;
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-sindicato-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("Erro ao exportar dados.");
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("Atenção: A importação de dados substituirá TODOS os dados existentes no sistema. Deseja continuar?")) {
            event.target.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                // FIX: Cast `db` to `Dexie` to access the `transaction` method and `tables` property.
                await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
                    for (const table of (db as Dexie).tables) {
                        if (data[table.name]) {
                            // Convert date strings back to Date objects
                            const itemsToImport = data[table.name].map((item: any) => {
                                const newItem = { ...item };
                                if (item.createdAt) newItem.createdAt = new Date(item.createdAt);
                                if (item.updatedAt) newItem.updatedAt = new Date(item.updatedAt);
                                return newItem;
                            });
                            await table.clear();
                            await table.bulkAdd(itemsToImport);
                        }
                    }
                });
                alert("Dados importados com sucesso! A página será recarregada.");
                window.location.reload();
            } catch (error) {
                console.error("Failed to import data:", error);
                alert("Erro ao importar dados. O arquivo pode estar corrompido ou em formato inválido.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Administração</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management Card */}
                <div className="bg-white p-6 rounded-lg shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Gerenciamento de Usuários</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Adicionar Novo Usuário</h3>
                            <form onSubmit={handleAddUser} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Usuário</label>
                                    <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Senha</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Função</label>
                                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition">
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
                            <h3 className="font-semibold text-gray-800 mb-2">Usuários Existentes</h3>
                            <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto pr-2">
                                {users?.map(user => (
                                    <li key={user.id} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteUser(user)} 
                                            className="text-red-500 hover:text-red-700 p-1 disabled:text-gray-300 disabled:cursor-not-allowed transition-transform transform hover:scale-125" 
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
                <div className="bg-white p-6 rounded-lg shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Gerenciamento de Dados</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        É altamente recomendável fazer backups regulares para evitar perdas de dados.
                        O backup exporta tudo para um arquivo que pode ser restaurado futuramente.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleExportData} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                            <i data-lucide="download" className="w-4 h-4 mr-2 pointer-events-none"></i> Exportar (Backup)
                        </button>
                        <label className="w-full flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
                            <i data-lucide="upload" className="w-4 h-4 mr-2 pointer-events-none"></i> Importar (Restaurar)
                            <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                        </label>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-white p-6 rounded-lg shadow-xl lg:col-span-2 transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Configurações Gerais</h2>
                    {isLoading ? <p>Carregando...</p> : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do Sindicato</label>
                                <input value={settings.syndicateName || ''} onChange={(e) => handleSettingsChange('syndicateName', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                                <input value={settings.syndicateCnpj || ''} onChange={(e) => handleSettingsChange('syndicateCnpj', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Endereço</label>
                                <input value={settings.syndicateAddress || ''} onChange={(e) => handleSettingsChange('syndicateAddress', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Telefone para Contato</label>
                                <input value={settings.syndicatePhone || ''} onChange={(e) => handleSettingsChange('syndicatePhone', e.target.value)} className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Assinatura da Diretoria (Imagem)</label>
                                <input type="file" accept="image/png, image/jpeg" onChange={handleSignatureUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"/>
                                {settings.syndicateSignature && (
                                    <div className="mt-2 p-2 border rounded-md inline-block bg-gray-50">
                                        <p className="text-xs text-gray-500 mb-1">Assinatura Atual:</p>
                                        <img src={settings.syndicateSignature} alt="Assinatura" className="h-16 border bg-white"/>
                                    </div>
                                )}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Template da Declaração de Vínculo</label>
                                <textarea value={settings.declarationTemplate || ''} onChange={(e) => handleSettingsChange('declarationTemplate', e.target.value)} rows={6} className="p-2 border rounded w-full mt-1 font-mono text-sm focus:ring-2 focus:ring-emerald-500 transition"></textarea>
                                <p className="text-xs text-gray-500 mt-1">Use: {"{{NOME_ASSOCIADO}}"}, {"{{CPF}}"}, {"{{RG}}"}, {"{{DATA_FILIACAO}}"} </p>
                            </div>
                            <button onClick={handleSaveSettings} className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                                <i data-lucide="save" className="w-4 h-4 mr-2 pointer-events-none"></i> Salvar Configurações
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;