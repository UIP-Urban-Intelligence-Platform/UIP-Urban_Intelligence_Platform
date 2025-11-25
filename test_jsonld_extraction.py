#!/usr/bin/env python
"""Test JSON-LD value extraction.
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
"""


# Sample vehicleCount from PostgreSQL
vehicleCount_data = [{
    "@type": ["https://uri.etsi.org/ngsi-ld/Property"],
    "https://uri.etsi.org/ngsi-ld/hasValue": [{"@value": 15}]
}]

def extract_jsonld_value(data):
    """Extract value from JSON-LD."""
    if data is None:
        return None
    
    # Unwrap outer array
    if isinstance(data, list) and len(data) > 0:
        data = data[0]
    
    # Handle dict
    if isinstance(data, dict):
        # Direct @value
        if '@value' in data:
            return data['@value']
        
        # NGSI-LD value
        if 'value' in data:
            return data['value']
        
        # JSON-LD hasValue
        for key in data.keys():
            if 'hasValue' in key:
                has_value_data = data[key]
                if isinstance(has_value_data, list) and len(has_value_data) > 0:
                    value_item = has_value_data[0]
                    if isinstance(value_item, dict) and '@value' in value_item:
                        return value_item['@value']
                    return value_item
                elif isinstance(has_value_data, dict) and '@value' in has_value_data:
                    return has_value_data['@value']
                return has_value_data
    
    return data

result = extract_jsonld_value(vehicleCount_data)
print(f"Extracted vehicleCount: {result}")
print(f"Type: {type(result)}")
