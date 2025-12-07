<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/backend/docs/guides/TESTING_AGENTS_GUIDE.md
Module: Testing Agents Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Enhanced Agents Testing Guide.
============================================================================
-->

# Enhanced Agents Testing Guide

## Quick Test

```bash
# From project root
npm run test:agents

# Or from backend directory
cd backend
.\test-agents.ps1
```

## What Gets Tested

### 1. GraphInvestigatorAgent 🔍
- **Multimodal incident investigation**
- Tests visual analysis with Gemini Vision
- Tests external intelligence gathering with Tavily
- Tests LLM synthesis with Gemini Pro
- Verifies API key rotation for all 3 services

### 2. EcoTwinAgent 🌿
- **Environmental health advisor**
- Tests air quality dispersion simulation
- Tests personalized health advice generation with Gemini
- Tests weather forecast integration with OpenWeather
- Verifies API key rotation for Gemini + OpenWeather

### 3. TrafficMaestroAgent 🚦
- **Predictive event orchestrator**
- Tests external event monitoring with Ticketmaster
- Tests action plan generation
- Tests route optimization with Mapbox
- Verifies API key rotation for Ticketmaster + Mapbox

## API Key Requirements

Create `backend/.env` with these keys:

```env
# Support multiple keys (comma-separated)
GEMINI_API_KEY=key1,key2,key3
TAVILY_API_KEY=key1,key2
OPENWEATHER_API_KEY=key1,key2
TICKETMASTER_API_KEY=key1,key2
MAPBOX_API_KEY=key1,key2
```

## Test Output

The test script will:
1. ✅ Check all required API keys
2. ✅ Show key counts (single vs multiple)
3. ✅ Run full test suite for each agent
4. ✅ Verify API rotation functionality
5. ✅ Display comprehensive test results

## Success Criteria

All tests pass when:
- ✅ All API keys are configured
- ✅ Agents complete their tasks successfully
- ✅ API key rotation works (verified through successful calls)
- ✅ No critical errors in logs

## Troubleshooting

### Missing API Keys
```
⚠️ Warning: Some API keys are missing. Tests may fail.
Missing: GEMINI_API_KEY, TAVILY_API_KEY
```

**Solution**: Add missing keys to `backend/.env`

### API Call Failures
```
❌ Gemini attempt 1/3 failed, trying next key...
```

**This is normal** - rotation system is working. If all attempts fail, check:
- Key validity
- API quota limits
- Network connectivity

### TypeScript Errors
```bash
cd backend
npm run build
```

Check for compilation errors.

## Advanced Testing

### Test Individual Agents

Edit `backend/test-enhanced-agents.ts` and comment out agents you don't want to test:

```typescript
// Run tests sequentially
try {
    // results.graphInvestigator = await testGraphInvestigatorAgent();
    results.ecoTwin = await testEcoTwinAgent();
    // results.trafficMaestro = await testTrafficMaestroAgent();
} catch (error) {
    console.error('Test failed:', error);
}
```

### Enable Debug Logging

In each agent constructor, set logger level:

```typescript
logger.level = 'debug';
```

### Test with Invalid Keys

To verify rotation works, set first key to invalid:

```env
GEMINI_API_KEY=invalid_key,real_key1,real_key2
```

You should see:
```
⚠️ Gemini attempt 1/3 failed, trying next key...
✅ Gemini attempt 2/3 succeeded
```

## Performance Metrics

Expected test duration (with all APIs working):
- GraphInvestigatorAgent: ~15-30 seconds
- EcoTwinAgent: ~10-20 seconds
- TrafficMaestroAgent: ~10-20 seconds
- **Total**: ~35-70 seconds

Slower times may indicate:
- API rate limiting
- Network latency
- Key rotation retries

## CI/CD Integration

For automated testing:

```bash
# Exit code 0 = all passed, 1 = failures
npm run test:agents
echo $LASTEXITCODE  # Windows
echo $?              # Linux/Mac
```

Add to GitHub Actions:

```yaml
- name: Test Enhanced Agents
  run: npm run test:agents
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
    OPENWEATHER_API_KEY: ${{ secrets.OPENWEATHER_API_KEY }}
    TICKETMASTER_API_KEY: ${{ secrets.TICKETMASTER_API_KEY }}
    MAPBOX_API_KEY: ${{ secrets.MAPBOX_API_KEY }}
```

## Related Documentation

- **API Key Rotation**: `backend/API_KEY_ROTATION_INTEGRATION_COMPLETE.md`
- **Agent Architecture**: `backend/src/agents/README.md`
- **Full API Docs**: `API.md`
