import React from 'react';
import {
  LayoutDashboard, AlertTriangle, ClipboardList,
  BarChart3, Settings, LogOut,
} from 'lucide-react';
import { isFuncionario } from '../api';

export default function Sidebar({ onNavigate, onLogout, paginaAtiva }) {
  const funcionario = isFuncionario();

  const itemBase =
    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left outline-none focus:outline-none text-sm font-medium';
  const itemAtivo = 'bg-blue-600 text-white';
  const itemInativo = 'text-slate-300 hover:bg-slate-700/60';

  const Item = ({ pagina, icon: Icon, label }) => (
    <button
      onClick={() => onNavigate(pagina)}
      className={`${itemBase} ${paginaAtiva === pagina ? itemAtivo : itemInativo}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {label}
    </button>
  );

  return (
    <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white p-1.5 rounded-md">
          <BarChart3 className="text-green-500 w-5 h-5" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">InfraTL</h1>
          <p className="text-xs text-slate-400">Zeladoria Urbana</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 mt-2">
        <Item pagina="dashboard" icon={LayoutDashboard} label="Visão Geral" />
        <Item pagina="ocorrencias" icon={AlertTriangle} label="Ocorrências" />

        {/* Itens exclusivos para funcionários */}
        {funcionario && (
          <>
            <Item pagina="ordens" icon={ClipboardList} label="Ordens de Serviço" />
            <Item pagina="relatorios" icon={BarChart3} label="Relatórios" />
          </>
        )}

        <Item pagina="configuracoes" icon={Settings} label="Configurações" />
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2 w-full text-left text-slate-400 hover:text-white transition-colors text-sm outline-none focus:outline-none"
        >
          <LogOut className="w-5 h-5" /> Sair
        </button>
      </div>
    </aside>
  );
}