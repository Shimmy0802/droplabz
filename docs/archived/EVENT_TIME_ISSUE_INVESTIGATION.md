# Event Time Issue Investigation - Complete Findings

## Summary

Event times are being stored with incorrect timezone handling throughout DropLabz. The times stored in the database are offset from what users intended to select, and the offset varies depending on the user's local timezone.

---

## Root Cause

### The Core Problem

JavaScript's `Date` object interpreting all date strings as **local time** when no timezone is specified, combined with the application mixing UTC dates (from `.toISOString()`) with local time interpretations.

### Technical Breakdown

#### In Form Initialization (CREATE forms)

**File**: `CreateGiveawayForm.tsx` lines 43-44

```tsx
startDate: new Date().toISOString().split('T')[0],     // Gets UTC date as string
endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // Gets UTC date
```

**Problem**: These extract the **UTC date**, not the local date.

**File**: `CreateWhitelistForm.tsx` line 19

```tsx
endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // Gets UTC date
```

#### In Form Submission (CREATE forms)

**File**: `CreateGiveawayForm.tsx` lines 197-198

```tsx
const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`); // LOCAL interpretation
const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`); // LOCAL interpretation
// Then: endAt: endDateTime.toISOString(),
```

**Problem**: When you create `new Date('2025-02-10T23:59:00')` **without a timezone suffix**, JavaScript treats it as **local time**, not UTC.

**File**: `CreateWhitelistForm.tsx` line 87

```tsx
endAt: new Date(formData.endDate).toISOString(),  // formData.endDate has no time component!
```

**Problem**: This is even worse - `new Date('2025-02-10')` gets interpreted as midnight **local time**, not midnight UTC.

**File**: `CreatePresaleForm.tsx` lines 88-89

```tsx
startAt: new Date(formData.startAt).toISOString(),
endAt: new Date(formData.endAt).toISOString(),
```

**Same problem**: Date strings without timezone suffix get parsed as local time.

#### In Form Editing (EDIT forms)

**File**: `EditGiveawayForm.tsx` lines 60-61

```tsx
endDate: endDate.toISOString().split('T')[0],     // Gets UTC date
endTime: endDate.toTimeString().slice(0, 5),      // Gets LOCAL time
```

**Problem**: This mixes UTC date with local time! The date portion is in UTC, but the time portion is in local time.

---

## The Timezone Offset

If a user is in timezone UTC-9 (e.g., parts of Alaska, Samoa):

- User selects: Feb 10, 2025 at 11 PM in their local timezone
- Form sees: `endDate: '2025-02-10'`, `endTime: '23:00'`
- Creates: `new Date('2025-02-10T23:00:00')` which is **Feb 10, 11 PM LOCAL**
- Converts to UTC: **Feb 11, 8 AM UTC** (9 hours ahead)
- **Net effect**: Event stored 9 hours in the future compared to user's intention

If a user is in timezone UTC+9 (e.g., Japan, Korea):

- User selects: Feb 10, 2025 at 11 PM in their local timezone
- Same flow, but 9 hours behind UTC
- **Net effect**: Event stored 9 hours in the past

This explains why users report times being "all off" - the offset depends entirely on their timezone.

---

## Where Times Are Affected

### 1. **Event Creation Forms** (CRITICAL)

- ✅ `CreateGiveawayForm.tsx` - Lines 197-230 (handles startAt/endAt)
- ✅ `EditGiveawayForm.tsx` - Lines 60-61 (mixes UTC date with local time)
- ✅ `CreateWhitelistForm.tsx` - Line 87 (no time component parsing)
- ✅ `CreatePresaleForm.tsx` - Lines 88-89 (date-only strings)

### 2. **API Endpoints** (STORAGE)

- `POST /api/events` - `endAt: new Date(endAt)` (line 121)
    - This correctly parses the ISO string if sent properly
    - **But** the client is sending incorrectly formatted times
- `PATCH /api/events/[eventId]` - `endAt: new Date(endAt)`

### 3. **Event Display Components** (DISPLAY)

These use `.toLocaleString()` which is correct for display, but the underlying data is wrong:

- `EventCard.tsx` - Uses `formatDistanceToNow()` on `endDate`
- `EventDetailPage.tsx` - Uses `deadline.toLocaleDateString()` and `toLocaleTimeString()`
- `GiveawayEntryPage.tsx` - Countdown calculations from `new Date(eventDetails.endAt)`
- `CountdownTimer.tsx` - Time calculations
- `AutoDrawScheduler.tsx` - Shows `new Date(eventEndDate).toLocaleString()`
- Admin pages - `EventManagementDashboard.tsx`, `GiveawayDetailsPage.tsx` all show wrong times

---

## Evidence from Code

### Inconsistent Date Handling

```tsx
// Form initialization (giveaway) - UTC
const formData = {
    startDate: new Date().toISOString().split('T')[0], // UTC date
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // UTC date
};

// Form submission (giveaway) - LOCAL
const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`); // LOCAL interpretation
```

### Mixing UTC and Local Times (Edit form)

```tsx
// EditGiveawayForm.tsx - This is mixing two different times!
endDate: endDate.toISOString().split('T')[0],  // "2025-02-10" in UTC
endTime: endDate.toTimeString().slice(0, 5),   // "15:30" in LOCAL time
// Result: User sees Feb 10 (UTC) but 3:30 PM (their local time)
// But these are from different moments in time!
```

---

## Files Needing Fixes

| File                      | Issue                                               | Priority     |
| ------------------------- | --------------------------------------------------- | ------------ |
| `CreateGiveawayForm.tsx`  | Form init gets UTC date, submission treats as LOCAL | **CRITICAL** |
| `EditGiveawayForm.tsx`    | Mixes UTC date with LOCAL time on edit              | **CRITICAL** |
| `CreateWhitelistForm.tsx` | Date-only string parsed as LOCAL midnight           | **CRITICAL** |
| `CreatePresaleForm.tsx`   | Date strings parsed as LOCAL time                   | **CRITICAL** |
| `EditGiveawayForm.tsx`    | Form initialization broken (line 60-61)             | **CRITICAL** |

---

## How to Verify the Issue

1. Create an event as of 11 PM on Feb 10
2. Check the database: the actual stored time will be offset by your timezone
3. Edit the same event: the form will show the wrong date/time combination
4. Display the event: times will show in your local timezone (correct), but based on wrong underlying data

---

## The Fix Strategy

The solution is to **use local time consistently** throughout:

1. **Form Initialization**: Convert UTC dates from DB to local date/time

    ```tsx
    const endDate = new Date(event.endAt);
    const localDateString = endDate.toLocaleDateString('en-CA'); // YYYY-MM-DD in local
    const localTimeString = endDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }); // HH:mm in local
    ```

2. **Form Submission**: Convert local date/time BACK to UTC

    ```tsx
    // Method 1: Use ISO string without the Z
    const localDateTimeString = `${formData.endDate}T${formData.endTime}:00`;
    const localDate = new Date(localDateTimeString);
    // Adjust for timezone
    const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    const iso = utcDate.toISOString();

    // OR Method 2: Use date picker with value in ISO format more carefully
    ```

3. **Display**: Use `.toLocaleString()` consistently (already doing this correctly in most places)

---

## Summary Table

| Stage           | Current Behavior        | Expected Behavior     | Status              |
| --------------- | ----------------------- | --------------------- | ------------------- |
| **Form Init**   | Uses UTC date           | Uses local date       | ❌ Wrong            |
| **Form Submit** | Treats as LOCAL time    | Treats as LOCAL time  | ⚠️ Inconsistent     |
| **Storage**     | Stores offset time      | Stores correct UTC    | ❌ Wrong result     |
| **Display**     | Shows with local offset | Shows correct time    | ⚠️ Shows wrong data |
| **Edit Form**   | Mixes UTC/LOCAL         | Shows local date/time | ❌ Very wrong       |

---

## Next Steps

1. **Fix form initialization** to use local date/time
2. **Fix form submission** to correctly convert local → UTC
3. **Fix edit form** to not mix UTC and local times
4. **Add a utility function** for proper timezone-aware date handling:

    ```tsx
    // Recommended pattern
    function fromUTCToLocalDateTimeInputs(utcDate: Date) {
        return {
            date: utcDate.toLocaleDateString('en-CA'),
            time: utcDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
    }

    function fromLocalDateTimeInputsToUTC(dateStr: string, timeStr: string) {
        const localDate = new Date(`${dateStr}T${timeStr}`);
        return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    }
    ```
