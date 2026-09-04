# Reconstrução da homologação

## Fonte de verdade

- `main`: regras de negócio, serviços, persistência, contratos e fluxos funcionais.
- `test/prod-copy-no-login-r62`: referência visual e de UX congelada.
- `test/homologacao-clean-ui`: única branch ativa para a reconstrução da homologação.

## Regras

1. Não alterar `main` durante a reconstrução visual.
2. Não criar novos arquivos `rXX`, `roundXX`, `recovery`, `bootstrap` ou equivalentes para corrigir camadas anteriores.
3. Alterações visuais devem ser consolidadas nos componentes responsáveis.
4. A homologação pode substituir Auth/IO por adapters em memória, mas deve manter os contratos dos serviços de produção.
5. Regras de aprovação, reajuste, recusa, confirmação, movimento, grupos, conta, histórico e perfil devem continuar vindo dos fluxos reais da aplicação.
6. A branch R62 não deve receber novos commits; ela é somente referência/rollback visual.

## Visual a preservar

- Home compacta com saudação, Hoje na Casa, pendências e próximas movimentações.
- Voluntariado com status ao lado do nome.
- Perfil em página dedicada com Planejamento, Conta e Histórico.
- Planejamento por semanas/dias úteis, duas colunas no desktop, uma coluna em tablet/mobile, cards independentes e ações contextuais.
- Conta consolidada com participantes, contatos de emergência, período, unidade, link e status de acesso.
- Histórico integrado ao mesmo perfil.

## Estratégia de Git

- Uma branch ativa para a reconstrução: `test/homologacao-clean-ui`.
- Commits pequenos por assunto.
- PRs visuais antigos permanecem apenas como referência até a nova homologação ficar estável.
- Depois da validação, fechar PRs obsoletos e remover branches antigas já absorvidas.
