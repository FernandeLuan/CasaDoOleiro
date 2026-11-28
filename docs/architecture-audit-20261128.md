# Auditoria de arquitetura — 2026-11-28

## Escopo e referência

Auditoria estática do repositório `FernandeLuan/CasaDoOleiro`, na revisão da `main` em `6275a8166b1c99ec64297deeab5c73026ae00b5b`.

Foram inspecionados os entrypoints do Admin e Portal, inventário de módulos, serviços Firebase, navegação, central de configurações, workflows, scripts de build/auditoria e contratos de testes. Esta revisão não executa consultas contra dados reais nem altera regras, índices ou documentos de produção.

## Arquitetura pretendida — decisões preservadas

- Frontend estático no GitHub Pages; Firebase Authentication e Cloud Firestore como backend.
- Portal e Administração com módulos de tela separados.
- Firestore encapsulado em `js/services`; telas consomem serviços, não SDK diretamente.
- Escopo por unidade aplicado nos serviços e reforçado por regras de segurança.
- Listas paginadas, agendas limitadas por intervalo, ocupação por mês/unidade e detalhes sob demanda.
- Cache deve evitar leituras simultâneas duplicadas sem esconder atualizações posteriores.
- Casais compartilham uma candidatura/planejamento, mas cada participante mantém usuário e perfil próprios.
- Testes usam emuladores e massa isolada; dados pessoais de produção não devem ser massa de regressão.
- Mudanças em regras e índices Firestore permanecem em fluxo de publicação separado e explicitamente confirmado.

## O que está bem encaminhado

1. `BACKEND.md` documenta limites de leitura, paginação, escopo por unidade e responsabilidades dos serviços.
2. `service-core.js` compartilha leituras idênticas simultâneas e limpa a promessa após conclusão; não transforma esse mecanismo em cache permanente.
3. `query-reads.test.mjs` cobre deduplicação simultânea, isolamento por usuário, falhas e invalidação por atualização.
4. `runtime-architecture.test.mjs` impede acesso direto ao Firestore nos módulos de tela e protege alguns pontos de propriedade única de renderização.
5. O build verifica módulos JS sem entrypoint, scripts duplicados, sintaxe e integridade de assets.
6. A publicação de regras/índices é manual, exige confirmação explícita e executa testes de isolamento no emulador antes de autenticar no projeto de produção.
7. O CI de PR inclui build limpo e regressões de navegador em Chromium e iPhone WebKit.

## Achados

### A1 — Navegação de Unidades mantém categoria obsoleta
**Severidade: média | Correção aplicada nesta branch**

`unit-management.js` adicionava um botão Voltar que chamava `openSettingsCategory('house')`. Essa categoria reapresentava Unidades e Grupos, embora ambos já estejam diretamente na raiz de Configurações. A ação de retorno foi alterada para `openMyAccount()`, e o ramo de categoria `house` foi removido. Informações da Casa também retorna à raiz.

Foi incluído teste de arquitetura para impedir a reintrodução desse caminho.

### A2 — Informações da Casa tem três implementações concorrentes
**Severidade: alta | Requer consolidação dedicada**

Há markup e comportamento de Informações da Casa em:
- `js/admin/admin-navigation.js` (`houseInfoHtml`, rotina e resumo de unidades);
- `js/admin/house-info-page.js` (renderer de página e alternância de status da unidade);
- `js/admin/admin-settings-center.js` (modal aberto por `openHouseInfo`).

Além disso, `admin-navigation.js` e `house-info-page.js` envolvem `renderManager` com decorators. O fluxo atual de Configurações substitui `openHouseInfo` por uma abertura de modal, tornando os renderizadores de página anteriores caminhos concorrentes/legados. A ordem de carregamento decide qual implementação global prevalece.

**Recomendação:** escolher um único proprietário de Informações da Casa, preservar apenas o comportamento ativo e retirar os wrappers e estilos duplicados depois de adicionar regressões para o modal e para os dados exibidos.

### A3 — Navegação e ações antigas permanecem em módulos carregados
**Severidade: média | Requer análise de referências antes de remoção**

- `js/admin/menu.js` ainda define `managerMenu`, `openUnits` e `openMyAccount`; os dois últimos são substituídos por módulos posteriores. O arquivo também contém funções de ocupação mensal que continuam relevantes, portanto não pode ser excluído integralmente sem separar responsabilidades.
- `js/admin/grupos.js` contém o renderer antigo `managerGroups` e o fluxo antigo de edição. `js/admin/groups-page.js` redefine `managerGroups` e implementa o fluxo atual. O módulo antigo continua carregado e seus contratos ainda são exigidos por `check-real-data-contracts.sh`.
- `admin-navigation.js` mantém a conversão de `managerPage === 'menu'` para `houseInfo`, embora o menu não faça parte da navegação atual.

**Recomendação:** rastrear referências de cada função global, migrar os consumidores, retirar os módulos substituídos dos entrypoints e só então marcá-los como aposentados/removê-los. Não apagar `menu.js` inteiro, pois contém lógica ativa de ocupação.

### A4 — Teste de regressão validava arquivo aposentado
**Severidade: média | Correção aplicada nesta branch**

O teste “analysis copy never says editing is blocked” lia `js/portal/experience-summary.js`, mas esse arquivo consta em `runtime-retired-modules.json` e não deve ser carregado pelo Portal. O contrato foi movido para `js/portal/home.js`, o proprietário atual da Home, e o teste agora também verifica que o módulo aposentado não está no entrypoint.

### A5 — Auditoria automática de dependências não prova propriedade única
**Severidade: média | Melhoria estrutural recomendada**

`audit-runtime-dependencies.mjs` usa expressões regulares para inventariar referências a `state`, serviços, atribuições globais e acesso direto ao Firestore. É útil como diagnóstico, mas não constrói uma árvore sintática nem resolve ordem de execução, aliases, propriedades indiretas ou chamadas dinâmicas. Portanto, não consegue provar que uma função global possui um único escritor nem que um teste representa o runtime atual.

**Recomendação:** adicionar uma verificação explícita de propriedade dos símbolos globais críticos (renderers, navegação e ações) e contratos que comparem entrypoints, manifesto de módulos aposentados e testes ativos. A análise deve classificar definições, atribuições e consumidores, não apenas procurar texto.

### A6 — Cobertura de consulta é boa, mas não universal
**Severidade: média | Requer instrumentação gradual**

Os serviços registram consultas e há testes de deduplicação de leituras pontuais e concorrentes. Entretanto, os testes de orçamento existentes cobrem fluxos específicos, não todos os caminhos de inicialização, troca de unidade, abertura/fechamento de modais e reentrada na tela. A listagem de unidades usa leitura da coleção inteira; isso é aceitável enquanto o catálogo continuar pequeno e administrativo, mas deve ser tratado como coleção de configuração, não como padrão para listas operacionais.

**Recomendação:** medir consultas por fluxo E2E e por sessão, definir orçamento por tela e testar que abrir Configurações, Unidades e Grupos não dispara leituras duplicadas sem necessidade. Não adicionar cache persistente para mascarar leituras repetidas.

## Plano de consolidação recomendado

1. Consolidar Informações da Casa e navegação de Configurações em um único proprietário; remover os wrappers concorrentes de `renderManager`.
2. Aposentar `grupos.js` após remover os contratos antigos e provar ausência de consumidores; manter `groups-page.js` como proprietário.
3. Separar a parte ativa de ocupação de `menu.js`; remover somente as funções antigas de menu/conta/unidades e a rota de menu, após cobertura de regressão.
4. Fortalecer a auditoria de símbolos globais e dos testes para detectar contratos ligados a arquivos aposentados.
5. Instrumentar orçamento de consultas para os fluxos Admin/Portal mais usados.
6. Só depois da consolidação, revisar CSS duplicado e arquivos de compatibilidade, preservando rollback e publicando em PRs pequenos.

## Limites desta auditoria

- Nenhuma regra ou índice Firestore foi alterado.
- Nenhum documento ou dado real foi lido/escrito para fins de teste.
- A análise de código morto é conservadora: arquivo carregado ou função global não utilizada precisa de rastreamento de consumidores e regressão antes de exclusão.
- A auditoria não declara o repositório livre de código morto; identifica caminhos comprovadamente redundantes e uma sequência segura para a consolidação restante.
