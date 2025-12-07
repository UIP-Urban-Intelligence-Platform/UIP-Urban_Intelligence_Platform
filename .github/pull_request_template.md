<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: .github/PULL_REQUEST_TEMPLATE.md
Module: Pull Request Template
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-15
Version: 1.0.0
License: MIT

Description:
  Standard template for pull requests in the UIP project.
============================================================================
-->

# Pull Request

## Description
<!-- Provide a brief description of the changes -->

## Type of Change
<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration change
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update

## Related Issues
<!-- Link to related issues -->
Fixes #(issue number)
Closes #(issue number)
Related to #(issue number)

## Changes Made
<!-- Describe the changes in detail -->

- 
- 
- 

## Testing
<!-- Describe the tests you ran to verify your changes -->

### Test Configuration
- **Python version**: 
- **OS**: 
- **Docker version** (if applicable): 

### Test Results
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] All workflows pass
- [ ] Manual testing completed

### Test Evidence
<!-- Add screenshots, logs, or test output if applicable -->

```
# Paste test output here
```

## Component Impact
<!-- Mark all components affected by this PR -->

- [ ] Image Refresh Agent
- [ ] Stellio Connector
- [ ] Fuseki Publisher
- [ ] Neo4j Sync
- [ ] YOLO Detector
- [ ] Data Validator
- [ ] Workflow Orchestrator
- [ ] Configuration
- [ ] Documentation
- [ ] CI/CD Pipeline

## Performance Impact
<!-- If applicable, describe any performance implications -->

- **Before**: 
- **After**: 
- **Benchmark results**: 

## Breaking Changes
<!-- If this is a breaking change, describe what breaks and migration steps -->

### What breaks:


### Migration guide:


## Checklist
<!-- Mark completed items with an 'x' -->

### Code Quality
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

### Documentation
- [ ] README.md updated (if needed)
- [ ] CHANGELOG.md updated
- [ ] API documentation updated (if needed)
- [ ] Configuration examples updated (if needed)
- [ ] Inline code comments added/updated

### Security & Dependencies
- [ ] No sensitive data (passwords, keys, tokens) in code
- [ ] Dependencies are up-to-date and secure
- [ ] No new security vulnerabilities introduced
- [ ] Environment variables documented in .env.example

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Test coverage maintained or improved
- [ ] All tests pass in CI/CD pipeline

## Screenshots
<!-- If applicable, add screenshots to help explain your changes -->

## Additional Notes
<!-- Add any additional notes for reviewers -->

## Reviewer Checklist
<!-- For reviewers -->

- [ ] Code review completed
- [ ] Tests reviewed and adequate
- [ ] Documentation reviewed
- [ ] Security considerations reviewed
- [ ] Performance impact assessed
- [ ] Breaking changes identified and documented
