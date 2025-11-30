/**
 * @module scripts/README
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Scripts Directory Index
 * 
 * This directory contains utility scripts for project setup, health monitoring, and maintenance.
 * Scripts are organized into subdirectories based on their primary function: setup procedures
 * and health check operations.
 * 
 * **Directory Structure:**
 * ```
 * scripts/
 * ├── setup/           - Initial setup and configuration scripts
 * └── health-checks/   - Health monitoring and verification scripts
 * ```
 * 
 * @section Setup Scripts (./setup/)
 * Initial configuration and setup utilities:
 * - setup.js - Main project setup and dependency configuration
 * - setup-graph-investigator.ps1 - Graph Investigator agent setup
 * 
 * @section Health Checks (./health-checks/)
 * System monitoring and verification scripts:
 * - check-health.ps1 - System health verification
 * - check-real-data.ps1 - Real-time data validation
 * - verify-implementation.js - Implementation verification
 * 
 * @usage
 * Run setup scripts during initial installation:
 * ```bash
 * npm run setup
 * ```
 * 
 * Run health checks for monitoring:
 * ```bash
 * npm run health:check
 * npm run health:data
 * npm run verify
 * ```
 * 
 * @dependencies
 * - Node.js v18+ - JavaScript runtime
 * - PowerShell 5.1+ - Windows PowerShell scripts
 * - npm packages as specified in package.json
 */

# Scripts Directory

## Overview
Utility scripts for project setup, health monitoring, and system verification.

## Structure

### `/setup` - Setup Scripts
Scripts for initial project configuration and environment setup.

**Available Scripts:**
- `setup.js` - Main project setup, database initialization, and dependency configuration
- `setup-graph-investigator.ps1` - Graph Investigator AI agent configuration

**Usage:**
```bash
# Run main setup
npm run setup

# Setup Graph Investigator
pwsh scripts/setup/setup-graph-investigator.ps1
```

### `/health-checks` - Health Monitoring Scripts
Scripts for monitoring system health and verifying implementation status.

**Available Scripts:**
- `check-health.ps1` - Verify system health, service availability, and API endpoints
- `check-real-data.ps1` - Validate real-time data flows and data quality
- `verify-implementation.js` - Comprehensive implementation verification

**Usage:**
```bash
# Check system health
npm run health:check

# Verify real-time data
npm run health:data

# Verify implementation
npm run verify
```

## NPM Scripts Reference

All scripts are available as npm commands defined in `package.json`:

| Command | Description | Script |
|---------|-------------|--------|
| `npm run setup` | Project setup | `scripts/setup/setup.js` |
| `npm run health:check` | System health check | `scripts/health-checks/check-health.ps1` |
| `npm run health:data` | Data validation | `scripts/health-checks/check-real-data.ps1` |
| `npm run verify` | Implementation verification | `scripts/health-checks/verify-implementation.js` |

## Requirements

- **Node.js:** v18.0.0 or higher
- **PowerShell:** 5.1 or higher (for .ps1 scripts)
- **npm:** 9.0.0 or higher

## Adding New Scripts

When adding new scripts:
1. Place them in the appropriate subdirectory (`setup/` or `health-checks/`)
2. Add corresponding npm script command in `package.json`
3. Update this README with script description and usage
4. Ensure scripts have proper error handling and logging
