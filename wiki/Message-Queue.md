<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Message-Queue.md
Module: Message Queue Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to message queue and event-driven architecture in UIP.
============================================================================
-->

# 📬 Message Queue

Complete guide to message queue and event-driven architecture in UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform uses a message queue architecture for:

- 🔄 **Asynchronous Processing** - Decouple producers and consumers
- 📈 **Scalability** - Handle traffic spikes
- 🔁 **Reliability** - Message persistence and retry
- 🎯 **Event-Driven** - React to real-time events

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MESSAGE QUEUE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRODUCERS                    MESSAGE BROKER                 CONSUMERS    │
│                                                                             │
│  ┌─────────────┐              ┌─────────────────┐          ┌─────────────┐ │
│  │ CV Agent    │──────────┬──▶│                 │──────┬──▶│ Congestion  │ │
│  └─────────────┘          │   │                 │      │   │ Agent       │ │
│                           │   │                 │      │   └─────────────┘ │
│  ┌─────────────┐          │   │     Redis       │      │                   │
│  │ Weather     │──────────┼──▶│     Streams     │──────┼──▶┌─────────────┐ │
│  │ Agent       │          │   │                 │      │   │ Alert       │ │
│  └─────────────┘          │   │      or         │      │   │ Dispatcher  │ │
│                           │   │                 │      │   └─────────────┘ │
│  ┌─────────────┐          │   │   RabbitMQ      │      │                   │
│  │ Stellio     │──────────┼──▶│                 │──────┼──▶┌─────────────┐ │
│  │ Webhooks    │          │   │                 │      │   │ Analytics   │ │
│  └─────────────┘          │   │                 │      │   │ Agent       │ │
│                           │   │                 │      │   └─────────────┘ │
│  ┌─────────────┐          │   │                 │      │                   │
│  │ API Gateway │──────────┴──▶│                 │──────┴──▶┌─────────────┐ │
│  └─────────────┘              └─────────────────┘          │ State       │ │
│                                                            │ Updater     │ │
│                                                            └─────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Message Brokers

### Redis Streams (Default)

Redis Streams is the default message broker for UIP - Urban Intelligence Platform:

**Advantages:**
- Fast in-memory processing
- Built-in persistence
- Consumer groups support
- Low latency

**Configuration (`config/cache_config.yaml`):**

```yaml
redis:
  host: localhost
  port: 6379
  db: 0
  
streams:
  traffic_events:
    maxlen: 10000
    consumer_group: "traffic_processors"
  alerts:
    maxlen: 5000
    consumer_group: "alert_handlers"
  observations:
    maxlen: 50000
    consumer_group: "observation_processors"
```

### RabbitMQ (Alternative)

For enterprise deployments with advanced routing:

```yaml
rabbitmq:
  host: localhost
  port: 5672
  user: guest
  password: guest
  vhost: /uip
  
exchanges:
  - name: traffic.events
    type: topic
    durable: true
  - name: alerts.fanout
    type: fanout
    durable: true
    
queues:
  - name: congestion.detection
    bindings:
      - exchange: traffic.events
        routing_key: "traffic.observation.*"
  - name: alert.notifications
    bindings:
      - exchange: alerts.fanout
```

---

## 📋 Message Types

### Traffic Observation Message

```json
{
  "type": "traffic.observation",
  "timestamp": "2025-11-29T10:30:00Z",
  "source": "cv_agent",
  "payload": {
    "camera_id": "TTH-406",
    "vehicle_count": 45,
    "congestion_level": 0.35,
    "average_speed": 25.5,
    "location": {
      "lat": 10.8231,
      "lng": 106.6297
    }
  },
  "metadata": {
    "processing_time_ms": 150,
    "confidence": 0.92
  }
}
```

### Alert Message

```json
{
  "type": "alert.congestion",
  "timestamp": "2025-11-29T10:30:00Z",
  "priority": "high",
  "payload": {
    "alert_id": "alert-2025-001",
    "camera_id": "TTH-406",
    "severity": "warning",
    "message": "High congestion detected",
    "congestion_level": 0.85,
    "recommended_actions": [
      "Reroute traffic via alternative roads",
      "Dispatch traffic officers"
    ]
  }
}
```

### State Update Message

```json
{
  "type": "state.update",
  "timestamp": "2025-11-29T10:30:00Z",
  "entity_type": "Camera",
  "entity_id": "urn:ngsi-ld:Camera:TTH-406",
  "operation": "UPDATE",
  "payload": {
    "status": "active",
    "lastObservation": "2025-11-29T10:30:00Z"
  }
}
```

---

## 🛠️ Python Implementation

### Producer Example

```python
# src/utils/message_producer.py

import redis
import json
from datetime import datetime
from typing import Dict, Any

class MessageProducer:
    """Redis Streams message producer."""
    
    def __init__(self, host: str = "localhost", port: int = 6379):
        self.redis = redis.Redis(host=host, port=port, decode_responses=True)
    
    def publish(self, stream: str, message: Dict[str, Any]) -> str:
        """Publish message to stream."""
        # Add timestamp if not present
        if "timestamp" not in message:
            message["timestamp"] = datetime.utcnow().isoformat()
        
        # Serialize and publish
        message_id = self.redis.xadd(
            stream,
            {"data": json.dumps(message)},
            maxlen=10000  # Trim old messages
        )
        return message_id
    
    def publish_traffic_observation(
        self,
        camera_id: str,
        vehicle_count: int,
        congestion_level: float,
        average_speed: float
    ) -> str:
        """Publish traffic observation."""
        message = {
            "type": "traffic.observation",
            "source": "cv_agent",
            "payload": {
                "camera_id": camera_id,
                "vehicle_count": vehicle_count,
                "congestion_level": congestion_level,
                "average_speed": average_speed
            }
        }
        return self.publish("traffic_events", message)
    
    def publish_alert(
        self,
        alert_id: str,
        severity: str,
        message_text: str,
        **kwargs
    ) -> str:
        """Publish alert."""
        message = {
            "type": f"alert.{severity}",
            "priority": "high" if severity == "critical" else "normal",
            "payload": {
                "alert_id": alert_id,
                "severity": severity,
                "message": message_text,
                **kwargs
            }
        }
        return self.publish("alerts", message)
```

### Consumer Example

```python
# src/utils/message_consumer.py

import redis
import json
from typing import Callable, Dict, Any
import asyncio

class MessageConsumer:
    """Redis Streams message consumer."""
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        consumer_group: str = "default_group",
        consumer_name: str = "consumer_1"
    ):
        self.redis = redis.Redis(host=host, port=port, decode_responses=True)
        self.group = consumer_group
        self.consumer = consumer_name
        self.handlers: Dict[str, Callable] = {}
    
    def register_handler(self, message_type: str, handler: Callable):
        """Register message handler."""
        self.handlers[message_type] = handler
    
    def _ensure_group(self, stream: str):
        """Create consumer group if not exists."""
        try:
            self.redis.xgroup_create(stream, self.group, id="0", mkstream=True)
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
    
    async def consume(self, streams: list, block_ms: int = 1000):
        """Consume messages from streams."""
        for stream in streams:
            self._ensure_group(stream)
        
        stream_dict = {s: ">" for s in streams}
        
        while True:
            messages = self.redis.xreadgroup(
                self.group,
                self.consumer,
                stream_dict,
                count=10,
                block=block_ms
            )
            
            for stream, entries in messages:
                for message_id, data in entries:
                    try:
                        message = json.loads(data["data"])
                        await self._process_message(stream, message_id, message)
                        
                        # Acknowledge message
                        self.redis.xack(stream, self.group, message_id)
                    except Exception as e:
                        print(f"Error processing message: {e}")
    
    async def _process_message(
        self,
        stream: str,
        message_id: str,
        message: Dict[str, Any]
    ):
        """Process a single message."""
        message_type = message.get("type", "unknown")
        
        handler = self.handlers.get(message_type)
        if handler:
            if asyncio.iscoroutinefunction(handler):
                await handler(message)
            else:
                handler(message)
        else:
            print(f"No handler for message type: {message_type}")
```

### Usage Example

```python
# Example: Congestion Detection Consumer

import asyncio
from message_consumer import MessageConsumer

async def handle_traffic_observation(message: dict):
    """Handle traffic observation messages."""
    payload = message["payload"]
    
    if payload["congestion_level"] > 0.7:
        print(f"High congestion at {payload['camera_id']}")
        # Trigger alert
        producer = MessageProducer()
        producer.publish_alert(
            alert_id=f"alert-{payload['camera_id']}",
            severity="warning",
            message_text=f"Congestion level: {payload['congestion_level']:.0%}"
        )

async def main():
    consumer = MessageConsumer(
        consumer_group="congestion_detection",
        consumer_name="detector_1"
    )
    
    consumer.register_handler("traffic.observation", handle_traffic_observation)
    
    await consumer.consume(["traffic_events"])

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 📊 Event Types

| Event Type | Stream | Description |
|------------|--------|-------------|
| `traffic.observation` | traffic_events | New traffic observation |
| `traffic.congestion` | traffic_events | Congestion detected |
| `traffic.accident` | traffic_events | Accident detected |
| `alert.info` | alerts | Informational alert |
| `alert.warning` | alerts | Warning alert |
| `alert.critical` | alerts | Critical alert |
| `state.update` | state_updates | Entity state change |
| `entity.created` | entity_events | New entity created |
| `entity.updated` | entity_events | Entity updated |
| `entity.deleted` | entity_events | Entity deleted |

---

## 📈 Monitoring

### Stream Statistics

```python
def get_stream_stats(redis_client, stream: str) -> dict:
    """Get stream statistics."""
    info = redis_client.xinfo_stream(stream)
    return {
        "length": info["length"],
        "first_entry": info["first-entry"],
        "last_entry": info["last-entry"],
        "groups": redis_client.xinfo_groups(stream)
    }
```

### Consumer Lag

```python
def get_consumer_lag(redis_client, stream: str, group: str) -> dict:
    """Get consumer group lag."""
    pending = redis_client.xpending(stream, group)
    return {
        "pending_count": pending["pending"],
        "min_id": pending["min"],
        "max_id": pending["max"],
        "consumers": pending["consumers"]
    }
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Message Queue Settings
MQ_MAX_RETRIES=3
MQ_RETRY_DELAY=1000
MQ_BLOCK_TIMEOUT=5000
MQ_BATCH_SIZE=10
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: uip-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
```

---

## ✅ Best Practices

### 1. Idempotent Consumers

```python
def process_message(message: dict):
    """Idempotent message processing."""
    message_id = message.get("id")
    
    # Check if already processed
    if is_processed(message_id):
        return
    
    # Process message
    do_work(message)
    
    # Mark as processed
    mark_processed(message_id)
```

### 2. Dead Letter Queue

```python
async def consume_with_dlq(consumer: MessageConsumer, stream: str):
    """Consume with dead letter queue support."""
    max_retries = 3
    
    while True:
        messages = await consumer.read_pending(stream)
        
        for msg_id, msg, retry_count in messages:
            if retry_count >= max_retries:
                # Move to dead letter queue
                await consumer.move_to_dlq(stream, msg_id, msg)
            else:
                try:
                    await process(msg)
                    await consumer.ack(stream, msg_id)
                except Exception:
                    pass  # Will be retried
```

### 3. Graceful Shutdown

```python
import signal
import asyncio

class GracefulConsumer:
    def __init__(self):
        self.running = True
        signal.signal(signal.SIGTERM, self._shutdown)
        signal.signal(signal.SIGINT, self._shutdown)
    
    def _shutdown(self, signum, frame):
        print("Shutting down gracefully...")
        self.running = False
    
    async def run(self):
        while self.running:
            await self.process_batch()
        
        # Process remaining messages
        await self.drain()
```

---

## 🔗 Related Pages

- [[Monitoring]] - System monitoring
- [[Architecture]] - System architecture
- [[API-Reference]] - API documentation
- [[Docker-Setup]] - Docker configuration
- [[Scaling-Guide]] - Horizontal scaling

---

## 📚 References

- [Redis Streams](https://redis.io/docs/data-types/streams/)
- [RabbitMQ](https://www.rabbitmq.com/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Message Queue Patterns](https://www.enterpriseintegrationpatterns.com/)
