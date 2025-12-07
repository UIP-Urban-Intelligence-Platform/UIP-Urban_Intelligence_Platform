-- SPDX-License-Identifier: MIT
-- Copyright (c) 2025 UIP Team. All rights reserved.
--
-- UIP - Urban Intelligence Platform
-- https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
--
-- Module: scripts/database/init-stellio-dbs-postgis.sql
-- Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
-- Created: 2025-11-29
-- Version: 1.0.0
-- Description: PostgreSQL init script with PostGIS (TimescaleDB optional)
--
-- Purpose:
-- PostgreSQL init script for Stellio databases
-- Creates separate databases for each Stellio microservice with PostGIS extension
-- Creates dummy create_hypertable function to skip TimescaleDB requirement

-- Create stellio_search database
CREATE DATABASE stellio_search;
GRANT ALL PRIVILEGES ON DATABASE stellio_search TO stellio;

-- Create stellio_subscription database  
CREATE DATABASE stellio_subscription;
GRANT ALL PRIVILEGES ON DATABASE stellio_subscription TO stellio;

-- Enable PostGIS extension and create dummy create_hypertable in all databases
\c stellio_test
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE OR REPLACE FUNCTION create_hypertable(relation REGCLASS, time_column_name NAME, chunk_time_interval INTERVAL DEFAULT NULL) 
RETURNS TABLE(hypertable_id INT, schema_name NAME, table_name NAME, created BOOL) AS $$
BEGIN
    RAISE NOTICE 'Dummy create_hypertable called for % (TimescaleDB not available)', relation;
    RETURN QUERY SELECT 1, CAST(split_part(relation::text, '.', 1) AS NAME), CAST(split_part(relation::text, '.', 2) AS NAME), TRUE;
END;
$$ LANGUAGE plpgsql;

\c stellio_search
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE OR REPLACE FUNCTION create_hypertable(relation REGCLASS, time_column_name NAME, chunk_time_interval INTERVAL DEFAULT NULL) 
RETURNS TABLE(hypertable_id INT, schema_name NAME, table_name NAME, created BOOL) AS $$
BEGIN
    RAISE NOTICE 'Dummy create_hypertable called for % (TimescaleDB not available)', relation;
    RETURN QUERY SELECT 1, CAST(split_part(relation::text, '.', 1) AS NAME), CAST(split_part(relation::text, '.', 2) AS NAME), TRUE;
END;
$$ LANGUAGE plpgsql;

\c stellio_subscription
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE OR REPLACE FUNCTION create_hypertable(relation REGCLASS, time_column_name NAME, chunk_time_interval INTERVAL DEFAULT NULL) 
RETURNS TABLE(hypertable_id INT, schema_name NAME, table_name NAME, created BOOL) AS $$
BEGIN
    RAISE NOTICE 'Dummy create_hypertable called for % (TimescaleDB not available)', relation;
    RETURN QUERY SELECT 1, CAST(split_part(relation::text, '.', 1) AS NAME), CAST(split_part(relation::text, '.', 2) AS NAME), TRUE;
END;
$$ LANGUAGE plpgsql;
