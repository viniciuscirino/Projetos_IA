import { db } from './db';
import type { Client, DeclarationLog, Document, Expense, Payment, Setting, User, Attendance } from '../types';
// FIX: Split the type-only import for 'dexie' into two separate statements, as a single
// type-only import cannot have both a default import and named bindings.
import type Dexie from 'dexie';
import type { IndexableType } from 'dexie';

// Declare sql.js for backup/restore functionality
declare global {
    interface Window {
        initSqlJs: (config?: any) => Promise<any>;
    }
}

class SqliteService {
    // --- Generic CRUD ---
    async getAll<T>(tableName: string): Promise<T[]> {
        // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'table' method was not found.
        return (db as Dexie).table(tableName).toArray();
    }

    async getById<T>(tableName: string, id: number): Promise<T | undefined> {
        return (db as Dexie).table(tableName).get(id);
    }

    async getTableCount(tableName: string): Promise<number> {
        // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'table' method was not found.
        return (db as Dexie).table(tableName).count();
    }
    
    // FIX: Changed return type from 'number' to 'IndexableType' to correctly handle tables with string primary keys (like 'settings').
    async insert(tableName: string, data: Record<string, any>): Promise<IndexableType> {
        // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'table' method was not found.
        return (db as Dexie).table(tableName).add(data);
    }
    
    async update(tableName: string, id: number, data: Record<string, any>): Promise<number> {
        // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'table' method was not found.
        return (db as Dexie).table(tableName).update(id, data);
    }

    async delete(tableName: string, id: number): Promise<void> {
        console.log(`[SERVICE.DELETE] Iniciando exclusão na tabela '${tableName}' para o ID: ${id}`);
        try {
            const item = await this.getById(tableName, id);
            if (!item) {
                console.warn(`[SERVICE.DELETE] Nenhum item encontrado em '${tableName}' com o ID: ${id}. A operação foi concluída sem alterações.`);
                return;
            }
            await (db as Dexie).table(tableName).delete(id);
            console.log(`[SERVICE.DELETE] Item com ID: ${id} excluído com sucesso da tabela '${tableName}'.`);
        } catch (error) {
            console.error(`[SERVICE.DELETE] Erro catastrófico ao excluir da tabela '${tableName}' para o ID: ${id}.`, error);
            // Re-throw the error so the UI layer can handle it (e.g., show an alert)
            throw new Error(`Falha ao excluir o item de ${tableName}.`);
        }
    }

    // --- Specific Queries ---
    async getUserByUsername(username: string): Promise<User | undefined> {
        return db.users.where('username').equalsIgnoreCase(username).first();
    }

    async getSetting(key: string): Promise<Setting | undefined> {
        return db.settings.get(key);
    }

    // FIX: Changed return type from 'number' to 'IndexableType' to correctly handle tables with string primary keys.
    async updateSetting(key: string, value: any): Promise<IndexableType> {
        return db.settings.put({ key, value });
    }

    async getPaymentsByClientId(clientId: number): Promise<Payment[]> {
        return db.payments.where('clientId').equals(clientId).toArray();
    }

    async getDocumentsByClientId(clientId: number): Promise<Document[]> {
        // Dexie doesn't have reverse sorting on non-indexed fields easily.
        // We sort in memory after fetching.
        const docs = await db.documents.where('clientId').equals(clientId).toArray();
        return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    async getAttendancesByClientId(clientId: number): Promise<Attendance[]> {
        const attendances = await db.attendances.where('clientId').equals(clientId).toArray();
        return attendances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    // --- Transactions ---
    async deleteClientAndRelations(clientId: number): Promise<void> {
        console.log(`[SERVICE.DELETE_CLIENT] Iniciando transação para excluir associado com ID: ${clientId} e todos os dados relacionados.`);
        try {
            // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'transaction' method was not found.
            // FIX: Pass tables as an array to the transaction method to match its signature and resolve the "Expected 3-6 arguments, but got 7" error.
            await (db as Dexie).transaction('rw', [db.clients, db.payments, db.declarations, db.documents, db.attendances], async () => {
                // Payments
                const paymentsCount = await db.payments.where('clientId').equals(clientId).count();
                if (paymentsCount > 0) {
                    const deletedPayments = await db.payments.where('clientId').equals(clientId).delete();
                    console.log(`[SERVICE.DELETE_CLIENT] - Pagamentos: ${deletedPayments} de ${paymentsCount} registros excluídos.`);
                } else {
                    console.log(`[SERVICE.DELETE_CLIENT] - Pagamentos: Nenhum registro encontrado para o associado.`);
                }
                
                // Declarations
                const declarationsCount = await db.declarations.where('clientId').equals(clientId).count();
                 if (declarationsCount > 0) {
                    const deletedDeclarations = await db.declarations.where('clientId').equals(clientId).delete();
                    console.log(`[SERVICE.DELETE_CLIENT] - Declarações: ${deletedDeclarations} de ${declarationsCount} registros excluídos.`);
                } else {
                    console.log(`[SERVICE.DELETE_CLIENT] - Declarações: Nenhum registro encontrado para o associado.`);
                }
                
                // Documents
                const documentsCount = await db.documents.where('clientId').equals(clientId).count();
                if (documentsCount > 0) {
                    const deletedDocuments = await db.documents.where('clientId').equals(clientId).delete();
                    console.log(`[SERVICE.DELETE_CLIENT] - Documentos: ${deletedDocuments} de ${documentsCount} registros excluídos.`);
                } else {
                    console.log(`[SERVICE.DELETE_CLIENT] - Documentos: Nenhum registro encontrado para o associado.`);
                }

                // Attendances
                const attendancesCount = await db.attendances.where('clientId').equals(clientId).count();
                if (attendancesCount > 0) {
                    const deletedAttendances = await db.attendances.where('clientId').equals(clientId).delete();
                    console.log(`[SERVICE.DELETE_CLIENT] - Atendimentos: ${deletedAttendances} de ${attendancesCount} registros excluídos.`);
                } else {
                    console.log(`[SERVICE.DELETE_CLIENT] - Atendimentos: Nenhum registro encontrado para o associado.`);
                }

                // Client
                console.log(`[SERVICE.DELETE_CLIENT] - Excluindo o registro principal do associado...`);
                await db.clients.delete(clientId);
                console.log(`[SERVICE.DELETE_CLIENT] - Associado com ID: ${clientId} excluído com sucesso.`);
            });
            console.log(`[SERVICE.DELETE_CLIENT] Transação para o associado ID: ${clientId} concluída com sucesso.`);
        } catch (error) {
            console.error(`[SERVICE.DELETE_CLIENT] A transação de exclusão para o associado ID: ${clientId} falhou.`, error);
            throw new Error('Ocorreu um erro complexo ao tentar excluir o associado e seus dados relacionados. A operação foi cancelada para proteger a integridade dos dados.');
        }
    }

    async wipeTransactionalData(): Promise<void> {
        // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'transaction' method was not found.
        // FIX: Pass tables as an array to the transaction method to resolve "Expected 3-6 arguments, but got 7" error.
        await (db as Dexie).transaction('rw', [db.clients, db.payments, db.declarations, db.expenses, db.documents, db.attendances], async () => {
            await db.clients.clear();
            await db.payments.clear();
            await db.declarations.clear();
            await db.expenses.clear();
            await db.documents.clear();
            await db.attendances.clear();
        });
    }

    // --- Backup & Restore ---
    async backupDatabaseToFile(): Promise<void> {
        try {
            const sql = await window.initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });
            const newDb = new sql.Database();
            
            newDb.exec(`
                CREATE TABLE clients ( id INTEGER PRIMARY KEY, nomeCompleto TEXT, cpf TEXT UNIQUE, rg TEXT, endereco TEXT, telefone TEXT, email TEXT, dataFiliacao TEXT, status TEXT, foto TEXT, createdAt TEXT, updatedAt TEXT );
                CREATE TABLE payments ( id INTEGER PRIMARY KEY, clientId INTEGER, referencia TEXT, dataPagamento TEXT, valor REAL, createdAt TEXT, registeredBy TEXT );
                CREATE TABLE declarations ( id INTEGER PRIMARY KEY, clientId INTEGER, dataEmissao TEXT, createdAt TEXT );
                CREATE TABLE expenses ( id INTEGER PRIMARY KEY, description TEXT, category TEXT, amount REAL, date TEXT, createdAt TEXT );
                CREATE TABLE settings ( key TEXT PRIMARY KEY, value TEXT );
                CREATE TABLE users ( id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, createdAt TEXT );
                CREATE TABLE documents ( id INTEGER PRIMARY KEY, clientId INTEGER, name TEXT, type TEXT, content BLOB, createdAt TEXT );
                CREATE TABLE attendances ( id INTEGER PRIMARY KEY, clientId INTEGER, notes TEXT, createdAt TEXT, createdBy TEXT );
            `);

            // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'tables' property was not found.
            for (const table of (db as Dexie).tables) {
                const items = await table.toArray();
                if (items.length === 0) continue;

                const columns = Object.keys(items[0]);
                const placeholders = columns.map(() => '?').join(',');
                const stmt = newDb.prepare(`INSERT INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`);

                items.forEach((item: any) => {
                    const values = columns.map(col => {
                        let value = item[col];
                        if (value instanceof Date) return value.toISOString();
                        if (table.name === 'settings' && col === 'value') return JSON.stringify(value);
                        if (col === 'content' && value instanceof Uint8Array) return value;
                        return value;
                    });
                    stmt.run(values);
                });
                stmt.free();
            }

            const data = newDb.export();
            newDb.close();

            const blob = new Blob([data], { type: "application/x-sqlite3" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sindicato_backup_${new Date().toISOString().slice(0, 10)}.sqlite`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(e) {
            console.error("Backup failed", e);
            throw new Error("Ocorreu um erro ao gerar o backup do banco de dados.");
        }
    }
    
    async restoreDatabaseFromFile(file: File): Promise<void> {
        try {
            const sql = await window.initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });

            const buffer = await file.arrayBuffer();
            const tempDb = new sql.Database(new Uint8Array(buffer));

            // FIX: Cast `db` to `Dexie` to resolve TypeScript errors where inherited 'transaction' and 'tables' methods/properties were not found.
            await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
                // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'tables' property was not found.
                for (const table of (db as Dexie).tables) {
                    await table.clear();
                    
                    const res = tempDb.exec(`SELECT * FROM ${table.name}`);
                    if (!res || res.length === 0) continue;

                    const { columns, values } = res[0];
                    const items = values.map((row: any[]) => {
                        const item: { [key: string]: any } = {};
                        columns.forEach((col, i) => {
                            let value = row[i];
                             if (table.name === 'settings' && col === 'value') {
                                try { value = JSON.parse(value); } catch(e) { /* ignore */ }
                            }
                            item[col] = value;
                        });
                        return item;
                    });
                    if(items.length > 0) await table.bulkAdd(items);
                }
            });

            tempDb.close();
        } catch(e) {
            console.error("Restore failed", e);
            throw new Error("Ocorreu um erro ao restaurar o banco de dados. O arquivo pode estar corrompido ou ser de uma versão incompatível.");
        }
    }
}

export const sqliteService = new SqliteService();