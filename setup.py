#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Setup Configuration for UIP - Urban Intelligence Platform.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: setup
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-28
Modified: 2025-11-28
Version: 1.0.0
License: MIT

Description:
    Package setup and distribution configuration for the UIP
    Multi-Agent Traffic Management System.
"""

from pathlib import Path

from setuptools import find_packages, setup

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = (
    readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""
)

# Read requirements from requirements.txt
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    with open(requirements_file, "r", encoding="utf-8") as f:
        requirements = [
            line.strip() for line in f if line.strip() and not line.startswith("#")
        ]

setup(
    name="uip-urban-intelligence-platform",
    version="2.0.0",
    description="Multi-Agent Linked Open Data Pipeline for Traffic Management",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn",
    author_email="nguyennhatquang522004@gmail.com, viethoang01062004nt@gmail.com, nguyentuan834897@gmail.com",
    url="https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform",
    license="MIT",
    # Package configuration
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    # Include package data
    include_package_data=True,
    package_data={
        "": ["*.yaml", "*.yml", "*.json"],
    },
    # Dependencies
    install_requires=requirements,
    # Python version requirement
    python_requires=">=3.9",
    # Entry points
    entry_points={
        "console_scripts": [
            "uip-orchestrator=orchestrator:main",
        ],
    },
    # Classifiers
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Intended Audience :: Information Technology",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: GIS",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3 :: Only",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Typing :: Typed",
        "Framework :: AsyncIO",
    ],
    # Keywords
    keywords="linked-data open-data ngsi-ld rdf semantic-web multi-agent traffic smart-city urban-intelligence iot fiware",
    # Project URLs
    project_urls={
        "Documentation": "https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/wiki",
        "Source": "https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform",
        "Bug Reports": "https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues",
        "Changelog": "https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/blob/main/CHANGELOG.md",
        "Discussions": "https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/discussions",
    },
)
