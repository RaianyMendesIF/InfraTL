import React, { useState } from 'react';
import SidePanel from './SidePanel';

export default function Login({ onNavigate, onLoginSuccess, onNavigateRecuperar }) {
  const [tipo, setTipo] = useState('Cidadão');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // O FastAPI com OAuth2PasswordBearer exige Content-Type x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', senha);

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        onLoginSuccess(); // Pula direto pro dashboard!
      } else {
        alert('Erro: ' + data.detail);
      }
    } catch (error) {
        console.error(error); // Mostra o erro real (ex: onLoginSuccess is not a function) no F12
        alert('Erro de conexão com o servidor ou erro interno.');
      }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidePanel isLogin={true} />
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Bem-vindo de volta</h2>
          <p className="text-slate-500 mb-8">Acesse sua conta para gerenciar o painel de zeladoria urbana.</p>

          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
              onClick={() => setTipo('Cidadão')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tipo === 'Cidadão' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              Cidadão
            </button>
            <button 
              onClick={() => setTipo('Funcionário')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tipo === 'Funcionário' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
              Funcionário
            </button>
          </div>

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
                <input type="checkbox" className="rounded text-blue-500 focus:ring-blue-500" />
                Lembrar de mim
              </label>
              <button type="button" onClick={onNavigateRecuperar} className="text-sm text-blue-600 hover:underline">Esqueceu a senha?</button>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              Entrar
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Nao possui uma conta? <button onClick={onNavigate} className="text-blue-600 font-medium hover:underline">Criar conta</button>
          </p>
        </div>
      </div>
    </div>
  );
}