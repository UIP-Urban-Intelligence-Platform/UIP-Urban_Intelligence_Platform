<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: guides/QUICKSTART.md
Module: Quick Start Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Quick start guide for Image Refresh Agent.
============================================================================
-->

# Quick Start Guide - Image Refresh Agent

## Prerequisites

Ensure you have Python 3.9+ installed:

```bash
python --version
```

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- aiohttp (async HTTP client)
- PyYAML (YAML configuration)
- pytest (testing framework)
- And all other required packages

### 2. Verify Installation

```bash
# Verify no syntax errors
python -m py_compile agents/data_collection/image_refresh_agent.py

# Should return with no output (success)
```

## Running the Agent

### Single Refresh Cycle

Refresh all cameras once:

```bash
python agents/data_collection/image_refresh_agent.py --domain cameras --mode once
```

**Expected Output:**
```
2025-11-01 12:00:00 - ImageRefreshAgent.cameras - INFO - Starting refresh cycle for domain: cameras
2025-11-01 12:00:00 - ImageRefreshAgent.cameras - INFO - Loaded 880 items from data/cameras_raw.json
2025-11-01 12:00:00 - ImageRefreshAgent.cameras - INFO - Processing batch 1/18 (50 items)...
2025-11-01 12:00:02 - ImageRefreshAgent.cameras - INFO - Batch 1 complete: 48/50 successful
...
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Saved 850 items to data/cameras_updated.json
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - ============================================================
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - PROCESSING STATISTICS
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - ============================================================
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Domain: cameras
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Total items processed: 880
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Successful updates: 850
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Failed updates: 30
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Processing time: 15.23 seconds
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - Success rate: 96.59%
2025-11-01 12:00:15 - ImageRefreshAgent.cameras - INFO - ============================================================
```

### Continuous Refresh

Run continuous refresh every 30 seconds (configurable):

```bash
python agents/data_collection/image_refresh_agent.py --domain cameras --mode continuous
```

Press `Ctrl+C` to stop gracefully.

### Custom Configuration

Use a different configuration file:

```bash
python agents/data_collection/image_refresh_agent.py \
    --config config/custom.yaml \
    --domain my_domain \
    --mode once
```

## Viewing Results

Check the updated camera data:

```bash
# View first few entries
cat data/cameras_updated.json | head -n 50

# Count total entries
python -c "import json; print(len(json.load(open('data/cameras_updated.json'))))"
```

## Running Tests

### Install Test Dependencies

Already included in `requirements.txt`:
- pytest
- pytest-asyncio
- pytest-cov
- pytest-mock

### Run All Tests

```bash
pytest tests/data_collection/test_image_refresh_agent.py -v
```

### Run with Coverage Report

```bash
pytest tests/data_collection/test_image_refresh_agent.py -v \
    --cov=agents/data_collection/image_refresh_agent \
    --cov-report=term-missing
```

**Expected Output:**
```
tests/data_collection/test_image_refresh_agent.py::TestConfigLoading::test_load_valid_config PASSED
tests/data_collection/test_image_refresh_agent.py::TestConfigLoading::test_config_file_not_found PASSED
tests/data_collection/test_image_refresh_agent.py::TestConfigLoading::test_invalid_yaml PASSED
...
---------- coverage: platform win32, python 3.9.x -----------
Name                                              Stmts   Miss  Cover   Missing
-------------------------------------------------------------------------------
agents/data_collection/image_refresh_agent.py      456      0   100%
-------------------------------------------------------------------------------
TOTAL                                              456      0   100%

============================== 55 passed in 2.34s ===============================
```

### Run Specific Test Class

```bash
pytest tests/data_collection/test_image_refresh_agent.py::TestURLParsing -v
```

### Run Specific Test

```bash
pytest tests/data_collection/test_image_refresh_agent.py::TestURLParsing::test_parse_valid_url -v
```

## Adding a New Domain (No Code Changes!)

### Step 1: Add Configuration

Edit `config/data_sources.yaml`:

```yaml
# Add this new section
medical_devices:
  source_file: "data/devices_raw.json"
  output_file: "data/devices_updated.json"
  refresh_interval: 60
  batch_size: 100
  request_timeout: 15
  max_retries: 3
  retry_backoff_base: 2
  url_template: "https://health.example.com/api/devices"
  params:
    - device_id
    - location
    - timestamp
```

### Step 2: Create Source Data

Create `data/devices_raw.json`:

```json
[
  {
    "device_id": "MRI-001",
    "name": "MRI Scanner - Room 101",
    "endpoint": "https://health.example.com/api/devices?device_id=MRI-001&location=ER&timestamp=0"
  },
  {
    "device_id": "CT-002",
    "name": "CT Scanner - Room 202",
    "endpoint": "https://health.example.com/api/devices?device_id=CT-002&location=ICU&timestamp=0"
  }
]
```

### Step 3: Run Agent

```bash
python agents/data_collection/image_refresh_agent.py --domain medical_devices --mode once
```

**That's it! No code changes required.**

## Troubleshooting

### Error: Module not found

```bash
# Make sure you're in the project root directory
cd d:\olp\UIP-Urban_Intelligence_Platform

# Reinstall dependencies
pip install -r requirements.txt
```

### Error: Configuration file not found

```bash
# Verify you're in the correct directory
pwd  # Should show: d:\olp\UIP-Urban_Intelligence_Platform

# Check config file exists
ls config/data_sources.yaml
```

### Error: Source data file not found

```bash
# Check if data file exists
ls data/cameras_raw.json

# If missing, the file should already exist in the project
# If it's truly missing, contact support
```

### Agent runs but no updates

Check the logs for errors:
- Network connectivity issues
- Invalid URLs in source data
- API endpoint changes

## Performance Tips

### Optimize Batch Size

For faster processing, increase batch size in config:

```yaml
cameras:
  batch_size: 100  # Increase from default 50
```

### Adjust Timeout

For slow networks, increase timeout:

```yaml
cameras:
  request_timeout: 20  # Increase from default 10
```

### Reduce Retries

For faster failure detection:

```yaml
cameras:
  max_retries: 2  # Decrease from default 3
```

## Next Steps

1. ✅ Run the agent once to verify it works
2. ✅ Run tests to verify 100% coverage
3. ✅ Try adding a new domain (healthcare or commerce example)
4. ✅ Set up continuous refresh for production use
5. ✅ Monitor logs for any errors or performance issues

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for details
2. Review `README.md` for comprehensive documentation
3. Open an issue on GitHub

---

**Ready to go!** The Image Refresh Agent is fully implemented and tested with 100% code coverage.
