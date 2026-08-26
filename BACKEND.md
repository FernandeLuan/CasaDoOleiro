# Backend — Casa do Oleiro

O frontend permanece estático no GitHub Pages. O backend será responsável por autenticação, persistência, autorização, regras críticas e consultas pequenas.

## Princípios

- nenhuma tela acessa Firestore diretamente; telas chamam serviços;
- consultas sempre filtradas pela unidade e pelo contexto visível;
- não carregar histórico completo na abertura;
- listas grandes usam paginação;
- loading global aparece apenas se uma operação ultrapassar 600 ms;
- Rodeio e Indaial usam o mesmo sistema e o mesmo banco;
- uma pessoa sempre possui seu próprio usuário e perfil, mesmo quando participa de uma candidatura em casal;
- dados mínimos de listagem podem ser denormalizados para evitar consultas N+1.

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
Um documento por pessoa, nunca por casal:

- `uid`
- nome e dados pessoais
- nacionalidade
- gênero
- contatos

O perfil completo é carregado somente quando necessário. A listagem do Admin usa um resumo mantido na `application` para evitar uma leitura adicional por pessoa.

### `applications`
Documento central do processo e da experiência:

- `type`: `individual` ou `couple`
- `participantUids`: um UID para individual ou dois UIDs para casal
- `participantStatus`: mapa opcional por UID (`active`, `withdrawn`)
- `participantNames`: nomes necessários para a listagem
- `participantCountries`: países necessários para a listagem
- `participantCount`: quantidade de participantes ativos/relevantes no card
- `searchTokens`: prefixos normalizados dos nomes dos participantes
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
- `source`: `portal`, `spreadsheet_migration` ou outro identificador controlado
- `createdAt`
- `updatedAt`

Na candidatura em casal existem **dois logins e dois perfis**, mas somente **uma application compartilhada**. Ambos visualizam e podem alimentar o mesmo planejamento. Se uma pessoa desistir, seu `participantStatus` pode virar `withdrawn` sem destruir a candidatura da outra.

Os campos `participantNames`, `participantCountries`, `participantCount` e `searchTokens` são um resumo controlado. Eles evitam buscar os perfis completos para montar cada card da listagem.

### `activities`
Definição da atividade: nome, descrição, duração, participação, materiais, observações e autor.

Campos importantes:
- `applicationId`
- `createdByUid`

Assim, em uma candidatura em casal sabemos qual participante criou a atividade sem duplicar o planejamento.

### `activity_sessions`
Cada ocorrência em uma data específica:
- `applicationId`
- `activityId`
- `unitId`
- `date`
- `time`
- `status`: `proposed`, `confirmed`, `change_requested`, `rejected`
- `groupId`
- `createdByUid`

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

1. A regra de segurança do backend deve impedir operações de planejamento fora da janela permitida, mesmo que o status ainda não tenha sido atualizado visualmente.
2. Na primeira versão gratuita, ao abrir o Admin, uma consulta específica busca somente candidaturas `pending` cujo `planningDeadlineAt <= agora` e processa a inativação/recusa por ID.
3. Depois, se quisermos a mudança física de status exatamente sem ninguém abrir o sistema, adicionamos uma rotina diária agendada. Ela consulta somente vencidos, não todos os voluntários.
4. Ao reativar um perfil: `status=pending`, `active=true` e um novo `planningDeadlineAt = agora + 7 dias`.

Em casal, o prazo pertence à `application`, portanto os dois participantes enxergam a mesma contagem e um único envio conclui a etapa de planejamento da candidatura.

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

Para evitar mecanismo externo de busca e leituras adicionais, a própria `application` mantém `searchTokens`, gerados a partir dos nomes dos participantes. Exemplo para `Thomas Miller`: prefixos de `Thomas` e `Miller` em minúsculas.

A consulta usa `array-contains` com o prefixo digitado, combinada com unidade/status e `limit(10)`. Assim o Admin recebe apenas as applications da página atual e não precisa abrir cada `volunteer_profile` para descobrir o nome.

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

Uma application em casal ocupa **duas pessoas** enquanto ambos os `participantStatus` estiverem ativos, apesar de a estadia existir em um único documento.

## Planejamento durante a experiência

### Candidato
Monta o planejamento pelos dias da estadia e envia para análise.

### Voluntário aprovado
A Agenda torna-se o planejamento operacional. O voluntário pode propor novas atividades/sessões durante a estadia:

- nova sessão → `proposed`;
- gestor aprova → `confirmed`;
- alteração de sessão confirmada → `change_requested`.

Não haverá uma segunda interface redundante de Planejamento para o voluntário aprovado.

Em casal, os dois participantes trabalham sobre a mesma agenda da application. `createdByUid` mantém a autoria das propostas.

## Migração das planilhas existentes

Candidatos que já preencheram a planilha não devem refazer o planejamento no portal.

Fluxo de migração:

1. exportar a planilha Google como `.xlsx` ou `.csv`;
2. mapear dados pessoais e período para `volunteer_profiles` + `applications`;
3. criar uma `activity` para cada atividade preenchida;
4. transformar cada data/horário informado em `activity_sessions`;
5. marcar `application.source = spreadsheet_migration`;
6. validar o resultado antes de liberar o primeiro acesso.

Depois da migração, o candidato entra no portal e já encontra o planejamento existente. Novos candidatos passam a usar somente o portal, evitando dois processos paralelos.

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
  firebase/
    firebase-config.js
    firebase-client.js
  services/
    auth-service.js
    auth-guard.js
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

O modo `?dev=1` usa somente mocks locais. `firebase-client.js` não inicializa Firebase nesse modo.

## Ponto de integração do login

`js/login.js` chama:

```js
window.OleiroAuth.signIn({ email, password })
```

O serviço valida Firebase Authentication, carrega `users/{uid}` e, para voluntários, localiza a `application` ativa.

Retorno mínimo:

```js
{
  role: "manager" | "volunteer" | "inactive",
  mode: "candidate" | "approved"
}
```

`admin/` e `portal/` também usam `auth-guard.js`, portanto digitar a URL interna diretamente não substitui a validação da sessão.
