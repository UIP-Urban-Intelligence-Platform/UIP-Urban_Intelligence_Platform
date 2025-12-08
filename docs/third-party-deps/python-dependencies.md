---
id: python-dependencies
title: Python Dependencies Licenses
sidebar_label: Python Dependencies
sidebar_position: 2
description: Complete list of Python dependencies and their MIT-compatible licenses used in the UIP platform.
keywords: [python, dependencies, licenses, pip, torch, fastapi, opencv]
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: python-dependencies.md
Module: docs.licenses
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete list of Python dependencies and their MIT-compatible licenses.
============================================================================
-->

# Python Dependencies Licenses

Complete documentation of all **168 Python packages** used in the UIP - Urban Intelligence Platform.

## Summary

| Category | Packages | Primary License |
|----------|----------|-----------------|
| Machine Learning & CV | 15 | BSD/Apache-2.0 |
| Web Framework & API | 12 | MIT/BSD |
| Database & Storage | 8 | Apache-2.0/MIT |
| RDF & Linked Data | 5 | BSD |
| Data Processing | 10 | BSD |
| Messaging & Events | 3 | Apache-2.0 |
| Utilities | 25+ | MIT/BSD |
| Development Tools | 15+ | MIT |

---

## Core Machine Learning & Computer Vision

### Deep Learning Frameworks

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| torch | 2.9.1 | BSD-3-Clause | `BSD-3-Clause` | PyTorch deep learning framework |
| torchvision | 0.24.1 | BSD | `BSD-3-Clause` | Computer vision library for PyTorch |
| torchaudio | 2.9.1 | BSD | `BSD-2-Clause` | Audio processing for PyTorch |

### Transformers & NLP

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| transformers | 4.57.3 | Apache-2.0 | `Apache-2.0` | State-of-the-art NLP/ML models |
| huggingface-hub | 0.36.0 | Apache-2.0 | `Apache-2.0` | Hugging Face model hub client |
| tokenizers | 0.25.0 | Apache-2.0 | `Apache-2.0` | Fast tokenizers |
| safetensors | 0.5.3 | Apache-2.0 | `Apache-2.0` | Safe tensor serialization |
| accelerate | 1.7.0 | Apache-2.0 | `Apache-2.0` | Training acceleration |

### Object Detection

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| yolox | 0.3.0 | Apache-2.0 | `Apache-2.0` | YOLOX object detection |

### Computer Vision

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| opencv-python | 4.12.0 | Apache-2.0 | `Apache-2.0` | Computer vision library |
| opencv-python-headless | 4.12.0 | Apache-2.0 | `Apache-2.0` | Headless OpenCV |
| pillow | 12.0.0 | MIT-CMU | `HPND` | Image processing |
| scikit-image | 0.25.2 | BSD | `BSD-3-Clause` | Image processing algorithms |

### Model Formats

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| onnx | 1.20.0 | Apache-2.0 | `Apache-2.0` | ONNX model format |
| onnxruntime | 1.22.0 | MIT | `MIT` | ONNX Runtime inference |
| timm | 1.0.22 | Apache-2.0 | `Apache-2.0` | PyTorch image models |

---

## Web Framework & API

### FastAPI Stack

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| fastapi | 0.123.8 | MIT | `MIT` | Modern async web framework |
| uvicorn | 0.38.0 | BSD-3-Clause | `BSD-3-Clause` | ASGI server |
| starlette | 0.50.0 | BSD-3-Clause | `BSD-3-Clause` | ASGI framework |
| pydantic | 2.12.5 | MIT | `MIT` | Data validation |
| pydantic-core | 2.33.2 | MIT | `MIT` | Pydantic core |
| pydantic-settings | 2.9.1 | MIT | `MIT` | Settings management |

### HTTP Clients

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| httpx | 0.28.1 | BSD | `BSD-3-Clause` | Async HTTP client |
| aiohttp | 3.13.2 | Apache-2.0 | `Apache-2.0` | Async HTTP client/server |
| requests | 2.32.5 | Apache-2.0 | `Apache-2.0` | HTTP library |
| urllib3 | 2.4.0 | MIT | `MIT` | HTTP client |

### WebSocket

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| websockets | 15.0.1 | BSD | `BSD-3-Clause` | WebSocket implementation |
| python-socketio | 5.13.0 | MIT | `MIT` | Socket.IO client |

---

## Database & Storage

### PostgreSQL

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| asyncpg | 0.31.0 | Apache-2.0 | `Apache-2.0` | PostgreSQL async driver |
| psycopg2-binary | 2.9.10 | LGPL-3.0 | `LGPL-3.0-only` | PostgreSQL driver |

> psycopg2 LGPL allows linking without copyleft obligations.

### MongoDB

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| pymongo | 4.15.5 | Apache-2.0 | `Apache-2.0` | MongoDB driver |
| motor | 3.8.0 | Apache-2.0 | `Apache-2.0` | Async MongoDB driver |

### Redis

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| redis | 7.1.0 | MIT | `MIT` | Redis client |
| aioredis | 2.0.1 | MIT | `MIT` | Async Redis client |

### Neo4j

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| neo4j | 6.0.3 | Apache-2.0 | `Apache-2.0` | Neo4j driver |

---

## RDF & Linked Data

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| rdflib | 7.5.0 | BSD | `BSD-3-Clause` | RDF library |
| rdflib-jsonld | 0.6.2 | BSD | `BSD-3-Clause` | JSON-LD plugin |
| isodate | 0.7.2 | BSD | `BSD-3-Clause` | ISO 8601 parser |
| SPARQLWrapper | 2.0.0 | W3C | `W3C` | SPARQL client |

---

## Data Processing

### NumPy Ecosystem

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| numpy | 2.2.6 | BSD | `BSD-3-Clause` | Numerical computing |
| pandas | 2.3.3 | BSD | `BSD-3-Clause` | Data analysis |
| scipy | 1.15.3 | BSD | `BSD-3-Clause` | Scientific computing |

### Data Formats

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| PyYAML | 6.0.3 | MIT | `MIT` | YAML parser |
| orjson | 3.10.18 | Apache-2.0/MIT | `Apache-2.0 OR MIT` | Fast JSON |
| ujson | 5.10.0 | BSD | `BSD-3-Clause` | Ultra-fast JSON |
| msgpack | 1.1.0 | Apache-2.0 | `Apache-2.0` | MessagePack |

---

## Messaging & Events

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| kafka-python | 2.3.0 | Apache-2.0 | `Apache-2.0` | Apache Kafka client |
| aiokafka | 0.12.0 | Apache-2.0 | `Apache-2.0` | Async Kafka client |
| pika | 1.3.2 | BSD | `BSD-3-Clause` | RabbitMQ client |

---

## Utilities

### Logging & Monitoring

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| loguru | 0.7.3 | MIT | `MIT` | Logging library |
| structlog | 25.4.0 | Apache-2.0/MIT | `Apache-2.0 OR MIT` | Structured logging |
| rich | 14.2.0 | MIT | `MIT` | Rich text formatting |
| tqdm | 4.67.1 | MIT/MPL-2.0 | `MIT` | Progress bars |

### CLI & Configuration

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| click | 8.3.1 | BSD-3-Clause | `BSD-3-Clause` | CLI framework |
| typer | 0.17.0 | MIT | `MIT` | CLI builder |
| python-dotenv | 1.2.1 | BSD-3-Clause | `BSD-3-Clause` | Environment variables |

### Date & Time

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| python-dateutil | 2.9.0 | Apache-2.0/BSD | `Apache-2.0` | Date utilities |
| pytz | 2025.2 | MIT | `MIT` | Timezone library |
| arrow | 1.3.0 | Apache-2.0 | `Apache-2.0` | Date/time library |

### PDF Generation

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| reportlab | 4.4.5 | BSD | `BSD-3-Clause` | PDF generation (pure Python) |

> **Migration Note (2025-12):** weasyprint and pyphen have been **removed** from the project. weasyprint had pyphen (GPL/LGPL) as a dependency, making it incompatible with MIT licensing. PDF generation now uses pure reportlab (BSD license).

---

## Development Tools (Not Distributed)

These packages are development-only and NOT included in production:

| Package | Version | License | SPDX ID | Description |
|---------|---------|---------|---------|-------------|
| pytest | 9.0.1 | MIT | `MIT` | Testing framework |
| pytest-asyncio | 1.3.0 | Apache-2.0 | `Apache-2.0` | Async testing |
| pytest-cov | 7.0.0 | MIT | `MIT` | Coverage plugin |
| black | 25.11.0 | MIT | `MIT` | Code formatter |
| ruff | 0.14.8 | MIT | `MIT` | Linting & import sorting |
| mypy | 1.19.0 | MIT | `MIT` | Type checking |

> ✅ All development tools are 100% MIT-compatible. Previously used GPL tools (pylint, astroid, flake8, isort) have been replaced with ruff (MIT).

---

## Verification Commands

```bash
# Generate license report
pip-licenses --format=markdown --with-urls

# Check for GPL/LGPL
pip-licenses | grep -E "GPL|LGPL"

# Export to CSV
pip-licenses --format=csv > python-licenses.csv
```

## Related Documentation

- [Overview](./overview.md) - License summary
- [NPM Dependencies](./npm-dependencies.md) - Node.js licenses
- [License Texts](./license-texts.md) - Full license texts

## References

- [PyPI](https://pypi.org/)
- [pip-licenses](https://github.com/raimon49/pip-licenses)
- [SPDX License List](https://spdx.org/licenses/)
