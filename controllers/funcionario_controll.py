from fastapi import FastAPI, HTTPException
from sqlalchemy import func, delete
from sqlalchemy.orm import Session
from models.model import Usuario, Funcionario
from schemas.funcionario_schemas import Funcionario_Schema_listar

class FuncionarioController:
    @staticmethod
    async def adicionar(dados, session, usuario_atual):
        funcionario_atual = session.query(Funcionario).filter(Funcionario.id_usuario == usuario_atual.id).first()

        if funcionario_atual.cargo == "Agente":
            raise HTTPException(status_code=400, detail="Usuário não tem permissão de realizar essa requisição!")

        funcionario = session.query(Funcionario).filter(Funcionario.id_usuario == dados.id_usuario).first()

        if funcionario:
            raise HTTPException(status_code=401, detail="Usuário já é admin")

        usuario = session.query(Usuario).filter(Usuario.id == dados.id_usuario).first()

        if usuario:
            novo_funcionario = Funcionario(
                id_usuario=dados.id_usuario,  
                matricula=dados.matricula,     
                cargo=dados.cargo              
            )
            
            session.add(novo_funcionario)
            session.commit()
            session.refresh(novo_funcionario)

            return {"sucess": True, "mensagem": f"Tipo do usuário {usuario.nome} alterado para {novo_funcionario.cargo} com sucesso!"}
        raise HTTPException(status_code=401, detail="Usuário não identificado!")

    @staticmethod
    async def remover(dados, session, usuario_atual):
        funcionario_atual = session.query(Funcionario).filter(Funcionario.id_usuario == usuario_atual.id).first()

        if funcionario_atual.cargo == "Agente":
            raise HTTPException(status_code=400, detail="Usuário não tem permissão de realizar essa requisição!")

        funcionario = session.query(Funcionario).filter(Funcionario.id_usuario == dados.id_usuario).first()

        if funcionario:

            usuario = session.query(Usuario).filter(Usuario.id == dados.id_usuario).first()

            if usuario:
                stmt = delete(Funcionario).where(Funcionario.id_usuario == usuario.id)
                resultado = session.execute(stmt)
                
                session.commit()
                return {"sucess": True, "mensagem": f"Tipo do usuário {usuario.nome} alterado para Usuario com sucesso!"}
        
        raise HTTPException(status_code=401, detail="Funcionário não encontrado!")
        
    @staticmethod
    async def listar_funcionarios(session: Session):
        try:
            funcionarios = session.query(Funcionario).all()
            return {
                "success": True,
                "total": len(funcionarios),
                "funcionarios": [Funcionario_Schema_listar.model_validate(funcionario).model_dump() for funcionario in funcionarios]
            }
        except Exception as e:
             print(f"ERRO AO LISTAR FUNCIONÁRIOS: {e}")
             raise HTTPException(status_code=500, detail=f"Erro interno no servidor {e}")

    @staticmethod
    async def editar_funcionario(id, dados, session, usuario_atual):
        funcionario_atual = session.query(Funcionario).filter(Funcionario.id_usuario == usuario_atual.id).first()

        if funcionario_atual.cargo == "Agente":
            raise HTTPException(status_code=400, detail="Usuário não tem permissão de realizar essa requisição!")

        funcionario = session.query(Funcionario).filter(Funcionario.id_usuario == id).first()

        if funcionario:
            funcionario.matricula = dados.matricula
            funcionario.cargo = dados.cargo
            session.commit()
            return {"sucess": True, "mensagem": "Funcionário editado com sucesso!"}
        
        raise HTTPException(status_code=401, detail="Funcionário não encontrado!")