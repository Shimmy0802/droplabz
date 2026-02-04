# Phase 2 Error Handling Quick Reference

## Standard Error Response Pattern

### For Most Routes (Using try-catch)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-utils';
import { z } from 'zod';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate/authorize
        const user = await getCurrentUser();

        // 2. Parse and validate
        const body = await req.json();
        const data = mySchema.parse(body);

        // 3. Execute logic
        const result = await db.model.create({ data });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('[API Error] POST /api/path:', error);

        // Exception discrimination (order matters!)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
        }

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to [action]' }, { status: 500 });
    }
}
```

### For Routes Using apiResponse/apiError Helpers

```typescript
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { z } from 'zod';

export async function GET(req: NextRequest) {
    try {
        // ... logic here
        return apiResponse(data);
    } catch (error) {
        console.error('[API Error] GET /api/path:', error);

        if (error instanceof z.ZodError) {
            return apiResponse({ error: 'VALIDATION_ERROR', issues: error.issues }, 400);
        }

        if (error instanceof ApiError) {
            return apiResponse({ error: error.code, message: error.message }, error.statusCode);
        }

        return apiResponse({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch' }, 500);
    }
}
```

## Common Error Codes

### Application Errors (ApiError)

```typescript
// Usage:
throw new ApiError('ERROR_CODE', statusCode, 'Human-readable message');

// Common codes:
throw new ApiError('UNAUTHORIZED', 401, 'Authentication required');
throw new ApiError('FORBIDDEN', 403, 'Community admin access required');
throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
throw new ApiError('EVENT_INACTIVE', 400, 'Event is not currently accepting entries');
throw new ApiError('INVALID_WALLET', 400, 'Invalid Solana wallet address');
throw new ApiError('DUPLICATE_ENTRY', 400, 'Already entered this event');
throw new ApiError('SLUG_EXISTS', 400, 'Slug already taken');
```

### Validation Errors (Zod)

```typescript
// Automatically becomes:
{
    error: 'VALIDATION_ERROR',
    issues: [
        {
            code: 'too_small',
            minimum: 1,
            type: 'string',
            path: ['name'],
            message: 'String must contain at least 1 character(s)'
        }
    ]
}
```

### Server Errors (Generic)

```typescript
// Any uncaught Error becomes:
{
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to [operation]'
}
```

## Logging Pattern

All error handlers should use:

```typescript
console.error('[API Error] METHOD /api/path:', error);
```

This makes errors searchable in logs and clearly distinguishes API errors from other console output.

## Status Codes

| Code | Meaning      | When to Use                            |
| ---- | ------------ | -------------------------------------- |
| 200  | OK           | Successful GET                         |
| 201  | Created      | Successful POST (resource created)     |
| 400  | Bad Request  | Validation error, business logic error |
| 401  | Unauthorized | User not authenticated                 |
| 403  | Forbidden    | User authenticated but not authorized  |
| 404  | Not Found    | Resource doesn't exist                 |
| 500  | Server Error | Unhandled error, database error, etc.  |

## Checklist for New Routes

- [ ] Add `import { ApiError } from '@/lib/api-utils';`
- [ ] Add `import { z } from 'zod';` if using validation
- [ ] Create Zod schema for request validation
- [ ] Add try-catch with error discrimination
- [ ] Include `[API Error]` logging prefix
- [ ] Throw `ApiError` for business logic errors
- [ ] Test error responses with invalid inputs
- [ ] Run `pnpm type-check` to verify no TypeScript errors
- [ ] Run `pnpm build` to verify build succeeds

## Examples from Codebase

### events/route.ts (Improved in Phase 2a)

See: `/apps/web/src/app/api/events/route.ts`

### presales/route.ts (Improved in Phase 2a)

See: `/apps/web/src/app/api/presales/route.ts`

### entries/route.ts (Improved in Phase 2c)

See: `/apps/web/src/app/api/entries/route.ts`

### communities/[id]/route.ts (Improved in Phase 2d)

See: `/apps/web/src/app/api/communities/[communityId]/route.ts`

---

_For full Phase 2 details, see: PHASE_2_COMPLETION_SUMMARY.md_
