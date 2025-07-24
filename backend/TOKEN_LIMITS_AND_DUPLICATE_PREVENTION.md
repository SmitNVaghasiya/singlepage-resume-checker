# Token Limits and Duplicate Request Prevention

This document describes the implementation of token limits for Groq API calls and duplicate request prevention to improve system reliability and prevent abuse.

## Token Limits

### Overview

The system now implements token counting and validation to prevent excessive API usage and ensure efficient processing.

### Configuration

Token limits are configured in `src/config/config.ts`:

```typescript
// Token limits for Groq API
maxInputTokens: 4096,        // Maximum input tokens per request
maxOutputTokens: 1024,       // Maximum output tokens per request
maxTotalTokens: 5000,        // Maximum total tokens (input + output)
```

### Environment Variables

You can override these limits using environment variables:

```bash
MAX_INPUT_TOKENS=4096
MAX_OUTPUT_TOKENS=1024
MAX_TOTAL_TOKENS=5000
```

### Token Counting

- Uses a simple approximation: 1 token ≈ 4 characters for English text
- Validates both resume and job description content
- Estimates output tokens based on input size (1.5x ratio)
- Enforces minimum content requirements (10 tokens each)

### Validation Rules

1. **Resume text**: Must be between 10 and 4096 tokens
2. **Job description**: Must be between 10 and 4096 tokens
3. **Total input**: Must not exceed 4096 tokens
4. **Total tokens**: Must not exceed 5000 tokens (input + estimated output)

### Error Response

When limits are exceeded, the API returns:

```json
{
  "error": "Token limit exceeded",
  "message": "Content too long for analysis",
  "details": ["Resume text too long. Maximum 4096 tokens allowed, got 5000"],
  "tokenCounts": {
    "resumeTokens": 5000,
    "jobDescriptionTokens": 1000,
    "totalInputTokens": 6000,
    "estimatedOutputTokens": 1500,
    "totalTokens": 7500
  }
}
```

## Duplicate Request Prevention

### Overview

Prevents users from submitting identical analysis requests repeatedly, reducing unnecessary API calls and improving user experience.

### Configuration

Duplicate prevention settings in `src/config/config.ts`:

```typescript
// Duplicate request prevention
duplicateRequestWindowMs: 300000,    // 5 minutes window
duplicateRequestMaxRetries: 3,       // Maximum retries allowed
```

### Environment Variables

```bash
DUPLICATE_REQUEST_WINDOW_MS=300000
DUPLICATE_REQUEST_MAX_RETRIES=3
```

### How It Works

1. **Request Hashing**: Creates a hash based on resume and job description content
2. **User-Specific**: Tracks requests per user (anonymous users tracked separately)
3. **Time Window**: Prevents duplicates within a 5-minute window
4. **Retry Logic**: Allows up to 3 retries before blocking
5. **Status Tracking**: Tracks processing, completed, and failed states

### Request Hash Generation

- Combines resume and job description text
- Normalizes whitespace and trims content
- Creates a simple hash using character codes
- User-specific to prevent cross-user conflicts

### Error Response

When duplicate is detected:

```json
{
  "error": "Duplicate request",
  "message": "You have already submitted this analysis recently. Please wait before trying again.",
  "existingAnalysisId": "analysis_123",
  "retryCount": 3,
  "retryAfter": "5 minutes"
}
```

### Retry Logic

- **Retry 1-3**: Request allowed, retry count incremented
- **Retry 4+**: Request blocked until window expires
- **Window Expired**: Request allowed, counter reset

## Implementation Details

### Files Modified

1. `src/config/config.ts` - Added configuration options
2. `src/utils/tokenCounter.ts` - Token counting utility
3. `src/services/cacheService.ts` - Duplicate prevention methods
4. `src/controllers/resumeController.ts` - Integration with analysis flow

### Cache Keys

- `duplicate:{userId}:{requestHash}` - Duplicate request tracking
- `analysis:status:{analysisId}` - Analysis status
- `analysis:result:{analysisId}` - Analysis results

### Error Handling

- Graceful degradation if cache operations fail
- Detailed logging for debugging
- User-friendly error messages
- Token count information in responses

## Testing

### Token Counter Tests

Run the token counter tests:

```bash
npm test -- --testPathPattern=tokenCounter.test.ts
```

### Manual Testing

1. Submit a normal analysis request
2. Immediately submit the same request → Should be blocked
3. Wait 5 minutes → Should be allowed
4. Submit extremely long content → Should be blocked with token limit error

## Monitoring

### Logs to Watch

- Token estimation logs: `Analysis token estimation`
- Duplicate detection: `Duplicate request detected`
- Cache operations: `Analysis request recorded`

### Metrics to Track

- Token limit violations
- Duplicate request attempts
- Cache hit/miss rates
- Analysis completion rates

## Future Enhancements

### Potential Improvements

1. **Dynamic Token Limits**: Adjust based on user tier/plan
2. **Advanced Hashing**: Use more sophisticated content hashing
3. **Rate Limiting**: Add per-user rate limits
4. **Token Usage Analytics**: Track token consumption patterns
5. **Content Optimization**: Suggest content length optimizations

### Configuration Options

- Per-user token limits
- Custom duplicate windows
- Retry strategies
- Cache TTL adjustments
