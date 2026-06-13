import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import SidePanel from './SidePanel';

export default function RedefinirSenha({ tokenRecuperacao, onNavigateLogin }) {
  const [form, setForm] = useState({ nova_senha: '', confirmar_senha: '' });
  const [sucesso, setSucesso] = useState(false);

  const handleRedefinir = async (e) => {
    e.preventDefault();
    if(form.nova_senha !== form.confirmar_senha) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      // O back-end exige que o token vá no header Authorization
      const response = await fetch('http://127.0.0.1:8000/auth/redefinir-senha', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenRecuperacao}` 
        },
        body: JSON.stringify({ 
          nova_senha: form.nova_senha, 
          confirmar_senha: form.confirmar_senha 
        })
      });

      if (response.ok) {
        setSucesso(true);
      } else {
        const data = await response.json();
        alert('Erro: ' + data.detail);
      }
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidePanel isLogin={true} />
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          
          {sucesso ? (
            // A sua tela de Sucesso do Figma!
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Senha redefinida com sucesso!</h2>
              <p className="text-slate-500 mb-8">Sua senha foi alterada com sucesso. Você já pode acessar sua conta com a nova senha.</p>
              
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm mb-6 w-full text-left">
                Por questões de segurança, recomendamos que você faça login novamente com sua nova senha.
              </div>

              <button onClick={onNavigateLogin} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Ir para o login →
              </button>
            </div>
          ) : (
            // Tela gerada para digitar a nova senha
            <div className="text-left">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Criar nova senha</h2>
              <p className="text-slate-500 mb-8">Digite sua nova senha de acesso seguro abaixo.</p>

              <form onSubmit={handleRedefinir} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
                  <input type="password" value={form.nova_senha} onChange={(e) => setForm({...form, nova_senha: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required minLength="8" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
                  <input type="password" value={form.confirmar_senha} onChange={(e) => setForm({...form, confirmar_senha: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required minLength="8" />
                </div>

                <button type="submit" className="w-full mt-4 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                  Salvar nova senha
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}