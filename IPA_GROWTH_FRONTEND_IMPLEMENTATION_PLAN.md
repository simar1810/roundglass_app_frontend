# IPA Growth Chart Module - Frontend Implementation Plan

## Overview
This document outlines the step-by-step plan to implement the IPA Growth Chart Module frontend feature. The module includes:
- IPA 50th percentile benchmarks
- Height vs age scoring
- Weight vs age scoring
- Binary scoring: 1 = healthy, 0 = below standard
- Team-Level Dashboard (U-14 and U-16 teams)
- % players below growth standards
- Intervention alerts

---

## Step 1: Create API Utility Functions
**Location:** `src/lib/fetchers/growth.js`

**Purpose:** Create reusable API functions for all growth-related endpoints

**Tasks:**
1. Create `createMeasurement(clientId, measurementData)` - POST `/api/growth/measurements`
2. Create `getClientStatus(clientId, date, standard)` - GET `/api/growth/clients/:clientId/status`
3. Create `createGroup(groupData)` - POST `/api/growth/groups`
4. Create `addClientsToGroup(groupId, clientIds)` - PUT `/api/growth/groups/:groupId/clients`
5. Create `getGroupReport(groupId, filters)` - GET `/api/growth/groups/:groupId/report`
6. Create `downloadGroupReportPDF(groupId, filters)` - GET `/api/growth/groups/:groupId/report.pdf`
7. Create `getAllGroups()` - GET `/api/growth/groups` (if endpoint exists, otherwise handle via report endpoint)

**Dependencies:** Use existing `sendData` and `fetchData` from `@/lib/api`

---

## Step 2: Create Growth Measurement Form Component
**Location:** `src/components/modals/growth/AddMeasurementModal.jsx`

**Purpose:** Modal form to add/edit client measurements

**Features:**
- Form fields:
  - Client selection (if not pre-selected)
  - Measurement date (DatePicker)
  - Height (number input)
  - Height unit (dropdown: Cms, Inches)
  - Weight (number input)
  - Weight unit (dropdown: KG, Pounds)
  - Standard (dropdown: IPA, IAP) - default: IPA
- Validation:
  - All required fields
  - Valid date format
  - Positive numbers for height/weight
- On submit:
  - Call `createMeasurement` API
  - Show success/error toast
  - Close modal and refresh data
- Display benchmark results after submission:
  - Height score (1 or 0)
  - Weight score (1 or 0)
  - Height gap (cm)
  - Weight gap (kg)
  - P50 reference values

**UI Components:** Use existing `Dialog`, `FormControl`, `Button`, `SelectControl`, `Calendar`, `Popover`

---

## Step 3: Create Client Growth Status Component
**Location:** `src/components/pages/growth/ClientGrowthStatus.jsx`

**Purpose:** Display individual client's growth status and history

**Features:**
- Header card with client info (name, photo, age, gender)
- Latest status display:
  - Current height/weight with units
  - Height score badge (green if 1, red if 0)
  - Weight score badge (green if 1, red if 0)
  - Gap indicators (positive/negative)
  - P50 reference values
- Date filter (optional date picker to view historical status)
- Standard selector (IPA/IAP)
- Growth history table/chart:
  - List of all measurements with dates
  - Visual trend indicators
  - Score changes over time
- "Add Measurement" button (opens AddMeasurementModal)

**UI Components:** Use `Card`, `Badge`, `Table`, `Button`, `ChartContainer` (if available)

---

## Step 4: Create Group Management Components
**Location:** `src/components/modals/growth/`

**Files:**
- `CreateGroupModal.jsx` - Create new group
- `AddClientsToGroupModal.jsx` - Add clients to existing group

**CreateGroupModal Features:**
- Form fields:
  - Group name (required)
  - Description (optional)
  - Initial clients (multi-select with search)
- Validation and submission
- Success toast and modal close

**AddClientsToGroupModal Features:**
- Group selection (if multiple groups)
- Multi-select client picker with search
- Validation and submission
- Success toast and refresh

**UI Components:** Use `Dialog`, `FormControl`, `SelectMultiple`, `Button`

---

## Step 5: Create Team Dashboard Page
**Location:** `src/app/(authorized)/coach/growth/dashboard/page.jsx`

**Purpose:** Main team-level dashboard showing U-14 and U-16 team statistics

**Features:**
- Header section:
  - Page title: "IPA Growth Dashboard"
  - Group selector (dropdown to select team/group)
  - "Create Group" button
  - "Add Clients to Group" button
- Filters section:
  - Date range picker (from/to)
  - Age group filter (checkboxes: U14, U16, U18 - default: U14, U16)
  - Standard selector (IPA/IAP - default: IPA)
  - "Apply Filters" button
- Statistics cards row:
  - Total Players (overall.total)
  - % Below Height Standard (calculated from overall.height.belowP50)
  - % Below Weight Standard (calculated from overall.weight.belowP50)
  - Players Needing Intervention (count of clients with both scores = 0)
- Age group breakdown:
  - Separate cards/sections for U14 and U16
  - Each showing:
    - Total players in group
    - Height: Above/Below P50 counts and percentages
    - Weight: Above/Below P50 counts and percentages
    - Visual progress bars or pie charts
- Intervention alerts section:
  - List of clients with both height and weight scores = 0
  - Client name, age group, gaps
  - Link to individual client growth page
  - Alert styling (red/orange badges)
- Action buttons:
  - "Download PDF Report" button
  - "View Full Report" link

**UI Components:** Use `Card`, `Badge`, `Button`, `SelectControl`, `Calendar`, `Popover`, `Progress`, `Alert`

---

## Step 6: Create Group Report Component
**Location:** `src/components/pages/growth/GroupReport.jsx`

**Purpose:** Detailed group report view (can be used in dashboard or separate page)

**Features:**
- Report header:
  - Group name
  - Date range
  - Standard used
  - Export PDF button
- Overall statistics table:
  - Total players
  - Height statistics (above/below P50, percentages)
  - Weight statistics (above/below P50, percentages)
- Age bucket breakdown:
  - Table or cards for each age group (U14, U16, U18)
  - Same statistics as overall but per group
  - Visual indicators (progress bars, badges)
- Client-level details table (optional expandable):
  - List all clients in group
  - Individual scores and gaps
  - Status indicators

**UI Components:** Use `Table`, `Card`, `Badge`, `Button`, `Progress`

---

## Step 7: Create Individual Client Growth Page
**Location:** `src/app/(authorized)/coach/growth/clients/[id]/page.jsx`

**Purpose:** Detailed view of a single client's growth data

**Features:**
- Use `ClientGrowthStatus` component (from Step 3)
- Add navigation breadcrumb
- Add "Back to Dashboard" button
- Integrate with existing client profile if needed

**Routing:** `/coach/growth/clients/[id]`

---

## Step 8: Create Growth Groups List/Management Page
**Location:** `src/app/(authorized)/coach/growth/groups/page.jsx`

**Purpose:** List and manage all growth groups

**Features:**
- Table/list of all groups:
  - Group name
  - Description
  - Number of clients
  - Created date
  - Actions: View Report, Edit, Delete (if endpoint exists)
- "Create New Group" button
- Search/filter groups
- Click on group to navigate to dashboard with that group selected

**UI Components:** Use `Table`, `Button`, `Dialog`

---

## Step 9: Add Growth Tab to Client Profile
**Location:** `src/components/pages/coach/client/ClientData.jsx`

**Purpose:** Add growth tracking as a tab in existing client profile

**Tasks:**
1. Add new tab item to `tabItems` array:
   ```javascript
   { icon: <TrendingUp className="w-[16px] h-[16px]" />, value: "growth", label: "Growth" }
   ```
2. Create `TabsGrowth` component that uses `ClientGrowthStatus`
3. Add `TabsContent` for growth tab
4. Import necessary icons and components

**Integration:** This allows coaches to view growth data directly from client profile

---

## Step 10: Add Navigation Menu Item
**Location:** `src/config/data/sidebar.js`

**Purpose:** Add growth module to coach sidebar navigation

**Tasks:**
1. Add new menu item to `sidebar__coachContent`:
   ```javascript
   {
     id: X,
     title: "Growth Tracking",
     icon: <TrendingUp className="min-w-[20px] min-h-[20px]" />,
     url: "/coach/growth/dashboard",
     permission: "coach", // or appropriate permission
     group: "main",
     items: [
       {
         id: 1,
         icon: <BarChart className="icon min-w-[20px] min-h-[20px]" />,
         title: "Dashboard",
         url: "/coach/growth/dashboard"
       },
       {
         id: 2,
         icon: <Users className="icon min-w-[20px] min-h-[20px]" />,
         title: "Groups",
         url: "/coach/growth/groups"
       }
     ]
   }
   ```
2. Import necessary icons (`TrendingUp`, `BarChart`, `Users`)

---

## Step 11: Create Utility Functions and Helpers
**Location:** `src/lib/utils/growth.js`

**Purpose:** Helper functions for growth calculations and formatting

**Functions:**
1. `calculatePercentageBelow(above, below)` - Calculate % below P50
2. `formatAgeGroup(bucket)` - Format "U14" to "Under 14"
3. `getScoreColor(score)` - Return color for score badge (green/red)
4. `getInterventionStatus(heightScore, weightScore)` - Determine if intervention needed
5. `formatGap(gap, unit)` - Format gap with + or - sign
6. `calculateAgeInMonths(dob, measurementDate)` - Calculate age for display

---

## Step 12: Create PDF Download Handler
**Location:** `src/lib/utils/growth.js` or separate file

**Purpose:** Handle PDF download from API

**Function:**
- `downloadGroupReportPDF(groupId, filters)` - Call API and trigger browser download
- Handle blob response
- Create download link
- Handle errors

**Implementation:** Use `fetchBlobData` from `@/lib/apiClient` if available, or create similar function

---

## Step 13: Add Charts/Visualizations (Optional Enhancement)
**Location:** `src/components/pages/growth/GrowthCharts.jsx`

**Purpose:** Visual representation of growth data

**Features:**
- Line chart showing height/weight trends over time (per client)
- Bar chart comparing age groups
- Pie chart for above/below P50 distribution
- Use existing chart library (recharts, chart.js, or whatever is in codebase)

**Dependencies:** Check existing chart components in codebase

---

## Step 14: Error Handling and Loading States
**Tasks:**
1. Add proper error boundaries for growth pages
2. Add loading states (use `ContentLoader` component)
3. Add error messages (use `ContentError` component)
4. Handle API errors gracefully:
   - 400: Show validation errors
   - 403: Show access denied message
   - 404: Show not found message
   - 409: Show duplicate measurement error
   - 500: Show generic error

---

## Step 15: Testing and Refinement
**Tasks:**
1. Test all API integrations
2. Test form validations
3. Test date filters
4. Test PDF download
5. Test responsive design (mobile/tablet/desktop)
6. Test error scenarios
7. Verify calculations (percentages, gaps)
8. Check UI consistency with existing design system
9. Test navigation flows
10. Verify permissions (if applicable)

---

## File Structure Summary

```
src/
├── app/(authorized)/coach/growth/
│   ├── dashboard/
│   │   └── page.jsx                    # Main team dashboard
│   ├── groups/
│   │   └── page.jsx                     # Groups management
│   └── clients/
│       └── [id]/
│           └── page.jsx                 # Individual client growth
├── components/
│   ├── modals/growth/
│   │   ├── AddMeasurementModal.jsx   # Add measurement form
│   │   ├── CreateGroupModal.jsx        # Create group form
│   │   └── AddClientsToGroupModal.jsx  # Add clients form
│   └── pages/growth/
│       ├── ClientGrowthStatus.jsx       # Client status component
│       ├── GroupReport.jsx             # Group report component
│       └── GrowthCharts.jsx            # Charts (optional)
├── lib/
│   ├── fetchers/
│   │   └── growth.js                   # API functions
│   └── utils/
│       └── growth.js                   # Helper functions
└── config/data/
    └── sidebar.js                     # Navigation (update)
```

---

## Implementation Order Recommendation

1. **Step 1** - API utilities (foundation)
2. **Step 11** - Helper functions (supporting utilities)
3. **Step 2** - Measurement form (core functionality)
4. **Step 3** - Client status component (individual view)
5. **Step 4** - Group management (team setup)
6. **Step 5** - Team dashboard (main feature)
7. **Step 6** - Group report (detailed view)
8. **Step 7** - Individual client page (routing)
9. **Step 8** - Groups list page (management)
10. **Step 9** - Client profile integration (enhancement)
11. **Step 10** - Navigation (accessibility)
12. **Step 12** - PDF download (export)
13. **Step 13** - Charts (visualization - optional)
14. **Step 14** - Error handling (polish)
15. **Step 15** - Testing (quality assurance)

---

## Notes

- All API endpoints use base path: `/api/growth`
- Authentication is handled automatically via `useAuth` middleware
- Use existing UI components from Shadcn UI library
- Follow existing code patterns and styling conventions
- Ensure responsive design for mobile devices
- Use SWR for data fetching (consistent with codebase)
- Use toast notifications for user feedback (sonner)
- Date formats: Support both YYYY-MM-DD and dd-MM-yyyy
- Age groups: U14 (< 14 years), U16 (14-16 years), U18 (16-18 years)

---

## Dependencies to Check

- Verify if `ChartContainer` or similar chart component exists
- Check if `fetchBlobData` exists in `@/lib/apiClient`
- Verify date picker component (Calendar/Popover pattern)
- Check existing multi-select component (SelectMultiple)
- Verify toast library (should be sonner based on codebase)

---

## Success Criteria

✅ All API endpoints integrated and working
✅ Measurement form creates entries successfully
✅ Client status displays correctly with scores and gaps
✅ Team dashboard shows U-14 and U-16 statistics
✅ Percentage calculations are accurate
✅ Intervention alerts highlight clients below standards
✅ PDF export downloads correctly
✅ Navigation is accessible from sidebar
✅ Client profile has growth tab
✅ Responsive design works on all devices
✅ Error handling is comprehensive
✅ UI matches existing design system

