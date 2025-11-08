import Dexie from 'dexie';
import { db } from './db';

// FIX: Declare the `initSqlJs` function on the global window object to resolve a TypeScript error.
// This function is loaded from the sql.js library via a script tag and is not known to TypeScript by default.
declare global {
    interface Window {
        initSqlJs: (config?: any) => Promise<any>;
    }
}

// Type definition for sql.js database instance
type SQLiteDB = any; 

class SqliteSyncService {
    private sql: any = null;
    private db: SQLiteDB = null;

    async initSqlJs() {
        try {
            this.sql = await window.initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });
        } catch (error) {
            console.error("Failed to initialize sql.js:", error);
            alert("Não foi possível carregar o componente de banco de dados. Verifique sua conexão com a internet e tente recarregar a página.");
        }
    }

    async createNewDatabase() {
        if (!this.sql) await this.initSqlJs();
        this.db = new this.sql.Database();
        
        console.log("Creating new SQLite database schema...");
        this.db.exec(`
            CREATE TABLE clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nomeCompleto TEXT,
                cpf TEXT UNIQUE,
                rg TEXT,
                endereco TEXT,
                telefone TEXT,
                email TEXT,
                dataFiliacao TEXT,
                status TEXT,
                foto TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clientId INTEGER,
                referencia TEXT,
                dataPagamento TEXT,
                valor REAL,
                createdAt TEXT,
                registeredBy TEXT
            );
            CREATE TABLE declarations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clientId INTEGER,
                dataEmissao TEXT,
                createdAt TEXT
            );
            CREATE TABLE expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT,
                category TEXT,
                amount REAL,
                date TEXT,
                createdAt TEXT
            );
            CREATE TABLE settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT,
                createdAt TEXT
            );
        `);

        console.log("Populating new database with default data...");
        this.populateWithDefaultData();

        await this.syncSqliteToDexie();
        this.handleSave(true); // Trigger initial save for the new file
    }

    async loadDatabase(file: File) {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const Uints = new Uint8Array(event.target?.result as ArrayBuffer);
                    if (!this.sql) await this.initSqlJs();
                    this.db = new this.sql.Database(Uints);
                    await this.syncSqliteToDexie();
                    resolve();
                } catch (e) {
                    console.error("Error loading database:", e);
                    alert("Erro ao carregar o arquivo de banco de dados. O arquivo pode estar corrompido ou em um formato inválido.");
                    reject(e);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    private populateWithDefaultData() {
        const defaultUsers = [
            { username: 'admin', password: 'admin', role: 'admin' },
            { username: 'vinicius', password: 'user', role: 'user' },
        ];
        const now = new Date().toISOString();
        const userStmt = this.db.prepare("INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)");
        defaultUsers.forEach(u => userStmt.run([u.username, u.password, u.role, now]));
        userStmt.free();
        
        const defaultSettings = [
            { key: 'syndicateName', value: 'SINDICATO DOS TRABALHADORES RURAIS DE INDIAROBA' },
            { key: 'syndicateCnpj', value: '00.000.000/0001-00' },
            { key: 'syndicateAddress', value: 'Rua da Sede, nº 123, Centro, Indiaroba/SE, CEP 49250-000' },
            { key: 'syndicatePhone', value: '(79) 99999-9999' },
            { key: 'declarationTemplate', value: `Declaramos, para os devidos fins a que se fizerem necessários, que o(a) Sr(a). {{NOME_ASSOCIADO}}, inscrito(a) no Cadastro de Pessoas Físicas (CPF) sob o nº {{CPF}} e portador(a) da Cédula de Identidade (RG) nº {{RG}}, é membro(a) associado(a) desta entidade sindical, filiado(a) desde {{DATA_FILIACAO}}.\n\nNada consta que desabone sua condição de associado(a) até a presente data.\n\nPor ser expressão da verdade, firmamos a presente declaração.` },
            { key: 'syndicateSignature', value: '' }
        ];
        const settingsStmt = this.db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
        defaultSettings.forEach(s => settingsStmt.run([s.key, JSON.stringify(s.value)]));
        settingsStmt.free();
    }

    private async syncSqliteToDexie() {
        console.log("Syncing SQLite to Dexie...");
        if (!this.db) {
            console.error("SQLite DB not loaded.");
            return;
        }

        // FIX: Cast `db` to `Dexie` to resolve TypeScript errors where inherited methods/properties like 'transaction' and 'tables' were not found on the `SindicatoDB` subclass.
        await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
            // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'tables' property was not found on the `SindicatoDB` subclass.
            for (const table of (db as Dexie).tables) {
                if (table.name === 'documents') continue; // Skip documents table
                
                await table.clear();
                
                const res = this.db.exec(`SELECT * FROM ${table.name}`);
                if (res.length === 0) continue;

                const { columns, values } = res[0];
                const items = values.map((row: any[]) => {
                    const item: { [key: string]: any } = {};
                    columns.forEach((col, i) => {
                        let value = row[i];
                        // Attempt to parse JSON for settings value
                        if (table.name === 'settings' && col === 'value') {
                            try { value = JSON.parse(value); } catch(e) { /* ignore */ }
                        }
                        // Convert ISO strings back to Date objects
                        if (typeof value === 'string' && (col === 'createdAt' || col === 'updatedAt')) {
                           value = new Date(value);
                        }
                        item[col] = value;
                    });
                    return item;
                });
                await table.bulkAdd(items);
            }
        });
        console.log("Sync complete.");
    }
    
    private async syncDexieToSqlite() {
        console.log("Syncing Dexie to SQLite...");
        if (!this.db) {
            console.error("SQLite DB not loaded.");
            return;
        }

        // FIX: Cast `db` to `Dexie` to resolve TypeScript error where the inherited 'tables' property was not found on the `SindicatoDB` subclass.
        for (const table of (db as Dexie).tables) {
            if (table.name === 'documents') continue;

            this.db.exec(`DELETE FROM ${table.name}`);
            const items = await table.toArray();
            if (items.length === 0) continue;

            const columns = Object.keys(items[0]);
            const placeholders = columns.map(() => '?').join(',');
            const stmt = this.db.prepare(`INSERT INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`);

            items.forEach(item => {
                const values = columns.map(col => {
                    let value = item[col as keyof typeof item];
                    if (value instanceof Date) return value.toISOString();
                    if (table.name === 'settings' && col === 'value') return JSON.stringify(value);
                    return value;
                });
                stmt.run(values);
            });
            stmt.free();
        }
        console.log("Dexie to SQLite sync complete.");
    }

    handleSave = async (isNewFile: boolean = false) => {
        if (!this.db) {
            alert("Nenhum banco de dados carregado para salvar.");
            return;
        }
        try {
            await this.syncDexieToSqlite();
            const data = this.db.export();
            const blob = new Blob([data], { type: "application/x-sqlite3" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "sindicato.sqlite";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            if (isNewFile) {
                 alert("Seu novo banco de dados foi criado. Salve o arquivo 'sindicato.sqlite' em uma pasta segura em seu computador. Você usará este arquivo para abrir o sistema futuramente.");
            } else {
                alert("Alterações prontas para salvar. Por favor, salve o arquivo, substituindo o seu arquivo 'sindicato.sqlite' anterior para manter seus dados atualizados.");
            }

        } catch(e) {
            console.error("Save failed", e);
            alert("Ocorreu um erro ao salvar o banco de dados.");
        }
    }
}

export const sqliteSyncService = new SqliteSyncService();