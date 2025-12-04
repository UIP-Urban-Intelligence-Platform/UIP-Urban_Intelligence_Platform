<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 Nguyen Nhat Quang

UIP - Urban Intelligence Platform
Security Policy

Module: .github/SECURITY.md
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Version: 1.0.0
-->

# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of UIP - Urban Intelligence Platform seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send details to `security@your-domain.com`
2. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/security/advisories/new) feature
3. **Private Vulnerability Reporting**: Use GitHub's private vulnerability reporting feature

### What to Include

Please include the following information in your report:

- **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- **Full paths of source file(s)** related to the manifestation of the issue
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it

This information will help us triage your report more quickly.

### Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days regarding acceptance or rejection of the report
- **Fix Timeline**: Depends on severity:
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium: Within 90 days
  - Low: Next scheduled release

### Disclosure Policy

- We will work with you to understand and validate the security issue
- We will keep you informed of our progress in addressing the issue
- Once the issue is resolved, we will publicly disclose it in a coordinated manner
- We will acknowledge your contribution in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Developers

1. **Credentials Management**
   - Never commit credentials, API keys, or secrets to the repository
   - Use environment variables for all sensitive configuration
   - Review `.env.example` for proper configuration templates
   - Use secrets management tools (e.g., AWS Secrets Manager, HashiCorp Vault)

2. **Dependency Security**
   - Regularly update dependencies using `pip-audit` or `safety`
   - Review security advisories for used packages
   - Pin dependency versions in production
   - Run `bandit` for security issue detection

3. **Code Security**
   - Follow OWASP secure coding practices
   - Validate and sanitize all user inputs
   - Use parameterized queries for database operations
   - Implement proper error handling (don't expose sensitive info in errors)
   - Use HTTPS for all external communications

4. **Docker Security**
   - Use official base images from trusted sources
   - Run containers as non-root users
   - Scan images for vulnerabilities using `trivy` or `grype`
   - Keep base images updated
   - Minimize image layers and remove unnecessary packages

### For Users

1. **Configuration**
   - Change all default passwords and credentials
   - Use strong, unique passwords for all services
   - Enable authentication and authorization for all services
   - Restrict network access using firewalls

2. **Deployment**
   - Use TLS/SSL for all communications
   - Keep all services and dependencies updated
   - Monitor logs for suspicious activity
   - Implement backup and disaster recovery procedures
   - Use separate environments for dev/staging/production

3. **Data Protection**
   - Encrypt sensitive data at rest and in transit
   - Implement proper access controls
   - Regular security audits and penetration testing
   - Comply with relevant data protection regulations (GDPR, etc.)

## Known Security Considerations

### NGSI-LD Context Broker
- Ensure Stellio is configured with authentication enabled
- Use API keys or OAuth2 for API access
- Implement rate limiting to prevent DoS attacks

### Database Connections
- Neo4j: Enable auth, use strong passwords, disable default credentials
- Fuseki: Configure access control lists (ACLs)
- Redis: Enable password protection, bind to localhost only

### Computer Vision (YOLO)
- Validate image URLs to prevent SSRF attacks
- Implement rate limiting for image processing
- Scan uploaded images for malware
- Set resource limits to prevent resource exhaustion

### API Endpoints
- Implement authentication and authorization
- Use API rate limiting
- Validate all input parameters
- Implement proper CORS policies
- Use HTTPS only

## Security Tools Used

We use the following tools to maintain security:

- **Bandit**: Static security analysis for Python
- **Safety**: Dependency vulnerability scanning
- **Trivy**: Container image vulnerability scanning
- **pip-audit**: Python dependency auditing
- **GitHub Dependabot**: Automated dependency updates
- **CodeQL**: Code scanning for vulnerabilities

## Compliance

This project aims to comply with:

- OWASP Top 10 security risks mitigation
- CWE/SANS Top 25 software errors prevention
- Secure coding standards for Python (PEP 8, PEP 20)

## Security Updates

Security updates will be released as:

- **Patch releases** (x.x.X) for minor security fixes
- **Minor releases** (x.X.x) for moderate security issues
- **Major releases** (X.x.x) for critical security updates with breaking changes

Subscribe to our [security advisories](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/security/advisories) to receive notifications.

## Contact

For security-related questions or concerns:

- **Email**: security@your-domain.com
- **GitHub Security**: Use the Security tab on this repository
- **General Support**: Create a [discussion](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/discussions)

## Acknowledgments

We would like to thank the following security researchers who have responsibly disclosed vulnerabilities:

<!-- List will be updated as security issues are reported and resolved -->

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0
