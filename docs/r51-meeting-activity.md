# R51 — nova atividade enquanto aguarda reunião

Quando a candidatura está em `meeting`, o planejamento já aprovado permanece protegido. O candidato pode apenas criar uma nova atividade, que entra como `postApprovalProposal` e volta para revisão da gestão.

Regras preservadas:
- atividades já aprovadas continuam sem edição pelo candidato;
- novas propostas ficam em `reviewStatus=analysis`;
- proposta devolvida para reajuste pode ser reenviada;
- chegada, saída e fins de semana continuam bloqueados;
- o perfil mostra um atalho para adicionar atividade;
- mudanças em atividades já confirmadas continuam permitidas somente após aprovação final (`approved`).

Após o merge, publicar `firestore.rules` no projeto Firebase antes do teste real de gravação.
