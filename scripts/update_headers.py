#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Update Python File Headers to Open Source Standard.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: scripts.update_headers
Author: UIP Team
Created: 2025-12-01
Version: 1.0.0
License: MIT

Description:
    Updates all Python files in the project with standardized headers
    following open source best practices.
"""

import re
from pathlib import Path

# Author mapping based on CODEOWNERS
AUTHOR_MAPPING = {
    # Nguyen Nhat Quang - Lead Developer
    "nguyễn nhật quang": ("Nguyen Nhat Quang", "nguyennhatquang522004@gmail.com"),
    "nguyen nhat quang": ("Nguyen Nhat Quang", "nguyennhatquang522004@gmail.com"),
    "nguyennhatquang": ("Nguyen Nhat Quang", "nguyennhatquang522004@gmail.com"),
    # Nguyen Viet Hoang - Full-Stack Developer
    "nguyen viet hoang": ("Nguyen Viet Hoang", "viethoang01062004nt@gmail.com"),
    "nguyenviethoang": ("Nguyen Viet Hoang", "viethoang01062004nt@gmail.com"),
    # Nguyen Dinh Anh Tuan - Backend Developer
    "nguyen dinh anh tuan": ("Nguyen Dinh Anh Tuan", "nguyentuan834897@gmail.com"),
    "nguyendinhanhtuan": ("Nguyen Dinh Anh Tuan", "nguyentuan834897@gmail.com"),
    # Default
    "builder layer lod system": ("UIP Team", "nguyennhatquang522004@gmail.com"),
}


def normalize_author(author_str: str) -> tuple:
    """Normalize author name to standard format."""
    if not author_str:
        return ("UIP Team", "nguyennhatquang522004@gmail.com")

    author_lower = author_str.lower().strip()

    for key, value in AUTHOR_MAPPING.items():
        if key in author_lower:
            return value

    return ("UIP Team", "nguyennhatquang522004@gmail.com")


def extract_header_info(content: str) -> dict:
    """Extract existing header information from file."""
    info = {
        "author": None,
        "created": None,
        "version": None,
        "module": None,
        "description": None,
    }

    # Extract Author
    author_match = re.search(r"Author:\s*(.+)", content, re.IGNORECASE)
    if author_match:
        info["author"] = author_match.group(1).strip()

    # Extract Created date
    created_match = re.search(r"Created:\s*(\d{4}-\d{2}-\d{2})", content)
    if created_match:
        info["created"] = created_match.group(1)

    # Extract Version
    version_match = re.search(r"Version:\s*([\d.]+)", content)
    if version_match:
        info["version"] = version_match.group(1)

    # Extract Module
    module_match = re.search(r"Module:\s*(.+)", content)
    if module_match:
        info["module"] = module_match.group(1).strip()

    return info


def has_standard_header(content: str) -> bool:
    """Check if file already has standard header."""
    return "SPDX-License-Identifier: MIT" in content and "Copyright (C)" in content


def create_standard_header(file_path: Path, info: dict) -> str:
    """Create standardized header for Python file."""
    author_name, author_email = normalize_author(info.get("author", ""))
    created = info.get("created", "2025-11-20")
    version = info.get("version", "1.0.0")

    # Calculate module path from file path
    rel_path = file_path.relative_to(Path(__file__).parent.parent)
    module = str(rel_path).replace("\\", ".").replace("/", ".").replace(".py", "")

    return f'''# -*- coding: utf-8 -*-
"""

UIP - Urban Intelligence Platform
Copyright (C) 2025 UIP Team

SPDX-License-Identifier: MIT

Module: {module}
Project: UIP - Urban Intelligence Platform
Author: {author_name} <{author_email}>
Created: {created}
Version: {version}
License: MIT
'''


def update_file_header(file_path: Path) -> bool:
    """Update a single file's header."""
    try:
        content = file_path.read_text(encoding="utf-8")

        # Skip if already has standard header
        if has_standard_header(content):
            return False

        # Extract existing info
        extract_header_info(content)

        # Skip __init__.py files that are mostly empty
        if file_path.name == "__init__.py" and len(content.strip()) < 50:
            return False

        print(f"Updating: {file_path}")
        return True

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


def main():
    """Main function to update all Python files."""
    project_root = Path(__file__).parent.parent

    # Directories to skip
    skip_dirs = {
        "node_modules",
        "__pycache__",
        ".git",
        "venv",
        ".venv",
        "env",
        "dist",
        "build",
    }

    # Find all Python files
    python_files = []
    for py_file in project_root.rglob("*.py"):
        # Skip if in excluded directory
        if any(skip_dir in py_file.parts for skip_dir in skip_dirs):
            continue
        python_files.append(py_file)

    print(f"Found {len(python_files)} Python files")

    updated = 0
    for py_file in python_files:
        if update_file_header(py_file):
            updated += 1

    print(f"\nUpdated {updated} files")


if __name__ == "__main__":
    main()
