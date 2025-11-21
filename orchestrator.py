"""
Multi-Agent Workflow Orchestrator

Domain-agnostic orchestrator for Linked Open Data (LOD) pipeline workflows.
Config-driven execution of agent phases with comprehensive error handling and monitoring.

This orchestrator manages the execution of multiple agents across different workflow phases:
- Sequential and parallel phase execution with dependency management
- Retry logic with exponential backoff for transient failures
- Health checks for external services (Neo4j, Fuseki, Stellio, Redis)
- Comprehensive error handling, logging, and progress tracking
- Support for dry-run simulation mode

Module: orchestrator
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.3.0
License: MIT

Usage:
    python orchestrator.py --config config/workflow.yaml --phase all

Arguments:
    --config: Path to workflow configuration YAML file
    --phase: Phase to execute (data_collection, transformation, validation, publishing, all)
    --dry-run: Simulate execution without running actual agents
    --log-level: Set logging level (DEBUG, INFO, WARNING, ERROR)

Environment Variables:
    NEO4J_URI: Neo4j database connection URI (default: bolt://localhost:7687)
    FUSEKI_ENDPOINT: Apache Jena Fuseki SPARQL endpoint
    STELLIO_API_URL: Stellio Context Broker API endpoint
    REDIS_HOST: Redis cache host address

Configuration:
    Requires workflow.yaml with structure:
    - phases: List of workflow phases with execution order
    - agents: Agent configurations and parameters per phase
    - dependencies: Service health check configurations
    - retry_config: Retry policy settings

Examples:
    # Execute all phases sequentially
    python orchestrator.py --config config/workflow.yaml --phase all
    
    # Run specific phase only
    python orchestrator.py --phase transformation
    
    # Dry run to validate configuration
    python orchestrator.py --dry-run --log-level DEBUG
    
    # Custom workflow configuration
    python orchestrator.py --config config/custom_workflow.yaml

Architecture:
    The orchestrator follows a plugin-based architecture where agents are
    dynamically loaded based on workflow configuration. Each phase can contain
    multiple agents that run sequentially or in parallel.

References:
    - Architecture Documentation: docs/architecture/orchestrator.md
    - Workflow Configuration Guide: docs/configuration/workflow.md
    - Agent Development Guide: docs/CONTRIBUTING.md
"""

import os
import sys
import time
import json
import yaml
import logging
import importlib
import requests
import asyncio
import inspect
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict, field
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from enum import Enum
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add project root to Python path
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Import data seeder
from src.core.data_seeder import seed_data_if_enabled


# Configure logging
log_level = os.getenv('LOG_LEVEL', 'INFO')
log_format = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logging.basicConfig(
    level=getattr(logging, log_level),
    format=log_format
)
logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    """Agent execution status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    RETRYING = "retrying"


class PhaseStatus(Enum):
    """Phase execution status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"


@dataclass
class AgentResult:
    """Result of agent execution"""
    name: str
    status: AgentStatus
    duration_seconds: float
    error_message: Optional[str] = None
    retry_count: int = 0
    output_files: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'status': self.status.value,
            'duration_seconds': round(self.duration_seconds, 2),
            'error_message': self.error_message,
            'retry_count': self.retry_count,
            'output_files': self.output_files
        }


@dataclass
class PhaseResult:
    """Result of phase execution"""
    name: str
    status: PhaseStatus
    duration_seconds: float
    agents: List[AgentResult]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'status': self.status.value,
            'duration_seconds': round(self.duration_seconds, 2),
            'agents': [agent.to_dict() for agent in self.agents]
        }


@dataclass
class WorkflowReport:
    """Complete workflow execution report"""
    execution_time: str
    total_duration_seconds: float
    status: str
    phases: List[PhaseResult]
    endpoints: Dict[str, str]
    statistics: Dict[str, Any]
    errors: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'execution_time': self.execution_time,
            'total_duration_seconds': round(self.total_duration_seconds, 2),
            'status': self.status,
            'phases': [phase.to_dict() for phase in self.phases],
            'endpoints': self.endpoints,
            'statistics': self.statistics,
            'errors': self.errors
        }


class WorkflowConfig:
    """Load and manage workflow configuration"""
    
    def __init__(self, config_path: str = "config/workflow.yaml"):
        """
        Initialize workflow configuration
        
        Args:
            config_path: Path to workflow configuration file
        """
        self.config_path = config_path
        self.config = None
        self.workflow_config = None
        # Auto-load configuration
        self.load()
    
    def load(self) -> Dict:
        """
        Load workflow configuration from YAML
        
        Returns:
            Configuration dictionary
        """
        try:
            if not os.path.exists(self.config_path):
                raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            
            self.workflow_config = self.config.get('workflow', {})
            
            logger.info(f"Loaded workflow configuration: {self.workflow_config.get('name')}")
            return self.config
            
        except Exception as e:
            logger.error(f"Failed to load workflow configuration: {e}")
            raise
    
    def get_phases(self) -> List[Dict]:
        """Get workflow phases"""
        return self.workflow_config.get('phases', [])
    
    def get_retry_policy(self) -> Dict:
        """Get retry policy configuration"""
        return self.config.get('retry_policy', {})
    
    def get_health_checks(self) -> Dict:
        """Get health check configuration"""
        return self.config.get('health_checks', {})
    
    def get_execution_settings(self) -> Dict:
        """Get execution settings"""
        return self.config.get('execution', {})
    
    def get_reporting_config(self) -> Dict:
        """Get reporting configuration"""
        return self.config.get('reporting', {})


class RetryPolicy:
    """Manage agent retry logic"""
    
    def __init__(self, config: Dict):
        """
        Initialize retry policy
        
        Args:
            config: Retry policy configuration
        """
        self.max_attempts = config.get('max_attempts', 3)
        self.strategy = config.get('strategy', 'exponential')
        self.base_delay = config.get('base_delay', 2)
        self.max_delay = config.get('max_delay', 60)
        self.retryable_errors = config.get('retryable_errors', [])
    
    def should_retry(self, error: Exception, attempt: int) -> bool:
        """
        Determine if agent should be retried
        
        Args:
            error: Exception that occurred
            attempt: Current attempt number
            
        Returns:
            True if should retry, False otherwise
        """
        if attempt >= self.max_attempts:
            return False
        
        # If no retryable errors specified, don't retry any errors
        if not self.retryable_errors:
            return False
        
        error_type = type(error).__name__
        
        # Retry only if error matches retryable errors
        return error_type in self.retryable_errors
    
    def get_delay(self, attempt: int) -> float:
        """
        Calculate retry delay
        
        Args:
            attempt: Current attempt number
            
        Returns:
            Delay in seconds
        """
        if self.strategy == 'fixed':
            delay = self.base_delay
        elif self.strategy == 'linear':
            delay = self.base_delay * attempt
        elif self.strategy == 'exponential':
            delay = self.base_delay * (2 ** (attempt - 1))
        else:
            delay = self.base_delay
        
        return min(delay, self.max_delay)


class HealthChecker:
    """Check health of external services"""
    
    def __init__(self, config: Dict):
        """
        Initialize health checker
        
        Args:
            config: Health check configuration
        """
        self.enabled = config.get('enabled', True)
        self.timeout = config.get('timeout', 10)
        self.endpoints = config.get('endpoints', [])
    
    def check_all(self) -> Dict[str, bool]:
        """
        Check health of all endpoints
        
        Returns:
            Dictionary mapping endpoint names to health status
        
        Raises:
            RuntimeError: If a required health check fails
        """
        if not self.enabled:
            return {}
        
        results = {}
        failed_required = []
        
        for endpoint_config in self.endpoints:
            name = endpoint_config.get('name', 'Unknown')
            url = endpoint_config.get('url')
            required = endpoint_config.get('required', False)
            method = endpoint_config.get('method', 'GET')
            
            try:
                logger.info(f"Checking health: {name} ({url})")
                
                response = requests.request(
                    method,
                    url,
                    timeout=self.timeout
                )
                
                if response.status_code in [200, 204]:
                    logger.info(f"  ✓ {name} is healthy")
                    results[name] = True
                else:
                    error_msg = f"{name} returned status {response.status_code}"
                    logger.warning(f"  ✗ {error_msg}")
                    results[name] = False
                    if required:
                        failed_required.append(error_msg)
                    
            except Exception as e:
                error_msg = f"{name} health check failed: {str(e)}"
                logger.warning(f"  ✗ {error_msg}")
                results[name] = False
                if required:
                    failed_required.append(error_msg)
        
        # Raise exception if any required checks failed
        if failed_required:
            raise RuntimeError(f"Required health check failed: {', '.join(failed_required)}")
        
        return results


class AgentExecutor:
    """Execute individual agents"""
    
    def __init__(self, retry_policy: RetryPolicy):
        """
        Initialize agent executor
        
        Args:
            retry_policy: Retry policy for failed agents
        """
        self.retry_policy = retry_policy
    
    def execute(self, agent_config: Dict) -> AgentResult:
        """
        Execute a single agent
        
        Args:
            agent_config: Agent configuration
            
        Returns:
            AgentResult with execution details
        """
        name = agent_config.get('name')
        module_path = agent_config.get('module')
        enabled = agent_config.get('enabled', True)
        timeout = agent_config.get('timeout', 60)
        
        if not enabled:
            logger.info(f"Agent {name} is disabled, skipping")
            return AgentResult(
                name=name,
                status=AgentStatus.SKIPPED,
                duration_seconds=0.0
            )
        
        attempt = 0
        last_error = None
        
        while attempt < self.retry_policy.max_attempts:
            attempt += 1
            
            try:
                logger.info(f"Executing agent: {name} (attempt {attempt})")
                start_time = time.time()
                
                # Try to load and execute the agent module
                try:
                    module = importlib.import_module(module_path)
                    if hasattr(module, 'main'):
                        main_func = module.main
                        # Check if main is async
                        if inspect.iscoroutinefunction(main_func):
                            result = asyncio.run(main_func(agent_config.get('config', {})))
                        else:
                            result = main_func(agent_config.get('config', {}))
                    else:
                        raise AttributeError(f"Module {module_path} has no main() function")
                except ImportError as ie:
                    raise ImportError(f"Module not found: {module_path}") from ie
                
                duration = time.time() - start_time
                
                logger.info(f"  ✓ Agent {name} completed in {duration:.2f}s")
                
                # Extract output files from result if available
                output_files = []
                if isinstance(result, dict):
                    output_files = [result.get('output', result.get('output_file', ''))]
                    output_files = [f for f in output_files if f]
                
                return AgentResult(
                    name=name,
                    status=AgentStatus.SUCCESS,
                    duration_seconds=duration,
                    retry_count=attempt - 1,
                    output_files=output_files
                )
                
            except Exception as e:
                last_error = e
                duration = time.time() - start_time
                
                logger.error(f"  ✗ Agent {name} failed: {str(e)}")
                
                if self.retry_policy.should_retry(e, attempt):
                    delay = self.retry_policy.get_delay(attempt)
                    logger.info(f"  Retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    break
        
        # All retries exhausted
        return AgentResult(
            name=name,
            status=AgentStatus.FAILED,
            duration_seconds=duration,
            error_message=str(last_error),
            retry_count=attempt - 1
        )


class PhaseManager:
    """Manage workflow phase execution"""
    
    def __init__(self, retry_policy: RetryPolicy, execution_settings: Dict):
        """
        Initialize phase manager
        
        Args:
            retry_policy: Retry policy for agents
            execution_settings: Execution configuration
        """
        self.agent_executor = AgentExecutor(retry_policy)
        self.max_workers = execution_settings.get('max_workers', 4)
        self.continue_on_optional_failure = execution_settings.get('continue_on_optional_failure', True)
        self.stop_on_required_failure = execution_settings.get('stop_on_required_failure', True)
    
    def execute_phase(self, phase_config: Dict) -> PhaseResult:
        """
        Execute a workflow phase
        
        Args:
            phase_config: Phase configuration
            
        Returns:
            PhaseResult with execution details
        """
        name = phase_config.get('name')
        parallel = phase_config.get('parallel', False)
        agents = phase_config.get('agents', [])
        
        logger.info(f"=" * 80)
        logger.info(f"PHASE: {name}")
        logger.info(f"=" * 80)
        logger.info(f"Agents: {len(agents)}, Parallel: {parallel}")
        
        start_time = time.time()
        agent_results = []
        
        if parallel and len(agents) > 1:
            # Execute agents in parallel
            agent_results = self._execute_parallel(agents)
        else:
            # Execute agents sequentially
            agent_results = self._execute_sequential(agents)
        
        duration = time.time() - start_time
        
        # Determine phase status
        failed_count = sum(1 for r in agent_results if r.status == AgentStatus.FAILED)
        success_count = sum(1 for r in agent_results if r.status == AgentStatus.SUCCESS)
        
        if failed_count == 0:
            status = PhaseStatus.SUCCESS
        elif success_count > 0:
            status = PhaseStatus.PARTIAL
        else:
            status = PhaseStatus.FAILED
        
        logger.info(f"Phase {name} completed: {status.value} ({duration:.2f}s)")
        
        return PhaseResult(
            name=name,
            status=status,
            duration_seconds=duration,
            agents=agent_results
        )
    
    def _execute_sequential(self, agents: List[Dict]) -> List[AgentResult]:
        """Execute agents sequentially"""
        results = []
        for agent_config in agents:
            result = self.agent_executor.execute(agent_config)
            results.append(result)
            
            # Stop if required agent failed
            if result.status == AgentStatus.FAILED and agent_config.get('required', False):
                logger.error(f"Required agent {result.name} failed, stopping phase")
                break
        
        return results
    
    def _execute_parallel(self, agents: List[Dict]) -> List[AgentResult]:
        """Execute agents in parallel"""
        results = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self.agent_executor.execute, agent): agent
                for agent in agents
            }
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    agent = futures[future]
                    logger.error(f"Parallel execution failed for {agent.get('name')}: {e}")
                    results.append(AgentResult(
                        name=agent.get('name'),
                        status=AgentStatus.FAILED,
                        duration_seconds=0.0,
                        error_message=str(e)
                    ))
        
        return results


class WorkflowOrchestrator:
    """Main workflow orchestrator"""
    
    def __init__(self, config_path: str = "config/workflow.yaml"):
        """
        Initialize workflow orchestrator
        
        Args:
            config_path: Path to workflow configuration
        """
        # Load configuration
        self.config_loader = WorkflowConfig(config_path)
        self.config = self.config_loader.load()
        
        # Initialize components
        retry_config = self.config_loader.get_retry_policy()
        self.retry_policy = RetryPolicy(retry_config)
        
        exec_settings = self.config_loader.get_execution_settings()
        self.phase_manager = PhaseManager(
            self.retry_policy,
            exec_settings
        )
        
        health_config = self.config_loader.get_health_checks()
        self.health_checker = HealthChecker(health_config)
        
        # Execution settings
        self.stop_on_required_failure = exec_settings.get('stop_on_required_failure', True)
        self.workflow_timeout = exec_settings.get('timeout', 300)
        
        logger.info("Workflow Orchestrator initialized successfully")
    
    def run(self) -> WorkflowReport:
        """
        Execute complete workflow
        
        Returns:
            WorkflowReport with execution details
        """
        logger.info("=" * 80)
        logger.info("STARTING WORKFLOW EXECUTION")
        logger.info("=" * 80)
        
        start_time = time.time()
        phase_results = []
        workflow_status = "success"
        errors = []
        
        try:
            # Pre-flight health checks
            logger.info("Running pre-flight health checks...")
            endpoint_results = self.health_checker.check_all()
            # check_all now returns dict or raises exception if required check fails
            
            # Execute phases
            phases = self.config_loader.get_phases()
            seed_config = self.config.get('seed_data', {})
            
            for phase_index, phase_config in enumerate(phases):
                phase_result = self.phase_manager.execute_phase(phase_config)
                phase_results.append(phase_result)
                
                # Seed data after Phase 5 (Analytics) completes
                # This ensures accidents.json and patterns.json are seeded before validation
                if seed_config.get('enabled', False) and phase_config.get('name') == "Analytics":
                    logger.info("Seeding mock data after Analytics phase...")
                    seed_data_if_enabled(seed_config)
                
                # Check if we should stop
                if phase_result.status == PhaseStatus.FAILED and self.stop_on_required_failure:
                    workflow_status = "failed"
                    errors.append(f"Phase '{phase_result.name}' failed")
                    break
            
            # Determine overall status
            failed_phases = sum(1 for p in phase_results if p.status == PhaseStatus.FAILED)
            partial_phases = sum(1 for p in phase_results if p.status == PhaseStatus.PARTIAL)
            
            if failed_phases > 0:
                workflow_status = "partial" if len(phase_results) > failed_phases else "failed"
            elif partial_phases > 0:
                workflow_status = "partial"
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}", exc_info=True)
            workflow_status = "failed"
            errors.append(str(e))
        
        duration = time.time() - start_time
        
        # Create report
        report = WorkflowReport(
            execution_time=datetime.utcnow().isoformat() + 'Z',
            total_duration_seconds=duration,
            status=workflow_status,
            phases=phase_results,
            endpoints=self._collect_endpoints(),
            statistics=self._collect_statistics(phase_results),
            errors=errors
        )
        
        # Save report
        self._save_report(report)
        
        logger.info("=" * 80)
        logger.info(f"WORKFLOW COMPLETED: {workflow_status.upper()}")
        logger.info(f"Duration: {duration:.2f}s")
        logger.info("=" * 80)
        
        return report
    
    def _collect_endpoints(self) -> Dict[str, str]:
        """Collect endpoint URLs"""
        health_config = self.config_loader.get_health_checks()
        endpoints = {}
        
        for endpoint in health_config.get('endpoints', []):
            name = endpoint.get('name', '').lower().replace(' ', '_')
            url = endpoint.get('url', '')
            endpoints[name] = url
        
        return endpoints
    
    def _collect_statistics(self, phase_results: List[PhaseResult]) -> Dict[str, Any]:
        """Collect execution statistics"""
        total_agents = sum(len(p.agents) for p in phase_results)
        successful_agents = sum(
            1 for p in phase_results 
            for a in p.agents 
            if a.status == AgentStatus.SUCCESS
        )
        failed_agents = sum(
            1 for p in phase_results 
            for a in p.agents 
            if a.status == AgentStatus.FAILED
        )
        
        return {
            'total_phases': len(phase_results),
            'successful_phases': sum(1 for p in phase_results if p.status == PhaseStatus.SUCCESS),
            'failed_phases': sum(1 for p in phase_results if p.status == PhaseStatus.FAILED),
            'total_agents': total_agents,
            'successful_agents': successful_agents,
            'failed_agents': failed_agents,
            'skipped_agents': total_agents - successful_agents - failed_agents
        }
    
    def _save_report(self, report: WorkflowReport) -> str:
        """
        Save workflow report to file
        
        Args:
            report: Workflow report
            
        Returns:
            Path to saved report
        """
        reporting_config = self.config_loader.get_reporting_config()
        output_dir = reporting_config.get('output_directory', 'data/reports')
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"workflow_report_{timestamp}.json"
        output_path = os.path.join(output_dir, filename)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report.to_dict(), f, indent=2)
        
        logger.info(f"Workflow report saved to: {output_path}")
        return output_path


def main():
    """Main entry point"""
    # Fix for Windows asyncio event loop issue (Python 3.8-3.10)
    # Prevents "RuntimeError: Event loop is closed" warning
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        orchestrator = WorkflowOrchestrator()
        report = orchestrator.run()
        
        # Print summary
        print("\n" + "=" * 80)
        print("WORKFLOW EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Status:         {report.status}")
        print(f"Duration:       {report.total_duration_seconds:.2f}s")
        print(f"Phases:         {len(report.phases)}")
        print(f"Total Agents:   {report.statistics['total_agents']}")
        print(f"Successful:     {report.statistics['successful_agents']}")
        print(f"Failed:         {report.statistics['failed_agents']}")
        if report.errors:
            print(f"\nErrors ({len(report.errors)}):")
            for error in report.errors:
                print(f"  - {error}")
        print("=" * 80)
        
        sys.exit(0 if report.status == "success" else 1)
        
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
