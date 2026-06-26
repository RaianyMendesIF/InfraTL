import React from 'react';
import { Bell } from 'lucide-react';
import { getUsuarioLogado } from '../api';

export default function Header({ children }) {
  const usuario = getUsuarioLogado();
  const nome = usuario?.nome || 'Usuário';
  const tipo = usuario?.tipo === 'Admin' ? 'Funcionário' : 'Cidadão';

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 shrink-0">
      {/* Slot esquerdo (barra de busca, etc.) */}
      <div className="flex-1 mr-6">{children}</div>

      {/* Direita: sino + avatar */}
      <div className="flex items-center gap-5 shrink-0">
        <button className="relative text-slate-400 hover:text-slate-600 outline-none">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 leading-tight">{nome}</p>
            <p className="text-xs text-slate-400">{tipo}</p>
          </div>
          <div className="w-9 h-9 shrink-0 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">
            {nome.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}