# 📖 Glossary

Technical terms and definitions used in Builder Layer End.

---

## A

### Agent
An autonomous software component that performs a specific task in the data pipeline. Agents are self-contained, scalable, and communicate via message queues.

### Air Quality Index (AQI)
A numerical scale used to communicate how polluted the air currently is. Calculated from pollutant concentrations (PM2.5, PM10, O3, NO2, CO, SO2).

### APOC
**A**wesome **P**rocedures **O**n **C**ypher - A library of Neo4j procedures and functions.

### API Gateway
A server that acts as an entry point for API requests, handling routing, authentication, and load balancing.

---

## B

### Bolt
Neo4j's binary protocol for database communication, typically on port 7687.

### Context Broker
A component that manages context information (entities and their properties) following the NGSI-LD specification.

---

## C

### Congestion Level
A metric (0.0-1.0) indicating traffic density. 0 = free flow, 1 = complete standstill.

### Content Negotiation
The mechanism by which a server selects the appropriate representation of a resource based on client preferences (Accept headers).

### Cypher
Neo4j's graph query language for creating, reading, updating, and deleting graph data.

---

## D

### DBpedia
A structured dataset extracted from Wikipedia, part of the Linked Open Data cloud.

### Dereferencing
The process of retrieving information about a resource when its URI is accessed (HTTP 303 redirects).

---

## E

### Entity
In NGSI-LD, a thing or concept that has an identifier, type, and attributes (properties and relationships).

### Event Sourcing
A pattern where state changes are stored as a sequence of events rather than just the current state.

---

## F

### Fuseki
Apache Jena Fuseki - A SPARQL server providing RDF data services over HTTP.

### FIWARE
An open-source initiative providing smart solution components, including the NGSI-LD specification.

---

## G

### GeoProperty
In NGSI-LD, a property whose value is a geographic location (GeoJSON format).

### Graph Database
A database that uses graph structures (nodes, edges, properties) to store, map, and query relationships.

---

## H

### Healthcheck
A mechanism to verify that a service is running correctly and can handle requests.

---

## I

### Ingestion
The process of collecting raw data from external sources into the pipeline.

### Inference
The process of deriving new knowledge from existing data using logical rules (reasoning).

---

## J

### JSON-LD
JSON for Linking Data - A method of encoding Linked Data using JSON syntax.

---

## K

### Kafka
Apache Kafka - A distributed event streaming platform for high-throughput, fault-tolerant messaging.

### KRaft
Kafka Raft - Kafka's built-in consensus protocol, replacing ZooKeeper for cluster coordination.

---

## L

### Linked Data
A method of publishing structured data so that it can be interlinked and become more useful through semantic queries.

### LOD (Linked Open Data)
Linked Data that is released under an open license, permitting reuse.

### LOD Cloud
The collection of interlinked datasets published as Linked Open Data on the web.

---

## M

### Message Queue
A form of asynchronous communication where messages are stored until processed.

### Middleware
Software that acts as a bridge between an operating system or database and applications.

---

## N

### NGSI-LD
Next Generation Service Interface - Linked Data. An API standard for context information management based on JSON-LD.

### Node
In graph databases, an entity that can have properties and relationships.

---

## O

### Observation
In SOSA ontology, an act of observing a property of a feature of interest.

### Ontology
A formal representation of knowledge as a set of concepts within a domain.

### Orchestrator
A component that coordinates the execution of multiple agents/services in a workflow.

---

## P

### Pattern Recognition
The automated identification of patterns and regularities in data.

### Property
In NGSI-LD, an attribute of an entity that holds a value.

### Pub/Sub
Publish-Subscribe pattern - A messaging pattern where publishers send messages to topics without knowing subscribers.

---

## R

### RDF (Resource Description Framework)
A standard model for data interchange on the Web, expressing data as subject-predicate-object triples.

### Reasoner
A software component that derives logical inferences from a set of asserted facts or axioms.

### Relationship
In NGSI-LD, an attribute that links an entity to another entity.

---

## S

### Sensor
A device that detects events or changes in the environment and sends the information to other electronics.

### SOSA (Sensor, Observation, Sample, and Actuator)
A lightweight ontology for sensors and observations.

### SPARQL
SPARQL Protocol and RDF Query Language - A query language for RDF data.

### SSN (Semantic Sensor Network)
An ontology that describes sensors, actuators, and their observations.

### Stellio
An NGSI-LD compliant context broker implementation.

### Subscription
In NGSI-LD, a mechanism to receive notifications when entity attributes change.

---

## T

### TimescaleDB
An open-source time-series database built on PostgreSQL.

### Triple
An RDF statement consisting of subject, predicate, and object.

### Triplestore
A database optimized for storing and retrieving RDF triples.

---

## U

### URI (Uniform Resource Identifier)
A string that identifies a resource on the web.

### URN (Uniform Resource Name)
A URI that identifies a resource by name in a particular namespace.

---

## V

### VoID (Vocabulary of Interlinked Datasets)
An RDF vocabulary for expressing metadata about RDF datasets.

---

## W

### WebSocket
A communication protocol providing full-duplex communication channels over a single TCP connection.

### Wikidata
A free knowledge base that can be read and edited by humans and machines.

### Workflow
A sequence of operations or tasks that processes data through multiple stages.

---

## Y

### YOLOX
An anchor-free object detection model used for computer vision in traffic analysis.

---

## Z

### ZooKeeper
A centralized service for maintaining configuration information, naming, and synchronization (used by Kafka).

---

## 📚 Related Pages

- [[System-Architecture]] - Architecture overview
- [[Multi-Agent-System]] - Agent documentation
- [[Technology-Stack]] - Technologies used
