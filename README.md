# Casa do Oleiro

Aplicação web de gestão de voluntariado, planejamento, seleção e ocupação.

## Ambientes e publicação

A aplicação utiliza uma única estrutura de código para homologação e produção. O build canônico é `node scripts/build-site.mjs <diretório>`. O ambiente é identificado por `APP_ENV`, e a configuração Firebase é injetada pelo pipeline. Não existem adaptadores de dados fictícios nem transformações de runtime exclusivas da homologação.

- `main`: produção. Publicação pelo workflow Deploy Casa do Oleiro, somente após aprovação explícita da release.
- `test/homologacao-clean-ui`: homologação com autenticação e dados reais. Pushes publicam exclusivamente o canal de homologação.
- `release/prod-clean-ui`: candidato de produção, mantido como PR Draft até a aprovação final.
- `release/prod-clean-ui-canonical`: integração isolada da fonte homologada com o pipeline de produção. Não publica a aplicação ao vivo.

## Validação

```bash
node --test tests/site-assets.test.mjs
node scripts/build-site.mjs site-dist
node scripts/check-site-assets.mjs site-dist
bash scripts/check-real-data-contracts.sh
npm install --no-audit --no-fund
npx playwright install chromium webkit
npm run test:e2e:emulated
```

O workflow Production Clean UI executa os contratos de dados, o build de produção, a verificação de assets e a regressão isolada em Chromium e WebKit. Os testes de navegador utilizam emuladores; não substituem a conferência final com contas reais e permissões reais. Não usar dados pessoais de produção como massa de teste automatizado.

## Segurança da release

O build publica apenas `admin`, `portal`, `css`, `js`, `icons`, os arquivos estáticos da raiz e `release.json`. Não incluir credenciais, `functions`, Rules, scripts de manutenção ou arquivos de desenvolvimento no artefato de Hosting. A API key, os demais parâmetros Firebase e a configuração de monitoramento são injetados durante o deploy.

Antes de publicar: exigir CI verde, conferir o artefato, validar as rotas e os fluxos críticos no ambiente real, confirmar o plano de rollback e obter aprovação explícita. A publicação de alterações de Firestore Rules, índices, dados e serviços de e-mail é um procedimento separado e não faz parte da limpeza visual. Nenhuma migração destrutiva é autorizada por esta release.
