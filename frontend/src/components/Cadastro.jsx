import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import { API, BASE_URL } from '../api';

export default function Cadastro({ onNavigate }) {
  const [form, setForm] = useState({
    nome: '', cpf: '', telefone: '', data_nascimento: '',
    email: '', senha: '', rua: '', numero: '', bairro: '',
  });
  const [bairros, setBairros] = useState([]);
  const [loadingBairros, setLoadingBairros] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Bairros não precisam de token — mas a rota /bairros/listar exige.
  // Usamos o endpoint público de cadastro para buscar via token temporário,
  // ou simplesmente chamamos sem token (o backend aceita get_current_user que
  // exige token). Por isso buscamos APÓS o usuário já estar no fluxo de cadastro
  // — sem token disponível, mostramos campo de texto livre como fallback.
  useEffect(() => {
    const buscarBairros = async () => {
      try {
        // Tenta sem token; se o backend bloquear, usa campo livre
        const res = await fetch(`${BASE_URL}/bairros/listar`);
        if (res.ok) {
          const data = await res.json();
          setBairros(Array.isArray(data) ? data : []);
        }
      } catch {
        // silencia — usuário digita manualmente
      } finally {
        setLoadingBairros(false);
      }
    };
    buscarBairros();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const payload = {
      nome: form.nome,
      cpf: form.cpf.replace(/\D/g, ''),
      telefone: form.telefone,
      data_nascimento: form.data_nascimento,
      email: form.email,
      senha: form.senha,
      endereco: {
        endereco_completo: `${form.rua}, ${form.numero} - ${form.bairro}`,
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        fonte_localizacao: 'manual',
      },
    };

    try {
      const response = await API.cadastrar(payload);
      const data = await response.json();
      if (response.ok) {
        alert('Conta criada com sucesso! Faça login para acessar o sistema.');
        onNavigate();
      } else {
        setErro(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
      }
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidePanel isLogin={false} />

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg my-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Criar sua conta</h2>
          <p className="text-slate-500 mb-8">
            Preencha os dados abaixo para se cadastrar no sistema.
          </p>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <input type="text" name="nome" value={form.nome} onChange={handleChange} required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF (só números)</label>
                <input type="text" name="cpf" maxLength="11" value={form.cpf} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input type="text" name="telefone" value={form.telefone} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de nascimento</label>
                <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                <input type="text" name="rua" value={form.rua} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nº</label>
                <input type="text" name="numero" value={form.numero} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
              {bairros.length > 0 ? (
                <select name="bairro" value={form.bairro} onChange={handleChange} required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione um bairro</option>
                  {bairros.map((b) => (
                    <option key={b.id} value={b.nome}>{b.nome}</option>
                  ))}
                </select>
              ) : (
                <input type="text" name="bairro" value={form.bairro} onChange={handleChange} required
                  placeholder={loadingBairros ? 'Carregando bairros...' : 'Digite o nome do bairro'}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input type="password" name="senha" value={form.senha} onChange={handleChange} required minLength={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button type="submit" disabled={carregando}
              className="w-full mt-2 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Já possui uma conta?{' '}
            <button onClick={onNavigate} className="text-blue-600 font-medium hover:underline">
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}