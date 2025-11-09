

import type { Client, DeclarationLog, Document, Expense, Payment, Setting, User, Attendance } from '../types';

// FIX: The ElectronAPI interface and global window declaration have been moved to `types.ts`
// to provide a single, consistent source of truth throughout the application.

// This service now acts as a typed wrapper around the Electron API,
// making it easy to use throughout the React application.
// All database logic has been moved to main.js.
export const sqliteService = {
    // Generic CRUD
    getAll: <T>(tableName: string) => window.electronAPI.getAll<T>(tableName),
    getById: <T>(tableName:string, id: number) => window.electronAPI.getById<T>(tableName, id),
    getTableCount: (tableName: string) => window.electronAPI.getTableCount(tableName),
    insert: (tableName: string, data: Record<string, any>) => window.electronAPI.insert(tableName, data),
    update: (tableName: string, id: number, data: Record<string, any>) => window.electronAPI.update(tableName, id, data),
    delete: (tableName: string, id: number) => window.electronAPI.delete(tableName, id),

    // Specific Queries
    getUserByUsername: (username: string) => window.electronAPI.getUserByUsername(username),
    getSetting: async (key: string): Promise<Setting | undefined> => {
        const value = await window.electronAPI.getSetting(key);
        return value !== undefined ? { key, value } : undefined;
    },
    updateSetting: (key: string, value: any) => window.electronAPI.updateSetting(key, value),
    getPaymentsByClientId: (clientId: number) => window.electronAPI.getPaymentsByClientId(clientId),
    getDocumentsByClientId: (clientId: number) => window.electronAPI.getDocumentsByClientId(clientId),
    getAttendancesByClientId: (clientId: number) => window.electronAPI.getAttendancesByClientId(clientId),

    // Transactions
    deleteClientAndRelations: (clientId: number) => window.electronAPI.deleteClientAndRelations(clientId),
    wipeTransactionalData: () => window.electronAPI.wipeTransactionalData(),

    // Backup & Restore
    backupDatabaseToFile: () => window.electronAPI.backupDatabase(),
    restoreDatabaseFromFile: () => window.electronAPI.restoreDatabase(),
};
