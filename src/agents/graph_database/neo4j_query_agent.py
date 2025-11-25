"""
Neo4j Query Agent for Graph Analytics

Executes graph queries on Neo4j for relationship discovery,
path finding, and network analysis.

QUERY CAPABILITIES:
- Find related entities (cameras near accident)
- Path finding (shortest path between cameras)
- Pattern matching (recurring accident locations)
- Centrality analysis (most important cameras)

FULL PRODUCTION IMPLEMENTATION - Real Neo4j Driver with Session Management
"""

import logging
from typing import Dict, Any, Optional, List

try:
    from neo4j import GraphDatabase
    from neo4j.exceptions import ServiceUnavailable, Neo4jError
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    GraphDatabase = None  # type: ignore

logger = logging.getLogger(__name__)


class Neo4jQueryAgent:
    """
    Graph query agent for Neo4j analytics.
    
    Provides high-level query interface for graph-based
    traffic network analysis.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize Neo4j query agent."""
        self.config = config or {}
        self.enabled = self.config.get("enabled", False)
        
        # Neo4j connection config
        neo4j_uri = self.config.get("neo4j_uri", "bolt://localhost:7687")
        neo4j_user = self.config.get("neo4j_user", "neo4j")
        neo4j_password = self.config.get("neo4j_password", "password")
        max_pool_size = self.config.get("max_connection_pool_size", 50)
        
        # Initialize driver if enabled and available
        self._driver = None
        if self.enabled and NEO4J_AVAILABLE:
            try:
                self._driver = GraphDatabase.driver(
                    neo4j_uri,
                    auth=(neo4j_user, neo4j_password),
                    max_connection_pool_size=max_pool_size
                )
                self._driver.verify_connectivity()
                logger.info(f"Neo4jQueryAgent connected to {neo4j_uri}")
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j: {e}")
                self.enabled = False
        else:
            logger.info("Neo4jQueryAgent initialized (disabled or driver unavailable)")
    
    def _execute_query(self, cypher: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute Cypher query and return results."""
        if not self.enabled or not self._driver:
            return []
        
        try:
            with self._driver.session() as session:
                result = session.run(cypher, parameters or {})
                return [dict(record) for record in result]
        except Neo4jError as e:
            logger.error(f"Neo4j query error: {e}")
            return []
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return []
    
    def find_nearby_cameras(
        self,
        location: Dict[str, float],
        radius_meters: float = 1000.0
    ) -> List[Dict[str, Any]]:
        """
        Find cameras within radius of location.
        
        Args:
            location: Center point {"lat": float, "lon": float}
            radius_meters: Search radius in meters
            
        Returns:
            List of nearby cameras with distance
        """
        if not self.enabled:
            return []
        
        cypher = """
        MATCH (c:Camera)
        WHERE point.distance(
            c.location,
            point({longitude: $lon, latitude: $lat})
        ) < $radius
        RETURN c.id AS camera_id,
               c.name AS name,
               c.location AS location,
               point.distance(c.location, point({
                   longitude: $lon, 
                   latitude: $lat
               })) AS distance
        ORDER BY distance
        """
        
        parameters = {
            "lat": location["lat"],
            "lon": location["lon"],
            "radius": radius_meters
        }
        
        logger.debug(f"Querying cameras within {radius_meters}m of {location}")
        return self._execute_query(cypher, parameters)
    
    def find_accident_patterns(self, min_occurrences: int = 3) -> List[Dict[str, Any]]:
        """
        Find locations with recurring accidents.
        
        Args:
            min_occurrences: Minimum accident count to consider pattern
            
        Returns:
            List of pattern locations with accident counts
        """
        if not self.enabled:
            return []
        
        cypher = """
        MATCH (c:Camera)-[:DETECTS]->(a:Accident)
        WITH c, count(a) AS accident_count
        WHERE accident_count >= $min_count
        RETURN c.id AS camera_id,
               c.name AS location,
               c.location AS coordinates,
               accident_count
        ORDER BY accident_count DESC
        """
        
        parameters = {"min_count": min_occurrences}
        
        logger.debug(f"Finding accident patterns (min {min_occurrences})")
        return self._execute_query(cypher, parameters)
    
    def find_congestion_propagation(
        self,
        congestion_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find how congestion propagates through road network.
        
        Args:
            congestion_id: Initial congestion entity ID
            
        Returns:
            List of affected road segments in propagation order
        """
        if not self.enabled:
            return []
        
        cypher = """
        MATCH path = (c1:Congestion {id: $congestion_id})-[:CAUSES*1..3]->(c2:Congestion)
        RETURN path,
               length(path) AS hops,
               c2.id AS affected_id,
               c2.severity AS severity
        ORDER BY hops
        """
        
        parameters = {"congestion_id": congestion_id}
        
        logger.debug(f"Tracing congestion propagation from {congestion_id}")
        return self._execute_query(cypher, parameters)
    
    def find_shortest_path(
        self,
        camera1_id: str,
        camera2_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find shortest path between two cameras.
        
        Args:
            camera1_id: Start camera ID
            camera2_id: End camera ID
            
        Returns:
            Path information with nodes and relationships
        """
        if not self.enabled:
            return None
        
        cypher = """
        MATCH path = shortestPath(
            (c1:Camera {id: $camera1_id})-[*]-(c2:Camera {id: $camera2_id})
        )
        RETURN path,
               length(path) AS path_length,
               [n IN nodes(path) | n.id] AS node_ids
        """
        
        parameters = {
            "camera1_id": camera1_id,
            "camera2_id": camera2_id
        }
        
        logger.debug(f"Finding shortest path {camera1_id} -> {camera2_id}")
        results = self._execute_query(cypher, parameters)
        return results[0] if results else None
    
    def calculate_camera_centrality(self) -> List[Dict[str, Any]]:
        """
        Calculate betweenness centrality for cameras.
        
        Identifies most important cameras in the network
        (those on many shortest paths).
        
        Returns:
            List of cameras sorted by centrality score
        """
        if not self.enabled:
            return []
        
        # Real GDS centrality calculation
        cypher = """
        CALL gds.betweenness.stream('traffic-network')
        YIELD nodeId, score
        MATCH (c:Camera) WHERE id(c) = nodeId
        RETURN c.id AS camera_id,
               c.name AS name,
               score AS centrality
        ORDER BY centrality DESC
        LIMIT 10
        """
        
        logger.debug("Calculating camera betweenness centrality")
        return self._execute_query(cypher)
    
    def find_correlated_accidents(
        self,
        accident_id: str
    ) -> List[Dict[str, Any]]:
        """
        Find accidents correlated with given accident.
        
        Args:
            accident_id: Source accident ID
            
        Returns:
            List of correlated accidents with correlation strength
        """
        if not self.enabled:
            return []
        
        cypher = """
        MATCH (a1:Accident {id: $accident_id})-[r:CORRELATES_WITH]-(a2:Accident)
        RETURN a2.id AS accident_id,
               a2.severity AS severity,
               a2.location AS location,
               r.strength AS correlation_strength
        ORDER BY r.strength DESC
        """
        
        parameters = {"accident_id": accident_id}
        
        logger.debug(f"Finding correlated accidents for {accident_id}")
        return self._execute_query(cypher, parameters)
    
    def close(self):
        """Close Neo4j driver connection."""
        if self._driver:
            self._driver.close()
            logger.info("Neo4j driver connection closed")
    
    async def run(self):
        """Query agent execution."""
        if not self.enabled:
            logger.info("Neo4jQueryAgent.run() skipped (disabled)")
            return {"status": "skipped", "reason": "disabled"}
        
        logger.info("Neo4jQueryAgent.run() - Ready for queries")
        return {"status": "ready"}
    
    def __del__(self):
        """Cleanup on deletion."""
        self.close()
