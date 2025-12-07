<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: THIRD_PARTY_LICENSES.md
Module: UIP Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete documentation of third-party licenses used in UIP.
============================================================================
-->

# Third-Party Licenses

This document contains the licenses and notices for third-party software included in or used by the UIP - Urban Intelligence Platform project.

**Last Updated:** December 2025  
**Total Dependencies Audited:** 1,464 packages  
**License Compliance Status:** ✅ 100% MIT-Compatible

---

## Table of Contents

1. [License Summary](#license-summary)
2. [Python Dependencies](#python-dependencies)
3. [NPM Backend Dependencies](#npm-backend-dependencies)
4. [NPM Frontend Dependencies](#npm-frontend-dependencies)
5. [Special License Notes](#special-license-notes)
6. [Full License Texts](#full-license-texts)

---

## License Summary

All third-party dependencies use licenses that are compatible with the MIT License:

| License Type | Python | NPM Backend | NPM Frontend | Total |
|--------------|--------|-------------|--------------|-------|
| MIT | 71 | 640 | 421 | 1,132 |
| Apache-2.0 | 40 | 18 | 10 | 68 |
| BSD (2/3-Clause) | 45 | 41 | 20 | 106 |
| ISC | 1 | 56 | 54 | 111 |
| CC0-1.0/Unlicense | 2 | 6 | 4 | 12 |
| CC-BY (3.0/4.0) | 0 | 3 | 3 | 6 |
| BlueOak-1.0.0 | 0 | 0 | 3 | 3 |
| 0BSD | 0 | 1 | 1 | 2 |
| PSF/Python-2.0 | 3 | 1 | 1 | 5 |
| MPL-2.0 | 2 | 0 | 0 | 2 |
| Other Permissive | 4 | 4 | 5 | 13 |
| **Total** | **168** | **772** | **520** | **1,460** |

> **Migration Note (2025-12):** EPL/EDL packages (@turf/jsts, jsts) and Hippocratic-2.1 packages (react-leaflet) have been **removed** and replaced with MIT-compatible alternatives.

> Note: Some packages may have dual/multiple licenses (e.g., "MIT OR CC0-1.0"). They are counted once in their primary category.

### License Compatibility

| License | Compatible with MIT | Commercial Use | Modification | Distribution |
|---------|---------------------|----------------|--------------|--------------|
| MIT | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Apache-2.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| BSD-2-Clause | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| BSD-3-Clause | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| ISC | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| MPL-2.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| PSF-2.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Unlicense | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| CC0-1.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| 0BSD | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| BlueOak-1.0.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| CC-BY-3.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| CC-BY-4.0 | ✅ Yes | ✅ Allowed | ✅ Allowed | ✅ Allowed |

> **Note:** All non-MIT licenses (EPL/EDL, Hippocratic-2.1) have been removed in December 2025 migration.

---

## Python Dependencies

### Core Machine Learning & Computer Vision

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| torch | 2.9.1 | BSD-3-Clause | Deep learning framework |
| torchvision | 0.24.1 | BSD | Computer vision library |
| transformers | 4.57.3 | Apache-2.0 | State-of-the-art NLP/ML models |
| huggingface-hub | 0.36.0 | Apache-2.0 | Hugging Face model hub |
| yolox | 0.3.0 | Apache-2.0 | Object detection framework |
| opencv-python | 4.12.0 | Apache-2.0 | Computer vision library |
| onnx | 1.20.0 | Apache-2.0 | Open Neural Network Exchange |
| timm | 1.0.22 | Apache-2.0 | PyTorch image models |
| pillow | 12.0.0 | MIT-CMU | Image processing |

### Web Framework & API

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| fastapi | 0.123.8 | MIT | Modern web framework |
| uvicorn | 0.38.0 | BSD-3-Clause | ASGI server |
| starlette | 0.50.0 | BSD-3-Clause | ASGI framework |
| pydantic | 2.12.5 | MIT | Data validation |
| httpx | 0.28.1 | BSD | Async HTTP client |
| aiohttp | 3.13.2 | Apache-2.0/MIT | Async HTTP client/server |
| requests | 2.32.5 | Apache-2.0 | HTTP library |

### Database & Storage

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| asyncpg | 0.31.0 | Apache-2.0 | PostgreSQL async driver |
| pymongo | 4.15.5 | Apache-2.0 | MongoDB driver |
| redis | 7.1.0 | MIT | Redis client |
| neo4j | 6.0.3 | Apache-2.0/Python-2.0 | Neo4j graph database driver |

### RDF & Linked Data

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| rdflib | 7.5.0 | BSD | RDF library |
| isodate | 0.7.2 | BSD | ISO 8601 date/time parser |

### Data Processing

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| numpy | 2.2.6 | BSD | Numerical computing |
| pandas | 2.3.3 | BSD | Data analysis |
| scipy | 1.15.3 | BSD | Scientific computing |

### Messaging & Events

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| kafka-python | 2.3.0 | Apache-2.0 | Apache Kafka client |

### Utilities

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| PyYAML | 6.0.3 | MIT | YAML parser |
| python-dotenv | 1.2.1 | BSD-3-Clause | Environment variables |
| loguru | 0.7.3 | MIT | Logging library |
| tqdm | 4.67.1 | MIT/MPL-2.0 | Progress bars |
| rich | 14.2.0 | MIT | Rich text formatting |
| click | 8.3.1 | BSD-3-Clause | CLI framework |

### PDF Generation

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| reportlab | 4.4.5 | BSD-3-Clause | Pure Python PDF generation |

> **Migration Note (2025-12):** weasyprint and pyphen have been **removed** from the project. weasyprint had pyphen (GPL/LGPL) as a dependency. PDF generation now uses pure reportlab (BSD license).

### Development Tools (Not Distributed)

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| pytest | 9.0.1 | MIT | Testing framework |
| pytest-asyncio | 1.3.0 | Apache-2.0 | Async testing |
| pytest-cov | 7.0.0 | MIT | Coverage plugin |
| black | 25.11.0 | MIT | Code formatter |
| ruff | 0.14.8 | MIT | Linting & import sorting (replaces pylint, flake8, isort) |
| mypy | 1.19.0 | MIT | Type checking |

> ✅ All development tools are now 100% MIT-compatible.

---

## NPM Backend Dependencies

### Core Framework

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| express | 4.x | MIT | Web framework |
| typescript | 5.x | Apache-2.0 | TypeScript compiler |
| ts-node | 10.x | MIT | TypeScript execution |

### Database & ORM

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| prisma | 5.x | Apache-2.0 | Database ORM |
| @prisma/client | 5.x | Apache-2.0 | Prisma client |
| mongodb | 6.x | Apache-2.0 | MongoDB driver |
| redis | 4.x | MIT | Redis client |

### Geospatial

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| @turf/turf | 7.x | MIT | Geospatial analysis |

> **Migration Note (2025-12):** @turf/jsts and jsts (EPL-1.0/EDL-1.0) have been **removed** to achieve 100% MIT-compatible licensing.

### Utilities

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| axios | 1.x | MIT | HTTP client |
| lodash | 4.x | MIT | Utility library |
| uuid | 9.x | MIT | UUID generation |
| date-fns | 2.x | MIT | Date utilities |
| zod | 3.x | MIT | Schema validation |

### Testing (Development Only)

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| jest | 29.x | MIT | Testing framework |
| supertest | 6.x | MIT | HTTP testing |

---

## NPM Frontend Dependencies

### React Ecosystem

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| react | 18.2.0 | MIT | UI library |
| react-dom | 18.2.0 | MIT | React DOM |
| react-router-dom | 7.x | MIT | Routing |

### Mapping

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| react-map-gl | 7.1.9 | MIT | React bindings for MapLibre GL JS |
| maplibre-gl | 4.7.1 | BSD-3-Clause | Interactive vector tile maps |

> **Migration Note (2025-12):** react-leaflet (Hippocratic-2.1) was replaced with react-map-gl + MapLibre GL JS to achieve 100% MIT-compatible licensing.

### UI Components

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| lucide-react | 0.x | ISC | Icon library |
| framer-motion | 12.x | MIT | Animation library |

### Data & State

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| axios | 1.x | MIT | HTTP client |
| date-fns | 2.x | MIT | Date utilities |

### Build Tools

| Package | Version | License | Description |
|---------|---------|---------|-------------|
| vite | 5.x | MIT | Build tool |
| typescript | 5.x | Apache-2.0 | TypeScript |
| eslint | 8.x | MIT | Linting |
| tailwindcss | 3.x | MIT | CSS framework |

---

## Special License Notes

### 1. ~~Pyphen (Python)~~ (REMOVED - December 2025)

**Package:** ~~pyphen v0.17.2~~ **REMOVED**  
**Former License:** GPL-2.0+ / LGPL-2.1+ / MPL-1.1  

This package has been **removed** from the project to achieve 100% MIT-compatible licensing. pyphen was a dependency of weasyprint. PDF generation now uses pure reportlab (BSD license).

### 2. ~~JSTS (NPM) - Eclipse License~~ (REMOVED - December 2025)

**Packages:** ~~jsts v2.7.1, @turf/jsts v2.7.2~~ **REMOVED**  
**Former License:** (EDL-1.0 OR EPL-1.0)  

These packages have been **removed** from the project to achieve 100% MIT-compatible licensing. The functionality previously provided by JSTS has been replaced with native MapLibre GL JS features and MIT-licensed alternatives.

### 3. MapLibre GL JS (NPM) - BSD-3-Clause License

**Package:** maplibre-gl v4.7.1  
**License:** BSD-3-Clause  

MapLibre GL JS is an open-source fork of Mapbox GL JS, providing:

**Permissions:**

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

**Requirements:**

- Include copyright notice in distributions
- Cannot use contributor names for endorsement

**react-map-gl (MIT License):**

**Package:** react-map-gl v7.1.9  
**License:** MIT  

React wrapper for MapLibre GL JS from Vis.gl, providing:

- ✅ Full MIT permissions
- React component API for MapLibre GL

### 4. All Licenses are MIT-Compatible

As of v1.0, all dependencies (both production and development) use MIT-compatible licenses:
- **Production**: MIT, BSD-3-Clause, Apache-2.0, ISC, MPL-1.1
- **Development**: MIT, Apache-2.0

Previously used GPL-licensed tools (pylint, astroid) have been replaced with MIT-licensed alternatives (ruff).

---

## Full License Texts

### MIT License

```text
MIT License

Copyright (c) [year] [copyright holders]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache License 2.0

```text
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.
   "License" shall mean the terms and conditions for use, reproduction,
   and distribution as defined by Sections 1 through 9 of this document.

   [Full text available at: https://www.apache.org/licenses/LICENSE-2.0]
```

### BSD 3-Clause License

```text
BSD 3-Clause License

Copyright (c) [year], [copyright holders]
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

### ISC License

```text
ISC License

Copyright (c) [year], [copyright holders]

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Mozilla Public License 1.1

```text
Mozilla Public License Version 1.1

1. Definitions.
   1.0.1. "Commercial Use" means distribution or otherwise making the
   Covered Code available to a third party.

   [Full text available at: https://www.mozilla.org/en-US/MPL/1.1/]
```

### Eclipse Public License 1.0

```text
Eclipse Public License - v 1.0

THE ACCOMPANYING PROGRAM IS PROVIDED UNDER THE TERMS OF THIS ECLIPSE PUBLIC
LICENSE ("AGREEMENT"). ANY USE, REPRODUCTION OR DISTRIBUTION OF THE PROGRAM
CONSTITUTES RECIPIENT'S ACCEPTANCE OF THIS AGREEMENT.

[Full text available at: https://www.eclipse.org/legal/epl-v10.html]
```

### Hippocratic License 2.1

```text
Hippocratic License Version 2.1

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
- The Software shall not be used by any person or entity for any systems,
  activities, or other uses that violate any Human Rights Laws.

[Full text available at: https://firstdonoharm.dev/version/2/1/license/]
```

### BlueOak Model License 1.0.0

```text
BlueOak Model License 1.0.0

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

[Full text available at: https://blueoakcouncil.org/license/1.0.0]
```

### Zero-Clause BSD (0BSD)

```text
Zero-Clause BSD

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Creative Commons Zero v1.0 Universal (CC0-1.0)

```text
CC0 1.0 Universal

The person who associated a work with this deed has dedicated the work to
the public domain by waiving all of his or her rights to the work worldwide
under copyright law, including all related and neighboring rights, to the
extent allowed by law.

You can copy, modify, distribute and perform the work, even for commercial
purposes, all without asking permission.

[Full text available at: https://creativecommons.org/publicdomain/zero/1.0/]
```

### Creative Commons Attribution 4.0 (CC-BY-4.0)

```text
Creative Commons Attribution 4.0 International

You are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material for any purpose

Under the following terms:
- Attribution — You must give appropriate credit, provide a link to the
  license, and indicate if changes were made.

[Full text available at: https://creativecommons.org/licenses/by/4.0/]
```

---

## External Resources

For complete license texts and additional information:

- **MIT License:** <https://opensource.org/licenses/MIT>
- **Apache License 2.0:** <https://www.apache.org/licenses/LICENSE-2.0>
- **BSD Licenses:** <https://opensource.org/licenses/BSD-3-Clause>
- **ISC License:** <https://opensource.org/licenses/ISC>
- **MPL 1.1:** <https://www.mozilla.org/en-US/MPL/1.1/>
- **EPL 1.0:** <https://www.eclipse.org/legal/epl-v10.html>
- **Hippocratic License:** <https://firstdonoharm.dev/>
- **BlueOak-1.0.0:** <https://blueoakcouncil.org/license/1.0.0>
- **CC0-1.0:** <https://creativecommons.org/publicdomain/zero/1.0/>
- **CC-BY-4.0:** <https://creativecommons.org/licenses/by/4.0/>
- **0BSD:** <https://opensource.org/licenses/0BSD>

---

## Acknowledgments

We gratefully acknowledge all the open source contributors and maintainers whose work makes this project possible. This project stands on the shoulders of giants in the open source community.

Special thanks to:

- The PyTorch team for their deep learning framework
- The Hugging Face team for transformers and model hub
- The FastAPI team for their modern Python web framework
- The React team for their UI library
- The Leaflet team for their mapping library
- All other contributors to the packages listed above

---

## Contact

For questions about licensing or third-party dependencies:

- **Project Repository:** <https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform>
- **Issue Tracker:** <https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues>

---

*This document was generated as part of the UIP project's commitment to open source compliance and transparency.*
