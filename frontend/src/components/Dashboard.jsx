import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, AlertTriangle, ClipboardList, BarChart3, Settings, 
  LogOut, Search, SlidersHorizontal, Bell, FileText, Clock, CheckCircle2, MoreHorizontal 
} from 'lucide-react';

export default function Dashboard({ onLogout, onNavigate }) {
  const [usuario, setUsuario] = useState({ nome: 'Carregando...', cargo: 'Usuário' });
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Lê quem está logado extraindo os dados de dentro do Token JWT
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        let nomeFinal = payload.nome;
        if (!nomeFinal) {
           nomeFinal = isNaN(payload.sub) ? payload.sub : 'Ana Gestora';
        }

        setUsuario({ 
          nome: nomeFinal, 
          cargo: payload.cargo || 'Gestor' 
        });
      } catch (e) {
        setUsuario({ nome: 'Ana Gestora', cargo: 'Gestora' });
      }
    }
  }, []);

  // 2. Busca as ocorrências reais da sua API passando o crachá de segurança
  useEffect(() => {
    const buscarOcorrencias = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://127.0.0.1:8000/ocorrencia/triagem', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("🕵️ Dados reais do Banco:", data);
          
          const listaOcorrencias = data.ocorrencias || [];
          setOcorrencias(listaOcorrencias);
        } else {
          const motivo = await response.text();
          console.error("❌ O Back-end barrou a leitura:", motivo);
          setOcorrencias([]); 
        }
      } catch (error) {
        console.error("❌ O servidor FastAPI está desligado:", error);
      } finally {
        setLoading(false); // Desliga o aviso de "Carregando dados..."
      }
    };

    buscarOcorrencias();
  }, []);

  // Calcula os totais baseados nos dados reais do banco
  const totais = {
    geral: ocorrencias.length,
    pendentes: ocorrencias.filter(o => o.status === 'Pendente' || o.status === 'Em_Analise').length,
    execucao: ocorrencias.filter(o => o.status === 'Em_Execucao').length,
    concluidos: ocorrencias.filter(o => o.status === 'Finalizado').length,
  };

  // Função para definir a cor e o ícone do badge de status
  const getStatusEstilo = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-700';
      case 'Em_Execucao': return 'bg-blue-100 text-blue-700';
      case 'Finalizado': return 'bg-green-100 text-green-700';
      case 'Arquivado': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700'; // Em_Analise
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR (Menu Lateral) */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white p-1 rounded">
            <BarChart3 className="text-green-600 w-6 h-6" /> 
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">InfraTL</h1>
            <p className="text-xs text-slate-400">Zeladoria Urbana</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="#" className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium">
            <LayoutDashboard className="w-5 h-5" /> Visao Geral
          </a>
          <button onClick={() => onNavigate('ocorrencias')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <AlertTriangle className="w-5 h-5" /> Ocorrencias
            </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <ClipboardList className="w-5 h-5" /> Ordens de Servico
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <BarChart3 className="w-5 h-5" /> Relatorios
          </a>
          <button onClick={() => onNavigate('configuracoes')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <Settings className="w-5 h-5" /> Configuracoes
            </button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2 w-full text-left hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex gap-4 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar ocorrencias, enderecos, categorias..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
              <SlidersHorizontal className="w-4 h-4" /> Filtros
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{usuario.nome}</p>
                <p className="text-xs text-slate-500">{usuario.cargo}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                {usuario.nome.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Visao Geral</h2>
            <p className="text-slate-500 text-sm">Painel de controle do sistema de zeladoria urbana</p>
          </div>

          {/* CARDS DE ESTATÍSTICAS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-500 text-sm font-medium">Total de Chamados</p>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{totais.geral}</h3>
                <p className="text-xs text-green-600 font-medium">↑ 12% <span className="text-slate-400">vs. mes anterior</span></p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-500 text-sm font-medium">Pendentes / Em Análise</p>
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{totais.pendentes}</h3>
                <p className="text-xs text-red-500 font-medium">↓ 5% <span className="text-slate-400">vs. mes anterior</span></p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-500 text-sm font-medium">Em Execucao</p>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{totais.execucao}</h3>
                <p className="text-xs text-green-600 font-medium">↑ 8% <span className="text-slate-400">vs. mes anterior</span></p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-slate-500 text-sm font-medium">Concluidos</p>
                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{totais.concluidos}</h3>
                <p className="text-xs text-green-600 font-medium">↑ 15% <span className="text-slate-400">vs. mes anterior</span></p>
              </div>
            </div>
          </div>

          {/* LISTA DE OCORRÊNCIAS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Ocorrencias Recentes</h3>
              <p className="text-sm text-slate-500">Acompanhe as solicitacoes de zeladoria urbana</p>
            </div>
            
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Carregando dados reais...</div>
              ) : ocorrencias.length > 0 ? (
                ocorrencias.map((ocorrencia) => (
                  <div key={ocorrencia.id} className="p-6 flex items-start justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-slate-500">#{ocorrencia.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusEstilo(ocorrencia.status)}`}>
                          • {ocorrencia.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">{ocorrencia.titulo}</h4>
                      <p className="text-sm text-slate-500 mb-1">{ocorrencia.descricao}</p>
                      <p className="text-xs text-slate-400">{new Date(ocorrencia.data_abertura).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                // DADOS MOCKADOS (Aparecem se o banco estiver vazio para manter o design visível)
                <>
                  <div className="p-6 flex items-start justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-slate-500">#2847</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">• Pendente</span>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">Buraco na Via</h4>
                      <p className="text-sm text-slate-500 mb-1">Av. Principal, 1245 - Centro</p>
                      <p className="text-xs text-slate-400">10/03/2026</p>
                    </div>
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 flex items-start justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-slate-500">#2846</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">• Em Execucao</span>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">Iluminacao Publica</h4>
                      <p className="text-sm text-slate-500 mb-1">Rua das Flores, 856 - Jardim</p>
                      <p className="text-xs text-slate-400">10/03/2026</p>
                    </div>
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}