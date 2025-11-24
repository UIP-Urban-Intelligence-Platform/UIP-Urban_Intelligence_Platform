"""Setup Configuration for Builder Layer.

Module: setup
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-23
Version: 1.0.0
License: MIT

Description:
    Package setup and distribution configuration for the Builder Layer
    Multi-Agent Traffic Management System.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding="utf-8") if readme_file.exists() else ""

# Read requirements from requirements.txt
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    with open(requirements_file, 'r', encoding='utf-8') as f:
        requirements = [
            line.strip() 
            for line in f 
            if line.strip() and not line.startswith('#')
        ]

setup(
    name="builder-layer-end",
    version="1.0.0",
    description="Multi-Agent Linked Open Data Pipeline for Traffic Management",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="LOD Pipeline Team",
    author_email="team@example.com",
    url="https://github.com/your-org/builder-layer-end",
    
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
            "builder-orchestrator=orchestrator:main",
        ],
    },
    
    # Classifiers
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    
    # Keywords
    keywords="linked-data open-data ngsi-ld rdf semantic-web multi-agent traffic",
    
    # Project URLs
    project_urls={
        "Documentation": "https://github.com/your-org/builder-layer-end/docs",
        "Source": "https://github.com/your-org/builder-layer-end",
        "Bug Reports": "https://github.com/your-org/builder-layer-end/issues",
    },
)
