import React from 'react';

export default function SidePanel({ isLogin }) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-[#1e293b] text-white flex-col justify-center items-center p-10 relative">
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Placeholder para a Logo */}
        <div className="bg-white p-4 rounded-md mb-8">
          <h1 className="text-3xl font-bold text-green-600">
            <span className="text-blue-500">Infra</span>TL
          </h1>
        </div>
        
        {isLogin ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Plataforma de Gestao e Colaboracao Municipal</h2>
            <p className="text-slate-300">Sistema integrado de zeladoria urbana para gestao eficiente de ocorrencias e servicos municipais.</p>
            <div className="flex gap-2 mt-8">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Junte-se a plataforma</h2>
            <p className="text-slate-300 mb-8">Cadastre-se para colaborar com a gestao e zeladoria urbana do municipio de Tres Lagoas.</p>
            <ul className="text-left space-y-4">
              <li className="flex items-center gap-3"><span className="text-green-500">✔</span> Registre ocorrencias em tempo real</li>
              <li className="flex items-center gap-3"><span className="text-green-500">✔</span> Acompanhe ordens de servico</li>
              <li className="flex items-center gap-3"><span className="text-green-500">✔</span> Acesse relatorios e indicadores</li>
            </ul>
          </>
        )}
      </div>
      <div className="absolute bottom-8 text-sm text-slate-400">
        © 2026 InfraTL - Prefeitura de Tres Lagoas - MS
      </div>
    </div>
  );
}