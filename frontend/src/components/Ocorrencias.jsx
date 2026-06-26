import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Download, Grid, List, MapPin, Calendar,
  AlertTriangle, MoreHorizontal, X, Check,
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { API, isFuncionario, getUsuarioLogado } from '../api';

const STATUS_BADGE = {
  Em_Analise: 'bg-orange-100 text-orange-700',
  Pendente: 'bg-yellow-100 text-yellow-700',
  Em_Execucao: 'bg-blue-100 text-blue-700',
  Finalizado: 'bg-green-100 text-green-700',
  Arquivado: 'bg-red-100 text-red-700',
};

const URGENCIA_BADGE = {
  Critica: 'bg-red-200 text-red-800',
  Alta: 'bg-red-100 text-red-600',
  Media: 'bg-yellow-100 text-yellow-600',
  Baixa: 'bg-green-100 text-green-600',
};

const ABAS = ['Todos', 'Em_Analise', 'Pendente', 'Em_Execucao', 'Finalizado', 'Arquivado'];

export default function Ocorrencias({ onLogout, onNavigate }) {
  const funcionario = isFuncionario();
  const usuario = getUsuarioLogado();

  const [ocorrencias, setOcorrencias] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroModal, setErroModal] = useState('');

  // Modal de avaliação (só funcionário)
  const [modalAvaliar, setModalAvaliar] = useState(null); // { ocorrencia }
  const [avaliacaoForm, setAvaliacaoForm] = useState({ aprovado: true, urgencia: 'Media', justificativa: '' });
  const [submittingAval, setSubmittingAval] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '', descricao: '', id_servico: '',
    rua: '', numero: '', complemento: '', bairro: '',
  });

  const carregarOcorrencias = async () => {
    setLoading(true);
    try {
      const res = await API.listarOcorrencias();
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) ? data : (data.ocorrencias || []);
        setOcorrencias(lista);
      } else {
        setOcorrencias([]);
      }
    } catch {
      setOcorrencias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOcorrencias();

    // Busca bairros e serviços para o formulário
    API.listarBairros().then(r => r.ok && r.json()).then(d => d && setBairros(Array.isArray(d) ? d : [])).catch(() => {});
    API.listarServicosAtivos().then(r => r.ok && r.json()).then(d => d && setServicos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    const matchTab = activeTab === 'Todos' || o.status === activeTab;
    const busca = searchTerm.toLowerCase();
    const matchSearch = !busca ||
      String(o.id).includes(busca) ||
      (o.titulo || '').toLowerCase().includes(busca);
    return matchTab && matchSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroModal('');
    setIsSubmitting(true);

    const payload = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      id_usuario: usuario.id,
      id_servico: parseInt(formData.id_servico),
      endereco: {
        endereco_completo: `${formData.rua}, ${formData.numero} - ${formData.bairro}`,
        rua: formData.rua,
        numero: formData.numero,
        complemento: formData.complemento || null,
        bairro: formData.bairro,
        fonte_localizacao: 'manual',
      },
    };

    try {
      const res = await API.cadastrarOcorrencia(payload);
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ titulo: '', descricao: '', id_servico: '', rua: '', numero: '', complemento: '', bairro: '' });
        await carregarOcorrencias();
      } else {
        const err = await res.json();
        setErroModal(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
      }
    } catch {
      setErroModal('Não foi possível conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvaliar = async (e) => {
    e.preventDefault();
    setSubmittingAval(true);
    try {
      const payload = avaliacaoForm.aprovado
        ? { aprovado: true, urgencia: avaliacaoForm.urgencia }
        : { aprovado: false, justificativa: avaliacaoForm.justificativa };

      const res = await API.avaliarOcorrencia(modalAvaliar.id, payload);
      if (res.ok) {
        setModalAvaliar(null);
        await carregarOcorrencias();
      } else {
        const err = await res.json();
        alert(err.detail || 'Erro ao avaliar.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setSubmittingAval(false);
    }
  };

  const handleMudarStatus = async (ocorrencia, novoStatus) => {
    try {
      const res = await API.atualizarStatusOcorrencia(ocorrencia.id, novoStatus);
      if (res.ok) {
        await carregarOcorrencias();
      } else {
        const err = await res.json();
        alert(err.detail || 'Erro ao atualizar status.');
      }
    } catch {
      alert('Erro de conexão.');
    }
  };

  const StatusBadge = ({ status }) => (
    <span className={`flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_BADGE[status] || 'bg-slate-100 text-slate-700'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status?.replace('_', ' ')}
    </span>
  );

  const UrgenciaBadge = ({ urgencia }) =>
    urgencia ? (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${URGENCIA_BADGE[urgencia] || 'bg-slate-100 text-slate-600'}`}>
        {urgencia}
      </span>
    ) : null;

  // Botões de ação rápida para funcionários
  const AcoesRapidas = ({ ocorrencia }) => {
    if (!funcionario) return null;
    return (
      <div className="flex gap-2 mt-3 flex-wrap">
        {ocorrencia.status === 'Em_Analise' && (
          <button
            onClick={() => { setModalAvaliar(ocorrencia); setAvaliacaoForm({ aprovado: true, urgencia: 'Media', justificativa: '' }); }}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
          >
            Avaliar
          </button>
        )}
        {ocorrencia.status === 'Pendente' && (
          <button
            onClick={() => handleMudarStatus(ocorrencia, 'Em_Execucao')}
            className="px-3 py-1 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 transition-colors"
          >
            Iniciar execução
          </button>
        )}
        {ocorrencia.status === 'Em_Execucao' && (
          <button
            onClick={() => handleMudarStatus(ocorrencia, 'Finalizado')}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
          >
            Finalizar
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative">
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} paginaAtiva="ocorrencias" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-auto p-8">
          {/* Título e botão */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Ocorrências</h2>
              <p className="text-slate-500 text-sm">
                {funcionario ? 'Gerencie todas as ocorrências do sistema' : 'Registre e acompanhe suas solicitações'}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> Exportar
              </button>
              <button
                onClick={() => { setIsModalOpen(true); setErroModal(''); }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nova Ocorrência
              </button>
            </div>
          </div>

          {/* Barra de pesquisa + abas + toggle de view */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 mb-6 flex flex-col lg:flex-row gap-3 justify-between items-center">
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por ID ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex-1 flex justify-center overflow-x-auto w-full">
              <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                {ABAS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors outline-none ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                <Grid className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Resultados */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Carregando ocorrências...
            </div>
          ) : ocorrenciasFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
              <AlertTriangle className="w-10 h-10 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Nenhuma ocorrência encontrada</h3>
              <p className="text-slate-500 text-sm">Nenhum resultado para os filtros aplicados.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ocorrenciasFiltradas.map((o) => (
                <div key={o.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-400">#{o.id}</span>
                    <StatusBadge status={o.status} />
                    <UrgenciaBadge urgencia={o.urgencia} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{o.titulo || 'Sem título'}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{o.descricao}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {o.data_abertura ? new Date(o.data_abertura).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <AcoesRapidas ocorrencia={o} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Urgência</th>
                    {funcionario && <th className="px-6 py-4">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ocorrenciasFiltradas.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">#{o.id}</td>
                      <td className="px-6 py-4 font-medium">{o.titulo}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {o.data_abertura ? new Date(o.data_abertura).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4"><UrgenciaBadge urgencia={o.urgencia} /></td>
                      {funcionario && (
                        <td className="px-6 py-4">
                          <AcoesRapidas ocorrencia={o} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: Nova Ocorrência ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Registrar Nova Ocorrência</h3>
                <p className="text-sm text-slate-500">Preencha os dados para análise da gestão urbana.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {erroModal && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{erroModal}</div>
              )}
              <form id="form-ocorrencia" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                  <input
                    type="text" name="titulo" value={formData.titulo} required minLength={5}
                    onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ex: Buraco perigoso na via principal..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
                    <select
                      name="id_servico" value={formData.id_servico} required
                      onChange={(e) => setFormData(p => ({ ...p, id_servico: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    >
                      <option value="">Selecione...</option>
                      {servicos.length > 0
                        ? servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)
                        : (
                          // Fallback se a API de serviços falhar
                          <>
                            <option value="1">Buraco em via pública</option>
                            <option value="2">Iluminação pública</option>
                            <option value="3">Limpeza de terreno</option>
                            <option value="4">Coleta de entulho</option>
                            <option value="5">Árvore e poda</option>
                            <option value="6">Sinalização</option>
                            <option value="7">Esgoto</option>
                          </>
                        )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro *</label>
                    {bairros.length > 0 ? (
                      <select
                        name="bairro" value={formData.bairro} required
                        onChange={(e) => setFormData(p => ({ ...p, bairro: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                      >
                        <option value="">Selecione...</option>
                        {bairros.map((b) => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text" name="bairro" value={formData.bairro} required
                        onChange={(e) => setFormData(p => ({ ...p, bairro: e.target.value }))}
                        placeholder="Nome do bairro"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rua / Avenida *</label>
                    <input
                      type="text" value={formData.rua} required
                      onChange={(e) => setFormData(p => ({ ...p, rua: e.target.value }))}
                      placeholder="Nome da rua..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Número *</label>
                    <input
                      type="text" value={formData.numero} required
                      onChange={(e) => setFormData(p => ({ ...p, numero: e.target.value }))}
                      placeholder="Ex: 123"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
                  <textarea
                    value={formData.descricao} required minLength={10} rows={3}
                    onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))}
                    placeholder="Descreva o problema com o máximo de detalhes possível..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="form-ocorrencia" disabled={isSubmitting}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isSubmitting ? 'Registrando...' : 'Registrar Ocorrência'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Avaliar Ocorrência (funcionário) ── */}
      {modalAvaliar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Avaliar Ocorrência #{modalAvaliar.id}</h3>
                <p className="text-sm text-slate-500 truncate max-w-xs">{modalAvaliar.titulo}</p>
              </div>
              <button onClick={() => setModalAvaliar(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAvaliar} className="p-6 space-y-5">
              {/* Aprovado / Reprovado */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAvaliacaoForm(f => ({ ...f, aprovado: true }))}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${avaliacaoForm.aprovado ? 'bg-green-600 text-white border-green-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  ✓ Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setAvaliacaoForm(f => ({ ...f, aprovado: false }))}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${!avaliacaoForm.aprovado ? 'bg-red-600 text-white border-red-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  ✗ Arquivar
                </button>
              </div>

              {avaliacaoForm.aprovado ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urgência *</label>
                  <select
                    value={avaliacaoForm.urgencia} required
                    onChange={(e) => setAvaliacaoForm(f => ({ ...f, urgencia: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Media">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Critica">Crítica</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Justificativa do arquivamento *</label>
                  <textarea
                    value={avaliacaoForm.justificativa} required rows={3}
                    onChange={(e) => setAvaliacaoForm(f => ({ ...f, justificativa: e.target.value }))}
                    placeholder="Explique o motivo do arquivamento..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalAvaliar(null)}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submittingAval}
                  className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${submittingAval ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {submittingAval ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}