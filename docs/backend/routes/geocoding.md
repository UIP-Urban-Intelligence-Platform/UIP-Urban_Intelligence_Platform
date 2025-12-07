---
id: geocoding-routes
title: Geocoding Routes
sidebar_label: Geocoding
sidebar_position: 11
description: RESTful API endpoints for address-to-coordinate (forward) and coordinate-to-address (reverse) geocoding using Nominatim.
keywords: [geocoding, address, coordinates, nominatim, reverse-geocoding]
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: backend/routes/geocoding.md
Module: Backend Routes - Geocoding Routes
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Geocoding Routes documentation for RESTful API endpoints for forward
  and reverse geocoding using Nominatim.
============================================================================
-->

# Geocoding Routes

RESTful API endpoints for **address-to-coordinate** (forward) and **coordinate-to-address** (reverse) geocoding using Nominatim (OpenStreetMap).

## Base Path

```
/api/geocoding
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/forward` | Address to coordinates |
| GET | `/reverse` | Coordinates to address |
| GET | `/search` | Search locations |
| GET | `/autocomplete` | Address autocomplete |

## Endpoints

### GET /api/geocoding/forward

Convert address to coordinates (forward geocoding).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Address to geocode |
| `limit` | number | No | Max results (default: 5) |
| `bounds` | string | No | Bounding box filter |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "displayName": "123 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City",
      "latitude": 10.7731,
      "longitude": 106.7030,
      "type": "building",
      "confidence": 0.92,
      "boundingBox": [10.772, 106.702, 10.774, 106.704]
    }
  ]
}
```

---

### GET /api/geocoding/reverse

Convert coordinates to address (reverse geocoding).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lon` | number | Yes | Longitude |
| `zoom` | number | No | Detail level (0-18) |

**Response:**

```json
{
  "success": true,
  "data": {
    "displayName": "123 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City, Vietnam",
    "address": {
      "houseNumber": "123",
      "road": "Nguyen Hue",
      "suburb": "Ben Nghe",
      "district": "District 1",
      "city": "Ho Chi Minh City",
      "country": "Vietnam",
      "postcode": "700000"
    },
    "latitude": 10.7731,
    "longitude": 106.7030
  }
}
```

---

### GET /api/geocoding/autocomplete

Get address suggestions while typing.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Partial address query |
| `limit` | number | No | Max suggestions (default: 5) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "displayName": "Nguyen Hue Street, District 1",
      "latitude": 10.7731,
      "longitude": 106.7030
    },
    {
      "displayName": "Nguyen Hue Walking Street",
      "latitude": 10.7750,
      "longitude": 106.7045
    }
  ]
}
```

## Related Documentation

- [Routing Routes](./routing.md) - Navigation
- [Camera Routes](./camera.md) - Location-based queries

## References

- [Nominatim Documentation](https://nominatim.org/release-docs/latest/)
- [OpenStreetMap](https://www.openstreetmap.org/)
