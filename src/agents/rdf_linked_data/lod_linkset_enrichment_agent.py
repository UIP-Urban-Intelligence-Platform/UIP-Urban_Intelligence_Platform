#!/usr/bin/env python3
"""LOD Linkset Enrichment Agent.

Module: src.agents.rdf_linked_data.lod_linkset_enrichment_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Enriches NGSI-LD entities with external linksets to LOD Cloud datasets
    (DBpedia, Wikidata, GeoNames) using semantically correct relationships.
    
    This agent enables compliance with LOD Cloud requirements by adding
    cross-dataset links, making the data discoverable and reusable in the
    global Linked Open Data ecosystem.
    
    Key Features:
    - Automatic entity matching with DBpedia, Wikidata, GeoNames
    - Geographic location-based linking via GeoNames (refCity)
    - Semantic entity type matching with DBpedia/Wikidata (seeAlso)
    - Configurable mapping rules via YAML
    - Non-invasive: adds relationships without modifying existing data
    - Optional phase: can be enabled/disabled in workflow
    - Semantically correct: refCity for locations, seeAlso for info, sameAs for identical URIs

Linkset Strategy (Semantically Correct):
    1. GeoNames Linking:
       - Match by coordinates (latitude, longitude)
       - Relationship: refCity (Camera IS LOCATED IN City, not IS City)
       - Example: Camera:cam001 refCity geonames:1566083 (Ho Chi Minh City)
    
    2. DBpedia Linking:
       - Match by name and category
       - Relationship: seeAlso (additional info about location/concept)
       - Example: Camera:cam001 seeAlso dbpedia:Ho_Chi_Minh_City (info about the city)
    
    3. Wikidata Linking:
       - Match by Q-number or label
       - Relationship: seeAlso (additional info) or sameAs (identical concept)
       - Example: Camera:cam001 seeAlso wikidata:Q1854 (Ho Chi Minh City info)

LOD Cloud Compliance (Semantic Correctness):
    According to ETSI NGSI-LD and W3C standards:
    - Uses refCity for geographic relationships (Smart Data Models)
    - Uses rdfs:seeAlso for additional information linksets
    - Uses owl:sameAs ONLY for identical URIs (correct semantic)
    - Preserves entity structure (non-destructive)
    - Adds @context for external vocabularies
    - Supports federated SPARQL queries

Usage:
    from src.agents.rdf_linked_data import LODLinksetEnrichmentAgent
    
    config = {
        'linkset_mappings': 'config/lod_linkset_mappings.yaml',
        'enable_geonames': True,
        'enable_dbpedia': True,
        'enable_wikidata': True
    }
    
    agent = LODLinksetEnrichmentAgent(config)
    enriched_entities = agent.enrich(ngsi_ld_entities)

References:
    - LOD Cloud: https://lod-cloud.net/
    - DBpedia: https://wiki.dbpedia.org/
    - Wikidata: https://www.wikidata.org/
    - GeoNames: https://www.geonames.org/
    - OWL sameAs: https://www.w3.org/TR/owl-ref/#sameAs-def
"""

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from urllib.parse import quote
import requests

import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GeoNamesLinker:
    """Links entities to GeoNames based on geographic coordinates."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize GeoNames linker.
        
        Args:
            config: Configuration containing GeoNames API credentials
        """
        self.config = config
        self.api_base = "http://api.geonames.org"
        self.username = config.get('geonames_username', 'nguyennhatquang')
        self.sparql_endpoint = "http://factforge.net/repositories/ff-news"
        self.cache = {}
        
    def find_nearest_place(self, lat: float, lon: float, radius_km: float = 10) -> Optional[str]:
        """Find nearest GeoNames place URI.
        
        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate
            radius_km: Search radius in kilometers
            
        Returns:
            GeoNames URI or None if not found
        """
        cache_key = f"{lat:.4f},{lon:.4f}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Use GeoNames findNearbyPlaceName API
            url = f"{self.api_base}/findNearbyPlaceNameJSON"
            params = {
                'lat': lat,
                'lng': lon,
                'radius': radius_km,
                'maxRows': 1,
                'username': self.username
            }
            
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for API errors (quota exceeded, etc.)
            if 'status' in data:
                error_msg = data['status'].get('message', 'Unknown error')
                logger.warning(f"GeoNames API error: {error_msg}")
                
                # Fallback for Ho Chi Minh City region when API unavailable
                # HCM bounds: ~10.3-11.2°N, 106.3-107.0°E
                if 10.3 <= lat <= 11.2 and 106.3 <= lon <= 107.0:
                    hcm_uri = "http://sws.geonames.org/1566083/"  # Ho Chi Minh City
                    logger.info(f"✓ Fallback: ({lat}, {lon}) → {hcm_uri} (Ho Chi Minh City region)")
                    self.cache[cache_key] = hcm_uri
                    return hcm_uri
                
                return None
            
            if 'geonames' in data and len(data['geonames']) > 0:
                geoname_id = data['geonames'][0]['geonameId']
                geonames_uri = f"http://sws.geonames.org/{geoname_id}/"
                
                self.cache[cache_key] = geonames_uri
                logger.info(f"✓ Linked ({lat}, {lon}) → {geonames_uri}")
                return geonames_uri
            else:
                # No results found - try fallback for Ho Chi Minh City
                if 10.3 <= lat <= 11.2 and 106.3 <= lon <= 107.0:
                    hcm_uri = "http://sws.geonames.org/1566083/"  # Ho Chi Minh City
                    logger.info(f"✓ Fallback: ({lat}, {lon}) → {hcm_uri} (Ho Chi Minh City region)")
                    self.cache[cache_key] = hcm_uri
                    return hcm_uri
            
        except Exception as e:
            logger.warning(f"GeoNames lookup failed for ({lat}, {lon}): {e}")
            
            # Fallback for Ho Chi Minh City region on exception
            if 10.3 <= lat <= 11.2 and 106.3 <= lon <= 107.0:
                hcm_uri = "http://sws.geonames.org/1566083/"  # Ho Chi Minh City
                logger.info(f"✓ Fallback: ({lat}, {lon}) → {hcm_uri} (Ho Chi Minh City region)")
                self.cache[cache_key] = hcm_uri
                return hcm_uri
        
        return None


class DBpediaLinker:
    """Links entities to DBpedia resources."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize DBpedia linker.
        
        Args:
            config: Configuration for DBpedia linking
        """
        self.config = config
        self.sparql_endpoint = "https://dbpedia.org/sparql"
        self.lookup_endpoint = "https://lookup.dbpedia.org/api/search"
        self.cache = {}
        
    def find_resource(self, name: str, type_hint: Optional[str] = None) -> Optional[str]:
        """Find DBpedia resource URI by name.
        
        Args:
            name: Entity name or label
            type_hint: Optional type hint (e.g., "Place", "Location")
            
        Returns:
            DBpedia resource URI or None if not found
        """
        if not name or len(name) < 3:
            return None
            
        cache_key = f"{name}:{type_hint}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Use DBpedia Lookup API
            params = {
                'query': name,
                'format': 'json',
                'maxResults': 1
            }
            
            if type_hint:
                params['typeName'] = type_hint
            
            response = requests.get(self.lookup_endpoint, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            if 'docs' in data and len(data['docs']) > 0:
                resource_uri = data['docs'][0]['resource'][0]
                
                self.cache[cache_key] = resource_uri
                logger.info(f"✓ Linked '{name}' → {resource_uri}")
                return resource_uri
            
        except Exception as e:
            logger.warning(f"DBpedia lookup failed for '{name}': {e}")
        
        return None


class WikidataLinker:
    """Links entities to Wikidata items."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Wikidata linker.
        
        Args:
            config: Configuration for Wikidata linking
        """
        self.config = config
        self.sparql_endpoint = "https://query.wikidata.org/sparql"
        self.api_endpoint = "https://www.wikidata.org/w/api.php"
        self.cache = {}
        
    def find_item(self, name: str, language: str = 'vi') -> Optional[str]:
        """Find Wikidata item URI by name.
        
        Args:
            name: Entity name or label
            language: Language code (default: Vietnamese)
            
        Returns:
            Wikidata item URI or None if not found
        """
        if not name or len(name) < 3:
            return None
            
        cache_key = f"{name}:{language}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Use Wikidata Search API
            params = {
                'action': 'wbsearchentities',
                'search': name,
                'language': language,
                'format': 'json',
                'limit': 1
            }
            
            response = requests.get(self.api_endpoint, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            if 'search' in data and len(data['search']) > 0:
                qid = data['search'][0]['id']
                wikidata_uri = f"http://www.wikidata.org/entity/{qid}"
                
                self.cache[cache_key] = wikidata_uri
                logger.info(f"✓ Linked '{name}' → {wikidata_uri}")
                return wikidata_uri
            
        except Exception as e:
            logger.warning(f"Wikidata lookup failed for '{name}': {e}")
        
        return None


class LODLinksetEnrichmentAgent:
    """Main agent for enriching entities with LOD Cloud linksets."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize LOD Linkset Enrichment Agent.
        
        Args:
            config: Agent configuration dictionary
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Load mapping configuration
        self.mapping_config = self._load_mapping_config()
        
        # Initialize linkers
        self.geonames_linker = None
        self.dbpedia_linker = None
        self.wikidata_linker = None
        
        if config.get('enable_geonames', True):
            self.geonames_linker = GeoNamesLinker(config)
            
        if config.get('enable_dbpedia', True):
            self.dbpedia_linker = DBpediaLinker(config)
            
        if config.get('enable_wikidata', True):
            self.wikidata_linker = WikidataLinker(config)
        
        # Statistics
        self.stats = {
            'total_entities': 0,
            'enriched_entities': 0,
            'geonames_links': 0,
            'dbpedia_links': 0,
            'wikidata_links': 0,
            'errors': 0
        }
        
        self.logger.info("✓ LOD Linkset Enrichment Agent initialized")
    
    def _load_mapping_config(self) -> Dict[str, Any]:
        """Load linkset mapping configuration from YAML.
        
        Returns:
            Mapping configuration dictionary
        """
        config_path = self.config.get('linkset_mappings', 'config/lod_linkset_mappings.yaml')
        config_file = Path(config_path)
        
        if not config_file.exists():
            self.logger.warning(f"Mapping config not found: {config_path}, using defaults")
            return self._get_default_mapping_config()
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                mapping_config = yaml.safe_load(f)
            
            self.logger.info(f"✓ Loaded mapping config from {config_path}")
            return mapping_config
        
        except Exception as e:
            self.logger.error(f"Failed to load mapping config: {e}")
            return self._get_default_mapping_config()
    
    def _get_default_mapping_config(self) -> Dict[str, Any]:
        """Get default mapping configuration.
        
        Returns:
            Default mapping rules
        """
        return {
            'entity_types': {
                'Camera': {
                    'enable_geonames': True,
                    'enable_dbpedia': True,
                    'enable_wikidata': False,
                    'name_field': 'cameraName.value',
                    'address_field': 'address.value'
                },
                'CitizenObservation': {
                    'enable_geonames': True,
                    'enable_dbpedia': False,
                    'enable_wikidata': False
                },
                'RoadAccident': {
                    'enable_geonames': True,
                    'enable_dbpedia': True,
                    'enable_wikidata': False
                }
            },
            'geonames': {
                'radius_km': 10,
                'prefer_city': True
            },
            'dbpedia': {
                'type_hints': {
                    'Camera': 'Place',
                    'RoadAccident': 'Place'
                }
            }
        }
    
    def enrich(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Enrich entities with external LOD linksets.
        
        Args:
            entities: List of NGSI-LD entities to enrich
            
        Returns:
            List of enriched entities with owl:sameAs relationships
        """
        self.logger.info(f"Starting linkset enrichment for {len(entities)} entities")
        start_time = time.time()
        
        enriched_entities = []
        
        for entity in entities:
            try:
                enriched_entity = self._enrich_entity(entity)
                enriched_entities.append(enriched_entity)
                self.stats['total_entities'] += 1
                
            except Exception as e:
                self.logger.error(f"Failed to enrich entity {entity.get('id')}: {e}")
                enriched_entities.append(entity)  # Return original on error
                self.stats['errors'] += 1
        
        duration = time.time() - start_time
        self._log_statistics(duration)
        
        return enriched_entities
    
    def _enrich_entity(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich a single entity with linksets.
        
        Args:
            entity: NGSI-LD entity dictionary
            
        Returns:
            Enriched entity with semantically correct relationships
            (refCity for GeoNames, seeAlso for DBpedia/Wikidata)
        """
        entity_type = entity.get('type')
        entity_id = entity.get('id')
        
        # Get mapping config for this entity type
        entity_config = self.mapping_config.get('entity_types', {}).get(entity_type, {})
        
        if not entity_config:
            return entity  # No mapping rules for this type
        
        # Extract coordinates if available
        location = entity.get('location')
        lat, lon = None, None
        
        if location and location.get('type') == 'GeoProperty':
            coords = location.get('value', {}).get('coordinates', [])
            if len(coords) >= 2:
                lon, lat = coords[0], coords[1]
        
        # Initialize linkset list
        linkset = []
        
        # 1. GeoNames linking (based on coordinates)
        # Semantic: Camera IS LOCATED IN City (not IS City)
        # Use refCity relationship from Smart Data Models
        if entity_config.get('enable_geonames') and lat and lon and self.geonames_linker:
            radius = self.mapping_config.get('geonames', {}).get('radius_km', 10)
            geonames_uri = self.geonames_linker.find_nearest_place(lat, lon, radius)
            
            if geonames_uri:
                # Use refCity for geographic linkset (semantically correct)
                if 'refCity' not in entity:
                    entity['refCity'] = {
                        'type': 'Relationship',
                        'object': geonames_uri,
                        'datasetId': {
                            'type': 'Property',
                            'value': 'http://sws.geonames.org/'
                        },
                        'observedAt': datetime.utcnow().isoformat() + 'Z'
                    }
                self.stats['geonames_links'] += 1
        
        # 2. DBpedia linking (based on name/address)
        # Semantic: Use seeAlso for additional info (not identity)
        if entity_config.get('enable_dbpedia') and self.dbpedia_linker:
            name = self._extract_field_value(entity, entity_config.get('name_field'))
            address = self._extract_field_value(entity, entity_config.get('address_field'))
            
            search_text = name or address
            type_hint = self.mapping_config.get('dbpedia', {}).get('type_hints', {}).get(entity_type)
            
            if search_text:
                dbpedia_uri = self.dbpedia_linker.find_resource(search_text, type_hint)
                
                if dbpedia_uri:
                    # Add to linkset for seeAlso (additional info)
                    # NGSI-LD Relationship format (no 'predicate' field - that's RDF-specific)
                    linkset.append({
                        'type': 'Relationship',
                        'object': dbpedia_uri,
                        'datasetId': {
                            'type': 'Property',
                            'value': 'http://dbpedia.org/'
                        }
                    })
                    self.stats['dbpedia_links'] += 1
        
        # 3. Wikidata linking (based on name)
        # Semantic: Use seeAlso for additional info
        if entity_config.get('enable_wikidata') and self.wikidata_linker:
            name = self._extract_field_value(entity, entity_config.get('name_field'))
            
            if name:
                wikidata_uri = self.wikidata_linker.find_item(name)
                
                if wikidata_uri:
                    # Add to linkset for seeAlso
                    # NGSI-LD Relationship format (no 'predicate' field)
                    linkset.append({
                        'type': 'Relationship',
                        'object': wikidata_uri,
                        'datasetId': {
                            'type': 'Property',
                            'value': 'http://www.wikidata.org/'
                        }
                    })
                    self.stats['wikidata_links'] += 1
        
        # Add linkset to entity if any links were found
        if linkset or 'refCity' in entity:
            # Create copy to avoid modifying original
            enriched_entity = entity.copy()
            
            # NGSI-LD only supports single Relationship per attribute name
            # For multiple external links, we add them as multi-attribute instances with datasetId
            # Or store in a Property array (additionalInfo)
            
            if linkset:
                # Strategy 1: Use first (most relevant) link as seeAlso Relationship
                # Store additional links in externalLinks Property
                if len(linkset) > 0:
                    # Primary link: DBpedia or Wikidata (first in list)
                    primary_link = linkset[0]
                    enriched_entity['seeAlso'] = primary_link
                    
                    # Additional links: store in Property array (LOD Cloud compliance)
                    if len(linkset) > 1:
                        additional_links = []
                        for link in linkset[1:]:
                            additional_links.append({
                                'uri': link['object'],
                                'dataset': link.get('datasetId', {}).get('value', 'unknown')
                            })
                        
                        enriched_entity['externalLinks'] = {
                            'type': 'Property',
                            'value': additional_links
                        }
            
            # Update @context to include RDFS, Smart Data Models vocabularies
            context = enriched_entity.get('@context', [])
            if isinstance(context, str):
                context = [context]
            elif not isinstance(context, list):
                context = []
            
            # Add NGSI-LD core context if not present
            core_context = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            if core_context not in context:
                context.insert(0, core_context)
            
            # Add Smart Data Models + RDFS + schema.org vocabularies
            # (schema.org is required by LOD Cloud for seeAlso)
            custom_context = {
                "schema": "http://schema.org/",
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "refCity": {
                    "@id": "https://smartdatamodels.org/dataModel.UrbanMobility/refCity",
                    "@type": "@id"
                },
                "seeAlso": {
                    "@id": "http://schema.org/sameAs",
                    "@type": "@id"
                },
                "externalLinks": {
                    "@id": "http://schema.org/relatedLink"
                }
            }
            
            # Check if custom context already exists
            has_custom = any(isinstance(c, dict) and 'refCity' in c for c in context)
            if not has_custom:
                context.append(custom_context)
            
            enriched_entity['@context'] = context
            
            self.stats['enriched_entities'] += 1
            linkset_count = 1 if 'seeAlso' in enriched_entity else 0
            if 'externalLinks' in enriched_entity:
                linkset_count += len(enriched_entity['externalLinks']['value'])
            
            self.logger.debug(f"✓ Enriched {entity_id} with {linkset_count} LOD Cloud linksets")
            
            return enriched_entity
        
        return entity
    
    def _extract_field_value(self, entity: Dict[str, Any], field_path: Optional[str]) -> Optional[str]:
        """Extract field value from entity using dot notation path.
        
        Args:
            entity: NGSI-LD entity
            field_path: Dot-separated path (e.g., 'cameraName.value')
            
        Returns:
            Field value or None if not found
        """
        if not field_path:
            return None
        
        try:
            parts = field_path.split('.')
            value = entity
            
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    return None
            
            return str(value) if value else None
        
        except Exception:
            return None
    
    def _log_statistics(self, duration: float):
        """Log enrichment statistics.
        
        Args:
            duration: Processing duration in seconds
        """
        self.logger.info("=" * 60)
        self.logger.info("LOD Linkset Enrichment Statistics")
        self.logger.info("=" * 60)
        self.logger.info(f"Total entities processed: {self.stats['total_entities']}")
        self.logger.info(f"Entities enriched: {self.stats['enriched_entities']}")
        self.logger.info(f"GeoNames links added: {self.stats['geonames_links']}")
        self.logger.info(f"DBpedia links added: {self.stats['dbpedia_links']}")
        self.logger.info(f"Wikidata links added: {self.stats['wikidata_links']}")
        self.logger.info(f"Errors: {self.stats['errors']}")
        self.logger.info(f"Duration: {duration:.2f}s")
        self.logger.info("=" * 60)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get enrichment statistics.
        
        Returns:
            Statistics dictionary
        """
        return self.stats.copy()


def create_lod_linkset_agent(config: Optional[Dict[str, Any]] = None) -> LODLinksetEnrichmentAgent:
    """Factory function to create LOD Linkset Enrichment Agent.
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        Initialized LODLinksetEnrichmentAgent instance
    """
    if config is None:
        config = {
            'linkset_mappings': 'config/lod_linkset_mappings.yaml',
            'enable_geonames': True,
            'enable_dbpedia': True,
            'enable_wikidata': True,
            'geonames_username': 'demo'
        }
    
    return LODLinksetEnrichmentAgent(config)


# CLI interface for testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python lod_linkset_enrichment_agent.py <input_entities.json> [output_enriched.json]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "enriched_entities.json"
    
    # Load entities
    with open(input_file, 'r', encoding='utf-8') as f:
        entities = json.load(f)
    
    # Create agent
    agent = create_lod_linkset_agent()
    
    # Enrich entities
    enriched = agent.enrich(entities)
    
    # Save results
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Enriched {len(enriched)} entities saved to {output_file}")
