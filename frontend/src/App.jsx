import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Cadastro from './components/Cadastro.jsx';
import Dashboard from './components/Dashboard.jsx';
import RecuperarSenha from './components/RecuperarSenha.jsx';
import RedefinirSenha from './components/RedefinirSenha.jsx';
import Configuracoes from './components/Configuracoes.jsx';
import Ocorrencias from './components/Ocorrencias.jsx';

function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [tokenRecuperacao, setTokenRecuperacao] = useState(null);

  useEffect(() => {
    // Verifica se tem token normal de sessão
    const token = localStorage.getItem('token');
    
    // Verifica se tem token de recuperação na URL (ex: ?token=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenUrl = urlParams.get('token');

    if (tokenUrl) {
      setTokenRecuperacao(tokenUrl);
      setTelaAtual('redefinir-senha');
      // Limpa a URL visualmente
      window.history.replaceState({}, document.title, "/"); 
    } else if (token) {
      setTelaAtual('dashboard');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setTelaAtual('login');
  };

  return (
    <>
      {telaAtual === 'login' && 
        <Login 
          onNavigate={() => setTelaAtual('cadastro')} 
          onNavigateRecuperar={() => setTelaAtual('recuperar')}
          onLoginSuccess={() => setTelaAtual('dashboard')} 
        />}
      {telaAtual === 'cadastro' && <Cadastro onNavigate={() => setTelaAtual('login')} />}
      {telaAtual === 'recuperar' && <RecuperarSenha onNavigateLogin={() => setTelaAtual('login')} />}
      {telaAtual === 'redefinir-senha' && <RedefinirSenha tokenRecuperacao={tokenRecuperacao} onNavigateLogin={() => setTelaAtual('login')} />}
      {telaAtual === 'dashboard' && <Dashboard onLogout={handleLogout} onNavigate={setTelaAtual} />}
      {telaAtual === 'configuracoes' && <Configuracoes onLogout={handleLogout} onNavigate={setTelaAtual} />}
      {telaAtual === 'ocorrencias' && <Ocorrencias onLogout={handleLogout} onNavigate={setTelaAtual} />}
    </>
  );
}

export default App;