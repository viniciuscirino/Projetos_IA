export interface Client {
  id?: number;
  nomeCompleto: string;
  cpf: string;
  rg: string;
  endereco: string;
  telefone: string;
  email: string;
  dataFiliacao: string; // YYYY-MM-DD
  status: 'Ativo' | 'Inativo' | 'Suspenso';
  foto?: string; // Base64 encoded image
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id?: number;
  clientId: number;
  referencia: string; // YYYY-MM
  dataPagamento: string; // YYYY-MM-DD
  valor: number;
  createdAt: Date;
  registeredBy?: string; // Nome do usuário que registrou o pagamento
}

export interface DeclarationLog {
  id?: number;
  clientId: number;
  dataEmissao: string; // YYYY-MM-DD
  createdAt: Date;
}

export interface Expense {
    id?: number;
    description: string;
    category: string;
    amount: number;
    date: string; // YYYY-MM-DD
    createdAt: Date;
}

export interface Document {
    id?: number;
    clientId: number;
    name: string;
    type: string;
    content: Uint8Array;
    createdAt: Date;
}

export interface Setting {
    key: string; // e.g., 'syndicateName', 'declarationTemplate'
    value: any;
}

export interface User {
    id?: number;
    username: string;
    password: string;
    role: 'admin' | 'user';
    createdAt: Date;
}

export interface Attendance {
    id?: number;
    clientId: number;
    notes: string;
    createdAt: string;
    createdBy: string;
}


export type Page = 'dashboard' | 'clients' | 'payments' | 'declarations' | 'reports' | 'expenses' | 'admin' | 'caixa' | 'mailing';

// FIX: Centralized ElectronAPI interface and global window type declarations.
export interface ElectronAPI {
    getAll: <T>(tableName: string) => Promise<T[]>;
    getById: <T>(tableName: string, id: number) => Promise<T | undefined>;
    getTableCount: (tableName: string) => Promise<number>;
    insert: (tableName: string, data: Record<string, any>) => Promise<number>;
    update: (tableName: string, id: number, data: Record<string, any>) => Promise<number>;
    delete: (tableName: string, id: number) => Promise<void>;

    getUserByUsername: (username: string) => Promise<User | undefined>;
    getSetting: (key: string) => Promise<any>;
    updateSetting: (key: string, value: any) => Promise<void>;

    getPaymentsByClientId: (clientId: number) => Promise<Payment[]>;
    getDocumentsByClientId: (clientId: number) => Promise<Document[]>;
    getAttendancesByClientId: (clientId: number) => Promise<Attendance[]>;

    deleteClientAndRelations: (clientId: number) => Promise<void>;
    wipeTransactionalData: () => Promise<void>;
    
    backupDatabase: () => Promise<{ success: boolean; message?: string }>;
    restoreDatabase: () => Promise<{ success: boolean; message?: string }>;
}

declare global {
    interface Window {
        lucide: any;
        electronAPI: ElectronAPI;
    }
}
