<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Development workflow documentation.

Module: apps/traffic-web-app/frontend/docs/docs/guides/development.md
Author: UIP Team
Version: 1.0.0
-->

# Development Workflow

## Overview

Complete guide for local development, debugging, testing, and preparing contributions for the HCMC Traffic Management System.

## Prerequisites

- Node.js v20.15.0 or higher
- Python 3.9+
- Docker Desktop
- Git
- VS Code (recommended)

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform
```

### 2. Install Dependencies

```bash
# Backend dependencies
pip install -r requirements/dev.txt

# Frontend dependencies
cd apps/traffic-web-app/frontend
npm install
cd ../../..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Example `.env`**:

```bash
# Development settings
APP_ENV=development
DEBUG=true
LOG_LEVEL=debug

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0

# Database URLs
MONGO_URI=mongodb://localhost:27017/hcmc_traffic_dev
REDIS_URL=redis://localhost:6379/0
NEO4J_URI=bolt://localhost:7687
FUSEKI_URL=http://localhost:3030
STELLIO_URL=http://localhost:8080

# Development Features
HOT_RELOAD=true
ENABLE_PROFILING=true
ENABLE_DEBUG_TOOLBAR=true
```

---

## 🐛 Debugging Guide

### Backend Debugging (Python)

#### VS Code Configuration for Backend

**`.vscode/launch.json`**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "src.main:app",
        "--reload",
        "--port", "8000"
      ],
      "jinja": true,
      "justMyCode": false
    },
    {
      "name": "Python: Orchestrator",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/orchestrator.py",
      "console": "integratedTerminal",
      "justMyCode": false
    },
    {
      "name": "Python: Single Agent",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "args": [
        "--config", "config/dev_config.yaml"
      ]
    }
  ]
}
```

#### Debugging with pdb

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use built-in breakpoint() (Python 3.7+)
breakpoint()

# Common pdb commands:
# n (next)    - Execute next line
# s (step)    - Step into function
# c (continue)- Continue execution
# p variable  - Print variable
# l (list)    - Show source code
# q (quit)    - Quit debugger
```

#### Logging Configuration

```python
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/debug.log')
    ]
)

logger = logging.getLogger(__name__)

# Use in code
logger.debug('Variable value: %s', variable)
logger.info('Processing started')
logger.warning('Potential issue detected')
logger.error('Error occurred', exc_info=True)
```

### Frontend Debugging (React + TypeScript)

#### VS Code Configuration for Frontend

**`.vscode/launch.json`** (add to configurations):

```json
{
  "name": "Chrome: Frontend",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/apps/traffic-web-app/frontend/src",
  "sourceMaps": true
}
```

#### React DevTools

```bash
# Install React DevTools
# Chrome Extension:
https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

# Firefox Extension:
https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

#### Browser DevTools Tips

```javascript
// Debug render cycles
console.log('Component rendered', { props, state });

// Performance profiling
console.time('API Call');
await fetchData();
console.timeEnd('API Call');

// Trace call stack
console.trace('Function called from');

// Debug WebSocket
const ws = new WebSocket('ws://localhost:8000/ws');
ws.addEventListener('message', (e) => {
  console.log('WebSocket message:', JSON.parse(e.data));
});
```

### Database Debugging

#### MongoDB

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/hcmc_traffic_dev

# Common queries
db.cameras.find().pretty()
db.accidents.find({severity: "severe"}).count()
db.traffic_flow.find().sort({timestamp: -1}).limit(10)

# Explain query plan
db.accidents.find({severity: "severe"}).explain("executionStats")
```

#### Neo4j

```cypher
// Open Neo4j Browser: http://localhost:7474

// View all nodes
MATCH (n) RETURN n LIMIT 25

// Find accident patterns
MATCH (c:Camera)-[:DETECTED]->(a:Accident)
WHERE a.severity = 'severe'
RETURN c.name, count(a) as accident_count
ORDER BY accident_count DESC

// Performance profiling
PROFILE MATCH (c:Camera)-[:DETECTED]->(a:Accident)
RETURN c, a
```

#### Redis

```bash
# Connect to Redis
redis-cli

# Common commands
KEYS camera:*
GET camera:CAM_001
TTL camera:CAM_001
HGETALL accident:state:ACC_001

# Monitor real-time
MONITOR
```

### Performance Profiling

#### Python Profiling

```python
import cProfile
import pstats

# Profile function
def profile_function():
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Your code here
    result = your_function()
    
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions
    
    return result

# Profile with decorator
from functools import wraps
import time

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f}s")
        return result
    return wrapper

@timing_decorator
async def fetch_camera_images():
    # Function implementation
    pass
```

#### Frontend Performance

```typescript
// React Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="TrafficMap" onRender={onRenderCallback}>
  <TrafficMap />
</Profiler>

// Performance API
performance.mark('fetch-start');
await fetchData();
performance.mark('fetch-end');
performance.measure('fetch-duration', 'fetch-start', 'fetch-end');
console.log(performance.getEntriesByName('fetch-duration')[0].duration);
```

### Common Issues & Solutions

#### Issue 1: Docker Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common fixes:
# 1. Port already in use
lsof -i :8000
kill -9 <PID>

# 2. Volume permissions
docker-compose down -v
docker-compose up -d

# 3. Rebuild images
docker-compose build --no-cache
```

#### Issue 2: WebSocket Connection Failed

```javascript
// Check WebSocket status
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('WebSocket error:', error);
ws.onclose = (event) => console.log('Disconnected:', event.code, event.reason);

// Common fixes:
// 1. Check backend is running
// 2. Verify WebSocket endpoint
// 3. Check CORS settings
```

#### Issue 3: High Memory Usage

```python
# Memory profiling
import tracemalloc

tracemalloc.start()

# Your code
result = memory_intensive_function()

current, peak = tracemalloc.get_traced_memory()
print(f"Current: {current / 10**6}MB, Peak: {peak / 10**6}MB")
tracemalloc.stop()

# Common fixes:
# 1. Use generators instead of lists
# 2. Implement pagination
# 3. Clear caches regularly
```

### Environment Variables Reference

```bash
DEBUG=true
APP_PORT=8000

# Database
MONGO_URI=mongodb://localhost:27017/hcmc_traffic_dev
REDIS_URL=redis://localhost:6379

# Context Broker
STELLIO_URL=http://localhost:8080
FUSEKI_URL=http://localhost:3030

# API Keys (get from team)
WEATHER_API_KEY=your_key
AIR_QUALITY_API_KEY=your_key
```

### 4. Start Infrastructure

```bash
# Start databases and services
docker-compose up -d mongo redis stellio fuseki

# Verify services
docker ps
```

## Running the Application

### Backend

```bash
# Start orchestrator (all agents)
python orchestrator.py

# Or start specific agent for testing
python -m src.agents.data_collection.camera_image_fetch_agent
```

### Frontend

```bash
cd apps/traffic-web-app/frontend
npm run dev
```

Visit: `http://localhost:3000`

### Documentation Site

```bash
cd apps/traffic-web-app/frontend/docs
npm run start
```

Visit: `http://localhost:3001`

## Development Tools

### VS Code Extensions

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "github.copilot"
  ]
}
```

### Python Tools

```bash
# Code formatting
black . --line-length 100

# Linting
flake8 src/
pylint src/

# Type checking
mypy src/
```

### TypeScript Tools

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

## Testing

### Unit Tests

```bash
# Python unit tests
pytest tests/unit/ -v

# TypeScript unit tests
npm test
```

### Integration Tests

```bash
# Backend integration tests
pytest tests/integration/ -v

# Frontend integration tests
npm run test:integration
```

### E2E Tests

```bash
# Playwright E2E tests
npm run test:e2e
```

### Test Coverage

```bash
# Python coverage
pytest --cov=src --cov-report=html

# TypeScript coverage
npm run test:coverage
```

## Debugging

### Backend Debugging

**VS Code launch.json**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Orchestrator",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/orchestrator.py",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    },
    {
      "name": "Python: Specific Agent",
      "type": "python",
      "request": "launch",
      "module": "src.agents.analytics.accident_detection_agent",
      "console": "integratedTerminal"
    }
  ]
}
```

### Frontend Debugging

```json
{
  "name": "Next.js: debug",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "port": 3000,
  "console": "integratedTerminal"
}
```

### Chrome DevTools

```bash
# Enable React DevTools
npm install -g react-devtools
react-devtools
```

## Git Workflow

### Branch Strategy

```bash
# Feature branch
git checkout -b feature/add-congestion-prediction

# Bug fix branch
git checkout -b fix/camera-timeout-issue

# Hotfix branch
git checkout -b hotfix/critical-security-patch
```

### Commit Conventions

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(agents): add congestion prediction agent"
git commit -m "fix(api): resolve camera timeout issue"
git commit -m "docs(guides): update deployment guide"
git commit -m "refactor(frontend): improve map performance"
git commit -m "test(integration): add end-to-end tests"
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Build/tooling changes

### Pull Request Workflow

```bash
# 1. Update from main
git checkout main
git pull origin main

# 2. Rebase feature branch
git checkout feature/your-feature
git rebase main

# 3. Push to remote
git push origin feature/your-feature

# 4. Create PR on GitHub
```

## Code Review Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] No console.log or debug prints
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Security considerations addressed

## Database Management

### MongoDB Management

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/hcmc_traffic_dev

# View collections
show collections

# Query data
db.cameras.find().pretty()
db.accidents.find().sort({timestamp: -1}).limit(10)
```

### Redis Management

```bash
# Connect to Redis
redis-cli

# View keys
KEYS *

# Get value
GET camera:CAM_001

# Clear cache
FLUSHDB
```

### Fuseki

Visit: `http://localhost:3030/dataset.html`

## Agent Development

### Create New Agent

```python
# src/agents/my_category/my_agent.py

from typing import Optional
from dataclasses import dataclass

@dataclass
class MyAgentConfig:
    """Configuration for My Agent."""
    enabled: bool = True
    interval: int = 60

class MyAgent:
    """Description of what this agent does."""
    
    def __init__(self, config: MyAgentConfig):
        """Initialize agent with configuration."""
        self.config = config
        
    def process(self, data: dict) -> dict:
        """Main processing logic.
        
        Args:
            data: Input data dictionary
            
        Returns:
            Processed data dictionary
        """
        # Processing logic here
        return {"status": "success"}
        
    def health_check(self) -> dict:
        """Return agent health status."""
        return {
            "status": "healthy",
            "agent": "MyAgent"
        }
```

### Add Agent Configuration

```yaml
# config/my_agent_config.yaml

my_agent:
  enabled: true
  interval: 60
  
  settings:
    option1: value1
    option2: value2
```

### Register Agent

```python
# orchestrator.py

from src.agents.my_category.my_agent import MyAgent, MyAgentConfig

# Load config
config = MyAgentConfig(**yaml_config['my_agent'])

# Initialize agent
my_agent = MyAgent(config)

# Add to agent pool
agents.append(my_agent)
```

## Component Development

### Create New Component

```tsx
// src/components/MyComponent.tsx

import React from 'react';

interface MyComponentProps {
  title: string;
  data: any[];
  onAction?: (id: string) => void;
}

/**
 * MyComponent description.
 * 
 * @example
 * <MyComponent title="Test" data={items} />
 */
const MyComponent: React.FC<MyComponentProps> = ({
  title,
  data,
  onAction
}) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {data.map(item => (
        <div key={item.id} onClick={() => onAction?.(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
};

export default MyComponent;
```

### Add Component Tests

```tsx
// src/components/__tests__/MyComponent.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  const mockData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' }
  ];
  
  it('renders title and items', () => {
    render(<MyComponent title="Test" data={mockData} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
  
  it('calls onAction when item clicked', () => {
    const handleAction = jest.fn();
    render(<MyComponent title="Test" data={mockData} onAction={handleAction} />);
    
    fireEvent.click(screen.getByText('Item 1'));
    expect(handleAction).toHaveBeenCalledWith('1');
  });
});
```

## Advanced Performance Profiling

### Backend Profiling

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Your code here
agent.process(data)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)
```

### Frontend Profiling

```tsx
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

## Hot Reload

Both backend and frontend support hot reload in development:

- **Backend**: Automatically reloads on file changes
- **Frontend**: Hot Module Replacement (HMR) enabled

## Related Documentation

- [Contributing Guide](./contributing.md)
- [Testing Guide](./testing.md)
- [Deployment Guide](./deployment.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
