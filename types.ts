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
    content: Blob;
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


export type Page = 'dashboard' | 'clients' | 'payments' | 'declarations' | 'reports' | 'expenses' | 'admin';