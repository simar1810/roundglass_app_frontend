# Roundglass Analytical Module - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Sources](#data-sources)
4. [Analytical Capabilities](#analytical-capabilities)
5. [API Endpoints](#api-endpoints)
6. [Graph Data Formats](#graph-data-formats)
7. [Use Cases](#use-cases)
8. [Error Handling](#error-handling)

---

## Overview

The Roundglass Analytical Module provides comprehensive analytics for comparing players/clients based on their health matrices and preferences. It supports both **intra-category** (within the same category) and **inter-category** (between different categories) comparisons with percentile-based rankings and trend analysis.

### Key Features
- **Percentile Rankings**: Calculate where each client stands relative to their peers
- **Category Comparisons**: Compare clients within categories or between categories
- **Time-Series Analysis**: Track trends and progress over time
- **Correlation Analysis**: Discover relationships between different metrics
- **Distribution Analysis**: Understand metric distributions with box plots and histograms
- **Preference Analysis**: Analyze training patterns, supplement usage, and injury data
- **Graph-Ready Data**: All endpoints return data formatted for popular charting libraries

---

## Architecture

### Data Flow

```
Client Request → useAuth Middleware → Controller Function → Helper Functions
                                                               ↓
Database Queries (ClientHealthMatrix, RoundglassClientPreference) → Data Aggregation
                                                               ↓
Statistical Calculations → Graph Formatting → Response
```

### Components

1. **Helper Functions**: Normalization, percentile calculation, statistics
2. **Aggregation Functions**: Combine data from multiple sources
3. **Comparison Functions**: Intra/inter-category comparisons
4. **Analysis Functions**: Trends, correlations, distributions
5. **Endpoints**: RESTful API endpoints for accessing analytics

---

## Data Sources

### 1. Client Health Matrix (ClientHealthMatrix)

**Static Fields:**
- `bmi` - Body Mass Index
- `muscle` - Muscle percentage
- `fat` - Fat percentage
- `rm` - Resting Metabolic Rate
- `ideal_weight` - Ideal weight
- `bodyAge` - Body age
- `visceral_fat` - Visceral fat level
- `weight` - Current weight (with unit conversion)
- `sub_fat` - Subcutaneous fat
- `chest` - Chest measurement
- `arm` - Arm measurement
- `abdomen` - Abdomen measurement
- `waist` - Waist measurement
- `hip` - Hip measurement
- `thighs` - Thigh measurement
- `height` - Height (with unit conversion)
- `shoulder_distance` - Shoulder width

**Historical Data:**
- `healthMatrix` array - Time-series data with `createdDate` in `dd-MM-yyyy` format
- Each entry contains all the above metrics at a specific point in time

### 2. Roundglass Client Preferences (RoundglassClientPreference)

**Text Fields:**
- `allergies` - Client allergies
- `medicalHistory` - Medical history
- `familyHistory` - Family medical history

**Training Module Array:**
- `trainingFrequency` - Frequency of training (e.g., "5 times per week")
- `duration` - Duration per session (e.g., "60 minutes")
- `intensity` - Training intensity (e.g., "Moderate", "High")
- `conditioningDays` - Days of conditioning (e.g., "Monday, Wednesday, Friday")

**Supplements Array:**
- `brand` - Supplement brand name
- `dosage` - Dosage amount
- `frequency` - Frequency of intake
- `source` - Purchase source
- `purpose` - Purpose of supplement
- `dateTime` - DateTime string

**Injuries Array:**
- `injuryType` - Type of injury
- `bodyPart` - Affected body part
- `incidentDate` - Date of injury
- `rehabProgress` - Rehabilitation progress
- `physiotherapistAssignment` - Assigned physiotherapist
- `fileUpload` - Uploaded file URL

### 3. Client Categories

Clients are grouped into categories via the `categories` array in the `AppClient` model, which references `coach.client_categories`.

---

## Analytical Capabilities

### Statistical Calculations

All numeric metrics support:
- **Mean**: Average value
- **Median**: Middle value
- **Min/Max**: Minimum and maximum values
- **Standard Deviation**: Measure of data spread
- **Percentiles**: 25th, 50th, 75th, 90th, 95th percentiles

### Percentile Rankings

Percentile ranking indicates where a client stands relative to others:
- **Percentile 90**: Client is in the top 10%
- **Percentile 50**: Client is at the median (average)
- **Percentile 25**: Client is in the bottom 25%

### Unit Normalization

- **Weight**: Automatically converted to kilograms (KG)
- **Height**: Automatically converted to centimeters (Cms)
- Supports: KG/Pounds for weight, Inches/Feet/Cms for height

---

## API Endpoints

Base URL: `/api/app/roundglass/analytics`

All endpoints require:
- **Authentication**: `Authorization: Bearer <token>` header
- **Query Parameter**: `person=coach` or `person=client`

---

### 1. Category Comparison

**Endpoint:** `GET /api/app/roundglass/analytics/category-comparison`

**Purpose:** Compare clients within a category (intra) or between categories (inter)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | `coach` or `client` |
| `categoryId` | ObjectId | Conditional | For intra-category comparison (single category) |
| `categoryIds` | string (comma-separated) | Conditional | For inter-category comparison (multiple categories) |
| `metrics` | string (comma-separated) | No | Specific metrics to compare. Default: all metrics |
| `comparisonType` | string | No | `intra` or `inter` (auto-detected if not provided) |

**Metrics Available:**
- `bmi`, `muscle`, `fat`, `rm`, `ideal_weight`, `bodyAge`, `visceral_fat`, `weight`, `sub_fat`, `chest`, `arm`, `abdomen`, `waist`, `hip`, `thighs`, `height`, `shoulder_distance`

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "type": "intra" | "inter",
    "metrics": ["bmi", "muscle", "fat"],
    "comparison": {
      "clients": [...],
      "statistics": {...},
      "totalClients": 25
    }
  },
  "graphData": {
    "barChart": {...},
    "boxPlot": [...],
    "heatmap": {...}
  },
  "metadata": {
    "totalClients": 25,
    "comparisonType": "intra"
  },
  "message": "Category comparison retrieved successfully"
}
```

**Curl Examples:**

```bash
# Intra-category comparison (single category)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/category-comparison?person=coach&categoryId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Inter-category comparison (multiple categories)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/category-comparison?person=coach&categoryIds=64a1b2c3d4e5f6g7h8i9j0k1,64a1b2c3d4e5f6g7h8i9j0k2" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Specific metrics only
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/category-comparison?person=coach&categoryId=64a1b2c3d4e5f6g7h8i9j0k1&metrics=bmi,muscle,fat" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 2. Trends Analysis

**Endpoint:** `GET /api/app/roundglass/analytics/trends`

**Purpose:** Get time-series trends for health metrics over time

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | `coach` or `client` |
| `clientIds` | string (comma-separated) | Yes (for coach) | Client IDs to analyze |
| `metric` | string | No | Specific metric or "all" (default: "bmi") |
| `startDate` | string (yyyy-MM-dd) | No | Start date filter |
| `endDate` | string (yyyy-MM-dd) | No | End date filter |
| `aggregate` | boolean | No | Aggregate across clients (default: false) |

**Available Metrics:**
All health matrix fields (bmi, muscle, fat, weight, etc.)

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "metric": "bmi",
    "timeSeries": [
      {
        "date": "2024-01-15",
        "value": 24.5,
        "clientId": "64a1b2c3d4e5f6g7h8i9j0k1"
      },
      ...
    ],
    "trends": {
      "direction": "increasing" | "decreasing" | "stable",
      "rate": 0.5,
      "correlation": 0.85
    }
  },
  "graphData": {
    "lineChart": {...},
    "multiLineChart": {...}
  },
  "message": "Trends retrieved successfully"
}
```

**Curl Examples:**

```bash
# Get trends for a single client (client perspective)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/trends?person=client&metric=bmi" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get trends for multiple clients (coach perspective)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/trends?person=coach&clientIds=64a1b2c3d4e5f6g7h8i9j0k1,64a1b2c3d4e5f6g7h8i9j0k2&metric=weight" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get trends with date range
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/trends?person=coach&clientIds=64a1b2c3d4e5f6g7h8i9j0k1&metric=muscle&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Aggregate trends across multiple clients
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/trends?person=coach&clientIds=64a1b2c3d4e5f6g7h8i9j0k1,64a1b2c3d4e5f6g7h8i9j0k2&metric=fat&aggregate=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3. Client Ranking

**Endpoint:** `GET /api/app/roundglass/analytics/client-ranking`

**Purpose:** Get percentile ranking of a specific client relative to their comparison group

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | `coach` or `client` |
| `clientId` | ObjectId | Yes (for coach) | Client ID to rank |
| `comparisonGroup` | string | No | `category` or `all` (default: "all") |
| `categoryId` | ObjectId | Conditional | Required if comparisonGroup="category" |
| `metrics` | string (comma-separated) | No | Specific metrics or "all" (default: all) |

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "rankings": {
      "bmi": {
        "percentile": 75,
        "rank": 15,
        "total": 60,
        "value": 26.5
      },
      "muscle": {
        "percentile": 50,
        "rank": 30,
        "total": 60,
        "value": 35.2
      },
      ...
    },
    "comparisonGroup": "all",
    "total": 60
  },
  "graphData": {
    "radarChart": {
      "labels": ["BMI", "Muscle", "Fat", ...],
      "datasets": [{
        "label": "Percentile Rank",
        "data": [75, 50, 60, ...]
      }]
    },
    "percentileBar": [...]
  },
  "message": "Client ranking retrieved successfully"
}
```

**Curl Examples:**

```bash
# Get ranking compared to all coach clients (client perspective)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/client-ranking?person=client&comparisonGroup=all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get ranking compared to all coach clients (coach perspective)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/client-ranking?person=coach&clientId=64a1b2c3d4e5f6g7h8i9j0k1&comparisonGroup=all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get ranking within a specific category
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/client-ranking?person=coach&clientId=64a1b2c3d4e5f6g7h8i9j0k1&comparisonGroup=category&categoryId=64a1b2c3d4e5f6g7h8i9j0k2" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get ranking for specific metrics only
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/client-ranking?person=coach&clientId=64a1b2c3d4e5f6g7h8i9j0k1&metrics=bmi,muscle,fat,weight" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 4. Correlations

**Endpoint:** `GET /api/app/roundglass/analytics/correlations`

**Purpose:** Calculate correlations between different health metrics

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | Must be `coach` |
| `clientIds` | string (comma-separated) | No | Specific clients (default: all coach clients) |
| `metrics` | string (comma-separated) | No | Metrics to correlate or "all" (default: all) |
| `categoryId` | ObjectId | No | Filter by category |

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "correlations": [
      {
        "metric1": "bmi",
        "metric2": "muscle",
        "correlation": -0.65,
        "pValue": null,
        "dataPoints": 45
      },
      {
        "metric1": "bmi",
        "metric2": "fat",
        "correlation": 0.82,
        "pValue": null,
        "dataPoints": 45
      },
      ...
    ]
  },
  "graphData": {
    "scatterPlot": {
      "datasets": [
        {
          "label": "bmi vs muscle",
          "data": [[24.5, 35.2], [25.1, 33.8], ...],
          "correlation": -0.65
        },
        ...
      ]
    },
    "correlationHeatmap": {
      "labels": ["bmi", "muscle", "fat", ...],
      "values": [[1, -0.65, 0.82, ...], ...]
    }
  },
  "metadata": {
    "totalClients": 45
  },
  "message": "Correlations retrieved successfully"
}
```

**Correlation Interpretation:**
- **+1.0**: Perfect positive correlation
- **0.0**: No correlation
- **-1.0**: Perfect negative correlation
- **> 0.7**: Strong positive correlation
- **< -0.7**: Strong negative correlation

**Curl Examples:**

```bash
# Get correlations for all metrics and all clients
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/correlations?person=coach" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get correlations for specific clients
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/correlations?person=coach&clientIds=64a1b2c3d4e5f6g7h8i9j0k1,64a1b2c3d4e5f6g7h8i9j0k2,64a1b2c3d4e5f6g7h8i9j0k3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get correlations for specific metrics
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/correlations?person=coach&metrics=bmi,muscle,fat,weight" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get correlations within a category
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/correlations?person=coach&categoryId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 5. Distribution

**Endpoint:** `GET /api/app/roundglass/analytics/distribution`

**Purpose:** Get distribution statistics for a specific metric

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | Must be `coach` |
| `metric` | string | Yes | Metric to analyze |
| `categoryId` | ObjectId | No | Filter by category |
| `clientIds` | string (comma-separated) | No | Specific clients |

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "metric": "bmi",
    "statistics": {
      "mean": 24.5,
      "median": 24.0,
      "stdDev": 3.2,
      "min": 18.5,
      "max": 32.1,
      "percentiles": {
        "p25": 22.1,
        "p50": 24.0,
        "p75": 26.8,
        "p90": 29.2,
        "p95": 30.5
      },
      "count": 60
    },
    "distribution": [
      {
        "bin": 18.5,
        "count": 5,
        "percentage": 8.33
      },
      ...
    ]
  },
  "graphData": {
    "boxPlot": {
      "label": "bmi",
      "min": 18.5,
      "q1": 22.1,
      "median": 24.0,
      "q3": 26.8,
      "max": 32.1,
      "mean": 24.5
    },
    "histogram": {
      "labels": ["18.50", "19.90", "21.30", ...],
      "data": [5, 8, 12, ...]
    }
  },
  "metadata": {
    "totalClients": 60
  },
  "message": "Distribution retrieved successfully"
}
```

**Curl Examples:**

```bash
# Get BMI distribution for all clients
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/distribution?person=coach&metric=bmi" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get muscle percentage distribution for a category
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/distribution?person=coach&metric=muscle&categoryId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get weight distribution for specific clients
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/distribution?person=coach&metric=weight&clientIds=64a1b2c3d4e5f6g7h8i9j0k1,64a1b2c3d4e5f6g7h8i9j0k2" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 6. Preferences Analysis

**Endpoint:** `GET /api/app/roundglass/analytics/preferences-analysis`

**Purpose:** Analyze Roundglass preferences (training, supplements, injuries)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | Must be `coach` |
| `categoryId` | ObjectId | No | Filter by category |
| `analysisType` | string | No | `training`, `supplements`, `injuries`, or `all` (default: "all") |

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "training": {
      "frequencyDistribution": {
        "5 times per week": 15,
        "3 times per week": 10,
        ...
      },
      "durationStatistics": {
        "mean": 55.5,
        "median": 60,
        ...
      },
      "intensityDistribution": {
        "Moderate": 12,
        "High": 8,
        ...
      },
      "conditioningDaysDistribution": {...},
      "totalClients": 25
    },
    "supplements": {
      "brandDistribution": {
        "Brand XYZ": 8,
        "Brand ABC": 5,
        ...
      },
      "purposeDistribution": {
        "Vitamin D": 10,
        "Protein": 8,
        ...
      },
      "dosageFrequency": {...},
      "supplementsPerClientStats": {...},
      "totalClients": 25
    },
    "injuries": {
      "bodyPartDistribution": {
        "Ankle": 5,
        "Knee": 3,
        ...
      },
      "injuryTypeDistribution": {
        "Sprain": 4,
        "Strain": 2,
        ...
      },
      "injuriesPerClientStats": {...},
      "rehabProgressStats": {...},
      "totalClients": 25
    }
  },
  "graphData": {
    "trainingFrequency": {
      "labels": ["5 times per week", "3 times per week", ...],
      "data": [15, 10, ...]
    },
    "intensity": {...},
    "brandDistribution": {...},
    "purposeDistribution": {...},
    "bodyPartDistribution": {...},
    "injuryTypeDistribution": {...}
  },
  "metadata": {
    "totalClients": 25
  },
  "message": "Preferences analysis retrieved successfully"
}
```

**Curl Examples:**

```bash
# Get all preferences analysis
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/preferences-analysis?person=coach" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get only training analysis
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/preferences-analysis?person=coach&analysisType=training" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get supplements analysis for a category
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/preferences-analysis?person=coach&analysisType=supplements&categoryId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get injuries analysis
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/preferences-analysis?person=coach&analysisType=injuries" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 7. Analytics Summary

**Endpoint:** `GET /api/app/roundglass/analytics/summary`

**Purpose:** Get comprehensive analytical summary (dashboard view)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `person` | string | Yes | `coach` or `client` |
| `categoryId` | ObjectId | No | Filter by category |
| `clientId` | ObjectId | No | Focus on specific client (for coach) |

**Response Format:**
```json
{
  "status_code": 200,
  "data": {
    "overview": {
      "totalClients": 50,
      "clientsWithHealthData": 45,
      "clientsWithPreferences": 40,
      "clientsWithTraining": 35,
      "clientsWithSupplements": 25,
      "clientsWithInjuries": 10
    },
    "healthMetrics": {
      "bmi": {
        "mean": 24.5,
        "median": 24.0,
        ...
      },
      ...
    },
    "preferences": {
      "training": {...},
      "supplements": {...},
      "injuries": {...}
    },
    "trends": {
      "bmi": {
        "direction": "decreasing",
        "rate": -0.3,
        "correlation": 0.85
      },
      ...
    },
    "rankings": {
      "bmi": {
        "percentile": 75,
        "rank": 15,
        "total": 60
      },
      ...
    }
  },
  "metadata": {
    "totalClients": 50,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  },
  "message": "Analytics summary retrieved successfully"
}
```

**Curl Examples:**

```bash
# Get summary for client (their own data)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/summary?person=client" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get summary for all coach clients
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/summary?person=coach" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get summary for a specific client (coach perspective)
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/summary?person=coach&clientId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get summary for a category
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/summary?person=coach&categoryId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Graph Data Formats

All endpoints return `graphData` object formatted for popular charting libraries (Chart.js, D3.js, Recharts, etc.).

### Bar Chart Format

```json
{
  "labels": ["Category A", "Category B", "Category C"],
  "datasets": [
    {
      "label": "BMI",
      "data": [24.5, 25.2, 23.8]
    },
    {
      "label": "Muscle",
      "data": [35.2, 33.8, 36.1]
    }
  ]
}
```

**Usage Example (Chart.js):**
```javascript
new Chart(ctx, {
  type: 'bar',
  data: graphData.barChart,
  options: {...}
});
```

### Line Chart Format

```json
{
  "labels": ["2024-01", "2024-02", "2024-03"],
  "datasets": [
    {
      "label": "Client 1",
      "data": [24.5, 24.8, 24.3]
    },
    {
      "label": "Client 2",
      "data": [25.1, 25.0, 24.9]
    }
  ]
}
```

**Usage Example (Chart.js):**
```javascript
new Chart(ctx, {
  type: 'line',
  data: graphData.lineChart,
  options: {...}
});
```

### Radar Chart Format

```json
{
  "labels": ["BMI", "Muscle", "Fat", "RM", "Body Age"],
  "datasets": [
    {
      "label": "Client Percentile Rank",
      "data": [75, 50, 60, 80, 45]
    }
  ]
}
```

**Usage Example (Chart.js):**
```javascript
new Chart(ctx, {
  type: 'radar',
  data: graphData.radarChart,
  options: {...}
});
```

### Scatter Plot Format

```json
{
  "datasets": [
    {
      "label": "BMI vs Muscle",
      "data": [[24.5, 35.2], [25.1, 33.8], [23.9, 36.1]],
      "correlation": -0.65
    }
  ]
}
```

**Usage Example (Chart.js):**
```javascript
new Chart(ctx, {
  type: 'scatter',
  data: graphData.scatterPlot,
  options: {...}
});
```

### Box Plot Format

```json
{
  "label": "bmi",
  "min": 18.5,
  "q1": 22.1,
  "median": 24.0,
  "q3": 26.8,
  "max": 32.1,
  "mean": 24.5
}
```

### Heatmap Format

```json
{
  "categories": ["Category A", "Category B"],
  "metrics": ["bmi", "muscle", "fat"],
  "values": [
    [24.5, 35.2, 22.1],
    [25.2, 33.8, 23.5]
  ]
}
```

---

## Use Cases

### 1. Coach Dashboard

**Scenario:** Coach wants to see overall performance of all clients

```bash
# Get comprehensive summary
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/summary?person=coach" \
  -H "Authorization: Bearer COACH_TOKEN"
```

**Use the data to display:**
- Overview statistics
- Top performing clients
- Clients needing attention
- Overall trends

### 2. Category Performance Comparison

**Scenario:** Compare performance between different training categories

```bash
# Compare two categories
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/category-comparison?person=coach&categoryIds=CATEGORY_1_ID,CATEGORY_2_ID" \
  -H "Authorization: Bearer COACH_TOKEN"
```

**Use the data to:**
- Identify which category performs better
- Allocate resources accordingly
- Adjust training programs

### 3. Client Progress Tracking

**Scenario:** Track individual client progress over time

```bash
# Get trends for a client
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/trends?person=coach&clientIds=CLIENT_ID&metric=weight" \
  -H "Authorization: Bearer COACH_TOKEN"
```

**Use the data to:**
- Show progress charts
- Identify plateaus
- Adjust training plans

### 4. Client Ranking & Motivation

**Scenario:** Show client where they stand relative to peers

```bash
# Get client ranking
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/client-ranking?person=client&comparisonGroup=all" \
  -H "Authorization: Bearer CLIENT_TOKEN"
```

**Use the data to:**
- Motivate clients
- Set realistic goals
- Show improvement areas

### 5. Injury Pattern Analysis

**Scenario:** Analyze injury patterns to improve training safety

```bash
# Get injury analysis
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/preferences-analysis?person=coach&analysisType=injuries" \
  -H "Authorization: Bearer COACH_TOKEN"
```

**Use the data to:**
- Identify common injury patterns
- Adjust training to prevent injuries
- Allocate physiotherapy resources

### 6. Supplement Effectiveness

**Scenario:** Analyze supplement usage patterns

```bash
# Get supplement analysis
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/preferences-analysis?person=coach&analysisType=supplements" \
  -H "Authorization: Bearer COACH_TOKEN"
```

**Use the data to:**
- Understand supplement trends
- Correlate with health improvements
- Recommend effective supplements

### 7. Metric Correlations

**Scenario:** Understand relationships between different health metrics

```bash
# Get correlations
curl -X GET "http://localhost:8084/api/app/roundglass/analytics/correlations?person=coach&metrics=bmi,muscle,fat" \
  -H "Authorization: Bearer COACH_TOKEN"
```

**Use the data to:**
- Understand metric relationships
- Predict outcomes
- Optimize training programs

---

## Error Handling

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "message": "Valid clientId is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "status_code": 401,
  "message": "Please login!"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "status_code": 403,
  "message": "You don't have access to this client's data"
}
```

### 404 Not Found
```json
{
  "success": false,
  "status_code": 404,
  "message": "Client not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "status_code": 500,
  "message": "Internal server error"
}
```

---

## Performance Considerations

1. **Data Limits:**
   - Maximum 1000 time-series data points returned
   - Large client lists are paginated automatically

2. **Caching:**
   - Consider caching frequently accessed aggregations
   - Cache duration: 5-15 minutes recommended

3. **Optimization Tips:**
   - Use specific `metrics` parameter to limit data processing
   - Use `categoryId` filter to reduce dataset size
   - Use date ranges for trends to limit historical data

4. **Best Practices:**
   - Fetch summaries for dashboards (lighter queries)
   - Use specific endpoints for detailed analysis
   - Cache summary data client-side

---

## Authentication

All endpoints require authentication via the `useAuth` middleware:

```bash
Authorization: Bearer <your_token_here>
```

The `person` query parameter determines access level:
- `person=client`: Access to own data only
- `person=coach`: Access to coach's clients' data

---

## Testing

### Postman Collection

Import the provided Postman collection or use curl commands above.

### Test Data Setup

1. Create clients with health matrices
2. Assign clients to categories
3. Create Roundglass preferences for clients
4. Add historical health matrix entries
5. Test each endpoint with various parameters

---

## Support

For issues or questions:
1. Check error messages for specific validation errors
2. Verify client-coach relationships
3. Ensure data exists before running analytics
4. Check authentication token validity

---

## Version History

- **v1.0.0** (2024-01-XX): Initial release
  - Category comparisons (intra/inter)
  - Time-series trends
  - Client rankings
  - Correlation analysis
  - Distribution statistics
  - Preferences analysis
  - Comprehensive summary endpoint
