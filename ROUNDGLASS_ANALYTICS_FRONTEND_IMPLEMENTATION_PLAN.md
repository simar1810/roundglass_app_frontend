# Roundglass Analytics Module - Frontend Implementation Plan

## Overview
This document outlines the step-by-step plan to implement the Roundglass Analytics Module frontend feature. The module provides comprehensive analytics for comparing players/clients based on their health matrices and preferences, including:
- Category comparisons (intra-category and inter-category)
- Time-series trends analysis
- Client percentile rankings
- Metric correlations
- Distribution statistics
- Preferences analysis (training, supplements, injuries)
- Comprehensive analytics summary dashboard

---

## Step 1: Create API Utility Functions
**Location:** `src/lib/fetchers/roundglassAnalytics.js`

**Purpose:** Create reusable API functions for all Roundglass analytics endpoints

**Tasks:**
1. Create `getCategoryComparison(params)` - GET `/api/app/roundglass/analytics/category-comparison`
   - Supports `categoryId` (intra) or `categoryIds` (inter, comma-separated)
   - Optional `metrics` parameter (comma-separated)
   - Optional `comparisonType` parameter
   - Query param: `person=coach` or `person=client`

2. Create `getTrendsAnalysis(params)` - GET `/api/app/roundglass/analytics/trends`
   - Required: `person` (coach/client)
   - For coach: `clientIds` (comma-separated, required)
   - Optional: `metric` (default: "bmi"), `startDate`, `endDate`, `aggregate` (boolean)

3. Create `getClientRanking(params)` - GET `/api/app/roundglass/analytics/client-ranking`
   - Required: `person` (coach/client)
   - For coach: `clientId` (required)
   - Optional: `comparisonGroup` ("category" or "all", default: "all")
   - Optional: `categoryId` (if comparisonGroup="category")
   - Optional: `metrics` (comma-separated, default: all)

4. Create `getCorrelations(params)` - GET `/api/app/roundglass/analytics/correlations`
   - Required: `person=coach`
   - Optional: `clientIds` (comma-separated), `metrics` (comma-separated), `categoryId`

5. Create `getDistribution(params)` - GET `/api/app/roundglass/analytics/distribution`
   - Required: `person=coach`, `metric`
   - Optional: `categoryId`, `clientIds` (comma-separated)

6. Create `getPreferencesAnalysis(params)` - GET `/api/app/roundglass/analytics/preferences-analysis`
   - Required: `person=coach`
   - Optional: `categoryId`, `analysisType` ("training", "supplements", "injuries", or "all")

7. Create `getAnalyticsSummary(params)` - GET `/api/app/roundglass/analytics/summary`
   - Required: `person` (coach/client)
   - Optional: `categoryId`, `clientId` (for coach)

**Dependencies:** Use existing `fetchData` from `@/lib/api` and `buildUrlWithQueryParams` from `@/lib/formatter`

**Example Structure:**
```javascript
import { fetchData } from "../api";
import { buildUrlWithQueryParams } from "../formatter";

export function getCategoryComparison(params) {
  const queryParams = {
    person: params.person, // "coach" or "client"
  };
  
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  } else if (params.categoryIds) {
    queryParams.categoryIds = Array.isArray(params.categoryIds) 
      ? params.categoryIds.join(",") 
      : params.categoryIds;
  }
  
  if (params.metrics) {
    queryParams.metrics = Array.isArray(params.metrics)
      ? params.metrics.join(",")
      : params.metrics;
  }
  
  if (params.comparisonType) {
    queryParams.comparisonType = params.comparisonType;
  }
  
  const endpoint = buildUrlWithQueryParams(
    "app/roundglass/analytics/category-comparison",
    queryParams
  );
  
  return fetchData(endpoint);
}
```

---

## Step 2: Create Utility Functions and Helpers
**Location:** `src/lib/utils/roundglassAnalytics.js`

**Purpose:** Helper functions for analytics calculations, formatting, and data transformation

**Functions:**
1. `formatPercentile(percentile)` - Format percentile value (e.g., 75 → "75th percentile")
2. `getPercentileColor(percentile)` - Return color based on percentile (green/yellow/red)
3. `formatCorrelation(correlation)` - Format correlation value with interpretation
4. `getCorrelationStrength(correlation)` - Determine strength (strong/moderate/weak)
5. `formatMetricName(metric)` - Format metric key to readable name (e.g., "bmi" → "BMI")
6. `transformGraphData(graphData, chartType)` - Transform API graphData to chart library format
7. `calculateTrendDirection(trends)` - Determine if trend is increasing/decreasing/stable
8. `formatDateRange(startDate, endDate)` - Format date range for display
9. `normalizeMetricValue(value, metric)` - Normalize metric values for display
10. `groupClientsByCategory(clients, categories)` - Group clients by category for display

**Dependencies:** Use date-fns for date formatting if available

---

## Step 3: Create Category Comparison Component
**Location:** `src/components/pages/roundglass/CategoryComparison.jsx`

**Purpose:** Display category comparison data with charts and statistics

**Features:**
- Header section:
  - Comparison type indicator (Intra/Inter)
  - Category selector(s) (dropdown for single category or multi-select for inter)
  - Metrics selector (multi-select, default: all)
  - Refresh button
- Statistics cards:
  - Total clients in comparison
  - Average metrics per category
  - Key statistics (mean, median, std dev)
- Charts section:
  - Bar chart (from `graphData.barChart`)
  - Box plot visualization (from `graphData.boxPlot`)
  - Heatmap (from `graphData.heatmap`)
- Client comparison table:
  - List of clients with their metric values
  - Percentile rankings
  - Sortable columns
- Export options:
  - Export to CSV
  - Print view

**UI Components:** Use `Card`, `Select`, `Button`, `Table`, `Badge`, chart components (recharts/chart.js)

**Data Source:** `getCategoryComparison` API function

---

## Step 4: Create Trends Analysis Component
**Location:** `src/components/pages/roundglass/TrendsAnalysis.jsx`

**Purpose:** Display time-series trends for health metrics

**Features:**
- Filters section:
  - Metric selector (dropdown: bmi, muscle, fat, weight, etc.)
  - Date range picker (start date, end date)
  - Client selector (multi-select for coach, hidden for client)
  - Aggregate toggle (for coach, aggregate across clients)
- Line chart:
  - Single line for client view
  - Multi-line for coach view (one line per client)
  - Aggregated line if aggregate=true
  - Interactive tooltips with date and value
- Trend indicators:
  - Direction badge (increasing/decreasing/stable)
  - Rate of change
  - Correlation coefficient
- Data table:
  - Time-series data points
  - Date, value, client (if multiple)
  - Export to CSV

**UI Components:** Use `Card`, `Select`, `Calendar`, `Popover`, `LineChart` (or similar), `Badge`

**Data Source:** `getTrendsAnalysis` API function

---

## Step 5: Create Client Ranking Component
**Location:** `src/components/pages/roundglass/ClientRanking.jsx`

**Purpose:** Display percentile ranking of a client relative to peers

**Features:**
- Header section:
  - Client info (name, photo)
  - Comparison group selector (All Clients / Category)
  - Category selector (if comparisonGroup="category")
  - Metrics selector (multi-select, default: all)
- Radar chart:
  - Display percentile rankings for all metrics
  - Visual representation of client's strengths/weaknesses
- Percentile bars:
  - Horizontal bar chart showing percentile for each metric
  - Color-coded (green: high, yellow: medium, red: low)
- Detailed rankings table:
  - Metric name
  - Client's value
  - Percentile
  - Rank (e.g., "15 out of 60")
  - Total in comparison group
- Summary card:
  - Overall percentile (average)
  - Best performing metric
  - Areas for improvement

**UI Components:** Use `Card`, `Avatar`, `RadarChart`, `Progress`, `Table`, `Badge`, `Select`

**Data Source:** `getClientRanking` API function

---

## Step 6: Create Correlations Analysis Component
**Location:** `src/components/pages/roundglass/CorrelationsAnalysis.jsx`

**Purpose:** Display correlations between different health metrics

**Features:**
- Filters section:
  - Client selector (multi-select, optional)
  - Metrics selector (multi-select, default: all)
  - Category filter (optional)
- Correlation heatmap:
  - Matrix showing correlations between all metric pairs
  - Color-coded (red: negative, blue: positive)
  - Interactive tooltips with correlation value
- Scatter plots:
  - Individual scatter plots for significant correlations
  - Show correlation coefficient
  - Trend line overlay
- Correlation table:
  - Metric pairs
  - Correlation value
  - Strength interpretation
  - Data points count
  - Sortable by correlation strength

**UI Components:** Use `Card`, `Select`, `Heatmap` (custom or library), `ScatterChart`, `Table`, `Badge`

**Data Source:** `getCorrelations` API function

---

## Step 7: Create Distribution Analysis Component
**Location:** `src/components/pages/roundglass/DistributionAnalysis.jsx`

**Purpose:** Display distribution statistics for a specific metric

**Features:**
- Filters section:
  - Metric selector (required)
  - Category filter (optional)
  - Client selector (optional, multi-select)
- Statistics cards:
  - Mean, Median, Min, Max
  - Standard Deviation
  - Percentiles (25th, 50th, 75th, 90th, 95th)
  - Total count
- Box plot:
  - Visual representation of distribution
  - Min, Q1, Median, Q3, Max
  - Mean indicator
  - Outliers
- Histogram:
  - Distribution bins
  - Frequency counts
  - Percentage labels
- Distribution table:
  - Bin ranges
  - Count per bin
  - Percentage per bin

**UI Components:** Use `Card`, `Select`, `BoxPlot` (custom or library), `BarChart` (for histogram), `Table`

**Data Source:** `getDistribution` API function

---

## Step 8: Create Preferences Analysis Component
**Location:** `src/components/pages/roundglass/PreferencesAnalysis.jsx`

**Purpose:** Analyze training, supplements, and injury patterns

**Features:**
- Filters section:
  - Analysis type selector (Training / Supplements / Injuries / All)
  - Category filter (optional)
- Training analysis section:
  - Training frequency distribution (bar chart)
  - Duration statistics (mean, median)
  - Intensity distribution (pie chart)
  - Conditioning days distribution
  - Total clients with training data
- Supplements analysis section:
  - Brand distribution (bar chart)
  - Purpose distribution (bar chart)
  - Dosage frequency analysis
  - Supplements per client statistics
  - Total clients with supplements
- Injuries analysis section:
  - Body part distribution (bar chart)
  - Injury type distribution (bar chart)
  - Injuries per client statistics
  - Rehabilitation progress statistics
  - Total clients with injuries
- Export options for each section

**UI Components:** Use `Card`, `Tabs` (for switching between analysis types), `BarChart`, `PieChart`, `Table`, `Badge`

**Data Source:** `getPreferencesAnalysis` API function

---

## Step 9: Create Analytics Summary Component
**Location:** `src/components/pages/roundglass/AnalyticsSummary.jsx`

**Purpose:** Comprehensive dashboard view with overview of all analytics

**Features:**
- Overview cards:
  - Total clients
  - Clients with health data
  - Clients with preferences
  - Clients with training data
  - Clients with supplements
  - Clients with injuries
- Health metrics summary:
  - Key metrics (BMI, Muscle, Fat, Weight) with statistics
  - Mean, median, min, max for each
  - Quick percentile indicators
- Preferences summary:
  - Top training frequencies
  - Most common supplements
  - Common injury types
- Trends summary:
  - Direction indicators for key metrics
  - Rate of change
- Rankings summary:
  - Top performers (if client view, show own rankings)
  - Areas needing attention
- Quick actions:
  - Links to detailed views (Category Comparison, Trends, etc.)
  - Export summary report

**UI Components:** Use `Card`, `Badge`, `Button`, `Table`, `Progress`

**Data Source:** `getAnalyticsSummary` API function

---

## Step 10: Create Main Analytics Dashboard Page (Coach)
**Location:** `src/app/(authorized)/coach/roundglass/analytics/page.jsx`

**Purpose:** Main analytics dashboard for coaches with tabbed interface

**Features:**
- Tab navigation:
  - Summary (default)
  - Category Comparison
  - Trends
  - Rankings
  - Correlations
  - Distribution
  - Preferences
- Global filters (persist across tabs):
  - Category selector
  - Date range (for trend-based views)
- Each tab renders corresponding component from Steps 3-9
- Breadcrumb navigation
- Export all data button

**UI Components:** Use `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from shadcn/ui

**Routing:** `/coach/roundglass/analytics`

---

## Step 11: Create Client Analytics Page
**Location:** `src/app/(authorized)/client/roundglass/analytics/page.jsx`

**Purpose:** Analytics view for clients (limited to their own data)

**Features:**
- Tab navigation:
  - Summary (default)
  - My Trends
  - My Rankings
- Summary tab:
  - Personal health metrics overview
  - Progress indicators
  - Recommendations
- Trends tab:
  - Personal trends over time
  - Metric selector
  - Date range filter
- Rankings tab:
  - Personal percentile rankings
  - Comparison group selector (All / Category)
  - Performance insights

**UI Components:** Use `Tabs`, `Card`, chart components

**Routing:** `/client/roundglass/analytics`

**Note:** Uses `person=client` in all API calls

---

## Step 12: Create Chart Components Wrapper
**Location:** `src/components/pages/roundglass/charts/`

**Files:**
- `AnalyticsBarChart.jsx` - Bar chart wrapper
- `AnalyticsLineChart.jsx` - Line chart wrapper
- `AnalyticsRadarChart.jsx` - Radar chart wrapper
- `AnalyticsScatterChart.jsx` - Scatter plot wrapper
- `AnalyticsHeatmap.jsx` - Heatmap wrapper
- `AnalyticsBoxPlot.jsx` - Box plot wrapper
- `AnalyticsHistogram.jsx` - Histogram wrapper

**Purpose:** Reusable chart components that transform API `graphData` to chart library format

**Features:**
- Accept `graphData` from API
- Transform to chart library format (Chart.js, Recharts, or existing library)
- Consistent styling
- Interactive tooltips
- Responsive design
- Export functionality

**Dependencies:** Check existing chart library in codebase (likely recharts or chart.js)

---

## Step 13: Add Analytics Tab to Client Profile (Coach View)
**Location:** `src/components/pages/coach/client/ClientData.jsx`

**Purpose:** Add Roundglass analytics as a tab in existing client profile

**Tasks:**
1. Add new tab item to `tabItems` array:
   ```javascript
   { 
     icon: <BarChart className="w-[16px] h-[16px]" />, 
     value: "roundglass-analytics", 
     label: "Analytics" 
   }
   ```
2. Create `TabsRoundglassAnalytics` component that uses:
   - `ClientRanking` component (from Step 5)
   - `TrendsAnalysis` component (from Step 4) with clientId pre-filled
   - Quick summary cards
3. Add `TabsContent` for analytics tab
4. Import necessary icons and components

**Integration:** This allows coaches to view analytics directly from client profile

---

## Step 14: Add Analytics Tab to Client Profile (Client View)
**Location:** `src/components/pages/client/profile/` (if exists) or create new component

**Purpose:** Allow clients to view their own analytics

**Tasks:**
1. Create client-side analytics component
2. Display:
   - Personal rankings
   - Personal trends
   - Summary statistics
3. Use `person=client` in all API calls

---

## Step 15: Add Navigation Menu Items
**Location:** `src/config/data/sidebar.js`

**Purpose:** Add Roundglass Analytics to coach and client sidebar navigation

**Tasks for Coach Sidebar:**
1. Add new menu item to `sidebar__coachContent`:
   ```javascript
   {
     id: X, // Next available ID
     title: "Roundglass Analytics",
     icon: <BarChart className="min-w-[20px] min-h-[20px]" />,
     url: "/coach/roundglass/analytics",
     permission: "coach", // or appropriate permission
     group: "main",
     items: [
       {
         id: 1,
         icon: <BarChart className="icon min-w-[20px] min-h-[20px]" />,
         title: "Dashboard",
         url: "/coach/roundglass/analytics"
       }
     ]
   }
   ```
2. Import necessary icons (`BarChart`, `TrendingUp`, etc.)

**Tasks for Client Sidebar:**
1. Find client sidebar configuration (if exists)
2. Add analytics menu item:
   ```javascript
   {
     id: X,
     title: "Analytics",
     icon: <BarChart className="min-w-[20px] min-h-[20px]" />,
     url: "/client/roundglass/analytics",
     permission: "client",
     group: "main"
   }
   ```

---

## Step 16: Create Modal Components for Filters
**Location:** `src/components/modals/roundglass/`

**Files:**
- `CategoryFilterModal.jsx` - Category selection modal
- `DateRangeFilterModal.jsx` - Date range selection modal
- `MetricsFilterModal.jsx` - Metrics selection modal
- `ClientFilterModal.jsx` - Client selection modal (for coach)

**Purpose:** Reusable filter modals for analytics views

**Features:**
- Consistent UI for filter selection
- Multi-select support where needed
- Validation
- Apply/Cancel buttons
- Preserve filter state

---

## Step 17: Create Export Utilities
**Location:** `src/lib/utils/roundglassAnalytics.js` (add export functions)

**Purpose:** Export analytics data to CSV/Excel

**Functions:**
1. `exportToCSV(data, filename)` - Export data to CSV
2. `exportComparisonToCSV(comparisonData)` - Export category comparison
3. `exportTrendsToCSV(trendsData)` - Export trends data
4. `exportRankingsToCSV(rankingsData)` - Export rankings data
5. `exportCorrelationsToCSV(correlationsData)` - Export correlations
6. `exportDistributionToCSV(distributionData)` - Export distribution
7. `exportPreferencesToCSV(preferencesData)` - Export preferences analysis

**Dependencies:** Use existing CSV export utilities if available, or implement using `papaparse` or similar

---

## Step 18: Add Error Handling and Loading States
**Tasks:**
1. Create error handling utility:
   - `src/lib/utils/roundglassAnalyticsErrors.js`
   - Handle API errors (400, 401, 403, 404, 500)
   - User-friendly error messages
2. Add loading states:
   - Use `ContentLoader` component for page-level loading
   - Use skeleton loaders for chart loading
   - Use `toast.loading()` for async operations
3. Add error boundaries:
   - Wrap analytics pages in error boundaries
   - Show `ContentError` component on errors
4. Handle empty states:
   - Show appropriate messages when no data available
   - Provide actions to add data

---

## Step 19: Create Comparison Group Selector Component
**Location:** `src/components/pages/roundglass/ComparisonGroupSelector.jsx`

**Purpose:** Reusable component for selecting comparison groups

**Features:**
- Radio buttons or dropdown:
  - "All Clients" option
  - "Category" option (with category selector)
- For client view: Only show "All Clients" and "My Category"
- For coach view: Show all options
- Persist selection in URL params or state

**UI Components:** Use `RadioGroup`, `Select`, `Label`

---

## Step 20: Create Metric Selector Component
**Location:** `src/components/pages/roundglass/MetricSelector.jsx`

**Purpose:** Reusable multi-select component for choosing metrics

**Features:**
- Multi-select dropdown with checkboxes
- Available metrics:
  - bmi, muscle, fat, rm, ideal_weight, bodyAge, visceral_fat
  - weight, sub_fat, chest, arm, abdomen, waist, hip, thighs
  - height, shoulder_distance
- "Select All" / "Deselect All" buttons
- Search/filter metrics
- Display selected count

**UI Components:** Use `SelectMultiple` or `Popover` with checkboxes

---

## Step 21: Add Data Refresh and Caching
**Tasks:**
1. Implement SWR for data fetching:
   - Use `useSWR` hook for all analytics endpoints
   - Configure cache keys properly
   - Set appropriate revalidation intervals
2. Add refresh buttons:
   - Manual refresh on all analytics views
   - Show loading state during refresh
3. Cache management:
   - Invalidate cache on data updates
   - Use `mutate` from SWR to refresh data
4. Optimistic updates where applicable

---

## Step 22: Create Print-Friendly Views
**Location:** Add print styles to analytics components

**Purpose:** Allow users to print analytics reports

**Tasks:**
1. Add print CSS classes
2. Hide non-essential UI elements when printing
3. Ensure charts render properly in print
4. Add "Print" button to analytics pages
5. Format tables for print layout

---

## Step 23: Add Responsive Design
**Tasks:**
1. Ensure all analytics components are mobile-responsive
2. Stack charts vertically on mobile
3. Make tables scrollable on mobile
4. Optimize filter UI for mobile (use modals)
5. Test on various screen sizes

---

## Step 24: Create Analytics Settings/Preferences
**Location:** `src/components/pages/roundglass/AnalyticsSettings.jsx` (optional)

**Purpose:** Allow users to customize analytics display

**Features:**
- Default metric selection
- Chart type preferences
- Date range defaults
- Export format preferences
- Theme preferences (if applicable)

---

## Step 25: Testing and Refinement
**Tasks:**
1. Test all API integrations:
   - Verify all endpoints work correctly
   - Test with different parameter combinations
   - Test error scenarios
2. Test data transformations:
   - Verify graphData is correctly transformed
   - Test chart rendering with various data
3. Test filters:
   - Category filters
   - Date range filters
   - Metric filters
   - Client filters
4. Test responsive design:
   - Mobile, tablet, desktop views
   - Chart responsiveness
5. Test export functionality:
   - CSV exports
   - Print views
6. Test navigation:
   - Sidebar links
   - Tab navigation
   - Breadcrumbs
7. Test permissions:
   - Coach vs client views
   - Access restrictions
8. Performance testing:
   - Large datasets
   - Multiple concurrent requests
   - Chart rendering performance
9. UI/UX testing:
   - Consistency with design system
   - Accessibility
   - User flow

---

## File Structure Summary

```
src/
├── app/(authorized)/
│   ├── coach/roundglass/
│   │   └── analytics/
│   │       └── page.jsx                    # Main coach analytics dashboard
│   └── client/roundglass/
│       └── analytics/
│           └── page.jsx                     # Client analytics view
├── components/
│   ├── modals/roundglass/
│   │   ├── CategoryFilterModal.jsx         # Category filter
│   │   ├── DateRangeFilterModal.jsx        # Date range filter
│   │   ├── MetricsFilterModal.jsx          # Metrics filter
│   │   └── ClientFilterModal.jsx           # Client filter
│   └── pages/roundglass/
│       ├── CategoryComparison.jsx          # Category comparison view
│       ├── TrendsAnalysis.jsx              # Trends analysis view
│       ├── ClientRanking.jsx               # Client ranking view
│       ├── CorrelationsAnalysis.jsx        # Correlations view
│       ├── DistributionAnalysis.jsx       # Distribution view
│       ├── PreferencesAnalysis.jsx          # Preferences analysis view
│       ├── AnalyticsSummary.jsx            # Summary dashboard
│       ├── ComparisonGroupSelector.jsx     # Comparison group selector
│       ├── MetricSelector.jsx             # Metric selector
│       └── charts/
│           ├── AnalyticsBarChart.jsx       # Bar chart wrapper
│           ├── AnalyticsLineChart.jsx     # Line chart wrapper
│           ├── AnalyticsRadarChart.jsx     # Radar chart wrapper
│           ├── AnalyticsScatterChart.jsx   # Scatter chart wrapper
│           ├── AnalyticsHeatmap.jsx        # Heatmap wrapper
│           ├── AnalyticsBoxPlot.jsx        # Box plot wrapper
│           └── AnalyticsHistogram.jsx      # Histogram wrapper
├── lib/
│   ├── fetchers/
│   │   └── roundglassAnalytics.js          # API functions
│   └── utils/
│       ├── roundglassAnalytics.js          # Helper functions
│       └── roundglassAnalyticsErrors.js     # Error handling
└── config/data/
    └── sidebar.js                          # Navigation (update)
```

---

## Implementation Order Recommendation

1. **Step 1** - API utilities (foundation)
2. **Step 2** - Helper functions (supporting utilities)
3. **Step 12** - Chart components (visualization foundation)
4. **Step 9** - Analytics Summary (overview, good starting point)
5. **Step 5** - Client Ranking (simpler, single client focus)
6. **Step 4** - Trends Analysis (time-series, commonly used)
7. **Step 3** - Category Comparison (comparison feature)
8. **Step 6** - Correlations Analysis (advanced analytics)
9. **Step 7** - Distribution Analysis (statistical view)
10. **Step 8** - Preferences Analysis (preferences data)
11. **Step 10** - Main Dashboard (coach view, integrates all)
12. **Step 11** - Client Analytics Page (client view)
13. **Step 13** - Client Profile Integration (coach)
14. **Step 14** - Client Profile Integration (client)
15. **Step 15** - Navigation (accessibility)
16. **Step 16** - Filter Modals (UX enhancement)
17. **Step 17** - Export Utilities (data export)
18. **Step 18** - Error Handling (polish)
19. **Step 19** - Comparison Group Selector (reusable component)
20. **Step 20** - Metric Selector (reusable component)
21. **Step 21** - Data Refresh and Caching (performance)
22. **Step 22** - Print Views (export)
23. **Step 23** - Responsive Design (mobile support)
24. **Step 24** - Settings (optional enhancement)
25. **Step 25** - Testing (quality assurance)

---

## API Endpoints Reference

Base URL: `/api/app/roundglass/analytics`

### Endpoints:
1. **Category Comparison**
   - GET `/category-comparison?person={coach|client}&categoryId={id}` (intra)
   - GET `/category-comparison?person={coach|client}&categoryIds={id1,id2}` (inter)
   - Optional: `metrics`, `comparisonType`

2. **Trends**
   - GET `/trends?person={coach|client}&clientIds={id1,id2}&metric={metric}`
   - Optional: `startDate`, `endDate`, `aggregate`

3. **Client Ranking**
   - GET `/client-ranking?person={coach|client}&clientId={id}&comparisonGroup={all|category}`
   - Optional: `categoryId`, `metrics`

4. **Correlations**
   - GET `/correlations?person=coach`
   - Optional: `clientIds`, `metrics`, `categoryId`

5. **Distribution**
   - GET `/distribution?person=coach&metric={metric}`
   - Optional: `categoryId`, `clientIds`

6. **Preferences Analysis**
   - GET `/preferences-analysis?person=coach`
   - Optional: `categoryId`, `analysisType`

7. **Summary**
   - GET `/summary?person={coach|client}`
   - Optional: `categoryId`, `clientId`

---

## Notes

- All API endpoints require `person` query parameter (`coach` or `client`)
- Authentication is handled automatically via `useAuth` middleware
- Use existing UI components from Shadcn UI library
- Follow existing code patterns and styling conventions
- Ensure responsive design for mobile devices
- Use SWR for data fetching (consistent with codebase)
- Use toast notifications for user feedback (sonner)
- Date formats: Support YYYY-MM-DD format
- Graph data is pre-formatted by backend, but may need transformation for chart library
- Handle empty states gracefully
- All endpoints return `graphData` object for chart rendering

---

## Dependencies to Check

- Verify chart library in use (recharts, chart.js, or other)
- Check if `buildUrlWithQueryParams` exists in `@/lib/formatter`
- Verify date picker component (Calendar/Popover pattern)
- Check existing multi-select component (SelectMultiple)
- Verify toast library (should be sonner based on codebase)
- Check if CSV export utilities exist
- Verify error handling patterns in codebase

---

## Success Criteria

✅ All API endpoints integrated and working
✅ Category comparison displays correctly (intra and inter)
✅ Trends analysis shows time-series data
✅ Client rankings display percentile information
✅ Correlations show metric relationships
✅ Distribution shows statistical breakdowns
✅ Preferences analysis displays training/supplements/injuries data
✅ Summary dashboard provides comprehensive overview
✅ Charts render correctly with API graphData
✅ Filters work correctly (category, date, metrics, clients)
✅ Export functionality works (CSV, print)
✅ Navigation is accessible from sidebar
✅ Client profile has analytics tab
✅ Responsive design works on all devices
✅ Error handling is comprehensive
✅ UI matches existing design system
✅ Coach and client views are properly restricted
✅ Loading states are implemented
✅ Empty states are handled gracefully

---

## Additional Considerations

1. **Performance:**
   - Lazy load chart components
   - Implement pagination for large datasets
   - Cache frequently accessed data
   - Optimize chart rendering

2. **Accessibility:**
   - Add ARIA labels to charts
   - Ensure keyboard navigation
   - Provide alt text for visualizations
   - Support screen readers

3. **Internationalization (if applicable):**
   - Support multiple languages
   - Format numbers according to locale
   - Format dates according to locale

4. **Analytics Tracking (optional):**
   - Track which analytics views are most used
   - Track export actions
   - Track filter usage

---

## Future Enhancements (Post-MVP)

1. Custom date range presets (Last 7 days, Last 30 days, etc.)
2. Saved filter presets
3. Scheduled reports (email)
4. Comparison with historical data
5. Anomaly detection alerts
6. Predictive analytics
7. Custom metric calculations
8. Advanced filtering (age groups, gender, etc.)
9. Real-time data updates (WebSocket)
10. Collaborative annotations on charts

