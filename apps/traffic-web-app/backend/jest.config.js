/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2025 UIP Team. All rights reserved.
 *
 * UIP - Urban Intelligence Platform
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * @module apps/traffic-web-app/backend/jest.config
 * @author UIP Team
 * @created 2025-11-29
 * @modified 2025-12-06
 * @version 1.0.0
 *
 * @description
 * Jest Testing Framework Configuration
 * 
 * This configuration file sets up Jest for testing TypeScript code in the backend application.
 * It configures ts-jest preset for seamless TypeScript integration, defines test environments,
 * coverage collection, and test matching patterns.
 */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    globals: {
        'ts-jest': {
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true
            }
        }
    }
};
