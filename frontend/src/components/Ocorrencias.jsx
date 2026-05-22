import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, AlertTriangle, ClipboardList, BarChart3, Settings, 
  LogOut, Search, SlidersHorizontal, Bell, MapPin, FileText
} from 'lucide-react';

export default function Ocorrencias({ onLogout, onNavigate }) {
  const [usuario, setUsuario] = useState({ id: 0, nome: 'Usuário', email: '' });
  
  // Estado do formulário baseado no Ocorrencia_schema_cadastro
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    id_servico: '1', // Padrão: 1 = Buraco em via pública (banco.sql)
    rua: '',
    numero: '',
    complemento: '',
    bairro: 'Centro' // Padrão
  });

  useEffect(() => {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      try {
        setUsuario(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    // Montando o JSON exatamente como o FastAPI e o Pydantic esperam
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao,
      id_usuario: usuario.id, // Pega o ID do usuário logado
      id_servico: parseInt(form.id_servico),
      urgencia: "Media", // Opcional no seu schema
      endereco: {
        endereco_completo: `${form.rua}, ${form.numero} - ${form.bairro}`,
        rua: form.rua,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        fonte_localizacao: "manual"
      }
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/ocorrencia/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Ocorrência registrada com sucesso!');
        // Limpa o formulário após o sucesso
        setForm({...form, titulo: '', descricao: '', rua: '', numero: '', complemento: ''});
      } else {
        alert('Erro ao registrar: ' + JSON.stringify(data.detail));
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
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
          <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <LayoutDashboard className="w-5 h-5" /> Visao Geral
          </button>
          <button className="w-full flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium text-left">
            <AlertTriangle className="w-5 h-5" /> Ocorrencias
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <ClipboardList className="w-5 h-5" /> Ordens de Servico
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <BarChart3 className="w-5 h-5" /> Relatorios
          </button>
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
              <input type="text" placeholder="Buscar ocorrencias..." className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{usuario.nome}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                {usuario.nome.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Nova Ocorrencia</h2>
              <p className="text-slate-500 text-sm">Preencha os dados abaixo para registrar um novo problema na zeladoria urbana.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
              
              {/* SESSÃO: DADOS DO PROBLEMA */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" /> Detalhes do Problema
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título Resumido</label>
                    <input type="text" required maxLength="100" placeholder="Ex: Lâmpada queimada no poste" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Serviço)</label>
                    <select value={form.id_servico} onChange={e => setForm({...form, id_servico: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                      <option value="1">Buraco em via pública</option>
                      <option value="2">Iluminação pública</option>
                      <option value="3">Limpeza de terreno</option>
                      <option value="4">Coleta de entulho</option>
                      <option value="5">Árvore e poda</option>
                      <option value="6">Sinalização</option>
                      <option value="7">Esgoto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Completa</label>
                    <textarea required maxLength="300" rows="3" placeholder="Descreva a situação com detalhes..." value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg resize-none"></textarea>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* SESSÃO: LOCALIZAÇÃO */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-red-500" /> Localização
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rua / Avenida</label>
                      <input type="text" required placeholder="Nome da rua" value={form.rua} onChange={e => setForm({...form, rua: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                      <input type="text" required placeholder="Ex: 123 ou S/N" value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                      <select value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                        <option value="Centro">Centro</option>
                        <option value="Santos Dumont">Santos Dumont</option>
                        <option value="Jardim Brasília">Jardim Brasília</option>
                        <option value="Olímpio Belo">Olímpio Belo</option>
                        <option value="Santa Luzia">Santa Luzia</option>
                        <option value="Jardim Alvorada">Jardim Alvorada</option>
                        <option value="São Bento">São Bento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Complemento (Ponto de Referência)</label>
                      <input type="text" placeholder="Ex: Em frente ao mercado" value={form.complemento} onChange={e => setForm({...form, complemento: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Registrar Ocorrência
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}