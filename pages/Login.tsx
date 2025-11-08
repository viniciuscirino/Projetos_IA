import React, { useState, useEffect } from 'react';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (username: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const user = await db.users.where('username').equals(username).first();
        if (user && user.password === password) {
          setError('');
          onLogin(user.username, user.role);
        } else {
          setError('Usuário ou senha inválidos.');
        }
    } catch (err) {
        console.error("Login failed:", err);
        setError('Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-2xl fade-in">
        <div className="text-center">
            <div className="flex items-center justify-center mb-4">
                <div className="bg-emerald-500 p-3 rounded-full shadow-lg">
                    <i data-lucide="leaf" className="w-10 h-10 text-white"></i>
                </div>
            </div>
          <h2 className="text-2xl font-bold text-gray-900">Sindicato Rural de Indiaroba</h2>
          <p className="mt-2 text-sm text-gray-600">Acesse o sistema de gestão</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="relative">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm transition"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-3 py-3 border-t-0 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm transition"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
            <div className="text-center text-xs text-gray-500">
                <p>Usuários Padrão: admin/admin | vinicius/user</p>
            </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
