# UniConn Manual Test Cases

## Test Environment Setup
- **API URL**: http://localhost:8080
- **Frontend URL**: Open `uniconn-backend/backend/frontendtest/index.html` in browser
- **Test Accounts**:
  - Student: email=`student`, password=`student`
  - Organizer: email=`admin`, password=`admin`

---

## TEST SUITE 1: Authentication & User Management

### TC-001: User Registration - Student
**Steps:**
1. Open frontend
2. Click "Create an Account"
3. Enter:
   - Name: "Test Student"
   - Email: "teststudent@example.com"
   - Password: "password123"
   - Role: "Student"
4. Click "Register"

**Expected Results:**
- ✅ Green toast notification: "Account created successfully! Check your email for confirmation."
- ✅ Automatically logged in and redirected to Student Dashboard
- ✅ "Browse Events" tab is active

### TC-002: User Registration - Organizer
**Steps:**
1. Logout if logged in
2. Click "Create an Account"
3. Enter:
   - Name: "Test Organizer"
   - Email: "testorg@example.com"
   - Password: "password123"
   - Role: "Organizer"
4. Click "Register"

**Expected Results:**
- ✅ Green toast notification: "Account created successfully!"
- ✅ Automatically logged in and redirected to Organizer Dashboard
- ✅ "Browse Events" tab is active

### TC-003: Login - Valid Credentials
**Steps:**
1. Logout if logged in
2. Enter email: "student", password: "student"
3. Click "Login"

**Expected Results:**
- ✅ Successfully logged in
- ✅ Redirected to Student Dashboard

### TC-004: Login - Invalid Credentials
**Steps:**
1. Enter email: "wrong@example.com", password: "wrongpass"
2. Click "Login"

**Expected Results:**
- ✅ Error message: "Incorrect username or password, please try again."
- ✅ Stays on login page

### TC-005: Logout
**Steps:**
1. Login as any user
2. Click "Logout" button in dashboard

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot access dashboard pages

---

## TEST SUITE 2: Browse Events & Filtering (Student)

### TC-006: View All Events - Default Load
**Steps:**
1. Login as student
2. Go to "Browse Events" tab

**Expected Results:**
- ✅ All events displayed
- ✅ Result count shown: "Showing X events"
- ✅ Events sorted by Date (Soonest) by default
- ✅ "Clear Filters" button is hidden
- ✅ Each event card shows:
  - Title
  - Category badge (colored)
  - Relative date ("Today", "Tomorrow", "In X days")
  - Location
  - Full timestamp

### TC-007: Search by Keyword
**Steps:**
1. In Browse Events, enter "ECE" in keyword field
2. Click "Apply Filters"

**Expected Results:**
- ✅ Only events matching "ECE" in title/description appear
- ✅ Result count updates: "Showing X events"
- ✅ "Clear Filters" button appears
- ✅ Loading indicator shown briefly

### TC-008: Filter by Faculty
**Steps:**
1. Enter "Engineering" in Faculty field
2. Click "Apply Filters"

**Expected Results:**
- ✅ Only Engineering faculty events shown
- ✅ Result count updates
- ✅ "Clear Filters" button visible

### TC-009: Filter by Category
**Steps:**
1. Enter "career" in Category field
2. Click "Apply Filters"

**Expected Results:**
- ✅ Only career category events shown
- ✅ Category badges all show "career"
- ✅ Result count updates

### TC-010: Filter by Date Range
**Steps:**
1. Select "From" date: Today
2. Select "To" date: 7 days from now
3. Click "Apply Filters"

**Expected Results:**
- ✅ Only events in that date range shown
- ✅ Result count updates
- ✅ "Clear Filters" button visible

### TC-011: Combine Multiple Filters
**Steps:**
1. Keyword: "Career"
2. Faculty: "Engineering"
3. From date: Today
4. Click "Apply Filters"

**Expected Results:**
- ✅ Only events matching ALL criteria shown
- ✅ Result count reflects filtered results
- ✅ "Clear Filters" button visible

### TC-012: No Results with Filters
**Steps:**
1. Enter keyword: "NonExistentEvent12345"
2. Click "Apply Filters"

**Expected Results:**
- ✅ Empty state message: "No events found with current filters."
- ✅ "Clear Filters" button visible in empty state
- ✅ Result count: "Showing 0 events"

### TC-013: Clear Filters
**Steps:**
1. Apply any filters (keyword, faculty, etc.)
2. Click "Clear Filters" button

**Expected Results:**
- ✅ All filter fields cleared
- ✅ All events displayed again
- ✅ "Clear Filters" button hidden
- ✅ Green toast: "Filters cleared"
- ✅ Result count shows total events

### TC-014: Sort by Date (Soonest)
**Steps:**
1. Select "Sort by: Date (Soonest)" from dropdown
2. Wait for list to update

**Expected Results:**
- ✅ Events sorted with nearest date first
- ✅ List updates automatically

### TC-015: Sort by Date (Latest)
**Steps:**
1. Select "Sort by: Date (Latest)"

**Expected Results:**
- ✅ Events sorted with farthest date first
- ✅ Latest events at top

### TC-016: Sort by Most Popular
**Steps:**
1. Select "Sort by: Most Popular"

**Expected Results:**
- ✅ Events reordered
- ✅ No errors

---

## TEST SUITE 3: Event Details & RSVP (Student)

### TC-017: View Event Details - No Prior RSVP
**Steps:**
1. Login as student
2. Click on any event in Browse Events

**Expected Results:**
- ✅ Event detail page shows:
  - Title, date, location, faculty, category
  - Description
  - "RSVP Going" button (blue)
  - NO "Your RSVP: registered" text
  - Comments section
  - Event Chat section

### TC-018: RSVP to Event - First Time
**Steps:**
1. On event detail page (no prior RSVP)
2. Click "RSVP Going" button

**Expected Results:**
- ✅ Green toast: "RSVP submitted! Check your email for confirmation."
- ✅ "Your RSVP: registered" text appears (green)
- ✅ Button changes to "Cancel RSVP" (red)

### TC-019: View Event Details - Already RSVP'd
**Steps:**
1. RSVP to an event
2. Go back to Browse Events
3. Click the same event again

**Expected Results:**
- ✅ "Your RSVP: registered" text visible
- ✅ Button shows "Cancel RSVP" (red)
- ✅ Button is clickable

### TC-020: Cancel RSVP
**Steps:**
1. On event detail page with existing RSVP
2. Click "Cancel RSVP" button
3. Click "OK" on confirmation dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Green toast: "RSVP cancelled successfully."
- ✅ "Your RSVP: registered" text disappears
- ✅ Button changes back to "RSVP Going" (blue)

### TC-021: Cancel RSVP - Decline Confirmation
**Steps:**
1. Click "Cancel RSVP"
2. Click "Cancel" on confirmation dialog

**Expected Results:**
- ✅ No changes made
- ✅ RSVP still active
- ✅ Button remains "Cancel RSVP"

---

## TEST SUITE 4: Student My Events

### TC-022: My Events - Empty State
**Steps:**
1. Login as new student with no RSVPs
2. Go to "My Events" tab

**Expected Results:**
- ✅ Empty state message: "You haven't RSVP'd to any events yet."
- ✅ "Browse Events" button visible
- ✅ Clicking button goes to Browse Events tab

### TC-023: My Events - After RSVP
**Steps:**
1. RSVP to 2 events
2. Go to "My Events" tab

**Expected Results:**
- ✅ Both events listed
- ✅ Each shows: Title, date, "Your status: registered"
- ✅ "Open" button for each event

### TC-024: My Events - Open Event
**Steps:**
1. In My Events, click "Open" on any event

**Expected Results:**
- ✅ Event detail page opens
- ✅ Shows "Your RSVP: registered"
- ✅ Shows "Cancel RSVP" button

### TC-025: My Events - After Cancelling RSVP
**Steps:**
1. Have 2 RSVPs
2. Cancel 1 RSVP
3. Go to My Events

**Expected Results:**
- ✅ Only 1 event shown (the active RSVP)
- ✅ Cancelled event not in list

---

## TEST SUITE 5: Comments

### TC-026: View Comments - No Comments Yet
**Steps:**
1. Open any event detail page
2. Scroll to Comments section

**Expected Results:**
- ✅ Message: "No comments yet. Be the first to comment!"
- ✅ Comment textarea visible
- ✅ "Post Comment" button visible

### TC-027: Post Comment - Success
**Steps:**
1. Login as student
2. Open event detail
3. Enter "Great event!" in comment textarea
4. Click "Post Comment"

**Expected Results:**
- ✅ Comment appears immediately in list
- ✅ Shows: Author name, comment text, timestamp
- ✅ Textarea cleared
- ✅ NO error message

### TC-028: Post Comment - Empty
**Steps:**
1. Leave comment textarea empty
2. Click "Post Comment"

**Expected Results:**
- ✅ Red error text: "Comment cannot be empty."
- ✅ Comment not posted
- ✅ Textarea remains focused

### TC-029: View Multiple Comments
**Steps:**
1. Post 3 comments from different users
2. Refresh event detail page

**Expected Results:**
- ✅ All 3 comments visible
- ✅ Sorted by creation time (oldest first)
- ✅ Each shows author name and timestamp

### TC-030: Real-Time Comment Update
**Steps:**
1. Open same event in 2 browser tabs (different users)
2. Post comment in Tab 1

**Expected Results:**
- ✅ Comment appears in Tab 2 immediately (via WebSocket)
- ✅ No page refresh needed

---

## TEST SUITE 6: Event Chat (WebSocket)

### TC-031: Join Event Chat
**Steps:**
1. Open event detail page
2. Scroll to Event Chat section

**Expected Results:**
- ✅ Chat section visible
- ✅ Empty chat messages area
- ✅ Text input field present
- ✅ "Send" button present

### TC-032: Send Chat Message
**Steps:**
1. Type "Hello everyone!" in chat input
2. Click "Send"

**Expected Results:**
- ✅ Message appears in chat area
- ✅ Shows: Sender name, message text, timestamp
- ✅ Input field cleared

### TC-033: Typing Indicator
**Steps:**
1. Open same event in 2 tabs (different users)
2. Start typing in Tab 1 (don't send)

**Expected Results:**
- ✅ Tab 2 shows: "[User name] is typing..." (below chat area)
- ✅ Message disappears after 1.5 seconds of inactivity

### TC-034: User Joined/Left Chat
**Steps:**
1. Have event detail open in Tab 1
2. Open same event in Tab 2

**Expected Results:**
- ✅ Tab 1 shows: "[User name] joined the chat" (center, gray text)

**Steps (continued):**
3. Close Tab 2 or navigate away

**Expected Results:**
- ✅ Tab 1 shows: "[User name] left the chat"

---

## TEST SUITE 7: Organizer - Browse Events

### TC-035: Organizer Browse - Same as Student
**Steps:**
1. Login as organizer
2. Go to Browse Events

**Expected Results:**
- ✅ All filtering, sorting, clear filters work same as student
- ✅ Result count, badges, dates all display correctly

---

## TEST SUITE 8: Organizer - My Events

### TC-036: Organizer My Events - Empty State
**Steps:**
1. Login as new organizer with no events
2. Go to "My Events" tab

**Expected Results:**
- ✅ Empty state: "You haven't created any events yet."
- ✅ "Create Your First Event" button visible (green)
- ✅ Clicking button opens Create Event modal

### TC-037: Create Event - Success
**Steps:**
1. Click "+ Create Event" button
2. Fill in:
   - Title: "New Workshop"
   - Description: "Test event"
   - Location: "BA 1130"
   - Faculty: "Engineering"
   - Category: "workshop"
   - Start Time: Tomorrow 10:00 AM
   - End Time: Tomorrow 12:00 PM
3. Click "Create Event"

**Expected Results:**
- ✅ Modal closes
- ✅ Event appears in "My Events" list
- ✅ Browse Events also shows new event
- ✅ NO error message

### TC-038: Create Event - Missing Required Fields
**Steps:**
1. Click "+ Create Event"
2. Leave Title empty
3. Click "Create Event"

**Expected Results:**
- ✅ Error message shown in modal
- ✅ Modal stays open
- ✅ Event NOT created

### TC-039: Edit Own Event
**Steps:**
1. In My Events, click "Edit" on your event
2. Change title to "Updated Workshop"
3. Click "Save Changes"

**Expected Results:**
- ✅ Modal closes
- ✅ Event title updated in list
- ✅ Browse Events reflects change
- ✅ NO error

### TC-040: Delete Own Event - Confirm
**Steps:**
1. In My Events, click "Delete" on event
2. Confirm deletion

**Expected Results:**
- ✅ Green toast: "Event deleted successfully."
- ✅ Event removed from My Events list
- ✅ Event removed from Browse Events

### TC-041: View Event Detail - Owner
**Steps:**
1. As organizer, open your own event

**Expected Results:**
- ✅ "Edit" button visible (green)
- ✅ "Delete" button visible (red)
- ✅ RSVP Summary section visible
- ✅ Comments section visible
- ✅ Chat section visible

### TC-042: View Event Detail - Not Owner
**Steps:**
1. As organizer, open another organizer's event

**Expected Results:**
- ✅ NO Edit/Delete buttons
- ✅ Message: "You are not the creator of this event."
- ✅ NO RSVP Summary (organizers don't RSVP)
- ✅ Comments section visible
- ✅ Chat section visible

---

## TEST SUITE 9: RSVP Summary (Organizer Only)

### TC-043: RSVP Summary - No RSVPs
**Steps:**
1. As organizer, open your own event with no RSVPs

**Expected Results:**
- ✅ "RSVP Summary" section visible
- ✅ "Total Registered: 0"
- ✅ Attendees list: "No RSVPs yet."

### TC-044: RSVP Summary - With RSVPs
**Steps:**
1. Have 2 students RSVP to organizer's event
2. Organizer opens event detail

**Expected Results:**
- ✅ "Total Registered: 2"
- ✅ Attendees list shows both names
- ✅ Each attendee shows "Registered" badge (green)

### TC-045: Real-Time RSVP Update
**Steps:**
1. Organizer has event detail open
2. Student RSVPs in different tab

**Expected Results:**
- ✅ RSVP count updates in real-time (via WebSocket)
- ✅ New attendee appears in list immediately
- ✅ NO page refresh needed

### TC-046: Student Cannot See RSVP Summary
**Steps:**
1. Login as student
2. Open any event detail

**Expected Results:**
- ✅ NO "RSVP Summary" section visible
- ✅ Only RSVP button and own status shown

---

## TEST SUITE 10: Live Updates Panels

### TC-047: Live Event Updates - Student
**Steps:**
1. Login as student
2. Go to "Live Event Updates" tab
3. In another tab (organizer), create new event

**Expected Results:**
- ✅ New event appears in Live Event Updates panel immediately
- ✅ Shows full event JSON data
- ✅ Labeled as "EVENT"

### TC-048: Live Comments - Organizer
**Steps:**
1. Login as organizer
2. Go to "Live Comments" tab
3. In another tab (student), post comment on event

**Expected Results:**
- ✅ Comment appears in Live Comments panel immediately
- ✅ Shows comment JSON data
- ✅ Labeled as "COMMENT"

### TC-049: Live RSVPs - Student
**Steps:**
1. Login as student
2. Go to "Live RSVPs" tab
3. In another tab (another student), RSVP to event

**Expected Results:**
- ✅ RSVP appears in Live RSVPs panel immediately
- ✅ Shows RSVP JSON data
- ✅ Labeled as "RSVP"

---

## TEST SUITE 11: Toast Notifications

### TC-050: Toast - Success (Green)
**Steps:**
1. Perform any successful action (RSVP, create event, etc.)

**Expected Results:**
- ✅ Green toast appears top-right
- ✅ White text, readable
- ✅ Disappears after 3 seconds automatically
- ✅ Fades out smoothly

### TC-051: Toast - Error (Red)
**Steps:**
1. Trigger an error (e.g., submit empty comment)

**Expected Results:**
- ✅ Red toast appears top-right
- ✅ Error message displayed
- ✅ Disappears after 3 seconds

### TC-052: Multiple Toasts
**Steps:**
1. Perform 3 actions quickly (e.g., clear filters, RSVP, post comment)

**Expected Results:**
- ✅ All 3 toasts stack vertically
- ✅ Each disappears after its own 3-second timer
- ✅ No overlap or visual glitches

---

## TEST SUITE 12: Edge Cases & Error Handling

### TC-053: Network Error - Event List
**Steps:**
1. Stop backend server
2. Try to load Browse Events

**Expected Results:**
- ✅ Error message: "Failed to load events. Please try again."
- ✅ Red toast: "Failed to load events"
- ✅ NO crash or blank screen

### TC-054: Invalid Event ID
**Steps:**
1. Manually navigate to event/99999 (non-existent)

**Expected Results:**
- ✅ Error handling (404 or error message)
- ✅ NO crash

### TC-055: Session Expiry
**Steps:**
1. Login as student
2. Wait for JWT to expire (or manually delete token in dev tools)
3. Try to RSVP or post comment

**Expected Results:**
- ✅ 401 error handled gracefully
- ✅ Error toast or redirect to login
- ✅ NO crash

### TC-056: XSS Prevention in Comments
**Steps:**
1. Post comment with HTML/JS: `<script>alert('XSS')</script>`
2. View comment

**Expected Results:**
- ✅ Script NOT executed
- ✅ Text displayed as-is or sanitized
- ✅ NO alert popup

### TC-057: Long Event Title
**Steps:**
1. Create event with 200-character title
2. View in Browse Events

**Expected Results:**
- ✅ Title displayed without breaking layout
- ✅ May truncate or wrap gracefully

### TC-058: Special Characters in Search
**Steps:**
1. Search keyword: `"test" & <html>`
2. Click Apply Filters

**Expected Results:**
- ✅ NO crash
- ✅ Search executes (may return 0 results)
- ✅ NO syntax errors

---

## TEST SUITE 13: Responsive Design (Basic)

### TC-059: Mobile Viewport
**Steps:**
1. Resize browser to 375px width (mobile)
2. Navigate through all pages

**Expected Results:**
- ✅ All content visible (no horizontal scroll)
- ✅ Buttons clickable
- ✅ Filter inputs stack vertically
- ✅ Readable text

---

## TEST SUMMARY CHECKLIST

✅ = Pass | ❌ = Fail | ⚠️ = Partial

| Test Suite | Total Tests | Status |
|------------|-------------|---------|
| Suite 1: Auth & User Management | 5 | |
| Suite 2: Browse & Filtering (Student) | 11 | |
| Suite 3: Event Details & RSVP | 9 | |
| Suite 4: Student My Events | 4 | |
| Suite 5: Comments | 5 | |
| Suite 6: Event Chat (WebSocket) | 4 | |
| Suite 7: Organizer Browse | 1 | |
| Suite 8: Organizer My Events | 7 | |
| Suite 9: RSVP Summary (Organizer) | 4 | |
| Suite 10: Live Updates | 3 | |
| Suite 11: Toast Notifications | 3 | |
| Suite 12: Edge Cases | 6 | |
| Suite 13: Responsive | 1 | |
| **TOTAL** | **63 Test Cases** | |

---

## Notes for Testing
1. **Test in order** - Some tests depend on setup from previous tests
2. **Use incognito/private windows** for multi-user scenarios
3. **Clear browser cache** between major test suites
4. **Check browser console** for unexpected errors during testing
5. **Note any failing tests** with screenshots/error messages for debugging

