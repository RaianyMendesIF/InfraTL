import React, { useState, useEffect } from 'react';
import {
  Bell, User, Users, Shield, Palette, Monitor, Camera, Search,
  Sun, Moon, Laptop, Smartphone, ChevronRight, Check,
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { API, getUsuarioLogado, isFuncionario } from '../api';

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default function Configuracoes({ onLogout, onNavigate }) {
  const funcionario = isFuncionario();
  const usuarioToken = getUsuarioLogado();

  const [activeTab, setActiveTab] = useState('Perfil');
  const [isLoading, setIsLoading] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');

  const [perfilForm, setPerfilForm] = useState({
    nome: usuarioToken?.nome || '',
    telefone: '',
  });

  const [addEquipeForm, setAddEquipeForm] = useState({ id_usuario: '', matricula: '', cargo: 'Agente' });
  const [removerEquipeId, setRemoverEquipeId] = useState('');

  const [senhaForm, setSenhaForm] = useState({ nova: '', confirmar: '' });

  const [notifs, setNotifs] = useState({
    emailNovaOcorrencia: true, emailStatus: true, emailRelatorio: false,
    pushNovas: true, pushOS: true, pushPrazo: true, pushAtualizacoes: false,
  });

  const [tema, setTema] = useState('Claro');
  const [densidade, setDensidade] = useState('Normal');

  const handleMudarTema = (novoTema) => {
    setTema(novoTema);
    if (novoTema === 'Escuro') {
      document.documentElement.classList.add('dark');
    } else if (novoTema === 'Claro') {
      document.documentElement.classList.remove('dark');
    } else {
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? document.documentElement.classList.add('dark')
        : document.documentElement.classList.remove('dark');
    }
  };

  // Alterar senha via API real
  const handleAtualizarSenha = async (e) => {
    e.preventDefault();
    setErroSenha('');
    setSucessoSenha('');
    if (senhaForm.nova !== senhaForm.confirmar) {
      setErroSenha('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await API.redefinirSenha(senhaForm.nova, senhaForm.confirmar, /* usa token da sessão */ null);
      // redefinirSenha com token null usa get_current_user via header Authorization normal
      // Chamamos via apiFetch direto:
      const response = await (await import('../api')).apiFetch('/auth/redefinir_senha', {
        method: 'POST',
        body: JSON.stringify({ nova_senha: senhaForm.nova, confirmar_senha: senhaForm.confirmar }),
      });
      if (response.ok) {
        setSucessoSenha('Senha atualizada com sucesso!');
        setSenhaForm({ nova: '', confirmar: '' });
      } else {
        const err = await response.json();
        setErroSenha(err.detail || 'Erro ao atualizar senha.');
      }
    } catch {
      setErroSenha('Não foi possível conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoverFuncionario = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.adicionarFuncionario({
        id_usuario: parseInt(addEquipeForm.id_usuario),
        matricula: addEquipeForm.matricula,
        cargo: addEquipeForm.cargo,
      });
      if (res.ok) {
        alert('Usuário promovido a funcionário com sucesso!');
        setAddEquipeForm({ id_usuario: '', matricula: '', cargo: 'Agente' });
      } else {
        const err = await res.json();
        alert(`Erro: ${err.detail}`);
      }
    } catch { alert('Erro de conexão.'); }
    finally { setIsLoading(false); }
  };

  const handleRemoverPrivilegios = async (e) => {
    e.preventDefault();
    if (!confirm('Tem certeza que deseja remover os privilégios deste funcionário?')) return;
    setIsLoading(true);
    try {
      const res = await API.removerFuncionario(parseInt(removerEquipeId));
      if (res.ok) {
        alert('Privilégios removidos com sucesso!');
        setRemoverEquipeId('');
      } else {
        const err = await res.json();
        alert(`Erro: ${err.detail}`);
      }
    } catch { alert('Erro de conexão.'); }
    finally { setIsLoading(false); }
  };

  const tipo = usuarioToken?.tipo === 'Admin' ? 'Funcionário' : 'Cidadão';

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar onNavigate={onNavigate} onLogout={onLogout} paginaAtiva="configuracoes" />

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <Header>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar configurações..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
          </div>
        </Header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="pt-8 px-8 pb-4 shrink-0">
            <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
            <p className="text-slate-500 text-sm">Gerencie suas preferências e configurações do sistema</p>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Submenu lateral */}
            <div className="w-60 p-6 pt-4 overflow-y-auto shrink-0 border-r border-slate-100">
              <nav className="space-y-1">
                {[
                  { key: 'Perfil', Icon: User, label: 'Perfil' },
                  // Gestão de Equipe só para Admin (funcionário)
                  ...(funcionario ? [{ key: 'Equipe', Icon: Users, label: 'Gestão de Equipe' }] : []),
                  { key: 'Notificacoes', Icon: Bell, label: 'Notificações' },
                  { key: 'Seguranca', Icon: Shield, label: 'Segurança' },
                  { key: 'Aparencia', Icon: Palette, label: 'Aparência' },
                  { key: 'Sistema', Icon: Monitor, label: 'Sistema' },
                ].map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors outline-none text-left ${activeTab === key ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Área de conteúdo */}
            <div className="flex-1 p-8 pt-4 overflow-y-auto bg-slate-50/50">

              {/* ── Perfil ── */}
              {activeTab === 'Perfil' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-teal-500 text-white flex items-center justify-center text-3xl font-bold">
                        {(usuarioToken?.nome || 'US').substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{usuarioToken?.nome}</h3>
                      <p className="text-slate-500 text-sm">{tipo}</p>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); alert('Perfil atualizado! (simulação)'); }} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                        <input type="text" value={perfilForm.nome} onChange={(e) => setPerfilForm({ ...perfilForm, nome: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                        <input type="text" value={perfilForm.telefone} onChange={(e) => setPerfilForm({ ...perfilForm, telefone: e.target.value })}
                          placeholder="(67) 99999-9999"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de conta 🔒</label>
                      <input type="text" value={tipo} disabled
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed outline-none" />
                      <p className="text-xs text-slate-400 mt-1">Alterações de cargo devem ser feitas pela Gestão de Equipe.</p>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors outline-none">
                        Salvar alterações
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Gestão de Equipe (Admin) ── */}
              {activeTab === 'Equipe' && funcionario && (
                <div className="max-w-2xl space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Adicionar Funcionário</h3>
                    <p className="text-sm text-slate-500 mb-6">Promova um cidadão para ter privilégios de sistema.</p>
                    <form onSubmit={handlePromoverFuncionario} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ID do Usuário</label>
                          <input type="number" required value={addEquipeForm.id_usuario}
                            onChange={(e) => setAddEquipeForm({ ...addEquipeForm, id_usuario: e.target.value })}
                            placeholder="Ex: 15"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
                          <input type="text" required value={addEquipeForm.matricula}
                            onChange={(e) => setAddEquipeForm({ ...addEquipeForm, matricula: e.target.value })}
                            placeholder="PMT-2024-..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                          <select value={addEquipeForm.cargo}
                            onChange={(e) => setAddEquipeForm({ ...addEquipeForm, cargo: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none">
                            <option value="Agente">Agente de Campo</option>
                            <option value="Gestor">Gestor Municipal</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 outline-none">
                        {isLoading ? 'Promovendo...' : 'Promover a Funcionário'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-red-700 mb-1">Remover Privilégios</h3>
                    <p className="text-sm text-red-500/80 mb-6">O usuário voltará a ser um cidadão comum.</p>
                    <form onSubmit={handleRemoverPrivilegios} className="flex items-end gap-4 max-w-sm">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-red-900 mb-1">ID do Usuário</label>
                        <input type="number" required value={removerEquipeId}
                          onChange={(e) => setRemoverEquipeId(e.target.value)}
                          placeholder="Ex: 15"
                          className="w-full px-4 py-2 border border-red-200 bg-white rounded-lg focus:border-red-500 outline-none" />
                      </div>
                      <button type="submit" disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 outline-none">
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Notificações ── */}
              {activeTab === 'Notificacoes' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Notificações por E-mail</h3>
                  <p className="text-sm text-slate-500 mb-4">Escolha o que deseja receber por e-mail</p>
                  <div className="divide-y divide-slate-100 border-b border-slate-100 mb-8">
                    <Toggle label="Nova ocorrência registrada" checked={notifs.emailNovaOcorrencia} onChange={() => setNotifs({ ...notifs, emailNovaOcorrencia: !notifs.emailNovaOcorrencia })} />
                    <Toggle label="Atualização de status" checked={notifs.emailStatus} onChange={() => setNotifs({ ...notifs, emailStatus: !notifs.emailStatus })} />
                    <Toggle label="Relatório semanal" checked={notifs.emailRelatorio} onChange={() => setNotifs({ ...notifs, emailRelatorio: !notifs.emailRelatorio })} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Notificações Push</h3>
                  <div className="divide-y divide-slate-100">
                    <Toggle label="Novas ocorrências" checked={notifs.pushNovas} onChange={() => setNotifs({ ...notifs, pushNovas: !notifs.pushNovas })} />
                    <Toggle label="OS atribuída" checked={notifs.pushOS} onChange={() => setNotifs({ ...notifs, pushOS: !notifs.pushOS })} />
                    <Toggle label="Alertas de prazo" checked={notifs.pushPrazo} onChange={() => setNotifs({ ...notifs, pushPrazo: !notifs.pushPrazo })} />
                  </div>
                </div>
              )}

              {/* ── Segurança ── */}
              {activeTab === 'Seguranca' && (
                <div className="max-w-2xl space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Alterar Senha</h3>
                    <p className="text-sm text-slate-500 mb-6">Atualize sua senha de acesso</p>

                    {erroSenha && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{erroSenha}</div>}
                    {sucessoSenha && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{sucessoSenha}</div>}

                    <form onSubmit={handleAtualizarSenha} className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
                        <input type="password" required value={senhaForm.nova} minLength={6}
                          onChange={(e) => setSenhaForm({ ...senhaForm, nova: e.target.value })}
                          placeholder="Mín. 6 caracteres"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
                        <input type="password" required value={senhaForm.confirmar} minLength={6}
                          onChange={(e) => setSenhaForm({ ...senhaForm, confirmar: e.target.value })}
                          placeholder="Repita a nova senha"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none" />
                      </div>
                      <button type="submit" disabled={isLoading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 outline-none">
                        <Shield className="w-4 h-4" />
                        {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ── Aparência ── */}
              {activeTab === 'Aparencia' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Tema</h3>
                  <p className="text-sm text-slate-500 mb-6">Selecione o tema de preferência</p>
                  <div className="flex gap-4 mb-8">
                    {[
                      { key: 'Claro', Icon: Sun },
                      { key: 'Escuro', Icon: Moon },
                      { key: 'Sistema', Icon: Monitor },
                    ].map(({ key, Icon }) => (
                      <button key={key} onClick={() => handleMudarTema(key)}
                        className={`relative flex flex-col items-center p-6 border-2 rounded-xl w-28 transition-all outline-none ${tema === key ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-200'}`}>
                        {tema === key && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <Icon className={`w-7 h-7 mb-2 ${tema === key ? 'text-blue-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${tema === key ? 'text-blue-700' : 'text-slate-600'}`}>{key}</span>
                      </button>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Densidade</h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg w-fit mt-4">
                    {['Compacto', 'Normal', 'Confortável'].map((d) => (
                      <button key={d} onClick={() => setDensidade(d)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all outline-none ${densidade === d ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Sistema ── */}
              {activeTab === 'Sistema' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
                  <h3 className="text-lg font-bold text-slate-800 mb-5">Informações do Sistema</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                    {[
                      ['Versão', 'v1.0.0'],
                      ['Ambiente', 'Desenvolvimento'],
                      ['Município', 'Três Lagoas - MS'],
                      ['Tipo de conta', tipo],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0">
                        <span className="text-sm text-slate-500">{k}</span>
                        <span className="text-sm font-bold text-slate-800">{v}</span>
                      </div>
                    ))}
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