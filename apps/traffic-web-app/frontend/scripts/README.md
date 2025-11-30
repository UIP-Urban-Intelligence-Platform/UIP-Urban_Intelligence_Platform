/**
 * @module scripts/README
 * @author AI Assistant
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 1.0.0
 * @license MIT
 * 
 * @description
 * Frontend Scripts Directory Index
 * 
 * This directory contains utility scripts for frontend development, deployment preparation,
 * and build automation. Scripts streamline common development tasks and ensure consistent
 * development environment setup across team members.
 * 
 * **Directory Contents:**
 * - Development server startup scripts
 * - Build optimization scripts
 * - Environment configuration utilities
 * - Deployment preparation scripts
 * 
 * @section Available Scripts
 * 
 * **start-dev.ps1**
 * PowerShell script for starting the Vite development server with optimized settings.
 * Features include:
 * - Environment variable validation
 * - Port availability checking
 * - Hot module replacement (HMR) enabled
 * - Automatic browser opening
 * 
 * @usage
 * Start development server:
 * ```bash
 * npm run dev:start
 * # or directly
 * pwsh scripts/start-dev.ps1
 * ```
 * 
 * Standard Vite dev server:
 * ```bash
 * npm run dev
 * ```
 * 
 * @dependencies
 * - Node.js v18+ - JavaScript runtime
 * - PowerShell 5.1+ - Windows PowerShell
 * - Vite 5.0+ - Build tool and dev server
 * - npm packages as specified in package.json
 */

# Frontend Scripts Directory

## Overview
Utility scripts for frontend development, build processes, and deployment preparation.

## Available Scripts

### `start-dev.ps1` - Development Server Startup

Enhanced PowerShell script for starting the Vite development server with additional features and validation.

**Features:**
- ✅ Environment variable validation (.env file check)
- ✅ Port availability verification
- ✅ Automatic browser opening
- ✅ Hot Module Replacement (HMR) enabled
- ✅ Network access for mobile testing
- ✅ Clear console output with colors

**Usage:**
```bash
# Via npm script (recommended)
npm run dev:start

# Direct execution
pwsh scripts/start-dev.ps1

# Standard Vite dev server
npm run dev
```

**Environment Variables Required:**
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## NPM Scripts Reference

| Command | Description | Script |
|---------|-------------|--------|
| `npm run dev` | Start Vite dev server | Built-in Vite command |
| `npm run dev:start` | Enhanced dev server startup | `scripts/start-dev.ps1` |
| `npm run build` | Production build | `tsc && vite build` |
| `npm run preview` | Preview production build | `vite preview` |
| `npm run lint` | Lint TypeScript/TSX files | ESLint |
| `npm run type-check` | TypeScript type checking | `tsc --noEmit` |

## Development Workflow

### Initial Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
# Update VITE_API_URL and VITE_WS_URL

# Start development server
npm run dev:start
```

### Daily Development
```bash
# Start dev server with hot reload
npm run dev

# Run type checking in watch mode
npm run type-check -- --watch

# Lint files
npm run lint
```

### Pre-Commit Checks
```bash
# Type check
npm run type-check

# Lint and fix issues
npm run lint -- --fix

# Build to verify no build errors
npm run build
```

## Script Development Guidelines

When creating new scripts:

1. **File Naming:** Use kebab-case (e.g., `start-dev.ps1`, `build-prod.sh`)
2. **Documentation:** Add comprehensive header comments
3. **Error Handling:** Include proper error handling and user feedback
4. **Cross-Platform:** Consider cross-platform compatibility when possible
5. **NPM Integration:** Register scripts in `package.json`

### PowerShell Script Template
```powershell
# Script Name: example-script.ps1
# Purpose: Brief description
# Usage: pwsh scripts/example-script.ps1

param(
    [string]$Environment = "development"
)

Write-Host "Starting script..." -ForegroundColor Green

try {
    # Script logic here
    
    Write-Host "✅ Success!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
```

### Bash Script Template
```bash
#!/bin/bash
# Script Name: example-script.sh
# Purpose: Brief description
# Usage: ./scripts/example-script.sh

set -e  # Exit on error

echo "Starting script..."

# Script logic here

echo "✅ Success!"
```

## Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** 9.0.0 or higher
- **PowerShell:** 5.1 or higher (for .ps1 scripts)
- **Bash:** 4.0 or higher (for .sh scripts)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <process_id> /F
```

### Environment Variables Not Loaded
```bash
# Verify .env file exists
ls .env

# Check file contents
cat .env

# Restart dev server
npm run dev:start
```

### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Adding New Scripts

To add a new script:

1. Create script file in `scripts/` directory
2. Add execution permissions (Linux/Mac): `chmod +x scripts/your-script.sh`
3. Add npm script in `package.json`:
   ```json
   "scripts": {
     "your-command": "pwsh scripts/your-script.ps1"
   }
   ```
4. Update this README with script documentation
5. Test script execution before committing
