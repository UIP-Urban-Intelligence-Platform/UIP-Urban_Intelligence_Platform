<!--
File: .github/SUPPORT.md
Module: .github/SUPPORT.md
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Support Documentation for UIP - Urban Intelligence Platform

SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Support Documentation
-->

## Support for UIP - Urban Intelligence Platform

Thank you for using UIP - Urban Intelligence Platform! This document provides information on how to get help and support.

## 📚 Documentation

Before asking for help, please check our documentation:

- **README.md**: Project overview and quick start guide
- **docs/**: Detailed documentation
  - [Architecture](../docs/architecture/ARCHITECTURE.md)
  - [API Documentation](../docs/api/API.md)
  - [Configuration Guide](../docs/configuration/README.md)
- **CHANGELOG.md**: Version history and release notes
- **FAQ**: Common questions and answers (see below)

## 🐛 Reporting Bugs

If you've found a bug, please:

1. **Search existing issues** to avoid duplicates
2. **Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml)**
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Error logs
   - Environment details

[Create Bug Report](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues/new?template=bug_report.yml)

## 💡 Feature Requests

Have an idea for a new feature?

1. **Check existing feature requests**
2. **Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml)**
3. **Describe your use case clearly**

[Request Feature](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues/new?template=feature_request.yml)

## 💬 Getting Help

### Community Channels

Join our community to get help and connect with other users:

| Channel | Description | Link |
|---------|-------------|------|
| 📧 **Mailing List** | Announcements & discussions | [Google Groups](https://groups.google.com/g/uip---urban-intelligence-platform) |
| 💬 **Discord** | Real-time chat & support | [Join Discord](https://discord.com/invite/tbDJqsUu) |
| 💬 **GitHub Discussions** | Q&A & community discussions | [GitHub Discussions](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/discussions) |

### GitHub Discussions

For questions and general discussion, use [GitHub Discussions](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/discussions):

- **Q&A**: Ask questions
- **Ideas**: Share and discuss ideas
- **Show and Tell**: Share your projects using UIP
- **General**: General discussion

### Mailing List

Subscribe to our mailing list to receive:
- 📢 Release announcements
- 🔔 Important updates
- 📝 Community newsletters
- 💡 Tips and best practices

**Subscribe**: [Google Groups](https://groups.google.com/g/uip---urban-intelligence-platform)

### Community Support

- **Response Time**: Usually within 24-48 hours
- **Best Practices**: Provide code samples, error logs, and environment details
- **Search First**: Check if your question has already been answered

## 🔒 Security Issues

**DO NOT** report security vulnerabilities through public issues!

Please report security issues privately:

1. **Email**: security@your-domain.com
2. **GitHub Security Advisory**: [Create Security Advisory](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/security/advisories/new)

See [SECURITY.md](SECURITY.md) for more information.

## 📞 Contact

- **General Questions**: Use [GitHub Discussions](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues)
- **Mailing List**: [Google Groups](https://groups.google.com/g/uip---urban-intelligence-platform)
- **Email**: nguyennhatquang522004@gmail.com

## ❓ FAQ

### Installation & Setup

**Q: How do I install UIP - Urban Intelligence Platform?**

A: See the [Installation Guide](../README.md#installation) in the README.

**Q: What are the system requirements?**

A: 
- Python 3.9, 3.10, or 3.11
- Docker and Docker Compose
- 4GB RAM minimum (8GB recommended)
- Linux, macOS, or Windows

**Q: How do I configure environment variables?**

A: Copy `.env.example` to `.env` and edit the values. See [Configuration Guide](../docs/configuration/README.md) for details.

### Docker & Deployment

**Q: Why can't I connect to Stellio/Fuseki/Neo4j?**

A: Check that all services are running:
```bash
docker-compose ps
```

Wait for services to be fully started (may take 1-2 minutes).

**Q: How do I reset the database?**

A: 
```bash
docker-compose down -v
docker-compose up -d
```

**Q: Can I run without Docker?**

A: Yes, but you'll need to install and configure Stellio, Fuseki, Neo4j, and Redis manually. Docker Compose is recommended.

### Usage & Features

**Q: How do I process 722 cameras?**

A: Run the full pipeline:
```bash
python orchestrator.py
```

Check `config/workflow.yaml` for pipeline configuration.

**Q: How do I customize YOLOX detection?**

A: Edit `config/cv_config.yaml`:
```yaml
cv_detection:
  model_type: yolox
  weights: assets/models/yolox_x.pth
  confidence: 0.5
  classes: [0, 1, 2, 3, 5, 7]  # person, bicycle, car, motorcycle, bus, truck
```

**Q: How do I add a new agent?**

A: See [Contributing Guide](.github/CONTRIBUTING.md) and [Architecture Guide](../docs/architecture/ARCHITECTURE.md).

### Troubleshooting

**Q: Tests are failing - what should I check?**

A:
1. Ensure all services are running: `docker-compose ps`
2. Check logs: `docker-compose logs [service-name]`
3. Verify Python version: `python --version`
4. Reinstall dependencies: `pip install -r requirements/test.txt`

**Q: Why is the pipeline slow?**

A:
- Check resource usage: `docker stats`
- Increase worker threads in config
- Consider upgrading to YOLOX-S/M for better performance
- Enable batch processing in config

**Q: Where are the logs stored?**

A: Check the `logs/` directory:
- `logs/orchestrator.log`: Main orchestrator logs
- `logs/agents/`: Individual agent logs
- `docker-compose logs [service]`: Docker service logs

### Configuration

**Q: How do I change the Stellio URL?**

A: Edit `.env`:
```
STELLIO_URL=http://your-stellio-host:8080
```

**Q: How do I enable debug logging?**

A: Set in `.env`:
```
LOG_LEVEL=DEBUG
```

**Q: Can I use a different YOLOX model?**

A: Yes, edit `config/cv_config.yaml`:
```yaml
cv_detection:
  model: yolox_m.pth  # or yolox_s.pth, yolox_l.pth, yolox_x.pth
```

### Performance

**Q: How can I improve performance?**

A:
- Use GPU for YOLOX detection (requires CUDA)
- Increase parallel workers in config
- Use faster YOLOX model (yolox_s/m)
- Enable batch processing
- Increase Docker resource limits

**Q: Can I use a different detection model?**

A: Yes, edit `config/cv_config.yaml`:
```yaml
cv_detection:
  model_type: yolox
  weights: assets/models/yolox_m.pth  # or yolox_s.pth, yolox_l.pth, yolox_x.pth
```

**Q: What's the expected processing time?**

A: For 722 cameras:
- With YOLOX (CPU): ~15-30 minutes
- With YOLOX (GPU): ~5-10 minutes
- Without detection: ~2-5 minutes

## 📖 Additional Resources

- [Architecture Documentation](../docs/architecture/ARCHITECTURE.md)
- [API Documentation](../docs/api/API.md)
- [Contributing Guide](.github/CONTRIBUTING.md)
- [Code Examples](../examples/)
- [Video Tutorials](#) (if available)

## 🤝 Contributing

Want to contribute? See our [Contributing Guide](.github/CONTRIBUTING.md)!

We welcome:
- Bug reports
- Feature requests
- Documentation improvements
- Code contributions
- Test improvements

## 📊 Project Status

- **Current Version**: 1.0.0
- **Status**: Active development
- **Python Support**: 3.9, 3.10, 3.11
- **License**: See LICENSE file

## ⭐ Support the Project

If you find this project helpful:
- ⭐ Star the repository
- 📢 Share with others
- 🐛 Report bugs
- 💡 Suggest features
- 🤝 Contribute code

Thank you for using UIP - Urban Intelligence Platform! 🚀
