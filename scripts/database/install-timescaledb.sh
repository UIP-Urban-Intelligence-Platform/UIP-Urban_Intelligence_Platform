#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Install TimescaleDB extension in PostGIS image
#
# Module: scripts/database/install-timescaledb.sh
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-29
# Version: 1.0.0
# License: MIT
# Description: TimescaleDB installation script for Stellio database
set -e

# Add TimescaleDB repository
echo "deb https://packagecloud.io/timescale/timescaledb/debian/ $(lsb_release -c -s) main" > /etc/apt/sources.list.d/timescaledb.list
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | apt-key add -

# Update and install TimescaleDB
apt-get update
apt-get install -y timescaledb-2-postgresql-15
