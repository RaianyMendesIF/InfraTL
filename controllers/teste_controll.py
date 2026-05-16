from models.model import Usuario
from sqlalchemy.orm import Session
from sqlalchemy import text

def testes(dados, session: Session):
    try:
        session.execute(text("SELECT 1"))
        return {"status": "sucesso", "mensagem": "Conectado ao Neon!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro real: {str(e)}")

        """ usuario = session.query(Usuario).filter(Usuario.id == dados.id).first()
        if usuario:
            return {"usuario": usuario, "mensagem": "Usuário encontrado", "sucecss": True }
        else:
            return {"usuario": usuario, "mensagem": "Usuário  não encontrado!", "success": False }

    except:
        print(f"Erro interno: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor") """

