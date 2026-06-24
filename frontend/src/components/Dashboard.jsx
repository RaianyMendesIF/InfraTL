import React, { useState, useEffect } from 'react';
import { Search, FileText, AlertTriangle, Clock, CheckCircle2, ClipboardList, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { API, isFuncionario } from '../api';

const STATUS_ESTILO = {
  Pendente: 'bg-yellow-100 text-yellow-700',
  Em_Analise: 'bg-orange-100 text-orange-700',
  Em_Execucao: 'bg-blue-100 text-blue-700',
  Finalizado: 'bg-green-100 text-green-700',
  Arquivado: 'bg-red-100 text-red-700',
};

export default function Dashboard({ onLogout, onNavigate }) {
  const funcionario = isFuncionario();

  // Indicadores (só funcionário busca da API de dashboard)
  const [indicadores, setIndicadores] = useState(null);
  // Ocorrências recentes
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        if (funcionario) {
          // Busca indicadores do dashboard real
          const resInd = await API.indicadoresDashboard();
          if (resInd.ok) {
            const data = await resInd.json();
            setIndicadores(data.indicadores);
          }
        }

        // Todos buscam suas ocorrências (cidadão → suas; funcionário → todas)
        const resOc = await API.listarOcorrencias();
        if (resOc.ok) {
          const data = await resOc.json();
          const lista = Array.isArray(data) ? data : (data.ocorrencias || []);
          setOcorrencias(lista.slice(0, 10)); // mostra até 10 recentes
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  // Cards de estatísticas — usa indicadores da API se funcionário, senão calcula local
  const stats = funcionario && indicadores
    ? [
        { label: 'Total de Chamados', valor: indicadores.total_geral, cor: 'blue', Icon: FileText },
        { label: 'Em Análise / Pendentes', valor: indicadores.total_em_analise + indicadores.total_pendente, cor: 'yellow', Icon: AlertTriangle },
        { label: 'Em Execução', valor: indicadores.total_em_execucao, cor: 'blue', Icon: Clock },
        { label: 'Finalizados', valor: indicadores.total_finalizado, cor: 'green', Icon: CheckCircle2 },
      ]
    : [
        { label: 'Minhas Ocorrências', valor: ocorrencias.length, cor: 'blue', Icon: FileText },
        { label: 'Pendentes', valor: ocorrencias.filter(o => ['Pendente','Em_Analise'].includes(o.status)).length, cor: 'yellow', Icon: AlertTriangle },
        { label: 'Em Execução', valor: ocorrencias.filter(o => o.status === 'Em_Execucao').length, cor: 'blue', Icon: Clock },
        { label: 'Finalizadas', valor: ocorrencias.filter(o => o.status === 'Finalizado').length, cor: 'green', Icon: CheckCircle2 },
      ];

  const corCard = { blue: 'bg-blue-50 text-blue-600', yellow: 'bg-yellow-50 text-yellow-600', green: 'bg-green-50 text-green-600' };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} paginaAtiva="dashboard" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ocorrências..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
        </Header>

        <div className="flex-1 overflow-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
            <p className="text-slate-500 text-sm">
              {funcionario ? 'Painel de controle — zeladoria urbana' : 'Acompanhe suas solicitações'}
            </p>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map(({ label, valor, cor, Icon }) => (
              <div key={label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 text-sm font-medium">{label}</p>
                  <div className={`p-2 rounded-lg ${corCard[cor]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">
                  {loading ? '—' : valor}
                </h3>
              </div>
            ))}
          </div>

          {/* Tempo médio de resolução (só funcionário) */}
          {funcionario && indicadores && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 flex items-center gap-4">
              <div className="p-3 bg-teal-50 rounded-lg">
                <Clock className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tempo médio de resolução</p>
                <p className="text-xl font-bold text-slate-800">
                  {indicadores.tempo_medio_resolucao_horas
                    ? `${(indicadores.tempo_medio_resolucao_horas / 24).toFixed(1)} dias`
                    : '—'}
                </p>
              </div>
            </div>
          )}

          {/* Lista de ocorrências recentes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {funcionario ? 'Ocorrências Recentes' : 'Minhas Ocorrências'}
                </h3>
                <p className="text-sm text-slate-500">
                  {funcionario ? 'Últimas 10 solicitações registradas' : 'Suas solicitações mais recentes'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('ocorrencias')}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Ver todas →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando...</div>
              ) : ocorrencias.length > 0 ? (
                ocorrencias.map((o) => (
                  <div key={o.id} className="p-5 flex items-start justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-400">#{o.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_ESTILO[o.status] || 'bg-slate-100 text-slate-600'}`}>
                          {o.status?.replace('_', ' ')}
                        </span>
                        {o.urgencia && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                            {o.urgencia}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-800">{o.titulo}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {o.data_abertura ? new Date(o.data_abertura).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <ClipboardList className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-1">Nenhuma ocorrência encontrada</h4>
                  <p className="text-sm text-slate-500">
                    {funcionario
                      ? 'Nenhuma ocorrência registrada ou sem permissão de acesso.'
                      : 'Você ainda não registrou nenhuma ocorrência.'}
                  </p>
                  {!funcionario && (
                    <button
                      onClick={() => onNavigate('ocorrencias')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Registrar ocorrência
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}