import React, { useEffect } from 'react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  userRole: string;
}

const NavItem: React.FC<{
  page: Page;
  icon: string;
  label: string;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}> = ({ page, icon, label, currentPage, setCurrentPage }) => (
  <li
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:translate-x-1 ${
      currentPage === page
        ? 'bg-emerald-600 text-white shadow-lg'
        : 'text-gray-600 hover:bg-emerald-100 hover:text-emerald-800'
    }`}
    onClick={() => setCurrentPage(page)}
  >
    <i data-lucide={icon} className="w-5 h-5 mr-3 pointer-events-none"></i>
    <span className="font-medium pointer-events-none">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout, userRole }) => {
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [currentPage]);

  return (
    <div className="flex flex-col w-64 bg-white shadow-xl h-full p-4">
      <div className="flex items-center mb-8">
        <div className="bg-emerald-500 p-2 rounded-lg mr-3 shadow-md">
          <i data-lucide="leaf" className="w-8 h-8 text-white pointer-events-none"></i>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Sindicato Rural</h1>
      </div>
      <nav className="flex-1">
        <ul>
          <NavItem page="dashboard" icon="layout-dashboard" label="Dashboard" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="clients" icon="users" label="Associados" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="payments" icon="dollar-sign" label="Pagamentos" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="expenses" icon="trending-down" label="Despesas" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="declarations" icon="file-text" label="Declarações" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <NavItem page="reports" icon="bar-chart-3" label="Relatórios" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          {userRole === 'admin' && (
            <NavItem page="admin" icon="shield" label="Administração" currentPage={currentPage} setCurrentPage={setCurrentPage} />
          )}
        </ul>
      </nav>
      <div className="space-y-2">
        <button
          onClick={onLogout}
          className="flex items-center w-full p-3 my-1 rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:translate-x-1 text-gray-600 hover:bg-red-100 hover:text-red-800"
        >
          <i data-lucide="log-out" className="w-5 h-5 mr-3 pointer-events-none"></i>
          <span className="font-medium pointer-events-none">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;