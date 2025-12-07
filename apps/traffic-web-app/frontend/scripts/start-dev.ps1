#!/usr/bin/env pwsh
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
#
# Module: start-dev.ps1
# Author: Nguyen Nhat Quang
# Created: 2025-11-26
# Modified: 2025-12-06
# Version: 2.0.1
# Description: Start Development Server for Traffic Web App Frontend

# Get script directory and navigate to frontend folder
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")
npm run dev

