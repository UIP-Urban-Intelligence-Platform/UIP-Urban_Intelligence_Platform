# Transformation API Reference - PRODUCTION READY

Complete guide for data transformation: Raw JSON → NGSI-LD → SOSA/SSN → RDF.

## Transformation Pipeline

```
Raw Camera Data → NGSI-LD Entity → SOSA Sensor → RDF Triples
```

## Transformation Agents

### NGSI-LD Transformer
Converts raw observations to NGSI-LD format.

```python
from src.agents.transformation.ngsi_ld_transformer_agent import NGSILDTransformerAgent

transformer = NGSILDTransformerAgent(config={"enabled": True})
ngsi_ld_entity = transformer.transform(raw_observation)
```

**Input:**
```python
raw = {"id": "CAM001", "name": "Camera 1", "latitude": 10.762, "longitude": 106.660}
```

**Output Format:**
```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:Camera:CAM001",
  "type": "Camera",
  "name": {
    "type": "Property",
    "value": "Camera 1"
  },
  "location": {
    "type": "GeoProperty",
    "value": {"type": "Point", "coordinates": [106.660, 10.762]}
  }
}
```

### SOSA Mapper
Maps NGSI-LD entities to SOSA/SSN ontology.

```python
from src.agents.transformation.sosa_ssn_mapper_agent import SOSAMapperAgent

mapper = SOSAMapperAgent(config={"enabled": True})
sosa_data = mapper.map_to_sosa(ngsi_ld_entity)
```

**SOSA Mapping:**
- `sosa:Sensor` → Camera devices
- `sosa:Observation` → Traffic measurements
- `sosa:ObservableProperty` → Traffic flow, speed, density

**Output (JSON-LD):**
```json
{
  "@id": "urn:ngsi-ld:Observation:OBS001",
  "@type": "sosa:Observation",
  "sosa:madeBySensor": {"@id": "urn:ngsi-ld:Camera:CAM001"},
  "sosa:observedProperty": {"@id": "http://example.org/traffic#TrafficFlow"},
  "sosa:resultTime": "2024-01-15T10:30:00Z",
  "sosa:hasSimpleResult": 120,
  "qudt:unit": {"@id": "http://qudt.org/vocab/unit/NUM-PER-HR"}
}
```

### RDF Conversion with rdflib

```python
from rdflib import Graph, Namespace, Literal, URIRef
from rdflib.namespace import RDF, RDFS

g = Graph()
SOSA = Namespace("http://www.w3.org/ns/sosa/")

camera_uri = URIRef("urn:ngsi-ld:Camera:CAM001")
g.add((camera_uri, RDF.type, SOSA.Sensor))
g.add((camera_uri, RDFS.label, Literal("Camera 1")))

# Serialize
turtle = g.serialize(format='turtle')
```

**Output (Turtle):**
```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<urn:ngsi-ld:Camera:CAM001> a sosa:Sensor ;
    rdfs:label "Camera 1" .
```

## Complete Transformation Pipeline

```python
# 1. Raw data
raw = {"id": "CAM001", "name": "Camera 1", "latitude": 10.762, "longitude": 106.660}

# 2. Transform to NGSI-LD
transformer = NGSILDTransformerAgent(config={"enabled": True})
ngsi_ld = transformer.transform(raw)

# 3. Map to SOSA
mapper = SOSAMapperAgent(config={"enabled": True})
sosa = mapper.map_to_sosa(ngsi_ld)

# 4. Convert to RDF
g = Graph()
# Add SOSA data to graph
turtle_output = g.serialize(format='turtle')
```

## Validation

### SHACL Validation
```python
from pyshacl import validate

conforms, results_graph, results_text = validate(
    data_graph=g,
    shacl_graph=shapes_graph,
    inference='rdfs'
)

if not conforms:
    print(f"Validation failed: {results_text}")
```

## Configuration

```yaml
# config/ngsi_ld_mappings.yaml
camera:
  entity_type: Camera
  id_prefix: urn:ngsi-ld:Camera:
  properties:
    - name: name
      type: Property
    - name: location
      type: GeoProperty

# config/sosa_mappings.yaml
sensor_mappings:
  Camera:
    type: sosa:Sensor
    observable_properties:
      - http://example.org/traffic#TrafficFlow
      - http://example.org/traffic#AverageSpeed
```

## Performance Tips

1. **Batch Transformations**: Process multiple entities together
2. **Cache Namespaces**: Reuse Namespace objects
3. **Parallel Processing**: Transform entities in parallel

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(transformer.transform, cameras)
```
