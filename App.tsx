import React, { useState, useCallback, useEffect } from 'react';
import type { Page } from './types';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Declarations from './pages/Declarations';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Admin from './pages/Admin';
import CashFlow from './pages/CashFlow';
import Mailing from './pages/Mailing';
import { sqliteService } from './services/sqliteService';
import { toastService, type ToastMessage } from './services/toastService';

// FIX: Declare window interface to include lucide
declare global {
    interface Window {
        lucide: any;
    }
}

const Toast: React.FC<{ toast: ToastMessage; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 5000); // 5 seconds

    const exitTimer = setTimeout(() => {
        onClose(toast.id);
    }, 5500); // 5s + 0.5s animation

    return () => {
      clearTimeout(timer);
      clearTimeout(exitTimer);
    };
  }, [toast.id, onClose]);

  useEffect(() => {
      if (window.lucide) {
          window.lucide.createIcons();
      }
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 500); // Wait for animation
  };

  const typeClasses = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/50',
      border: 'border-emerald-300 dark:border-emerald-600',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-800 dark:text-emerald-100',
      icon: 'check-circle-2',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/50',
      border: 'border-red-300 dark:border-red-600',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800 dark:text-red-100',
      icon: 'alert-circle',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/50',
      border: 'border-blue-300 dark:border-blue-600',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800 dark:text-blue-100',
      icon: 'info',
    },
  };

  const classes = typeClasses[toast.type];

  return (
    <div
      className={`relative w-full max-w-sm rounded-lg shadow-2xl p-4 border-l-4 overflow-hidden ${classes.bg} ${classes.border} ${isExiting ? 'toast-slide-out' : 'toast-slide-in'}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${classes.iconColor}`}>
          <i data-lucide={classes.icon} className="w-6 h-6"></i>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-bold ${classes.titleColor}`}>{toast.title}</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{toast.message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={handleClose} className="inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white">
            <span className="sr-only">Fechar</span>
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </div>
  );
};


const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((toast) => {
      setToasts((currentToasts) => [...currentToasts, toast]);
    });
    return () => unsubscribe();
  }, []);

  const handleClose = useCallback((id: number) => {
    setToasts((currentToasts) => currentToasts.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={handleClose} />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('isAuthenticated') === 'true');
  const [userRole, setUserRole] = useState<string | null>(() => sessionStorage.getItem('userRole'));
  const [username, setUsername] = useState<string | null>(() => sessionStorage.getItem('username'));
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  const handleLogin = useCallback((username: string, role: string) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);
    setUsername(username);
    setCurrentPage('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername(null);
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
        await sqliteService.backupDatabaseToFile();
        toastService.show('success', 'Backup Concluído', 'O arquivo de backup foi gerado para download.');
    } catch (error) {
        const message = error instanceof Error ? error.message : "Um erro desconhecido ocorreu.";
        toastService.show('error', 'Erro de Backup', message);
    }
  }, []);


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients username={username || 'sistema'}/>;
      case 'payments':
        return <Payments username={username || 'sistema'} />;
      case 'declarations':
        return <Declarations />;
      case 'reports':
        return <Reports />;
      case 'expenses':
        return <Expenses />;
      case 'caixa':
        return <CashFlow />;
      case 'mailing':
        return <Mailing />;
      case 'admin':
        return userRole === 'admin' ? <Admin /> : <Dashboard />; // Security check
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <ToastContainer />
      {!isAuthenticated ? (
         <Login onLogin={handleLogin} />
      ) : (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            onLogout={handleLogout}
            onSave={handleSave}
            userRole={userRole || ''}
            toggleTheme={toggleTheme}
            theme={theme}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                <div key={currentPage} className="fade-in">
                  {renderPage()}
                </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default App;