"""
SOSA/SSN Semantic Mapper Agent

Module: src.agents.transformation.sosa_ssn_mapper_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-22
Version: 1.0.0
License: MIT

Enhances NGSI-LD entities with W3C SOSA/SSN ontology properties for semantic
interoperability in sensor observation systems. Domain-agnostic implementation
via configuration-driven mapping rules.

SOSA (Sensor, Observation, Sample, and Actuator) Ontology:
    W3C/OGC standard for representing sensor systems, observations, sampling,
    and actuation. Provides a lightweight core for SSN (Semantic Sensor Network).

Core Features:
- Adds sosa:Sensor type classification to entities
- Creates sosa:observes relationships to ObservableProperty instances
- Establishes sosa:isHostedBy relationships to Platform entities
- Generates ObservableProperty entities for observed phenomena
- Creates Platform entities representing hosting infrastructure
- Preserves all original NGSI-LD properties and relationships
- Merges @context arrays with SOSA/SSN semantic contexts

Module: src.agents.transformation.sosa_ssn_mapper_agent
Author: Builder Layer LOD System
Created: 2024-09-25
Version: 1.0.0
License: MIT

Dependencies:
    - PyYAML>=6.0: SOSA mapping configuration parsing

Configuration:
    Requires sosa_mappings.yaml containing:
    - sensor_types: Entity types to treat as SOSA Sensors
    - observable_properties: Mapping of properties to observed phenomena
    - platform_config: Platform entity generation settings
    - context_urls: SOSA/SSN context URLs

Examples:
    >>> from src.agents.transformation import SOSASSNMapperAgent
    >>> 
    >>> config = {'mappings_file': 'config/sosa_mappings.yaml'}
    >>> agent = SOSASSNMapperAgent(config)
    >>> 
    >>> ngsi_entities = [{'id': 'urn:ngsi-ld:Camera:001', 'type': 'Camera'}]
    >>> enhanced = agent.map_to_sosa(ngsi_entities)
    >>> print(enhanced[0]['type'])  # ['Camera', 'sosa:Sensor']

Generated Entities:
    - Sensor entities: Original entities enhanced with sosa:Sensor type
    - ObservableProperty: Phenomena being observed (e.g., TrafficDensity)
    - Platform: Infrastructure hosting the sensors (e.g., TrafficMonitoringStation)

References:
    - SOSA/SSN Ontology: https://www.w3.org/TR/vocab-ssn/
    - SOSA Core: https://www.w3.org/TR/vocab-ssn/#SOSA
    - SSN Extensions: https://www.w3.org/TR/vocab-ssn/#SSN
"""

import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from datetime import datetime

import yaml


class SOSARelationshipBuilder:
    """Builds SOSA/SSN relationships according to ontology specifications."""
    
    def __init__(self, relationships_config: Dict[str, Any]):
        """
        Initialize relationship builder.
        
        Args:
            relationships_config: Relationships configuration from YAML
        """
        self.config = relationships_config
        
    def create_observes_relationship(self, target_uri: str) -> Dict[str, Any]:
        """
        Create sosa:observes relationship.
        
        Args:
            target_uri: URI of the ObservableProperty
            
        Returns:
            NGSI-LD Relationship object
        """
        return {
            'type': 'Relationship',
            'object': target_uri
        }
    
    def create_hosted_by_relationship(self, platform_uri: str) -> Dict[str, Any]:
        """
        Create sosa:isHostedBy relationship.
        
        Args:
            platform_uri: URI of the Platform
            
        Returns:
            NGSI-LD Relationship object
        """
        return {
            'type': 'Relationship',
            'object': platform_uri
        }
    
    def create_observation_relationship(self, observation_uri: str, 
                                       observed_at: Optional[str] = None) -> Dict[str, Any]:
        """
        Create sosa:madeObservation relationship.
        
        Args:
            observation_uri: URI of the Observation
            observed_at: Timestamp of observation (ISO8601)
            
        Returns:
            NGSI-LD Relationship object
        """
        relationship = {
            'type': 'Relationship',
            'object': observation_uri
        }
        
        if observed_at:
            relationship['observedAt'] = observed_at
            
        return relationship


class SOSAEntityGenerator:
    """Generates SOSA/SSN ontology entities (ObservableProperty, Platform, etc.)."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize entity generator.
        
        Args:
            config: Full SOSA mappings configuration
        """
        self.config = config
        self.observable_property_config = config.get('observable_property', {})
        self.platform_config = config.get('platform', {})
        self.context_config = config.get('context', {})
        
    def generate_observable_property(self) -> Dict[str, Any]:
        """
        Generate ObservableProperty entity.
        
        Returns:
            NGSI-LD ObservableProperty entity
        """
        domain_type = self.observable_property_config.get('domain_type', 'Unknown')
        uri_prefix = self.observable_property_config.get('uri_prefix', 'urn:ngsi-ld:ObservableProperty:')
        properties = self.observable_property_config.get('properties', {})
        
        entity = {
            'id': f'{uri_prefix}{domain_type}',
            'type': 'ObservableProperty',
            '@context': self._build_context()
        }
        
        # Add properties from config
        if 'name' in properties:
            entity['name'] = {
                'type': 'Property',
                'value': properties['name']
            }
        
        if 'description' in properties:
            entity['description'] = {
                'type': 'Property',
                'value': properties['description']
            }
        
        if 'unit_of_measurement' in properties:
            entity['unitOfMeasurement'] = {
                'type': 'Property',
                'value': properties['unit_of_measurement']
            }
        
        return entity
    
    def generate_platform(self) -> Dict[str, Any]:
        """
        Generate Platform entity.
        
        Returns:
            NGSI-LD Platform entity
        """
        platform_id = self.platform_config.get('id', 'urn:ngsi-ld:Platform:Default')
        platform_name = self.platform_config.get('name', 'Default Platform')
        platform_description = self.platform_config.get('description', '')
        platform_type = self.platform_config.get('type', 'Platform')
        properties = self.platform_config.get('properties', {})
        
        entity = {
            'id': platform_id,
            'type': platform_type,
            '@context': self._build_context()
        }
        
        # Add name
        entity['name'] = {
            'type': 'Property',
            'value': platform_name
        }
        
        # Add description
        if platform_description:
            entity['description'] = {
                'type': 'Property',
                'value': platform_description
            }
        
        # Add additional properties from config
        for key, value in properties.items():
            # Convert snake_case to camelCase for NGSI-LD
            camel_key = self._to_camel_case(key)
            entity[camel_key] = {
                'type': 'Property',
                'value': value
            }
        
        return entity
    
    def _build_context(self) -> List[str]:
        """
        Build @context array with SOSA/SSN contexts.
        
        Returns:
            List of context URLs
        """
        contexts = [
            'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'
        ]
        
        # Add SOSA/SSN contexts
        if 'sosa' in self.context_config:
            contexts.append(self.context_config['sosa'])
        if 'ssn' in self.context_config:
            contexts.append(self.context_config['ssn'])
        
        return contexts
    
    @staticmethod
    def _to_camel_case(snake_str: str) -> str:
        """Convert snake_case to camelCase."""
        components = snake_str.split('_')
        return components[0] + ''.join(x.title() for x in components[1:])


class SOSAValidator:
    """Validates SOSA/SSN enhanced entities."""
    
    def __init__(self, validation_config: Dict[str, Any]):
        """
        Initialize validator.
        
        Args:
            validation_config: Validation configuration from YAML
        """
        self.config = validation_config
        self.required_properties = validation_config.get('required_sosa_properties', [])
        self.optional_properties = validation_config.get('optional_sosa_properties', [])
        self.check_targets = validation_config.get('check_relationship_targets', True)
        self.validate_contexts = validation_config.get('validate_context_urls', True)
        self.errors: List[str] = []
    
    def validate_entity(self, entity: Dict[str, Any]) -> bool:
        """
        Validate SOSA-enhanced entity.
        
        Args:
            entity: NGSI-LD entity with SOSA properties
            
        Returns:
            True if valid, False otherwise
        """
        self.errors = []
        
        # Check required SOSA properties
        for prop in self.required_properties:
            if prop not in entity:
                self.errors.append(f"Missing required SOSA property: {prop}")
        
        # Check that sosa:Sensor is in type
        entity_type = entity.get('type', '')
        if isinstance(entity_type, list):
            if 'sosa:Sensor' not in entity_type:
                self.errors.append("Entity type array does not include 'sosa:Sensor'")
        elif isinstance(entity_type, str):
            if entity_type != 'sosa:Sensor':
                self.errors.append("Entity type is not 'sosa:Sensor'")
        
        # Validate relationship targets if enabled
        if self.check_targets:
            self._validate_relationships(entity)
        
        # Validate context URLs if enabled
        if self.validate_contexts:
            self._validate_context(entity)
        
        return len(self.errors) == 0
    
    def _validate_relationships(self, entity: Dict[str, Any]) -> None:
        """Validate relationship structure and targets."""
        for prop in self.required_properties:
            if prop in entity:
                rel = entity[prop]
                if not isinstance(rel, dict):
                    self.errors.append(f"{prop} is not a dictionary")
                    continue
                
                if rel.get('type') != 'Relationship':
                    self.errors.append(f"{prop} type is not 'Relationship'")
                
                if 'object' not in rel:
                    self.errors.append(f"{prop} missing 'object' field")
    
    def _validate_context(self, entity: Dict[str, Any]) -> None:
        """Validate @context array includes SOSA."""
        context = entity.get('@context', [])
        if not isinstance(context, list):
            self.errors.append("@context is not an array")
            return
        
        # Check for SOSA context
        sosa_found = any('sosa' in str(ctx).lower() for ctx in context)
        if not sosa_found:
            self.errors.append("@context does not include SOSA context")
    
    def get_errors(self) -> List[str]:
        """Get validation errors."""
        return self.errors.copy()


class SOSASSNMapperAgent:
    """SOSA/SSN Mapper Agent - Enhances NGSI-LD entities with SOSA/SSN ontology."""
    
    def __init__(self, config_path: str = 'config/sosa_mappings.yaml'):
        """
        Initialize SOSA/SSN Mapper Agent.
        
        Args:
            config_path: Path to SOSA mappings YAML configuration
        """
        self.config_path = config_path
        self.config = self._load_config()
        
        # Initialize components
        self.relationship_builder = SOSARelationshipBuilder(
            self.config.get('relationships', {})
        )
        self.entity_generator = SOSAEntityGenerator(self.config)
        self.validator = SOSAValidator(self.config.get('validation', {}))
        
        # Setup logging
        self._setup_logging()
        
        # Statistics
        self.stats = {
            'total_entities': 0,
            'enhanced_entities': 0,
            'sensors_enhanced': 0,
            'observations_enhanced': 0,
            'validation_errors': 0,
            'processing_time': 0.0
        }
    
    def _load_config(self) -> Dict[str, Any]:
        """
        Load SOSA mappings configuration from YAML.
        
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
        required_sections = ['sensor_type', 'observable_property', 'platform', 
                           'relationships', 'context', 'output']
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
                logging.FileHandler('logs/sosa_ssn_mapper.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('SOSASSNMapper')
    
    def load_ngsi_ld_entities(self, source_file: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Load NGSI-LD entities from JSON file.
        
        Args:
            source_file: Path to source file (uses config if not provided)
            
        Returns:
            List of NGSI-LD entities
            
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
    
    def should_enhance_entity(self, entity: Dict[str, Any]) -> tuple[bool, str]:
        """
        Determine if entity should be enhanced with SOSA properties.
        
        Args:
            entity: NGSI-LD entity
            
        Returns:
            Tuple of (should_enhance: bool, enhancement_type: str)
            enhancement_type can be 'sensor', 'observation', or 'none'
        """
        entity_type = entity.get('type', '')
        
        # Handle both string and array types
        if isinstance(entity_type, list):
            entity_types = entity_type
        else:
            entity_types = [entity_type]
        
        # Check if any type is in entity_type_mappings
        type_mappings = self.config.get('entity_type_mappings', {})
        for etype in entity_types:
            if etype in type_mappings:
                mapping = type_mappings[etype]
                if mapping.get('add_sensor_type', False):
                    return (True, 'sensor')
                elif mapping.get('add_observation_type', False):
                    return (True, 'observation')
        
        return (False, 'none')
    
    def enhance_with_sosa_type(self, entity: Dict[str, Any], enhancement_type: str = 'sensor') -> None:
        """
        Add sosa:Sensor or sosa:Observation type to entity.
        
        Args:
            entity: NGSI-LD entity (modified in place)
            enhancement_type: 'sensor' or 'observation'
        """
        if enhancement_type == 'sensor':
            sosa_type = self.config['sensor_type']
        elif enhancement_type == 'observation':
            sosa_type = self.config.get('observation_type', 'sosa:Observation')
        else:
            return
        
        current_type = entity.get('type', '')
        
        # Convert to array if not already
        if isinstance(current_type, str):
            entity['type'] = [current_type, sosa_type]
        elif isinstance(current_type, list):
            if sosa_type not in current_type:
                entity['type'].append(sosa_type)
    
    def add_observes_relationship(self, entity: Dict[str, Any]) -> None:
        """
        Add sosa:observes relationship to entity.
        
        Args:
            entity: NGSI-LD entity (modified in place)
        """
        # Generate ObservableProperty URI
        observable_config = self.config['observable_property']
        domain_type = observable_config.get('domain_type', 'Unknown')
        uri_prefix = observable_config.get('uri_prefix', 'urn:ngsi-ld:ObservableProperty:')
        target_uri = f'{uri_prefix}{domain_type}'
        
        # Create relationship
        relationship = self.relationship_builder.create_observes_relationship(target_uri)
        entity['sosa:observes'] = relationship
    
    def add_hosted_by_relationship(self, entity: Dict[str, Any]) -> None:
        """
        Add sosa:isHostedBy relationship to entity.
        
        Args:
            entity: NGSI-LD entity (modified in place)
        """
        platform_id = self.config['platform']['id']
        relationship = self.relationship_builder.create_hosted_by_relationship(platform_id)
        entity['sosa:isHostedBy'] = relationship
    
    def add_made_observation_relationship(self, entity: Dict[str, Any]) -> None:
        """
        SKIP initialization of sosa:madeObservation (Stellio rejects empty arrays).
        This property will be populated dynamically via PATCH when observations are created.
        
        Args:
            entity: NGSI-LD entity (modified in place)
        """
        # DO NOT initialize sosa:madeObservation here!
        # Reason: Stellio rejects empty arrays in Relationship.object
        # Solution: entity_publisher_agent will add this via PATCH after Observations exist
        pass
    
    def merge_context(self, entity: Dict[str, Any]) -> None:
        """
        Merge SOSA/SSN context URLs into entity @context.
        
        Args:
            entity: NGSI-LD entity (modified in place)
        """
        current_context = entity.get('@context', [])
        
        # Ensure it's a list
        if isinstance(current_context, str):
            current_context = [current_context]
        elif not isinstance(current_context, list):
            current_context = []
        
        # Add SOSA/SSN contexts
        context_config = self.config['context']
        new_contexts = []
        
        if 'sosa' in context_config:
            sosa_ctx = context_config['sosa']
            if sosa_ctx not in current_context:
                new_contexts.append(sosa_ctx)
        
        if 'ssn' in context_config:
            ssn_ctx = context_config['ssn']
            if ssn_ctx not in current_context:
                new_contexts.append(ssn_ctx)
        
        # Merge contexts
        entity['@context'] = current_context + new_contexts
    
    def enhance_entity(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance single entity with SOSA properties.
        
        Args:
            entity: Original NGSI-LD entity
            
        Returns:
            Enhanced entity with SOSA properties
        """
        # Work on a copy to preserve original
        enhanced = entity.copy()
        
        # Check if entity should be enhanced and get enhancement type
        should_enhance, enhancement_type = self.should_enhance_entity(enhanced)
        
        if not should_enhance:
            return enhanced
        
        # Add SOSA type based on entity type
        self.enhance_with_sosa_type(enhanced, enhancement_type)
        
        # Add relationships only for sensors (Camera), not for observations
        if enhancement_type == 'sensor':
            relationships_config = self.config.get('relationships', {})
            
            if relationships_config.get('observes', {}).get('required', True):
                self.add_observes_relationship(enhanced)
            
            if relationships_config.get('isHostedBy', {}).get('required', True):
                self.add_hosted_by_relationship(enhanced)
            
            # Initialize madeObservation array if required
            if relationships_config.get('madeObservation', {}).get('required', False):
                self.add_made_observation_relationship(enhanced)
        
        # Merge context for all entity types
        if self.config.get('processing', {}).get('merge_contexts', True):
            self.merge_context(enhanced)
        
        return enhanced
    
    def process_batch(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process batch of entities.
        
        Args:
            entities: List of NGSI-LD entities
            
        Returns:
            List of enhanced entities
        """
        enhanced_entities = []
        
        for entity in entities:
            try:
                # Check enhancement type before processing
                should_enhance, enhancement_type = self.should_enhance_entity(entity)
                
                enhanced = self.enhance_entity(entity)
                
                # Validate if configured
                if self.config['output'].get('validate_output', True):
                    if should_enhance and enhancement_type == 'sensor':
                        # Only validate sensors (Camera), not observations
                        if not self.validator.validate_entity(enhanced):
                            self.logger.warning(
                                f"Validation errors for {enhanced.get('id', 'unknown')}: "
                                f"{self.validator.get_errors()}"
                            )
                            self.stats['validation_errors'] += 1
                
                enhanced_entities.append(enhanced)
                
                # Track statistics by type
                if should_enhance:
                    self.stats['enhanced_entities'] += 1
                    if enhancement_type == 'sensor':
                        self.stats['sensors_enhanced'] += 1
                    elif enhancement_type == 'observation':
                        self.stats['observations_enhanced'] += 1
                
            except Exception as e:
                self.logger.error(f"Error enhancing entity {entity.get('id', 'unknown')}: {e}")
                # Include original entity if enhancement fails
                enhanced_entities.append(entity)
        
        return enhanced_entities
    
    def enhance_all(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enhance all entities with SOSA properties.
        
        Args:
            entities: List of NGSI-LD entities
            
        Returns:
            List of enhanced entities
        """
        self.stats['total_entities'] = len(entities)
        batch_size = self.config.get('processing', {}).get('batch_size', 100)
        
        all_enhanced = []
        
        # Process in batches
        for i in range(0, len(entities), batch_size):
            batch = entities[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(entities) + batch_size - 1) // batch_size
            
            self.logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} entities)...")
            enhanced_batch = self.process_batch(batch)
            all_enhanced.extend(enhanced_batch)
        
        return all_enhanced
    
    def generate_support_entities(self) -> List[Dict[str, Any]]:
        """
        Generate supporting SOSA entities (ObservableProperty, Platform).
        
        Returns:
            List of generated entities
        """
        support_entities = []
        
        # Generate ObservableProperty if configured
        if self.config.get('processing', {}).get('generate_observable_properties', True):
            observable_property = self.entity_generator.generate_observable_property()
            support_entities.append(observable_property)
            self.logger.info(f"Generated ObservableProperty: {observable_property['id']}")
        
        # Generate Platform if configured
        if self.config.get('processing', {}).get('generate_platform', True):
            platform = self.entity_generator.generate_platform()
            support_entities.append(platform)
            self.logger.info(f"Generated Platform: {platform['id']}")
        
        return support_entities
    
    def save_output(self, entities: List[Dict[str, Any]], 
                   output_file: Optional[str] = None) -> None:
        """
        Save enhanced entities to JSON file.
        
        Args:
            entities: List of enhanced entities
            output_file: Output file path (uses config if not provided)
        """
        if output_file is None:
            output_file = self.config['output']['output_file']
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Determine indent for pretty printing
        indent = 2 if self.config['output'].get('pretty_print', True) else None
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(entities, f, indent=indent, ensure_ascii=False)
        
        self.logger.info(f"Saved {len(entities)} entities to {output_file}")
    
    def log_statistics(self) -> None:
        """Log processing statistics."""
        self.logger.info("=" * 60)
        self.logger.info("SOSA/SSN MAPPING STATISTICS")
        self.logger.info("=" * 60)
        self.logger.info(f"Total entities processed: {self.stats['total_entities']}")
        self.logger.info(f"Enhanced with SOSA: {self.stats['enhanced_entities']}")
        self.logger.info(f"  - Sensors (Camera): {self.stats['sensors_enhanced']}")
        self.logger.info(f"  - Observations (Weather/AirQuality): {self.stats['observations_enhanced']}")
        self.logger.info(f"Validation errors: {self.stats['validation_errors']}")
        self.logger.info(f"Processing time: {self.stats['processing_time']:.2f}s")
        
        if self.stats['total_entities'] > 0:
            success_rate = (self.stats['enhanced_entities'] / self.stats['total_entities']) * 100
            self.logger.info(f"Enhancement rate: {success_rate:.1f}%")
        
        if self.stats['processing_time'] > 0:
            throughput = self.stats['total_entities'] / self.stats['processing_time']
            self.logger.info(f"Throughput: {throughput:.1f} entities/second")
        
        self.logger.info("=" * 60)
    
    def run(self, source_file: Optional[str] = None, 
            output_file: Optional[str] = None) -> None:
        """
        Run SOSA/SSN mapping process.
        
        Args:
            source_file: Source NGSI-LD file (uses config if not provided)
            output_file: Output file (uses config if not provided)
        """
        self.logger.info("Starting SOSA/SSN mapping...")
        start_time = time.time()
        
        # Load entities
        entities = self.load_ngsi_ld_entities(source_file)
        
        # Enhance entities
        enhanced_entities = self.enhance_all(entities)
        
        # Generate supporting entities
        if self.config['output'].get('include_generated_entities', True):
            support_entities = self.generate_support_entities()
            # Prepend support entities (Platform, ObservableProperty first)
            enhanced_entities = support_entities + enhanced_entities
        
        # Calculate processing time
        self.stats['processing_time'] = time.time() - start_time
        
        # Save output
        self.save_output(enhanced_entities, output_file)
        
        # Log statistics
        self.log_statistics()
        
        self.logger.info("SOSA/SSN mapping complete!")


def main(config: Dict = None):
    """Main entry point."""
    import argparse
    
    # If called from orchestrator with config dict
    if config:
        try:
            input_file = config.get('input_file', 'data/ngsi_ld_entities.json')
            output_file = config.get('output_file', 'data/sosa_enhanced_entities.json')
            config_path = config.get('config_path', 'config/sosa_mappings.yaml')
            
            agent = SOSASSNMapperAgent(config_path=config_path)
            agent.run(source_file=input_file, output_file=output_file)
            
            return {
                'status': 'success',
                'output_file': output_file
            }
        except Exception as e:
            print(f"Agent execution failed: {e}", file=sys.stderr)
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    # Command line execution
    parser = argparse.ArgumentParser(
        description='SOSA/SSN Mapper Agent - Enhance NGSI-LD entities with SOSA/SSN ontology'
    )
    parser.add_argument(
        '--config',
        default='config/sosa_mappings.yaml',
        help='Path to SOSA mappings configuration file'
    )
    parser.add_argument(
        '--source',
        help='Source NGSI-LD entities file (overrides config)'
    )
    parser.add_argument(
        '--output',
        help='Output file (overrides config)'
    )
    
    args = parser.parse_args()
    
    # Create and run agent
    agent = SOSASSNMapperAgent(config_path=args.config)
    agent.run(source_file=args.source, output_file=args.output)


if __name__ == '__main__':
    main()
