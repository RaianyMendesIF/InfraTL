import React, { useState } from 'react';
import { Send } from 'lucide-react';
import SidePanel from './SidePanel';
import { API } from '../api';

export default function RecuperarSenha({ onNavigateLogin }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const response = await API.recuperarSenha(email);
      // O backend sempre retorna 200 por segurança (não revela se e-mail existe)
      if (response.ok) {
        setEnviado(true);
      } else {
        const data = await response.json();
        setErro(data.detail || 'Erro ao solicitar recuperação.');
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
          <button onClick={onNavigateLogin} className="text-slate-500 text-sm mb-6 hover:text-slate-800 transition-colors">
            ← Voltar ao login
          </button>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">Esqueceu sua senha?</h2>
          <p className="text-slate-500 mb-8">
            Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
          </p>

          {enviado ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm flex items-start gap-3">
              <Send className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Se o e-mail estiver cadastrado, você receberá o link em instantes.
                Verifique também a caixa de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="space-y-6">
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{erro}</div>
              )}

              <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-lg text-sm flex items-start gap-3">
                <Send className="w-5 h-5 shrink-0 mt-0.5" />
                <p>O link de recuperação será enviado para o e-mail cadastrado. Verifique também o spam.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail cadastrado</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-600 mt-8">
            Lembrou sua senha?{' '}
            <button onClick={onNavigateLogin} className="text-blue-600 font-medium hover:underline">
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}