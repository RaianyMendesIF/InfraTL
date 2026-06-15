from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from models.model import Funcionario


class DashboardController:
    @staticmethod
    async def obter_indicadores(session: Session, usuario_atual):
        # 1. Validação de cargo: Apenas 'Gestor' tem acesso
        funcionario_atual = (
            session.query(Funcionario)
            .filter(Funcionario.id_usuario == usuario_atual.id)
            .first()
        )

        if not funcionario_atual or funcionario_atual.cargo != "Gestor":
            raise HTTPException(
                status_code=403,
                detail="Acesso negado. Apenas Gestores podem visualizar os indicadores da prefeitura.",
            )

        try:
            # 2. Busca os dados consolidados na View que já existe no seu banco de dados
            query = text("SELECT * FROM vw_stats_dashboard")
            resultado = session.execute(query).fetchone()

            if not resultado:
                raise HTTPException(
                    status_code=404, detail="Nenhum dado encontrado para o dashboard."
                )

            # 3. Retorna os dados formatados
            return {
                "success": True,
                "indicadores": {
                    "total_em_analise": resultado.total_em_analise,
                    "total_pendente": resultado.total_pendente,
                    "total_em_execucao": resultado.total_em_execucao,
                    "total_finalizado": resultado.total_finalizado,
                    "total_arquivado": resultado.total_arquivado,
                    "total_geral": resultado.total_geral,
                    "tempo_medio_resolucao_horas": (
                        float(resultado.tempo_medio_resolucao_horas)
                        if resultado.tempo_medio_resolucao_horas
                        else 0.0
                    ),
                },
            }

        except Exception as e:
            print(f"ERRO AO CARREGAR DASHBOARD: {e}")
            raise HTTPException(
                status_code=500, detail=f"Erro interno no servidor: {e}"
            )
