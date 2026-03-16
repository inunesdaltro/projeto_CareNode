# CareNode no Mac (M3 ou Intel)

## Endereços locais

- Frontend do dashboard: `http://localhost:5173`
- Backend da API: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`
- Rota da ESP32: `http://IP_DO_MAC:3001/api/iot/eventos`

## Importante sobre o `.ino`

No navegador do Mac você usa `localhost`, mas na ESP32 real você **não** usa `localhost`.

A ESP32 precisa apontar para o **IP do seu Mac na rede local**, por exemplo:

```cpp
const char* api_url = "http://192.168.0.15:3001/api/iot/eventos";
```

Ao executar `rodar_carenode_mac.command`, o projeto gera automaticamente:

- `ENDERECOS_LOCAIS.txt` com todos os links
- `botao_mac_local.ino` com a URL da API já montada com o IP do Mac

## Como rodar

1. Extraia a pasta do projeto.
2. Dê duplo clique em `rodar_carenode_mac.command`.
3. O script instala as dependências, cria os `.env`, abre backend e frontend e abre o dashboard no navegador.
4. Para um teste rápido, rode `testar_carenode_mac.command`.
5. Para encerrar tudo, rode `parar_carenode_mac.command`.

## Observações

- O projeto foi ajustado para forçar o uso do registro público do npm.
- Os `package-lock.json` antigos foram removidos para evitar erro de instalação no Mac.
- O frontend conversa com o backend por `http://localhost:3001/api`.
