<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Changelog.md
Module: Version History Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-12-08
Version: 1.0.0
License: MIT

Description:
  Version history and release notes for UIP.
============================================================================
-->
# 📋 Changelog

Version history and release notes for UIP - Urban Intelligence Platform.

> **Full Changelog**: See [CHANGELOG.md](../CHANGELOG.md) for detailed version history.

---

## 📊 Release Overview

| Version | Date | Type | Highlights |
|---------|------|------|------------|
| **2.0.0** | 2025-12-02 | Major | Multi-agent system, LOD pipeline |
| **1.5.0** | 2025-11-25 | Minor | Stellio integration, monitoring |
| **1.0.0** | 2025-11-20 | Initial | Core platform launch |

---

## 🚀 Current Release: v2.0.0

**Release Date**: December 2, 2025

### ⚠️ Breaking Changes

- Import paths changed: `agents.*` → `src.agents.*`
- Configuration: 30 → 90+ environment variables
- Project structure: flat → `src/` package layout
- Requirements: split into `base/dev/test/prod` files

### ✨ New Features

#### Multi-Agent System
- **35 Python Agents** across 10 categories
- **3 TypeScript AI Agents**: TrafficMaestro, GraphInvestigator, EcoTwin
- Orchestrator with DAG workflow management
- APScheduler for scheduled tasks

#### Semantic Web & LOD
- NGSI-LD compliance with Stellio Context Broker
- SOSA/SSN ontology mapping
- Apache Jena Fuseki triple store integration
- LOD Cloud enrichment (GeoNames, DBpedia, Wikidata)

#### Frontend
- React 18 + TypeScript + Vite
- Real-time WebSocket updates
- Interactive traffic map visualization
- Citizen report submission system

#### DevOps
- One-command setup: `.\justrun.ps1 setup`
- Docker Compose with 12+ services
- GitHub Actions CI/CD pipeline
- Prometheus + Grafana monitoring

### 🔧 Improvements

- Hot-reload development mode
- Comprehensive error handling
- Rate limiting and caching
- API gateway with health checks

### 🐛 Bug Fixes

- YAML configuration parsing
- WebSocket reconnection stability
- MongoDB connection pooling
- Stellio entity publication

---

## 📜 Version History

### v1.5.0 - November 25, 2025

**Theme**: Integration & Monitoring

- Stellio Context Broker integration
- Prometheus metrics collection
- Grafana dashboard templates
- Redis caching layer
- Neo4j graph database support

### v1.0.0 - November 20, 2025

**Theme**: Initial Release

- Core multi-agent architecture
- Basic traffic monitoring
- FastAPI backend
- React frontend prototype
- Docker deployment

---

## 🔄 Versioning Policy

UIP follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

MAJOR - Breaking changes (API incompatibilities)
MINOR - New features (backwards compatible)
PATCH - Bug fixes (backwards compatible)
```

### Pre-release Labels

| Label | Description |
|-------|-------------|
| `alpha` | Early development, unstable |
| `beta` | Feature complete, testing |
| `rc` | Release candidate, final testing |

### Examples

```
2.0.0-alpha.1  → Early v2.0 development
2.0.0-beta.1   → v2.0 feature freeze
2.0.0-rc.1     → v2.0 release candidate
2.0.0          → v2.0 stable release
```

---

## 📦 Release Artifacts

Each release includes:

| Artifact | Description |
|----------|-------------|
| **Source Code** | GitHub release with tagged commit |
| **Docker Images** | Published to GitHub Container Registry |
| **PyPI Package** | `pip install uip-platform` |
| **Documentation** | Versioned docs on GitHub Pages |

### Docker Images

```bash
# Pull latest stable
docker pull ghcr.io/uip-urban-intelligence-platform/uip:latest

# Pull specific version
docker pull ghcr.io/uip-urban-intelligence-platform/uip:2.0.0
```

---

## 🔗 Related Links

- **Full Changelog**: [CHANGELOG.md](../CHANGELOG.md)
- **Release Process**: [Release-Process](Release-Process)
- **Contributing**: [Contributing](Contributing)
- **Migration Guide**: Check release notes for upgrade instructions

---

## 📝 Release Notes Format

All releases follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Features to be removed

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security patches
```

---

**See Also**:
- [Release-Process](Release-Process) - How releases are managed
- [Contributing](Contributing) - How to contribute to releases
