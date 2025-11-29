"""
RDF Conversion CLI
Module: src.cli.rdf.convert
Author: Nguyen Viet Hoang 
Created: 2025-11-26
Version: 1.0.0
License: MIT
Description:
    Convert between RDF formats (Turtle, JSON-LD, RDF/XML).

 Features:
    - Input/Output format selection
    - Triple count reporting
Usage:
    python convert.py input.ttl output.jsonld --input-format turtle --output-format jsonld
    
"""


import logging
import argparse
from pathlib import Path

try:
    from rdflib import Graph
    RDFLIB_AVAILABLE = True
except ImportError:
    RDFLIB_AVAILABLE = False
    print("Warning: rdflib not installed. Install with: pip install rdflib")

logger = logging.getLogger(__name__)


def convert_rdf(input_file: str, output_file: str, input_format: str, output_format: str):
    """Convert RDF between formats using rdflib."""
    if not RDFLIB_AVAILABLE:
        print("ERROR: rdflib not available")
        return
    
    # Format mappings
    format_map = {
        "turtle": "turtle",
        "jsonld": "json-ld",
        "xml": "xml"
    }
    
    in_fmt = format_map.get(input_format, "turtle")
    out_fmt = format_map.get(output_format, "json-ld")
    
    try:
        # Create graph and parse input
        g = Graph()
        print(f"Reading {input_file} as {input_format}...")
        g.parse(input_file, format=in_fmt)
        
        triples = len(g)
        print(f"✓ Loaded {triples} triples")
        
        # Serialize to output format
        print(f"Writing {output_file} as {output_format}...")
        g.serialize(destination=output_file, format=out_fmt, indent=2)
        
        print(f"✓ Conversion complete: {triples} triples written")
        
    except FileNotFoundError:
        print(f"ERROR: Input file not found: {input_file}")
    except Exception as e:
        print(f"ERROR: Conversion failed - {e}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="RDF format conversion - Production Ready")
    parser.add_argument("input_file", help="Input RDF file")
    parser.add_argument("output_file", help="Output RDF file")
    parser.add_argument("--input-format", choices=["turtle", "jsonld", "xml"], default="turtle", help="Input format")
    parser.add_argument("--output-format", choices=["turtle", "jsonld", "xml"], default="jsonld", help="Output format")
    
    args = parser.parse_args()
    
    convert_rdf(args.input_file, args.output_file, args.input_format, args.output_format)


if __name__ == "__main__":
    main()
