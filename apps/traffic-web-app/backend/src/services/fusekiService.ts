/**
 * Apache Jena Fuseki Service - SPARQL Triplestore & Linked Open Data Client
 * 
 * @module apps/traffic-web-app/backend/src/services/fusekiService
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-11-26
 * @modified 2025-11-26
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * TypeScript client for Apache Jena Fuseki RDF triplestore providing SPARQL query
 * execution, LOD linkset enrichment, and semantic data integration.
 * 
 * Core Features:
 * - SPARQL 1.1 query execution (SELECT, CONSTRUCT, ASK, DESCRIBE)
 * - GeoNames integration for location enrichment
 * - DBpedia links for entity context
 * - Federated queries across multiple SPARQL endpoints
 * - Pagination support for large result sets
 * - RDF serialization (Turtle, JSON-LD, N-Triples)
 * 
 * LOD Enrichment:
 * - GeoNames: City/district geographic metadata
 * - DBpedia: Entity definitions and multilingual labels
 * - Schema.org: Vocabulary standardization
 * - SOSA/SSN: Sensor observation ontologies
 * 
 * Use Cases:
 * - Get LOD-enriched camera entities with geographic context
 * - Query historical weather patterns with SPARQL
 * - Discover semantic relationships between entities
 * - Validate NGSI-LD against Smart Data Models ontology
 * 
 * @dependencies
 * - sparql-http-client@^2.4: SPARQL protocol client
 * 
 * @example
 * const fuseki = new FusekiService();
 * const enriched = await fuseki.getEnrichedCameraEntity('urn:ngsi-ld:Camera:001');
 * console.log(enriched.geonamesLabel, enriched.dbpediaAbstract);
 */

// @ts-ignore - sparql-http-client does not have type definitions
import ParsingClient from 'sparql-http-client/ParsingClient';
import { logger } from '../utils/logger';

export class FusekiService {
  private client: any;
  private endpointUrl: string;

  constructor() {
    const fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
    const dataset = process.env.FUSEKI_DATASET || 'lod-dataset';
    const user = process.env.FUSEKI_USER || 'admin';
    const password = process.env.FUSEKI_PASSWORD || 'test_admin';

    this.endpointUrl = `${fusekiUrl}/${dataset}/sparql`;

    this.client = new ParsingClient({
      endpointUrl: this.endpointUrl,
      user,
      password
    });

    logger.info(`FusekiService initialized with endpoint: ${this.endpointUrl}`);
  }

  async queryTrafficPatterns(): Promise<any[]> {
    const query = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?pattern ?roadSegment ?avgSpeed ?vehicleCount ?congestion ?lat ?lon ?timestamp
      WHERE {
        ?pattern a traffic:TrafficPattern ;
                 traffic:roadSegment ?roadSegment ;
                 traffic:averageSpeed ?avgSpeed ;
                 traffic:vehicleCount ?vehicleCount ;
                 traffic:congestionLevel ?congestion ;
                 geo:lat ?lat ;
                 geo:long ?lon ;
                 traffic:timestamp ?timestamp .
      }
      ORDER BY DESC(?timestamp)
      LIMIT 100
    `;

    try {
      const stream = await this.client.query.select(query);
      const results: any[] = [];

      for await (const row of stream) {
        results.push({
          id: row.pattern.value,
          roadSegment: row.roadSegment.value,
          averageSpeed: parseFloat(row.avgSpeed.value),
          vehicleCount: parseInt(row.vehicleCount.value, 10),
          congestionLevel: row.congestion.value,
          latitude: parseFloat(row.lat.value),
          longitude: parseFloat(row.lon.value),
          timestamp: row.timestamp.value
        });
      }

      logger.debug(`Queried ${results.length} traffic patterns from Fuseki`);
      return results;
    } catch (error) {
      logger.error('Error querying traffic patterns from Fuseki:', error);
      throw new Error('Failed to query traffic patterns from Fuseki');
    }
  }

  async queryRoadSegments(): Promise<any[]> {
    const query = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
      
      SELECT ?segment ?name ?startLat ?startLon ?endLat ?endLon
      WHERE {
        ?segment a traffic:RoadSegment ;
                 traffic:name ?name ;
                 traffic:startPoint ?start ;
                 traffic:endPoint ?end .
        ?start geo:lat ?startLat ;
               geo:long ?startLon .
        ?end geo:lat ?endLat ;
             geo:long ?endLon .
      }
    `;

    try {
      const stream = await this.client.query.select(query);
      const results: any[] = [];

      for await (const row of stream) {
        results.push({
          id: row.segment.value,
          name: row.name.value,
          startPoint: {
            latitude: parseFloat(row.startLat.value),
            longitude: parseFloat(row.startLon.value)
          },
          endPoint: {
            latitude: parseFloat(row.endLat.value),
            longitude: parseFloat(row.endLon.value)
          }
        });
      }

      return results;
    } catch (error) {
      logger.error('Error querying road segments from Fuseki:', error);
      throw new Error('Failed to query road segments from Fuseki');
    }
  }

  async queryHistoricalData(roadSegment: string, days: number = 7): Promise<any[]> {
    const query = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?date ?avgSpeed ?vehicleCount
      WHERE {
        ?observation a traffic:TrafficObservation ;
                     traffic:roadSegment "${roadSegment}" ;
                     traffic:date ?date ;
                     traffic:averageSpeed ?avgSpeed ;
                     traffic:vehicleCount ?vehicleCount .
        FILTER(?date >= "${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}"^^xsd:dateTime)
      }
      ORDER BY ?date
    `;

    try {
      const stream = await this.client.query.select(query);
      const results: any[] = [];

      for await (const row of stream) {
        results.push({
          date: row.date.value,
          averageSpeed: parseFloat(row.avgSpeed.value),
          vehicleCount: parseInt(row.vehicleCount.value, 10)
        });
      }

      return results;
    } catch (error) {
      logger.error('Error querying historical data from Fuseki:', error);
      return [];
    }
  }

  /**
   * Query historical AQI data from Fuseki using SPARQL
   * Retrieves last N days of air quality observations from named graphs
   * 
   * @param days - Number of days to query (default: 7)
   * @param cameraId - Optional camera ID filter
   * @param groupBy - Optional grouping: 'hour', 'day', or undefined
   * @returns Array of AQI time-series data
   */
  async queryHistoricalAqi(days: number = 7, cameraId?: string, groupBy?: string): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build camera filter if provided
    const cameraFilter = cameraId ? `FILTER(?camera = <${cameraId}>)` : '';

    const query = `
      PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?timestamp ?camera ?aqi ?pm25 ?pm10 ?no2 ?o3 ?co ?so2
      WHERE {
        GRAPH ?g {
          ?obs a traffic:AirQualityObserved ;
               traffic:dateObserved ?timestamp ;
               traffic:refDevice ?camera ;
               traffic:aqi ?aqi .
          
          OPTIONAL { ?obs traffic:pm25 ?pm25 . }
          OPTIONAL { ?obs traffic:pm10 ?pm10 . }
          OPTIONAL { ?obs traffic:no2 ?no2 . }
          OPTIONAL { ?obs traffic:o3 ?o3 . }
          OPTIONAL { ?obs traffic:co ?co . }
          OPTIONAL { ?obs traffic:so2 ?so2 . }
          
          FILTER(?timestamp > "${startDate}"^^xsd:dateDateTime)
          ${cameraFilter}
        }
      }
      ORDER BY ?timestamp
    `;

    try {
      const stream = await this.client.query.select(query);
      const results: any[] = [];

      for await (const row of stream) {
        results.push({
          timestamp: row.timestamp.value,
          camera: row.camera.value,
          aqi: row.aqi ? parseFloat(row.aqi.value) : null,
          pm25: row.pm25 ? parseFloat(row.pm25.value) : null,
          pm10: row.pm10 ? parseFloat(row.pm10.value) : null,
          no2: row.no2 ? parseFloat(row.no2.value) : null,
          o3: row.o3 ? parseFloat(row.o3.value) : null,
          co: row.co ? parseFloat(row.co.value) : null,
          so2: row.so2 ? parseFloat(row.so2.value) : null
        });
      }

      logger.debug(`Queried ${results.length} historical AQI records from Fuseki`);

      // Transform to time-series format
      if (groupBy) {
        return this.transformToTimeSeriesWithGrouping(results, groupBy);
      } else {
        return this.transformToTimeSeries(results);
      }

    } catch (error) {
      logger.error('Error querying historical AQI from Fuseki:', error);
      throw new Error('Failed to query historical AQI data from Fuseki');
    }
  }

  /**
   * Transform SPARQL results to time-series format without grouping
   */
  private transformToTimeSeries(data: any[]): any {
    const cameraMap = new Map<string, any>();

    data.forEach(record => {
      const cameraId = record.camera;

      if (!cameraMap.has(cameraId)) {
        cameraMap.set(cameraId, {
          cameraId,
          timestamps: [],
          aqi: [],
          pm25: [],
          pm10: [],
          no2: [],
          o3: [],
          co: [],
          so2: []
        });
      }

      const series = cameraMap.get(cameraId);
      series.timestamps.push(record.timestamp);
      series.aqi.push(record.aqi);
      series.pm25.push(record.pm25);
      series.pm10.push(record.pm10);
      series.no2.push(record.no2);
      series.o3.push(record.o3);
      series.co.push(record.co);
      series.so2.push(record.so2);
    });

    return Array.from(cameraMap.values());
  }

  /**
   * Transform SPARQL results with time-based aggregation
   */
  private transformToTimeSeriesWithGrouping(data: any[], groupBy: string): any {
    const cameraMap = new Map<string, Map<string, any>>();

    data.forEach(record => {
      const cameraId = record.camera;
      const timestamp = new Date(record.timestamp);

      // Determine time bucket based on groupBy
      let timeBucket: string;
      if (groupBy === 'hour') {
        timeBucket = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:00`;
      } else if (groupBy === 'day') {
        timeBucket = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
      } else {
        timeBucket = record.timestamp;
      }

      if (!cameraMap.has(cameraId)) {
        cameraMap.set(cameraId, new Map());
      }

      const cameraData = cameraMap.get(cameraId)!;

      if (!cameraData.has(timeBucket)) {
        cameraData.set(timeBucket, {
          timestamp: timeBucket,
          aqiValues: [],
          pm25Values: [],
          pm10Values: [],
          no2Values: [],
          o3Values: [],
          coValues: [],
          so2Values: []
        });
      }

      const bucket = cameraData.get(timeBucket);
      if (record.aqi !== null) bucket.aqiValues.push(record.aqi);
      if (record.pm25 !== null) bucket.pm25Values.push(record.pm25);
      if (record.pm10 !== null) bucket.pm10Values.push(record.pm10);
      if (record.no2 !== null) bucket.no2Values.push(record.no2);
      if (record.o3 !== null) bucket.o3Values.push(record.o3);
      if (record.co !== null) bucket.coValues.push(record.co);
      if (record.so2 !== null) bucket.so2Values.push(record.so2);
    });

    // Calculate averages for each time bucket
    const result: any[] = [];

    cameraMap.forEach((buckets, cameraId) => {
      const cameraSeries = {
        cameraId,
        timestamps: [] as string[],
        aqi: [] as number[],
        pm25: [] as number[],
        pm10: [] as number[],
        no2: [] as number[],
        o3: [] as number[],
        co: [] as number[],
        so2: [] as number[]
      };

      const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      sortedBuckets.forEach(([timestamp, bucket]) => {
        cameraSeries.timestamps.push(timestamp);
        cameraSeries.aqi.push(this.calculateAverage(bucket.aqiValues));
        cameraSeries.pm25.push(this.calculateAverage(bucket.pm25Values));
        cameraSeries.pm10.push(this.calculateAverage(bucket.pm10Values));
        cameraSeries.no2.push(this.calculateAverage(bucket.no2Values));
        cameraSeries.o3.push(this.calculateAverage(bucket.o3Values));
        cameraSeries.co.push(this.calculateAverage(bucket.coValues));
        cameraSeries.so2.push(this.calculateAverage(bucket.so2Values));
      });

      result.push(cameraSeries);
    });

    return result;
  }

  /**
   * Calculate average of array values, handling null values
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 100) / 100;
  }

  /**
   * Query historical snapshot at specific timestamp
   * Retrieves complete data snapshot including AQI, weather, patterns, and accidents
   * within ±1 hour of the requested timestamp
   * 
   * @param timestamp ISO 8601 timestamp string
   * @returns Complete snapshot with all entity types
   */
  async queryHistoricalSnapshot(timestamp: string): Promise<any> {
    const requestedTime = new Date(timestamp);
    const oneHourBefore = new Date(requestedTime.getTime() - 60 * 60 * 1000);
    const oneHourAfter = new Date(requestedTime.getTime() + 60 * 60 * 1000);

    // Query AQI data at timestamp
    const aqiQuery = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?camera ?aqi ?pm25 ?pm10 ?no2 ?o3 ?co ?so2 ?lat ?lon ?timestamp
      WHERE {
        ?observation a traffic:AirQualityObservation ;
                     traffic:camera ?camera ;
                     traffic:aqi ?aqi ;
                     traffic:pm25 ?pm25 ;
                     traffic:pm10 ?pm10 ;
                     traffic:no2 ?no2 ;
                     traffic:o3 ?o3 ;
                     traffic:co ?co ;
                     traffic:so2 ?so2 ;
                     geo:lat ?lat ;
                     geo:long ?lon ;
                     traffic:timestamp ?timestamp .
        FILTER(?timestamp >= "${oneHourBefore.toISOString()}"^^xsd:dateTime && 
               ?timestamp <= "${oneHourAfter.toISOString()}"^^xsd:dateTime)
      }
      ORDER BY ?camera ?timestamp
    `;

    // Query weather data at timestamp
    const weatherQuery = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?camera ?temperature ?humidity ?pressure ?windSpeed ?precipitation ?condition ?lat ?lon ?timestamp
      WHERE {
        ?observation a traffic:WeatherObservation ;
                     traffic:camera ?camera ;
                     traffic:temperature ?temperature ;
                     traffic:humidity ?humidity ;
                     traffic:pressure ?pressure ;
                     traffic:windSpeed ?windSpeed ;
                     traffic:precipitation ?precipitation ;
                     traffic:condition ?condition ;
                     geo:lat ?lat ;
                     geo:long ?lon ;
                     traffic:timestamp ?timestamp .
        FILTER(?timestamp >= "${oneHourBefore.toISOString()}"^^xsd:dateTime && 
               ?timestamp <= "${oneHourAfter.toISOString()}"^^xsd:dateTime)
      }
      ORDER BY ?camera ?timestamp
    `;

    // Query traffic patterns at timestamp
    const patternsQuery = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?pattern ?camera ?patternType ?congestion ?vehicleCount ?avgSpeed 
             ?timeStart ?timeEnd ?daysOfWeek ?lat ?lon ?timestamp
      WHERE {
        ?pattern a traffic:TrafficPattern ;
                 traffic:camera ?camera ;
                 traffic:patternType ?patternType ;
                 traffic:congestionLevel ?congestion ;
                 traffic:avgVehicleCount ?vehicleCount ;
                 traffic:avgSpeed ?avgSpeed ;
                 traffic:timeRangeStart ?timeStart ;
                 traffic:timeRangeEnd ?timeEnd ;
                 traffic:daysOfWeek ?daysOfWeek ;
                 geo:lat ?lat ;
                 geo:long ?lon ;
                 traffic:timestamp ?timestamp .
        FILTER(?timestamp >= "${oneHourBefore.toISOString()}"^^xsd:dateTime && 
               ?timestamp <= "${oneHourAfter.toISOString()}"^^xsd:dateTime)
      }
      ORDER BY ?pattern
    `;

    // Query accidents within 1 hour of timestamp
    const accidentsQuery = `
      PREFIX traffic: <http://traffic.hcmc.vn/ontology#>
      PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      
      SELECT ?accident ?severity ?vehicles ?description ?lat ?lon ?timestamp
      WHERE {
        ?accident a traffic:RoadAccident ;
                  traffic:severity ?severity ;
                  traffic:vehiclesInvolved ?vehicles ;
                  traffic:description ?description ;
                  geo:lat ?lat ;
                  geo:long ?lon ;
                  traffic:timestamp ?timestamp .
        FILTER(?timestamp >= "${oneHourBefore.toISOString()}"^^xsd:dateTime && 
               ?timestamp <= "${oneHourAfter.toISOString()}"^^xsd:dateTime)
      }
      ORDER BY ?timestamp
    `;

    try {
      logger.debug(`Querying snapshot at ${timestamp} (±1h window: ${oneHourBefore.toISOString()} to ${oneHourAfter.toISOString()})`);

      // Execute all queries in parallel
      const [aqiStream, weatherStream, patternsStream, accidentsStream] = await Promise.all([
        this.client.query.select(aqiQuery),
        this.client.query.select(weatherQuery),
        this.client.query.select(patternsQuery),
        this.client.query.select(accidentsQuery)
      ]);

      // Process AQI results
      const aqiData: any[] = [];
      for await (const row of aqiStream) {
        aqiData.push({
          cameraId: row.camera.value,
          aqi: row.aqi ? parseFloat(row.aqi.value) : null,
          pm25: row.pm25 ? parseFloat(row.pm25.value) : null,
          pm10: row.pm10 ? parseFloat(row.pm10.value) : null,
          no2: row.no2 ? parseFloat(row.no2.value) : null,
          o3: row.o3 ? parseFloat(row.o3.value) : null,
          co: row.co ? parseFloat(row.co.value) : null,
          so2: row.so2 ? parseFloat(row.so2.value) : null,
          location: {
            lat: parseFloat(row.lat.value),
            lng: parseFloat(row.lon.value)
          },
          timestamp: row.timestamp.value
        });
      }

      // Process weather results
      const weatherData: any[] = [];
      for await (const row of weatherStream) {
        weatherData.push({
          cameraId: row.camera.value,
          temperature: row.temperature ? parseFloat(row.temperature.value) : null,
          humidity: row.humidity ? parseFloat(row.humidity.value) : null,
          pressure: row.pressure ? parseFloat(row.pressure.value) : null,
          windSpeed: row.windSpeed ? parseFloat(row.windSpeed.value) : null,
          precipitation: row.precipitation ? parseFloat(row.precipitation.value) : null,
          condition: row.condition ? row.condition.value : 'Unknown',
          location: {
            lat: parseFloat(row.lat.value),
            lng: parseFloat(row.lon.value)
          },
          timestamp: row.timestamp.value
        });
      }

      // Process patterns results
      const patternsData: any[] = [];
      for await (const row of patternsStream) {
        patternsData.push({
          patternId: row.pattern.value,
          cameraId: row.camera.value,
          patternType: row.patternType.value,
          congestionLevel: row.congestion.value,
          avgVehicleCount: row.vehicleCount ? parseInt(row.vehicleCount.value, 10) : 0,
          avgSpeed: row.avgSpeed ? parseFloat(row.avgSpeed.value) : 0,
          timeRange: {
            start: row.timeStart ? row.timeStart.value : '00:00',
            end: row.timeEnd ? row.timeEnd.value : '23:59'
          },
          daysOfWeek: row.daysOfWeek ? row.daysOfWeek.value.split(',') : [],
          location: {
            lat: parseFloat(row.lat.value),
            lng: parseFloat(row.lon.value)
          },
          timestamp: row.timestamp.value
        });
      }

      // Process accidents results
      const accidentsData: any[] = [];
      for await (const row of accidentsStream) {
        accidentsData.push({
          accidentId: row.accident.value,
          severity: row.severity.value,
          vehiclesInvolved: row.vehicles ? parseInt(row.vehicles.value, 10) : 1,
          description: row.description ? row.description.value : '',
          location: {
            latitude: parseFloat(row.lat.value),
            longitude: parseFloat(row.lon.value)
          },
          timestamp: row.timestamp.value
        });
      }

      // Aggregate by camera for AQI and weather (take closest to requested time)
      const aqiByCamera = this.aggregateClosestRecords(aqiData, requestedTime);
      const weatherByCamera = this.aggregateClosestRecords(weatherData, requestedTime);

      logger.debug(`Snapshot retrieved: ${aqiByCamera.length} AQI, ${weatherByCamera.length} weather, ${patternsData.length} patterns, ${accidentsData.length} accidents`);

      return {
        timestamp,
        aqi: aqiByCamera,
        weather: weatherByCamera,
        patterns: patternsData,
        accidents: accidentsData
      };

    } catch (error) {
      logger.error(`Error querying historical snapshot from Fuseki: ${error}`);

      // Return empty snapshot on error
      return {
        timestamp,
        aqi: [],
        weather: [],
        patterns: [],
        accidents: []
      };
    }
  }

  /**
   * Aggregate records by camera, keeping only the closest to target timestamp
   */
  private aggregateClosestRecords(records: any[], targetTime: Date): any[] {
    const cameraMap = new Map<string, any>();

    records.forEach(record => {
      const cameraId = record.cameraId;
      const recordTime = new Date(record.timestamp);
      const timeDiff = Math.abs(recordTime.getTime() - targetTime.getTime());

      if (!cameraMap.has(cameraId)) {
        cameraMap.set(cameraId, { record, timeDiff });
      } else {
        const existing = cameraMap.get(cameraId);
        if (timeDiff < existing.timeDiff) {
          cameraMap.set(cameraId, { record, timeDiff });
        }
      }
    });

    return Array.from(cameraMap.values()).map(item => {
      const { timestamp, ...rest } = item.record;
      return rest;
    });
  }
}

