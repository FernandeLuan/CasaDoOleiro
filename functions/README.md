# Ferramentas administrativas — Cloud Shell

Apesar do nome histórico da pasta, este diretório **não contém Firebase Cloud Functions** e não é publicado como Functions. O projeto permanece no plano Spark.

Os scripts usam `firebase-admin` somente quando executados manualmente por um administrador no Google Cloud Shell.

## Preparação

```bash
cd ~/CasaDoOleiro
git pull
cd functions
npm install
```

No primeiro uso, se necessário:

```bash
gcloud auth application-default login
```

## Auditar um cadastro

Somente leitura/diagnóstico:

```bash
node tools/audit-volunteer.js email@exemplo.com
```

Para oferecer reparos seguros reconhecidos pelo script:

```bash
node tools/audit-volunteer.js email@exemplo.com --repair
```

Nenhum reparo é aplicado sem a confirmação literal `REPARAR`.

## Excluir definitivamente

```bash
node tools/delete-volunteer.js email@exemplo.com
```

Exige a confirmação literal `EXCLUIR`.

## Alterar e-mail antes do primeiro acesso

```bash
node tools/update-volunteer-email.js email-antigo@exemplo.com novo@exemplo.com
```

A alteração sincroniza Authentication e documentos relacionados e deve ser usada apenas antes do primeiro acesso do voluntário.
