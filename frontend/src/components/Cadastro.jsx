import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';

export default function Cadastro({ onNavigate }) {
  // Ajustado para o modelo Usuario_schema_cadastro do seu Python
  const [form, setForm] = useState({
    nome: '', cpf: '', telefone: '', data_nascimento: '', email: '', senha: '',
    rua: '', numero: '', bairro: ''
  });

  // Novo estado para armazenar a lista de bairros vindos do banco
  const [bairros, setBairros] = useState([]);
  const [loadingBairros, setLoadingBairros] = useState(true);

  // Busca os bairros ao carregar o componente
  useEffect(() => {
    const buscarBairros = async () => {
      try {
        const response = await fetch('http://localhost:8000/bairros'); // Ajuste a rota se necessário
        if (response.ok) {
          const data = await response.json();
          // Certifique-se de que 'data' seja um array de strings ou objetos
          setBairros(data);
        } else {
          console.error('Erro ao carregar bairros');
        }
      } catch (error) {
        console.error('Erro de conexão ao buscar bairros:', error);
      } finally {
        setLoadingBairros(false);
      }
    };

    buscarBairros();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCadastro = async (e) => {
    e.preventDefault();

    // Montando o payload exatamente como o backend espera
    const payload = {
      nome: form.nome,
      cpf: form.cpf,
      telefone: form.telefone,
      data_nascimento: form.data_nascimento,
      email: form.email,
      senha: form.senha,
      endereco: {
        endereco_completo: `${form.rua}, ${form.numero} - ${form.bairro}`,
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        fonte_localizacao: "manual"
      }
    };

    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        alert('Cadastro realizado com sucesso!');
        onNavigate(); // Volta pro login
      } else {
        alert('Erro: ' + JSON.stringify(data.detail));
      }
    } catch (error) {
      alert('Erro de conexão com o servidor.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidePanel isLogin={false} />
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg my-auto">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Criar sua conta</h2>
          <p className="text-slate-500 mb-8">Preencha os dados abaixo para solicitar acesso ao sistema.</p>

          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
              <input type="text" name="nome" value={form.nome} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF (apenas números)</label>
                <input type="text" name="cpf" maxLength="11" value={form.cpf} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input type="text" name="telefone" value={form.telefone} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Nascimento</label>
                <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                <input type="text" name="rua" value={form.rua} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nº</label>
                <input type="text" name="numero" value={form.numero} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
              <select 
                name="bairro" 
                value={form.bairro} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                disabled={loadingBairros}
              >
                <option value="">{loadingBairros ? 'Carregando bairros...' : 'Selecione um bairro'}</option>
                {bairros.map((bairro, index) => {
                  // Se sua API retornar uma lista de strings: ['Centro', 'Alvorada']
                  // Se retornar objetos (ex: {id: 1, nome: 'Centro'}), mude para bairro.nome
                  const nomeBairro = typeof bairro === 'object' ? bairro.nome : bairro;
                  return (
                    <option key={index} value={nomeBairro}>
                      {nomeBairro}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input type="password" name="senha" value={form.senha} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
            </div>

            <button type="submit" className="w-full mt-4 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              Criar conta
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Ja possui uma conta? <button onClick={onNavigate} className="text-blue-600 font-medium hover:underline">Fazer login</button>
          </p>
        </div>
      </div>
    </div>
  );
}