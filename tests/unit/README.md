# Unit Tests

Unit tests for individual components and functions.

## Running Unit Tests

```bash
# Run all unit tests
pytest tests/unit/ -v

# Run specific test file
pytest tests/unit/test_image_refresh_agent.py -v

# Run with coverage
pytest tests/unit/ --cov=src --cov-report=term-missing
```

## Test Structure

- `test_image_refresh_agent.py` - Tests for image refresh agent
- Add more test files for each agent/component

## Writing New Tests

Follow the template in existing test files:

```python
import pytest
from src.agents.your_agent import YourAgent

class TestYourAgent:
    @pytest.fixture
    def agent(self):
        return YourAgent()
    
    def test_your_functionality(self, agent):
        result = agent.some_method()
        assert result is not None
```
