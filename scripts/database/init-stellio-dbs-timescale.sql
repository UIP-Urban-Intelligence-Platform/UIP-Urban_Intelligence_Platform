-- SPDX-License-Identifier: MIT
-- Copyright (c) 2025 UIP Team. All rights reserved.
--
-- UIP - Urban Intelligence Platform
-- https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
--
-- Module: scripts/database/init-stellio-dbs-timescale.sql
-- Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
-- Created: 2025-11-29
-- Version: 1.0.0
-- Description: Initialize Stellio databases with TimescaleDB extension
--
-- Initialize Stellio databases with TimescaleDB extension
-- Stellio requires TimescaleDB for time-series data hypertables

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stellio_search database for Stellio Search Service
SELECT 'CREATE DATABASE stellio_search'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stellio_search')\gexec

-- Create stellio_subscription database for Stellio Subscription Service  
SELECT 'CREATE DATABASE stellio_subscription'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stellio_subscription')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stellio_search TO stellio;
GRANT ALL PRIVILEGES ON DATABASE stellio_subscription TO stellio;

-- Connect to stellio_search and enable extensions
\c stellio_search
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to stellio_subscription and enable extensions
\c stellio_subscription
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Return to default database
\c stellio_test
