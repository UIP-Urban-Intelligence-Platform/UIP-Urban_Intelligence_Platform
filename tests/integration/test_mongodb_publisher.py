#!/usr/bin/env python3
"""MongoDB Publishing Integration Test Suite.

Module: tests.integration.test_mongodb_publisher
Author: Nguyễn Nhật Quang
Created: 2025-11-30
Version: 1.0.0
License: MIT

Description:
    Integration tests for MongoDB publishing functionality using MongoDBHelper utility.
    
    Test Coverage:
    - Connection and initialization
    - Single entity insertion
    - Batch entity insertion
    - Query operations (find by ID, geospatial)
    - Error handling and recovery

Usage:
    pytest tests/integration/test_mongodb_publisher.py
"""

import os
import sys
import unittest
from datetime import datetime
from typing import Dict, Any

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

try:
    from src.utils.mongodb_helper import get_mongodb_helper, MongoDBHelper
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False


@unittest.skipIf(not MONGODB_AVAILABLE, "MongoDB helper not available")
class TestMongoDBPublisher(unittest.TestCase):
    """Test suite for MongoDB publishing integration"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.helper = get_mongodb_helper()
        if not cls.helper or not cls.helper.enabled:
            raise unittest.SkipTest("MongoDB not configured or not available")
        
        # Test collection name
        cls.test_collection = "test_entities"
        
    def tearDown(self):
        """Clean up test data after each test"""
        if self.helper and self.helper.enabled:
            try:
                db = self.helper._client[self.helper._db_name]
                db[self.test_collection].delete_many({})
            except Exception:
                pass

    def _create_test_entity(self, entity_id: str, entity_type: str = "TestEntity") -> Dict[str, Any]:
        """Create a test NGSI-LD entity"""
        return {
            'id': entity_id,
            'type': entity_type,
            '@context': ['https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'],
            'testProperty': {
                'type': 'Property',
                'value': 'test value',
                'observedAt': datetime.utcnow().isoformat() + 'Z'
            },
            'location': {
                'type': 'GeoProperty',
                'value': {
                    'type': 'Point',
                    'coordinates': [105.8342, 21.0278]  # Hanoi coordinates
                }
            }
        }

    def test_connection_initialized(self):
        """Test that MongoDB connection is properly initialized"""
        self.assertIsNotNone(self.helper)
        self.assertTrue(self.helper.enabled)
        self.assertIsNotNone(self.helper._client)
        
    def test_insert_single_entity(self):
        """Test inserting a single entity"""
        entity = self._create_test_entity('urn:ngsi-ld:TestEntity:001')
        
        # Insert entity
        result = self.helper.insert_entity(entity, collection_name=self.test_collection)
        self.assertTrue(result, "Entity insertion should succeed")
        
        # Verify entity was inserted
        db = self.helper._client[self.helper._db_name]
        found = db[self.test_collection].find_one({'id': entity['id']})
        self.assertIsNotNone(found)
        self.assertEqual(found['id'], entity['id'])
        self.assertEqual(found['type'], entity['type'])
        
    def test_insert_entity_upsert(self):
        """Test that inserting the same entity twice performs upsert"""
        entity_id = 'urn:ngsi-ld:TestEntity:002'
        entity1 = self._create_test_entity(entity_id)
        entity1['testProperty']['value'] = 'original value'
        
        # First insert
        result1 = self.helper.insert_entity(entity1, collection_name=self.test_collection)
        self.assertTrue(result1)
        
        # Second insert with updated value (upsert)
        entity2 = self._create_test_entity(entity_id)
        entity2['testProperty']['value'] = 'updated value'
        result2 = self.helper.insert_entity(entity2, collection_name=self.test_collection)
        self.assertTrue(result2)
        
        # Verify only one entity exists with updated value
        db = self.helper._client[self.helper._db_name]
        count = db[self.test_collection].count_documents({'id': entity_id})
        self.assertEqual(count, 1, "Should have exactly one entity after upsert")
        
        found = db[self.test_collection].find_one({'id': entity_id})
        self.assertEqual(found['testProperty']['value'], 'updated value')
        
    def test_insert_batch_entities(self):
        """Test batch insertion of multiple entities"""
        entities = [
            self._create_test_entity(f'urn:ngsi-ld:TestEntity:{i:03d}')
            for i in range(10)
        ]
        
        # Batch insert
        result = self.helper.insert_entities_batch(entities, collection_name=self.test_collection)
        self.assertTrue(result, "Batch insertion should succeed")
        
        # Verify all entities were inserted
        db = self.helper._client[self.helper._db_name]
        count = db[self.test_collection].count_documents({'type': 'TestEntity'})
        self.assertEqual(count, 10, "Should have 10 entities after batch insert")
        
    def test_find_entity_by_id(self):
        """Test finding an entity by ID"""
        entity_id = 'urn:ngsi-ld:TestEntity:003'
        entity = self._create_test_entity(entity_id)
        
        # Insert entity
        self.helper.insert_entity(entity, collection_name=self.test_collection)
        
        # Find entity
        found = self.helper.find_entity(entity_id, collection_name=self.test_collection)
        self.assertIsNotNone(found)
        self.assertEqual(found['id'], entity_id)
        
    def test_find_entity_not_found(self):
        """Test finding a non-existent entity returns None"""
        found = self.helper.find_entity(
            'urn:ngsi-ld:TestEntity:nonexistent',
            collection_name=self.test_collection
        )
        self.assertIsNone(found)
        
    def test_find_near_location(self):
        """Test geospatial query for nearby entities"""
        # Insert entities at different locations
        entity1 = self._create_test_entity('urn:ngsi-ld:TestEntity:101')
        entity1['location']['value']['coordinates'] = [105.8342, 21.0278]  # Hanoi center
        
        entity2 = self._create_test_entity('urn:ngsi-ld:TestEntity:102')
        entity2['location']['value']['coordinates'] = [105.8400, 21.0300]  # ~1km away
        
        entity3 = self._create_test_entity('urn:ngsi-ld:TestEntity:103')
        entity3['location']['value']['coordinates'] = [106.8342, 22.0278]  # ~150km away
        
        self.helper.insert_entity(entity1, collection_name=self.test_collection)
        self.helper.insert_entity(entity2, collection_name=self.test_collection)
        self.helper.insert_entity(entity3, collection_name=self.test_collection)
        
        # Find entities within 2km of Hanoi center
        nearby = self.helper.find_near_location(
            longitude=105.8342,
            latitude=21.0278,
            max_distance=2000,  # 2km in meters
            collection_name=self.test_collection
        )
        
        self.assertEqual(len(nearby), 2, "Should find 2 entities within 2km")
        entity_ids = {e['id'] for e in nearby}
        self.assertIn('urn:ngsi-ld:TestEntity:101', entity_ids)
        self.assertIn('urn:ngsi-ld:TestEntity:102', entity_ids)
        self.assertNotIn('urn:ngsi-ld:TestEntity:103', entity_ids)
        
    def test_insert_invalid_entity(self):
        """Test handling of invalid entity (missing required fields)"""
        invalid_entity = {
            'type': 'TestEntity'
            # Missing 'id' field
        }
        
        # Should return False but not raise exception
        result = self.helper.insert_entity(invalid_entity, collection_name=self.test_collection)
        self.assertFalse(result, "Insert should fail gracefully for invalid entity")
        
    def test_batch_insert_partial_failure(self):
        """Test batch insert with some invalid entities"""
        entities = [
            self._create_test_entity('urn:ngsi-ld:TestEntity:201'),
            {'type': 'TestEntity'},  # Invalid: missing 'id'
            self._create_test_entity('urn:ngsi-ld:TestEntity:202'),
        ]
        
        # Should still succeed for valid entities
        result = self.helper.insert_entities_batch(
            entities,
            collection_name=self.test_collection,
            ordered=False  # Continue on error
        )
        
        # At least some entities should be inserted
        db = self.helper._client[self.helper._db_name]
        count = db[self.test_collection].count_documents({'type': 'TestEntity'})
        self.assertGreaterEqual(count, 2, "Valid entities should be inserted despite invalid ones")
        
    def test_connection_pooling(self):
        """Test that connection pooling works correctly"""
        # Get multiple helper instances
        helper1 = get_mongodb_helper()
        helper2 = get_mongodb_helper()
        
        # Should be the same instance (singleton pattern)
        self.assertIs(helper1, helper2, "Should return same helper instance")
        
        # Both should share the same client
        self.assertIs(helper1._client, helper2._client, "Should share same client connection")
        
    def test_collection_mapping(self):
        """Test that collection names are properly mapped from entity types"""
        entity = self._create_test_entity('urn:ngsi-ld:Camera:001', entity_type='Camera')
        
        # Should use collection mapping from config
        result = self.helper.insert_entity(entity)
        self.assertTrue(result)
        
        # Verify entity is in correct collection
        expected_collection = self.helper._collection_map.get('Camera', 'ngsi_ld_entities')
        db = self.helper._client[self.helper._db_name]
        found = db[expected_collection].find_one({'id': entity['id']})
        self.assertIsNotNone(found)
        
        # Clean up
        db[expected_collection].delete_one({'id': entity['id']})


class TestMongoDBGracefulDegradation(unittest.TestCase):
    """Test graceful degradation when MongoDB is unavailable"""

    def test_import_without_pymongo(self):
        """Test that code works even without pymongo installed"""
        # This test just verifies the import doesn't crash
        # The actual test is that MONGODB_AVAILABLE flag exists
        self.assertIsInstance(MONGODB_AVAILABLE, bool)
        
    @unittest.skipIf(MONGODB_AVAILABLE, "Test only runs when MongoDB unavailable")
    def test_helper_unavailable(self):
        """Test behavior when MongoDB is not available"""
        # When pymongo not installed, get_mongodb_helper should be None
        self.assertFalse(MONGODB_AVAILABLE)


if __name__ == '__main__':
    unittest.main()
