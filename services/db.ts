import Dexie, { type Table } from 'dexie';
import type { Client, Payment, DeclarationLog, Expense, Document, Setting, User } from '../types';

export class SindicatoDB extends Dexie {
  clients!: Table<Client>;
  payments!: Table<Payment>;
  declarations!: Table<DeclarationLog>;
  expenses!: Table<Expense>;
  documents!: Table<Document>;
  settings!: Table<Setting>;
  users!: Table<User>;

  constructor() {
    super('sindicatoDB');
    // FIX: Cast 'this' to Dexie to resolve a TypeScript error where the inherited 'version' method was not found on the SindicatoDB subclass.
    (this as Dexie).version(1).stores({
      clients: '++id, nomeCompleto, cpf, rg',
      payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia]',
      declarations: '++id, clientId, dataEmissao',
    });

    // Version 2: Add 'createdAt' index to declarations table for sorting.
    (this as Dexie).version(2).stores({
        declarations: '++id, clientId, dataEmissao, createdAt',
    });

    // Version 3: Add expenses, documents, settings tables and update clients table.
    (this as Dexie).version(3).stores({
        clients: '++id, nomeCompleto, cpf, rg, status',
        expenses: '++id, date, category',
        documents: '++id, clientId, name',
        settings: '&key', // Primary key is 'key', which must be unique
    }).upgrade(tx => {
        // This upgrade function is needed to provide a default status for existing clients.
        return tx.table('clients').toCollection().modify(client => {
            if (typeof client.status === 'undefined') {
                client.status = 'Ativo';
            }
        });
    });

    // Version 4: Add 'users' table for user management.
    (this as Dexie).version(4).stores({
        users: '++id, &username',
    }).upgrade(async (tx) => {
        const defaultUsers = [
            { username: 'admin', password: 'admin', role: 'admin', createdAt: new Date() },
            { username: 'vinicius', password: 'user', role: 'user', createdAt: new Date() },
        ];
        await tx.table('users').bulkAdd(defaultUsers);
    });

    // Version 5: Add 'registeredBy' to payments table.
    (this as Dexie).version(5).stores({
        payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia], registeredBy',
    });

    // Version 6: Update payments table to use 'referencia' (YYYY-MM) instead of mes/anoReferencia.
    (this as Dexie).version(6).stores({
        payments: '++id, clientId, referencia, dataPagamento, &[clientId+referencia], registeredBy',
    }).upgrade(tx => {
        return tx.table('payments').toCollection().modify((payment: any) => {
            if (payment.anoReferencia && payment.mesReferencia) {
                payment.referencia = `${payment.anoReferencia}-${String(payment.mesReferencia).padStart(2, '0')}`;
                delete payment.anoReferencia;
                delete payment.mesReferencia;
            }
        });
    });

    // The 'populate' event is only triggered when the database is created for the first time.
    // FIX: Cast 'this' to Dexie to resolve a TypeScript error where the inherited 'on' method was not found on the SindicatoDB subclass.
    (this as Dexie).on('populate', this.populateDatabase);
  }

  populateDatabase = async () => {
    try {
        const initialClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'status'>[] = [];
        
        await this.clients.bulkAdd(initialClients.map(c => ({...c, status: 'Ativo', createdAt: new Date(), updatedAt: new Date() })));

        // Add default settings
        const defaultSettings: Setting[] = [
            { key: 'syndicateName', value: 'SINDICATO DOS TRABALHADORES RURAIS DE INDIAROBA' },
            { key: 'syndicateCnpj', value: '00.000.000/0001-00' },
            { key: 'syndicateAddress', value: 'Rua da Sede, nº 123, Centro, Indiaroba/SE, CEP 49250-000' },
            { key: 'syndicatePhone', value: '(79) 99999-9999' },
            { key: 'declarationTemplate', value: `Declaramos, para os devidos fins a que se fizerem necessários, que o(a) Sr(a). {{NOME_ASSOCIADO}}, inscrito(a) no Cadastro de Pessoas Físicas (CPF) sob o nº {{CPF}} e portador(a) da Cédula de Identidade (RG) nº {{RG}}, é membro(a) associado(a) desta entidade sindical, filiado(a) desde {{DATA_FILIACAO}}.\n\nNada consta que desabone sua condição de associado(a) até a presente data.\n\nPor ser expressão da verdade, firmamos a presente declaração.` },
            { key: 'syndicateSignature', value: '' } // Base64 encoded signature image
        ];
        await this.settings.bulkAdd(defaultSettings);
        
        // Add default users
        const defaultUsers: Omit<User, 'id'>[] = [
            { username: 'admin', password: 'admin', role: 'admin', createdAt: new Date() },
            { username: 'vinicius', password: 'user', role: 'user', createdAt: new Date() },
        ];
        await this.users.bulkAdd(defaultUsers);

    } catch (error) {
        // Log any errors during population to the console for debugging.
        console.error("Failed to populate database:", error);
    }
  }
}

export const db = new SindicatoDB();

// FIX: Catch potential errors during database initialization.
// An unhandled rejection here would cause a generic "Uncaught [object Object]" error.
// FIX: Cast `db` to `Dexie` to resolve a TypeScript error where the inherited `open` method was not found on the `SindicatoDB` subclass.
(db as Dexie).open().catch((err) => {
    console.error('Failed to open db: ', err.stack || err);
});