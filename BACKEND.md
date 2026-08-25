# Backend — Casa do Oleiro

O frontend está hospedado no GitHub Pages e permanece estático. O backend deve ser responsável por autenticação, persistência, regras críticas e consultas.

## Entidades mínimas

- `users`: autenticação, papel (`admin`, `coordinator`, `volunteer`), ativo/inativo e idioma.
- `volunteer_profiles`: dados pessoais, nacionalidade, gênero, unidade, chegada e saída.
- `applications`: status do processo (`pending`, `analysis`, `adjustments`, `approved`, `rejected`) e prazo de envio.
- `activities`: atividade proposta pelo voluntário.
- `activity_sessions`: datas/horários, status e grupo atribuído.
- `groups`: grupos da comunidade e capacidade.
- `notifications`: somente pendências não lidas para o usuário.
- `units`: unidades, informações e configuração operacional.

## Regras que devem sair do navegador

1. Autenticação e autorização por papel.
2. Recusa/inativação de um único perfil por `id`.
3. Prazo de 7 dias e expiração automática.
4. Aprovação e pedido de ajustes.
5. Persistência de atividades e sessões.
6. Notificações: consultar somente não lidas e remover/arquivar ao marcar como lida.
7. Cálculo de ocupação mensal a partir de estadias aprovadas.

## Estratégia de consultas

Para manter o custo baixo:

- não buscar histórico completo na abertura do app;
- dashboard deve usar consultas pequenas ou agregadas;
- notificações: `unread = true`, ordenadas e limitadas;
- voluntários: paginação/filtros no servidor quando a base crescer;
- agenda: consultar somente o período visível;
- ocupação: consultar somente estadias que intersectem o mês exibido.

## Modo de desenvolvimento

Dados de demonstração ficam em `js/shared/mock-data.js` e são carregados apenas quando a URL contém `?dev=1`.

Exemplo:

`/CasaDoOleiro/?dev=1`

Esse modo deve ser removido quando autenticação e banco estiverem estáveis.

## Ponto de integração do login

`js/login.js` procura por:

```js
window.OleiroAuth.signIn({ email, password })
```

A implementação do backend deve retornar, no mínimo:

```js
{
  role: "manager" | "volunteer" | "inactive",
  mode: "candidate" | "approved"
}
```

Depois da autenticação real, o restante do frontend deve receber dados por serviços e não acessar mocks/localStorage diretamente.
