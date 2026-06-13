# InfraTL
SISTEMAS INTELIGENTE DE ZELADORIA URBANA

## Comandos

Criar o ambiente Venv <br>
```python -m venv venv```

Ativar o ambiente venv <br>
```.\venv\Scripts\activate```

Instalar a extenção do uvicorn <br>
```pip install fastapi uvicorn```

Criar as dependencias no requeriments <br>
```pip freeze > requirements.txt```

Instalar os arquivos do requeriments <br>
```pip install -r requirements.txt```

Executar o projeto FAST API <br>
```uvicorn main:app --reload```

Inserir no .env
```DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"```

postgresql://infratl_app:TROQUE_EM_PRODUCAO_app@ep-ancient-haze-aqp932zq-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

"postgresql://usuario:senha@localhost:5432/meubanco"