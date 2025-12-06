<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Complete testing and quality guide.

Module: apps/traffic-web-app/frontend/docs/docs/testing/complete-testing-guide.md
Author: UIP Team
Version: 1.0.0
-->

# Complete Testing & Quality Guide

## Overview

Comprehensive testing strategy for the HCMC Traffic Management System covering unit tests, integration tests, E2E tests, performance testing, and code quality standards.

**Testing Stack:**
- **Python**: pytest, pytest-cov, pytest-asyncio, pytest-mock, Locust
- **TypeScript/JavaScript**: Jest, React Testing Library, Playwright, Cypress
- **Code Quality**: ESLint, Pylint, Black, Prettier, mypy, SonarQube
- **CI/CD**: GitHub Actions, Pre-commit hooks

---

## Table of Contents

### [Unit Testing](#unit-testing)
1. [Python Unit Tests](#python-unit-tests)
2. [TypeScript Unit Tests](#typescript-unit-tests)
3. [Test Coverage](#test-coverage)

### [Integration Testing](#integration-testing)
4. [API Integration Tests](#api-integration-tests)
5. [Database Integration](#database-integration)
6. [Agent Integration](#agent-integration)
7. [External Services](#external-services)

### [E2E Testing](#e2e-testing)
8. [Playwright Setup](#playwright-setup)
9. [User Workflows](#user-workflows)
10. [Visual Regression](#visual-regression)

### [Performance Testing](#performance-testing)
11. [Load Testing](#load-testing)
12. [Stress Testing](#stress-testing)
13. [Database Performance](#database-performance)

### [Code Quality](#code-quality)
14. [Linting](#linting)
15. [Type Checking](#type-checking)
16. [Code Formatting](#code-formatting)
17. [Security Scanning](#security-scanning)

### [CI/CD Integration](#cicd-integration)
18. [Pre-commit Hooks](#pre-commit-hooks)
19. [GitHub Actions](#github-actions-testing)
20. [Coverage Reporting](#coverage-reporting)

---

# Unit Testing

## Python Unit Tests

### pytest Configuration

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --cov=src
    --cov=agents
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    --asyncio-mode=auto
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
    gpu: Tests requiring GPU
```

### Camera Agent Unit Tests

```python
# tests/unit/agents/test_camera_image_fetch.py
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import cv2
import numpy as np
from agents.camera_image_fetch import CameraImageFetchAgent

@pytest.fixture
def camera_config():
    """Fixture for camera configuration."""
    return {
        "id": "CAM_001",
        "name": "Camera District 1",
        "stream_url": "rtsp://example.com/stream1",
        "location": {"lat": 10.7769, "lon": 106.7009}
    }

@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis_mock = Mock()
    redis_mock.get = Mock(return_value=None)
    redis_mock.setex = Mock(return_value=True)
    return redis_mock

@pytest.fixture
def camera_agent(camera_config, mock_redis):
    """Create camera agent instance."""
    agent = CameraImageFetchAgent(config=camera_config)
    agent.redis_client = mock_redis
    return agent

class TestCameraImageFetchAgent:
    """Test suite for Camera Image Fetch Agent."""
    
    def test_initialization(self, camera_agent, camera_config):
        """Test agent initialization."""
        assert camera_agent.camera_id == "CAM_001"
        assert camera_agent.stream_url == camera_config["stream_url"]
        assert camera_agent.location == camera_config["location"]
    
    @pytest.mark.asyncio
    async def test_fetch_image_success(self, camera_agent):
        """Test successful image fetching."""
        # Create dummy image
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
        
        with patch('cv2.VideoCapture') as mock_cap:
            mock_cap.return_value.read.return_value = (True, dummy_image)
            mock_cap.return_value.release = Mock()
            
            result = await camera_agent.fetch_image()
            
            assert result is not None
            assert result["camera_id"] == "CAM_001"
            assert result["timestamp"] is not None
            assert isinstance(result["image"], np.ndarray)
    
    @pytest.mark.asyncio
    async def test_fetch_image_failure(self, camera_agent):
        """Test image fetch failure handling."""
        with patch('cv2.VideoCapture') as mock_cap:
            mock_cap.return_value.read.return_value = (False, None)
            
            result = await camera_agent.fetch_image()
            
            assert result is None
    
    def test_cache_hit(self, camera_agent, mock_redis):
        """Test cache retrieval."""
        cached_data = b'cached_image_data'
        mock_redis.get.return_value = cached_data
        
        result = camera_agent.get_cached_image()
        
        assert result == cached_data
        mock_redis.get.assert_called_once()
    
    def test_cache_miss(self, camera_agent, mock_redis):
        """Test cache miss scenario."""
        mock_redis.get.return_value = None
        
        result = camera_agent.get_cached_image()
        
        assert result is None
    
    @pytest.mark.parametrize("quality,expected_size", [
        (50, 5000),
        (75, 10000),
        (100, 20000)
    ])
    def test_image_compression(self, camera_agent, quality, expected_size):
        """Test image compression with different quality levels."""
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
        
        compressed = camera_agent.compress_image(dummy_image, quality)
        
        assert len(compressed) > 0
        assert len(compressed) < expected_size
```

### Accident Detection Unit Tests

```python
# tests/unit/agents/test_accident_detection.py
import pytest
from unittest.mock import Mock, patch
import numpy as np
from agents.accident_detection import AccidentDetectionAgent

@pytest.fixture
def yolo_model_mock():
    """Mock YOLOX model."""
    model = Mock()
    model.predict = Mock(return_value=[Mock(boxes=Mock(xyxy=np.array([[100, 100, 200, 200]])))])
    return model

@pytest.fixture
def detection_agent(yolo_model_mock):
    """Create accident detection agent with YOLOX."""
    # Using YOLOX model - mock the exp.get_model() call
    with patch('yolox.exp.get_exp') as mock_get_exp:
        mock_get_exp.return_value.get_model.return_value = yolo_model_mock
        agent = AccidentDetectionAgent()
    return agent

class TestAccidentDetectionAgent:
    """Test suite for Accident Detection Agent."""
    
    def test_initialization(self, detection_agent):
        """Test agent initialization."""
        assert detection_agent.model is not None
        assert detection_agent.confidence_threshold == 0.5
    
    def test_detect_accident_positive(self, detection_agent):
        """Test accident detection with positive result."""
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
        
        result = detection_agent.detect(dummy_image)
        
        assert result is not None
        assert "accident_detected" in result
        assert result["accident_detected"] is True
        assert "confidence" in result
    
    def test_detect_accident_negative(self, detection_agent, yolo_model_mock):
        """Test no accident detected."""
        yolo_model_mock.predict.return_value = [Mock(boxes=Mock(xyxy=np.array([])))]
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
        
        result = detection_agent.detect(dummy_image)
        
        assert result["accident_detected"] is False
    
    @pytest.mark.parametrize("confidence,should_detect", [
        (0.3, False),
        (0.5, True),
        (0.8, True),
        (0.95, True)
    ])
    def test_confidence_threshold(self, detection_agent, confidence, should_detect):
        """Test confidence threshold filtering."""
        detection_agent.confidence_threshold = 0.5
        
        result = detection_agent._filter_by_confidence(confidence)
        
        assert result == should_detect
```

---

## TypeScript Unit Tests

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  }
};
```

### Component Unit Tests

```typescript
// src/components/__tests__/TrafficMap.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrafficMap } from '../TrafficMap';
import '@testing-library/jest-dom';

// Mock Leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
}));

describe('TrafficMap Component', () => {
  const mockCameras = [
    {
      id: 'CAM_001',
      name: 'Camera 1',
      location: { lat: 10.7769, lon: 106.7009 },
      status: 'active'
    },
    {
      id: 'CAM_002',
      name: 'Camera 2',
      location: { lat: 10.7800, lon: 106.7100 },
      status: 'inactive'
    }
  ];
  
  const mockAccidents = [
    {
      id: 'ACC_001',
      location: { lat: 10.7750, lon: 106.7050 },
      severity: 'severe',
      timestamp: new Date().toISOString()
    }
  ];
  
  it('renders map container', () => {
    render(<TrafficMap cameras={mockCameras} accidents={[]} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });
  
  it('displays camera markers', () => {
    render(<TrafficMap cameras={mockCameras} accidents={[]} />);
    
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);
  });
  
  it('displays accident markers', () => {
    render(<TrafficMap cameras={[]} accidents={mockAccidents} />);
    
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(1);
  });
  
  it('filters cameras by status', async () => {
    const { rerender } = render(
      <TrafficMap cameras={mockCameras} accidents={[]} filterStatus="active" />
    );
    
    let markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(1);
    
    rerender(<TrafficMap cameras={mockCameras} accidents={[]} filterStatus="all" />);
    
    markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);
  });
  
  it('calls onCameraClick when camera is clicked', async () => {
    const handleCameraClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <TrafficMap 
        cameras={mockCameras} 
        accidents={[]} 
        onCameraClick={handleCameraClick} 
      />
    );
    
    const marker = screen.getAllByTestId('marker')[0];
    await user.click(marker);
    
    expect(handleCameraClick).toHaveBeenCalledWith('CAM_001');
  });
});
```

### API Hook Tests

```typescript
// src/hooks/__tests__/useCameras.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useCameras } from '../useCameras';

const server = setupServer(
  rest.get('/api/cameras', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          { id: 'CAM_001', name: 'Camera 1', status: 'active' },
          { id: 'CAM_002', name: 'Camera 2', status: 'active' }
        ]
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useCameras Hook', () => {
  it('fetches cameras successfully', async () => {
    const { result } = renderHook(() => useCameras());
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.cameras).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });
  
  it('handles fetch error', async () => {
    server.use(
      rest.get('/api/cameras', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );
    
    const { result } = renderHook(() => useCameras());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.cameras).toHaveLength(0);
    expect(result.current.error).not.toBeNull();
  });
});
```

---

# Integration Testing

## API Integration Tests

### FastAPI Integration Tests

```python
# tests/integration/test_api_integration.py
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.mark.integration
@pytest.mark.asyncio
async def test_camera_list_endpoint():
    """Test camera list API endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/cameras")
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)

@pytest.mark.integration
@pytest.mark.asyncio
async def test_camera_details_endpoint():
    """Test camera details endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/cameras/CAM_001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "CAM_001"
        assert "name" in data
        assert "location" in data

@pytest.mark.integration
@pytest.mark.asyncio
async def test_accident_report_creation():
    """Test creating accident report."""
    accident_data = {
        "location": {"lat": 10.7769, "lon": 106.7009},
        "severity": "moderate",
        "description": "Two vehicle collision",
        "camera_id": "CAM_001"
    }
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/accidents", json=accident_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["severity"] == "moderate"
        assert "id" in data

@pytest.mark.integration
@pytest.mark.asyncio
async def test_authentication_flow():
    """Test authentication workflow."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login
        login_response = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "testpass"}
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        assert "access_token" in tokens
        
        # Access protected endpoint
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        protected_response = await client.get("/api/user/profile", headers=headers)
        assert protected_response.status_code == 200
```

---

## Database Integration

### MongoDB Integration Tests

```python
# tests/integration/test_mongodb_integration.py
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

@pytest.fixture
async def mongo_client():
    """Create MongoDB test client."""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.test_traffic_db
    yield db
    await client.drop_database("test_traffic_db")
    client.close()

@pytest.mark.integration
@pytest.mark.asyncio
async def test_insert_camera_data(mongo_client):
    """Test inserting camera data."""
    camera_data = {
        "id": "CAM_TEST_001",
        "name": "Test Camera",
        "location": {"lat": 10.7769, "lon": 106.7009},
        "status": "active",
        "created_at": datetime.utcnow()
    }
    
    result = await mongo_client.cameras.insert_one(camera_data)
    assert result.inserted_id is not None
    
    # Verify insertion
    found = await mongo_client.cameras.find_one({"id": "CAM_TEST_001"})
    assert found["name"] == "Test Camera"

@pytest.mark.integration
@pytest.mark.asyncio
async def test_query_accidents_by_severity(mongo_client):
    """Test querying accidents by severity."""
    accidents = [
        {"id": "ACC_001", "severity": "minor", "location": {"lat": 10.77, "lon": 106.70}},
        {"id": "ACC_002", "severity": "severe", "location": {"lat": 10.78, "lon": 106.71}},
        {"id": "ACC_003", "severity": "moderate", "location": {"lat": 10.79, "lon": 106.72}}
    ]
    
    await mongo_client.accidents.insert_many(accidents)
    
    # Query severe accidents
    severe_accidents = await mongo_client.accidents.find({"severity": "severe"}).to_list(length=100)
    assert len(severe_accidents) == 1
    assert severe_accidents[0]["id"] == "ACC_002"
```

---

# E2E Testing

## Playwright Setup

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### User Workflow Tests

```typescript
// e2e/citizen-report.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Citizen Report Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  
  test('user submits accident report', async ({ page }) => {
    // Navigate to report page
    await page.click('button:has-text("Report Accident")');
    await expect(page).toHaveURL('/report');
    
    // Fill form
    await page.fill('input[name="location"]', '10.7769, 106.7009');
    await page.selectOption('select[name="severity"]', 'moderate');
    await page.fill('textarea[name="description"]', 'Two car collision at intersection');
    
    // Upload image
    await page.setInputFiles('input[type="file"]', 'test-data/accident-image.jpg');
    
    // Submit
    await page.click('button:has-text("Submit Report")');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Report submitted successfully');
  });
  
  test('displays real-time accident alerts', async ({ page }) => {
    await page.goto('/map');
    
    // Wait for map to load
    await page.waitForSelector('.leaflet-container');
    
    // Trigger accident (simulate WebSocket message)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('accident-alert', {
        detail: {
          id: 'ACC_TEST_001',
          severity: 'severe',
          location: { lat: 10.7769, lon: 106.7009 }
        }
      }));
    });
    
    // Verify alert appears
    await expect(page.locator('.accident-alert')).toBeVisible();
    await expect(page.locator('.accident-alert')).toContainText('severe');
  });
  
  test('filters cameras by district', async ({ page }) => {
    await page.goto('/cameras');
    
    // Wait for cameras to load
    await page.waitForSelector('.camera-card');
    
    const initialCount = await page.locator('.camera-card').count();
    
    // Apply district filter
    await page.selectOption('select[name="district"]', 'District 1');
    
    // Verify filtered results
    const filteredCount = await page.locator('.camera-card').count();
    expect(filteredCount).toBeLessThan(initialCount);
    
    // Verify all visible cameras are in District 1
    const districts = await page.locator('.camera-card .district').allTextContents();
    districts.forEach(district => {
      expect(district).toContain('District 1');
    });
  });
});
```

---

# Performance Testing

## Load Testing

### Locust Load Test

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between

class TrafficSystemUser(HttpUser):
    """Simulate user behavior for load testing."""
    
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before tests."""
        response = self.client.post("/api/auth/login", json={
            "username": "loadtest_user",
            "password": "loadtest_pass"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def view_cameras(self):
        """View camera list (most common operation)."""
        self.client.get("/api/cameras", headers=self.headers)
    
    @task(2)
    def view_accidents(self):
        """View accident list."""
        self.client.get("/api/accidents", headers=self.headers)
    
    @task(1)
    def view_traffic_flow(self):
        """View traffic flow data."""
        self.client.get("/api/traffic/flow", headers=self.headers)
    
    @task(1)
    def view_camera_details(self):
        """View specific camera details."""
        self.client.get("/api/cameras/CAM_001", headers=self.headers)
    
    @task(1)
    def submit_citizen_report(self):
        """Submit citizen report."""
        report_data = {
            "location": {"lat": 10.7769, "lon": 106.7009},
            "severity": "moderate",
            "description": "Test report from load testing"
        }
        self.client.post("/api/citizen-reports", json=report_data, headers=self.headers)
```

### Running Load Tests

```bash
# Run load test with 100 users
locust -f tests/performance/locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10

# Run headless with specific duration
locust -f tests/performance/locustfile.py --host=http://localhost:8000 \
    --users 1000 --spawn-rate 50 --run-time 10m --headless
```

---

# Code Quality

## Linting

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

### Pylint Configuration

```ini
# .pylintrc
[MASTER]
max-line-length=120
disable=
    C0111,  # missing-docstring
    R0903,  # too-few-public-methods
    R0913,  # too-many-arguments

[TYPECHECK]
generated-members=cv2.*,torch.*
```

---

## Pre-commit Hooks

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
  
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.9
  
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: ["--profile", "black"]
  
  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=120']
  
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
  
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json, css, markdown]
```

---

## Related Documentation

- [Complete Agents Reference](../agents/complete-agents-reference.md)
- [Complete Components Reference](../frontend/complete-components-reference.md)
- [Complete API Reference](../api/complete-api-reference.md)
- [Complete DevOps Guide](../devops/complete-devops-guide.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)

See [LICENSE](../LICENSE) for details.
