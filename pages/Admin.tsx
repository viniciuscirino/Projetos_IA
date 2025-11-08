import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import Dexie for type casting to resolve inherited method/property errors.
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Setting, User } from '../types';

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

    const handleExport = async () => {
        try {
            const allData: { [key: string]: any[] } = {};
            // FIX: Cast `db` to `Dexie` to access the `tables` property.
            for (const table of (db as Dexie).tables) {
                allData[table.name] = await table.toArray();
            }
            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
            a.download = `sindicato_backup_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Erro ao exportar dados.");
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("Atenção! Importar um backup substituirá TODOS os dados atuais. Esta ação não pode ser desfeita. Deseja continuar?")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                // FIX: Cast `db` to `Dexie` to access the `transaction` and `tables` properties.
                await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
                    // FIX: Cast `db` to `Dexie` to access the `tables` property.
                    for (const table of (db as Dexie).tables) {
                        await table.clear();
                        if (data[table.name]) {
                            // For documents, we need to recreate Blobs
                            if (table.name === 'documents') {
                                console.warn("A importação de documentos não é suportada nesta versão.");
                            } else {
                                await table.bulkAdd(data[table.name]);
                            }
                        }
                    }
                });
                alert("Dados importados com sucesso! A página será recarregada.");
                window.location.reload();
            } catch (error) {
                console.error("Import failed:", error);
                alert("Erro ao importar dados. Verifique o arquivo de backup.");
            }
        };
        reader.readAsText(file);
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

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Administração</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Backup & Restore Card */}
                <div className="bg-white p-6 rounded-lg shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Backup e Restauração</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Exporte todos os dados do sistema para um arquivo seguro. Guarde-o em um local seguro.</p>
                            <button onClick={handleExport} className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                                <i data-lucide="download" className="w-4 h-4 mr-2 pointer-events-none"></i> Exportar Dados
                            </button>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-sm text-gray-600 mb-2">Importe dados de um arquivo de backup. <strong className="text-red-600">Atenção: Isso substituirá todos os dados atuais.</strong></p>
                            <input type="file" accept=".json" onChange={handleImport} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"/>
                        </div>
                    </div>
                </div>

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
