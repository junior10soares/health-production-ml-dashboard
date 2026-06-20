# Painel de Saúde do Modelo de ML em Produção

Um painel ao vivo que demonstra o **ciclo completo** de um modelo de Machine Learning em
produção: **treinamento → deploy → monitoramento de drift → resposta automática**. A maioria
dos projetos de demonstração para no deploy — este mostra o que acontece depois: o que ocorre
quando o modelo começa a receber dados diferentes do que foi treinado para entender.

Stack 100% JavaScript/TypeScript e 100% gratuita — sem APIs pagas, sem GPU, sem custo de
infraestrutura além de free tiers.

## Demonstração

<video src="https://github.com/junior10soares/health-production-ml-dashboard/blob/main/demo/demo-final.mp4?raw=true" controls width="100%"></video>

/home/juniorsoares/Projetos/Health-Production/demo/demo-final.mp4

Ciclo completo gravado ao vivo: análise de sentimento em português → injeção de drift
sintético → alerta automático → reindexação corrigindo o modelo.

## O que o projeto faz

1. **Treina** um classificador de sentimento (regressão logística, implementada à mão em JS)
   sobre embeddings de frases em português, geradas localmente com `@xenova/transformers`
   (sem chamadas a API externa).
2. **Serve** esse modelo via uma API Express, que recebe texto e retorna sentimento + um
   score de drift (distância coseno até o centróide de referência do treino).
3. **Monitora drift** continuamente: mantém uma janela móvel das últimas distâncias e dispara
   um alerta visual quando a média sustentada ultrapassa um limiar estatístico
   (`média + 2.5×desvio padrão` das distâncias observadas no treino).
4. **Responde automaticamente**: quando o drift se sustenta, o sistema dispara uma
   **reindexação simulada** — desloca o centróide de referência em direção ao tráfego
   recente, reseta o alerta e registra o evento. Isso é uma simulação de re-baseline, **não**
   um retreino completo dos pesos do modelo (não há rótulos confiáveis para o tráfego real).

## Stack

| Camada       | Tecnologia |
|--------------|------------|
| Frontend     | Next.js 16 + Tailwind CSS v4 + TypeScript, `recharts` (gráfico), `framer-motion` (animações), `lucide-react` (ícones) |
| Backend      | Node.js + Express + TypeScript |
| Embeddings   | `@xenova/transformers` (`Xenova/all-MiniLM-L6-v2`), 100% local, sem custo |
| Classificador| Regressão logística implementada em JS puro (gradiente descendente, cross-entropy + L2) |
| Banco        | PostgreSQL no Supabase (free tier) |
| Deploy       | Vercel (frontend) + Render free Web Service (backend) |

## Arquitetura

```
backend/
├── data/sentiment-dataset.json     # ~288 frases rotuladas (PT-BR, balanceadas)
├── artifacts/                      # pesos do modelo + estatísticas de referência (comitados no git)
│   ├── model-weights.json
│   └── reference-stats.json
├── scripts/train.ts                # pipeline de treino (roda 1x, ou quando o dataset mudar)
└── src/
    ├── server.ts                   # entrada da API, CORS, warm-up do modelo
    ├── config.ts                   # thresholds, janela de drift, debounce do reindex
    ├── db/                         # conexão Postgres + schema + queries
    ├── ml/                         # embeddings, regressão logística, carregamento de artifacts
    ├── drift/                      # detecção de drift + serviço de reindex
    └── routes/                     # predict, stats, history, reindex

frontend/
└── app/
    ├── page.tsx                    # dashboard (client component, polling)
    ├── lib/                        # tipos + wrappers de fetch para a API
    └── components/
        ├── PredictForm.tsx         # formulário de análise de texto
        ├── DriftChart.tsx          # gráfico de drift ao longo do tempo (recharts)
        ├── AlertBanner.tsx         # banner de alerta animado
        ├── StatusPanel.tsx         # métricas do sistema
        └── DriftInjectorButton.tsx # injeta drift sintético pra demonstração
```

## Como funciona o drift, em detalhe

- Cada embedding de treino tem uma distância coseno até o **centróide** (média dos embeddings
  de treino). O limiar de alerta é `distanceMean + 2.5 × distanceStd`, assumindo que essas
  distâncias seguem aproximadamente uma distribuição normal dentro do domínio treinado.
- Cada nova consulta recebe um `driftDistance` individual (cosmético, mostrado por consulta) e
  entra numa **janela móvel** das últimas 20 consultas. O alerta visual e o reindex automático
  só disparam quando a **média da janela** ultrapassa o limiar (evita reagir a um único
  outlier ruidoso).
- Um **debounce de 60 segundos** evita que o reindex automático dispare repetidamente enquanto
  o sistema permanece em estado de drift.
- O botão **"Injetar Drift Sintético"** envia 10 vezes em sequência um texto deliberadamente
  fora do domínio (jargão jurídico em inglês) — é a forma confiável de ver o ciclo completo
  (alerta → reindex → reset) ao vivo numa demonstração, já que drift orgânico levaria muito
  tempo para se acumular organicamente.

## Setup local

### Pré-requisitos
- Node.js 20+
- Uma conta gratuita no [Supabase](https://supabase.com) (Postgres)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha DATABASE_URL com a connection string do seu projeto Supabase
npm run train           # treina o modelo e gera backend/artifacts/*.json (já comitados, rodar só se mudar o dataset)
npm run dev              # inicia a API em http://localhost:4000
```

O `npm run dev` aplica a migration do schema automaticamente (`CREATE TABLE IF NOT EXISTS`) e
faz o warm-up do modelo de embeddings antes de aceitar tráfego — o endpoint `/health` só
retorna `200` depois desse warm-up.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # ajuste NEXT_PUBLIC_API_URL se o backend não estiver em localhost:4000
npm run dev                          # inicia o dashboard em http://localhost:3000 (ou 3001 se a 3000 estiver ocupada)
```

### Testando o ciclo completo manualmente

1. Abra o dashboard e envie uma frase em português pelo formulário — confira que o sentimento
   e a confiança fazem sentido.
2. Clique em **"Injetar Drift Sintético (Demo)"** — acompanhe o banner de alerta aparecer
   (pulsando) e a média móvel de drift subir acima do limiar no painel de status.
3. Continue observando — o reindex automático deve disparar sozinho (ou clique em **"Disparar
   Reindexação Manual"** para forçar), o alerta deve desaparecer e a média resetar.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/predict` | `{ text }` → sentimento, confiança, distância de drift, status do alerta |
| `GET`  | `/stats`   | Estado atual do drift, total de consultas, último reindex |
| `GET`  | `/history?limit=50` | Histórico de consultas recentes (para o gráfico) |
| `POST` | `/reindex` | Dispara reindex manual |
| `GET`  | `/health`  | Liveness — só `200` após o warm-up do modelo |

## Limitações conhecidas

- **Idioma do modelo de embeddings**: `Xenova/all-MiniLM-L6-v2` é majoritariamente treinado em
  inglês. Mesmo com o dataset de treino em português, a acurácia do classificador fica em
  torno de **84%** (vs. ~97% quando o mesmo pipeline é treinado em inglês). Um modelo
  multilíngue (`paraphrase-multilingual-MiniLM-L12-v2`) tende a performar melhor em português,
  mas é mais pesado — não foi adotado para manter o projeto leve e rápido.
- **Reindex é uma simulação**: desloca apenas o centróide de referência usado para calcular
  drift; não retreina os pesos da regressão logística (não há rótulos confiáveis para tráfego
  real não supervisionado). Documentado assim de propósito, para não ser confundido com
  retreino completo.
- **Cold start em produção (Render free tier)**: o serviço hiberna após ~15 minutos de
  inatividade. A primeira requisição após esse período pode levar até ~1 minuto (cold start do
  container + download/carregamento do modelo ONNX). O disco do Render também é efêmero — o
  histórico de consultas no Postgres do Supabase não é afetado (banco externo), mas qualquer
  estado em memória do processo (rolling window, centróide ajustado) é resetado a cada
  reinício, o que é o comportamento esperado.
- **Estado de drift é em memória**: a janela móvel e o centróide ajustado vivem na memória do
  processo Node, não são persistidos. Um restart do backend volta ao centróide original do
  treino — é intencional (reflete um "cold reset" do monitor).

## Deploy

- **Frontend**: [Vercel](https://vercel.com) — importe o repositório, defina
  `NEXT_PUBLIC_API_URL` apontando para a URL do backend no Render.
- **Backend**: [Render](https://render.com) (free Web Service) — defina `DATABASE_URL`
  (connection string do Supabase) e `FRONTEND_ORIGIN` (URL do frontend na Vercel) como
  variáveis de ambiente. Build command: `npm install`. Start command: `npm run start`.
- **Banco**: [Supabase](https://supabase.com) free tier — Postgres gerenciado, sem custo.

## Por que esse projeto é diferente

A maioria dos projetos de ML para portfólio mostra só o treinamento ou só o deploy de uma API
de inferência. Este projeto fecha o ciclo: mostra visualmente o que acontece quando o mundo
real diverge dos dados de treino, e como um sistema de monitoramento responde a isso — uma
versão em miniatura do que equipes de MLOps fazem em produção, sem nenhum custo de
infraestrutura.
