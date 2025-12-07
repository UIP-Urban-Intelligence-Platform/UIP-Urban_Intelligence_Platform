<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Code-Style.md
Module: Code Style Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Coding standards and style guidelines for the project.
============================================================================
-->

# 📝 Code Style

Comprehensive code style guide for UIP - Urban Intelligence Platform contributors.

---

## 📋 Overview

UIP - Urban Intelligence Platform follows industry-standard code style conventions:

- **Python**: PEP 8 + Black + Ruff (linting & import sorting)
- **TypeScript**: ESLint + Prettier + TypeScript strict mode
- **Documentation**: Google-style docstrings
- **Commits**: Conventional Commits

> **Note (2025-12):** Migrated from isort/flake8/pylint to Ruff for 10-100x faster linting.

---

## 🐍 Python Style

### Formatter: Black

All Python code is formatted with [Black](https://black.readthedocs.io/):

```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py310', 'py311', 'py312']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.venv
  | build
  | dist
)/
'''
```

### Import Sorting: Ruff

Imports are sorted with [Ruff](https://docs.astral.sh/ruff/) (replaces isort):

```toml
# ruff.toml
[lint]
select = ["I"]  # Enable isort rules

[lint.isort]
profile = "black"
known_first_party = ["src", "tests"]
sections = ["FUTURE", "STDLIB", "THIRDPARTY", "FIRSTPARTY", "LOCALFOLDER"]
skip = [".git", ".venv", "build", "dist"]
```

### Linting: Ruff

Fast linting with [Ruff](https://docs.astral.sh/ruff/):

```toml
# pyproject.toml
[tool.ruff]
target-version = "py310"
line-length = 88

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # Pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
    "N",   # pep8-naming
    "S",   # flake8-bandit
    "T20", # flake8-print
]
ignore = ["E501", "B008", "C901", "S101"]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101"]
```

### Type Hints

Use type hints for all public functions:

```python
# ✅ Good
def process_observation(
    camera_id: str,
    vehicle_count: int,
    timestamp: datetime | None = None
) -> TrafficObservation:
    """Process a traffic observation.
    
    Args:
        camera_id: Camera identifier.
        vehicle_count: Number of vehicles detected.
        timestamp: Observation timestamp. Defaults to now.
    
    Returns:
        Processed traffic observation.
    
    Raises:
        ValueError: If vehicle_count is negative.
    """
    if vehicle_count < 0:
        raise ValueError("vehicle_count must be non-negative")
    
    return TrafficObservation(
        camera_id=camera_id,
        vehicle_count=vehicle_count,
        timestamp=timestamp or datetime.utcnow()
    )

# ❌ Bad
def process_observation(camera_id, vehicle_count, timestamp=None):
    return TrafficObservation(camera_id, vehicle_count, timestamp)
```

### Docstrings: Google Style

Use Google-style docstrings:

```python
def calculate_congestion(
    vehicle_count: int,
    road_capacity: int,
    speed_factor: float = 1.0
) -> float:
    """Calculate congestion level for a road segment.
    
    Uses a modified volume-to-capacity ratio with speed adjustment
    to produce a normalized congestion score.
    
    Args:
        vehicle_count: Current number of vehicles on segment.
        road_capacity: Maximum vehicle capacity of segment.
        speed_factor: Speed adjustment factor (0.0-2.0).
            Values below 1.0 indicate slower than normal traffic.
    
    Returns:
        Congestion level between 0.0 (free flow) and 1.0 (gridlock).
    
    Raises:
        ValueError: If road_capacity is zero or negative.
        ValueError: If speed_factor is out of valid range.
    
    Examples:
        >>> calculate_congestion(50, 100)
        0.5
        >>> calculate_congestion(80, 100, speed_factor=0.5)
        0.9
    """
    if road_capacity <= 0:
        raise ValueError("road_capacity must be positive")
    
    if not 0.0 <= speed_factor <= 2.0:
        raise ValueError("speed_factor must be between 0.0 and 2.0")
    
    base_ratio = vehicle_count / road_capacity
    adjusted = base_ratio / speed_factor
    return min(1.0, adjusted)
```

### Class Structure

```python
class TrafficAgent:
    """Agent for processing traffic data.
    
    This agent monitors traffic cameras, detects congestion,
    and publishes alerts when thresholds are exceeded.
    
    Attributes:
        name: Agent name for identification.
        config: Agent configuration.
        is_running: Whether the agent is currently running.
    
    Example:
        >>> agent = TrafficAgent("traffic-1", config)
        >>> await agent.start()
        >>> await agent.process(observation)
        >>> await agent.stop()
    """
    
    def __init__(self, name: str, config: AgentConfig) -> None:
        """Initialize the traffic agent.
        
        Args:
            name: Unique agent name.
            config: Agent configuration object.
        """
        self.name = name
        self.config = config
        self._is_running = False
        self._tasks: list[asyncio.Task] = []
    
    @property
    def is_running(self) -> bool:
        """Return whether the agent is running."""
        return self._is_running
    
    async def start(self) -> None:
        """Start the agent and begin processing."""
        if self._is_running:
            raise RuntimeError("Agent is already running")
        
        self._is_running = True
        logger.info("Agent %s started", self.name)
    
    async def stop(self) -> None:
        """Stop the agent gracefully."""
        self._is_running = False
        
        for task in self._tasks:
            task.cancel()
        
        await asyncio.gather(*self._tasks, return_exceptions=True)
        logger.info("Agent %s stopped", self.name)
    
    async def process(self, observation: TrafficObservation) -> None:
        """Process a traffic observation.
        
        Args:
            observation: The observation to process.
        """
        # Implementation
        pass
```

---

## 📘 TypeScript Style

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error'
  }
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

### TypeScript Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### TypeScript Examples

```typescript
// ✅ Good
interface TrafficObservation {
  cameraId: string;
  vehicleCount: number;
  timestamp: Date;
  congestionLevel: number;
}

async function processObservation(
  observation: TrafficObservation
): Promise<ProcessedResult> {
  const { cameraId, vehicleCount, congestionLevel } = observation;
  
  if (congestionLevel > CONGESTION_THRESHOLD) {
    await sendAlert({
      type: 'congestion',
      cameraId,
      level: congestionLevel,
    });
  }
  
  return {
    processed: true,
    alertSent: congestionLevel > CONGESTION_THRESHOLD,
  };
}

// ❌ Bad
async function processObservation(observation: any) {
  if (observation.congestionLevel > 0.7) {
    sendAlert(observation);
  }
}
```

---

## 📁 File Headers

All source files must include SPDX license headers:

### Python Files

```python
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
"""Module description.

This module provides functionality for...
"""
```

### TypeScript Files

```typescript
// SPDX-License-Identifier: MIT
// Copyright (c) 2025 UIP Team. All rights reserved.

/**
 * @fileoverview Module description.
 * @module module-name
 */
```

### YAML/Configuration Files

```yaml
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# Configuration description
```

### Markdown Files

```markdown
<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
-->
```

---

## 📝 Git Commit Style

### Conventional Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (no logic change) |
| `refactor` | Refactoring |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `build` | Build system changes |
| `ci` | CI configuration |
| `chore` | Other changes |

### Examples

```bash
# Feature
feat(agents): add weather integration agent

# Bug fix
fix(cv-agent): handle null frame from camera

# Documentation
docs(wiki): add NGSI-LD guide

# Breaking change
feat(api)!: change response format for observations

BREAKING CHANGE: The observations endpoint now returns
a different JSON structure. See migration guide.
```

---

## 🧪 Testing Style

### Test File Naming

```
tests/
├── unit/
│   ├── test_cv_agent.py
│   ├── test_congestion_detection.py
│   └── test_alert_dispatcher.py
├── integration/
│   ├── test_stellio_integration.py
│   └── test_redis_streams.py
└── e2e/
    └── test_full_pipeline.py
```

### Test Structure

```python
# tests/unit/test_congestion_detection.py

import pytest
from src.agents.congestion_detection_agent import CongestionDetector

class TestCongestionDetector:
    """Tests for CongestionDetector."""
    
    @pytest.fixture
    def detector(self):
        """Create detector instance."""
        return CongestionDetector(threshold=0.7)
    
    def test_detect_low_congestion(self, detector):
        """Test detection of low congestion levels."""
        # Arrange
        observation = create_observation(vehicle_count=20, capacity=100)
        
        # Act
        result = detector.analyze(observation)
        
        # Assert
        assert result.congestion_level == 0.2
        assert result.is_congested is False
    
    def test_detect_high_congestion(self, detector):
        """Test detection of high congestion levels."""
        observation = create_observation(vehicle_count=80, capacity=100)
        
        result = detector.analyze(observation)
        
        assert result.congestion_level == 0.8
        assert result.is_congested is True
    
    @pytest.mark.parametrize("vehicle_count,expected_level", [
        (0, 0.0),
        (50, 0.5),
        (100, 1.0),
    ])
    def test_congestion_levels(self, detector, vehicle_count, expected_level):
        """Test various congestion levels."""
        observation = create_observation(vehicle_count=vehicle_count, capacity=100)
        
        result = detector.analyze(observation)
        
        assert result.congestion_level == pytest.approx(expected_level)
```

---

## 🛠️ IDE Configuration

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.rulers": [88]
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "python.analysis.typeCheckingMode": "basic",
  "python.testing.pytestEnabled": true
}
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.1.1
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.14
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v4.0.0-alpha.8
    hooks:
      - id: prettier
        types_or: [typescript, javascript, json, yaml, markdown]
```

---

## 📊 Code Quality Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Test Coverage | ≥80% | pytest-cov |
| Type Coverage | ≥90% | mypy |
| Code Duplication | <5% | Ruff/SonarQube |
| Complexity | <10 per function | Ruff |
| Documentation | 100% public APIs | interrogate |

---

## 🔗 Related Pages

- [[Contributing]] - How to contribute
- [[Testing-Guide]] - Testing documentation
- [[Release-Process]] - Release workflow
- [[Architecture]] - System design
- [[Python-Agents]] - Agent documentation

---

## 📚 References

- [PEP 8](https://pep8.org/)
- [Black](https://black.readthedocs.io/)
- [Ruff](https://docs.astral.sh/ruff/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
