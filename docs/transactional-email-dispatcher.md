# E-mails transacionais — Casa do Oleiro

Este documento cobre o dispatcher de e-mails do processo de voluntariado.

## Arquitetura

O site continua estático no GitHub Pages e não recebe credenciais de e-mail.

Os eventos de negócio já gravados em `applications/{applicationId}/history/{eventId}` funcionam como outbox durável. Um Cloudflare Worker consulta apenas eventos posteriores a `NOTIFICATION_START_AT`, resolve a candidatura correspondente e envia as mensagens pelo Resend.

Cada evento processado cria um documento em `notification_deliveries`. O ledger impede reenvio do mesmo evento e o Worker também usa uma chave de idempotência por destinatário no Resend.

## Modos

- `off`: nenhum evento é consultado e nenhum e-mail é enviado.
- `test`: os eventos são processados, mas todos os e-mails são redirecionados para `TEST_EMAIL`.
- `production`: os e-mails são enviados aos destinatários reais.

O repositório deixa `EMAIL_MODE=off` por padrão.

## Eventos enviados

Para a gestão:

- planejamento enviado;
- planejamento reenviado;
- nova atividade criada após aprovação;
- pedido de alteração de atividade após aprovação.

Para o voluntário/casal:

- ajuste solicitado;
- planejamento aprovado;
- reunião agendada;
- candidatura aprovada;
- candidatura recusada;
- perfil reativado;
- decisão sobre alteração ou nova atividade pós-aprovação.

Os e-mails ao voluntário são enviados em PT/EN/ES no mesmo corpo enquanto o perfil não tiver uma preferência de idioma persistida.

## Configuração do Firestore

Publique o índice antes de ligar o Worker:

```bash
firebase deploy --only firestore:indexes
```

O índice novo habilita a consulta `collectionGroup('history')` por `createdAt`.

## Conta de serviço Google

Crie uma conta de serviço dedicada ao Worker no mesmo projeto do Firebase e conceda somente `Cloud Datastore User` (`roles/datastore.user`).

Crie uma chave JSON e use apenas estes dois valores como secrets do Worker:

- `GOOGLE_CLIENT_EMAIL`: campo `client_email`;
- `GOOGLE_PRIVATE_KEY`: campo `private_key`.

Não versione a chave JSON.

## Resend e domínio

Cadastre o domínio de envio no Resend e adicione no DNS exatamente os registros exibidos pelo painel do Resend. A pessoa que administra o domínio deve criar esses registros. Depois aguarde o domínio aparecer como verificado.

O remetente final deve ser algo como:

```text
Casa do Oleiro <voluntariado@seudominio.com.br>
```

## Secrets do Worker

Na pasta `workers/email-dispatcher`:

```bash
npm install
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put GOOGLE_CLIENT_EMAIL
npx wrangler secret put GOOGLE_PRIVATE_KEY
npx wrangler secret put MANAGEMENT_EMAILS
npx wrangler secret put TEST_EMAIL
npx wrangler secret put ADMIN_TOKEN
```

`MANAGEMENT_EMAILS` aceita um ou mais e-mails separados por vírgula ou ponto e vírgula.

## Variáveis não secretas

Edite `wrangler.toml` ou configure no painel do Worker:

- `FIREBASE_PROJECT_ID`: ID do projeto Firebase;
- `EMAIL_FROM`: remetente verificado no Resend;
- `NOTIFICATION_START_AT`: timestamp ISO do momento a partir do qual eventos poderão gerar e-mails;
- `BATCH_SIZE`: padrão `100`;
- `EMAIL_MODE`: começa em `off`.

Defina `NOTIFICATION_START_AT` para o momento imediatamente antes do teste. Não use uma data antiga, para evitar disparo de eventos históricos.

Exemplo:

```text
2026-09-02T15:00:00-03:00
```

## Deploy seguro

1. Publique o índice do Firestore.
2. Configure domínio e secrets.
3. Faça deploy com `EMAIL_MODE=off`.
4. Consulte `GET /health`; deve retornar `mode: off`.
5. Altere para `EMAIL_MODE=test`.
6. Gere um evento novo no site e execute `POST /run` com `Authorization: Bearer <ADMIN_TOKEN>` ou aguarde o cron de 5 minutos.
7. Confirme que o e-mail chegou somente em `TEST_EMAIL`.
8. Repita os cenários críticos.
9. Só depois altere para `EMAIL_MODE=production`.

O cron configurado roda a cada 5 minutos em UTC, conforme o comportamento dos Cron Triggers do Cloudflare.

## Testes automatizados

Na raiz do projeto:

```bash
npm run test:email
```

A CI também valida a sintaxe do Worker, dos hooks de histórico e o JSON de índices.

## Rollback

Para interromper imediatamente qualquer envio, mude apenas:

```text
EMAIL_MODE=off
```

Não é necessário retirar o site do ar nem reverter o GitHub Pages.
