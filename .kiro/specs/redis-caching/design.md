# Design Document: Redis Caching Layer

## Overview

This design implements a Redis caching layer between the backend and PostgreSQL database to reduce database load and improve performance. The system caches frequently accessed data (scan results, vulnerability lists) with intelligent cache invalidation strategies.

## Architecture

### Caching Flow

```
API Request
    ↓
Check Redis Cache
    ↓
Cache Hit?
├─ Yes → Return Cached Data
└─ No → Query Database
        ↓
        Cache Result in Redis
        ↓
        Set TTL
        ↓
        Return Data
```

### Cache Invalidation Flow

```
Data Modification (POST/DELETE)
    ↓
Update Database
    ↓
Invalidate Related Cache Keys
    ↓
Clear from Redis
    ↓
Return Response
```

### Multi-Instance Coordination

```
Instance A: Data Modified
    ↓
Publish Cache Invalidation Event
    ↓
Redis Pub/Sub
    ↓
Instance B: Receive Event
    ↓
Clear Local Cache
```

## Components and Interfaces

### Backend Components

#### 1. Redis Connection Manager
```python
class RedisManager:
    def __init__(redis_url: str)
    def connect() -> None
    def disconnect() -> None
    def is_connected() -> bool
    def get_client() -> redis.Redis
```

#### 2. Cache Service
```python
class CacheService:
    def get(key: str) -> Any | None
    def set(key: str, value: Any, ttl: int = 300) -> None
    def delete(key: str) -> None
    def invalidate_pattern(pattern: str) -> None
    def clear_all() -> None
    def get_stats() -> CacheStats
```

#### 3. Cache Decorator
```python
@cache(ttl=300, key_prefix="scan_results")
async def get_scan_results():
    # Function implementation
    pass
```

#### 4. Cache Invalidation Service
```python
class CacheInvalidationService:
    def invalidate_scan_results() -> None
    def invalidate_vulnerabilities() -> None
    def invalidate_image(image_name: str) -> None
    def invalidate_on_scan_add() -> None
    def invalidate_on_scan_delete() -> None
```

#### 5. Enhanced API Endpoints
- `GET /api/cache/stats` - Get cache statistics
- `POST /api/cache/clear` - Clear cache (admin only)
- `GET /api/cache/health` - Check Redis health

## Data Models

### Cache Keys
```
scan_results:all -> List[ScanResult]
scan_results:image:{image_name} -> List[ScanResult]
vulnerabilities:all -> List[Vulnerability]
vulnerabilities:active -> List[Vulnerability]
image:{image_name}:latest -> ScanResult
image:{image_name}:versions -> List[Version]
```

### Cache Statistics
```json
{
  "total_keys": 150,
  "memory_used": "2.5MB",
  "hits": 1250,
  "misses": 50,
  "hit_rate": 0.962,
  "evictions": 5,
  "connected": true,
  "uptime": 3600
}
```

### Cache Entry
```json
{
  "key": "scan_results:all",
  "value": [...],
  "ttl": 300,
  "created_at": "2024-01-15T10:30:00Z",
  "last_accessed": "2024-01-15T10:35:00Z",
  "access_count": 25
}
```

## Caching Strategy

### TTL Configuration
```python
CACHE_TTL = {
    "scan_results": 300,           # 5 minutes
    "vulnerabilities": 600,        # 10 minutes
    "image_metadata": 900,         # 15 minutes
    "vulnerability_index": 600,    # 10 minutes
    "user_sessions": 86400         # 24 hours
}
```

### Cache Invalidation Triggers
```python
INVALIDATION_TRIGGERS = {
    "POST /api/scan-results": ["scan_results:*", "vulnerabilities:*"],
    "DELETE /api/scan-results/{id}": ["scan_results:*", "vulnerabilities:*"],
    "POST /api/auth/login": ["user_sessions:*"],
    "POST /api/auth/logout": ["user_sessions:*"]
}
```

### Fallback Strategy
```
Redis Unavailable?
    ↓
Log Warning
    ↓
Query Database Directly
    ↓
Return Data
    ↓
Attempt Redis Reconnection
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.

### Property 1: Cache Hit Consistency
**For any** cached data, the cached value should be identical to the current database value until the cache is invalidated.

**Validates: Requirements 2.1, 2.2**

### Property 2: Cache Invalidation Completeness
**For any** data modification, all related cache entries should be invalidated, ensuring no stale data is served.

**Validates: Requirements 3.1, 3.2, 4.1**

### Property 3: TTL Expiration
**For any** cached entry, after the TTL expires, the next request should fetch fresh data from the database.

**Validates: Requirements 2.4, 2.5**

### Property 4: Fallback Functionality
**For any** Redis unavailability, the system should continue functioning by querying the database directly.

**Validates: Requirements 1.2, 1.3**

### Property 5: Multi-Instance Consistency
**For any** multi-instance deployment, cache invalidation events should be propagated to all instances via Redis Pub/Sub.

**Validates: Requirements 6.1, 6.2**

### Property 6: Cache Statistics Accuracy
**For any** cache operation, the statistics (hits, misses, evictions) should accurately reflect the cache behavior.

**Validates: Requirements 5.1, 5.2**

## Error Handling

1. **Redis Connection Failure**: Log error, fall back to database
2. **Cache Set Failure**: Log warning, continue without caching
3. **Cache Get Failure**: Log warning, query database
4. **Serialization Error**: Log error, skip caching
5. **TTL Parsing Error**: Use default TTL

## Testing Strategy

### Unit Tests
- Test cache get/set operations
- Test cache invalidation patterns
- Test TTL expiration
- Test fallback to database
- Test cache statistics

### Property-Based Tests
- **Property 1**: Generate cache operations, verify consistency
- **Property 2**: Generate data modifications, verify invalidation
- **Property 3**: Generate TTL scenarios, verify expiration
- **Property 4**: Generate Redis failures, verify fallback
- **Property 5**: Generate multi-instance events, verify propagation
- **Property 6**: Generate cache operations, verify statistics

### Integration Tests
- Test caching with real Redis instance
- Test cache invalidation on data changes
- Test multi-instance cache coordination
- Test performance improvements
- Test cache behavior under load

### Performance Tests
- Measure response time with/without cache
- Measure database load reduction
- Measure memory usage
- Measure cache hit rates
- Stress test with concurrent requests

