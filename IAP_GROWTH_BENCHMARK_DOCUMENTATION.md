# IAP/IPA Growth Benchmark Module - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Setup](#setup)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Examples](#examples)
6. [Error Handling](#error-handling)

---

## Overview

The IAP/IPA Growth Benchmark Module compares client height and weight measurements against 50th percentile (P50) reference data based on age and gender. It provides scoring, gap calculations, and group reporting capabilities.

### Key Features
- **Measurement Tracking**: Store and manage client height/weight measurements
- **P50 Benchmarking**: Compare measurements against 50th percentile reference data
- **Scoring System**: Binary scoring (1 if >= P50, 0 if < P50) for height and weight
- **Gap Calculation**: Calculate gaps between actual and P50 values
- **Group Reports**: Aggregate statistics by age groups (U14, U16, U18)
- **PDF Export**: Generate PDF reports for group analytics

---

## Setup

### 1. Seed Reference Data

Before using the APIs, you need to populate the `growth_reference_p50` collection with IPA/IAP reference data. Use your preferred method to insert data into the `GrowthReference` collection with the following structure:

```javascript
{
  standard: "IPA", // or "IAP"
  gender: "male", // or "female"
  ageMonths: 156, // Age in months
  p50HeightCm: 165.5, // 50th percentile height in cm
  p50WeightKg: 52.3 // 50th percentile weight in kg
}
```

### 2. Ensure Client Data

Clients must have:
- `dob` (String): Date of birth in any supported format (dd-MM-yyyy, yyyy-MM-dd, etc.)
- `gender` (String): Either "male" or "female"
- `healthMatrix` (ObjectId): Reference to ClientHealthMatrix document

---

## API Endpoints

Base URL: `/api/growth`

All endpoints require authentication via `useAuth` middleware.

---

### 1. Create Measurement

**Endpoint:** `POST /api/growth/measurements`

**Purpose:** Create or update a client measurement (prevents duplicate same-day entries)

**Request Body:**
```json
{
  "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "measuredAt": "2024-01-18",
  "height": 162.3,
  "heightUnit": "Cms",
  "weight": 54.2,
  "weightUnit": "KG",
  "standard": "IPA"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientId` | ObjectId | Yes | Client MongoDB ObjectId |
| `measuredAt` | Date/String | Yes | Measurement date (YYYY-MM-DD or dd-MM-yyyy) |
| `height` | Number/String | Yes | Height value |
| `heightUnit` | String | Yes | Height unit: "Cms", "Inches", etc. |
| `weight` | Number/String | Yes | Weight value |
| `weightUnit` | String | Yes | Weight unit: "KG", "Pounds", etc. |
| `standard` | String | No | Standard: "IPA" or "IAP" (default: "IPA") |

**Response:**
```json
{
  "status_code": 201,
  "data": {
    "measurement": {
      "clientId": "...",
      "createdDate": "18-01-2024",
      "height": "162.3",
      "heightUnit": "Cms",
      "weight": "54.2",
      "weightUnit": "KG"
    },
    "benchmark": {
      "ageMonths": 156,
      "standard": "IPA",
      "gender": "male",
      "heightScore": 1,
      "weightScore": 1,
      "heightGapCm": 2.3,
      "weightGapKg": 3.2,
      "p50HeightCm": 160.0,
      "p50WeightKg": 51.0
    }
  },
  "message": "Measurement created successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8084/api/growth/measurements" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "measuredAt": "2024-01-18",
    "height": 162.3,
    "heightUnit": "Cms",
    "weight": 54.2,
    "weightUnit": "KG"
  }'
```

**Errors:**
- `400`: Invalid input (missing fields, invalid ranges, invalid date format)
- `403`: User doesn't have access to this client
- `404`: Client not found
- `409`: Measurement already exists for this date

---

### 2. Get Client Status

**Endpoint:** `GET /api/growth/clients/:clientId/status?date=YYYY-MM-DD&standard=IPA`

**Purpose:** Get latest growth status for a client, optionally filtered by date

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | String | No | Get status closest on/before this date (YYYY-MM-DD). If not provided, returns latest |
| `standard` | String | No | Standard: "IPA" or "IAP" (default: "IPA") |

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "clientId": "...",
    "createdDate": "18-01-2024",
    "height": "162.3",
    "heightUnit": "Cms",
    "weight": "54.2",
    "weightUnit": "KG",
    "benchmark": {
      "ageMonths": 156,
      "standard": "IPA",
      "gender": "male",
      "heightScore": 1,
      "weightScore": 1,
      "heightGapCm": 2.3,
      "weightGapKg": 3.2,
      "p50HeightCm": 160.0,
      "p50WeightKg": 51.0
    }
  },
  "message": "Client status retrieved successfully"
}
```

**cURL Examples:**

```bash
# Get latest status
curl -X GET "http://localhost:8084/api/growth/clients/64a1b2c3d4e5f6g7h8i9j0k1/status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get status for specific date
curl -X GET "http://localhost:8084/api/growth/clients/64a1b2c3d4e5f6g7h8i9j0k1/status?date=2024-01-18" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get status with specific standard
curl -X GET "http://localhost:8084/api/growth/clients/64a1b2c3d4e5f6g7h8i9j0k1/status?standard=IAP" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Errors:**
- `400`: Invalid clientId or date format
- `403`: User doesn't have access to this client
- `404`: Client not found

---

### 3. Get Group Report

**Endpoint:** `GET /api/growth/groups/:groupId/report?from=YYYY-MM-DD&to=YYYY-MM-DD&ageGroup=U14,U16&standard=IPA`

**Purpose:** Get aggregated growth statistics for a group of clients

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | String | No | Start date filter (YYYY-MM-DD) |
| `to` | String | No | End date filter (YYYY-MM-DD) |
| `ageGroup` | String | No | Comma-separated age groups: "U14", "U16", "U18" (default: all) |
| `standard` | String | No | Standard: "IPA" or "IAP" (default: "IPA") |

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "groupId": "...",
    "groupName": "Team A",
    "from": "2024-01-01",
    "to": "2024-12-31",
    "standard": "IPA",
    "buckets": [
      {
        "bucket": "U14",
        "total": 15,
        "height": {
          "aboveP50": 8,
          "belowP50": 7
        },
        "weight": {
          "aboveP50": 9,
          "belowP50": 6
        }
      },
      {
        "bucket": "U16",
        "total": 20,
        "height": {
          "aboveP50": 12,
          "belowP50": 8
        },
        "weight": {
          "aboveP50": 11,
          "belowP50": 9
        }
      }
    ],
    "overall": {
      "total": 35,
      "height": {
        "aboveP50": 20,
        "belowP50": 15
      },
      "weight": {
        "aboveP50": 20,
        "belowP50": 15
      }
    }
  },
  "message": "Group report retrieved successfully"
}
```

**cURL Examples:**

```bash
# Get full report
curl -X GET "http://localhost:8084/api/growth/groups/64a1b2c3d4e5f6g7h8i9j0k1/report" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get report with date range
curl -X GET "http://localhost:8084/api/growth/groups/64a1b2c3d4e5f6g7h8i9j0k1/report?from=2024-01-01&to=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get report for specific age groups
curl -X GET "http://localhost:8084/api/growth/groups/64a1b2c3d4e5f6g7h8i9j0k1/report?ageGroup=U14,U16" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Age Buckets:**
- **U14**: Age < 14 years
- **U16**: 14 <= Age < 16 years
- **U18**: 16 <= Age < 18 years

**Errors:**
- `400`: Invalid groupId or date format
- `403`: User doesn't have access to this group
- `404`: Group not found

---

### 4. Generate Group Report PDF

**Endpoint:** `GET /api/growth/groups/:groupId/report.pdf?from=YYYY-MM-DD&to=YYYY-MM-DD&ageGroup=U14,U16&standard=IPA`

**Purpose:** Generate and download a PDF report for group analytics

**Query Parameters:** Same as Get Group Report

**Response:** PDF file (application/pdf)

**cURL Example:**
```bash
curl -X GET "http://localhost:8084/api/growth/groups/64a1b2c3d4e5f6g7h8i9j0k1/report.pdf?from=2024-01-01&to=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output growth-report.pdf
```

**PDF Contents:**
- Title: "Growth Analysis Report"
- Group name and date range
- Age bucket tables with statistics
- Overall summary

**Errors:**
- Same as Get Group Report

---

### 5. Create Group

**Endpoint:** `POST /api/growth/groups`

**Purpose:** Create a new group for organizing clients

**Request Body:**
```json
{
  "name": "Team A",
  "description": "Under-14 team",
  "clientIds": ["64a1b2c3d4e5f6g7h8i9j0k1", "64a1b2c3d4e5f6g7h8i9j0k2"]
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Group name |
| `description` | String | No | Group description |
| `clientIds` | Array | No | Array of client ObjectIds to add initially |

**Response:**
```json
{
  "status_code": 201,
  "data": {
    "_id": "...",
    "name": "Team A",
    "description": "Under-14 team",
    "coach": "...",
    "clients": [...],
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Group created successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8084/api/growth/groups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team A",
    "description": "Under-14 team",
    "clientIds": ["64a1b2c3d4e5f6g7h8i9j0k1"]
  }'
```

**Errors:**
- `400`: Missing name or invalid clientIds
- `401`: Authentication required
- `403`: Only coaches can create groups

---

### 6. Add Clients to Group

**Endpoint:** `PUT /api/growth/groups/:groupId/clients`

**Purpose:** Add clients to an existing group

**Request Body:**
```json
{
  "clientIds": ["64a1b2c3d4e5f6g7h8i9j0k1", "64a1b2c3d4e5f6g7h8i9j0k2"]
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientIds` | Array | Yes | Array of client ObjectIds to add |

**Response:**
```json
{
  "status_code": 200,
  "data": {
    "_id": "...",
    "name": "Team A",
    "clients": [
      {
        "_id": "...",
        "name": "Client 1",
        "clientId": "CLI001"
      },
      ...
    ],
    ...
  },
  "message": "Clients added to group successfully"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8084/api/growth/groups/64a1b2c3d4e5f6g7h8i9j0k1/clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientIds": ["64a1b2c3d4e5f6g7h8i9j0k1", "64a1b2c3d4e5f6g7h8i9j0k2"]
  }'
```

**Errors:**
- `400`: Missing or invalid clientIds, or no valid clients to add
- `403`: User doesn't have access to this group
- `404`: Group not found

---

## Data Models

### ClientHealthMatrix

This module uses the existing `ClientHealthMatrix` model. Key fields used:

```javascript
{
  client: ObjectId (ref: AppClient),
  coach: ObjectId (ref: AppCoach, optional),
  weight: String,
  weightUnit: String,
  height: String,
  heightUnit: String,
  createdDate: String (dd-MM-yyyy format),
  healthMatrix: Array // Historical entries with same structure
}
```

**Note:** Measurements are stored in the `healthMatrix` array, with each entry containing:
- `weight`, `weightUnit`, `height`, `heightUnit`, `createdDate`
- Historical entries are preserved in the array

### GrowthReference

```javascript
{
  standard: String (enum: ["IPA", "IAP"], default: "IPA"),
  gender: String (enum: ["male", "female"]),
  ageMonths: Number (0-240),
  p50HeightCm: Number,
  p50WeightKg: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ standard: 1, gender: 1, ageMonths: 1 }` (unique compound)
- `{ gender: 1, ageMonths: 1 }`

### Group

```javascript
{
  name: String,
  coach: ObjectId (ref: AppCoach),
  clients: [ObjectId] (ref: AppClient),
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ coach: 1 }`
- `{ isActive: 1 }`

---

## Examples

### Complete Workflow

1. **Seed reference data:**
```bash
node scripts/seedGrowthReferenceP50.js
```

2. **Create a group:**
```bash
curl -X POST "http://localhost:8084/api/growth/groups" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Team A", "description": "Under-14 team"}'
```

3. **Add clients to group:**
```bash
curl -X PUT "http://localhost:8084/api/growth/groups/GROUP_ID/clients" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientIds": ["CLIENT_ID_1", "CLIENT_ID_2"]}'
```

4. **Create measurements:**
```bash
curl -X POST "http://localhost:8084/api/growth/measurements" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_ID_1",
    "measuredAt": "2024-01-18",
    "height": 162.3,
    "heightUnit": "Cms",
    "weight": 54.2,
    "weightUnit": "KG"
  }'
```

5. **Get group report:**
```bash
curl -X GET "http://localhost:8084/api/growth/groups/GROUP_ID/report?from=2024-01-01&to=2024-12-31" \
  -H "Authorization: Bearer TOKEN"
```

6. **Download PDF report:**
```bash
curl -X GET "http://localhost:8084/api/growth/groups/GROUP_ID/report.pdf" \
  -H "Authorization: Bearer TOKEN" \
  --output report.pdf
```

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
  "message": "You don't have access to this client"
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

### 409 Conflict
```json
{
  "success": false,
  "status_code": 409,
  "message": "Measurement already exists for this date"
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

## Notes

- **Date Formats**: The system supports multiple date formats for `dob` parsing (dd-MM-yyyy, yyyy-MM-dd, ISO, etc.)
- **Age Calculation**: Age is calculated in months at the time of measurement
- **Reference Lookup**: If exact age match is not found, the system uses the nearest available reference
- **Duplicate Prevention**: Only one measurement per client per day is allowed
- **Access Control**: Coaches can only access their own clients and groups
- **Scoring**: Scores are binary (1 = at or above P50, 0 = below P50)
- **Gaps**: Gap values can be positive (above P50) or negative (below P50)

---

## Support

For issues or questions:
1. Ensure reference data is seeded
2. Verify client has valid `dob` and `gender`
3. Check authentication token validity
4. Verify coach has access to clients/groups
