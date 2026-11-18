# Plano de Implementação: Notificações de hábitos e atualização para a versão nova

**Branch**: `011-notificacoes-e-atualizacao` | **Data**: 2026-11-18 | **Spec**: [spec.md](./spec.md)
**Status**: Aprovado em 2026-11-18 <!-- Rascunho | Aprovado --> | **Tarefas**: [tasks.md](./tasks.md)

> Pré-requisito: a `spec.md` deve estar com status **Aprovada** (aprovada em 2026-11-18).
> Este documento descreve **como** a spec será atendida.

---

## Resumo

**Notificações**: o app passa a ter um *service worker* mínimo (`/sw.js`, escrito à mão, sem
cache e sem modo offline), que só recebe mensagens **Web Push** e mostra a notificação. Cada
aparelho que ativa as notificações entrega à API a sua inscrição de push, guardada numa
tabela nova. As preferências da conta (horário e tipos) ficam em outra tabela. Uma tarefa
agendada da API roda a cada minuto, no horário de Brasília. Ela calcula quem deve receber o
lembrete, a meta em risco ou o resumo e envia o push com criptografia e assinatura VAPID,
implementadas com a biblioteca padrão do Java, **sem dependência nova**.

**Versão nova**: cada build do web gera um identificador de versão e um `/version.json` (com
o resumo opcional de novidades tirado de `web/novidades.md`). O Nginx passa a mandar o
navegador sempre revalidar o `index.html`, então abrir o app do zero já traz a versão nova. Com o app
aberto, um módulo de atualização consulta o `/version.json` a cada 4 minutos e ao voltar para
o app. Conforme a situação, ele mostra o aviso "Nova versão disponível" ou recarrega sozinho,
e nunca recarrega com um diálogo aberto, um arraste em andamento ou uma marcação sendo
enviada.

## Contexto técnico

| Item | Valor |
|------|-------|
| Stack | A mesma (React 19.3.1 + TS 5.9.3, Vite 7.3.7; Spring Boot 3.5.16, Java 21; PostgreSQL 17) |
| Dependências novas | **Nenhuma**. Push: `java.net.http.HttpClient`, `KeyPairGenerator`/`KeyAgreement` (ECDH P-256), `Mac` (HKDF), `Cipher` (AES-128-GCM) e `Signature` (`SHA256withECDSAinP1363Format`) do JDK. Agendamento: `@Scheduled` do Spring. Web: APIs do navegador (`serviceWorker`, `PushManager`, `Notification`) |
| Persistência | Migração `V4__notifications.sql`: tabelas `notification_settings` e `push_subscriptions` |
| Configuração nova | `HABITS_VAPID_PUBLIC_KEY`, `HABITS_VAPID_PRIVATE_KEY`, `HABITS_VAPID_SUBJECT` no `.env` (geradas uma vez por `scripts/gerar-vapid.sh`); sem elas, as notificações aparecem como "indisponíveis" e o resto do app funciona |
| Arquivos estáticos novos | `web/public/sw.js`; `dist/version.json` gerado no build |
| Navegadores-alvo do push | Chrome/Edge no Android e no computador, Firefox, Safari no macOS e o app da tela inicial no iPhone (iOS 16.4+) |
| Riscos | Criptografia do Web Push (RFC 8291) e VAPID (RFC 8292) feitas à mão: cobertas pelo vetor de teste do apêndice A da RFC 8291. O iOS revoga a inscrição após pushes "silenciosos": todo push enviado é mostrado e os atrasados expiram no serviço de push (P7). Durante o deploy, o web novo sobe antes de a API responder: a versão nova só é anunciada com a API no ar (P15). A chave VAPID nunca pode mudar depois de publicada, senão todas as inscrições caem |

---

## Constitution Check (2.1.1)

| Princípio | Conforme? | Observação |
|-----------|-----------|------------|
| I. Spec antes do código | ✅ | Spec aprovada em 2026-11-18 |
| II. Stack oficial | ✅ | Nenhuma dependência nova, linguagem ou serviço; *service worker* é um arquivo estático e o envio usa o JDK. Peças novas registradas em **Complexity Tracking** por transparência, como a spec pede |
| III. Dados isolados por usuário | ✅ | Preferências e inscrições filtradas pelo usuário da sessão; inscrição de outro usuário responde 404; novos casos no `IsolationIT`. Migração nova `V4`, só aditiva (nenhuma tabela existente muda) |
| IV. pt-BR e acessível | ✅ | Textos das notificações, do aviso e das novidades em pt-BR; aviso como `role="status"` com botão alcançável por teclado; novidades no `Dialog` atual; controles da tela da conta com rótulos; sem animação nova |
| V. Responsivo | ✅ | O aviso entra no fluxo da página (não cobre marcações nem a barra inferior), no celular e no computador; breakpoint inalterado |
| VI. Verificação | ✅ | JUnit (criptografia com vetor da RFC, regras de envio, agendador, endpoints, isolamento) e Vitest (atualização, novidades, tela de notificações); checklist manual no `tasks.md`, com iPhone e Android reais |
| VII. Segurança | ✅ | Chave privada VAPID só no `.env`; CSRF nas rotas novas; a API só envia push para hosts de serviços de push conhecidos (sem SSRF); chaves da inscrição nunca em log; "Sair" remove a inscrição do aparelho |

---

## Pesquisa e decisões

### Notificações

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P1 | **Web Push padrão (VAPID)**, entregue pelos serviços de push dos navegadores (FCM, Mozilla, Apple, WNS) | Firebase Cloud Messaging com SDK; serviço pago (OneSignal) | É o único caminho que funciona no app da tela inicial do iPhone e nos navegadores sem SDK nem conta em terceiros |
| P2 | **Criptografia e assinatura com o JDK** em `push/WebPushSender` (RFC 8291 `aes128gcm` + JWT ES256 da RFC 8292) | `nl.martijndwars:web-push` | A biblioteca está sem manutenção desde 2021 e traz BouncyCastle, Apache HttpAsyncClient e jose4j (Princípio II). O JDK 21 tem todas as primitivas; são ~150 linhas, testadas contra o vetor do apêndice A da RFC 8291 |
| P3 | ***Service worker* mínimo** `web/public/sw.js`, sem `fetch` handler: só `push` (mostra a notificação) e `notificationclick` (foca uma janela aberta do Habits ou abre `/`) | `vite-plugin-pwa`/Workbox; SW com cache offline | Push exige um *service worker*, mas cache e offline estão fora de escopo. Sem `fetch` handler, o SW não interfere no carregamento e não cria um segundo cache para a versão nova (P13) |
| P4 | **Ativação por aparelho = inscrição de push gravada** (`push_subscriptions`, chave única no `endpoint`). Ativar: permissão → `pushManager.subscribe` → `PUT /api/notifications/devices`. Desativar: `DELETE` + `unsubscribe()`. Ao abrir o app logado, uma inscrição existente é reenviada (cobre troca de conta no aparelho e renovação da inscrição) | Ligar/desligar na conta | RF-003: desativar num aparelho não afeta os outros. O mesmo `endpoint` gravado por outra conta passa para a conta atual (mesmo aparelho, outra conta) |
| P5 | **Preferências por conta** (`notification_settings`), criadas na primeira ativação com lembrete às 20:00 e os três tipos ligados (RF-004). "Desligadas para todos" (RF-002) = nenhuma inscrição; nenhuma linha é criada na migração | Linha para todos na migração | Ninguém recebe nada sem ativar; usuários existentes não mudam |
| P6 | **Agendador** `@Scheduled(cron = "0 * * * * *", zone = "America/Sao_Paulo")` chama `NotificationJob.runAt(LocalDateTime)`. Envia o que vence numa **janela de 15 minutos** a partir do horário (lembrete/resumo) ou das 9:00 (meta em risco) e grava a data do último envio de cada tipo (`last_daily_on`, `last_at_risk_on`); o resumo de domingo grava `last_daily_on` | Fila; Quartz; cron do sistema | Uma instância da API, poucos usuários: um laço por minuto basta. A janela cobre o deploy (API fora do ar por ~1 minuto) sem mandar lembrete atrasado à noite; a data gravada garante no máximo um por dia (RF-010) mesmo com reinício. Desligado nos testes (`habits.notifications.scheduler.enabled=false`); os testes chamam `runAt` direto |
| P7 | **Nada sobre um dia que já passou**: cada push sai com `TTL` = segundos até a meia-noite de Brasília (mínimo 60) e `Urgency: normal`. O serviço de push descarta o que expirar com o aparelho desligado | O SW decide não mostrar | O iOS e o Chrome punem push recebido e não mostrado (a Apple revoga a inscrição). Com o TTL, o atrasado nunca chega |
| P8 | **Mudou o horário** para um que já passou hoje (fora da janela): o lembrete de hoje conta como feito (`last_daily_on = hoje`) | Mandar na hora | Cenário 1.4: "a partir do mesmo dia se o horário ainda não passou"; e mudar o horário depois do envio não reenvia |
| P9 | **Regras** em `NotificationRules` (funções puras, semana de segunda a domingo da spec 010, metas vigentes via `GoalService.goalsAt`, hábitos não arquivados): **lembrete** = ativos sem marcação hoje, menos os que já atingiram a meta da semana; **meta em risco** = meta > feitos, hoje sem marcação e `meta − feitos == dias que restam contando hoje`; **resumo** = mesma conta do `weekSummary` do web (percentual limitado a 99 até cumprir tudo; rótulos "Semana perfeita", "Boa semana", "Dá para melhorar", "Semana fraca") | Calcular no web | Com o app fechado, só a API pode calcular. O cálculo do resumo é duplicado em Java, com testes que usam os mesmos casos do `progress.test.ts` |
| P10 | **Domingo sem nenhuma meta**: não há resumo (a tela mostra só "Defina metas…"); vale o lembrete diário normal, se ligado | Mandar "Defina metas" por push | Notificação sem informação útil; mantém a regra "nada quando não há nada pendente" (CS-002) |
| P11 | **Textos** (pt-BR, título "Habits"): lembrete "Faltam 2 hábitos para marcar hoje." / "Falta 1 hábito para marcar hoje: Ler."; meta em risco "Faça hoje para não perder a meta: Ler, Correr."; resumo "Resumo da semana: 67% · Boa semana." + " Faltam 2 hábitos para marcar hoje." quando couber. `tag` por tipo e dia, para não empilhar duplicatas | — | Cita só dados da conta (RF-013); nomes de hábitos limitados a 3, com "e mais N" |
| P12 | **Segurança do envio**: `endpoint` aceito só com `https` e host terminado em `fcm.googleapis.com`, `push.services.mozilla.com`, `push.apple.com` ou `notify.windows.com`; `p256dh` e `auth` validados como base64url de 65 e 16 bytes. Resposta 404/410 do serviço apaga a inscrição; 429/5xx apenas registra o código no log (sem chaves). Timeout de 10 s por envio | Aceitar qualquer URL | Sem lista, a API viraria um disparador de requisições para qualquer endereço (SSRF, Princípio VII) |

### Versão nova

| # | Decisão | Alternativas | Motivo |
|---|---------|--------------|--------|
| P13 | **Cabeçalhos de cache no Nginx**: `index.html`, `/version.json`, `/sw.js` e `/manifest.webmanifest` com `Cache-Control: no-cache`; `/assets/*` (nomes com hash) com `public, max-age=31536000, immutable` | Manter sem cabeçalho | Hoje o `index.html` sai sem `Cache-Control` e o navegador pode reaproveitá-lo por cache heurístico, abrindo a versão antiga (RF-019). Com `no-cache`, toda abertura revalida (resposta 304 barata quando nada mudou), inclusive no app da tela inicial, sem recriar o atalho (RC-004) |
| P14 | **Identificador de versão** gerado no build: `vite.config.ts` cria `buildId` (data e hora UTC do build) e `notesId` (hash curto do texto de `web/novidades.md`), injeta-os no código com `define` e um plugin local grava `dist/version.json` `{ version, notes, notesId }` | Hash do git (não há `.git` no build do Docker); `--build-arg` no deploy | Sem tocar no deploy. O cache de camadas do Docker reaproveita o build quando nada em `web/` mudou, então a versão só muda quando o web muda |
| P15 | **Versão nova "no ar"** = `/version.json` com `version` diferente da embutida **e** `GET /api/auth/me` respondendo 200 ou 401 | Só o `version.json` | No deploy, o web novo pode subir antes da API: recarregar nesse momento levaria à tela de erro de conexão (CS-006) |
| P16 | **Checagem**: a cada 4 minutos com a aba visível, ao voltar para a aba (`visibilitychange`) e logo após entrar | 1 minuto; SSE | Cumpre "em até 5 minutos" (RF-014) com ~15 requisições por hora de uso a um arquivo de ~200 bytes |
| P17 | **Bloqueios da atualização** (`update/blockers.ts`): contador de motivos ativos. Entram: `Modal` aberto (todos os formulários do app são diálogos), campos de Entrar/Criar conta preenchidos, arraste do `useReorder` e requisições que alteram dados em andamento (contadas no `api/client.ts`) | Detectar "texto digitado" campo a campo | Mais simples e mais seguro (RF-018): nada recarrega com um diálogo aberto, mesmo sem texto. "Atualizar" com bloqueio fica pendente e recarrega quando o contador zera |
| P18 | **Quando recarregar sozinho** (`location.reload()`, mantém a rota e o cookie de sessão): (a) abrir do zero já vem novo (P13); (b) logo após entrar, se houver versão nova; (c) na tela Entrar/Criar conta sem bloqueio; (d) ao voltar para a aba depois de ≥ 30 min oculta (instante guardado no `visibilitychange`) e sem bloqueio. Nos demais casos, aviso | Recarregar por *service worker* | O SW não tem cache (P3), então um `reload` comum já traz a versão nova |
| P19 | **Aviso** `UpdateBanner`: faixa no fluxo do `AppShell`, acima do conteúdo (não flutua, não cobre marcações nem a barra inferior), `role="status"`, texto "Nova versão disponível", o resumo de novidades quando o `notesId` novo for diferente do atual, e o botão "Atualizar" (vira "Atualizando ao fechar o formulário…" quando pendente) | Toast flutuante | Spec 3.1: sem bloquear e sem cobrir |
| P20 | **Novidades**: `localStorage["habits:notes-seen"]` guarda o último `notesId` visto. Ao carregar, se há resumo e o `notesId` difere do guardado, abre o diálogo "Novidades da versão"; ao fechar, grava. Sem valor guardado (primeiro uso ou primeira versão com esta função), só grava, sem mostrar. Se o `novidades.md` não mudou entre duas versões, o `notesId` é o mesmo e nada aparece | Novidades por versão no banco | O resumo velho nunca é mostrado de novo numa versão sem novidades, e quem nunca usou o app não vê "novidades" (US7). Leitura em `try/catch`: sem `localStorage`, não mostra |
| P21 | **`web/novidades.md`**: texto curto em pt-BR, editado no PR da versão (vazio = sem resumo), máximo de 300 caracteres (o build falha acima disso). Documentado em `docs/deploy.md` | Campo no GitHub Actions | Fica no git, revisado junto com a mudança (RF-020) |

---

## Modelo de dados — `V4__notifications.sql`

```sql
create table notification_settings (
    user_id         bigint  primary key references users (id) on delete cascade,
    reminder_time   time    not null default '20:00',
    daily_enabled   boolean not null default true,
    at_risk_enabled boolean not null default true,
    summary_enabled boolean not null default true,
    last_daily_on   date,   -- último lembrete OU resumo de domingo enviado
    last_at_risk_on date
);

create table push_subscriptions (
    id         bigserial    primary key,
    user_id    bigint       not null references users (id) on delete cascade,
    endpoint   varchar(1024) not null unique,
    p256dh     varchar(100) not null,
    auth       varchar(40)  not null,
    created_at timestamptz  not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions (user_id);
```

Nenhuma tabela existente muda; nenhum dado é convertido.

## API

| Método e rota | Corpo / resposta | Regras |
|---------------|------------------|--------|
| `GET /api/notifications` | → `{ available, publicKey, reminderTime: "20:00", daily, atRisk, summary }` | `available=false` sem chaves VAPID; sem linha de preferências, devolve os padrões |
| `PUT /api/notifications/settings` | `{ reminderTime, daily, atRisk, summary }` → 204 | `reminderTime` `HH:mm`, minutos de 00 a 59; cria a linha se não existir; aplica P8 |
| `PUT /api/notifications/devices` | `{ endpoint, keys: { p256dh, auth } }` → 204 | Valida (P12); *upsert* pelo `endpoint` para o usuário da sessão; cria as preferências padrão se faltarem |
| `DELETE /api/notifications/devices` | `{ endpoint }` → 204 | Apaga só se a inscrição for do usuário da sessão; senão 404 `SUBSCRIPTION_NOT_FOUND` |

Erros no formato `{ code, message, fields? }`, como hoje: `INVALID_SUBSCRIPTION` ("Não foi
possível ativar as notificações neste aparelho."), validação de horário em `fields.reminderTime`
("Informe um horário válido.").

## Fluxo

- **Ativar** (tela da conta): `Notification.requestPermission()` → `granted` →
  `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })`
  → `PUT /devices` → estado "ativas". `denied` → estado "bloqueadas" com como liberar.
- **Estados** (RF-006), em ordem: chaves ausentes ou sem `serviceWorker`/`PushManager` →
  "indisponíveis"; iPhone/iPad fora do app da tela inicial (`navigator.standalone === false`
  e sem `PushManager`) → passos de instalação; `permission === "denied"` → bloqueadas;
  inscrição presente → ativas (horário e tipos editáveis); senão → desativadas.
- **Sair**: antes do `POST /auth/logout`, se houver inscrição: `DELETE /devices` e
  `unsubscribe()`; falha de rede não impede sair (o `unsubscribe` local já corta a entrega).
- **Agendador (a cada minuto)**: para cada usuário com inscrições e preferências, calcula as
  regras (P9) com a data e a hora de Brasília, envia a cada inscrição do usuário, grava a data
  do envio e apaga inscrições com 404/410.
- **Push no aparelho**: `sw.js` recebe `{ title, body, tag, url }` e chama `showNotification`
  com o ícone `/icon-192.png`; o toque foca uma janela do Habits ou abre `/`.
- **Versão**: `UpdateProvider` (no `App`) carrega a checagem (P16), mantém
  `{ available, notes, pending }` e decide entre aviso e recarga (P17, P18). O `AuthContext`
  avisa o provider logo após entrar.

## Arquivos afetados

```
api/src/main/resources/db/migration/V4__notifications.sql      # NOVO
api/src/main/resources/application.yml                         # habits.vapid.*, habits.notifications.scheduler.enabled
api/src/main/java/br/com/habits/HabitsApplication.java         # @EnableScheduling
api/src/main/java/br/com/habits/notification/                  # NOVO pacote:
    NotificationSettings.java, NotificationSettingsRepository.java
    PushSubscription.java, PushSubscriptionRepository.java
    NotificationController.java, NotificationService.java       # rotas e validação (P4, P5, P8, P12)
    NotificationRules.java                                      # regras puras (P9, P10, P11)
    NotificationJob.java                                        # agendador (P6, P7)
api/src/main/java/br/com/habits/push/                          # NOVO pacote:
    VapidKeys.java, WebPushEncryption.java, WebPushSender.java  # RFC 8291/8292 com o JDK (P2)
api/src/main/java/br/com/habits/check/CheckRepository.java     # consulta de marcações por usuário e período (se faltar)
api/src/test/java/br/com/habits/push/WebPushEncryptionTest.java    # vetor do apêndice A da RFC 8291; JWT verificável
api/src/test/java/br/com/habits/notification/NotificationRulesTest.java
api/src/test/java/br/com/habits/notification/NotificationIT.java   # rotas, validação, padrões, P8
api/src/test/java/br/com/habits/notification/NotificationJobIT.java # janela, 1 por dia, domingo, arquivados, 410
api/src/test/java/br/com/habits/IsolationIT.java               # casos das rotas novas
web/public/sw.js                                               # NOVO (P3)
web/novidades.md                                               # NOVO (P21), começa com o resumo desta versão
web/vite.config.ts                                             # buildId, notesId, plugin do version.json (P14)
web/src/vite-env.d.ts                                          # NOVO: tipos de __APP_VERSION__ e __APP_NOTES_ID__
web/src/update/                                                # NOVO: version.ts, blockers.ts, UpdateProvider.tsx,
                                                               #   UpdateBanner.tsx, NotesDialog.tsx (+ testes)
web/src/notifications/                                         # NOVO: push.ts (suporte, SW, inscrição),
                                                               #   NotificationSettings.tsx (+ testes)
web/src/api/client.ts, types.ts                                # rotas de notificações; contador de requisições (P17)
web/src/main.tsx                                               # registra /sw.js quando suportado
web/src/App.tsx                                                # UpdateProvider; novidades
web/src/auth/AuthContext.tsx                                   # avisa a atualização após entrar; remove a inscrição ao sair
web/src/auth/LoginPage.tsx, RegisterPage.tsx                   # bloqueio com campos preenchidos
web/src/common/Modal.tsx                                       # bloqueio enquanto aberto
web/src/habits/useReorder.ts                                   # bloqueio durante o arraste
web/src/shell/AppShell.tsx                                     # UpdateBanner
web/src/pages/AccountPage.tsx                                  # card "Notificações"
web/nginx.conf                                                 # Cache-Control (P13)
scripts/gerar-vapid.sh                                         # NOVO: gera o par de chaves com openssl
docker-compose.yml, .env.example                               # HABITS_VAPID_* para a API
docs/deploy.md                                                 # chaves VAPID (gerar uma vez, nunca trocar) e novidades.md
```

---

## Complexity Tracking

Nenhum princípio é violado. Registro das peças novas, como a spec pede (Princípio II):

| Peça nova | Por que é necessária | Alternativa mais simples rejeitada porque |
|-----------|----------------------|-------------------------------------------|
| *Service worker* `sw.js` | Sem ele o navegador não entrega push com o app fechado (RF-001) | Notificações só com o app aberto: rejeitado na clarificação (canal = app fechado) |
| Envio Web Push próprio (criptografia + VAPID com o JDK) | Os serviços de push exigem a mensagem cifrada e assinada | Biblioteca pronta: sem manutenção e com três dependências transitivas (P2) |
| Tarefa agendada na API | Lembretes em horário fixo exigem algo rodando no servidor | Cron do servidor chamando uma rota: mais uma peça fora do Compose e uma rota a proteger |
| `version.json` + checagem periódica | Perceber a versão nova com o app aberto (RF-014) | Só cabeçalhos de cache: resolvem a abertura do zero, mas não o app aberto |
