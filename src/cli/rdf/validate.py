#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RDF Validation CLI.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.cli.rdf.validate
Author: Nguyen Viet Hoang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Validate RDF data against SHACL shapes or Smart Data Models.
    Full production implementation with real pyshacl validation.
"""

import argparse
import logging

try:
    from pyshacl import validate
    from rdflib import Graph

    PYSHACL_AVAILABLE = True
except ImportError:
    PYSHACL_AVAILABLE = False
    print("Warning: pyshacl not installed. Install with: pip install pyshacl")

logger = logging.getLogger(__name__)


def validate_rdf(input_file: str, shapes_file: str = None):
    """Validate RDF file against SHACL shapes."""
    if not PYSHACL_AVAILABLE:
        print("ERROR: pyshacl library not available")
        return None

    try:
        # Load data graph
        print(f"Loading data from {input_file}...")
        data_graph = Graph()
        data_graph.parse(input_file, format="turtle")
        print(f"✓ Loaded {len(data_graph)} triples")

        # Load shapes graph if provided
        shapes_graph = None
        if shapes_file:
            print(f"Loading SHACL shapes from {shapes_file}...")
            shapes_graph = Graph()
            shapes_graph.parse(shapes_file, format="turtle")
            print(f"✓ Loaded {len(shapes_graph)} shape triples")

        # Run validation
        print("\nRunning SHACL validation...")
        conforms, results_graph, results_text = validate(
            data_graph,
            shacl_graph=shapes_graph,
            inference="rdfs",
            abort_on_first=False,
            meta_shacl=False,
            advanced=True,
        )

        # Report results
        print("\n" + "=" * 60)
        if conforms:
            print("✓ VALIDATION PASSED")
            print("All constraints satisfied")
        else:
            print("✗ VALIDATION FAILED")
            print("\nValidation Report:")
            print(results_text)

            # Count violations
            violations = results_graph.query(
                """
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT (COUNT(?result) as ?count)
                WHERE { ?result a sh:ValidationResult }
            """
            )
            for row in violations:
                count = row[0]
                print(f"\nTotal violations: {count}")
        print("=" * 60)

        return conforms

    except FileNotFoundError as e:
        print(f"ERROR: File not found - {e}")
        return False
    except Exception as e:
        print(f"ERROR: Validation failed - {e}")
        return False


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="RDF SHACL validation - Production Ready"
    )
    parser.add_argument("input_file", help="RDF file to validate (Turtle format)")
    parser.add_argument("--shapes", help="SHACL shapes file (Turtle format)")

    args = parser.parse_args()

    conforms = validate_rdf(args.input_file, args.shapes)
    exit(0 if conforms else 1)


if __name__ == "__main__":
    main()
