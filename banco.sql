CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
-- PostGIS: habilita tipos geográficos nativos (GEOGRAPHY, ST_DWithin, ST_Distance...)
-- Necessário para armazenar coordenadas e fazer buscas por proximidade
-- Instalação no servidor: sudo apt install postgresql-<versao>-postgis-3
-- No Supabase e Neon já vem habilitado por padrão
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Tipos de usuário no sistema
CREATE TYPE tipo_usuario_enum   AS ENUM ('Usuario', 'Admin');

-- Cargo específico dos funcionários
CREATE TYPE cargo_enum          AS ENUM ('Agente', 'Gestor');

-- Ciclo de vida de uma ocorrência (RF07)
-- Em_Analise: recém criada, aguardando triagem
-- Pendente:   aprovada pela prefeitura, aguardando execução
-- Em_Execucao: equipe de rua iniciou o trabalho
-- Finalizado: problema resolvido
-- Arquivado:  reprovada na triagem (com justificativa)
CREATE TYPE status_ocorrencia_enum AS ENUM (
    'Em_Analise',
    'Pendente',
    'Em_Execucao',
    'Finalizado',
    'Arquivado'
);

-- Nível de urgência (RF08)
CREATE TYPE urgencia_enum AS ENUM ('Baixa', 'Media', 'Alta', 'Critica');

-- Status da fila de e-mails (RF11)
CREATE TYPE status_email_enum AS ENUM ('Pendente', 'Enviado', 'Erro');

-- TABELAS DE CATÁLOGO
-- Dados de referência que raramente mudam.
-- Populadas pelo administrador do sistema.

-- Bairros de Três Lagoas-MS (RF03, RF05)
-- A coluna regiao permite filtros por zona (Norte, Sul, Centro...)
CREATE TABLE bairro (
    id      SERIAL       PRIMARY KEY,
    nome    VARCHAR(100) NOT NULL UNIQUE
                         CHECK (LENGTH(TRIM(nome)) >= 2),
    regiao  VARCHAR(100)
);

-- Categorias de serviço (RF03, RF05)
-- Ex: "Buraco em via pública", "Iluminação pública", "Limpeza de terreno"
-- prazo_estimado_dias: meta de resolução para cálculo de SLA no dashboard
CREATE TABLE servico (
    id                   SERIAL       PRIMARY KEY,
    nome                 VARCHAR(100) NOT NULL UNIQUE
                                      CHECK (LENGTH(TRIM(nome)) >= 3),
    descricao            TEXT,
    prazo_estimado_dias  SMALLINT     CHECK (prazo_estimado_dias > 0),
    ativo                BOOLEAN      NOT NULL DEFAULT TRUE
);

-- TABELAS DE AUTENTICAÇÃO

CREATE TABLE endereco ( 
    id                SERIAL          PRIMARY KEY,

    -- Endereço formatado retornado pelo Nominatim (ex: "Rua das Flores, 123, Centro, Três Lagoas")
    -- Armazenamos a string completa para exibição e para auditoria do que o usuário confirmou
    endereco_completo VARCHAR(500),

    -- Campos individuais para filtros e exibição granular
    rua               VARCHAR(200),
    numero            VARCHAR(20),
    complemento       VARCHAR(100),
    id_bairro         INT             NOT NULL REFERENCES bairro (id),

    -- Coordenadas geográficas retornadas pelo Nominatim
    -- GEOGRAPHY(POINT, 4326): ponto no sistema WGS-84 (o mesmo do GPS e do Google Maps)
    -- SRID 4326 = padrão mundial de latitude/longitude
    -- NULL quando o usuário preencheu manualmente sem confirmação do mapa (fallback)
    coordenadas       GEOGRAPHY(POINT, 4326) DEFAULT NULL,

    -- Colunas auxiliares para leitura rápida sem precisar decompor a GEOGRAPHY
    -- (útil para o FastAPI serializar em JSON sem depender do PostGIS no ORM)
    latitude          NUMERIC(10, 7)  DEFAULT NULL
                                      CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
    longitude         NUMERIC(10, 7)  DEFAULT NULL
                                      CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    -- Garante que lat e lon são sempre preenchidas juntas ou deixadas juntas como NULL
    CONSTRAINT chk_coordenadas_par CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL)
    ),

    -- Fonte da localização: útil para saber a confiabilidade da coordenada
    -- 'gps'       → capturado pelo GPS do celular do cidadão
    -- 'nominatim' → buscado via digitação e confirmado no mapa
    -- 'manual'    → digitado sem confirmação geográfica (fallback)
    fonte_localizacao VARCHAR(20)     DEFAULT 'manual'
                                      CHECK (fonte_localizacao IN ('gps', 'nominatim', 'manual'))
);

CREATE INDEX idx_endereco_bairro ON endereco (id_bairro);

-- Índice espacial GIST: acelera consultas de proximidade (ST_DWithin, ST_Distance)
-- Sem este índice, buscas geográficas fazem full scan na tabela
CREATE INDEX idx_endereco_coordenadas ON endereco USING GIST (coordenadas)
    WHERE coordenadas IS NOT NULL;


-- Base de todos os usuários do sistema.
-- Centraliza login para que cidadão e funcionário usem o mesmo fluxo JWT.
CREATE TABLE usuario ( 
    id            SERIAL              PRIMARY KEY,
    nome          VARCHAR(100)        NOT NULL
                                      CHECK (LENGTH(TRIM(nome)) >= 3),
    cpf              CHAR(11)    NOT NULL UNIQUE
                                 CHECK (cpf ~ '^[0-9]{11}$'),
    telefone         VARCHAR(15)
                                 CHECK (telefone IS NULL OR telefone ~ '^[0-9]{10,15}$'),
    data_nascimento  DATE        NOT NULL
                                 CHECK (data_nascimento <= CURRENT_DATE - INTERVAL '16 years'),
    email         CITEXT              NOT NULL UNIQUE
                                      CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
    -- Apenas hashes bcrypt são aceitos. O FastAPI usa passlib[bcrypt] para gerá-los.
    -- Nunca armazene a senha em texto puro — a constraint rejeita qualquer outro formato.
    senha_hash    VARCHAR(255)        NOT NULL
                                      CHECK (senha_hash ~* '^\$2[ab]?\$[0-9]{2}\$.{53}$'),
    id_endereco   INT   NOT NULL REFERENCES endereco(id) ON DELETE RESTRICT,
    tipo_usuario  tipo_usuario_enum   NOT NULL,
    ativo         BOOLEAN             NOT NULL DEFAULT TRUE,
    -- Proteção contra força bruta (o trigger fn_controle_tentativas_login gerencia estes campos)
    tentativas_login  SMALLINT        NOT NULL DEFAULT 0 CHECK (tentativas_login >= 0),
    bloqueado_ate     TIMESTAMPTZ     DEFAULT NULL,
    -- Auditoria
    criado_em     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_ativo ON usuario (ativo) WHERE ativo = TRUE;
CREATE INDEX idx_usuario_endereco ON usuario (id_endereco);

-- Dados exclusivos dos funcionários públicos (RF02)
CREATE TABLE funcionario (
    id_usuario  INT         PRIMARY KEY
                            REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE CASCADE,
    matricula   VARCHAR(100) NOT NULL UNIQUE
                             CHECK (LENGTH(TRIM(matricula)) >= 4),
    cargo       cargo_enum  NOT NULL
);
CREATE INDEX idx_funcionario_matricula ON funcionario (matricula);


-- TABELAS DE NEGÓCIO

-- Endereço detalhado de uma ocorrência com suporte a geolocalização (Opção C).
--
-- FLUXO NO FRONT-END (React):
--   1. Usuário digita o endereço ou clica "Usar minha localização" (GPS)
--   2. O React chama a API do Nominatim (gratuita, OpenStreetMap):
--      GET https://nominatim.openstreetmap.org/search?q=<endereco>&format=json&limit=1
--   3. O Nominatim retorna lat, lon e o endereço já formatado e padronizado
--   4. O React exibe um mapa de confirmação (ex: react-leaflet) e envia ao FastAPI:
--      { lat, lon, endereco_completo, rua, numero, complemento, id_bairro }
--   5. O FastAPI salva tudo nesta tabela
--
-- FALLBACK: se o Nominatim não encontrar o endereço (rua muito nova, área rural etc.),
--   o usuário pode digitar manualmente — lat e lon ficam NULL.
--   A ocorrência é registrada normalmente, sem coordenadas.
--
-- VANTAGENS das coordenadas armazenadas:
--   - Dashboard pode mostrar as ocorrências em um mapa real (ex: react-leaflet)
--   - Possibilidade futura de busca por proximidade (ST_DWithin)
--   - Cálculo de rotas para as equipes de campo


-- Ocorrência registrada por um cidadão (RF03, RF04, RF05, RF06, RF07, RF08)
-- Esta é a tabela central do sistema.
CREATE TABLE ocorrencia (
    id              SERIAL                  PRIMARY KEY,
    titulo          VARCHAR(100)            NOT NULL
                                            CHECK (LENGTH(TRIM(titulo)) >= 5),
    descricao       VARCHAR(300)            NOT NULL
                                            CHECK (LENGTH(TRIM(descricao)) >= 10),
    status          status_ocorrencia_enum  NOT NULL DEFAULT 'Em_Analise',
    urgencia        urgencia_enum           DEFAULT NULL, -- preenchida pelo funcionário (RF08)
    justificativa   VARCHAR(300)            DEFAULT NULL, -- obrigatória ao arquivar

    -- Datas do ciclo de vida (usadas para cálculo de SLA e métricas no dashboard)
    data_abertura   TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    data_fechamento TIMESTAMPTZ             DEFAULT NULL,

    -- Relações
    id_usuario      INT                     NOT NULL
                                            REFERENCES usuario (id) ON DELETE RESTRICT,
    id_servico      INT                     NOT NULL
                                            REFERENCES servico (id),
    id_endereco     INT                     NOT NULL
                                            REFERENCES endereco (id),

    -- Rastreamento de quem tocou na ocorrência (RF06, RF07)

    id_agente_analise    INT                DEFAULT NULL REFERENCES funcionario (id_usuario),
    id_agente_triagem    INT                DEFAULT NULL REFERENCES funcionario (id_usuario),
    id_agente_execucao   INT                DEFAULT NULL REFERENCES funcionario (id_usuario),
    id_agente_finalizado INT                DEFAULT NULL REFERENCES funcionario (id_usuario),
    
    -- Constraint: data de fechamento só pode existir após a abertura
    CONSTRAINT chk_datas CHECK (data_fechamento IS NULL OR data_fechamento >= data_abertura),

    -- Constraint: justificativa obrigatória ao arquivar
    CONSTRAINT chk_justificativa CHECK (
        status <> 'Arquivado' OR (justificativa IS NOT NULL AND LENGTH(TRIM(justificativa)) >= 5)
    )
);

-- Índices para os filtros do dashboard (RF05) e para garantir RNF01 (< 200ms)
CREATE INDEX idx_ocorrencia_status   ON ocorrencia (status);
CREATE INDEX idx_ocorrencia_usuario  ON ocorrencia (id_usuario);
CREATE INDEX idx_ocorrencia_servico  ON ocorrencia (id_servico);
CREATE INDEX idx_ocorrencia_endereco ON ocorrencia (id_endereco);
CREATE INDEX idx_ocorrencia_abertura ON ocorrencia (data_abertura DESC);

-- Índice parcial: lista de triagem do dashboard (apenas ocorrências novas, sem varrer a tabela inteira)
CREATE INDEX idx_ocorrencia_triagem ON ocorrencia (data_abertura)
    WHERE status = 'Em_Analise';

-- Histórico de mudanças de status de uma ocorrência (RF07, RF09)
-- Cada linha = uma transição. Imutável: não permitimos UPDATE nem DELETE nesta tabela.
-- Isso garante um audit trail completo do ciclo de vida.
CREATE TABLE historico_ocorrencia (
    id              BIGSERIAL               PRIMARY KEY,
    id_ocorrencia   INT                     NOT NULL
                                            REFERENCES ocorrencia (id) ON DELETE CASCADE,
    status_anterior status_ocorrencia_enum  DEFAULT NULL, -- NULL = criação inicial
    status_novo     status_ocorrencia_enum  NOT NULL,
    mensagem        VARCHAR(300),           -- nota do funcionário ou do sistema
    alterado_por    INT                     REFERENCES usuario (id) ON DELETE SET NULL,
    criado_em       TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_historico_ocorrencia ON historico_ocorrencia (id_ocorrencia, criado_em DESC);

-- Fotos vinculadas a uma ocorrência (RF03)
-- Uma ocorrência pode ter múltiplas fotos (no mínimo uma, validado pela aplicação).
-- A URL aponta para o storage externo (ex: Supabase Storage, S3).
CREATE TABLE foto_ocorrencia (
    id             BIGSERIAL    PRIMARY KEY,
    id_ocorrencia  INT          NOT NULL
                                REFERENCES ocorrencia (id) ON DELETE CASCADE,
    url            VARCHAR(500) NOT NULL
                                CHECK (url ~* '^https?://'),  -- apenas URLs absolutas
    ordem          SMALLINT     NOT NULL DEFAULT 1,           -- para exibir na ordem certa
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_foto_ocorrencia ON foto_ocorrencia (id_ocorrencia);


-- TABELA DE SUPORTE: FILA DE E-MAILS

-- RF11: o sistema deve disparar e-mail ao cidadão em cada mudança de status.
-- Usamos uma tabela de fila (outbox pattern) em vez de enviar na hora:
--   - Desacopla o envio do fluxo principal (a ocorrência é salva mesmo se o e-mail falhar)
--   - Permite reenvio em caso de erro sem perder histórico
--   - O FastAPI tem uma task assíncrona (ex: BackgroundTask ou APScheduler) que lê esta tabela

CREATE TABLE email_notificacao (
    id             BIGSERIAL         PRIMARY KEY,
    id_usuario     INT               NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    id_ocorrencia  INT               REFERENCES ocorrencia (id) ON DELETE SET NULL,
    assunto        VARCHAR(200)      NOT NULL,
    corpo          TEXT              NOT NULL,
    status         status_email_enum NOT NULL DEFAULT 'Pendente',
    tentativas     SMALLINT          NOT NULL DEFAULT 0,
    -- Mensagem de erro do servidor SMTP (para diagnóstico)
    erro_detalhe   TEXT              DEFAULT NULL,
    criado_em      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    enviado_em     TIMESTAMPTZ       DEFAULT NULL
);

-- Índice para a task de envio: busca apenas os pendentes em ordem de chegada
CREATE INDEX idx_email_pendente ON email_notificacao (criado_em)
    WHERE status = 'Pendente';


-- TABELAS DE SEGURANÇA

-- Registro imutável de todas as tentativas de login (auditoria, RNF05)
CREATE TABLE log_acesso (
    id            BIGSERIAL    PRIMARY KEY,
    id_usuario    INT          REFERENCES usuario (id) ON DELETE SET NULL,
    -- Hash SHA-256 do IP — não guardamos o IP direto (LGPD, RNF06)
    ip_hash       VARCHAR(64),
    sucesso       BOOLEAN      NOT NULL,
    motivo_falha  VARCHAR(100),
    criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_log_usuario   ON log_acesso (id_usuario);
CREATE INDEX idx_log_criado_em ON log_acesso (criado_em DESC);

-- Controle de sessões JWT (permite logout real e revogação de tokens)
-- Guardamos o hash do token, nunca o token em si
CREATE TABLE refresh_token (
    id           BIGSERIAL    PRIMARY KEY,
    id_usuario   INT          NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL UNIQUE,
    criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expira_em    TIMESTAMPTZ  NOT NULL,
    revogado     BOOLEAN      NOT NULL DEFAULT FALSE,
    revogado_em  TIMESTAMPTZ  DEFAULT NULL,
    CONSTRAINT chk_expiracao CHECK (expira_em > criado_em)
);
CREATE INDEX idx_refresh_usuario ON refresh_token (id_usuario);
CREATE INDEX idx_refresh_hash    ON refresh_token (token_hash);

-- Índice parcial: a task de limpeza só precisa varrer tokens não revogados e expirados
CREATE INDEX idx_refresh_expirado ON refresh_token (expira_em)
    WHERE revogado = FALSE;


-- 7. VIEWS
-- Consultas pré-montadas para o dashboard e para o front-end.
-- Evitam JOINs repetitivos no FastAPI e centralizam a lógica de leitura.

-- View do dashboard (RF09): totais para os indicadores visuais
-- Pode ser materializada (MATERIALIZED VIEW) em produção para ganho de performance
CREATE VIEW vw_stats_dashboard AS
SELECT
    COUNT(*) FILTER (WHERE status = 'Em_Analise')   AS total_em_analise,
    COUNT(*) FILTER (WHERE status = 'Pendente')      AS total_pendente,
    COUNT(*) FILTER (WHERE status = 'Em_Execucao')   AS total_em_execucao,
    COUNT(*) FILTER (WHERE status = 'Finalizado')    AS total_finalizado,
    COUNT(*) FILTER (WHERE status = 'Arquivado')     AS total_arquivado,
    COUNT(*)                                          AS total_geral,
    -- Tempo médio de resolução (em horas) — métrica de eficiência
    ROUND(
        AVG(
            EXTRACT(EPOCH FROM (data_fechamento - data_abertura)) / 3600.0
        ) FILTER (WHERE status = 'Finalizado' AND data_fechamento IS NOT NULL)
    , 1) AS tempo_medio_resolucao_horas
FROM ocorrencia;

-- View por bairro (RF05): para filtro e mapa de calor no dashboard
CREATE VIEW vw_ocorrencias_por_bairro AS
SELECT
    b.id                                                            AS id_bairro,
    b.nome                                                          AS bairro,
    b.regiao,
    COUNT(*)                                                        AS total,
    COUNT(*) FILTER (WHERE o.status = 'Finalizado')                AS resolvidas,
    COUNT(*) FILTER (WHERE o.status NOT IN ('Finalizado','Arquivado')) AS abertas
FROM ocorrencia o
JOIN endereco e  ON e.id = o.id_endereco
JOIN bairro b    ON b.id = e.id_bairro
GROUP BY b.id, b.nome, b.regiao;

-- View pública de ocorrências (RF04, RF05):
-- Expõe os dados necessários para o front-end do cidadão e do dashboard
-- SEM expor CPF, e-mail ou outros dados pessoais (RNF06 / LGPD)
CREATE VIEW vw_ocorrencias_publicas AS
SELECT
    o.id,
    o.titulo,
    o.descricao,
    o.status,
    o.urgencia,
    o.data_abertura,
    o.data_fechamento,
    -- Dados de localização (sem dados pessoais do cidadão)
    b.nome       AS bairro,
    b.regiao     AS regiao_bairro,
    e.rua,
    e.numero,
    e.endereco_completo,
    -- Coordenadas para o mapa do front-end e do dashboard
    -- Retornamos lat/lon como números simples (mais fácil de usar no React/Leaflet)
    e.latitude,
    e.longitude,
    e.fonte_localizacao,
    -- Categoria do problema
    s.nome       AS servico,
    -- Primeira foto (para listagem)
    (SELECT url FROM foto_ocorrencia f WHERE f.id_ocorrencia = o.id ORDER BY f.ordem LIMIT 1) AS foto_capa,
    -- Tempo decorrido desde a abertura (em dias)
    EXTRACT(DAY FROM NOW() - o.data_abertura)::INT AS dias_aberta
FROM ocorrencia o
JOIN endereco e  ON e.id = o.id_endereco
JOIN bairro b    ON b.id = e.id_bairro
JOIN servico s   ON s.id = o.id_servico
WHERE o.status <> 'Arquivado'; -- ocorrências arquivadas não aparecem publicamente


-- 8. FUNÇÕES E TRIGGERS

-- 8.1 Atualiza atualizado_em automaticamente em qualquer UPDATE na tabela usuario
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuario_atualizado_em
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- 8.3 Controle de tentativas de login (proteção contra força bruta)
-- Acionado automaticamente pelo trigger abaixo ao inserir em log_acesso.
-- Após 5 falhas consecutivas, bloqueia a conta por 15 minutos.
CREATE OR REPLACE FUNCTION fn_controle_tentativas_login()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.sucesso = FALSE AND NEW.id IS NOT NULL THEN
        UPDATE usuario
        SET
            tentativas_login = tentativas_login + 1,
            bloqueado_ate = CASE
                WHEN tentativas_login + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE bloqueado_ate
            END
        WHERE id = NEW.id_usuario;
    END IF;

    IF NEW.sucesso = TRUE AND NEW.id IS NOT NULL THEN
        UPDATE usuario
        SET tentativas_login = 0,
            bloqueado_ate = NULL
        WHERE id = NEW.id_usuario;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_controle_tentativas
    AFTER INSERT ON log_acesso
    FOR EACH ROW EXECUTE FUNCTION fn_controle_tentativas_login();


-- 8.4 Máquina de estados das ocorrências
-- Garante que o status só avance em transições válidas.
-- Impede que um cidadão mude status de "Em_Execucao" para "Pendente", por exemplo.
CREATE OR REPLACE FUNCTION fn_validar_transicao_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Só age se o status mudou
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Tabela de transições permitidas
    IF NOT (
        (OLD.status = 'Em_Analise'  AND NEW.status IN ('Pendente', 'Arquivado'))  OR
        (OLD.status = 'Pendente'    AND NEW.status = 'Em_Execucao')               OR
        (OLD.status = 'Em_Execucao' AND NEW.status = 'Finalizado')
    ) THEN
        RAISE EXCEPTION
            'TRANSIÇÃO INVÁLIDA: % → % não é permitida.',
            OLD.status, NEW.status;
    END IF;

    -- Ao finalizar, registra a data de fechamento automaticamente
    IF NEW.status = 'Finalizado' THEN
        NEW.data_fechamento = NOW();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_transicao_status
    BEFORE UPDATE OF status ON ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_validar_transicao_status();


-- 8.5 Auditoria automática do histórico de ocorrências
-- Toda mudança de status gera um registro imutável em historico_ocorrencia.
-- O FastAPI não precisa fazer isso manualmente — o banco garante.
CREATE OR REPLACE FUNCTION fn_registrar_historico()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO historico_ocorrencia
            (id_ocorrencia, status_anterior, status_novo, mensagem)
        VALUES
            (NEW.id, OLD.status, NEW.status,
             'Status alterado de ' || OLD.status || ' para ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_registrar_historico
    AFTER UPDATE OF status ON ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_registrar_historico();


-- 8.6 Enfileira e-mail de notificação ao cidadão (RF11)
-- Acionado automaticamente sempre que o status de uma ocorrência muda.
-- Insere na fila email_notificacao — o FastAPI processa a fila de forma assíncrona.
CREATE OR REPLACE FUNCTION fn_enfileirar_email_notificacao()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_email_usuario  TEXT;
    v_titulo_occ     TEXT;
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    SELECT u.email, o.titulo
    INTO v_email_usuario, v_titulo_occ
    FROM ocorrencia o
    JOIN usuario u ON u.id = o.id_usuario
    WHERE o.id = NEW.id;

    INSERT INTO email_notificacao (id_usuario, id_ocorrencia, assunto, corpo)
    SELECT
        NEW.id_usuario,
        NEW.id,
        'Infra TL: atualização na sua ocorrência #' || NEW.id,
        'Olá! O status da sua ocorrência "' || v_titulo_occ || '" foi atualizado para: ' || NEW.status || '.';

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_notificacao
    AFTER UPDATE OF status ON ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_enfileirar_email_notificacao();


-- 8.7 Impede UPDATE e DELETE no histórico (audit trail imutável)
CREATE OR REPLACE FUNCTION fn_bloquear_alteracao_historico()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' AND
       current_setting('app.allow_historico_delete', TRUE) = 'true' THEN
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'O histórico de ocorrências é imutável e não pode ser alterado ou excluído.';
END;
$$;

CREATE TRIGGER trg_historico_imutavel
    BEFORE UPDATE OR DELETE ON historico_ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao_historico();


-- 8.8 Sincroniza a coluna GEOGRAPHY(coordenadas) a partir de latitude/longitude
-- O FastAPI envia lat e lon como números simples (mais fácil de serializar em JSON).
-- Este trigger constrói o ponto geográfico automaticamente no banco,
-- sem que o FastAPI precise conhecer a sintaxe do PostGIS.
CREATE OR REPLACE FUNCTION fn_sincronizar_coordenadas()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        -- ST_MakePoint(longitude, latitude) — PostGIS usa a ordem (x=lon, y=lat)
        -- ST_SetSRID define o sistema de referência WGS-84 (SRID 4326)
        -- ::GEOGRAPHY converte de GEOMETRY para GEOGRAPHY (precisão em metros)
        NEW.coordenadas = ST_SetSRID(
            ST_MakePoint(NEW.longitude, NEW.latitude),
            4326
        )::GEOGRAPHY;
    ELSE
        NEW.coordenadas = NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sincronizar_coordenadas
    BEFORE INSERT OR UPDATE OF latitude, longitude ON endereco
    FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_coordenadas();

-- 8.9 Atualiza tipo_usuario automaticamente em INSERT na tabela FUNCIONARIO
CREATE OR REPLACE FUNCTION fn_set_tipo_usuario()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Atualiza a tabela usuario baseada no id inserido na tabela funcionario
    UPDATE usuario 
    SET tipo_usuario = 'Admin'  
    WHERE id = NEW.id_usuario;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_tipo_usuario_atualizado
    AFTER INSERT ON funcionario
    FOR EACH ROW 
    EXECUTE FUNCTION fn_set_tipo_usuario();

--8.10 - altera o tipo_usuario quando não é mais admin
CREATE OR REPLACE FUNCTION trg_rebaixar_usuario_desligado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Quando o funcionário for apagado, volta o usuário para o nível comum
    UPDATE usuario 
    SET tipo_usuario = 'Usuario' 
    WHERE id = OLD.id_usuario;

    RETURN OLD;
END;
$$;

CREATE TRIGGER tg_funcionario_deletado
AFTER DELETE ON funcionario
FOR EACH ROW
EXECUTE FUNCTION trg_rebaixar_usuario_desligado();

-- ROW LEVEL SECURITY (RLS) E ROLES

-- Ativa RLS nas tabelas sensíveis
ALTER TABLE usuario           ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencia        ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_token     ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notificacao ENABLE ROW LEVEL SECURITY;

-- O FastAPI deve executar antes de cada operação:
--   SET LOCAL app.usuario_id = '<id>';
--   SET LOCAL app.tipo_usuario = '<tipo>';

-- Cidadão vê apenas seus próprios dados
CREATE POLICY pol_usuario_proprio ON usuario
    FOR SELECT
    USING (id = current_setting('app.usuario_id', TRUE)::INT);
    
-- Cidadão vê e cria apenas suas próprias ocorrências
CREATE POLICY pol_ocorrencia_usuario ON ocorrencia
    FOR ALL
    USING (
        id_usuario = current_setting('app.usuario_id', TRUE)::INT
        OR current_setting('app.tipo_usuario', TRUE) IN ('Agente', 'Gestor')
    );

-- Notificações: cada usuário vê apenas as suas
CREATE POLICY pol_email_proprio ON email_notificacao
    FOR SELECT
    USING (id_usuario = current_setting('app.usuario_id', TRUE)::INT);

-- Tokens: cada usuário gerencia apenas os seus
CREATE POLICY pol_refresh_proprio ON refresh_token
    FOR ALL
    USING (id_usuario = current_setting('app.usuario_id', TRUE)::INT);


-- Roles de banco (princípio do menor privilégio)

-- Role da aplicação FastAPI: leitura e escrita, sem DROP/DELETE em tabelas críticas
CREATE ROLE infratl_app LOGIN PASSWORD 'TROQUE_EM_PRODUCAO_app';
GRANT CONNECT ON DATABASE postgres TO infratl_app;
GRANT USAGE   ON SCHEMA public TO infratl_app;
GRANT SELECT, INSERT, UPDATE ON TABLE
    usuario, usuario, funcionario,
    bairro, servico,
    endereco, ocorrencia, foto_ocorrencia,
    email_notificacao,
    log_acesso, refresh_token
TO infratl_app;
-- Histórico: apenas INSERT (audit trail imutável)
GRANT INSERT, SELECT ON TABLE historico_ocorrencia TO infratl_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO infratl_app;
GRANT SELECT ON vw_stats_dashboard, vw_ocorrencias_por_bairro, vw_ocorrencias_publicas TO infratl_app;

-- Role somente leitura: para relatórios, BI, gestores externos
CREATE ROLE infratl_readonly LOGIN PASSWORD 'TROQUE_EM_PRODUCAO_readonly';
GRANT CONNECT ON DATABASE postgres TO infratl_readonly;
GRANT USAGE   ON SCHEMA public TO infratl_readonly;
GRANT SELECT  ON TABLE
    ocorrencia, historico_ocorrencia, bairro, servico,
    endereco, foto_ocorrencia
TO infratl_readonly;
GRANT SELECT ON vw_stats_dashboard, vw_ocorrencias_por_bairro, vw_ocorrencias_publicas TO infratl_readonly;


-- DADOS INICIAIS (seed)

-- Bairros de Três Lagoas-MS
INSERT INTO bairro (nome, regiao) VALUES
    ('Centro',          'Centro'),
    ('Santos Dumont',   'Norte'),
    ('Jardim Brasília', 'Sul'),
    ('Olímpio Belo',    'Leste'),
    ('Santa Luzia',     'Oeste'),
    ('Jardim Alvorada', 'Norte'),
    ('São Bento',       'Sul');

-- Categorias de serviço
INSERT INTO servico (nome, descricao, prazo_estimado_dias) VALUES
    ('Buraco em via pública',  'Buracos, crateras e irregularidades em asfalto ou calçada', 15),
    ('Iluminação pública',     'Lâmpada queimada ou poste danificado',                      7),
    ('Limpeza de terreno',     'Terreno baldio com mato alto ou acúmulo de lixo',           10),
    ('Coleta de entulho',      'Descarte irregular de entulho e materiais de construção',   5),
    ('Árvore e poda',          'Árvore com risco de queda ou galhos obstruindo via',        10),
    ('Sinalização',            'Placa danificada, faixa apagada ou sinal com defeito',      12),
    ('Esgoto',                 'Vazamento ou bueiro entupido',                               3);

-- senha: 12345678
INSERT INTO endereco (endereco_completo, rua, numero, complemento, id_bairro, latitude, longitude, fonte_localizacao) VALUES (
    'Rua Maria Guilhermina Esteves, 947 - Santos Dumont, Três Lagoas - MS','Rua Maria Guilhermina Esteves', '947', 'Esquina com a mercearia', 2, NULL, NULL, 'manual');

INSERT INTO usuario (nome, cpf, telefone, data_nascimento, email, senha_hash, tipo_usuario, id_endereco) VALUES 
('Mariana Silva', '12345678901', '11999998888', '1985-04-12', 'mariana@email.com', '$2a$12$OXQJg/w.z3OP0.V94mKJAeelPGZdkhSFihNDJ0lNIEYGm.gqtp2fu', 'Usuario', 1),
('Carlos Souza', '23456789012', '11988887777', '1990-08-23', 'carlos.agente@prefeitura.gov.br', '$2a$12$OXQJg/w.z3OP0.V94mKJAeelPGZdkhSFihNDJ0lNIEYGm.gqtp2fu', 'Admin', 1),
('Ana Costa', '34567890123', '11977776666', '1995-12-05', 'ana.gestora@prefeitura.gov.br', '$2a$12$OXQJg/w.z3OP0.V94mKJAeelPGZdkhSFihNDJ0lNIEYGm.gqtp2fu', 'Admin', 1);

INSERT INTO funcionario (id_usuario, matricula, cargo) VALUES
    ((SELECT id FROM usuario WHERE email = 'carlos.agente@prefeitura.gov.br'), 'PMT-2024-002', 'Agente'),
    ((SELECT id FROM usuario WHERE email = 'ana.gestora@prefeitura.gov.br'),   'PMT-2024-001', 'Gestor');