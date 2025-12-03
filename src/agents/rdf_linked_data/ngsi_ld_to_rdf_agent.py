"""
NGSI-LD to RDF Conversion Agent
Module: src.agents.rdf_linked_data.ngsi_ld_to_rdf_agent
Author: Nguyen Viet Hoang
Created: 2025-11-24
Version: 1.0.0
License: MIT

Domain-agnostic conversion of NGSI-LD JSON-LD entities to RDF triples with support
for multiple serialization formats and comprehensive namespace management.

Core Capabilities:
- JSON-LD parsing and expansion using rdflib framework
- RDF triple generation following subject-predicate-object pattern
- Multiple output formats: Turtle, N-Triples, RDF/XML, JSON-LD
- Configurable namespace prefixes and URI resolution
- Streaming support for processing large entity datasets
- RDF syntax validation and error reporting

Module: src.agents.rdf_linked_data.ngsi_ld_to_rdf_agent
Author: Builder Layer LOD System
Created: 2024-09-20
Version: 1.0.0
License: MIT

Dependencies:
    - rdflib>=6.0: RDF graph manipulation and serialization
    - PyYAML>=6.0: Namespace configuration parsing

Architecture Components:
    - ConfigLoader: Loads and validates namespace configuration from YAML
    - NamespaceManager: Manages RDF namespace prefixes and URI resolution
    - JSONLDParser: Parses JSON-LD and expands to RDF triples
    - RDFSerializer: Serializes RDF graphs to multiple output formats
    - RDFValidator: Validates RDF syntax and structure
    - NGSILDToRDFAgent: Main orchestrator for the conversion workflow

Configuration:
    Requires namespaces.yaml containing:
    - prefixes: Namespace prefix definitions (rdf, rdfs, ngsi-ld, sosa, etc.)
    - base_uri: Base URI for relative references
    - default_format: Default RDF serialization format (turtle recommended)

Examples:
    >>> from src.agents.rdf_linked_data import NGSILDToRDFAgent
    >>> 
    >>> config = {'namespaces_file': 'config/namespaces.yaml'}
    >>> agent = NGSILDToRDFAgent(config)
    >>> 
    >>> entities = [{'id': 'urn:ngsi-ld:Camera:001', 'type': 'Camera'}]
    >>> rdf_graph = agent.convert_to_rdf(entities)
    >>> turtle_output = agent.serialize(rdf_graph, format='turtle')

Output Formats:
    - turtle: Terse RDF Triple Language (recommended for readability)
    - nt: N-Triples (simple, line-based format)
    - xml: RDF/XML (W3C standard)
    - json-ld: JSON-LD (JSON-based RDF serialization)

References:
    - RDF 1.1 Concepts: https://www.w3.org/TR/rdf11-concepts/
    - JSON-LD 1.1: https://www.w3.org/TR/json-ld11/
    - rdflib Documentation: https://rdflib.readthedocs.io/
"""

import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import yaml
from rdflib import Graph, Namespace, URIRef, Literal, RDF, RDFS, XSD, OWL
from rdflib.namespace import NamespaceManager as RDFLibNamespaceManager
from rdflib.util import guess_format


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ConversionStatistics:
    """
    Data class to track RDF conversion statistics.
    
    Attributes:
        total_entities: Total number of entities processed
        successful: Number of successfully converted entities
        failed: Number of failed conversions
        total_triples: Total number of RDF triples generated
        duration_seconds: Total duration of conversion process
        output_files: List of generated output file paths
        errors: List of error details
    """
    total_entities: int = 0
    successful: int = 0
    failed: int = 0
    total_triples: int = 0
    duration_seconds: float = 0.0
    output_files: List[str] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)


class ConfigLoader:
    """
    Load and validate RDF namespace configuration from YAML file.
    
    This class handles:
    - Loading namespaces.yaml configuration
    - Environment variable substitution
    - Configuration validation
    - Default value assignment
    """
    
    def __init__(self, config_path: str = "config/namespaces.yaml"):
        """
        Initialize ConfigLoader.
        
        Args:
            config_path: Path to namespaces.yaml configuration file
        """
        self.config_path = config_path
        self.config = None
        
    def load_config(self) -> Dict[str, Any]:
        """
        Load configuration from YAML file with environment variable substitution.
        
        Returns:
            Dictionary containing namespace configuration
            
        Raises:
            FileNotFoundError: If config file doesn't exist
            yaml.YAMLError: If config file is invalid YAML
            ValueError: If required config fields are missing
        """
        logger.info(f"Loading RDF namespace configuration from: {self.config_path}")
        
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise yaml.YAMLError(f"Invalid YAML in configuration file: {e}")
        
        if not self.config:
            raise ValueError("Configuration file is empty")
        
        # Apply environment variable overrides
        self._apply_env_overrides()
        
        # Validate configuration
        self._validate_config()
        
        logger.info("RDF namespace configuration loaded successfully")
        return self.config
    
    def _apply_env_overrides(self) -> None:
        """
        Apply environment variable overrides to configuration.
        
        Supports:
        - RDF_OUTPUT_DIR
        - RDF_CHUNK_SIZE
        - RDF_VALIDATE
        - RDF_LOG_LEVEL
        """
        if not self.config:
            return
        
        # Output directory override
        if 'RDF_OUTPUT_DIR' in os.environ:
            if 'output' not in self.config:
                self.config['output'] = {}
            self.config['output']['output_dir'] = os.environ['RDF_OUTPUT_DIR']
            logger.info(f"Output directory overridden from environment: {self.config['output']['output_dir']}")
        
        # Chunk size override
        if 'RDF_CHUNK_SIZE' in os.environ:
            if 'processing' not in self.config:
                self.config['processing'] = {}
            self.config['processing']['chunk_size'] = int(os.environ['RDF_CHUNK_SIZE'])
            logger.info(f"Chunk size overridden from environment: {self.config['processing']['chunk_size']}")
        
        # Validation override
        if 'RDF_VALIDATE' in os.environ:
            if 'processing' not in self.config:
                self.config['processing'] = {}
            self.config['processing']['validate_rdf'] = os.environ['RDF_VALIDATE'].lower() in ['true', '1', 'yes']
            logger.info(f"RDF validation overridden from environment: {self.config['processing']['validate_rdf']}")
        
        # Log level override
        if 'RDF_LOG_LEVEL' in os.environ:
            if 'logging' not in self.config:
                self.config['logging'] = {}
            self.config['logging']['level'] = os.environ['RDF_LOG_LEVEL']
            logger.info(f"Log level overridden from environment: {self.config['logging']['level']}")
    
    def _validate_config(self) -> None:
        """
        Validate required configuration fields.
        
        Raises:
            ValueError: If required fields are missing or invalid
        """
        if not self.config:
            raise ValueError("Configuration is empty")
        
        # Required fields
        if 'namespaces' not in self.config or not self.config['namespaces']:
            raise ValueError("Configuration must contain 'namespaces' section")
        
        if 'output_formats' not in self.config or not self.config['output_formats']:
            raise ValueError("Configuration must contain 'output_formats' section")
        
        # Validate output formats
        for fmt in self.config['output_formats']:
            if 'format' not in fmt or 'extension' not in fmt:
                raise ValueError("Each output format must have 'format' and 'extension' fields")
        
        # Validate namespaces are valid URIs
        for prefix, uri in self.config['namespaces'].items():
            if not uri or not isinstance(uri, str):
                raise ValueError(f"Invalid namespace URI for prefix '{prefix}': {uri}")


class NamespaceManager:
    """
    Manage RDF namespace prefixes and URI resolution.
    
    This class provides:
    - Namespace registration from configuration
    - URI prefix resolution
    - Namespace binding for RDF graphs
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize NamespaceManager with configuration.
        
        Args:
            config: Namespace configuration dictionary
        """
        self.config = config
        self.namespaces = {}
        self.namespace_objects = {}
        
        # Load namespaces from config
        self._load_namespaces()
    
    def _load_namespaces(self) -> None:
        """Load namespace definitions from configuration."""
        namespaces_config = self.config.get('namespaces', {})
        
        for prefix, uri in namespaces_config.items():
            self.namespaces[prefix] = uri
            self.namespace_objects[prefix] = Namespace(uri)
            logger.debug(f"Registered namespace: {prefix} -> {uri}")
        
        logger.info(f"Loaded {len(self.namespaces)} namespace definitions")
    
    def bind_to_graph(self, graph: Graph) -> None:
        """
        Bind all namespaces to an RDF graph.
        
        Args:
            graph: RDFLib Graph object
        """
        for prefix, uri in self.namespaces.items():
            graph.bind(prefix, uri)
        
        logger.debug(f"Bound {len(self.namespaces)} namespaces to graph")
    
    def get_namespace(self, prefix: str) -> Optional[Namespace]:
        """
        Get Namespace object by prefix.
        
        Args:
            prefix: Namespace prefix
            
        Returns:
            Namespace object or None if not found
        """
        return self.namespace_objects.get(prefix)
    
    def get_uri(self, prefix: str) -> Optional[str]:
        """
        Get namespace URI by prefix.
        
        Args:
            prefix: Namespace prefix
            
        Returns:
            Namespace URI or None if not found
        """
        return self.namespaces.get(prefix)
    
    def resolve_prefix(self, qname: str) -> Optional[str]:
        """
        Resolve a qualified name (prefix:localname) to full URI.
        
        Args:
            qname: Qualified name (e.g., "sosa:Sensor")
            
        Returns:
            Full URI or None if prefix not found
        """
        if ':' not in qname:
            return None
        
        prefix, localname = qname.split(':', 1)
        namespace_uri = self.namespaces.get(prefix)
        
        if namespace_uri:
            return namespace_uri + localname
        
        return None


class JSONLDParser:
    """
    Parse JSON-LD documents and expand to RDF triples.
    
    This class provides:
    - JSON-LD parsing using rdflib
    - @context resolution
    - URI expansion
    - Triple extraction
    """
    
    def __init__(self, namespace_manager: NamespaceManager):
        """
        Initialize JSONLDParser.
        
        Args:
            namespace_manager: NamespaceManager instance
        """
        self.namespace_manager = namespace_manager
    
    def parse_entities(self, entities: List[Dict[str, Any]]) -> Graph:
        """
        Parse multiple NGSI-LD entities to RDF graph.
        
        Args:
            entities: List of NGSI-LD entity dictionaries
            
        Returns:
            RDFLib Graph containing all triples
        """
        graph = Graph()
        
        # Bind namespaces to graph
        self.namespace_manager.bind_to_graph(graph)
        
        # Parse each entity
        success_count = 0
        for entity in entities:
            try:
                if self._parse_entity(graph, entity):
                    success_count += 1
            except Exception as e:
                logger.error(f"Error parsing entity {entity.get('id', 'unknown')}: {e}")
                continue
        
        logger.info(f"Parsed {success_count}/{len(entities)} entities into {len(graph)} triples")
        return graph
    
    def _parse_entity(self, graph: Graph, entity: Dict[str, Any]) -> bool:
        """
        Parse a single NGSI-LD entity and add triples to graph.
        
        Args:
            graph: RDFLib Graph to add triples to
            entity: NGSI-LD entity dictionary
            
        Returns:
            True if successfully parsed, False otherwise
        """
        import urllib.parse
        
        # Ensure entity has required fields
        if 'id' not in entity or 'type' not in entity:
            logger.warning(f"Entity missing required fields: {entity}")
            return False
        
        entity_id = entity['id']
        entity_types = entity['type']
        
        # Handle type as string or list
        if isinstance(entity_types, str):
            entity_types = [entity_types]
        
        # URL-encode spaces in ID for valid URIs
        entity_id_encoded = urllib.parse.quote(entity_id, safe='/:')
        
        # Create entity subject
        subject = URIRef(entity_id_encoded)
        
        # Add type triples for all types
        for entity_type in entity_types:
            # Handle namespaced types (e.g., "sosa:Sensor")
            if ':' in entity_type:
                # Expand namespace
                type_uri = self.namespace_manager.resolve_prefix(entity_type)
                if type_uri:
                    graph.add((subject, RDF.type, URIRef(type_uri)))
                else:
                    # Fallback to simple URI
                    graph.add((subject, RDF.type, URIRef(f"https://uri.etsi.org/ngsi-ld/{entity_type}")))
            else:
                graph.add((subject, RDF.type, URIRef(f"https://uri.etsi.org/ngsi-ld/{entity_type}")))
        
        # Process all properties
        for key, value in entity.items():
            if key in ['id', 'type', '@context']:
                continue
            
            # Handle namespaced properties (e.g., "sosa:observes")
            if ':' in key:
                predicate_uri = self.namespace_manager.resolve_prefix(key)
                if predicate_uri:
                    predicate = URIRef(predicate_uri)
                else:
                    predicate = URIRef(f"https://uri.etsi.org/ngsi-ld/{key}")
            else:
                predicate = URIRef(f"https://uri.etsi.org/ngsi-ld/{key}")
            
            # Handle different value types
            if isinstance(value, dict):
                # NGSI-LD Property/Relationship structure
                value_type = value.get('type')
                
                if value_type == 'Property':
                    # Add property value
                    prop_value = value.get('value')
                    if prop_value is not None:
                        if isinstance(prop_value, (int, float, bool)):
                            obj = Literal(prop_value)
                        else:
                            obj = Literal(str(prop_value))
                        graph.add((subject, predicate, obj))
                
                elif value_type == 'Relationship':
                    # Add relationship object
                    obj_id = value.get('object')
                    if obj_id:
                        # URL-encode the object URI
                        obj_id_encoded = urllib.parse.quote(obj_id, safe='/:')
                        obj = URIRef(obj_id_encoded)
                        graph.add((subject, predicate, obj))
                
                elif value_type == 'GeoProperty':
                    # Add geo property - convert to WKT or GeoJSON
                    geo_value = value.get('value')
                    if geo_value:
                        # For now, add as JSON string
                        obj = Literal(json.dumps(geo_value))
                        graph.add((subject, predicate, obj))
            
            else:
                # Simple value
                obj = Literal(value)
                graph.add((subject, predicate, obj))
        
        return True


class RDFSerializer:
    """
    Serialize RDF graph to multiple output formats.
    
    This class provides:
    - Serialization to Turtle, N-Triples, RDF/XML, JSON-LD
    - Pretty printing with namespace prefixes
    - File output management
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize RDFSerializer with configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.output_config = config.get('output', {})
        self.output_formats = config.get('output_formats', [])
    
    def serialize(
        self,
        graph: Graph,
        entity_type: str = "entities",
        timestamp: Optional[str] = None
    ) -> List[str]:
        """
        Serialize RDF graph to all configured formats.
        
        Args:
            graph: RDFLib Graph to serialize
            entity_type: Type of entities (for filename)
            timestamp: Timestamp string (auto-generated if None)
            
        Returns:
            List of output file paths
        """
        if timestamp is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        # Create output directory
        output_dir = Path(self.output_config.get('output_dir', 'data/rdf'))
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_files = []
        
        # Serialize to each format
        for format_config in self.output_formats:
            format_name = format_config['format']
            extension = format_config['extension']
            
            # Build filename
            filename_template = self.output_config.get('filename_template', '{entity_type}_{timestamp}')
            filename = filename_template.format(
                entity_type=entity_type,
                timestamp=timestamp
            ) + extension
            
            output_path = output_dir / filename
            
            try:
                self._serialize_to_file(graph, output_path, format_name)
                output_files.append(str(output_path))
                logger.info(f"Serialized RDF to {format_name}: {output_path}")
            except Exception as e:
                logger.error(f"Error serializing to {format_name}: {e}")
                continue
        
        return output_files
    
    def _serialize_to_file(self, graph: Graph, output_path: Path, format_name: str) -> None:
        """
        Serialize RDF graph to a specific file format.
        
        Args:
            graph: RDFLib Graph to serialize
            output_path: Output file path
            format_name: Serialization format (turtle, nt, xml, json-ld)
        """
        # Serialize graph to file
        with open(output_path, 'wb') as f:
            graph.serialize(
                destination=f,
                format=format_name,
                encoding='utf-8'
            )


class RDFValidator:
    """
    Validate RDF syntax and structure.
    
    This class provides:
    - RDF syntax validation
    - Namespace verification
    - Triple count verification
    - Structure validation
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize RDFValidator with configuration.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.validation_config = config.get('validation', {})
    
    def validate_graph(self, graph: Graph, num_entities: int) -> Tuple[bool, List[str]]:
        """
        Validate RDF graph structure and content.
        
        Args:
            graph: RDFLib Graph to validate
            num_entities: Expected number of entities
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Check if graph is empty
        if len(graph) == 0:
            errors.append("RDF graph is empty (0 triples)")
            return False, errors
        
        # Check minimum triples per entity
        min_triples = self.validation_config.get('min_triples_per_entity', 3)
        expected_min_triples = num_entities * min_triples
        
        if len(graph) < expected_min_triples:
            errors.append(
                f"Graph has fewer triples than expected: "
                f"{len(graph)} < {expected_min_triples} "
                f"(min {min_triples} per entity × {num_entities} entities)"
            )
        
        # Check required prefixes
        required_prefixes = self.validation_config.get('required_prefixes', [])
        bound_prefixes = set(prefix for prefix, _ in graph.namespaces())
        
        for required_prefix in required_prefixes:
            if required_prefix not in bound_prefixes:
                errors.append(f"Required namespace prefix not found: {required_prefix}")
        
        # Validate datatype literals if configured
        if self.validation_config.get('validate_datatypes', True):
            self._validate_datatypes(graph, errors)
        
        # Validate URI syntax if configured
        if self.validation_config.get('validate_uris', True):
            self._validate_uris(graph, errors)
        
        is_valid = len(errors) == 0
        
        if is_valid:
            logger.info(f"RDF graph validation passed: {len(graph)} triples")
        else:
            logger.warning(f"RDF graph validation failed: {len(errors)} errors")
            for error in errors:
                logger.warning(f"  - {error}")
        
        return is_valid, errors
    
    def _validate_datatypes(self, graph: Graph, errors: List[str]) -> None:
        """
        Validate datatype literals in graph.
        
        Args:
            graph: RDFLib Graph to validate
            errors: List to append errors to
        """
        # Check for literals with datatypes
        for s, p, o in graph:
            if isinstance(o, Literal) and o.datatype:
                # Validate common XSD datatypes
                if o.datatype in [XSD.decimal, XSD.double, XSD.float]:
                    try:
                        float(o.value)
                    except ValueError:
                        errors.append(f"Invalid numeric literal: {o.value} (type: {o.datatype})")
                
                elif o.datatype in [XSD.integer, XSD.int, XSD.long]:
                    try:
                        int(o.value)
                    except ValueError:
                        errors.append(f"Invalid integer literal: {o.value} (type: {o.datatype})")
    
    def _validate_uris(self, graph: Graph, errors: List[str]) -> None:
        """
        Validate URI syntax in graph.
        
        Args:
            graph: RDFLib Graph to validate
            errors: List to append errors to
        """
        # Check for valid URIs
        for s, p, o in graph:
            # Validate subject URIs
            if isinstance(s, URIRef):
                if not str(s).startswith(('http://', 'https://', 'urn:')):
                    errors.append(f"Invalid subject URI scheme: {s}")
            
            # Validate predicate URIs
            if isinstance(p, URIRef):
                if not str(p).startswith(('http://', 'https://', 'urn:')):
                    errors.append(f"Invalid predicate URI scheme: {p}")
            
            # Validate object URIs
            if isinstance(o, URIRef):
                if not str(o).startswith(('http://', 'https://', 'urn:')):
                    errors.append(f"Invalid object URI scheme: {o}")
    
    def validate_file(self, file_path: str, format_name: str) -> Tuple[bool, List[str]]:
        """
        Validate RDF file by parsing it.
        
        Args:
            file_path: Path to RDF file
            format_name: RDF format (turtle, nt, xml, json-ld)
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        try:
            # Try to parse the file
            graph = Graph()
            graph.parse(file_path, format=format_name)
            
            logger.info(f"Successfully parsed RDF file: {file_path} ({len(graph)} triples)")
            return True, []
        
        except Exception as e:
            errors.append(f"Error parsing RDF file: {str(e)}")
            logger.error(f"RDF file validation failed: {file_path} - {e}")
            return False, errors


class NGSILDToRDFAgent:
    """Main orchestrator for converting NGSI-LD entities to RDF format.
    
    This agent provides:
    - NGSI-LD to RDF conversion with multiple output formats
    - JSON-LD parsing and expansion
    - Multiple output formats (Turtle, N-Triples, RDF/XML)
    - Comprehensive error handling and reporting
    - Performance tracking and statistics
    
    Usage:
        agent = NGSILDToRDFAgent(config_path='config/namespaces.yaml')
        stats = agent.convert(input_file='data/validated_entities.json')
    """
    
    def __init__(self, config_path: str = "config/namespaces.yaml"):
        """
        Initialize NGSILDToRDFAgent.
        
        Args:
            config_path: Path to namespaces.yaml configuration file
        """
        self.config_path = config_path
        self.config = None
        self.namespace_manager = None
        self.parser = None
        self.serializer = None
        self.validator = None
        self.statistics = ConversionStatistics()
        
        # Load configuration
        self._load_configuration()
    
    def _load_configuration(self) -> None:
        """Load and validate configuration."""
        logger.info("Initializing NGSI-LD to RDF Agent")
        
        config_loader = ConfigLoader(self.config_path)
        self.config = config_loader.load_config()
        
        # Initialize components
        self.namespace_manager = NamespaceManager(self.config)
        self.parser = JSONLDParser(self.namespace_manager)
        self.serializer = RDFSerializer(self.config)
        self.validator = RDFValidator(self.config)
        
        logger.info("NGSI-LD to RDF Agent initialized successfully")
    
    def convert(
        self,
        input_file: str = "data/validated_entities.json",
        entity_type: Optional[str] = None
    ) -> ConversionStatistics:
        """
        Convert NGSI-LD entities from input file to RDF formats.
        
        Args:
            input_file: Path to JSON file containing NGSI-LD entities
            entity_type: Optional entity type for filename (auto-detected if None)
            
        Returns:
            ConversionStatistics object with conversion details
        """
        logger.info(f"Starting NGSI-LD to RDF conversion from: {input_file}")
        
        # Load entities from input file
        entities = self._load_entities(input_file)
        
        if not entities:
            # Empty entity files are expected when no new data is generated
            logger.info("No entities to convert - empty input file")
            self.statistics.total_entities = 0
            self.statistics.successful = 0
            return self.statistics
        
        logger.info(f"Loaded {len(entities)} entities to convert")
        
        # Detect entity type if not provided
        if entity_type is None:
            entity_type = self._detect_entity_type(entities)
        
        # Start tracking
        start_time = time.time()
        self.statistics.total_entities = len(entities)
        
        # Parse entities to RDF graph
        try:
            graph = self.parser.parse_entities(entities)
            self.statistics.total_triples = len(graph)
            self.statistics.successful = len(entities)
        except Exception as e:
            logger.error(f"Error parsing entities: {e}")
            self.statistics.failed = len(entities)
            self.statistics.errors.append({
                'stage': 'parsing',
                'error': str(e)
            })
            return self.statistics
        
        # Validate RDF graph
        if self.config.get('processing', {}).get('validate_rdf', True):
            is_valid, validation_errors = self.validator.validate_graph(graph, len(entities))
            
            if not is_valid:
                logger.warning(f"RDF validation found {len(validation_errors)} issues")
                self.statistics.errors.extend([
                    {'stage': 'validation', 'error': err} for err in validation_errors
                ])
        
        # Serialize to output formats
        try:
            output_files = self.serializer.serialize(graph, entity_type)
            self.statistics.output_files = output_files
        except Exception as e:
            logger.error(f"Error serializing RDF: {e}")
            self.statistics.errors.append({
                'stage': 'serialization',
                'error': str(e)
            })
        
        # Validate output files
        if self.config.get('processing', {}).get('validate_rdf', True):
            self._validate_output_files()
        
        # End tracking
        self.statistics.duration_seconds = time.time() - start_time
        
        # Save statistics
        self._save_statistics()
        
        # Log summary
        self._log_summary()
        
        return self.statistics
    
    def _load_entities(self, input_file: str) -> List[Dict[str, Any]]:
        """
        Load NGSI-LD entities from JSON file.
        
        Args:
            input_file: Path to JSON file
            
        Returns:
            List of NGSI-LD entities
            
        Raises:
            FileNotFoundError: If input file doesn't exist
            json.JSONDecodeError: If input file is not valid JSON
        """
        if not os.path.exists(input_file):
            logger.warning(f"Input file not found: {input_file} - returning empty entity list")
            return []
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle both array and object with entities array
            if isinstance(data, list):
                entities = data
            elif isinstance(data, dict) and 'entities' in data:
                entities = data['entities']
            else:
                logger.error(f"Invalid input format in {input_file}")
                entities = []
            
            # Handle empty entity list (expected condition when no data is generated)
            if not entities:
                logger.debug(f"Empty entity list in {input_file}")
            
            return entities
        
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"Invalid JSON in input file: {e}", e.doc, e.pos)
    
    def _detect_entity_type(self, entities: List[Dict[str, Any]]) -> str:
        """
        Detect entity type from entities.
        
        Args:
            entities: List of entities
            
        Returns:
            Entity type string (e.g., "Camera", "Sensor")
        """
        if not entities:
            return self.config.get('output', {}).get('default_entity_type', 'entities')
        
        # Get type from first entity
        first_entity = entities[0]
        entity_type = first_entity.get('type', 'entities')
        
        return entity_type
    
    def _validate_output_files(self) -> None:
        """Validate generated RDF output files."""
        for output_file in self.statistics.output_files:
            # Guess format from file extension
            format_name = guess_format(output_file)
            
            if format_name:
                is_valid, errors = self.validator.validate_file(output_file, format_name)
                
                if not is_valid:
                    logger.warning(f"Output file validation failed: {output_file}")
                    self.statistics.errors.extend([
                        {'stage': 'output_validation', 'file': output_file, 'error': err}
                        for err in errors
                    ])
    
    def _save_statistics(self) -> None:
        """Save conversion statistics to JSON file."""
        if not self.config.get('output', {}).get('include_stats', True):
            return
        
        output_dir = Path(self.config.get('output', {}).get('output_dir', 'data/rdf'))
        stats_filename = self.config.get('output', {}).get('stats_filename', 'conversion_stats.json')
        stats_path = output_dir / stats_filename
        
        stats_dict = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'total_entities': self.statistics.total_entities,
            'successful': self.statistics.successful,
            'failed': self.statistics.failed,
            'total_triples': self.statistics.total_triples,
            'duration_seconds': round(self.statistics.duration_seconds, 2),
            'output_files': self.statistics.output_files,
            'error_count': len(self.statistics.errors)
        }
        
        if self.statistics.errors:
            stats_dict['errors'] = self.statistics.errors
        
        with open(stats_path, 'w', encoding='utf-8') as f:
            json.dump(stats_dict, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Conversion statistics saved to: {stats_path}")
    
    def _log_summary(self) -> None:
        """Log conversion summary."""
        logger.info("=" * 80)
        logger.info("NGSI-LD TO RDF CONVERSION SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Total entities:    {self.statistics.total_entities}")
        logger.info(f"Successful:        {self.statistics.successful}")
        logger.info(f"Failed:            {self.statistics.failed}")
        logger.info(f"Total triples:     {self.statistics.total_triples}")
        logger.info(f"Duration:          {self.statistics.duration_seconds:.2f}s")
        logger.info(f"Output files:      {len(self.statistics.output_files)}")
        for output_file in self.statistics.output_files:
            logger.info(f"  - {output_file}")
        if self.statistics.errors:
            logger.info(f"Errors:            {len(self.statistics.errors)}")
        logger.info("=" * 80)


def main(config: Dict = None):
    """
    Main entry point for NGSI-LD to RDF Agent.
    
    Usage:
        python agents/rdf_linked_data/ngsi_ld_to_rdf_agent.py
    """
    try:
        # If called from orchestrator with config dict
        if config:
            input_file = config.get('input_file', 'data/validated_entities.json')
            fallback_file = config.get('fallback_file', 'data/validated_entities.json')
            entity_type = config.get('entity_type', 'Camera')
            config_path = config.get('config_path', 'config/namespaces.yaml')
            output_dir = config.get('output_dir')  # Get output_dir from orchestrator
            
            # Check if primary input file exists, fallback if not
            from pathlib import Path
            if not Path(input_file).exists() and Path(fallback_file).exists():
                logger.warning(f"Primary input file not found: {input_file}")
                logger.info(f"Using fallback file: {fallback_file}")
                input_file = fallback_file
            
            agent = NGSILDToRDFAgent(config_path=config_path)
            
            # Override output_dir if provided by orchestrator
            if output_dir:
                agent.config['output']['output_dir'] = output_dir
                logger.info(f"Output directory overridden: {output_dir}")
            
            stats = agent.convert(input_file=input_file, entity_type=entity_type)
            
            return {
                'status': 'success',
                'stats': {
                    'total_entities': stats.total_entities,
                    'successful': stats.successful,
                    'failed': stats.failed,
                    'total_triples': stats.total_triples,
                    'output_files': stats.output_files
                }
            }
        
        # Command line execution
        # Initialize agent
        agent = NGSILDToRDFAgent(config_path='config/namespaces.yaml')
        
        # Convert entities
        stats = agent.convert(
            input_file='data/validated_entities.json',
            entity_type='Camera'
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("NGSI-LD TO RDF AGENT - EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Total entities:    {stats.total_entities}")
        print(f"Successful:        {stats.successful}")
        print(f"Failed:            {stats.failed}")
        print(f"Total triples:     {stats.total_triples}")
        print(f"Duration:          {stats.duration_seconds:.2f}s")
        print(f"Output files:      {len(stats.output_files)}")
        for output_file in stats.output_files:
            print(f"  - {output_file}")
        print("=" * 80)
        
        return 0
    
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        if config:
            return {
                'status': 'failed',
                'error': str(e)
            }
        return 1


if __name__ == '__main__':
    exit(main())
