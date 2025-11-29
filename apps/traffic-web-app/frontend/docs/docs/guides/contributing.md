# Contributing Guide

## Welcome!

Thank you for your interest in contributing to the HCMC Traffic Management System! This guide will help you get started with contributions.

## Code of Conduct

- Be respectful and inclusive
- Follow professional communication standards
- Help maintain a positive community

## Getting Started

### Prerequisites

- Node.js v20.15.0 or higher
- Python 3.9+
- Docker & Docker Compose
- Git

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/hcmc-traffic.git
cd hcmc-traffic

# Install dependencies
npm install
pip install -r requirements/dev.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development services
docker-compose up -d

# Run backend
python orchestrator.py

# Run frontend (in another terminal)
cd apps/traffic-web-app/frontend
npm run dev
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Branch naming conventions:
# feature/    - New features
# fix/        - Bug fixes
# docs/       - Documentation updates
# refactor/   - Code refactoring
# test/       - Test additions/updates
```

### 2. Make Changes

```bash
# Make your changes
# Run tests
pytest tests/
npm test

# Run linters
pylint src/
npm run lint

# Format code
black src/
npm run format
```

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add accident severity prediction"

# Commit message format:
# <type>(<scope>): <subject>
#
# Types:
# feat:     New feature
# fix:      Bug fix
# docs:     Documentation
# style:    Code style (formatting)
# refactor: Code refactoring
# test:     Tests
# chore:    Build/tooling
```

### 4. Push & Create Pull Request

```bash
# Push to remote
git push origin feature/your-feature-name

# Create PR on GitHub with template:
```

**Pull Request Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated

## Screenshots (if applicable)

## Related Issues
Closes #issue_number
```

### 5. Code Review Process

**Reviewer Checklist:**

1. **Code Quality**
   - [ ] Code is clean and readable
   - [ ] Follows project conventions
   - [ ] No unnecessary complexity
   - [ ] Proper error handling

2. **Testing**
   - [ ] Adequate test coverage
   - [ ] Tests are meaningful
   - [ ] Edge cases covered

3. **Documentation**
   - [ ] Code comments where needed
   - [ ] README updated
   - [ ] API docs updated

4. **Performance**
   - [ ] No performance regressions
   - [ ] Efficient algorithms
   - [ ] Proper caching

5. **Security**
   - [ ] No security vulnerabilities
   - [ ] Input validation
   - [ ] Proper authentication/authorization

**Review Timeline:**
- First review: Within 24 hours
- Follow-up reviews: Within 12 hours
- Approval: Requires 2 approvals for main branch

### 6

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, documented code
- Follow coding standards (see below)
- Add tests for new functionality

### 3. Test Your Changes

```bash
# Run tests
npm test
pytest

# Check code quality
npm run lint
black . --check
```

### 4. Commit Changes

```bash
# Use conventional commits
git commit -m "feat: add new traffic pattern detection"
git commit -m "fix: resolve camera connection timeout"
git commit -m "docs: update API documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### Python

```python
# Use Black formatting
black . --line-length 100

# Type hints
def process_traffic_data(
    camera_id: str,
    timestamp: datetime,
    metrics: dict
) -> TrafficAnalysis:
    """Process traffic data from camera.
    
    Args:
        camera_id: Camera identifier
        timestamp: Observation timestamp
        metrics: Traffic metrics dictionary
        
    Returns:
        TrafficAnalysis object with processed data
    """
    pass

# Docstrings for all public functions
# Follow PEP 8
```

### TypeScript/React

```typescript
// Use TypeScript strict mode
// Props interfaces for all components

interface TrafficMapProps {
  center: [number, number];
  zoom: number;
  onCameraClick?: (id: string) => void;
}

const TrafficMap: React.FC<TrafficMapProps> = ({
  center,
  zoom,
  onCameraClick
}) => {
  // Component logic
};

// Use functional components with hooks
// Export components as named exports
```

## Testing Guidelines

### Unit Tests

```python
# Python
def test_accident_detection():
    agent = AccidentDetectionAgent()
    result = agent.detect_accident(test_image)
    assert result.confidence > 0.7
```

```typescript
// TypeScript
describe('TrafficMap', () => {
  it('should render markers correctly', () => {
    render(<TrafficMap cameras={mockCameras} />);
    expect(screen.getAllByRole('marker')).toHaveLength(5);
  });
});
```

### Integration Tests

```python
def test_end_to_end_workflow():
    # Test complete data pipeline
    raw_data = fetch_camera_data("CAM_001")
    entity = transform_to_ngsi_ld(raw_data)
    result = publish_to_stellio(entity)
    assert result.success == True
```

## Documentation

### Code Comments

```python
# Good: Explain WHY, not WHAT
# Calculate speed using calibrated pixel-to-meter ratio
speed = calculate_speed(distance_pixels * calibration_factor, time_delta)

# Bad: Obvious comment
# Set speed to distance divided by time
speed = distance / time
```

### API Documentation

```python
@api.route('/api/cameras/<camera_id>', methods=['GET'])
def get_camera(camera_id: str):
    """Get camera information.
    
    Args:
        camera_id (str): Camera identifier
        
    Returns:
        dict: Camera data including location, status, latest image
        
    Raises:
        CameraNotFoundError: If camera doesn't exist
        
    Example:
        GET /api/cameras/CAM_001
        Response: {
            "id": "CAM_001",
            "name": "District 1 Camera",
            "location": {"lat": 10.7769, "lon": 106.7009}
        }
    """
    pass
```

## Pull Request Guidelines

### PR Title

Use conventional commit format:

- `feat: add weather-traffic correlation analysis`
- `fix: resolve memory leak in CV agent`
- `docs: update deployment guide`
- `refactor: improve entity publisher performance`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Architecture Guidelines

### Agent Design

```python
class MyAgent:
    """Agent description."""
    
    def __init__(self, config: dict):
        """Initialize agent with configuration."""
        self.config = config
        
    def process(self, data: dict) -> Result:
        """Main processing logic."""
        pass
        
    def health_check(self) -> HealthStatus:
        """Return agent health status."""
        pass
```

### Component Design

```tsx
// Single Responsibility
// Props validation
// Error boundaries
// Performance optimization

const MyComponent: React.FC<Props> = ({ data, onAction }) => {
  // Use hooks appropriately
  const [state, setState] = useState(initialState);
  const memoizedValue = useMemo(() => compute(data), [data]);
  
  // Early returns for loading/error states
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return <div>{/* Component JSX */}</div>;
};
```

## Release Process

### Version Numbers

Follow Semantic Versioning (SemVer):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Changelog

Update CHANGELOG.md with:

```markdown
## [1.2.0] - 2024-01-15

### Added
- New weather-traffic correlation agent
- Real-time AQI monitoring

### Fixed
- Camera connection timeout issue
- Memory leak in CV processing

### Changed
- Improved entity publisher performance
```

## Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Pull Requests**: Submit code contributions

## Getting Help

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Email: dev@hcmc-traffic.vn

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to contributor calls

Thank you for contributing! 🎉

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
