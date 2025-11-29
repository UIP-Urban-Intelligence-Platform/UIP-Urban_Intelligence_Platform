# Orchestrator API Reference - PRODUCTION READY

## Overview

The orchestrator manages parallel/sequential execution of agents across workflow phases with dependency management.

## Usage

```python
from orchestrator import Orchestrator
import asyncio

orchestrator = Orchestrator(config_path="config/workflow.yaml")
results = await orchestrator.run()
```

## Key Methods

### `async run() -> dict`
Execute complete workflow with all phases.

**Returns:**
```python
{"status": "success", "phases_executed": 5, "total_duration": 45.23, "results": [...]}
```

### `async run_phase(phase_name: str) -> dict`
Execute single phase by name.

### `async shutdown()`
Gracefully stop all running agents (30s timeout).

### `get_dependency_graph() -> dict`
Retrieve workflow dependency graph.

## Configuration

```yaml
# config/workflow.yaml
phases:
  - name: data_collection
    description: "Collect traffic data"
    parallel: true  # Run agents in parallel
    agents:
      - module: src.agents.data_collection.image_refresh_agent
        class: ImageRefreshAgent
        config_key: image_refresh
  
  - name: analytics
    parallel: false  # Sequential execution
    depends_on:
      - data_collection
    agents:
      - module: src.agents.analytics.accident_detection_agent
        class: AccidentDetectionAgent
```

## Execution Flow

**Sequential Phases:**
```
Phase 1 (data_collection) → Phase 2 (analytics) → Phase 3 (transformation)
```

**Parallel Agents:**
```python
async def run_parallel_phase(agents):
    tasks = [agent.run() for agent in agents]
    return await asyncio.gather(*tasks)
```

## Error Handling

### Retry Strategy
```python
orchestr ator = Orchestrator(
    config_path="config/workflow.yaml",
    retry_config={"max_retries": 3, "retry_delay": 5}
)
```

### Graceful Shutdown
```python
import signal

def signal_handler(signum, frame):
    asyncio.create_task(orchestrator.shutdown())

signal.signal(signal.SIGINT, signal_handler)
```

## Best Practices

1. **Dependency Management**: Declare phase dependencies in workflow.yaml
2. **Resource Limits**: Set max_workers for parallel phases
3. **Monitoring**: Enable metrics with `orchestrator.enable_monitoring(metrics_port=9090)`
4. **Validation**: Call `orchestrator.validate_config()` before running
