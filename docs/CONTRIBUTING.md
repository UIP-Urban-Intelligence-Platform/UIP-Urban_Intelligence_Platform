# Contributing to Builder Layer End

We welcome contributions to the Builder Layer End project! This document provides guidelines for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for everyone. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Git
- Docker and Docker Compose (for integration testing)
- Basic understanding of NGSI-LD, RDF, and semantic web technologies

### Setting Up Development Environment

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/builder-layer-end.git
cd builder-layer-end

# Add upstream remote
git remote add upstream https://github.com/original-org/builder-layer-end.git

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install development dependencies
pip install -e .
pip install -r requirements/dev.txt

# Install pre-commit hooks
pre-commit install

# Copy environment template
cp .env.example .env
# Edit .env with your local configuration
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your fork
git checkout main
git pull upstream main
git push origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clear, concise code
- Follow the coding standards (see below)
- Add or update tests as needed
- Update documentation if required

### 3. Test Your Changes

```bash
# Run tests
pytest --cov=src --cov-report=term-missing

# Run quality checks
pre-commit run --all-files

# Check specific issues
black src/ tests/ --check
flake8 src/ tests/
mypy src/
```

### 4. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add new feature description"
```

Commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

Examples:
```bash
git commit -m "feat(agents): add congestion detection agent"
git commit -m "fix(validation): correct NGSI-LD schema validation"
git commit -m "docs(api): update API endpoint documentation"
git commit -m "refactor(core): simplify config loading logic"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill out the PR template with detailed information
```

## Coding Standards

### Python Style Guide

#### PEP 8 Compliance

Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) with these specifications:

- **Line Length**: Maximum 100 characters (enforced by Black)
- **Indentation**: 4 spaces (no tabs)
- **Quotes**: Use double quotes for strings
- **Imports**: One import per line, grouped and sorted by isort

#### Code Formatting

We use **Black** for consistent code formatting:

```bash
# Format code
black src/ tests/ --line-length=100

# Check formatting
black src/ tests/ --check --diff
```

#### Import Sorting

We use **isort** with Black profile:

```bash
# Sort imports
isort src/ tests/ --profile=black

# Check sorting
isort src/ tests/ --check-only --diff
```

Import order:
1. Standard library imports
2. Third-party imports
3. Local application imports

Example:
```python
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
import yaml
from rdflib import Graph, Namespace

from src.core.config_loader import load_config
from src.core.utils import validate_entity
```

#### Type Hints

Use type hints for all function signatures:

```python
def process_entity(
    entity_id: str,
    entity_type: str,
    properties: Dict[str, Any],
    validate: bool = True
) -> Dict[str, Any]:
    """Process NGSI-LD entity.

    Args:
        entity_id: Unique entity identifier
        entity_type: NGSI-LD entity type
        properties: Entity properties dictionary
        validate: Whether to validate entity schema

    Returns:
        Processed entity dictionary

    Raises:
        ValueError: If validation fails
    """
    ...
```

#### Docstrings

Use Google-style docstrings for all public functions and classes:

```python
class ImageRefreshAgent:
    """Agent for refreshing time-sensitive image URLs.

    This agent updates timestamp parameters in URLs and verifies
    accessibility of traffic camera images.

    Attributes:
        config_path: Path to configuration file
        batch_size: Number of URLs to process per batch
        retry_attempts: Maximum number of retry attempts

    Example:
        >>> agent = ImageRefreshAgent("config/agents.yaml")
        >>> result = agent.refresh_urls(["http://example.com/image.jpg"])
        >>> print(result["success"])
        1
    """

    def __init__(self, config_path: str, batch_size: int = 50) -> None:
        """Initialize the image refresh agent.

        Args:
            config_path: Path to YAML configuration file
            batch_size: Number of URLs to process per batch
        """
        ...

    def refresh_urls(self, urls: List[str]) -> Dict[str, int]:
        """Refresh time-sensitive URLs with updated timestamps.

        Args:
            urls: List of URLs to refresh

        Returns:
            Dictionary with 'success' and 'failed' counts

        Raises:
            ValueError: If URLs list is empty
            IOError: If configuration file cannot be read
        """
        ...
```

#### Error Handling

- Use specific exception types
- Provide meaningful error messages
- Log errors with appropriate levels
- Clean up resources in `finally` blocks

```python
import logging

logger = logging.getLogger(__name__)

def publish_entity(entity: Dict[str, Any]) -> bool:
    """Publish entity to context broker."""
    try:
        response = httpx.post(
            f"{STELLIO_URL}/entities",
            json=entity,
            timeout=30.0
        )
        response.raise_for_status()
        logger.info(f"Published entity: {entity['id']}")
        return True
    except httpx.HTTPError as e:
        logger.error(f"Failed to publish entity {entity['id']}: {e}")
        return False
    except Exception as e:
        logger.exception(f"Unexpected error publishing entity: {e}")
        return False
```

#### Naming Conventions

- **Variables/Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_CASE`
- **Private members**: `_leading_underscore`
- **Module names**: `lowercase_with_underscores.py`

```python
# Good
MAX_RETRY_ATTEMPTS = 3
camera_count = 42
entity_id = "urn:ngsi-ld:Camera:001"

class EntityPublisher:
    def __init__(self):
        self._client = httpx.AsyncClient()

    def publish_entity(self, entity: Dict[str, Any]) -> bool:
        ...

# Bad
maxRetryAttempts = 3
CameraCount = 42
entityId = "urn:ngsi-ld:Camera:001"

class entity_publisher:
    def PublishEntity(self, Entity):
        ...
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/                    # Unit tests (fast, isolated)
│   ├── test_agents/
│   ├── test_core/
│   └── test_utils/
├── integration/             # Integration tests (slower, require services)
│   ├── test_stellio.py
│   ├── test_neo4j.py
│   └── test_workflow.py
└── conftest.py             # Shared fixtures
```

### Writing Tests

#### Unit Tests

```python
import pytest
from src.agents.data_collection.image_refresh_agent import ImageRefreshAgent

@pytest.fixture
def agent():
    """Fixture providing configured agent instance."""
    return ImageRefreshAgent(config_path="config/test_config.yaml")

def test_refresh_urls_success(agent):
    """Test successful URL refresh."""
    urls = ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
    result = agent.refresh_urls(urls)
    
    assert result["success"] == 2
    assert result["failed"] == 0

def test_refresh_urls_empty_list(agent):
    """Test refresh with empty URL list raises ValueError."""
    with pytest.raises(ValueError, match="URLs list cannot be empty"):
        agent.refresh_urls([])

@pytest.mark.parametrize("url,expected", [
    ("http://example.com?t=123", True),
    ("invalid-url", False),
    ("", False),
])
def test_validate_url(agent, url, expected):
    """Test URL validation."""
    assert agent.validate_url(url) == expected
```

#### Integration Tests

```python
import pytest
import httpx

@pytest.mark.integration
def test_publish_to_stellio():
    """Test publishing entity to Stellio Context Broker."""
    entity = {
        "id": "urn:ngsi-ld:Camera:TEST001",
        "type": "TrafficCamera",
        "name": {"type": "Property", "value": "Test Camera"}
    }
    
    response = httpx.post(
        "http://localhost:8080/ngsi-ld/v1/entities",
        json=entity
    )
    
    assert response.status_code == 201
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_image_refresh_agent.py

# Run tests matching pattern
pytest -k "test_validation"

# Run with coverage
pytest --cov=src --cov-report=html

# Run only unit tests (fast)
pytest tests/unit/

# Run integration tests (requires services)
pytest tests/integration/ -m integration

# Run in parallel
pytest -n auto
```

### Test Coverage

- Aim for **80%+ code coverage**
- Write tests for:
  - Happy path scenarios
  - Error conditions
  - Edge cases
  - Boundary conditions
- Use `pytest-cov` for coverage reports

```bash
# Generate coverage report
pytest --cov=src --cov-report=html
# Open htmlcov/index.html in browser
```

## Documentation

### Code Documentation

- Write docstrings for all public functions, classes, and modules
- Use Google-style docstrings
- Include examples in docstrings when helpful
- Document complex algorithms with inline comments

### Project Documentation

Update relevant documentation files when making changes:

- `README.md` - Project overview, installation, quick start
- `docs/architecture/ARCHITECTURE.md` - System architecture
- `docs/api/API.md` - API endpoints and examples
- `CHANGELOG.md` - List of changes for each version

### Configuration Documentation

Document all configuration options in:
- `.env.example` - Environment variables with descriptions
- `config/*.yaml` - YAML configuration files with comments

## Pull Request Process

### Before Creating PR

1. ✅ All tests pass locally
2. ✅ Code formatted with Black
3. ✅ Imports sorted with isort
4. ✅ No linting errors (flake8)
5. ✅ Type hints validated (mypy)
6. ✅ Security check passed (bandit)
7. ✅ Documentation updated
8. ✅ CHANGELOG.md updated

### PR Template

Fill out the PR template with:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and quality checks
2. **Code Review**: Maintainers review code and provide feedback
3. **Revisions**: Address feedback and update PR
4. **Approval**: PR approved by maintainer(s)
5. **Merge**: PR merged to main branch

### After Merge

- Delete your feature branch
- Pull latest main branch
- Create new feature branch for next contribution

## Issue Reporting

### Before Creating Issue

1. Search existing issues to avoid duplicates
2. Check documentation and FAQ
3. Try latest version to see if issue is resolved

### Bug Reports

Include:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Minimal steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Python version, package versions
- **Logs**: Relevant error messages or logs
- **Screenshots**: If applicable

### Feature Requests

Include:
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution or feature
- **Alternatives**: Alternative solutions considered
- **Additional Context**: Any other relevant information

## Questions?

If you have questions about contributing:

- Check [documentation](docs/)
- Ask in [GitHub Discussions](https://github.com/your-org/builder-layer-end/discussions)
- Email: support@example.com

Thank you for contributing! 🎉
