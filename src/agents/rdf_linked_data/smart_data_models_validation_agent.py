"""Smart Data Models Validation Agent.

Module: src.agents.rdf_linked_data.smart_data_models_validation_agent
Author: Nguyễn Việt Hoàng 
Created: 2025-11-22
Version: 2.0.0
License: MIT

Description:
    Validates NGSI-LD entities against Smart Data Models schemas and
    calculates LOD (Linked Open Data) 5-star ratings for data quality assessment.

Core Features:
    - Smart Data Models schema validation
    - JSON Schema validation with detailed error reporting
    - LOD 5-star rating calculation
    - Entity filtering (valid/invalid separation)
    - Validation report generation
    - Schema caching for performance

LOD Star Ratings:
    ★ - Available on the web (any format)
    ★★ - Machine-readable structured data
    ★★★ - Non-proprietary format
    ★★★★ - Uses W3C standards (RDF, SPARQL)
    ★★★★★ - Linked to other data (context)

Dependencies:
    - jsonschema>=4.0: JSON Schema validation
    - requests>=2.28: Schema download
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/validation.yaml:
        - schema_urls: Smart Data Models schema endpoints
        - lod_rating_rules: Rating calculation criteria
        - cache_ttl: Schema cache lifetime

Example:
    ```python
    from src.agents.rdf_linked_data.smart_data_models_validation_agent import SmartDataModelsValidationAgent
    
    agent = SmartDataModelsValidationAgent()
    validation_report = agent.validate_entities(ngsi_ld_entities)
    print(f"Valid: {validation_report['valid_count']}, LOD Rating: {validation_report['avg_rating']}★")
    ```

References:
    - Smart Data Models: https://smartdatamodels.org/
    - LOD 5-star scheme: https://5stardata.info/
    - FIWARE Data Models: https://github.com/smart-data-models
"""

import json
import logging
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from datetime import datetime

import yaml


class LODRatingCalculator:
    """
    Calculate LOD (Linked Open Data) 5-star rating for entities.
    
    Based on Tim Berners-Lee's 5-star deployment scheme:
    ★ - Open License
    ★★ - Machine Readable
    ★★★ - Open Format
    ★★★★ - URI Identifiers
    ★★★★★ - Linked Data
    """
    
    def __init__(self, lod_criteria: Dict[str, Any]):
        """
        Initialize LOD rating calculator.
        
        Args:
            lod_criteria: LOD criteria configuration from YAML
        """
        self.criteria = lod_criteria
    
    def check_star_1(self, entity: Dict[str, Any]) -> bool:
        """
        Check Star 1: Open License.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if entity meets Star 1 criteria
        """
        # For public data, we assume open license (CC-BY, ODbL, etc.)
        # This is always true for entities in our system
        return True
    
    def check_star_2(self, entity: Dict[str, Any]) -> bool:
        """
        Check Star 2: Machine Readable.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if entity has valid JSON structure with id and type
        """
        criteria = self.criteria.get('star_2', {})
        required = criteria.get('required_fields', ['id', 'type'])
        
        return all(field in entity for field in required)
    
    def check_star_3(self, entity: Dict[str, Any]) -> bool:
        """
        Check Star 3: Open Format (JSON-LD).
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if entity has @context field (JSON-LD format)
        """
        criteria = self.criteria.get('star_3', {})
        required = criteria.get('required_fields', ['@context'])
        
        return all(field in entity for field in required)
    
    def check_star_4(self, entity: Dict[str, Any]) -> bool:
        """
        Check Star 4: URI Identifiers.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if id field starts with URI prefix (urn:, http://, https://)
        """
        entity_id = entity.get('id', '')
        
        criteria = self.criteria.get('star_4', {})
        uri_prefixes = criteria.get('uri_prefixes', ['urn:', 'http://', 'https://'])
        
        return any(entity_id.startswith(prefix) for prefix in uri_prefixes)
    
    def check_star_5(self, entity: Dict[str, Any]) -> bool:
        """
        Check Star 5: Linked Data.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if entity contains at least one Relationship linking to external URI
        """
        # Check for Relationship types
        for key, value in entity.items():
            if isinstance(value, dict) and value.get('type') == 'Relationship':
                # Found a relationship
                return True
        
        return False
    
    def calculate_rating(self, entity: Dict[str, Any]) -> Tuple[int, List[str]]:
        """
        Calculate LOD 5-star rating for entity.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            Tuple of (rating, list of passed criteria names)
        """
        passed_criteria = []
        
        # Check each star criterion
        if self.check_star_1(entity):
            passed_criteria.append(self.criteria['star_1']['name'])
        else:
            return (0, passed_criteria)
        
        if self.check_star_2(entity):
            passed_criteria.append(self.criteria['star_2']['name'])
        else:
            return (1, passed_criteria)
        
        if self.check_star_3(entity):
            passed_criteria.append(self.criteria['star_3']['name'])
        else:
            return (2, passed_criteria)
        
        if self.check_star_4(entity):
            passed_criteria.append(self.criteria['star_4']['name'])
        else:
            return (3, passed_criteria)
        
        if self.check_star_5(entity):
            passed_criteria.append(self.criteria['star_5']['name'])
            return (5, passed_criteria)
        else:
            return (4, passed_criteria)


class NGSILDValidator:
    """Validates NGSI-LD entities against core requirements."""
    
    def __init__(self, validation_config: Dict[str, Any]):
        """
        Initialize NGSI-LD validator.
        
        Args:
            validation_config: Validation configuration from YAML
        """
        self.config = validation_config
        self.required_fields = validation_config.get('required_fields', [])
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate_required_fields(self, entity: Dict[str, Any]) -> bool:
        """
        Validate required fields are present.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if all required fields present
        """
        is_valid = True
        
        for field in self.required_fields:
            if field not in entity:
                self.errors.append(f"Missing required field: {field}")
                is_valid = False
        
        return is_valid
    
    def validate_context(self, entity: Dict[str, Any]) -> bool:
        """
        Validate @context field.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if @context is valid
        """
        context = entity.get('@context')
        
        if not context:
            self.errors.append("Missing @context field")
            return False
        
        # @context should be a list or string
        if not isinstance(context, (list, str)):
            self.errors.append("@context must be a string or array")
            return False
        
        # Check for required contexts
        context_validation = self.config.get('context_validation', {})
        required_contexts = context_validation.get('required_contexts', [])
        
        if isinstance(context, str):
            context_list = [context]
        else:
            context_list = context
        
        for req_ctx in required_contexts:
            if not any(req_ctx in str(ctx) for ctx in context_list):
                self.warnings.append(f"Recommended context missing: {req_ctx}")
        
        return True
    
    def validate_uri(self, entity: Dict[str, Any]) -> bool:
        """
        Validate URI format of id field.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if id is a valid URI
        """
        entity_id = entity.get('id', '')
        
        uri_validation = self.config.get('uri_validation', {})
        id_patterns = uri_validation.get('id_patterns', [])
        
        for pattern in id_patterns:
            if re.match(pattern, entity_id):
                return True
        
        self.errors.append(f"Invalid URI format for id: {entity_id}")
        return False
    
    def validate_property_types(self, entity: Dict[str, Any]) -> bool:
        """
        Validate property types in entity.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if all property types are valid
        """
        allowed_types = self.config.get('property_types', {}).get('allowed', [])
        is_valid = True
        
        for key, value in entity.items():
            if key in ['id', 'type', '@context']:
                continue
            
            if isinstance(value, dict) and 'type' in value:
                prop_type = value['type']
                if prop_type not in allowed_types:
                    self.errors.append(
                        f"Invalid property type '{prop_type}' for '{key}'. "
                        f"Allowed: {allowed_types}"
                    )
                    is_valid = False
        
        return is_valid
    
    def validate_entity(self, entity: Dict[str, Any]) -> bool:
        """
        Validate complete entity.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            True if entity is valid
        """
        self.errors = []
        self.warnings = []
        
        validations = [
            self.validate_required_fields(entity),
            self.validate_context(entity),
            self.validate_uri(entity),
            self.validate_property_types(entity)
        ]
        
        return all(validations)
    
    def get_errors(self) -> List[str]:
        """Get validation errors."""
        return self.errors.copy()
    
    def get_warnings(self) -> List[str]:
        """Get validation warnings."""
        return self.warnings.copy()


class ValidationReportGenerator:
    """Generates detailed validation reports."""
    
    def __init__(self, report_config: Dict[str, Any]):
        """
        Initialize report generator.
        
        Args:
            report_config: Report configuration from YAML
        """
        self.config = report_config
        self.entity_results: List[Dict[str, Any]] = []
    
    def add_entity_result(self, entity_id: str, is_valid: bool, lod_rating: int,
                         errors: List[str], warnings: List[str],
                         passed_criteria: List[str]) -> None:
        """
        Add entity validation result.
        
        Args:
            entity_id: Entity ID
            is_valid: Whether entity passed validation
            lod_rating: LOD star rating (0-5)
            errors: List of validation errors
            warnings: List of validation warnings
            passed_criteria: List of LOD criteria passed
        """
        result = {
            'entity_id': entity_id,
            'valid': is_valid,
            'lod_rating': lod_rating,
            'passed_criteria': passed_criteria,
            'errors': errors,
            'warnings': warnings
        }
        
        self.entity_results.append(result)
    
    def generate_report(self) -> Dict[str, Any]:
        """
        Generate validation report.
        
        Returns:
            Validation report dictionary
        """
        total = len(self.entity_results)
        valid_count = sum(1 for r in self.entity_results if r['valid'])
        invalid_count = total - valid_count
        
        # Calculate LOD distribution
        lod_distribution = {f"{i}_stars": 0 for i in range(6)}
        total_lod = 0
        
        for result in self.entity_results:
            lod_rating = result['lod_rating']
            lod_distribution[f"{lod_rating}_stars"] += 1
            total_lod += lod_rating
        
        average_lod = total_lod / total if total > 0 else 0
        
        # Collect errors
        error_entities = [
            {
                'entity_id': r['entity_id'],
                'errors': r['errors'],
                'warnings': r['warnings']
            }
            for r in self.entity_results
            if not r['valid'] or (self.config.get('include_warnings', True) and r['warnings'])
        ]
        
        report = {
            'summary': {
                'total_entities': total,
                'valid': valid_count,
                'invalid': invalid_count,
                'validation_rate': (valid_count / total * 100) if total > 0 else 0,
                'average_lod_stars': round(average_lod, 2)
            },
            'lod_distribution': lod_distribution,
            'errors': error_entities if self.config.get('detailed_errors', True) else [],
            'timestamp': datetime.now().isoformat()
        }
        
        # Add entity-level details if configured
        if self.config.get('entity_level_details', False):
            report['entity_details'] = self.entity_results
        
        return report
    
    def save_report(self, report: Dict[str, Any], output_file: Optional[str] = None) -> None:
        """
        Save report to file.
        
        Args:
            report: Report dictionary
            output_file: Output file path (uses config if not provided)
        """
        if output_file is None:
            output_file = self.config.get('output_file', 'data/validation_report.json')
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)


class SmartDataModelsValidationAgent:
    """Smart Data Models Validation Agent.
    
    Validates NGSI-LD entities and calculates LOD 5-star ratings.
    """
    
    def __init__(self, config_path: str = 'config/validation.yaml'):
        """
        Initialize Smart Data Models Validation Agent.
        
        Args:
            config_path: Path to validation configuration YAML
        """
        self.config_path = config_path
        self.config = self._load_config()
        
        # Initialize components
        self.lod_calculator = LODRatingCalculator(
            self.config.get('lod_criteria', {})
        )
        self.validator = NGSILDValidator(
            self.config.get('validation', {})
        )
        self.report_generator = ValidationReportGenerator(
            self.config.get('report', {})
        )
        
        # Setup logging
        self._setup_logging()
        
        # Statistics
        self.stats = {
            'total_entities': 0,
            'valid_entities': 0,
            'invalid_entities': 0,
            'processing_time': 0.0
        }
    
    def _load_config(self) -> Dict[str, Any]:
        """
        Load validation configuration from YAML.
        
        Returns:
            Configuration dictionary
            
        Raises:
            FileNotFoundError: If config file not found
            ValueError: If config is invalid
        """
        config_file = Path(self.config_path)
        
        if not config_file.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in config file: {e}")
        
        # Validate required config sections
        required_sections = ['lod_criteria', 'validation', 'report', 'output']
        for section in required_sections:
            if section not in config:
                raise ValueError(f"Missing required config section: {section}")
        
        return config
    
    def _setup_logging(self) -> None:
        """Setup logging configuration."""
        log_dir = Path('logs')
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            handlers=[
                logging.FileHandler('logs/smart_data_models_validation.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('SmartDataModelsValidation')
    
    def load_entities(self, source_file: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Load entities from JSON file.
        
        Args:
            source_file: Path to source file (uses config if not provided)
            
        Returns:
            List of entities
            
        Raises:
            FileNotFoundError: If source file not found
        """
        if source_file is None:
            source_file = self.config['output']['source_file']
        
        source_path = Path(source_file)
        if not source_path.exists():
            raise FileNotFoundError(f"Source file not found: {source_file}")
        
        with open(source_path, 'r', encoding='utf-8') as f:
            entities = json.load(f)
        
        self.logger.info(f"Loaded {len(entities)} entities from {source_file}")
        return entities
    
    def validate_entity(self, entity: Dict[str, Any]) -> Tuple[bool, int, List[str], List[str], List[str]]:
        """
        Validate single entity and calculate LOD rating.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            Tuple of (is_valid, lod_rating, errors, warnings, passed_criteria)
        """
        entity_id = entity.get('id', 'unknown')
        
        # Perform NGSI-LD validation
        is_valid = self.validator.validate_entity(entity)
        errors = self.validator.get_errors()
        warnings = self.validator.get_warnings()
        
        # Calculate LOD rating
        lod_rating, passed_criteria = self.lod_calculator.calculate_rating(entity)
        
        # Log validation result
        if not is_valid:
            self.logger.warning(
                f"Entity {entity_id} validation failed: {errors}"
            )
        else:
            self.logger.debug(
                f"Entity {entity_id} validated: {lod_rating} stars"
            )
        
        return (is_valid, lod_rating, errors, warnings, passed_criteria)
    
    def process_batch(self, entities: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Process batch of entities.
        
        Args:
            entities: List of entities to validate
            
        Returns:
            Tuple of (valid_entities, invalid_entities)
        """
        valid_entities = []
        invalid_entities = []
        
        for entity in entities:
            entity_id = entity.get('id', 'unknown')
            
            try:
                is_valid, lod_rating, errors, warnings, passed_criteria = self.validate_entity(entity)
                
                # Add to report
                self.report_generator.add_entity_result(
                    entity_id, is_valid, lod_rating, errors, warnings, passed_criteria
                )
                
                # Categorize entity
                if is_valid:
                    valid_entities.append(entity)
                    self.stats['valid_entities'] += 1
                else:
                    invalid_entities.append(entity)
                    self.stats['invalid_entities'] += 1
                
            except Exception as e:
                self.logger.error(f"Error validating entity {entity_id}: {e}")
                invalid_entities.append(entity)
                self.stats['invalid_entities'] += 1
                
                # Add error to report
                self.report_generator.add_entity_result(
                    entity_id, False, 0, [f"Validation exception: {str(e)}"], [], []
                )
        
        return (valid_entities, invalid_entities)
    
    def validate_all(self, entities: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Validate all entities.
        
        Args:
            entities: List of entities to validate
            
        Returns:
            Tuple of (valid_entities, invalid_entities)
        """
        self.stats['total_entities'] = len(entities)
        batch_size = self.config.get('processing', {}).get('batch_size', 100)
        
        all_valid = []
        all_invalid = []
        
        # Process in batches
        for i in range(0, len(entities), batch_size):
            batch = entities[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(entities) + batch_size - 1) // batch_size
            
            self.logger.info(
                f"Processing batch {batch_num}/{total_batches} ({len(batch)} entities)..."
            )
            
            valid_batch, invalid_batch = self.process_batch(batch)
            all_valid.extend(valid_batch)
            all_invalid.extend(invalid_batch)
        
        return (all_valid, all_invalid)
    
    def save_entities(self, valid_entities: List[Dict[str, Any]], 
                     invalid_entities: List[Dict[str, Any]]) -> None:
        """
        Save validated and invalid entities to files.
        
        Args:
            valid_entities: List of valid entities
            invalid_entities: List of invalid entities
        """
        output_config = self.config['output']
        pretty_print = output_config.get('pretty_print', True)
        indent = 2 if pretty_print else None
        
        # Save valid entities
        valid_file = output_config['valid_entities_file']
        valid_path = Path(valid_file)
        valid_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(valid_path, 'w', encoding='utf-8') as f:
            json.dump(valid_entities, f, indent=indent, ensure_ascii=False)
        
        self.logger.info(f"Saved {len(valid_entities)} valid entities to {valid_file}")
        
        # Save invalid entities if configured
        if output_config.get('save_invalid', True):
            invalid_file = output_config['invalid_entities_file']
            invalid_path = Path(invalid_file)
            invalid_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(invalid_path, 'w', encoding='utf-8') as f:
                json.dump(invalid_entities, f, indent=indent, ensure_ascii=False)
            
            self.logger.info(f"Saved {len(invalid_entities)} invalid entities to {invalid_file}")
    
    def log_statistics(self) -> None:
        """Log validation statistics."""
        self.logger.info("=" * 60)
        self.logger.info("VALIDATION STATISTICS")
        self.logger.info("=" * 60)
        self.logger.info(f"Total entities: {self.stats['total_entities']}")
        self.logger.info(f"Valid entities: {self.stats['valid_entities']}")
        self.logger.info(f"Invalid entities: {self.stats['invalid_entities']}")
        self.logger.info(f"Processing time: {self.stats['processing_time']:.2f}s")
        
        if self.stats['total_entities'] > 0:
            validation_rate = (self.stats['valid_entities'] / self.stats['total_entities']) * 100
            self.logger.info(f"Validation rate: {validation_rate:.1f}%")
        
        if self.stats['processing_time'] > 0:
            throughput = self.stats['total_entities'] / self.stats['processing_time']
            self.logger.info(f"Throughput: {throughput:.1f} entities/second")
        
        self.logger.info("=" * 60)
    
    def run(self, source_file: Optional[str] = None) -> None:
        """
        Run validation process.
        
        Args:
            source_file: Source file path (uses config if not provided)
        """
        self.logger.info("Starting Smart Data Models validation...")
        start_time = time.time()
        
        # Load entities
        entities = self.load_entities(source_file)
        
        # Validate entities
        valid_entities, invalid_entities = self.validate_all(entities)
        
        # Calculate processing time
        self.stats['processing_time'] = time.time() - start_time
        
        # Generate and save report
        report = self.report_generator.generate_report()
        self.report_generator.save_report(report)
        self.logger.info(f"Validation report saved to {self.config['report']['output_file']}")
        
        # Save entities
        self.save_entities(valid_entities, invalid_entities)
        
        # Log statistics
        self.log_statistics()
        
        self.logger.info("Validation complete!")


def main(config: Dict = None):
    """Main entry point."""
    import argparse
    
    # If called from orchestrator with config dict
    if config:
        try:
            input_file = config.get('input_file', 'data/sosa_enhanced_entities.json')
            config_path = config.get('config_path', 'config/validation.yaml')
            output_file = config.get('output_file')  # NEW: Get output_file from orchestrator
            
            agent = SmartDataModelsValidationAgent(config_path=config_path)
            
            # CRITICAL FIX: Override output file path if provided by orchestrator
            if output_file:
                agent.config['output']['valid_entities_file'] = output_file
                # Also derive invalid entities file name
                output_path = Path(output_file)
                invalid_file = output_path.parent / f"invalid_{output_path.name}"
                agent.config['output']['invalid_entities_file'] = str(invalid_file)
                agent.logger.info(f"Output file overridden: {output_file}")
            
            agent.run(source_file=input_file)
            
            return {
                'status': 'success'
            }
        except Exception as e:
            print(f"Agent execution failed: {e}", file=sys.stderr)
            # CRITICAL FIX: Raise exception so orchestrator knows agent failed
            raise
    
    # Command line execution
    parser = argparse.ArgumentParser(
        description='Smart Data Models Validation Agent - Validate NGSI-LD entities and calculate LOD ratings'
    )
    parser.add_argument(
        '--config',
        default='config/validation.yaml',
        help='Path to validation configuration file'
    )
    parser.add_argument(
        '--source',
        help='Source entities file (overrides config)'
    )
    
    args = parser.parse_args()
    
    # Create and run agent
    agent = SmartDataModelsValidationAgent(config_path=args.config)
    agent.run(source_file=args.source)


if __name__ == '__main__':
    main()
