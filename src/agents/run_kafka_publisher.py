#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kafka Entity Publisher Runner Script.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.run_kafka_publisher
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Simple runner script for KafkaEntityPublisherAgent.
    Designed to run inside Docker network where kafka:9092 is resolvable.

Usage:
    python run_kafka_publisher.py <entities_file>

Example:
    python run_kafka_publisher.py data/ngsi_ld_entities.json
"""

import json
import sys

from kafka_entity_publisher_agent import KafkaEntityPublisherAgent

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_kafka_publisher.py <entities_file>")
        sys.exit(1)

    entities_file = sys.argv[1]

    config = {
        "kafka_bootstrap_servers": "kafka:9092",  # Docker network hostname
        "kafka_topic": "cim.entity._CatchAll",
    }

    agent = KafkaEntityPublisherAgent(config)
    result = agent.run({"entities_file": entities_file})

    print(json.dumps(result, indent=2))
    sys.exit(0 if result.get("success") else 1)
