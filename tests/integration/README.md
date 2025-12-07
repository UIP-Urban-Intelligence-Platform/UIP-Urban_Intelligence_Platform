<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: README.md
Module: tests.integration
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Integration tests README.
============================================================================
-->

# Integration Tests

Integration tests requiring external services (Stellio, Neo4j, Fuseki, etc.).

## Prerequisites

Start required services with Docker Compose:

```bash
docker-compose up -d
```

## Running Integration Tests

```bash
# Run all integration tests
pytest tests/integration/ -v -m integration

# Run tests requiring Docker
pytest tests/integration/ -v -m requires_docker

# Skip integration tests (for quick checks)
pytest tests/unit/ -v
```

## Available Tests

- `test_stellio_integration.py` - Stellio Context Broker integration
- `test_workflow.py` - Multi-phase workflow orchestration
- Add more integration tests as needed

## Test Markers

Integration tests use pytest markers:

- `@pytest.mark.integration` - Marks test as integration test
- `@pytest.mark.requires_docker` - Requires Docker services running
- `@pytest.mark.slow` - Slow running tests

## Writing New Tests

```python
import pytest

@pytest.mark.integration
@pytest.mark.requires_docker
async def test_your_integration(http_client):
    # Your integration test code
    pass
```
