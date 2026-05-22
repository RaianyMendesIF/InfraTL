import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, AlertTriangle, ClipboardList, BarChart3, Settings, 
  LogOut, Search, SlidersHorizontal, Bell, User, Users, Shield, Palette, Database, Camera
} from 'lucide-react';

export default function Configuracoes({ onLogout, onNavigate }) {
  const [activeTab, setActiveTab] = useState('perfil');
  const [usuario, setUsuario] = useState({ nome: 'Admin Municipal', email: 'admin@prefeitura.gov.br' });

  // Estados para a tela de Gestão de Equipe
  const [idAdicionar, setIdAdicionar] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cargo, setCargo] = useState('Agente');
  const [idRemover, setIdRemover] = useState('');

  // Tenta puxar os dados reais do usuário logado se estiverem no localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUsuario(userObj);
      } catch (e) {}
    }
  }, []);

  const handlePromover = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/funcionario/adicionar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_usuario: parseInt(idAdicionar),
          matricula: matricula,
          cargo: cargo
        })
      });
      const data = await response.json();
      if(response.ok) alert(data.mensagem || 'Funcionário promovido com sucesso!');
      else alert('Erro: ' + data.detail);
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  const handleRemover = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/funcionario/remover', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_usuario: parseInt(idRemover) })
      });
      const data = await response.json();
      if(response.ok) alert(data.mensagem || 'Privilégios removidos com sucesso!');
      else alert('Erro: ' + data.detail);
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR (Menu Lateral) - Igual ao Dashboard */}
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
          <button onClick={() => onNavigate('ocorrencias')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <AlertTriangle className="w-5 h-5" /> Ocorrencias
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <ClipboardList className="w-5 h-5" /> Ordens de Servico
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors text-left">
            <BarChart3 className="w-5 h-5" /> Relatorios
          </button>
          <button className="w-full flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium text-left">
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
        
        {/* HEADER - Igual ao Dashboard */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex gap-4 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar ocorrencias, enderecos, categorias..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
              <SlidersHorizontal className="w-4 h-4" /> Filtros
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700">{usuario.nome}</p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                {usuario.nome.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO SCROLLÁVEL DAS CONFIGURAÇÕES */}
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Configuracoes</h2>
            <p className="text-slate-500 text-sm">Gerencie suas preferencias e configuracoes do sistema</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* SUB-MENU ESQUERDO (Figma) */}
            <div className="w-full md:w-64 shrink-0 bg-white border border-slate-200 rounded-xl p-2 h-fit">
              <nav className="flex flex-col gap-1 text-sm font-medium">
                <button 
                  onClick={() => setActiveTab('perfil')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'perfil' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <User className="w-4 h-4" /> Perfil
                </button>
                <button 
                  onClick={() => setActiveTab('equipe')}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'equipe' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Users className="w-4 h-4" /> Gestao de Equipe
                </button>
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  <Bell className="w-4 h-4" /> Notificacoes
                </button>
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  <Shield className="w-4 h-4" /> Seguranca
                </button>
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  <Palette className="w-4 h-4" /> Aparencia
                </button>
                <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  <Database className="w-4 h-4" /> Sistema
                </button>
              </nav>
            </div>

            {/* PAINEL DIREITO */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-8">
              
              {activeTab === 'perfil' && (
                <>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-teal-500 text-white flex items-center justify-center text-3xl font-bold">
                        {usuario.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{usuario.nome}</h3>
                      <p className="text-slate-500 text-sm mb-1">Administrador do Sistema</p>
                      <button className="text-blue-600 text-sm font-medium hover:underline">Alterar foto</button>
                    </div>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                        <input type="text" defaultValue={usuario.nome} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail institucional</label>
                        <input type="email" defaultValue={usuario.email} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                        <input type="text" defaultValue="(67) 99999-0000" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria</label>
                        <input type="text" defaultValue="Administracao" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                      <input type="text" defaultValue="Administrador Municipal - Secretario Adjunto" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700" />
                    </div>
                    <div className="flex justify-end pt-4">
                      <button type="button" className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                        Salvar Alteracoes
                      </button>
                    </div>
                  </form>
                </>
              )}

              {activeTab === 'equipe' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Adicionar Funcionario</h3>
                    <p className="text-sm text-slate-500 mb-4">Promova um usuario comum (cidadao) para ter privilegios de sistema.</p>
                    <form onSubmit={handlePromover} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ID do Usuário</label>
                          <input type="number" value={idAdicionar} onChange={e => setIdAdicionar(e.target.value)} placeholder="Ex: 15" className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                          <input type="text" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="PMT-2024-..." className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                          <select value={cargo} onChange={e => setCargo(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                            <option value="Agente">Agente de Campo</option>
                            <option value="Gestor">Gestor / Admin</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
                        Promover a Funcionário
                      </button>
                    </form>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <h3 className="text-lg font-bold text-red-600 mb-1">Remover Privilegios</h3>
                    <p className="text-sm text-slate-500 mb-4">Remova o acesso de um funcionario. Ele voltara a ser um usuario comum.</p>
                    <form onSubmit={handleRemover} className="bg-red-50 p-6 rounded-lg border border-red-100 flex items-end gap-4">
                      <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-slate-700 mb-1">ID do Usuário</label>
                        <input type="number" value={idRemover} onChange={e => setIdRemover(e.target.value)} placeholder="Ex: 15" className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                      </div>
                      <button type="submit" className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700">
                        Remover Acesso
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}