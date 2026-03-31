# Prompt para colar no Cursor (projeto novo — canvas com @xyflow/react)

Copie o bloco abaixo **inteiro** para o chat do agente no **novo repositório** Next.js (App Router), depois de ter colado a pasta `src/workflow-kit` (e `src/lib/utils.ts` se necessário) vindos do repositório kit.

---

## Instruções para o agente

Estou construindo um **editor de workflow** inspirado no n8n (só front-end). Já tenho no projeto uma pasta **`src/workflow-kit`** com:

- `graph-model.ts` — tipos `WorkflowNode`, `WorkflowConnection`, `WorkflowNodeKind`
- `node-templates.tsx` — `allNodeTemplates`, `nodeTemplateSections`, `NodeTemplateId`, ícones (Lucide + react-icons)
- `n8n-tokens.ts` — cores de canvas, grade, bordas, arestas (referência visual n8n dark)
- `node-education.ts` — `getWorkflowNodeEducation` para painel/modal de ajuda
- `node-type-label.ts` — `workflowNodeKindLabel`
- `reference-scene.ts` — `buildReferenceN8nScene()` retorna `{ nodes, connections }` para dados iniciais de demo
- `index.ts` — re-export

**Objetivo:** implementar o canvas com **`@xyflow/react`** (React Flow / XYFlow), **sem** recriar motor de drag/SVG manual. Stack: Next.js App Router, React 19, TypeScript, Tailwind se já existir.

### Requisitos funcionais (MVP)

1. Instalar `@xyflow/react` e importar o CSS do pacote no layout ou no componente do canvas (`import "@xyflow/react/dist/style.css"`).
2. Página ou rota com um **client component** que renderiza `<ReactFlow>` com:
   - `nodes` e `edges` em estado React
   - `onNodesChange`, `onEdgesChange`, `onConnect` (ou equivalente) para persistir alterações
3. **Custom node** que exibe pelo menos: ícone (do template), título, e variante visual para `type === "trigger"` (perfil em D ou cantos mais arredondados à esquerda — use `n8n-tokens` como guia).
4. **Mapeamento de dados:**
   - Em `WorkflowNode` há `icon` como componente React — no RF, guarde em `node.data` um **`templateId: NodeTemplateId`** (string) para serialização JSON; resolva ícone/título/cor com `allNodeTemplates.find(t => t.id === templateId)`.
   - Converta `buildReferenceN8nScene().connections` em `edges` do RF (`source`, `target`; se `kind === "ai"`, estilo tracejado usando tokens `N8N_EDGE_AI_*`).
5. Fundo do painel: use `N8N_CANVAS_BG`, `N8N_GRID_DOT`, `N8N_GRID_STEP_PX` como no kit (grade pontilhada).
6. Botão ou painel simples para **adicionar nó** a partir de `nodeTemplateSections` (lista por categoria).
7. **Exportar / importar** JSON do grafo (só dados serializáveis: ids, positions, templateId, edges).

### Restrições

- Não reintroduzir `framer-motion` para arrastar nós no canvas (o RF já faz isso).
- Não copiar código legado de canvas SVG manual; tudo passa pelo React Flow.
- Manter `"use client"` apenas onde necessário (wrapper do React Flow).
- Se houver erro de hidratação com Next, garantir que o React Flow só monte no cliente (dynamic import com `ssr: false` ou checagem `typeof window`).

### Critérios de aceite

- Arrastar nós, conectar, ver arestas estáveis.
- Carregar demo inicial com `buildReferenceN8nScene()` convertido para nodes/edges do RF.
- JSON exportado reimporta e reconstrói o mesmo grafo.

Comece pelo spike mínimo (2 nós, 1 aresta), depois integre o kit e o custom node.

---

## Dependências esperadas no projeto novo (além do Next/React)

```bash
npm install @xyflow/react lucide-react react-icons clsx tailwind-merge
```

O kit usa `cn` de `@/lib/utils` (clsx + tailwind-merge). Copie `src/lib/utils.ts` junto se ainda não existir.

## Mapa de importação sugerido

```ts
import {
  buildReferenceN8nScene,
  allNodeTemplates,
  nodeTemplateSections,
  type NodeTemplateId,
} from "@/workflow-kit";
import * as N8N from "@/workflow-kit/n8n-tokens";
```

(Ajuste o alias `@/*` no `tsconfig` para apontar para `./src/*`.)
