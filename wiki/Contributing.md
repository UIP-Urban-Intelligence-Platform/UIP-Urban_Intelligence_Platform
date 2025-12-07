<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Contributing.md
Module: Contributing Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Guidelines for contributing to the UIP project.
============================================================================
-->
# 🤝 Contributing Guide

Thank you for your interest in contributing to UIP - Urban Intelligence Platform!

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Pull Request Process](#-pull-request-process)
- [Issue Guidelines](#-issue-guidelines)

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, experience level, nationality, personal appearance, race, religion, or sexual identity.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other unprofessional conduct

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- Git

### Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/<YOUR-USERNAME>/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# Add upstream remote
git remote add upstream https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
```

### Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements/dev.txt
pip install -e .

# Install pre-commit hooks
pre-commit install

# Start Docker services
docker-compose up -d
```

---

## 🔄 Development Workflow

### Branch Strategy

```
main
├── develop          # Development branch
├── feature/*        # Feature branches
├── bugfix/*         # Bug fix branches
├── hotfix/*         # Production hotfixes
└── release/*        # Release preparation
```

### Creating a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout develop
git merge upstream/develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Make focused, atomic commits**
2. **Write meaningful commit messages**
3. **Keep changes small and reviewable**
4. **Add tests for new functionality**
5. **Update documentation as needed**

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

**Examples:**
```
feat(agent): add weather enrichment agent

Implements OpenWeatherMap integration for camera data enrichment.

Closes #123

---

fix(stellio): resolve entity sync timeout

Increases connection timeout from 10s to 30s for large batches.

Fixes #456

---

docs(wiki): update API reference
```

---

## 📝 Coding Standards

### Python Style Guide

We follow [PEP 8](https://pep8.org/) with these tools:

```bash
# Format code
black src/ tests/

# Lint code with Ruff (replaces flake8 + isort)
ruff check src/ tests/

# Auto-fix linting issues
ruff check --fix src/ tests/

# Type checking
mypy src/
```

**Configuration (.pre-commit-config.yaml):**
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.11.0
    hooks:
      - id: black
        language_version: python3.9

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.0
    hooks:
      - id: ruff
        args: [--fix]
```

### TypeScript Style Guide

We follow the [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html):

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Python Code Example

```python
"""Module docstring describing the purpose."""

from typing import Optional, List, Dict, Any
import asyncio

from src.utils.logger import get_logger

logger = get_logger(__name__)


class ExampleAgent:
    """Agent docstring with description.
    
    Attributes:
        config: Configuration dictionary.
        client: HTTP client instance.
    """
    
    def __init__(self, config: Dict[str, Any]) -> None:
        """Initialize the agent.
        
        Args:
            config: Configuration dictionary.
        """
        self.config = config
        self.client = None
    
    async def process(self, data: List[Dict]) -> List[Dict]:
        """Process data items.
        
        Args:
            data: List of data items to process.
            
        Returns:
            List of processed items.
            
        Raises:
            ValueError: If data is empty.
        """
        if not data:
            raise ValueError("Data cannot be empty")
        
        results = []
        for item in data:
            result = await self._process_item(item)
            results.append(result)
        
        logger.info(f"Processed {len(results)} items")
        return results
    
    async def _process_item(self, item: Dict) -> Dict:
        """Process a single item (private method)."""
        # Implementation
        return item
```

### TypeScript Code Example

```typescript
/**
 * Service for managing camera data.
 */
export class CameraService {
  private readonly apiUrl: string;
  private readonly timeout: number;

  /**
   * Creates a new CameraService instance.
   * @param config - Service configuration
   */
  constructor(config: CameraConfig) {
    this.apiUrl = config.apiUrl;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Fetches all cameras from the API.
   * @param filters - Optional filters to apply
   * @returns Promise resolving to array of cameras
   */
  async getCameras(filters?: CameraFilters): Promise<Camera[]> {
    const response = await fetch(this.apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cameras: ${response.statusText}`);
    }

    return response.json();
  }
}
```

---

## 🔀 Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run tests**
   ```bash
   pytest
   npm test
   ```

3. **Run linters**
   ```bash
   pre-commit run --all-files
   ```

4. **Update documentation**
   - README if needed
   - API docs if endpoints changed
   - Wiki if features added

### Creating a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a PR on GitHub

3. Fill out the PR template:

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No new warnings

## Related Issues
Closes #123

## Screenshots (if applicable)
```

### Review Process

1. **Automated checks must pass**
   - CI/CD pipeline
   - Code coverage
   - Linting

2. **Code review**
   - At least 1 approval required
   - Address all feedback

3. **Merge**
   - Squash and merge preferred
   - Delete branch after merge

---

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Python version: [e.g., 3.9.7]
- Node version: [e.g., 18.17.0]
- Docker version: [e.g., 24.0.5]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
Clear description of what you want.

**Describe alternatives you've considered**
Alternative solutions you've considered.

**Additional context**
Any other context or screenshots.
```

### Good First Issues

Look for issues labeled:
- `good first issue` - Great for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements

---

## 🏗️ Project Structure

When adding new features, follow this structure:

```
src/
├── agents/               # Add new agents here
│   └── your_category/
│       └── your_agent.py
├── utils/                # Utility functions
└── web/                  # Web components

tests/
├── unit/                 # Unit tests for your agent
│   └── test_your_agent.py
└── integration/          # Integration tests
    └── test_your_integration.py

config/
└── your_config.yaml      # Agent configuration
```

---

## 📚 Resources

- [Python Documentation](https://docs.python.org/3/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NGSI-LD Specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_cim009v010601p.pdf)
- [SOSA/SSN Ontology](https://www.w3.org/TR/vocab-ssn/)
- [React Documentation](https://react.dev/)

---

## 💬 Getting Help

- **GitHub Discussions** - For questions and discussions
- **GitHub Issues** - For bugs and feature requests
- **Wiki** - For documentation

---

## 🙏 Thank You!

Your contributions make this project better. We appreciate your time and effort!

---

## 🔗 Related Pages

- [[Installation]] - Development setup
- [[Testing-Guide]] - Testing guidelines
- [[System-Architecture]] - Architecture overview
