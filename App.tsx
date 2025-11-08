import React, { useState, useCallback } from 'react';
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

// FIX: Declare window interface to include lucide
declare global {
    interface Window {
        lucide: any;
    }
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => sessionStorage.getItem('isAuthenticated') === 'true');
  const [userRole, setUserRole] = useState<string | null>(() => sessionStorage.getItem('userRole'));
  const [username, setUsername] = useState<string | null>(() => sessionStorage.getItem('username'));
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'payments':
        return <Payments username={username || 'sistema'} />;
      case 'declarations':
        return <Declarations />;
      case 'reports':
        return <Reports />;
      case 'expenses':
        return <Expenses />;
      case 'admin':
        return userRole === 'admin' ? <Admin /> : <Dashboard />; // Security check
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        onLogout={handleLogout}
        userRole={userRole || ''}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div key={currentPage} className="fade-in">
              {renderPage()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;