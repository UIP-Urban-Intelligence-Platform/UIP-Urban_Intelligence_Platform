#!/usr/bin/env python3
"""Citizen Ingestion Agent - FastAPI Server for Citizen Science Reports.

Module: agents.ingestion.citizen_ingestion_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    REST API endpoint for ingesting citizen-reported traffic incidents.
    Enriches reports with weather and air quality data, transforms to
    NGSI-LD CitizenObservation entities, and publishes to Stellio Context Broker.

Features:
    - FastAPI REST endpoint (:8001/api/v1/citizen-reports)
    - Async background task processing
    - Weather enrichment (OpenWeatherMap API)
    - Air quality enrichment (OpenAQ API v3)
    - NGSI-LD transformation
    - Stellio Context Broker integration
    - AI verification status tracking

Architecture:
    User App → POST /citizen-reports → [Background: Enrich + Transform + Publish]
    → Stellio (status: pending_verification, aiVerified: false)
    → CV Agent polls for unverified reports → AI verification → PATCH status

Dependencies:
    - fastapi>=0.104: Web framework
    - uvicorn>=0.24: ASGI server
    - aiohttp>=3.9: Async HTTP client
    - pydantic>=2.0: Data validation
    - requests>=2.28: Stellio HTTP client

Configuration:
    - Port: 8001
    - Stellio: http://localhost:8080/ngsi-ld/v1/entities
    - Weather API: OpenWeatherMap
    - Air Quality API: OpenAQ v3

Usage:
    # Development server
    uvicorn src.agents.ingestion.citizen_ingestion_agent:app --reload --port 8001
    
    # Production
    uvicorn src.agents.ingestion.citizen_ingestion_agent:app --host 0.0.0.0 --port 8001 --workers 4

Example Request:
    POST http://localhost:8001/api/v1/citizen-reports
    {
        "userId": "user_12345",
        "reportType": "accident",
        "description": "2 cars collision at intersection",
        "latitude": 10.791,
        "longitude": 106.691,
        "imageUrl": "https://example.com/photo.jpg",
        "timestamp": "2025-11-22T10:30:00Z"
    }
"""

import os
import json
import uuid
import logging
import yaml
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

# FastAPI & Uvicorn
try:
    from fastapi import FastAPI, BackgroundTasks, HTTPException, status
    from fastapi.responses import JSONResponse
    from pydantic import BaseModel, Field, field_validator
    import uvicorn
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    logging.error("FastAPI not available - install with: pip install fastapi uvicorn")

# Async HTTP Client
try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    logging.error("aiohttp not available - install with: pip install aiohttp")

# Synchronous HTTP for Stellio
import requests

# MongoDB integration (optional)
try:
    from src.utils.mongodb_helper import get_mongodb_helper
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    get_mongodb_helper = None

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Load Configuration from data_sources.yaml
# ============================================================================
def load_api_config() -> Dict[str, Any]:
    """Load API keys and configuration from data_sources.yaml."""
    config_path = Path(__file__).parent.parent.parent.parent / 'config' / 'data_sources.yaml'
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
            return config.get('external_apis', {})
    except Exception as e:
        logger.error(f"Failed to load data_sources.yaml: {e}")
        return {}

API_CONFIG = load_api_config()

# ============================================================================
# Pydantic Models
# ============================================================================

class CitizenReport(BaseModel):
    """Input model for citizen report submission."""
    
    userId: str = Field(..., description="User identifier from mobile app", min_length=1)
    reportType: str = Field(..., description="Incident category", 
                           pattern="^(traffic_jam|accident|flood|road_damage|other)$")
    description: Optional[str] = Field(None, description="User description of incident")
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude (WGS84)")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude (WGS84)")
    imageUrl: str = Field(..., description="URL to uploaded incident photo", min_length=1)
    timestamp: Optional[str] = Field(None, description="Report submission time (ISO 8601)")
    
    @field_validator('timestamp', mode='before')
    @classmethod
    def set_timestamp(cls, v):
        """Set current timestamp if not provided."""
        return v or datetime.utcnow().isoformat() + 'Z'


class ReportResponse(BaseModel):
    """Response model for accepted report."""
    
    status: str = "accepted"
    message: str
    reportId: str
    processingStatus: str = "background_processing"


# ============================================================================
# FastAPI Application
# ============================================================================

if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="Citizen Science Ingestion API",
        description="REST endpoint for citizen traffic incident reports",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
else:
    app = None
    logger.critical("FastAPI not installed - cannot start server")


# ============================================================================
# External API Clients
# ============================================================================

class WeatherEnricher:
    """Fetch weather data from OpenWeatherMap API."""
    
    def __init__(self):
        # Try environment variable first, then config file, then mock
        env_key = os.getenv('OPENWEATHERMAP_API_KEY')
        config_key = API_CONFIG.get('openweathermap', {}).get('api_key')
        
        self.api_key = env_key or config_key or 'mock_key'
        self.base_url = API_CONFIG.get('openweathermap', {}).get('base_url', 
                                       "https://api.openweathermap.org/data/2.5/weather")
        self.use_mock = self.api_key == 'mock_key'
        
        if self.use_mock:
            logger.warning("Weather API: Using MOCK data (no API key configured)")
        else:
            logger.info(f"Weather API: Configured with key from {'environment' if env_key else 'data_sources.yaml'}")
    
    async def fetch(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch weather data for coordinates.
        
        Args:
            lat: Latitude (WGS84)
            lon: Longitude (WGS84)
        
        Returns:
            Weather context dictionary
        """
        if self.use_mock:
            return self._mock_weather_data()
        
        try:
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"Weather API: Successfully fetched data for ({lat}, {lon})")
                        return {
                            'temperature': data['main']['temp'],
                            'condition': data['weather'][0]['description'],
                            'humidity': data['main']['humidity'],
                            'pressure': data['main']['pressure'],
                            'windSpeed': data['wind']['speed']
                        }
                    else:
                        logger.warning(f"Weather API returned {response.status}, using mock data")
                        return self._mock_weather_data()
        except Exception as e:
            logger.error(f"Weather API error: {e}, using mock data")
            return self._mock_weather_data()
    
    def _mock_weather_data(self) -> Dict[str, Any]:
        """Return mock weather data for development."""
        return {
            'temperature': 30.5,
            'condition': 'Partly Cloudy',
            'humidity': 75,
            'pressure': 1012,
            'windSpeed': 3.5
        }


class AirQualityEnricher:
    """Fetch air quality data from OpenAQ API v3."""
    
    def __init__(self):
        # Try environment variable first, then config file, then mock
        env_key = os.getenv('OPENAQ_API_KEY')
        config_key = API_CONFIG.get('openaq', {}).get('api_key')
        
        self.api_key = env_key or config_key or 'mock_key'
        self.base_url = API_CONFIG.get('openaq', {}).get('base_url', 
                                       "https://api.openaq.org/v3")
        self.use_mock = self.api_key == 'mock_key'
        
        if self.use_mock:
            logger.warning("AirQuality API: Using MOCK data (no API key configured)")
        else:
            logger.info(f"AirQuality API: Configured with key from {'environment' if env_key else 'data_sources.yaml'}")
    
    async def fetch(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch air quality data for coordinates.
        
        Args:
            lat: Latitude (WGS84)
            lon: Longitude (WGS84)
        
        Returns:
            Air quality context dictionary
        """
        if self.use_mock:
            return self._mock_air_quality_data()
        
        try:
            # Step 1: Find nearest location
            headers = {'X-API-Key': self.api_key}
            params = {
                'coordinates': f"{lat},{lon}",
                'radius': 25000,  # 25km search radius
                'limit': 1,
                'order_by': 'distance'
            }
            
            async with aiohttp.ClientSession() as session:
                # Get location ID
                async with session.get(
                    f"{self.base_url}/locations",
                    headers=headers,
                    params=params,
                    timeout=10
                ) as response:
                    if response.status != 200:
                        logger.warning(f"AQ API locations returned {response.status}")
                        return self._mock_air_quality_data()
                    
                    data = await response.json()
                    if not data.get('results'):
                        logger.warning("No AQ stations found nearby")
                        return self._mock_air_quality_data()
                    
                    location_id = data['results'][0]['id']
                    logger.info(f"AirQuality API: Found station {location_id} near ({lat}, {lon})")
                
                # Step 2: Get latest measurements
                async with session.get(
                    f"{self.base_url}/locations/{location_id}/latest",
                    headers=headers,
                    timeout=10
                ) as response:
                    if response.status != 200:
                        return self._mock_air_quality_data()
                    
                    data = await response.json()
                    measurements = data.get('results', {}).get('measurements', [])
                    
                    # Parse measurements
                    aq_data = {'aqi': 100}  # Default
                    for measure in measurements:
                        param = measure.get('parameter', {}).get('name', '').lower()
                        value = measure.get('value')
                        
                        if param == 'pm25':
                            aq_data['pm25'] = value
                        elif param == 'pm10':
                            aq_data['pm10'] = value
                        elif param == 'no2':
                            aq_data['no2'] = value
                        elif param == 'o3':
                            aq_data['o3'] = value
                    
                    logger.info(f"AirQuality API: Successfully fetched {len(aq_data)} parameters")
                    return aq_data
        
        except Exception as e:
            logger.error(f"AirQuality API error: {e}, using mock data")
            return self._mock_air_quality_data()
    
    def _mock_air_quality_data(self) -> Dict[str, Any]:
        """Return mock air quality data for development."""
        return {
            'aqi': 150,
            'pm25': 35.2,
            'pm10': 58.7,
            'no2': 42.1,
            'o3': 68.3
        }


# ============================================================================
# NGSI-LD Transformer
# ============================================================================

class NGSILDTransformer:
    """Transform CitizenReport + Enrichment Data to NGSI-LD entity."""
    
    def __init__(self, stellio_base_url: str = "http://localhost:8080"):
        self.stellio_base_url = stellio_base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
        
        # MongoDB helper (optional)
        self._mongodb_helper = None
        if MONGODB_AVAILABLE:
            try:
                self._mongodb_helper = get_mongodb_helper()
                if self._mongodb_helper and self._mongodb_helper.enabled:
                    logger.info("✅ MongoDB publishing enabled for citizen ingestion")
            except Exception as e:
                logger.debug(f"MongoDB init failed (non-critical): {e}")
    
    def transform(
        self,
        report: CitizenReport,
        weather_data: Dict[str, Any],
        aq_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform input data to NGSI-LD CitizenObservation entity.
        
        Args:
            report: Validated citizen report
            weather_data: Weather enrichment data
            aq_data: Air quality enrichment data
        
        Returns:
            NGSI-LD entity dictionary
        """
        report_id = str(uuid.uuid4())
        
        entity = {
            "id": f"urn:ngsi-ld:CitizenObservation:{report_id}",
            "type": "CitizenObservation",
            
            # Report metadata
            "category": {
                "type": "Property",
                "value": report.reportType
            },
            "description": {
                "type": "Property",
                "value": report.description or f"{report.reportType} reported by citizen"
            },
            
            # Geospatial data
            "location": {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": [report.longitude, report.latitude]
                }
            },
            
            # Image evidence
            "imageSnapshot": {
                "type": "Property",
                "value": report.imageUrl
            },
            
            # User relationship
            "reportedBy": {
                "type": "Relationship",
                "object": f"urn:ngsi-ld:User:{report.userId}"
            },
            
            # Timestamps - NGSI-LD DateTime format (ISO 8601 string)
            "dateObserved": {
                "type": "Property",
                "value": report.timestamp
            },
            
            # Enrichment: Weather context with temporal metadata
            "weatherContext": {
                "type": "Property",
                "value": weather_data,
                "observedAt": report.timestamp  # ISO 8601 DateTime metadata
            },
            
            # Enrichment: Air quality context with temporal metadata
            "airQualityContext": {
                "type": "Property",
                "value": aq_data,
                "observedAt": report.timestamp  # ISO 8601 DateTime metadata
            },
            
            # AI Verification status (initial state)
            "status": {
                "type": "Property",
                "value": "pending_verification"
            },
            "aiVerified": {
                "type": "Property",
                "value": False
            },
            "aiConfidence": {
                "type": "Property",
                "value": 0.0
            },
            
            # NGSI-LD context
            "@context": [
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ]
        }
        
        return entity
    
    def publish_to_stellio(self, entity: Dict[str, Any]) -> bool:
        """
        POST entity to Stellio Context Broker.
        
        Args:
            entity: NGSI-LD entity dictionary
        
        Returns:
            True if successful, False otherwise
        """
        url = f"{self.stellio_base_url}/ngsi-ld/v1/entities"
        
        try:
            response = self.session.post(url, json=entity, timeout=10)
            
            if response.status_code in [201, 204]:
                logger.info(f"✅ Published {entity['id']} to Stellio")
                
                # Optionally publish to MongoDB (non-blocking)
                if self._mongodb_helper and self._mongodb_helper.enabled:
                    try:
                        if self._mongodb_helper.insert_entity(entity):
                            logger.info(f"✅ Published CitizenObservation to MongoDB: {entity['id']}")
                    except Exception as e:
                        logger.warning(f"MongoDB publish failed (non-critical): {e}")
                
                return True
            else:
                logger.error(f"❌ Stellio returned {response.status_code}: {response.text}")
                return False
        
        except Exception as e:
            logger.error(f"❌ Failed to publish to Stellio: {e}")
            return False


# ============================================================================
# Background Task Processor
# ============================================================================

async def process_citizen_report_background(
    report: CitizenReport,
    weather_enricher: WeatherEnricher,
    aq_enricher: AirQualityEnricher,
    transformer: NGSILDTransformer
):
    """
    Background task: Enrich report with external data and publish to Stellio.
    
    This runs asynchronously after returning 202 to user.
    
    Args:
        report: Validated citizen report
        weather_enricher: Weather API client
        aq_enricher: Air quality API client
        transformer: NGSI-LD transformer and Stellio publisher
    """
    logger.info(f"🚀 Processing report: {report.reportType} from user {report.userId}")
    
    try:
        # Step 1: Fetch enrichment data in parallel
        weather_data, aq_data = await asyncio.gather(
            weather_enricher.fetch(report.latitude, report.longitude),
            aq_enricher.fetch(report.latitude, report.longitude)
        )
        
        logger.info(f"📊 Enrichment complete: Weather={weather_data.get('temperature')}°C, AQI={aq_data.get('aqi')}")
        
        # Step 2: Transform to NGSI-LD
        entity = transformer.transform(report, weather_data, aq_data)
        logger.info(f"🔄 Transformed to NGSI-LD: {entity['id']}")
        
        # Step 3: Publish to Stellio
        success = transformer.publish_to_stellio(entity)
        
        if success:
            logger.info(f"✅ Report processing complete: {entity['id']}")
        else:
            logger.error(f"❌ Failed to publish report: {entity['id']}")
    
    except Exception as e:
        logger.error(f"💥 Background task failed: {e}", exc_info=True)


# ============================================================================
# API Endpoints
# ============================================================================

if FASTAPI_AVAILABLE:
    # Initialize service dependencies
    weather_enricher = WeatherEnricher()
    aq_enricher = AirQualityEnricher()
    transformer = NGSILDTransformer()
    
    
    @app.get("/", tags=["Health"])
    async def root():
        """Health check endpoint."""
        return {
            "service": "Citizen Science Ingestion API",
            "version": "1.0.0",
            "status": "operational",
            "endpoints": {
                "submit_report": "POST /api/v1/citizen-reports",
                "docs": "GET /docs"
            }
        }
    
    
    @app.post(
        "/api/v1/citizen-reports",
        response_model=ReportResponse,
        status_code=status.HTTP_202_ACCEPTED,
        tags=["Citizen Reports"]
    )
    async def submit_citizen_report(
        report: CitizenReport,
        background_tasks: BackgroundTasks
    ):
        """
        Submit a citizen traffic incident report.
        
        The report is validated and accepted immediately (202 Accepted).
        Heavy processing (API calls, enrichment, Stellio publishing) happens
        in the background.
        
        **Report Types:**
        - `traffic_jam`: Heavy traffic congestion
        - `accident`: Vehicle collision or incident
        - `flood`: Road flooding
        - `road_damage`: Potholes, cracks, etc.
        - `other`: Other traffic-related issues
        
        **Processing Flow:**
        1. Immediate validation and 202 response
        2. Background: Fetch weather data (OpenWeatherMap)
        3. Background: Fetch air quality data (OpenAQ)
        4. Background: Transform to NGSI-LD CitizenObservation
        5. Background: Publish to Stellio (status: pending_verification)
        6. Later: CV Agent verifies with AI and updates status
        
        Args:
            report: Citizen report data
            background_tasks: FastAPI background task manager
        
        Returns:
            202 Accepted with report ID
        """
        logger.info(f"📥 Received report: {report.reportType} from {report.userId}")
        
        # Generate report ID for tracking
        report_id = str(uuid.uuid4())
        
        # Schedule background processing
        background_tasks.add_task(
            process_citizen_report_background,
            report,
            weather_enricher,
            aq_enricher,
            transformer
        )
        
        return ReportResponse(
            message=f"Report accepted for processing: {report.reportType}",
            reportId=report_id,
            processingStatus="enrichment_and_publishing_in_progress"
        )
    
    
    @app.get("/api/v1/reports/{report_id}", tags=["Citizen Reports"])
    async def get_report_status(report_id: str):
        """
        Query Stellio for report status.
        
        This endpoint allows users to check the AI verification status
        of their submitted report.
        
        Args:
            report_id: Report UUID
        
        Returns:
            Report entity from Stellio or 404
        """
        entity_id = f"urn:ngsi-ld:CitizenObservation:{report_id}"
        url = f"{transformer.stellio_base_url}/ngsi-ld/v1/entities/{entity_id}"
        
        try:
            response = transformer.session.get(url, timeout=10)
            
            if response.status_code == 200:
                entity = response.json()
                return {
                    "reportId": report_id,
                    "status": entity.get('status', {}).get('value'),
                    "aiVerified": entity.get('aiVerified', {}).get('value'),
                    "aiConfidence": entity.get('aiConfidence', {}).get('value'),
                    "category": entity.get('category', {}).get('value')
                }
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="Report not found")
            else:
                raise HTTPException(status_code=500, detail="Stellio query failed")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to query Stellio: {e}")
            raise HTTPException(status_code=503, detail="Stellio unavailable")


# ============================================================================
# Main Entry Point
# ============================================================================

import asyncio

def main():
    """Run FastAPI server with uvicorn."""
    if not FASTAPI_AVAILABLE:
        logger.critical("Cannot start server: FastAPI not installed")
        logger.critical("Install with: pip install fastapi uvicorn aiohttp")
        return
    
    logger.info("🚀 Starting Citizen Ingestion Agent on port 8001")
    logger.info("📖 API Documentation: http://localhost:8001/docs")
    
    uvicorn.run(
        "src.agents.ingestion.citizen_ingestion_agent:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
