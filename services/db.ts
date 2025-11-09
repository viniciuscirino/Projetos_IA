

import Dexie, { type Table } from 'dexie';
import type { Client, Payment, DeclarationLog, Expense, Document, Setting, User, Attendance } from '../types';

export class SindicatoDB extends Dexie {
  clients!: Table<Client>;
  payments!: Table<Payment>;
  declarations!: Table<DeclarationLog>;
  expenses!: Table<Expense>;
  documents!: Table<Document>;
  settings!: Table<Setting>;
  users!: Table<User>;
  attendances!: Table<Attendance>;

  constructor() {
    super('sindicatoDB');

    // Handle cases where another tab is blocking the database upgrade.
    // FIX: Cast 'this' to Dexie to resolve a TypeScript error where the inherited 'on' method was not found.
    (this as Dexie).on("blocked", () => {
        console.warn("Database open is blocked. A newer version may be trying to open while an older version is still running in another tab.");
        alert(
            "O sistema precisa ser atualizado, mas outra aba está impedindo.\n\nPor favor, feche todas as abas deste site e tente novamente."
        );
    });

    // FIX: Cast 'this' to Dexie to resolve a TypeScript error where the inherited 'version' method was not found on the SindicatoDB subclass.
    // The versioning has been corrected to be cumulative. Each version now declares the full schema
    // up to that point, preventing tables from being accidentally dropped during an upgrade.

    // Version 1: Initial schema
    (this as Dexie).version(1).stores({
      clients: '++id, nomeCompleto, cpf, rg',
      payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia]',
      declarations: '++id, clientId, dataEmissao',
    });

    // Version 2: Add 'createdAt' index to declarations table for sorting.
    (this as Dexie).version(2).stores({
        clients: '++id, nomeCompleto, cpf, rg', // from v1
        payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia]', // from v1
        declarations: '++id, clientId, dataEmissao, createdAt', // updated
    });

    // Version 3: Add expenses, documents, settings tables and update clients table.
    (this as Dexie).version(3).stores({
        clients: '++id, nomeCompleto, cpf, rg, status', // updated
        payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia]', // from v1
        declarations: '++id, clientId, dataEmissao, createdAt', // from v2
        expenses: '++id, date, category', // new
        documents: '++id, clientId, name', // new
        settings: '&key', // new
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
        clients: '++id, nomeCompleto, cpf, rg, status', // from v3
        payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia]', // from v3
        declarations: '++id, clientId, dataEmissao, createdAt', // from v3
        expenses: '++id, date, category', // from v3
        documents: '++id, clientId, name', // from v3
        settings: '&key', // from v3
        users: '++id, &username', // new
    }).upgrade(async (tx) => {
        // Only add default users if the table is empty to prevent constraint errors
        // on fresh installs where the populate event also adds these users.
        const userCount = await tx.table('users').count();
        if (userCount === 0) {
            const defaultUsers = [
                { username: 'admin', password: 'admin', role: 'admin', createdAt: new Date() },
                { username: 'vinicius', password: 'user', role: 'user', createdAt: new Date() },
            ];
            await tx.table('users').bulkAdd(defaultUsers);
        }
    });

    // Version 5: Add 'registeredBy' to payments table.
    (this as Dexie).version(5).stores({
        clients: '++id, nomeCompleto, cpf, rg, status', // from v4
        payments: '++id, clientId, mesReferencia, anoReferencia, dataPagamento, &[clientId+mesReferencia+anoReferencia], registeredBy', // updated
        declarations: '++id, clientId, dataEmissao, createdAt', // from v4
        expenses: '++id, date, category', // from v4
        documents: '++id, clientId, name', // from v4
        settings: '&key', // from v4
        users: '++id, &username', // from v4
    });

    // Version 6: Update payments table to use 'referencia' (YYYY-MM) instead of mes/anoReferencia.
    (this as Dexie).version(6).stores({
        clients: '++id, nomeCompleto, cpf, rg, status', // from v5
        payments: '++id, clientId, referencia, dataPagamento, &[clientId+referencia], registeredBy', // updated
        declarations: '++id, clientId, dataEmissao, createdAt', // from v5
        expenses: '++id, date, category', // from v5
        documents: '++id, clientId, name', // from v5
        settings: '&key', // from v5
        users: '++id, &username', // from v5
    }).upgrade(tx => {
        return tx.table('payments').toCollection().modify((payment: any) => {
            if (payment.anoReferencia && payment.mesReferencia) {
                payment.referencia = `${payment.anoReferencia}-${String(payment.mesReferencia).padStart(2, '0')}`;
                delete payment.anoReferencia;
                delete payment.mesReferencia;
            }
        });
    });
    
    // Version 7: Add 'attendances' table for logging client interactions.
    (this as Dexie).version(7).stores({
        clients: '++id, nomeCompleto, cpf, rg, status', // from v6
        payments: '++id, clientId, referencia, dataPagamento, &[clientId+referencia], registeredBy', // from v6
        declarations: '++id, clientId, dataEmissao, createdAt', // from v6
        expenses: '++id, date, category', // from v6
        documents: '++id, clientId, name', // from v6
        settings: '&key', // from v6
        users: '++id, &username', // from v6
        attendances: '++id, clientId, createdAt' // new
    });

    // Version 8: Add payment declaration template and convert existing template to HTML
    (this as Dexie).version(8).stores({
        clients: '++id, nomeCompleto, cpf, rg, status', // from v7
        payments: '++id, clientId, referencia, dataPagamento, &[clientId+referencia], registeredBy', // from v7
        declarations: '++id, clientId, dataEmissao, createdAt', // from v7
        expenses: '++id, date, category', // from v7
        documents: '++id, clientId, name', // from v7
        settings: '&key', // from v7
        users: '++id, &username', // from v7
        attendances: '++id, clientId, createdAt', // from v7
    }).upgrade(async (tx) => {
        // Add payment declaration template if it doesn't exist
        const paymentTemplateExists = await tx.table('settings').get('paymentDeclarationTemplate');
        if (!paymentTemplateExists) {
            await tx.table('settings').add({
                key: 'paymentDeclarationTemplate',
                value: `<p>Declaramos, para os devidos fins, que o(a) Sr(a). {{NOME_ASSOCIADO}}, inscrito(a) no CPF sob o nº {{CPF}}, associado(a) desta entidade, encontra-se em dia com suas obrigações financeiras, tendo o último pagamento registrado referente à competência de <b>{{MES_ULTIMO_PAGAMENTO}} de {{ANO_ULTIMO_PAGAMENTO}}</b>.</p><p>Por ser expressão da verdade, firmamos a presente declaração.</p>`
            });
        }

        // Update existing association declaration to use HTML
        const associationTemplate = await tx.table('settings').get('declarationTemplate');
        if (associationTemplate && typeof associationTemplate.value === 'string' && !associationTemplate.value.startsWith('<p>')) {
            const oldValue = associationTemplate.value;
            const newValue = oldValue.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            await tx.table('settings').update('declarationTemplate', { value: newValue });
        }
    });

    // The 'populate' event is only triggered when the database is created for the first time.
    // FIX: Cast 'this' to Dexie to resolve a TypeScript error where the inherited 'on' method was not found.
    (this as Dexie).on('populate', this.populateDatabase);
  }

  populateDatabase = async (tx: Dexie.Transaction) => {
    try {
        const initialClients: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'status'>[] = [];
        
        await tx.table('clients').bulkAdd(initialClients.map(c => ({...c, status: 'Ativo', createdAt: new Date(), updatedAt: new Date() })));

        // Add default settings
        const defaultSettings: Setting[] = [
            { key: 'syndicateName', value: 'SINDICATO DOS TRABALHADORES RURAIS DE INDIAROBA' },
            { key: 'syndicateCnpj', value: '00.000.000/0001-00' },
            { key: 'syndicateAddress', value: 'Rua da Sede, nº 123, Centro, Indiaroba/SE, CEP 49250-000' },
            { key: 'syndicatePhone', value: '(79) 99999-9999' },
            { key: 'declarationTemplate', value: `<p>Declaramos, para os devidos fins, que o(a) Sr(a). {{NOME_ASSOCIADO}}, portador(a) do RG nº {{RG}} e inscrito(a) no CPF sob o nº {{CPF}}, encontra-se regularmente filiado(a) a esta entidade sindical, na qualidade de membro associado(a) desde {{DATA_FILIACAO}}.</p><p>Declaramos ainda que, até a presente data, não constam em nossos registros quaisquer fatos que desabonem sua condição de associado(a).</p><p>Por ser expressão da verdade, firmamos a presente declaração.</p>` },
            { key: 'paymentDeclarationTemplate', value: `<p>Declaramos, para os devidos fins, que o(a) Sr(a). {{NOME_ASSOCIADO}}, inscrito(a) no CPF sob o nº {{CPF}}, associado(a) desta entidade, encontra-se em dia com suas obrigações financeiras, tendo o último pagamento registrado referente à competência de <b>{{MES_ULTIMO_PAGAMENTO}} de {{ANO_ULTIMO_PAGAMENTO}}</b>.</p><p>Por ser expressão da verdade, firmamos a presente declaração.</p>` },
            { key: 'syndicateSignature', value: '' } // Base64 encoded signature image
        ];
        await tx.table('settings').bulkAdd(defaultSettings);
        
        // Add default users only if the table is empty to prevent race condition with v4 upgrade
        const userCount = await tx.table('users').count();
        if (userCount === 0) {
            const defaultUsers: Omit<User, 'id'>[] = [
                { username: 'admin', password: 'admin', role: 'admin', createdAt: new Date() },
                { username: 'vinicius', password: 'user', role: 'user', createdAt: new Date() },
            ];
            await tx.table('users').bulkAdd(defaultUsers);
        }

    } catch (error) {
        // Log any errors during population to the console for debugging.
        console.error("Failed to populate database:", error);
    }
  }
}

export const db = new SindicatoDB();