# n8n Snipper

Editor de workflow experimental com aparência próxima ao n8n, usando **Next.js** e **React Flow** (`@xyflow/react`).

## Requisitos

- Node.js 20+ (recomendado)

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O editor de workflow costuma estar em `/workflow`.

## Scripts

| Comando        | Descrição              |
| -------------- | ---------------------- |
| `npm run dev`  | Servidor de desenvolvimento |
| `npm run build` | Build de produção     |
| `npm run start` | Servir build (produção) |
| `npm run typecheck` | Verificação TypeScript |

## Dados locais

O estado do canvas pode ser persistido no **localStorage** do navegador (sessão do workflow). Não há backend obrigatório.

## Licença

Uso interno / projeto pessoal — defina a licença se for tornar o repositório público.
