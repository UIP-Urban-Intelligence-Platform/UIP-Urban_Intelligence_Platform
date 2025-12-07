<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/backend/docs/reports/API_KEY_ROTATION_COMPLETE.md
Module: API Key Rotation Complete Report
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  API Key Rotation System Implemented.
============================================================================
-->

# API Key Rotation System - Implemented ✅

## Tính năng mới

### 1. **Multiple API Keys Support**
Hỗ trợ nhiều API keys cho mỗi service, cách nhau bởi dấu phẩy:

```env
# Ví dụ: 1 key
GEMINI_API_KEY=your_gemini_api_key_here

# Ví dụ: 3 keys
GEMINI_API_KEY=key1,key2,key3
```

### 2. **Automatic Rotation & Fallback**
- **Round-robin**: Luân phiên các keys theo vòng tròn
- **Auto fallback**: Tự động chuyển sang key khác khi gặp lỗi
- **Blacklist management**: Tạm khóa key bị lỗi nhiều lần

### 3. **Error Tracking**
- Đếm số lần lỗi của mỗi key
- Blacklist key sau 3 lần lỗi liên tiếp
- Auto-restore sau 5 phút

## Files đã tạo

### `backend/src/utils/apiKeyRotation.ts`
Class `APIKeyRotationManager` quản lý rotation logic:

**Methods:**
- `getNextKey()` - Lấy key tiếp theo (round-robin/random/least-used)
- `reportSuccess(key)` - Báo cáo API call thành công
- `reportFailure(key, error)` - Báo cáo API call thất bại
- `getStatus()` - Xem trạng thái tất cả keys
- `resetAll()` - Reset tất cả keys (emergency recovery)

**Config options:**
```typescript
{
  maxFailures: 3,                    // Max lỗi trước khi blacklist
  blacklistDurationMs: 5 * 60 * 1000, // 5 phút
  rotationStrategy: 'round-robin'     // round-robin | random | least-used
}
```

## Agents đã tích hợp

### ✅ GraphInvestigatorAgent
**APIs sử dụng rotation:**
- **Gemini Vision** (analyzeVisualContext):
  - 3 max failures
  - 5 min blacklist
  - Round-robin rotation
  
- **Tavily Search** (gatherExternalIntelligence):
  - 2 max failures  
  - 3 min blacklist
  - Round-robin rotation

- **Gemini Pro** (synthesizeWithLLM):
  - Shared với Vision
  - Same rotation pool

**Cách hoạt động:**
```typescript
// Ví dụ có 3 Gemini keys
GEMINI_API_KEY=key1,key2,key3

// Request 1: Dùng key1 → Success
// Request 2: Dùng key2 → Success  
// Request 3: Dùng key3 → Failed (rate limit)
// Request 4: Dùng key1 → Success (skip key3 vì đã blacklist)
// Request 5: Dùng key2 → Success
// ... sau 5 phút key3 được restore
```

### ⏳ EcoTwinAgent (TODO)
Cần tích hợp cho:
- Gemini Pro (generateAIAdvice)
- OpenWeather API

### ⏳ TrafficMaestroAgent (TODO)
Cần tích hợp cho:
- Ticketmaster API
- Mapbox API

## Cách sử dụng

### 1. Cập nhật .env với multiple keys

```env
# Single key (works như cũ)
GEMINI_API_KEY=your_gemini_api_key_here

# Multiple keys (mới)
GEMINI_API_KEY=your_gemini_api_key_here,your_key_2,your_key_3

TAVILY_API_KEY=your_tavily_key_here,your_key_2

TICKETMASTER_API_KEY=your_ticketmaster_key_here,keyXXXXXXXX,keyYYYYYYYY
```

### 2. Agent tự động rotation

Không cần thay đổi code - agent tự động:
1. Parse multiple keys từ env
2. Luân phiên sử dụng
3. Track errors và blacklist
4. Fallback khi cần

### 3. Monitor key status (optional)

```typescript
// Trong agent code
const status = this.geminiKeyManager?.getStatus();
console.log(status);
// Output:
// [
//   { key: 'KEY_1_MASKED', failureCount: 0, isBlacklisted: false },
//   { key: 'KEY_2_MASKED', failureCount: 3, isBlacklisted: true, lastError: 'Rate limit' }
// ]
```

## Log examples

```
[INFO] Gemini: Using key KEY_1_MASKED (Failures: 0)
[INFO] Visual analysis completed - Severity: 8/10, Hazards: 3

[WARN] Gemini: Key KEY_1_MASKED failed (1/3) - Rate limit exceeded
[INFO] Gemini: Using key KEY_2_MASKED (Failures: 0)
[INFO] Visual analysis completed - Severity: 7/10, Hazards: 2

[ERROR] Gemini: Key KEY_3_MASKED BLACKLISTED for 300s (Reason: Quota exceeded)
[INFO] Gemini: Using key KEY_1_MASKED (Failures: 0)

[INFO] Gemini: Key KEY_3_MASKED restored from blacklist
```

## Benefits

### 🚀 Higher Availability
- Không downtime khi 1 key bị rate limit
- Auto fallback đến key còn hoạt động

### 💰 Better Cost Distribution
- Phân tải across multiple keys
- Tối ưu free tier quotas

### 🔒 Enhanced Reliability  
- Blacklist tự động prevents cascading failures
- Auto-recovery sau thời gian chờ

### 📊 Better Monitoring
- Track failure count per key
- Identify problematic keys

## Error handling scenarios

| Scenario | Behavior |
|----------|----------|
| **Rate limit (429)** | Blacklist key, try next one |
| **Invalid key (401)** | Blacklist key, try next one |
| **Quota exceeded** | Blacklist key, try next one |
| **Network timeout** | Retry with same key first, then rotate |
| **All keys blacklisted** | Emergency reset + use first key |

## Next Steps

- [ ] Tích hợp EcoTwinAgent
- [ ] Tích hợp TrafficMaestroAgent  
- [ ] Add metrics tracking (optional)
- [ ] Add admin API để view key status
- [ ] Support weighted rotation (priority keys)
