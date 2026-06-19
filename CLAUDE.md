# Health-Production — Live ML Model Health Dashboard

## O que é este projeto

Dashboard que demonstra o ciclo completo de um modelo de ML em produção: **treinamento → deploy → monitoramento de drift → resposta automática (reindex simulado)**. A maioria dos projetos demo para no deploy; este cobre o ciclo inteiro, com UI própria.

Stack: 100% JavaScript/TypeScript, 100% gratuita.

- **Backend**: Node.js + Express + TypeScript, `@xenova/transformers` (embeddings rodando localmente, sem API paga), regressão logística escrita à mão em JS puro.
- **Banco**: Supabase Postgres (free tier) — não SQLite, pois o Render reseta o disco a cada redeploy/restart.
- **Frontend**: Next.js + Tailwind + TypeScript, `recharts`, polling (4-5s) em vez de WebSockets.
- **Deploy**: Vercel (frontend) + Render free Web Service (backend).

Plano completo de referência (arquitetura, fórmulas, contratos de API, decisões já tomadas com o usuário): `/home/juniorsoares/.claude/plans/quero-que-me-ajude-joyful-scroll.md`.

Importante: o "reindex" é uma simulação de re-baseline da referência de drift (blend do centróide com tráfego recente), **não** um retreino dos pesos do modelo — isso deve ficar explícito no README final, não deve ser apresentado como retreino real.

---

## Como trabalhar neste projeto

Cada etapa abaixo só deve ser considerada concluída depois de passar pelo **Checkpoint de Revisão** e pelo **Checkpoint de Teste** correspondente. Não avançar para a próxima etapa com checkpoints pendentes.

- **Revisão de código**: usar `/code-review` (nível padrão) no diff da etapa antes de seguir. Corrigir achados de alta confiança antes de avançar.
- **Testes**: cada etapa tem um critério de verificação manual ou automatizado explícito — só marcar como pronta quando esse critério passar de fato (não assumir que passou).

---

## Etapa 1 — Setup do backend + dataset de treino

**Escopo**: `backend/package.json`, `tsconfig.json`, dependências (`express`, `@xenova/transformers`, `pg`, `cors`, `tsx`/`ts-node`), `backend/data/sentiment-dataset.json` (~300-400 frases rotuladas, balanceadas, domínio cotidiano).

**Checkpoint de revisão**: `/code-review` no dataset e configuração — confirmar que o dataset está balanceado (proporção razoável positivo/negativo) e que não há duplicatas óbvias.

**Checkpoint de teste**: `npm install` roda sem erro; `node -e "console.log(require('./data/sentiment-dataset.json').length)"` confirma contagem esperada de registros.

---

## Etapa 2 — Pipeline de treino (embeddings + regressão logística)

**Escopo**: `backend/src/ml/embeddings.ts`, `backend/src/ml/logisticRegression.ts`, `backend/scripts/train.ts`.

**Checkpoint de revisão**: `/code-review` — verificar que `embeddings.ts` é o único ponto de embedding (reusado em treino e inferência), que a regressão logística usa a fórmula de cross-entropy + L2 corretamente, e que não há vazamento de dados de teste/treino (aqui não há split, é treino direto — confirmar que isso está documentado como decisão consciente).

**Checkpoint de teste**:
1. `npm run train` executa sem erro, mostra progresso de embedding e acurácia decrescendo a loss.
2. `backend/artifacts/model-weights.json` e `reference-stats.json` são gerados, com `w.length === 384` e `dim === 384`.
3. Acurácia de treino final deve ser sensivelmente melhor que 50% (chance) — se não for, investigar antes de seguir.

---

## Etapa 3 — Banco de dados (Supabase Postgres)

**Escopo**: criação do projeto Supabase, `backend/src/db/schema.sql`, `backend/src/db/connection.ts` (pool `pg` com `DATABASE_URL`).

**Checkpoint de revisão**: `/code-review` — confirmar que a connection string não está hardcoded/commitada (deve vir de `.env`, com `.env.example` documentando as variáveis), e que o SSL está configurado corretamente para Supabase.

**Checkpoint de teste**: rodar o schema contra o Supabase (via script ou client), confirmar no dashboard do Supabase que as tabelas `queries` e `reindex_events` existem com as colunas esperadas.

---

## Etapa 4 — Drift detection + reindex service

**Escopo**: `backend/src/drift/driftDetector.ts` (cosine distance, rolling window, threshold), `backend/src/drift/reindexService.ts` (blend de centróide, debounce, log de evento).

**Checkpoint de revisão**: `/code-review` — atenção especial à fórmula de cosine distance (não usar shortcut de dot product, já que o centróide não é necessariamente unitário), ao debounce do auto-reindex, e à lógica de dois níveis de flag (per-query vs sustentado).

**Checkpoint de teste**: testes unitários simples (Vitest ou script manual) para:
1. `cosineDistance` retorna 0 para vetores idênticos e valores corretos para casos conhecidos.
2. Rolling window respeita o tamanho máximo configurado.
3. Threshold é calculado corretamente a partir de `distanceMean`/`distanceStd` dos artifacts.
4. Reindex só dispara depois do debounce e reseta a janela/alerta corretamente.

---

## Etapa 5 — Rotas da API + server.ts

**Escopo**: `backend/src/routes/{predict,stats,history,reindex}.ts`, `backend/src/server.ts` (wiring, CORS, warm-up do embedder, `/health`).

**Checkpoint de revisão**: `/code-review` — validar tratamento de erros (texto vazio, erros de embedding durante warm-up), CORS restrito a `FRONTEND_ORIGIN`, e que os contratos de request/response batem com o que está documentado no plano.

**Checkpoint de teste** (manual, via curl/Postman):
1. `GET /health` só retorna 200 após o warm-up do modelo.
2. `POST /predict` com frase claramente positiva e negativa retorna labels coerentes.
3. `GET /stats` reflete o estado esperado (baseline `alertActive: false`).
4. `GET /history` retorna registros em ordem cronológica ascendente.
5. Injetar 8-10 textos fora de domínio (jurídico/código) seguidos — confirmar que `alertActive` vira `true` em `/stats`.
6. Continuar injetando até o debounce passar — confirmar que o auto-reindex dispara (`reindex_events` populado) e o alerta reseta.
7. `POST /reindex` manual funciona mesmo sem drift sustentado.

---

## Etapa 6 — Frontend (Next.js + Tailwind)

**Escopo**: `frontend/app/page.tsx`, `lib/api.ts`, componentes `PredictForm`, `DriftChart`, `AlertBanner`, `StatusPanel`, `DriftInjectorButton`.

**Checkpoint de revisão**: `/code-review` — confirmar que o polling tem cleanup correto (`clearInterval` no unmount), que não há fetch duplicado/race condition entre o polling e o refetch imediato após submissão, e que o `ReferenceLine` do threshold no gráfico usa o valor vindo de `/stats` (não hardcoded).

**Checkpoint de teste** (manual, no browser, contra backend local):
1. Submeter query normal → resultado aparece, gráfico atualiza no próximo ciclo de poll.
2. Clicar no botão de injeção de drift várias vezes → banner de alerta aparece pulsando.
3. Aguardar/forçar reindex → banner desaparece, painel de status mostra novo timestamp de reindex.
4. Recarregar a página → estado consistente com `/stats` e `/history` (sem flash de dados errados).

---

## Etapa 7 — Deploy (Vercel + Render + Supabase)

**Escopo**: configuração de variáveis de ambiente em ambos os serviços, deploy do backend no Render, deploy do frontend na Vercel.

**Checkpoint de revisão**: `/code-review` ou checklist manual — confirmar que nenhuma credencial está commitada, que `.env.example` está atualizado, e que o build command do Render está correto.

**Checkpoint de teste**:
1. Backend deployado responde em `/health`.
2. Frontend deployado consegue se comunicar com o backend (CORS ok).
3. Testar cold start após inatividade — cronometrar e confirmar que o frontend mostra aviso de "acordando" em vez de parecer travado.
4. Repetir o ciclo completo de drift → alerta → reindex no ambiente de produção.

---

## Etapa 8 — README final

**Escopo**: documentar setup local (`npm run train`, `npm run dev` em ambos), limitações conhecidas (cold start do Render, reset de cache do modelo, reindex é simulação e não retreino real), e o argumento de diferenciação do projeto (ciclo completo de MLOps em miniatura).

**Checkpoint de revisão**: revisão manual de clareza e honestidade — não exagerar o que o "reindex simulado" realmente faz.

**Checkpoint de teste**: seguir o README do zero (`git clone` mental) e confirmar que cada comando documentado realmente funciona na ordem descrita.
