#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="casadooleiro-35c4e"
REPO="FernandeLuan/CasaDoOleiro"
BRANCH="test/homologacao-clean-ui"
SA_NAME="github-homologacao"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_ID="github-actions"
PROVIDER_ID="casadooleiro-homologacao"

command -v gcloud >/dev/null 2>&1 || { echo "gcloud não encontrado."; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "GitHub CLI (gh) não encontrado."; exit 1; }

gcloud config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

echo "1/6 Preparando conta de serviço..."
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="GitHub Homologacao Deploy" \
    --project "$PROJECT_ID" >/dev/null
fi

echo "2/6 Concedendo permissões do Firebase Hosting..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/firebasehosting.admin" \
  --condition=None >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/serviceusage.serviceUsageConsumer" \
  --condition=None >/dev/null

echo "3/6 Preparando Workload Identity Pool..."
if ! gcloud iam workload-identity-pools describe "$POOL_ID" \
  --location=global --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --location=global \
    --display-name="GitHub Actions" \
    --project "$PROJECT_ID" >/dev/null
fi

echo "4/6 Preparando provider restrito a esta branch..."
if gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --workload-identity-pool="$POOL_ID" \
  --location=global --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" \
    --location=global \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='${REPO}' && assertion.ref=='refs/heads/${BRANCH}'" \
    --project "$PROJECT_ID" >/dev/null
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --workload-identity-pool="$POOL_ID" \
    --location=global \
    --display-name="Casa do Oleiro homologacao" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='${REPO}' && assertion.ref=='refs/heads/${BRANCH}'" \
    --project "$PROJECT_ID" >/dev/null
fi

MEMBER="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${REPO}"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="$MEMBER" \
  --project "$PROJECT_ID" >/dev/null

PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo "5/6 Salvando o identificador público no GitHub..."
if ! gh auth status >/dev/null 2>&1; then
  echo "Autorize o GitHub CLI uma única vez e, ao terminar, o script continuará."
  gh auth login
fi

gh variable set GCP_WIF_PROVIDER \
  --repo "$REPO" \
  --body "$PROVIDER_RESOURCE"

echo "6/6 Disparando o primeiro deploy automático..."
gh workflow run deploy-homologacao.yml \
  --repo "$REPO" \
  --ref "$BRANCH"

echo
echo "Configuração concluída."
echo "Daqui em diante, cada push em ${BRANCH} publica a homologação automaticamente."
