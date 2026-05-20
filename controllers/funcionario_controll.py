from fastapi import FastAPI, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.model import Usuario, Funcionario
from schemas.usuario_schemas import Usuario_response

class FuncionarioController:
    @staticmethod
    async def adicionar(dados, session):
        usuario_solicitante = session.query(Funcionario).filter(Funcionario.id_usuario == dados.id_funcionario, Funcionario.cargo == "Gestor").first()

        if not usuario_solicitante:
            raise HTTPException(status_code=400, detail="Usuário não tem permissão de realizar essa requisição!")

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

            return {"sucess": True, "mensagem": f"Tipo do usuário {usuario.nome} alterado para Admin com sucesso!"}
        return {"sucess": False, "mensagem": "Usuário não identificado!"}
        
        
