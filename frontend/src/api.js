// api.js — Ponto central para todas as chamadas ao backend InfraTL
// Troque BASE_URL se o backend mudar de endereço
export const BASE_URL = 'http://127.0.0.1:8000';

// Lê o token do localStorage
export const getToken = () => localStorage.getItem('token');

// Decodifica o payload do JWT sem biblioteca externa
export const decodeToken = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    let padded = base64;
    while (padded.length % 4) padded += '=';
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

// Lê os dados do usuário logado diretamente do token
export const getUsuarioLogado = () => {
  const token = getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  return {
    id: parseInt(payload.sub || 0),
    nome: payload.nome || `Usuário #${payload.sub}`,
    tipo: payload.tipo_usuario || 'Usuario', // "Usuario" | "Admin"
  };
};

// Retorna true se o usuário logado é funcionário (Admin)
export const isFuncionario = () => {
  const u = getUsuarioLogado();
  return u?.tipo === 'Admin';
};

// Helper: fetch autenticado (JSON)
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  return res;
};

// ── Rotas reais do backend ──────────────────────────────────────────

export const API = {
  // Auth
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return fetch(`${BASE_URL}/auth/conectar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
  },
  cadastrar: (payload) =>
    fetch(`${BASE_URL}/auth/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  recuperarSenha: (email) =>
    apiFetch('/auth/recuperar_senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  redefinirSenha: (nova_senha, confirmar_senha, token) =>
    fetch(`${BASE_URL}/auth/redefinir_senha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nova_senha, confirmar_senha }),
    }),

  // Bairros
  listarBairros: () => apiFetch('/bairros/listar'),

  // Serviços
  listarServicosAtivos: () => apiFetch('/servico/listar_ativos'),
  listarServicos: () => apiFetch('/servico/listar'),

  // Ocorrências
  // Cidadão vê só as dele; funcionário vê todas
  listarOcorrencias: () => {
    if (isFuncionario()) return apiFetch('/ocorrencia/listar');
    return apiFetch('/ocorrencia/minhas');
  },
  cadastrarOcorrencia: (payload) =>
    apiFetch('/ocorrencia/cadastrar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  avaliarOcorrencia: (id, payload) =>
    apiFetch(`/ocorrencia/${id}/avaliar`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  atualizarStatusOcorrencia: (id, status) =>
    apiFetch(`/ocorrencia/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Funcionários (Admin only)
  listarFuncionarios: () => apiFetch('/funcionario/listar'),
  adicionarFuncionario: (payload) =>
    apiFetch('/funcionario/adicionar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removerFuncionario: (id_usuario) =>
    apiFetch('/funcionario/remover', {
      method: 'DELETE',
      body: JSON.stringify({ id_usuario }),
    }),

  // Dashboard (Admin only)
  indicadoresDashboard: () => apiFetch('/dashboard/indicadores'),

  // Cidadãos (Admin only)
  listarCidadaos: () => apiFetch('/cidadao/listar_cidadoes'),
};