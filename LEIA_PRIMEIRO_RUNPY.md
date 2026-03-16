# Como rodar no Mac com `run.py`

1. Extraia o ZIP.
2. Entre na pasta extraída.
3. Rode:

```bash
python3 run.py
```

Depois abra:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health: `http://localhost:3001/api/health`

Para a ESP32, use o IP do Mac que o script imprime e grava em `ENDERECOS_LOCAIS.txt`.
Exemplo:

```cpp
const char* api_url = "http://192.168.0.15:3001/api/iot/eventos";
```

Para parar tudo:

```bash
python3 stop.py
```
