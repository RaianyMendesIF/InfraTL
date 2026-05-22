from fastapi import FastAPI, HTTPException
from sqlalchemy import func, delete
from sqlalchemy.orm import Session
from models.model import Usuario, Funcionario
from schemas.usuario_schemas import Usuario_response

class FuncionarioController:
    @staticmethod
    async def adicionar(dados, session, usuario_atual):
        funcionario_atual = session.query(Funcionario).filter(Funcionario.id_usuario == usuario_atual.id).first()

        if funcionario_atual.cargo is not "Gestor":
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

            return {"sucess": True, "mensagem": f"Tipo do usuário {usuario.nome} alterado para {usuario.cargo} com sucesso!"}
        raise HTTPException(status_code=401, detail="Usuário não identificado!")

    @staticmethod
    async def remover(dados, session, usuario_atual):
        funcionario_atual = session.query(Funcionario).filter(Funcionario.id_usuario == usuario_atual.id).first()

        if funcionario_atual.cargo is not "Gestor":
            raise HTTPException(status_code=400, detail="Usuário não tem permissão de realizar essa requisição!")

        funcionario = session.query(Funcionario).filter(Funcionario.id_usuario == dados.id_usuario).first()

        if funcionario:

            usuario = session.query(Funcionario).filter(Funcionario.id_usuario == dados.id_usuario).first()

            if usuario:
                stmt = delete(Funcionario).where(Funcionario.id_usuario == usuario.id)
                resultado = session.execute(stmt)
                
                session.commit()
                return {"sucess": True, "mensagem": f"Tipo do usuário {usuario.nome} alterado para Usuario com sucesso!"}
        
        raise HTTPException(status_code=401, detail="Funcionário não encontrado!")
        
        
