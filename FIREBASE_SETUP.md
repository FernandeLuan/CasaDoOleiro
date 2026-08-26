# Firebase — configuração inicial da Casa do Oleiro

Esta etapa conecta o frontend estático do GitHub Pages ao Firebase Authentication e ao Cloud Firestore.

## 1. Criar o projeto

No Firebase Console:

1. criar um projeto chamado `CasaDoOleiro`;
2. Google Analytics pode permanecer desativado nesta fase;
3. permanecer no plano Spark enquanto os recursos usados couberem nas cotas gratuitas.

## 2. Registrar o app Web

Em **Project settings → General → Your apps → Web (`</>`)**:

- nickname: `Casa do Oleiro Web`;
- não é necessário ativar Firebase Hosting, pois o site continua no GitHub Pages;
- copiar o objeto `firebaseConfig` fornecido pelo Console.

O objeto será colocado em `js/firebase/firebase-config.js`.

## 3. Authentication

Em **Authentication**:

1. habilitar `Email/Password`;
2. em **Settings → Authorized domains**, adicionar `fernandeluan.github.io`;
3. não habilitar Phone/SMS nesta etapa.

## 4. Firestore

Criar o Cloud Firestore em **Production mode**.

Preferir uma região próxima da operação da Casa do Oleiro, como São Paulo, quando disponível e adequada no Console. A localização deve ser escolhida com cuidado antes de criar o banco.

O repositório já contém:

- `firestore.rules`;
- `firestore.indexes.json`;
- `firebase.json`.

As regras começam fechadas por padrão e só liberam operações explicitamente autorizadas.

## 5. Primeiro administrador

Depois que Authentication e Firestore estiverem ativos:

1. criar o primeiro usuário administrador em **Authentication → Users**;
2. guardar a senha somente com o responsável — nunca enviar a senha pelo chat ou colocar no GitHub;
3. copiar o UID gerado;
4. criar manualmente no Firestore o documento `users/{UID}` com, no mínimo:

```text
role: "admin"
active: true
language: "pt"
unitIds: ["rodeio", "indaial"]
```

O Console do Firebase pode criar esse documento inicial mesmo antes de o próprio app possuir permissão de escrita.

## 6. Unidades iniciais

Criar:

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

Indaial já existe no modelo desde o início, mas permanece invisível para novos cadastros até ser ativada.

## 7. Estratégia de leitura

A lista do Admin usa `applications` como documento de resumo. Para evitar N+1 leituras, cada application mantém também dados mínimos denormalizados para o card:

- `participantNames`;
- `participantCount`;
- `participantCountries`;
- `searchTokens`.

Assim, uma página com 10 candidaturas pode ser montada com aproximadamente 10 leituras de application. Os perfis completos são buscados somente ao abrir os detalhes.

## 8. Ambiente de desenvolvimento

`?dev=1` permanece isolado:

- usa somente `mock-data.js`;
- não inicializa Firebase;
- não lê dados reais;
- continua disponível para regressão do frontend.

## 9. Ordem de ativação

1. preencher `firebase-config.js`;
2. publicar as regras e índices;
3. criar o primeiro Admin;
4. validar login e proteção de rotas;
5. conectar listagem de voluntários;
6. conectar candidatura/perfil;
7. migrar planilhas existentes;
8. conectar planejamento e sessões;
9. conectar sino, agenda, grupos e ocupação.
