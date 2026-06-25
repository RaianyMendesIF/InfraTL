import React, { useState } from 'react';
import SidePanel from './SidePanel';
import { API } from '../api';

export default function Login({ onNavigate, onLoginSuccess, onNavigateRecuperar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await API.login(email, senha);
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        onLoginSuccess();
      } else {
        setErro(data.detail || 'E-mail ou senha incorretos.');
      }
    } catch {
      setErro('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidePanel isLogin={true} />

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo de volta</h2>
          <p className="text-slate-500 mb-8">
            Acesse sua conta para gerenciar o painel de zeladoria urbana.
          </p>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="rounded text-blue-500" />
                Lembrar de mim
              </label>
              <button
                type="button"
                onClick={onNavigateRecuperar}
                className="text-sm text-blue-600 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Não possui uma conta?{' '}
            <button onClick={onNavigate} className="text-blue-600 font-medium hover:underline">
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}