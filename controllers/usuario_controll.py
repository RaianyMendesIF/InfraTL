from fastapi import FastAPI, HTTPException
from models.model import Usuario

 
def cadastrar_usuario(dados, session):
    try:
        usuario = session.query(Usuario).filter(Usuario.email == dados.email).first()
        if usuario: 
            raise HTTPException(status_code=400, detail="Ja existe um usuario com esse email")
                
        novo_usuario = Usuario(
            nome= dados.nome,
            cpf= dados.cpf,
            telefone= dados.telefone,
            data_nascimento= dados.data_nascimento,
            email= dados.email,
            senha= dados.senha
        )
        session.add(novo_usuario)
        session.commit()
        return {"mensagem": "Usuario cadastrado com sucesso"}
            
    except HTTPException:
        raise
        
    except Exception as e:
        session.rollback()
        print(f"ERRO DE BANCO: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno no banco de dados: {str(e)}")