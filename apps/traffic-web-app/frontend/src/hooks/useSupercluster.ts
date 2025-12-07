/**
 * useSupercluster Hook - Marker Clustering
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @description
 * Custom React hook for clustering markers using Supercluster library.
 * Provides efficient spatial clustering for large datasets of markers.
 * 
 * @dependencies
 * - supercluster@8.0.1 (ISC License - MIT compatible)
 */

import { useMemo, useRef, useCallback } from 'react';
import Supercluster from 'supercluster';

export interface ClusterPoint {
    id: string;
    lat: number;
    lng: number;
    properties?: Record<string, any>;
}

export interface ClusterResult {
    id: string | number;
    lat: number;
    lng: number;
    isCluster: boolean;
    pointCount?: number;
    expansionZoom?: number;
    properties?: Record<string, any>;
    originalPoints?: ClusterPoint[];
}

export interface UseSuperclusterOptions {
    radius?: number;
    maxZoom?: number;
    minZoom?: number;
    minPoints?: number;
}

export interface UseSuperclusterResult {
    clusters: ClusterResult[];
    supercluster: Supercluster | null;
    getClusterExpansionZoom: (clusterId: number) => number;
    getClusterLeaves: (clusterId: number, limit?: number, offset?: number) => ClusterPoint[];
}

export function useSupercluster(
    points: ClusterPoint[],
    bounds: { west: number; south: number; east: number; north: number } | null,
    zoom: number,
    options: UseSuperclusterOptions = {}
): UseSuperclusterResult {
    const {
        radius = 60,
        maxZoom = 16,
        minZoom = 0,
        minPoints = 2,
    } = options;

    const superclusterRef = useRef<Supercluster | null>(null);

    // Create GeoJSON features from points
    const geoJsonPoints = useMemo(() => {
        return points.map((point) => ({
            type: 'Feature' as const,
            properties: {
                id: point.id,
                ...point.properties,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [point.lng, point.lat],
            },
        }));
    }, [points]);

    // Initialize supercluster and load points
    const supercluster = useMemo(() => {
        const index = new Supercluster({
            radius,
            maxZoom,
            minZoom,
            minPoints,
        });
        index.load(geoJsonPoints);
        superclusterRef.current = index;
        return index;
    }, [geoJsonPoints, radius, maxZoom, minZoom, minPoints]);

    // Get clusters for current bounds and zoom
    const clusters = useMemo(() => {
        if (!bounds || !supercluster) return [];

        const bbox: [number, number, number, number] = [
            bounds.west,
            bounds.south,
            bounds.east,
            bounds.north,
        ];

        const clusterZoom = Math.floor(zoom);

        try {
            const rawClusters = supercluster.getClusters(bbox, clusterZoom);

            return rawClusters.map((cluster): ClusterResult => {
                const [lng, lat] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count: pointCount, cluster_id } = cluster.properties;

                if (isCluster) {
                    return {
                        id: cluster_id,
                        lat,
                        lng,
                        isCluster: true,
                        pointCount,
                        expansionZoom: supercluster.getClusterExpansionZoom(cluster_id),
                        properties: cluster.properties,
                    };
                }

                return {
                    id: cluster.properties.id,
                    lat,
                    lng,
                    isCluster: false,
                    properties: cluster.properties,
                };
            });
        } catch (error) {
            console.error('Error getting clusters:', error);
            return [];
        }
    }, [bounds, zoom, supercluster]);

    // Get expansion zoom for a cluster
    const getClusterExpansionZoom = useCallback((clusterId: number): number => {
        if (!superclusterRef.current) return zoom + 2;
        try {
            return superclusterRef.current.getClusterExpansionZoom(clusterId);
        } catch {
            return zoom + 2;
        }
    }, [zoom]);

    // Get all points in a cluster
    const getClusterLeaves = useCallback(
        (clusterId: number, limit = 100, offset = 0): ClusterPoint[] => {
            if (!superclusterRef.current) return [];
            try {
                const leaves = superclusterRef.current.getLeaves(clusterId, limit, offset);
                return leaves.map((leaf) => ({
                    id: leaf.properties.id,
                    lat: leaf.geometry.coordinates[1],
                    lng: leaf.geometry.coordinates[0],
                    properties: leaf.properties,
                }));
            } catch {
                return [];
            }
        },
        []
    );

    return {
        clusters,
        supercluster,
        getClusterExpansionZoom,
        getClusterLeaves,
    };
}

export default useSupercluster;
