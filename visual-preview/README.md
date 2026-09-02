# Homologação visual R57

Este diretório é um protótipo navegável e isolado do redesign do Casa do Oleiro.

## Segurança

- usa apenas massa fictícia de `demo-data.js`;
- não inicializa Firebase Authentication;
- não lê nem grava Firestore;
- não envia e-mails;
- não cria usuários reais;
- ações de cadastro, replicação e inclusão são apenas simuladas no navegador.

## Rodada R57

- tipografia sem serifa mais atual e consistente;
- alinhamentos e espaçamentos refinados no desktop;
- contato de emergência com os mesmos campos do produto real: nome, relação e telefone;
- perfil do candidato mostra contato de emergência na aba Conta;
- cadastro individual/dupla mostra contato de emergência por participante;
- mobile recomposto como tela própria, sem desktop espremido;
- lista de candidatos em cards mobile;
- perfil e formulários em tela cheia no celular;
- planejamento, agenda e Portal adaptados para uma coluna;
- navegação inferior reduzida às três áreas funcionais;
- testes de regressão verificam overflow horizontal e campos visíveis.

## Publicar em Firebase Hosting Preview Channel

A partir da raiz do repositório, na branch `test/visual-redesign-r56`:

```bash
firebase hosting:channel:deploy visual-redesign --project casadooleiro-35c4e --config firebase.preview.json
```

O Firebase CLI retorna a URL temporária do canal de preview. A publicação não altera o GitHub Pages de produção.

## Telas incluídas

- lista de candidatos com busca, filtros e diferentes status;
- perfil do candidato com Planejamento, Conta e Histórico;
- planejamento com dias, atividades e dias vazios;
- Replicar atividade e Adicionar atividade;
- formulário de novo candidato individual/dupla;
- contato de emergência por participante;
- agenda administrativa;
- visão simulada do portal do voluntário;
- desktop, tablet e mobile.
