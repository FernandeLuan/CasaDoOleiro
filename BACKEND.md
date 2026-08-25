# Backend — Casa do Oleiro

O frontend permanece estático no GitHub Pages. O backend será responsável por autenticação, persistência, autorização, regras críticas e consultas pequenas.

## Princípios

- nenhuma tela acessa Firestore diretamente; telas chamam serviços;
- consultas sempre filtradas pela unidade e pelo contexto visível;
- não carregar histórico completo na abertura;
- listas grandes usam paginação;
- loading global aparece apenas se uma operação ultrapassar 600 ms;
- Rodeio e Indaial usam o mesmo sistema e o mesmo banco.

## Entidades

### `users`
- `uid`
- `role`: `admin`, `coordinator`, `volunteer`
- `active`
- `language`
- `unitIds`: unidades às quais o usuário pode acessar

### `units`
- `id`: `rodeio`, `indaial`
- `name`
- `active`
- `acceptingVolunteers`
- endereço, chegada, acomodação, refeições, regras e rotina-base

Rodeio inicia ativo. Indaial pode existir desde o primeiro deploy com `active=false` e ser configurada antes da ativação.

### `volunteer_profiles`
- dados pessoais
- nacionalidade
- gênero
- contatos

### `applications`
Documento central do processo do voluntário:

- `volunteerUid`
- `unitId`
- `status`: `pending`, `analysis`, `adjustments`, `approved`, `rejected`
- `active`
- `stayStart`
- `stayEnd`
- `stayMonths`
- `planningDeadlineAt`
- `planningSubmittedAt`
- `needsAdminAttention`
- `adminAttentionReason`
- `adminAttentionUpdatedAt`
- `needsVolunteerAttention`
- `volunteerAttentionReason`
- `volunteerAttentionUpdatedAt`

### `activities`
Definição da atividade: nome, descrição, duração, participação, materiais, observações e autor.

### `activity_sessions`
Cada ocorrência em uma data específica:
- `applicationId`
- `activityId`
- `unitId`
- `date`
- `time`
- `status`: `proposed`, `confirmed`, `change_requested`, `rejected`
- `groupId`

### `groups`
Grupos por unidade, capacidade e integrantes.

## Notificações / fila de atenção

Não será criado um histórico infinito de notificações para o sino. O sino representa apenas pendências atuais.

No Admin, a consulta será semelhante a:

- `unitId == unidadeAtual`
- `needsAdminAttention == true`
- ordenar por `adminAttentionUpdatedAt desc`
- `limit(5)`

Portanto, no máximo **5 registros** são lidos/exibidos de cada vez.

Ao marcar como lida:

- `needsAdminAttention = false`

O registro desaparece da fila. Se houver outras pendências, a próxima consulta traz as próximas, novamente com limite 5.

No portal do voluntário aplica-se a mesma lógica com `needsVolunteerAttention`.

## Prazo de 7 dias

A contagem regressiva não gera uma consulta por dia.

Ao cadastrar a candidatura:

- `planningDeadlineAt = agora + 7 dias`

O navegador lê essa data junto com a candidatura e calcula localmente `deadline - agora`. Assim, `7 dias`, `6 dias`, `vence hoje` etc. não geram novas leituras.

### Quando o prazo vence

1. A regra de segurança do backend deve impedir o envio do planejamento quando `request.time > planningDeadlineAt` e o status ainda é `pending`. Portanto, mesmo que nenhum gestor abra o sistema, um envio fora do prazo não será aceito.
2. Na primeira versão gratuita, ao abrir o Admin, uma consulta específica busca somente candidaturas `pending` cujo `planningDeadlineAt <= agora` e processa a inativação/recusa por ID.
3. Depois, se quisermos a mudança física de status exatamente sem ninguém abrir o sistema, adicionamos uma rotina diária agendada. Ela consulta somente vencidos, não todos os voluntários.
4. Ao reativar um perfil: `status=pending`, `active=true` e um novo `planningDeadlineAt = agora + 7 dias`.

## Voluntários e paginação

A lista nunca deve baixar todos os voluntários.

Consulta inicial:

- unidade
- status
- busca, quando houver
- ordenação estável
- `limit(10)`

O botão **Ver mais** usa o último documento recebido (`startAfter`) para buscar os próximos 10.

Mudou filtro ou busca: cursor é descartado e a consulta volta aos primeiros 10.

### Busca por nome

Para evitar mecanismo externo de busca, cada perfil pode manter `searchTokens`, gerados ao salvar o nome. Exemplo para `Thomas Miller`: prefixos de `Thomas` e `Miller` em minúsculas. A busca usa `array-contains` com o prefixo digitado e retorna no máximo 10 documentos.

Isso permite buscar pelo início do nome ou sobrenome sem ler a coleção inteira.

## Loading

Operações rápidas não devem piscar um loader. O frontend possui um loading global atrasado:

- até 600 ms: nada aparece;
- passou de 600 ms: mostra `Carregando...`;
- terminou: desaparece.

Todos os serviços assíncronos deverão executar através de `OleiroLoading.run(...)`.

## Agenda

Consultar apenas o período que o usuário está vendo. Nunca carregar todas as sessões históricas na inicialização.

Exemplo semanal:
- `unitId == rodeio`
- `date >= início`
- `date <= fim`

## Ocupação mensal

Não fazer uma consulta por dia.

Cada candidatura aprovada mantém `stayMonths`, por exemplo:

`["2026-08", "2026-09"]`

O calendário consulta somente candidaturas aprovadas da unidade cujo `stayMonths` contenha o mês exibido. O navegador monta os dias e as bolinhas localmente.

## Planejamento durante a experiência

### Candidato
Monta o planejamento pelos dias da estadia e envia para análise.

### Voluntário aprovado
A Agenda torna-se o planejamento operacional. O voluntário pode propor novas atividades/sessões durante a estadia:

- nova sessão → `proposed`;
- gestor aprova → `confirmed`;
- alteração de sessão confirmada → `change_requested`.

Não haverá uma segunda interface redundante de Planejamento para o voluntário aprovado.

## Rodeio e Indaial

Não existem dois sistemas.

Todos os documentos operacionais possuem `unitId`.

- `rodeio`: começa ativa;
- `indaial`: começa cadastrada como inativa/em preparação.

Quando Indaial estiver configurada, o Admin ativa `units/indaial.active=true`. A partir daí ela pode aparecer nos cadastros e nos seletores de unidade.

Coordenadores podem possuir acesso apenas à própria unidade. O Admin geral pode alternar entre unidades.

## Camada de serviços

Estrutura alvo:

```text
js/
  services/
    auth-service.js
    application-service.js
    planning-service.js
    agenda-service.js
    unit-service.js
    group-service.js
    attention-service.js
```

Admin e Portal chamam esses serviços. O Firebase fica encapsulado neles.

## Modo de desenvolvimento

Dados de regressão ficam em `js/shared/mock-data.js` e só são carregados com `?dev=1`.

A massa deve conter mais de 10 aprovados e mais de 5 pendências para validar paginação e limites antes da conexão do backend.

## Ponto de integração do login

`js/login.js` procura por:

```js
window.OleiroAuth.signIn({ email, password })
```

O backend deve retornar, no mínimo:

```js
{
  role: "manager" | "volunteer" | "inactive",
  mode: "candidate" | "approved"
}
```
