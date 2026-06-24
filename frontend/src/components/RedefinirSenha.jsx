import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import SidePanel from './SidePanel';
import { API } from '../api';

export default function RedefinirSenha({ tokenRecuperacao, onNavigateLogin }) {
  const [form, setForm] = useState({ nova_senha: '', confirmar_senha: '' });
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleRedefinir = async (e) => {
    e.preventDefault();
    setErro('');

    if (form.nova_senha !== form.confirmar_senha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (form.nova_senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      const response = await API.redefinirSenha(
        form.nova_senha,
        form.confirmar_senha,
        tokenRecuperacao
      );
      if (response.ok) {
        setSucesso(true);
      } else {
        const data = await response.json();
        setErro(data.detail || 'Erro ao redefinir a senha.');
      }
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidePanel isLogin={true} />

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {sucesso ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha redefinida!</h2>
              <p className="text-slate-500 mb-8">
                Sua senha foi alterada com sucesso. Faça login com a nova senha.
              </p>
              <button
                onClick={onNavigateLogin}
                className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir para o login →
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Criar nova senha</h2>
              <p className="text-slate-500 mb-8">Digite sua nova senha de acesso abaixo.</p>

              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{erro}</div>
              )}

              <form onSubmit={handleRedefinir} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
                  <input
                    type="password"
                    value={form.nova_senha}
                    onChange={(e) => setForm({ ...form, nova_senha: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={form.confirmar_senha}
                    onChange={(e) => setForm({ ...form, confirmar_senha: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full mt-2 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {carregando ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}