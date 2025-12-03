# 🔄 CI/CD Pipeline

Continuous Integration and Continuous Deployment with GitHub Actions.

---

## 📊 Overview

Builder Layer End uses **10 GitHub Actions workflows** for automation:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `test.yml` | Push, PR | Run unit tests |
| `lint.yml` | Push, PR | Code linting |
| `integration-tests.yml` | PR to main | Integration tests |
| `codeql.yml` | Push, Schedule | Security analysis |
| `dependency-review.yml` | PR | Dependency security |
| `release.yml` | Tag push | Create releases |
| `deploy.yml` | Release | Deploy to production |
| `stale.yml` | Schedule | Close stale issues |
| `auto-label.yml` | PR | Auto-label PRs |

---

## 🧪 Test Workflow

`.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  python-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r requirements/dev.txt
          pip install -e .
      
      - name: Run tests with coverage
        run: |
          pytest --cov=src --cov-report=xml --cov-report=html
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: coverage.xml
          fail_ci_if_error: true

  node-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            apps/traffic-web-app/frontend/package-lock.json
            apps/traffic-web-app/backend/package-lock.json
      
      - name: Install and test frontend
        run: |
          cd apps/traffic-web-app/frontend
          npm ci
          npm test
      
      - name: Install and test backend
        run: |
          cd apps/traffic-web-app/backend
          npm ci
          npm test
```

---

## 🔍 Lint Workflow

`.github/workflows/lint.yml`:

```yaml
name: Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  python-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'
      
      - name: Install linters
        run: pip install black isort flake8 mypy
      
      - name: Check black formatting
        run: black --check src/ tests/
      
      - name: Check import sorting
        run: isort --check-only src/ tests/
      
      - name: Flake8 linting
        run: flake8 src/ tests/
      
      - name: Type checking
        run: mypy src/

  js-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Lint frontend
        run: |
          cd apps/traffic-web-app/frontend
          npm ci
          npm run lint
      
      - name: Lint backend
        run: |
          cd apps/traffic-web-app/backend
          npm ci
          npm run lint
```

---

## 🔗 Integration Tests

`.github/workflows/integration-tests.yml`:

```yaml
name: Integration Tests

on:
  pull_request:
    branches: [main]

jobs:
  integration:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: timescale/timescaledb:latest-pg15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: traffic_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      neo4j:
        image: neo4j:5.12-community
        env:
          NEO4J_AUTH: neo4j/test
        ports:
          - 7687:7687
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: pip install -r requirements/dev.txt
      
      - name: Run integration tests
        env:
          POSTGRES_HOST: localhost
          REDIS_HOST: localhost
          NEO4J_URI: bolt://localhost:7687
        run: pytest tests/integration/ -v
```

---

## 🔒 Security Analysis

`.github/workflows/codeql.yml`:

```yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    strategy:
      matrix:
        language: ['python', 'javascript']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

---

## 📦 Release Workflow

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'
      
      - name: Install build tools
        run: pip install build wheel
      
      - name: Build package
        run: python -m build
      
      - name: Create release archive
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          tar -czvf builder-layer-end-$VERSION.tar.gz \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='__pycache__' \
            --exclude='.venv' \
            --exclude='*.pyc' \
            .
      
      - name: Generate changelog
        id: changelog
        run: |
          # Extract changelog for this version
          sed -n "/## \[$VERSION\]/,/## \[/p" CHANGELOG.md | head -n -1 > release_notes.md
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          body_path: release_notes.md
          files: |
            dist/*.whl
            dist/*.tar.gz
            builder-layer-end-*.tar.gz
          draft: false
          prerelease: ${{ contains(github.ref, 'alpha') || contains(github.ref, 'beta') || contains(github.ref, 'rc') }}
```

---

## 🚀 Deploy Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  release:
    types: [published]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Add deployment commands
  
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    needs: deploy-staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add deployment commands
```

---

## 📋 Stale Issues

`.github/workflows/stale.yml`:

```yaml
name: Stale Issues

on:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          stale-issue-message: 'This issue has been automatically marked as stale due to inactivity.'
          stale-pr-message: 'This PR has been automatically marked as stale due to inactivity.'
          stale-issue-label: 'stale'
          stale-pr-label: 'stale'
          days-before-stale: 60
          days-before-close: 7
          exempt-issue-labels: 'pinned,security,enhancement'
          exempt-pr-labels: 'pinned,security'
```

---

## 🏷️ Auto Labeler

`.github/workflows/auto-label.yml`:

```yaml
name: Auto Label

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          configuration-path: .github/labeler.yml
```

`.github/labeler.yml`:
```yaml
python:
  - 'src/**/*.py'
  - 'tests/**/*.py'

typescript:
  - 'apps/**/*.ts'
  - 'apps/**/*.tsx'

documentation:
  - 'docs/**/*'
  - '*.md'

docker:
  - 'docker/**/*'
  - 'docker-compose.yml'
  - 'Dockerfile'

config:
  - 'config/**/*'
  - '*.yaml'
  - '*.yml'
```

---

## 🔐 Secrets Required

Configure these secrets in GitHub repository settings:

| Secret | Purpose |
|--------|---------|
| `CODECOV_TOKEN` | Code coverage reporting |
| `DOCKER_USERNAME` | Docker Hub login |
| `DOCKER_PASSWORD` | Docker Hub password |
| `DEPLOY_KEY` | SSH key for deployment |
| `SLACK_WEBHOOK` | Slack notifications |

---

## 📊 Badges

Add these to your README:

```markdown
![Tests](https://github.com/your-org/Builder-Layer-End/workflows/Tests/badge.svg)
![Lint](https://github.com/your-org/Builder-Layer-End/workflows/Lint/badge.svg)
![CodeQL](https://github.com/your-org/Builder-Layer-End/workflows/CodeQL/badge.svg)
[![codecov](https://codecov.io/gh/your-org/Builder-Layer-End/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/Builder-Layer-End)
```

---

## 📚 Related Pages

- [[Testing-Guide]] - Test documentation
- [[Contributing]] - Contribution workflow
- [[Deployment-Guide]] - Deployment details
