<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Release-Process.md
Module: Release Process Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to the release process for UIP.
============================================================================
-->

# 🚀 Release Process

Complete guide to the release process for UIP - Urban Intelligence Platform.

---

## 📋 Overview

UIP - Urban Intelligence Platform follows [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fixes, security patches
  │     └──────── New features, backward compatible
  └────────────── Breaking changes
```

**Current Version**: `2.0.0`

---

## 🔄 Release Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RELEASE WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. PREPARATION          2. TESTING           3. RELEASE        4. POST    │
│                                                                             │
│  ┌─────────────┐        ┌─────────────┐      ┌─────────────┐   ┌─────────┐ │
│  │ Update      │───────▶│ CI/CD       │─────▶│ Tag &       │──▶│ Announce│ │
│  │ Version     │        │ Pipeline    │      │ Publish     │   │ & Doc   │ │
│  └─────────────┘        └─────────────┘      └─────────────┘   └─────────┘ │
│        │                       │                   │                 │      │
│        ▼                       ▼                   ▼                 ▼      │
│  ┌─────────────┐        ┌─────────────┐      ┌─────────────┐   ┌─────────┐ │
│  │ Changelog   │        │ All Tests   │      │ GitHub      │   │ Update  │ │
│  │ Update      │        │ Pass        │      │ Release     │   │ Wiki    │ │
│  └─────────────┘        └─────────────┘      └─────────────┘   └─────────┘ │
│        │                       │                   │                 │      │
│        ▼                       ▼                   ▼                 ▼      │
│  ┌─────────────┐        ┌─────────────┐      ┌─────────────┐   ┌─────────┐ │
│  │ Create      │        │ Security    │      │ Docker      │   │ Social  │ │
│  │ PR          │        │ Scan        │      │ Images      │   │ Media   │ │
│  └─────────────┘        └─────────────┘      └─────────────┘   └─────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Pre-Release Checklist

### Code Quality

- [ ] All tests passing (`pytest tests/`)
- [ ] Test coverage ≥80%
- [ ] No critical security vulnerabilities
- [ ] Code style checks pass (`ruff check`)
- [ ] Type checks pass (`mypy src/`)

### Documentation

- [ ] CHANGELOG.md updated
- [ ] README.md version updated
- [ ] Wiki pages up to date
- [ ] API documentation current
- [ ] Migration guide (if breaking changes)

### Files to Update

- [ ] `pyproject.toml` → version
- [ ] `package.json` → version (if applicable)
- [ ] `src/__init__.py` → `__version__`
- [ ] `CHANGELOG.md` → release notes
- [ ] Docker tags

---

## 🔢 Version Bumping

### Using Bump2Version

```bash
# Install
pip install bump2version

# Patch release (1.2.3 → 1.2.4)
bump2version patch

# Minor release (1.2.3 → 1.3.0)
bump2version minor

# Major release (1.2.3 → 2.0.0)
bump2version major
```

### Configuration

```ini
# .bumpversion.cfg
[bumpversion]
current_version = 2.0.0
commit = True
tag = True
tag_name = v{new_version}
message = release: bump version {current_version} → {new_version}

[bumpversion:file:pyproject.toml]
search = version = "{current_version}"
replace = version = "{new_version}"

[bumpversion:file:src/__init__.py]
search = __version__ = "{current_version}"
replace = __version__ = "{new_version}"

[bumpversion:file:package.json]
search = "version": "{current_version}"
replace = "version": "{new_version}"
```

---

## 📋 CHANGELOG Format

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features go here

### Changed
- Changes to existing features

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes

## [2.0.0] - 2025-11-29

### Added
- NGSI-LD context broker integration with Stellio
- Multi-agent architecture with 41 specialized agents
- TypeScript AI agents (TrafficMaestro, GraphInvestigator, EcoTwin)
- Full LOD Cloud integration
- Smart Data Models alignment
- Comprehensive monitoring with Prometheus/Grafana

### Changed
- Replaced psycopg2 (LGPL) with asyncpg (Apache-2.0) for MIT compliance
- Updated all dependencies to latest versions
- Improved error handling across all agents

### Removed
- Legacy REST API endpoints (use NGSI-LD API)
- Deprecated configuration formats

### Security
- All dependencies now 100% MIT compatible
- Added security scanning in CI/CD

## [1.0.0] - 2025-12-08

### Added
- Initial release
- Basic traffic monitoring
- Camera integration
```

---

## 🏷️ Git Tags

### Creating Tags

```bash
# Create annotated tag
git tag -a v2.0.0 -m "Release version 2.0.0"

# Push tag to remote
git push origin v2.0.0

# Push all tags
git push origin --tags
```

### Tag Naming Convention

```
v{MAJOR}.{MINOR}.{PATCH}[-{prerelease}][+{metadata}]

Examples:
- v2.0.0          # Stable release
- v2.1.0-alpha.1  # Alpha pre-release
- v2.1.0-beta.2   # Beta pre-release
- v2.1.0-rc.1     # Release candidate
```

---

## 📦 GitHub Release

### Creating a Release

1. Go to **Releases** → **Draft a new release**
2. Choose tag: `v2.0.0`
3. Release title: `v2.0.0 - [Release Name]`
4. Description: Copy from CHANGELOG.md
5. Attach artifacts if applicable
6. Click **Publish release**

### Release Template

```markdown
# UIP v2.0.0 - [Release Name]

## 🎉 Highlights

- Major feature 1
- Major feature 2
- Performance improvements

## 📋 Changes

### Added
- List of new features

### Changed
- List of changes

### Fixed
- List of fixes

## 📥 Installation

```bash
pip install uip-platform==2.0.0
```

## 🐳 Docker

```bash
docker pull ghcr.io/uip/platform:2.0.0
```

## 📚 Documentation

See the [full changelog](CHANGELOG.md) for details.

## 🙏 Contributors

Thanks to all contributors who made this release possible!
```

---

## 🐳 Docker Release

### Building Images

```bash
# Build with version tag
docker build -t uip-platform:2.0.0 .
docker build -t uip-platform:latest .

# Push to registry
docker push ghcr.io/uip/platform:2.0.0
docker push ghcr.io/uip/platform:latest
```

### Multi-Platform Build

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/uip/platform:2.0.0 \
  --push .
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -e ".[dev]"
      - run: pytest tests/ --cov=src --cov-report=xml
      - run: ruff check src/
      - run: mypy src/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install build
      - run: python -m build

  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ghcr.io/uip/platform:${{ github.ref_name }}
            ghcr.io/uip/platform:latest

  release:
    needs: [build, docker]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
          files: dist/*
```

---

## 🔙 Rollback Procedure

### If Issues Found

```bash
# 1. Identify the issue
git log --oneline v2.0.0..HEAD

# 2. Revert to previous version
git checkout v1.9.0
git checkout -b hotfix/rollback

# 3. Deploy previous version
docker pull ghcr.io/uip/platform:1.9.0
docker-compose up -d

# 4. Create hotfix
git cherry-pick <fix-commits>
git tag -a v2.0.1 -m "Hotfix release"
git push origin v2.0.1
```

---

## 📊 Release Schedule

| Release Type | Frequency | Example |
|--------------|-----------|---------|
| Major | As needed | Breaking changes |
| Minor | Monthly | New features |
| Patch | As needed | Bug fixes |
| Security | Immediate | CVE fixes |

---

## ✅ Post-Release Tasks

- [ ] Update wiki with new version
- [ ] Announce on communication channels
- [ ] Update demo/staging environments
- [ ] Monitor error rates
- [ ] Collect feedback
- [ ] Plan next release

---

## 🔗 Related Pages

- [[Contributing]] - How to contribute
- [[Code-Style]] - Code standards
- [[Testing-Guide]] - Test procedures
- [[CI-CD-Pipeline]] - Automation
- [[Changelog]] - Version history

---

## 📚 References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
