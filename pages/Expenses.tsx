import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { sqliteService } from '../services/sqliteService';
import { toastService } from '../services/toastService';
import type { Expense } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

const ExpenseForm: React.FC<{ onSave: () => void }> = ({ onSave }) => {
    const today = new Date().toISOString().split('T')[0];
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(today);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !category || amount === '') return;
        
        try {
            await sqliteService.insert('expenses', {
                description,
                category,
                amount: Number(amount),
                date,
                createdAt: new Date().toISOString()
            });
            toastService.show('success', 'Sucesso!', 'Despesa registrada com sucesso.');
            // Reset form
            setDescription('');
            setCategory('');
            setAmount('');
            setDate(today);
            onSave();
        } catch(error) {
            console.error("Failed to save expense:", error);
            toastService.show('error', 'Erro!', 'Ocorreu um erro ao salvar a despesa.');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-lg space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Registrar Nova Despesa</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} required className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required min="0.01" step="0.01" className="p-2 border rounded w-full mt-1 focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 h-10 shadow-md hover:shadow-lg transition-all transform hover:scale-105">Registrar</button>
            </div>
        </form>
    );
};


const Expenses: React.FC = () => {
    const [filter, setFilter] = useState('');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

    const fetchExpenses = useCallback(async () => {
        const expenseData = await sqliteService.getAll<Expense>('expenses');
        const sortedExpenses = expenseData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExpenses(sortedExpenses);
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);


    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        if (!filter) return expenses;
        return expenses.filter(e => 
            e.description.toLowerCase().includes(filter.toLowerCase()) ||
            e.category.toLowerCase().includes(filter.toLowerCase())
        );
    }, [expenses, filter]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [filteredExpenses, expenseToDelete]);

    const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await sqliteService.delete('expenses', expenseToDelete.id!);
            toastService.show('success', 'Sucesso!', 'Despesa excluída com sucesso.');
            fetchExpenses(); // Refresh the list
        } catch (error) {
            toastService.show('error', 'Erro!', 'Falha ao excluir a despesa.');
        } finally {
            setExpenseToDelete(null);
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Despesas</h1>
            
            <ExpenseForm onSave={fetchExpenses} />

            <div className="mt-8 bg-white rounded-lg shadow-lg">
                 <div className="p-4">
                    <input
                        type="text"
                        placeholder="Buscar por descrição ou categoria..."
                        className="p-2 border rounded w-full max-w-sm shadow-sm focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                             <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Descrição</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Categoria</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Valor</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Data</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {filteredExpenses?.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="p-3">{e.description}</td>
                                    <td className="p-3">{e.category}</td>
                                    <td className="p-3">R$ {e.amount.toFixed(2)}</td>
                                    <td className="p-3">{new Date(e.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td className="p-3">
                                        <button onClick={() => setExpenseToDelete(e)} className="text-red-500 hover:text-red-700 p-1 transition-transform transform hover:scale-125" title="Excluir"><i data-lucide="trash-2" className="w-4 h-4 pointer-events-none"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmationModal
                show={!!expenseToDelete}
                title="Confirmar Exclusão de Despesa"
                message={
                    <>
                        <p>Tem certeza que deseja excluir a despesa:</p>
                        <p className="font-semibold my-2 bg-gray-100 p-2 rounded">{expenseToDelete?.description}</p>
                    </>
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setExpenseToDelete(null)}
                confirmText="Sim, Excluir"
            />
        </div>
    );
};

export default Expenses;