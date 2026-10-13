# Firebase — configuração e operação da Casa do Oleiro

Este documento descreve a configuração existente do Firebase, os registros iniciais que precisam ser provisionados manualmente e os controles usados nos testes e deploys. Não crie um segundo projeto para seguir este guia.

## 1. Projeto e configuração Web

O projeto utilizado pelos workflows de produção e homologação é `casadooleiro-35c4e`. O arquivo `js/firebase/firebase-config.js` permanece sem configuração de produção no Git: os workflows injetam a configuração Web durante o build. **Não** cole chaves de produção nesse arquivo nem versione arquivos de configuração gerados.

Os workflows de Pages e homologação obtêm a Web API key do secret de repositório `FIREBASE_API_KEY`. Restrinja essa chave no Google Cloud às APIs Firebase necessárias e aos referenciadores HTTP autorizados para o site. A chave Web identifica o projeto; não substitui as regras de segurança do Firestore nem credenciais administrativas.

A publicação de produção exige o secret `SENTRY_DSN`. O workflow de Pages falha antes de publicar se o secret estiver ausente, para que um build não desative silenciosamente o monitoramento.

## 2. Authentication

No Firebase Authentication:

1. habilite o provedor **Email/Password**;
2. mantenha o domínio de produção do site em **Authorized domains** — atualmente `fernandeluan.github.io`;
3. não habilite Phone/SMS sem uma alteração explícita dos requisitos do produto.

O aplicativo cria contas de voluntários pelo Firebase Authentication. A autorização correspondente depende do documento `users/{UID}` e das regras do Firestore. Ter uma conta autenticada, por si só, não concede acesso administrativo.

## 3. Firestore e regras

Use o banco Cloud Firestore já configurado para o projeto. O repositório versiona as regras em `firestore.rules` e os índices em `firestore.indexes.json`. As regras devem ser validadas no emulador antes de qualquer publicação. O workflow de produção valida as permissões e publica **regras e índices** quando `firestore.rules`, `firestore.indexes.json` ou o próprio workflow mudam em `main`. A publicação permanece bloqueada fora de `main`; não execute deploy de produção como parte de uma auditoria local.

A autorização de coordenadores deve respeitar as unidades em `unitIds`. Não use uma substituição genérica por `isManager()` onde for necessário validar a unidade do registro. Administradores mantêm acesso global; coordenadores e assistentes permanecem limitados aos escopos permitidos pelas regras.

## 4. Primeiro administrador e unidades iniciais

Esses registros são criados manualmente por um responsável autorizado no Console Firebase, não pelo aplicativo.

1. Em **Authentication → Users**, crie o primeiro administrador e copie o UID. Guarde a senha somente com o responsável; nunca a envie no chat, inclua no Git ou exponha em logs.
2. No Firestore, crie `users/{UID}` com pelo menos:

   ```text
   role: "admin"
   active: true
   language: "pt"
   unitIds: ["rodeio", "indaial"]
   ```

3. Garanta a existência dos documentos iniciais das unidades:

   ```text
   units/rodeio
   name: "Rodeio"
   active: true
   acceptingVolunteers: true
   ```

   ```text
   units/indaial
   name: "Indaial"
   active: false
   acceptingVolunteers: false
   ```

   Indaial permanece indisponível para novas candidaturas até que o responsável a ative.

## 5. Estratégia de leitura e dados de planejamento

O Admin utiliza `applications` como documento-resumo. Para evitar leituras N+1, cada candidatura mantém dados mínimos denormalizados para o cartão:

- `participantNames`;
- `participantCount`;
- `participantCountries`;
- `searchTokens`.

Os perfis completos devem ser carregados apenas quando os detalhes da candidatura são abertos. Ao alterar esses campos, preserve a consistência do resumo com os perfis e participantes relacionados.

## 6. Desenvolvimento local e testes

O modo `?dev=1` usa dados mock e não inicializa Firebase nem lê dados reais. A configuração Web fonte continua vazia para que abrir o aplicativo localmente não conecte acidentalmente ao projeto de produção.

Instale as dependências reproduzíveis a partir do lockfile e execute os testes de regras no emulador local:

```sh
npm ci
npm run test:firestore:rules
```

A suíte ampliada usa os emuladores de Auth e Firestore, popula contas e registros sintéticos e executa os testes Playwright:

```sh
npm run test:e2e:emulated
```

Os testes devem usar o projeto de demonstração `demo-casadooleiro` e não devem conectar-se a dados de produção. Antes de uma liberação, valide login e proteção de rotas, isolamento entre unidades, candidatura/planejamento do voluntário, fluxos do assistente, grupos, agenda e ocupação.

## 7. Ordem operacional de ativação/recuperação

1. conferir os secrets e a configuração de domínio no ambiente correto;
2. validar as regras e índices no emulador;
3. provisionar ou verificar o primeiro administrador e as unidades;
4. validar login, proteção de rotas e acesso por perfil/unidade;
5. testar candidatura, perfil e planejamento;
6. testar agenda, sessões, grupos, assistentes e ocupação;
7. seguir o processo de release aprovado para homologação e produção.

Não utilize uma execução local ou uma auditoria de código como autorização implícita para publicar alterações em produção.
