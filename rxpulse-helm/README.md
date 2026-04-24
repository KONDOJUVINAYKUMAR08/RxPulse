# RxPulse Helm Charts

Production-grade Helm charts for the **RxPulse** pharmacy management platform.

## Structure

```
rxpulse-helm/
├── charts/                  # Microservice Helm charts
│   ├── catalog/             # Catalog service (medicines, categories)
│   ├── inventory/           # Inventory service (stock, alerts, movements)
│   ├── user/                # User service (auth, registration)
│   └── frontend/            # React SPA with Argo Rollouts blue-green
│
├── infra/                   # Infrastructure layer (deploy first)
│   ├── rbac/                # Namespace + ConfigMap
│   ├── sealed-secrets/      # Kubernetes Secret (dev) / SealedSecret (prod)
│   ├── mongodb/             # MongoDB StatefulSets + Services + PVCs
│   └── gateway/             # KGateway + HTTPRoute
│
├── environments/            # Per-environment value overrides
│   ├── values-dev.yaml
│   └── values-prod.yaml
│
├── argocd/                  # ArgoCD GitOps manifests
│   ├── project.yaml
│   ├── apps/frontend.yaml   # Manual blue-green deployment
│   ├── applicationset-dev.yaml
│   └── applicationset-prod.yaml
│
└── README.md
```

## Quick Start (Dev)

### 1. Deploy Infrastructure (in order)

```bash
NAMESPACE=rxpulse-dev

# 1. Namespace + ConfigMap
helm install rxpulse-rbac ./infra/rbac \
  -n $NAMESPACE --create-namespace \
  -f environments/values-dev.yaml

# 2. Secrets
helm install rxpulse-secrets ./infra/sealed-secrets \
  -n $NAMESPACE \
  -f environments/values-dev.yaml

# 3. MongoDB
helm install rxpulse-mongodb ./infra/mongodb \
  -n $NAMESPACE \
  -f environments/values-dev.yaml

# 4. Gateway
helm install rxpulse-gateway ./infra/gateway \
  -n $NAMESPACE \
  -f environments/values-dev.yaml
```

### 2. Deploy Services

```bash
helm install rxpulse-user      ./charts/user      -n $NAMESPACE -f environments/values-dev.yaml
helm install rxpulse-catalog   ./charts/catalog   -n $NAMESPACE -f environments/values-dev.yaml
helm install rxpulse-inventory ./charts/inventory -n $NAMESPACE -f environments/values-dev.yaml
helm install rxpulse-frontend  ./charts/frontend  -n $NAMESPACE -f environments/values-dev.yaml
```

### 3. Upgrade a service (e.g. after image rebuild)

```bash
helm upgrade rxpulse-frontend ./charts/frontend \
  -n $NAMESPACE \
  -f environments/values-dev.yaml \
  --set frontend.image.tag=v4
```

---

## Production Deployment

> ⚠️ **Never commit real production secrets.** Use CI/CD secret injection.

```bash
NAMESPACE=rxpulse-prod

# Inject secrets via CI/CD before deploy:
# kubectl create secret generic rxpulse-secrets \
#   --from-literal=JWT_SECRET=$(openssl rand -base64 64) \
#   --from-literal=MONGO_ROOT_PASSWORD=<strong-pw> \
#   -n $NAMESPACE --dry-run=client -o yaml | kubeseal -o yaml > sealed.yaml

helm install rxpulse-rbac      ./infra/rbac           -n $NAMESPACE --create-namespace -f environments/values-prod.yaml
helm install rxpulse-mongodb   ./infra/mongodb         -n $NAMESPACE -f environments/values-prod.yaml
helm install rxpulse-gateway   ./infra/gateway         -n $NAMESPACE -f environments/values-prod.yaml
helm install rxpulse-user      ./charts/user           -n $NAMESPACE -f environments/values-prod.yaml
helm install rxpulse-catalog   ./charts/catalog        -n $NAMESPACE -f environments/values-prod.yaml
helm install rxpulse-inventory ./charts/inventory      -n $NAMESPACE -f environments/values-prod.yaml
helm install rxpulse-frontend  ./charts/frontend       -n $NAMESPACE -f environments/values-prod.yaml
```

---

## ArgoCD GitOps

```bash
# Apply the ArgoCD project first
kubectl apply -f argocd/project.yaml

# Deploy dev (auto-sync, all services except frontend)
kubectl apply -f argocd/applicationset-dev.yaml

# Deploy prod (manual sync)
kubectl apply -f argocd/applicationset-prod.yaml

# Deploy frontend manually (blue-green)
kubectl apply -f argocd/apps/frontend.yaml
```

---

## Secret Management

| Environment | Approach |
|-------------|----------|
| Dev         | Plain Kubernetes `Secret` via `infra/sealed-secrets` chart |
| Prod        | `SealedSecret` created via `kubeseal` + injected by CI/CD |

---

## Secrets Audit

The following hardcoded values exist **in dev only** and must be rotated before going to production:

| Key | Location | Action |
|-----|----------|--------|
| `JWT_SECRET` | `environments/values-dev.yaml` | Generate with `openssl rand -base64 64` |
| `MONGO_ROOT_PASSWORD` | `environments/values-dev.yaml` | Replace with a strong password |
| `MONGO_*_URI` | `environments/values-dev.yaml` | Add auth credentials for prod |
