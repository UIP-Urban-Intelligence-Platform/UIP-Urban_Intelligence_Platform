# 🧪 Testing Guide

Complete testing documentation for UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform uses a comprehensive testing strategy:

| Test Type | Framework | Location | Purpose |
|-----------|-----------|----------|---------|
| **Unit Tests** | pytest | `tests/unit/` | Test individual components |
| **Integration Tests** | pytest | `tests/integration/` | Test component interactions |
| **E2E Tests** | pytest | `tests/e2e/` | Test complete workflows |
| **API Tests** | Jest/Supertest | `apps/traffic-web-app/backend/src/routes/__tests__/` | Test API endpoints |
| **Frontend Tests** | Vitest/Testing Library | `apps/traffic-web-app/frontend/src/__tests__/` | Test React components |

---

## 🛠️ Test Setup

### Prerequisites

```bash
# Python testing dependencies
pip install -r requirements/dev.txt

# Node.js testing dependencies
cd apps/traffic-web-app/frontend && npm install
cd apps/traffic-web-app/backend && npm install
```

### Environment Setup

```bash
# Copy test environment
cp .env.example .env.test

# Set test environment
export ENVIRONMENT=test
```

---

## 🐍 Python Tests

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_ngsi_ld_transformer.py

# Run specific test function
pytest tests/unit/test_ngsi_ld_transformer.py::test_create_entity

# Run tests matching pattern
pytest -k "ngsi or rdf"

# Run with verbose output
pytest -v

# Run in parallel
pytest -n auto
```

### pytest Configuration

`pytest.ini`:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
python_classes = Test*
addopts = -v --tb=short --strict-markers
asyncio_mode = auto
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

---

## 📁 Test Structure

### Unit Tests

Location: `tests/unit/`

| Test File | Tests |
|-----------|-------|
| `test_ngsi_ld_transformer.py` | NGSI-LD entity creation |
| `test_sosa_mapper.py` | SOSA ontology mapping |
| `test_pattern_recognition.py` | Pattern detection algorithms |
| `test_accident_detection.py` | Accident detection logic |
| `test_alert_dispatcher.py` | Alert dispatching |
| `test_cache_manager.py` | Cache operations |
| `test_config_loader.py` | Configuration loading |
| `test_orchestrator.py` | Workflow orchestration |
| `test_logger.py` | Logging functionality |

### Integration Tests

Location: `tests/integration/`

| Test File | Tests |
|-----------|-------|
| `test_stellio_integration.py` | Stellio Context Broker |
| `test_fuseki_integration.py` | Apache Fuseki SPARQL |
| `test_neo4j_integration.py` | Neo4j graph database |
| `test_kafka_integration.py` | Kafka messaging |
| `test_mongodb_publisher.py` | MongoDB operations |
| `test_cache_integration.py` | Redis cache |
| `test_rdf_pipeline.py` | RDF transformation pipeline |
| `test_workflow.py` | Full workflow execution |

---

## 🧩 Unit Test Examples

### Testing NGSI-LD Transformer

```python
# tests/unit/test_ngsi_ld_transformer.py

import pytest
from src.agents.rdf_linked_data.ngsi_ld_generator_agent import NGSILDGeneratorAgent

class TestNGSILDTransformer:
    @pytest.fixture
    def transformer(self):
        return NGSILDGeneratorAgent()
    
    def test_create_entity(self, transformer):
        """Test NGSI-LD entity creation"""
        data = {
            "id": "camera-001",
            "name": "Traffic Camera 1",
            "location": [105.8342, 21.0278]
        }
        
        entity = transformer.create_entity("Device", data)
        
        assert entity["type"] == "Device"
        assert entity["id"].startswith("urn:ngsi-ld:")
        assert "@context" in entity
    
    def test_create_geo_property(self, transformer):
        """Test GeoProperty creation"""
        coords = [105.8342, 21.0278]
        
        geo = transformer.create_geo_property(coords)
        
        assert geo["type"] == "GeoProperty"
        assert geo["value"]["type"] == "Point"
        assert geo["value"]["coordinates"] == coords
    
    @pytest.mark.asyncio
    async def test_batch_transform(self, transformer):
        """Test batch transformation"""
        items = [
            {"id": f"camera-{i}", "name": f"Camera {i}"}
            for i in range(10)
        ]
        
        entities = await transformer.batch_transform(items)
        
        assert len(entities) == 10
```

### Testing Pattern Recognition

```python
# tests/unit/test_pattern_recognition.py

import pytest
import numpy as np
from src.agents.processing.pattern_recognition_agent import PatternRecognitionAgent

class TestPatternRecognition:
    @pytest.fixture
    def agent(self):
        return PatternRecognitionAgent()
    
    def test_detect_congestion_pattern(self, agent):
        """Test congestion pattern detection"""
        traffic_data = [
            {"timestamp": "2024-01-15T08:00:00Z", "flow": 0.3},
            {"timestamp": "2024-01-15T08:15:00Z", "flow": 0.5},
            {"timestamp": "2024-01-15T08:30:00Z", "flow": 0.8},
            {"timestamp": "2024-01-15T08:45:00Z", "flow": 0.9},
        ]
        
        patterns = agent.detect_patterns(traffic_data)
        
        assert len(patterns) > 0
        assert patterns[0]["type"] == "congestion"
    
    def test_anomaly_detection(self, agent):
        """Test anomaly detection"""
        normal_data = np.random.normal(50, 5, 100).tolist()
        anomaly_data = normal_data + [150]  # Add anomaly
        
        anomalies = agent.detect_anomalies(anomaly_data)
        
        assert len(anomalies) == 1
        assert anomalies[0]["index"] == 100
```

---

## 🔗 Integration Test Examples

### Testing Stellio Integration

```python
# tests/integration/test_stellio_integration.py

import pytest
import httpx
from src.agents.integration.stellio_sync_agent import StellioSyncAgent

@pytest.mark.integration
class TestStellioIntegration:
    @pytest.fixture
    def agent(self):
        return StellioSyncAgent()
    
    @pytest.mark.asyncio
    async def test_create_entity(self, agent):
        """Test entity creation in Stellio"""
        entity = {
            "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
            "id": "urn:ngsi-ld:Device:test-001",
            "type": "Device",
            "name": {"type": "Property", "value": "Test Device"}
        }
        
        response = await agent.create_entity(entity)
        
        assert response.status_code in [201, 409]  # Created or exists
    
    @pytest.mark.asyncio
    async def test_query_entities(self, agent):
        """Test entity querying from Stellio"""
        entities = await agent.query_entities(entity_type="Device")
        
        assert isinstance(entities, list)
```

### Testing Neo4j Integration

```python
# tests/integration/test_neo4j_integration.py

import pytest
from src.agents.integration.neo4j_sync_agent import Neo4jSyncAgent

@pytest.mark.integration
class TestNeo4jIntegration:
    @pytest.fixture
    def agent(self):
        return Neo4jSyncAgent()
    
    @pytest.mark.asyncio
    async def test_create_node(self, agent):
        """Test node creation in Neo4j"""
        node_data = {
            "id": "camera-test-001",
            "name": "Test Camera",
            "type": "Camera"
        }
        
        result = await agent.create_node("Camera", node_data)
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_create_relationship(self, agent):
        """Test relationship creation in Neo4j"""
        result = await agent.create_relationship(
            "camera-001",
            "road-001",
            "MONITORS"
        )
        
        assert result is not None
```

---

## 🌐 API Tests (Backend)

Location: `apps/traffic-web-app/backend/src/routes/__tests__/`

```typescript
// __tests__/cameraRoutes.test.ts

import request from 'supertest';
import { app } from '../../server';

describe('Camera API', () => {
  describe('GET /api/cameras', () => {
    it('should return all cameras', async () => {
      const response = await request(app)
        .get('/api/cameras')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should filter cameras by status', async () => {
      const response = await request(app)
        .get('/api/cameras?status=active')
        .expect(200);
      
      response.body.data.forEach((camera: any) => {
        expect(camera.status).toBe('active');
      });
    });
  });
  
  describe('GET /api/cameras/:id', () => {
    it('should return camera by ID', async () => {
      const response = await request(app)
        .get('/api/cameras/camera-001')
        .expect(200);
      
      expect(response.body.data.id).toBe('camera-001');
    });
    
    it('should return 404 for non-existent camera', async () => {
      await request(app)
        .get('/api/cameras/non-existent')
        .expect(404);
    });
  });
});
```

### Running Backend Tests

```bash
cd apps/traffic-web-app/backend
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
```

---

## ⚛️ Frontend Tests

Location: `apps/traffic-web-app/frontend/src/__tests__/`

```typescript
// __tests__/TrafficMap.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { TrafficMap } from '../components/TrafficMap';

describe('TrafficMap Component', () => {
  it('renders map container', () => {
    render(<TrafficMap />);
    
    expect(screen.getByTestId('traffic-map')).toBeInTheDocument();
  });
  
  it('displays loading state initially', () => {
    render(<TrafficMap />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  it('renders camera markers after data loads', async () => {
    render(<TrafficMap />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('camera-marker')).toHaveLength(5);
    });
  });
});
```

### Running Frontend Tests

```bash
cd apps/traffic-web-app/frontend
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm run test:coverage       # With coverage
```

---

## 📊 Test Coverage

### Generate Coverage Report

```bash
# Python coverage
pytest --cov=src --cov-report=html --cov-report=xml
open htmlcov/index.html

# Backend coverage
cd apps/traffic-web-app/backend
npm run test:coverage

# Frontend coverage
cd apps/traffic-web-app/frontend
npm run test:coverage
```

### Coverage Targets

| Module | Target | Current |
|--------|--------|---------|
| Core Agents | 80% | ![Coverage](https://img.shields.io/badge/coverage-85%25-green) |
| Integration | 70% | ![Coverage](https://img.shields.io/badge/coverage-75%25-green) |
| API Routes | 90% | ![Coverage](https://img.shields.io/badge/coverage-88%25-green) |
| Frontend | 70% | ![Coverage](https://img.shields.io/badge/coverage-72%25-green) |

---

## 🏃 CI/CD Integration

### GitHub Actions Workflow

`.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.9'
      - run: pip install -r requirements/dev.txt
      - run: pytest --cov=src --cov-report=xml
      - uses: codecov/codecov-action@v3
        with:
          files: coverage.xml

  node-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd apps/traffic-web-app/backend && npm ci && npm test
      - run: cd apps/traffic-web-app/frontend && npm ci && npm test
```

---

## 🔧 Test Utilities

### Fixtures

`tests/conftest.py`:
```python
import pytest
import asyncio
from src.utils.config_loader import ConfigLoader

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def config():
    """Load test configuration"""
    return ConfigLoader("config/test_config.yaml")

@pytest.fixture
def sample_camera_data():
    """Sample camera data for testing"""
    return {
        "id": "camera-001",
        "name": "Test Camera",
        "location": {
            "type": "Point",
            "coordinates": [105.8342, 21.0278]
        },
        "status": "active"
    }

@pytest.fixture
async def mock_stellio():
    """Mock Stellio client"""
    # Setup mock
    yield mock_client
    # Cleanup
```

### Mocking

```python
from unittest.mock import Mock, patch, AsyncMock

def test_with_mock():
    with patch('src.agents.ingestion.weather_agent.httpx.get') as mock_get:
        mock_get.return_value.json.return_value = {"temp": 25}
        
        result = weather_agent.fetch_weather()
        
        assert result["temp"] == 25

@pytest.mark.asyncio
async def test_async_mock():
    with patch.object(agent, 'fetch_data', new_callable=AsyncMock) as mock:
        mock.return_value = {"data": "test"}
        
        result = await agent.process()
        
        assert result["data"] == "test"
```

---

## 📋 Best Practices

### Testing Guidelines

1. **Naming Convention**
   - Test files: `test_*.py`
   - Test functions: `test_*`
   - Test classes: `Test*`

2. **AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the code
   - Assert: Verify results

3. **Isolation**
   - Each test should be independent
   - Use fixtures for setup/teardown
   - Mock external dependencies

4. **Coverage**
   - Aim for 80%+ coverage
   - Focus on critical paths
   - Don't test trivial code

---

## 📚 Related Pages

- [[Contributing]] - Contribution guidelines
- [[Configuration]] - Test configuration
- [[CI-CD]] - CI/CD setup
