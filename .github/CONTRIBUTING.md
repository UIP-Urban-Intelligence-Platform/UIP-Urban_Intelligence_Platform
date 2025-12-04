<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 Nguyen Nhat Quang

UIP - Urban Intelligence Platform
Contribution Guidelines

Module: .github/CONTRIBUTING.md
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Version: 1.0.0
-->

# Contributing to UIP - Urban Intelligence Platform

Thank you for your interest in contributing to UIP - Urban Intelligence Platform! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-github-username>/UIP-Urban_Intelligence_Platform.git
   cd UIP-Urban_Intelligence_Platform
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform.git
   ```

## Development Setup

### Prerequisites

- Python 3.9, 3.10, or 3.11
- Docker and Docker Compose
- Git

### Local Setup

1. **Create virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install development dependencies**:
   ```bash
   pip install -r requirements/dev.txt
   ```

3. **Install pre-commit hooks**:
   ```bash
   pre-commit install
   ```

4. **Copy environment template**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Start services with Docker**:
   ```bash
   docker-compose up -d
   ```

6. **Run tests to verify setup**:
   ```bash
   pytest tests/
   ```

## How to Contribute

### Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   # Run unit tests
   pytest tests/unit/
   
   # Run integration tests
   pytest tests/integration/
   
   # Check code quality
   black src/ tests/
   isort src/ tests/
   flake8 src/ tests/
   mypy src/
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request** on GitHub

## Coding Standards

### Python Style Guide

We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) with these tools:

- **Black**: Code formatting (line length: 100)
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking
- **pylint**: Additional code quality checks

### Code Quality Checklist

- [ ] Code is formatted with Black
- [ ] Imports are sorted with isort
- [ ] No linting errors from flake8
- [ ] Type hints added (and checked with mypy)
- [ ] Docstrings added for public functions/classes
- [ ] Comments explain "why", not "what"
- [ ] No hardcoded credentials or secrets
- [ ] Environment variables used for configuration

### Docstring Format

Use Google-style docstrings:

```python
def process_image(image_url: str, config: Dict[str, Any]) -> ProcessResult:
    """Process an image from a URL using YOLO detection.
    
    Args:
        image_url: The URL of the image to process
        config: Configuration dictionary with processing parameters
        
    Returns:
        ProcessResult object containing detection results
        
    Raises:
        ValueError: If image_url is invalid
        ImageProcessingError: If processing fails
        
    Example:
        >>> result = process_image("http://example.com/image.jpg", config)
        >>> print(result.detections)
    """
```

## Testing Guidelines

### Test Structure

- **Unit tests**: Test individual functions/classes in isolation
  - Location: `tests/unit/`
  - Fast execution (< 1s per test)
  - Mock external dependencies

- **Integration tests**: Test component interactions
  - Location: `tests/integration/`
  - May be slower (require Docker services)
  - Use markers: `@pytest.mark.integration`

### Writing Tests

```python
import pytest
from src.agents.image_refresh import ImageRefreshAgent

class TestImageRefreshAgent:
    """Test suite for ImageRefreshAgent."""
    
    @pytest.fixture
    def agent(self):
        """Create agent instance for testing."""
        return ImageRefreshAgent(config={})
    
    def test_refresh_urls_success(self, agent):
        """Test successful URL refresh."""
        urls = ["http://example.com/1.jpg"]
        result = agent.refresh_urls(urls)
        assert result.success is True
        assert len(result.refreshed) == 1
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_integration_with_stellio(self):
        """Test integration with Stellio Context Broker."""
        # Integration test code
        pass
```

### Test Coverage

- Maintain **minimum 80% code coverage**
- Run coverage report:
  ```bash
  pytest --cov=src --cov-report=html
  ```
- View report: `open htmlcov/index.html`

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding/updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
feat(image-refresh): add batch processing for URLs

Implement batch processing to handle multiple URLs more efficiently.
Uses asyncio for concurrent processing.

Closes #123

---

fix(stellio): handle connection timeout errors

Add retry logic with exponential backoff for Stellio API calls.

Fixes #456

---

docs: update installation instructions

Add Docker Compose setup instructions and troubleshooting section.
```

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run full test suite**:
   ```bash
   pytest tests/ -v
   ```

3. **Check code quality**:
   ```bash
   pre-commit run --all-files
   ```

4. **Update documentation**:
   - Update README.md if needed
   - Add entry to CHANGELOG.md
   - Update API docs if applicable

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No merge conflicts
- [ ] PR description is clear and complete
- [ ] Linked to related issue(s)
- [ ] Screenshots added (if UI changes)

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **All comments addressed**
4. **Approval** from code owner (see CODEOWNERS)
5. **Merge** by maintainer

### After Merge

- Your branch will be deleted automatically
- Update your local repository:
  ```bash
  git checkout main
  git pull upstream main
  ```

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) to report bugs.

### Good Bug Reports Include

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Error logs/screenshots
- Environment details (OS, Python version, Docker version)
- Minimal reproducible example

## Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml) to suggest features.

### Good Feature Requests Include

- Clear problem statement
- Proposed solution
- Alternatives considered
- Use cases
- Priority level
- Willingness to contribute

## Component-Specific Guidelines

### Image Refresh Agent
- Must handle URL validation
- Must support batch processing
- Must include retry logic

### Data Connectors (Stellio, Fuseki, Neo4j)
- Must handle connection failures gracefully
- Must support connection pooling
- Must include integration tests

### YOLO Detector
- Must validate image formats
- Must handle model loading errors
- Must include performance benchmarks

### Data Validator
- Must validate against NGSI-LD schema
- Must provide clear error messages
- Must support custom validation rules

## Getting Help

- **Documentation**: Check the [docs/](docs/) folder
- **Discussions**: Use [GitHub Discussions](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/discussions)
- **Issues**: Search [existing issues](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/issues)
- **Chat**: Join our Slack/Discord (if available)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- GitHub Contributors page
- Release notes

Thank you for contributing to UIP - Urban Intelligence Platform! 🚀
