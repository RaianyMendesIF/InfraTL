import React, { useState } from 'react';
import { Download, Printer, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

const dadosEvolucao = [
  { mes: 'Set', valor: 65 }, { mes: 'Out', valor: 85 }, { mes: 'Nov', valor: 75 },
  { mes: 'Dez', valor: 95 }, { mes: 'Jan', valor: 85 }, { mes: 'Fev', valor: 100 }, { mes: 'Mar', valor: 90 },
];

const dadosBairros = [
  { nome: 'Centro', valor: 245, pct: '100%' },
  { nome: 'Jardim', valor: 189, pct: '75%' },
  { nome: 'Vila Nova', valor: 156, pct: '60%' },
  { nome: 'Industrial', valor: 132, pct: '50%' },
  { nome: 'Parque Verde', valor: 118, pct: '45%' },
  { nome: 'São José', valor: 98, pct: '35%' },
  { nome: 'Colinos', valor: 78, pct: '25%' },
];

export default function Relatorios({ onLogout, onNavigate }) {
  const [periodoAtivo, setPeriodoAtivo] = useState('30d');

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} paginaAtiva="relatorios" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-auto p-8">
          {/* Título e controles */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
              <p className="text-slate-500 text-sm">Análise de dados e indicadores de desempenho da zeladoria urbana</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
                {['30d', '3m', '6m', '1a'].map((per) => (
                  <button key={per} onClick={() => setPeriodoAtivo(per)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors outline-none ${periodoAtivo === per ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {per}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Exportar PDF
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            {[
              { label: 'Total de Chamados', valor: '1.847', trend: '+12%', up: true, Icon: BarChart3, cor: 'blue' },
              { label: 'Taxa de Resolução', valor: '89.2%', trend: '+3.1%', up: true, Icon: TrendingUp, cor: 'green' },
              { label: 'Tempo Médio (dias)', valor: '3.5', trend: '-1.7d', up: false, Icon: TrendingDown, cor: 'blue' },
              { label: 'Satisfação', valor: '4.6/5', trend: '+0.3', up: true, Icon: TrendingUp, cor: 'yellow' },
            ].map(({ label, valor, trend, up, Icon, cor }) => {
              const corMap = { blue: 'bg-blue-50 text-blue-500', green: 'bg-green-50 text-green-500', yellow: 'bg-yellow-50 text-yellow-500' };
              return (
                <div key={label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <div className={`p-1.5 rounded-lg ${corMap[cor]}`}><Icon className="w-4 h-4" /></div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mb-1">{valor}</h3>
                  <p className={`text-xs font-medium flex items-center gap-1 ${up ? 'text-green-600' : 'text-green-600'}`}>
                    {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {trend} <span className="text-slate-400 font-normal">vs. anterior</span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Gráfico de barras + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Barras */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Chamados vs Concluídos</h3>
                <p className="text-sm text-slate-500">Evolução mensal</p>
              </div>
              <div className="flex-1 relative flex items-end justify-between pt-10 pb-8 border-b border-slate-100">
                <div className="absolute inset-0 flex flex-col justify-between pb-8">
                  {[220, 165, 110, 55, 0].map((val, i) => (
                    <div key={i} className="flex items-center w-full">
                      <span className="text-[10px] font-medium text-slate-400 w-8">{val}</span>
                      <div className="flex-1 border-b border-dashed border-slate-200" />
                    </div>
                  ))}
                </div>
                <div className="relative z-10 flex w-full justify-around pl-10 pr-4 h-[200px] items-end">
                  {dadosEvolucao.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="w-10 bg-green-500 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: `${item.valor * 1.8}px` }} />
                      <span className="text-[10px] font-medium text-slate-500">{item.mes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Por Categoria</h3>
                <p className="text-sm text-slate-500">Distribuição de ocorrências</p>
              </div>
              <div className="flex-1 flex justify-center items-center py-4">
                <svg width="160" height="160" viewBox="0 0 42 42" className="transform -rotate-90">
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="28 72" strokeDashoffset="0" />
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#eab308" strokeWidth="6" strokeDasharray="22 78" strokeDashoffset="-28" />
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#22c55e" strokeWidth="6" strokeDasharray="17 83" strokeDashoffset="-50" />
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="14 86" strokeDashoffset="-67" />
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#ef4444" strokeWidth="6" strokeDasharray="11 89" strokeDashoffset="-81" />
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#94a3b8" strokeWidth="6" strokeDasharray="8 92" strokeDashoffset="-92" />
                  <circle cx="21" cy="21" r="12" fill="white" />
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] font-medium text-slate-600">
                {[
                  { cor: 'bg-blue-500', nome: 'Buraco na Via', n: 320 },
                  { cor: 'bg-yellow-500', nome: 'Iluminação', n: 245 },
                  { cor: 'bg-green-500', nome: 'Coleta de Lixo', n: 190 },
                  { cor: 'bg-purple-500', nome: 'Poda', n: 155 },
                  { cor: 'bg-red-500', nome: 'Sinalização', n: 120 },
                  { cor: 'bg-slate-400', nome: 'Outros', n: 95 },
                ].map(({ cor, nome, n }) => (
                  <div key={nome} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${cor}`} />{nome}</div>
                    <span className="font-bold text-slate-800">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Linha/Área + Ranking bairros */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            {/* Área chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Tempo Médio de Resolução</h3>
                <p className="text-sm text-slate-500">Em dias úteis por mês</p>
              </div>
              <div className="flex-1 relative pt-4 pb-8 pl-6 pr-2 min-h-[180px]">
                <div className="absolute inset-0 flex flex-col justify-between pb-8">
                  {[7, 5, 3, 0].map((val, i) => (
                    <div key={i} className="flex items-center w-full">
                      <span className="text-[10px] text-slate-400 w-6">{val}</span>
                      <div className="flex-1 border-b border-dashed border-slate-100" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 ml-6 pb-8">
                  <svg viewBox="0 0 500 150" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="blueGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 40 C 100 50, 200 65, 250 45 S 350 80, 500 90 L 500 150 L 0 150 Z" fill="url(#blueGrad)" />
                    <path d="M 0 40 C 100 50, 200 65, 250 45 S 350 80, 500 90" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-6 right-0 flex justify-between text-[10px] font-medium text-slate-400 px-1">
                  {['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'].map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>

            {/* Ranking bairros */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Ranking por Bairro</h3>
                <p className="text-sm text-slate-500">Bairros com mais ocorrências</p>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                {dadosBairros.map((bairro, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-700">{idx + 1}. {bairro.nome}</span>
                      <span className="font-bold text-slate-800">{bairro.valor}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: bairro.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}