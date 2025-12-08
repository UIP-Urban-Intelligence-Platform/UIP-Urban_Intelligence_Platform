<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: CHANGELOG.md
Module: Project Changelog
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-15
Version: 1.0.0
License: MIT

Description:
  Complete changelog documenting all notable changes to the project.
  Follows Keep a Changelog format and Semantic Versioning.
============================================================================
-->

# Changelog

All notable changes to the **UIP - Urban Intelligence Platform** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note**: This changelog is automatically generated from git history and pull requests.
> For detailed commit history, see [GitHub Commits](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commits/main).

---

## [Unreleased]

> **Branch**: `main` | **Target**: Next release
> 
> These changes are in development and will be included in the next release.

### Added
- None in current development

### Changed
- None in current development

### Fixed
- None in current development

### Security
- No security vulnerabilities identified in current development

### Deprecated
- None in this release

### Removed
- None in this release

---

## [2.1.0] - 2025-12-08

> **Full Changelog**: [`v2.0.0...v2.1.0`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v2.0.0...v2.1.0)

### ⚠️ BREAKING CHANGES

- **GitHub Organization**: Migrated from `NguyenNhatquang522004` to `UIP-Urban-Intelligence-Platform` organization
- **Map Library**: Replaced `react-leaflet` (BSD-2-Clause with Leaflet's BSD-2-Clause) with `react-map-gl` + `MapLibre GL JS` (MIT) for 100% MIT licensing
- **Database Driver**: Replaced `psycopg2` (LGPL-3.0) with `asyncpg` (Apache-2.0) for MIT compatibility
- **Linting Tool**: Migrated from `flake8` to `Ruff` for faster linting

### Added

#### DevOps & Deployment (PR [#80](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/80)-[#83](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/83))
- GitHub Pages deployment for Docusaurus documentation ([`aa979ae`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/aa979ae)) - @NguyenDinhAnhTuan04
- PM2 process management for orchestrator and cv-analysis agents ([`c84d6bf`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/c84d6bf)) - @NguyenDinhAnhTuan04
- Orchestrator cron job running every hour via PM2 ([`1d189aa`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/1d189aa)) - @NguyenDinhAnhTuan04
- Nginx reverse proxy configuration for port 80 ([`88315af`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/88315af)) - @NguyenDinhAnhTuan04
- Stop all services step before deploy to avoid conflicts ([`71b7cac`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/71b7cac)) - @NguyenDinhAnhTuan04
- Separate Docusaurus docs deployment workflow ([`06d0a3a`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/06d0a3a)) - @NguyenDinhAnhTuan04
- `timm` package for DETR accident detection ([`6bc8913`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/6bc8913)) - @NguyenDinhAnhTuan04

#### Documentation (PR [#74](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/74)-[#79](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/79))
- Complete 100% agent documentation coverage for all 39 agents ([`c9f2da4`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/c9f2da4)) - @NguyenNhatquang522004
- Complete 100% frontend documentation coverage ([`021bfd5`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/021bfd5)) - @NguyenNhatquang522004
- Complete backend API documentation - 40 files ([`f9bfb40`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/f9bfb40)) - @NguyenNhatquang522004
- Comprehensive THIRD_PARTY_LICENSES.md with 1,464 packages audit ([`c42229f`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/c42229f)) - @NguyenNhatquang522004
- Wiki files and documentation updates ([`74e8d65`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/74e8d65)) - @NguyenNhatquang522004
- Architecture diagrams in README ([`b930ce2`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/b930ce2)) - @JamesNguyen106

#### License Compliance (PR [#72](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/72))
- SPDX license headers to all source files - 100% open source compliance ([`8feefb5`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/8feefb5)) - @NguyenNhatquang522004
- SPDX-License-Identifier MIT headers to all TypeScript files ([`32d068b`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/32d068b)) - @NguyenNhatquang522004
- NOTICE file for third-party licenses ([`d6fc8fb`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/d6fc8fb)) - @NguyenNhatquang522004

#### Community
- Discord and Google Groups community links ([`1357f65`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/1357f65)) - @NguyenNhatquang522004
- Code of Conduct revision for clarity and inclusivity ([`e7228ac`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/e7228ac)) - @NguyenDinhAnhTuan04

### Changed

#### Organization Migration
- Migrated GitHub organization URL from `NguyenNhatquang522004` to `UIP-Urban-Intelligence-Platform` across all files ([`27710ce`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/27710ce)-[`d5bdc1c`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/d5bdc1c)) - @NguyenNhatquang522004
- Standardized project name to `UIP-Urban_Intelligence_Platform` ([`ea747f9`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/ea747f9)) - @NguyenNhatquang522004

#### Frontend
- Migrated from `react-leaflet` to `react-map-gl` + `MapLibre GL JS` for 100% MIT licensing ([`6b50d77`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/6b50d77)) - @NguyenNhatquang522004

#### Code Quality
- Migrated from `flake8` to `Ruff` for faster linting ([`3b1829b`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/3b1829b)) - @NguyenNhatquang522004
- Applied Black formatter to Python source files ([`0f4fd27`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/0f4fd27)) - @NguyenNhatquang522004
- Standardized all Python file headers (100% compliance) ([`2a7f5b2`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/2a7f5b2)) - @NguyenNhatquang522004

#### Database
- Replaced `psycopg2` (LGPL-3.0) with `asyncpg` (Apache-2.0) for 100% MIT compatibility ([`ed60620`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/ed60620)) - @NguyenNhatquang522004

#### Dates & Timestamps
- Updated all dates from 2024 to November-December 2025 across config, docs, tests, and data files ([`81fceee`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/81fceee)-[`ead98ce`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/ead98ce)) - @NguyenNhatquang522004
- Updated copyright year from 2024-2025 to 2025 ([`30c33e8`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/30c33e8)) - @NguyenNhatquang522004

### Fixed

#### Security (PR [#61](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/61)-[#71](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/71))
- Resolved 200+ CodeQL security and quality alerts ([`3c35261`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/3c35261)) - @NguyenNhatquang522004
- Resolved all 42 CodeQL security and code quality alerts ([`b2ed22f`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/b2ed22f)) - @NguyenNhatquang522004
- Strengthened URL redirect validation and added log sanitization ([`2d32260`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/2d32260)) - @NguyenNhatquang522004
- Removed all exposed API key patterns ([`827583e`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/827583e)) - @NguyenNhatquang522004
- Resolved Code Quality, CodeQL alerts, and Secret Scanning issues ([`b2d8656`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/b2d8656)) - @NguyenNhatquang522004
- Removed duplicate import re (CodeQL alert #286) ([`de1f7a9`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/de1f7a9)) - @NguyenNhatquang522004

#### CI/CD
- Resolved all GitHub Actions CI/CD failures ([`ade056f`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/ade056f)) - @NguyenNhatquang522004
- Added Python 3.9 asyncio.Event() compatibility in test fixtures ([`53a48d6`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/53a48d6)) - @NguyenNhatquang522004
- Synced pyproject.toml line-length with CI (88 chars) ([`b4d9525`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/b4d9525)) - @NguyenNhatquang522004
- Added interrogate to dev.txt for docstring coverage check ([`aa7f921`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/aa7f921)) - @NguyenNhatquang522004
- Split deployment into multiple steps to avoid SSH timeout ([`1c44b0a`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/1c44b0a)) - @NguyenDinhAnhTuan04

#### Deployment
- Health check - avoid EPIPE error and show correct URLs ([`d3c8e99`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/d3c8e99)) - @NguyenDinhAnhTuan04
- Check if process exists before killing, add continue-on-error ([`acf8378`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/acf8378)) - @NguyenDinhAnhTuan04
- Escape curly braces in MDX table to fix Docusaurus build error ([`9944842`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/9944842)) - @NguyenDinhAnhTuan04
- Updated Docusaurus config for correct organization URL ([`4b2d329`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/4b2d329)) - @NguyenDinhAnhTuan04

#### License
- Cleaned LICENSE file for GitHub detection ([`d6fc8fb`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/d6fc8fb)) - @NguyenNhatquang522004
- Updated COPYING file to standard MIT License format ([`aabc463`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/aabc463)) - @NguyenNhatquang522004

#### Dependencies
- Added `async-lru` dependency (MIT License) for external_data_collector_agent ([`07b2a7b`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/07b2a7b)) - @NguyenNhatquang522004
- Regenerated package-lock.json to sync with @turf/turf dependencies ([`542b0d5`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/542b0d5)) - @NguyenNhatquang522004
- Updated ruff config to ignore best-practice warnings for CI compatibility ([`64ea34d`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/64ea34d)) - @NguyenNhatquang522004

### Security
- Resolved all CodeQL security alerts (200+ issues fixed)
- Removed all exposed API key patterns
- Added URL redirect validation and log sanitization
- 100% SPDX license compliance across all source files

### Deprecated
- `react-leaflet` (use `react-map-gl` + `MapLibre GL JS` instead)
- `flake8` (use `Ruff` instead)
- `psycopg2` (use `asyncpg` instead)
- Old GitHub organization URL `NguyenNhatquang522004` (use `UIP-Urban-Intelligence-Platform`)

### Removed
- Deprecated license audit files ([`5b117f6`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/5b117f6))
- Misplaced Code Citations file ([`f841c34`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/commit/f841c34))

### Migration Guide

> **Upgrading from v2.0.0 to v2.1.0**

1. **Update GitHub URLs**
   ```bash
   # Old URL
   https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
   
   # New URL
   https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
   ```

2. **Update Map Library** (if using frontend)
   ```bash
   # Remove old dependencies
   npm uninstall react-leaflet leaflet
   
   # Install new dependencies
   npm install react-map-gl maplibre-gl
   ```

3. **Update Database Driver** (if using PostgreSQL)
   ```bash
   # Old (LGPL-3.0)
   pip uninstall psycopg2-binary
   
   # New (Apache-2.0)
   pip install asyncpg
   ```

4. **Update Linting Tool**
   ```bash
   # Old
   pip uninstall flake8
   
   # New
   pip install ruff
   ```

---

## [2.0.0] - 2025-12-02

> **Full Changelog**: [`v1.5.0...v2.0.0`](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.5.0...v2.0.0)

### ⚠️ BREAKING CHANGES

- **Import Paths**: All import paths changed from `agents.*` to `src.agents.*`
- **Configuration**: Environment variables expanded from 30 to 90+ options - review `.env.example`
- **Project Structure**: Migrated from flat structure to `src/` package layout
- **Requirements**: Split `requirements.txt` into environment-specific files (`base/dev/test/prod`)

### Added

#### DevOps & Automation (PR [#59](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/59), [#58](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/58))
- PowerShell automation script (`justrun.ps1`) for Windows development
  - One-command setup: `.\justrun.ps1 setup`
  - Development mode: `.\justrun.ps1 dev`
  - Production mode: `.\justrun.ps1 prod`
  - Service management: `stop`, `clean`, `test` commands
- Makefile for Linux/Mac automation support with compatible targets
- Optimized multi-stage Dockerfile for production deployment
- Comprehensive DevOps documentation with quick start guides

#### Frontend Application (PR [#53](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/53)-[#57](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/57))
- Complete Dashboard and Landing pages implementation
- Interactive MapLibre GL map with multiple overlay layers:
  - Camera markers and heatmap visualization
  - Weather, environmental and traffic pattern overlays
  - Accident markers with detail modals
- Analytics dashboard with real-time metrics and charts (Recharts)
- AI Agent UI panels and chat interfaces:
  - Health Advisor (EcoTwinAgent)
  - Investigator (GraphInvestigatorAgent)
  - Predictive Timeline (TrafficMaestroAgent)
- Route planner with fastest/safest/healthiest options
- Citizen report submission and map display
- Correlation analysis and time machine for historical data
- Error boundary, connection status and notification system
- WebSocket integration for real-time updates
- Zustand state management
- TypeScript type definitions

#### Backend Services (PR [#51](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/51), [#52](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/52))
- Express server with core database services
- REST API routes for:
  - Camera, weather, air quality, accidents
  - Analytics, correlation, routing and patterns
- AI Agents with Google Gemini and OpenAI integration:
  - Traffic Maestro (predictive event orchestrator)
  - Graph Investigator (multimodal incident analysis)
  - Eco Twin (environmental health advisor)
- Agent YAML configurations and entity schemas
- Logging, validation, error handling utilities
- TypeScript configurations and type definitions
- Unit and integration tests for camera routes

#### Python Agents (PR [#51](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/51))
- Kafka entity publisher for real-time data streaming
- Citizen report ingestion agent with FastAPI
- LOD linkset enrichment for DBpedia/Wikidata/GeoNames
- MongoDB helper for NGSI-LD entity storage and indexing
- Temporal data manager for time-series entity tracking
- API gateway, cache manager, and Neo4j sync agents

#### Infrastructure (PR [#58](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/58))
- Docker Compose configuration for full stack
- Environment template with comprehensive variables
- Python package configuration for distribution
- Main orchestrator and entry point for Python backend
- Git ignore rules and IDE configurations

### Changed
- Migrated from flat structure to `src/` package layout
- Split requirements into environment-specific files (base/dev/test/prod)
- Enhanced `.env.example` from 30 to 90+ configuration options
- Updated all import paths from `agents.*` to `src.agents.*`

### Fixed
- Backend `.env.example` path resolution in setup script (PR [#59](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/59))
- Sensitive credentials moved from YAML to environment variables (PR [#50](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/50))
- Inconsistent pattern recognition results in analytics (PR [#50](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/50))

### Security
- Credentials moved from hardcoded YAML to environment variables (PR [#50](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/50))
- Added `.env.example` template without sensitive data
- Updated `.gitignore` to exclude credential files

### Deprecated
- Flat project structure (use `src/` layout instead)
- Single `requirements.txt` (use environment-specific files)
- Direct `agents.*` imports (use `src.agents.*`)

### Removed
- Legacy configuration files without environment variable support
- Hardcoded credentials from YAML configuration files
- Unused legacy import patterns

### Migration Guide

> **Upgrading from v1.x to v2.0.0**

1. **Update Import Paths**
   ```python
   # Before (v1.x)
   from agents.cv_agent import CVAgent
   
   # After (v2.0.0)
   from src.agents.cv_agent import CVAgent
   ```

2. **Update Environment Variables**
   - Copy new `.env.example` to `.env`
   - Review and configure 90+ new environment options
   - Move any hardcoded credentials to `.env`

3. **Update Requirements**
   ```bash
   # Development
   pip install -r requirements/dev.txt
   
   # Production  
   pip install -r requirements/prod.txt
   ```

4. **Project Structure**
   - All source code now under `src/` directory
   - Tests organized under `tests/{unit,integration}/`
   - Scripts organized under `scripts/{setup,health-checks}/`

---

## [1.5.0] - 2025-11-26

### Added

#### Monitoring & Operations (PR [#48](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/48), [#49](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/49))
- Grafana monitoring dashboard configuration
- Health check and monitoring setup scripts
- Performance monitoring and profiling agent

#### Cache & Graph Systems (PR [#40](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/40))
- Intelligent caching with Redis integration
- Cache invalidation and TTL management
- Cypher query execution agent for Neo4j

#### CLI Tools (PR [#38](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/38))
- Progress monitoring CLI utility
- CLI commands for camera data publishing

#### Deployment (PR [#42](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/42), [#45](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/45), [#46](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/46), [#47](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/47))
- Optimized Docker multi-stage build configurations
- Service startup scripts and environment templates

### Changed
- Reorganized backend scripts into `scripts/{setup,health-checks}` structure (PR [#50](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/50))
- Reorganized backend tests into `tests/{integration,unit,data,results}` structure
- Reorganized documentation into `docs/{api,guides,reports}` structure
- Updated package.json scripts with new file paths

### Fixed
- Script path references after directory reorganization

### Security
- No security changes in this release

### Deprecated
- None in this release

### Removed
- None in this release

---

## [1.4.0] - 2025-11-25

### Added

#### Notification System (PR [#33](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/33), [#37](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/37))
- Multi-channel alert dispatcher with priority routing
- NGSI-LD subscription management agent
- Automated incident report generator
- Email notification handler with templates
- Webhook notification delivery system
- Notification system tests

#### Graph Database (PR [#36](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/36))
- Neo4j graph database synchronization agent
- RDF transformation pipeline integration tests
- RDF turtle files and linked data examples

#### State Management (PR [#31](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/31), [#35](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/35))
- Centralized state management agent
- Temporal state tracking with history management
- Accident state lifecycle management
- Congestion state tracking and zone management

### Changed
- Enhanced state synchronization between agents

### Fixed
- State consistency issues in concurrent updates

### Security
- No security changes in this release

### Deprecated
- None in this release

### Removed
- None in this release

---

## [1.3.0] - 2025-11-24

### Added

#### RDF & Linked Data (PR [#29](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/29), [#32](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/32))
- Apache Jena Fuseki triple store loader agent
- FIWARE Smart Data Models validation
- RDF content negotiation for multiple formats (JSON-LD, Turtle, N-Triples, RDF/XML)
- NGSI-LD to RDF transformation agent
- NGSI-LD entity test fixtures and examples

#### Testing (PR [#27](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/27), [#28](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/28), [#30](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/30))
- Integration tests for Neo4j and Kafka
- Integration tests for Stellio and Fuseki
- Unit tests for transformation agents
- Integration test for complete transformation flow
- Unit tests for orchestrator and data utilities
- Integration testing framework with Docker services

### Changed
- Data validation rules and schemas configuration
- Improved RDF serialization performance

### Fixed
- RDF content negotiation header parsing
- NGSI-LD entity type validation

### Security
- No security changes in this release

### Deprecated
- None in this release

### Removed
- None in this release

---

## [1.2.0] - 2025-11-23

### Added

#### Context Management (PR [#25](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/25), [#26](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/26))
- Stellio context broker query agent
- State synchronization and update agent
- Stellio context broker deployment configuration
- SOSA/SSN ontology mapping for observations
- NGSI-LD data transformation agent

#### Testing (PR [#23](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/23))
- Unit tests for core utilities
- Pytest framework with shared fixtures

### Changed
- Improved context broker query performance
- Enhanced SOSA/SSN mapping accuracy

### Fixed
- Stellio connection timeout issues
- NGSI-LD temporal property formatting

### Security
- No security changes in this release

### Deprecated
- None in this release

### Removed
- None in this release

---

## [1.1.0] - 2025-11-22

### Added

#### Context Publishing (PR [#19](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/19))
- NGSI-LD entity publisher for Stellio (closes [#14](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues/14))
- Comprehensive unit tests for analytics agents
- Traffic pattern recognition and prediction

#### Monitoring (PR [#18](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/18))
- Data quality validation and profiling agent
- Comprehensive tests for image refresh agent
- Camera metadata and location fixtures

#### Analytics (PR [#17](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/17))
- Traffic congestion detection and monitoring
- Accident detection and classification agent
- YOLOX computer vision analysis agent

### Changed
- Improved camera image processing pipeline
- Enhanced NGSI-LD entity publishing reliability

### Fixed
- Camera metadata extraction errors
- Pattern recognition false positive rate

### Security
- No security changes in this release

### Deprecated
- None in this release

### Removed
- None in this release

---

## [1.0.0] - 2025-11-21

### Added

#### Core System (PR [#13](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/13), [#15](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pull/15))
- Multi-agent workflow orchestration engine
- Agent workflow and data source configurations
- External data source integration agent
- Camera image refresh and caching agent
- Data utilities and seeding functionality
- Centralized logging and configuration management

#### CI/CD & Documentation
- GitHub Actions workflows for testing and linting
- Security scanning and automation workflows
- PR template and contribution guidelines
- Issue templates for bug reports and features
- Security policy and support documentation

#### Configuration
- `workflow.yaml` - Multi-phase orchestration configuration
- `agents.yaml` - Agent-specific configurations
- `data_sources.yaml` - External API endpoints
- `ngsi_ld_mappings.yaml` - Entity type mappings
- `sosa_mappings.yaml` - SOSA/SSN property mappings
- `validation.yaml` - Schema validation rules
- `subscriptions.yaml` - NGSI-LD subscription templates

#### Infrastructure Support
- Stellio Context Broker for NGSI-LD temporal storage
- Neo4j for graph database relationships
- Apache Jena Fuseki for SPARQL queries
- Apache Kafka for message queuing
- Redis for caching
- Prometheus for metrics

### Changed
- Initial release - no previous version

### Fixed
- Initial release - no previous version

### Security
- Security policy established (SECURITY.md)
- Dependabot enabled for automated security updates
- CodeQL scanning enabled for code security analysis

### Deprecated
- None in this release

### Removed
- None in this release

---

## [0.1.0] - 2025-11-20

### Added
- Initial project structure with Python packaging configuration
- LICENSE file (MIT)
- Initial commit with basic repository setup

### Changed
- Initial release - no previous version

### Fixed
- Initial release - no previous version

### Security
- MIT License established for open source distribution

### Deprecated
- None in this release

### Removed
- None in this release

---

## Known Issues

> Issues that are known but not yet resolved

- **Frontend WebSocket**: Occasional connection drops on slow networks - auto-reconnect implemented
- **Stellio Integration**: Large batch entity publishing may timeout - use chunked publishing
- **Neo4j Sync**: First sync after restart may be slow due to cold cache

---

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for responsible disclosure.
Do **not** open a public issue for security vulnerabilities.

---

## Contributors

Thanks to all contributors who have helped build this project:

- **[@NguyenNhatquang522004](https://github.com/NguyenNhatquang522004)** - Project Lead & Core Development
- **[@NguyenDinhAnhTuan04](https://github.com/NguyenDinhAnhTuan04)** - Backend & Integration
- **[@JamesNguyen106](https://github.com/JamesNguyen106)** - RDF/Linked Data & Infrastructure

---

## Dependency Updates

The following dependency updates are pending review:

| PR | Update | Status |
|---|--------|--------|
| [dependabot](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pulls?q=is%3Apr+author%3Aapp%2Fdependabot) | `python` 3.11-slim → 3.14-slim | Pending |
| [dependabot](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pulls?q=is%3Apr+author%3Aapp%2Fdependabot) | `docker/build-push-action` 4 → 6 | Pending |
| [dependabot](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pulls?q=is%3Apr+author%3Aapp%2Fdependabot) | `actions/upload-artifact` 4 → 5 | Pending |
| [dependabot](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pulls?q=is%3Apr+author%3Aapp%2Fdependabot) | `actions/setup-python` 5 → 6 | Pending |
| [dependabot](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pulls?q=is%3Apr+author%3Aapp%2Fdependabot) | `actions/dependency-review-action` 3 → 4 | Pending |
| [dependabot](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/pulls?q=is%3Apr+author%3Aapp%2Fdependabot) | `codecov/codecov-action` 4 → 5 | Pending |

---

## Acknowledgments

This project benefits from the following open source technologies:

- **[FIWARE](https://www.fiware.org/)** - Smart Data Models and NGSI-LD specifications
- **[Stellio](https://stellio.io/)** - NGSI-LD Context Broker
- **[Apache Jena](https://jena.apache.org/)** - RDF/SPARQL framework
- **[Neo4j](https://neo4j.com/)** - Graph database platform
- **[YOLOX](https://github.com/Megvii-BaseDetection/YOLOX)** - Computer vision models
- **[React](https://react.dev/)** - Frontend UI framework
- **[MapLibre GL JS](https://maplibre.org/)** - Interactive maps library

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
SPDX-License-Identifier: MIT
```

---

## Version Comparison Links

[Unreleased]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.5.0...v2.0.0
[1.5.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/releases/tag/v0.1.0
