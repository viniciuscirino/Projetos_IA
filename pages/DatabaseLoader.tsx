import React, { useState, useEffect, useRef } from 'react';
// FIX: Use sqliteSyncService for database creation and loading.
import { sqliteSyncService } from '../services/sqliteSyncService';

interface DatabaseLoaderProps {
    onDbLoaded: () => void;
}

const DatabaseLoader: React.FC<DatabaseLoaderProps> = ({ onDbLoaded }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const handleCreateNew = async () => {
        setIsLoading(true);
        try {
            // FIX: Correctly call createNewDatabase from sqliteSyncService.
            await sqliteSyncService.createNewDatabase();
            onDbLoaded();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            // FIX: Correctly call loadDatabase from sqliteSyncService.
            await sqliteSyncService.loadDatabase(file);
            onDbLoaded();
        } catch (error) {
            console.error(error);
            // If loading fails, reset the input to allow trying the same file again
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOpenExisting = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-2xl text-center fade-in">
                <div className="flex justify-center mb-4">
                    <div className="bg-emerald-500 p-3 rounded-full shadow-lg">
                        <i data-lucide="database" className="w-10 h-10 text-white"></i>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Dados</h2>
                <p className="text-gray-600">
                    Para garantir a segurança e a portabilidade dos seus dados, o sistema os salva em um único arquivo <code className="bg-gray-200 text-sm p-1 rounded">.sqlite</code> em seu computador.
                </p>
                <p className="text-sm text-gray-500">
                    Crie uma pasta chamada <strong className="text-emerald-700">"Banco de Dados"</strong> em um local seguro para guardar este arquivo.
                </p>

                {isLoading ? (
                    <div className="py-4">
                        <p className="text-lg font-semibold text-emerald-600">Carregando banco de dados...</p>
                        <p className="text-sm text-gray-500">Isso pode levar alguns instantes.</p>
                    </div>
                ) : (
                    <div className="pt-4 space-y-4">
                        <button
                            onClick={handleCreateNew}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                            <i data-lucide="file-plus-2" className="w-5 h-5 mr-2"></i>
                            Criar Novo Banco de Dados
                        </button>
                        <button
                            onClick={handleOpenExisting}
                            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                            <i data-lucide="folder-open" className="w-5 h-5 mr-2"></i>
                            Abrir Banco de Dados Existente
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".sqlite,.db,.sqlite3"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseLoader;