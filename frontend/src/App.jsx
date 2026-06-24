import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Cadastro from './components/Cadastro.jsx';
import Dashboard from './components/Dashboard.jsx';
import RecuperarSenha from './components/RecuperarSenha.jsx';
import RedefinirSenha from './components/RedefinirSenha.jsx';
import Configuracoes from './components/Configuracoes.jsx';
import Ocorrencias from './components/Ocorrencias.jsx';
import OrdensServico from './components/OrdensServico.jsx';
import Relatorios from './components/Relatorios.jsx';
import { isFuncionario } from './api.js';

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [tokenRecuperacao, setTokenRecuperacao] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');

    if (tokenUrl) {
      setTokenRecuperacao(tokenUrl);
      setTelaAtual('redefinir-senha');
      window.history.replaceState({}, document.title, '/');
    } else if (token) {
      setTelaAtual('dashboard');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setTelaAtual('login');
  };

  // Navegação com proteção: páginas restritas a funcionários
  const handleNavigate = (tela) => {
    const rotasFuncionario = ['ordens', 'relatorios'];
    if (rotasFuncionario.includes(tela) && !isFuncionario()) {
      // Cidadão tentando acessar rota restrita → redireciona pro dashboard
      setTelaAtual('dashboard');
      return;
    }
    setTelaAtual(tela);
  };

  const commonProps = { onLogout: handleLogout, onNavigate: handleNavigate };

  return (
    <>
      {telaAtual === 'login' && (
        <Login
          onNavigate={() => setTelaAtual('cadastro')}
          onNavigateRecuperar={() => setTelaAtual('recuperar')}
          onLoginSuccess={() => setTelaAtual('dashboard')}
        />
      )}
      {telaAtual === 'cadastro' && <Cadastro onNavigate={() => setTelaAtual('login')} />}
      {telaAtual === 'recuperar' && <RecuperarSenha onNavigateLogin={() => setTelaAtual('login')} />}
      {telaAtual === 'redefinir-senha' && (
        <RedefinirSenha tokenRecuperacao={tokenRecuperacao} onNavigateLogin={() => setTelaAtual('login')} />
      )}
      {telaAtual === 'dashboard' && <Dashboard {...commonProps} />}
      {telaAtual === 'ocorrencias' && <Ocorrencias {...commonProps} />}
      {telaAtual === 'configuracoes' && <Configuracoes {...commonProps} />}
      {telaAtual === 'ordens' && <OrdensServico {...commonProps} />}
      {telaAtual === 'relatorios' && <Relatorios {...commonProps} />}
    </>
  );
}

export default App;