import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Download, MapPin, Calendar,
  Wrench, MoreHorizontal, Clock, Users, Filter, X,
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

const MOCK = [
  { id: 'OS-0412', ref: '2847', titulo: 'Reparo de buraco na via', descricao: 'Tapa-buraco e recapeamento no trecho da Av. Principal', progresso: 0, endereco: 'Av. Principal, 1245', equipe: 'Equipe Pavimentação', data: '10/03/2026', prazo: '15/03/2026', status: 'Aberta' },
  { id: 'OS-0411', ref: '2846', titulo: 'Troca de lâmpada pública', descricao: 'Substituição de lâmpada LED poste 856-J', progresso: 60, endereco: 'Rua das Flores, 856', equipe: 'Equipe Elétrica', data: '10/03/2026', prazo: '12/03/2026', status: 'Em Andamento' },
  { id: 'OS-0410', ref: '2845', titulo: 'Coleta especial de resíduos', descricao: 'Remoção de entulho e lixo volumoso', progresso: 100, endereco: 'Rua Santos Dumont, 234', equipe: 'Equipe Limpeza', data: '09/03/2026', prazo: '10/03/2026', status: 'Concluída' },
  { id: 'OS-0409', ref: '2844', titulo: 'Poda de árvore de grande porte', descricao: 'Poda de galhos com risco de queda sobre fiação', progresso: 100, endereco: 'Av. dos Estados, 3456', equipe: 'Equipe Ambiental', data: '09/03/2026', prazo: '11/03/2026', status: 'Concluída' },
  { id: 'OS-0408', ref: '2843', titulo: 'Tapa-buraco emergencial', descricao: 'Reparo em via de alto fluxo', progresso: 45, endereco: 'Rua 7 de Setembro, 789', equipe: 'Equipe Pavimentação', data: '08/03/2026', prazo: '10/03/2026', status: 'Em Andamento' },
  { id: 'OS-0407', ref: '2842', titulo: 'Desobstrução de bueiro', descricao: 'Limpeza de galeria pluvial entupida', progresso: 30, endereco: 'Rua Amazonas, 1123', equipe: 'Equipe Saneamento', data: '08/03/2026', prazo: '09/03/2026', status: 'Pausada' },
];

const STATUS_STYLE = {
  Aberta: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  'Em Andamento': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Concluída': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Pausada: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
};

export default function OrdensServico({ onLogout, onNavigate }) {
  const [listaOS, setListaOS] = useState(MOCK);
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', refOcorrencia: '', equipe: '', prazo: '', descricao: '', endereco: '' });

  const contagem = {
    Aberta: listaOS.filter(o => o.status === 'Aberta').length,
    'Em Andamento': listaOS.filter(o => o.status === 'Em Andamento').length,
    Pausada: listaOS.filter(o => o.status === 'Pausada').length,
    'Concluída': listaOS.filter(o => o.status === 'Concluída').length,
  };

  const osFiltradas = listaOS.filter((os) => {
    const matchTab = activeFilter === 'Todas' || os.status === activeFilter;
    const busca = searchTerm.toLowerCase();
    const matchSearch = !busca || os.id.toLowerCase().includes(busca) || os.titulo.toLowerCase().includes(busca) || os.equipe.toLowerCase().includes(busca);
    return matchTab && matchSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const nova = {
        id: `OS-0${Math.floor(Math.random() * 400) + 500}`,
        ref: formData.refOcorrencia || 'N/A',
        titulo: formData.titulo,
        descricao: formData.descricao,
        progresso: 0,
        endereco: formData.endereco || 'Endereço não informado',
        equipe: formData.equipe,
        data: new Date().toLocaleDateString('pt-BR'),
        prazo: formData.prazo.split('-').reverse().join('/') || 'A definir',
        status: 'Aberta',
      };
      setListaOS(prev => [nova, ...prev]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      setFormData({ titulo: '', refOcorrencia: '', equipe: '', prazo: '', descricao: '', endereco: '' });
    }, 600);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative">
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} paginaAtiva="ordens" />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-auto p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Ordens de Serviço</h2>
              <p className="text-slate-500 text-sm">Acompanhe e gerencie as ordens atribuídas às equipes</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> Exportar
              </button>
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Nova OS
              </button>
            </div>
          </div>

          {/* Cards de contagem */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(contagem).map(([status, n]) => {
              const s = STATUS_STYLE[status] || STATUS_STYLE.Aberta;
              return (
                <button key={status}
                  onClick={() => setActiveFilter(activeFilter === status ? 'Todas' : status)}
                  className={`flex items-center gap-4 bg-white p-4 rounded-xl border transition-all text-left outline-none ${activeFilter === status ? `border-current ring-2 ring-current/20 ${s.text}` : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${s.bg} ${s.text}`}>{n}</div>
                  <span className="font-semibold text-slate-700 text-sm">{status}</span>
                </button>
              );
            })}
          </div>

          {/* Busca e toggle */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar ordens..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
            </div>
            <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
              {['cards', 'tabela'].map((m) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-4 py-2 text-sm font-medium transition-colors capitalize outline-none ${viewMode === m ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {osFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma OS encontrada.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {osFiltradas.map((os) => {
                const s = STATUS_STYLE[os.status] || STATUS_STYLE.Aberta;
                return (
                  <div key={os.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm">{os.id}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${s.bg} ${s.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{os.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">Ref: #{os.ref}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 outline-none"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1 truncate">{os.titulo}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{os.descricao}</p>
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-bold text-slate-700">{os.progresso}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${os.progresso === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${os.progresso}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate">{os.endereco}</span></span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /><span className="truncate">{os.equipe}</span></span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{os.data}</span>
                      <span className="flex items-center gap-1 font-medium text-slate-700"><Clock className="w-3 h-3" />Prazo: {os.prazo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">ID / Ref</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Equipe</th>
                    <th className="px-6 py-4">Progresso</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {osFiltradas.map((os) => {
                    const s = STATUS_STYLE[os.status] || STATUS_STYLE.Aberta;
                    return (
                      <tr key={os.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4"><p className="font-bold text-slate-800">{os.id}</p><p className="text-xs text-slate-400">#{os.ref}</p></td>
                        <td className="px-6 py-4 max-w-[200px]"><p className="font-bold text-slate-800 truncate">{os.titulo}</p><p className="text-xs text-slate-500 truncate">{os.endereco}</p></td>
                        <td className="px-6 py-4 text-slate-600">{os.equipe}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${os.progresso === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${os.progresso}%` }} />
                            </div>
                            <span className="text-xs font-bold">{os.progresso}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center w-fit gap-1.5 ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{os.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Nova OS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Gerar Nova Ordem de Serviço</h3>
                <p className="text-sm text-slate-500">Atribua tarefas para as equipes de campo.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="form-os" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                    <input type="text" required value={formData.titulo} onChange={(e) => setFormData(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Tapa-buraco na via"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ref. Ocorrência</label>
                    <input type="text" value={formData.refOcorrencia} onChange={(e) => setFormData(p => ({ ...p, refOcorrencia: e.target.value }))} placeholder="Ex: 2847"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Equipe *</label>
                    <select required value={formData.equipe} onChange={(e) => setFormData(p => ({ ...p, equipe: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none">
                      <option value="">Selecione...</option>
                      <option>Equipe Pavimentação</option>
                      <option>Equipe Elétrica</option>
                      <option>Equipe Limpeza</option>
                      <option>Equipe Ambiental</option>
                      <option>Equipe Saneamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prazo *</label>
                    <input type="date" required value={formData.prazo} onChange={(e) => setFormData(p => ({ ...p, prazo: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" required value={formData.endereco} onChange={(e) => setFormData(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, Número, Bairro..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orientações *</label>
                  <textarea required rows={3} value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} placeholder="Detalhes técnicos, materiais necessários..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none resize-none" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="form-os" disabled={isSubmitting}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isSubmitting ? 'Gerando...' : 'Gerar OS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}