# Roundglass Client Preferences API Documentation

## Base URL
```
/api/app/roundglass/client-preference
```

## Authentication
All endpoints require authentication via the `useAuth` middleware. Include the authorization token in the request headers:
```
Authorization: Bearer <token>
```

The `person` query parameter is required and must be either `client` or `coach`.

---

## Endpoints

### 1. GET - Retrieve Preferences

Retrieve client preferences. For clients, returns their own data. For coaches, requires `clientId` in query parameters.

**Endpoint:** `GET /api/app/roundglass/client-preference`

**Query Parameters:**
- `person` (required): Either `client` or `coach`
- `clientId` (required if `person=coach`): Client ID (MongoDB ObjectId)

**Request Example (Client):**
```bash
curl -X GET "http://your-domain/api/app/roundglass/client-preference?person=client" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Request Example (Coach):**
```bash
curl -X GET "http://your-domain/api/app/roundglass/client-preference?person=coach&clientId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "clientId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "clientId": "123456",
      "profilePhoto": "https://..."
    },
    "allergies": "Peanuts, Dairy",
    "medicalHistory": "Hypertension, Diabetes",
    "familyHistory": "Heart disease in family",
    "trainingModule": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
        "trainingFrequency": "5 times per week",
        "duration": "60 minutes",
        "intensity": "Moderate",
        "conditioningDays": "Monday, Wednesday, Friday"
      }
    ],
    "supplements": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "brand": "Brand XYZ",
        "dosage": "500mg",
        "frequency": "Once daily",
        "source": "Pharmacy",
        "purpose": "Vitamin D",
        "dateTime": "2024-01-15T10:00:00Z"
      }
    ],
    "injuries": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "injuryType": "Sprain",
        "bodyPart": "Ankle",
        "incidentDate": "2023-12-01T00:00:00.000Z",
        "rehabProgress": "75% recovered",
        "physiotherapistAssignment": "Dr. Smith",
        "fileUpload": "https://..."
      }
    ],
    "dietRecall": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k5",
        "date": "18-01-2024",
        "practionerNotes": {
          "totalEnergyIntake": "2500",
          "proteinG": "150",
          "carbohydrateG": "300",
          "fatG": "80",
          "commentsKeyObservations": "Good protein intake, need to increase carbs"
        },
        "meals": [
          {
            "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
            "mealType": "Breakfast",
            "foodBeverage": "Oatmeal with fruits",
            "quantity": "1 bowl",
            "location": "Home",
            "comments": "Added banana and berries"
          }
        ]
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  },
  "message": "Preferences retrieved successfully"
}
```

**Response (404 - No preferences found):**
```json
{
  "status_code": 200,
  "data": null,
  "message": "No preferences found"
}
```

---

### 2. POST - Create or Update Preferences (Upsert)

Create new preferences or update existing ones. Uses upsert logic (create if doesn't exist, update if exists).

**Endpoint:** `POST /api/app/roundglass/client-preference`

**Query Parameters:**
- `person` (required): Either `client` or `coach`

**Request Body:**
```json
{
  "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "allergies": "Peanuts, Dairy",
  "medicalHistory": "Hypertension, Diabetes",
  "familyHistory": "Heart disease in family",
  "trainingModule": [
    {
      "trainingFrequency": "5 times per week",
      "duration": "60 minutes",
      "intensity": "Moderate",
      "conditioningDays": "Monday, Wednesday, Friday"
    }
  ],
  "supplements": [
    {
      "brand": "Brand XYZ",
      "dosage": "500mg",
      "frequency": "Once daily",
      "source": "Pharmacy",
      "purpose": "Vitamin D",
      "dateTime": "2024-01-15T10:00:00Z"
    }
  ],
  "injuries": [
    {
      "injuryType": "Sprain",
      "bodyPart": "Ankle",
      "incidentDate": "2023-12-01T00:00:00.000Z",
      "rehabProgress": "75% recovered",
      "physiotherapistAssignment": "Dr. Smith",
      "fileUpload": "https://example.com/file.pdf"
    }
  ],
  "dietRecall": [
    {
      "date": "18-01-2024",
      "practionerNotes": {
        "totalEnergyIntake": "2500",
        "proteinG": "150",
        "carbohydrateG": "300",
        "fatG": "80",
        "commentsKeyObservations": "Good protein intake, need to increase carbs"
      },
      "meals": [
        {
          "mealType": "Breakfast",
          "foodBeverage": "Oatmeal with fruits",
          "quantity": "1 bowl",
          "location": "Home",
          "comments": "Added banana and berries"
        },
        {
          "mealType": "Lunch",
          "foodBeverage": "Grilled chicken salad",
          "quantity": "200g chicken, 150g salad",
          "location": "Restaurant",
          "comments": "Light dressing"
        }
      ]
    }
  ]
}
```

**Curl Example:**
```bash
curl -X POST "http://your-domain/api/app/roundglass/client-preference?person=coach" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "allergies": "Peanuts, Dairy",
    "medicalHistory": "Hypertension",
    "familyHistory": "Heart disease",
    "trainingModule": [
      {
        "trainingFrequency": "5 times per week",
        "duration": "60 minutes",
        "intensity": "Moderate",
        "conditioningDays": "Monday, Wednesday, Friday"
      }
    ],
    "supplements": [],
    "injuries": []
  }'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "clientId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "John Doe",
      "email": "john@example.com",
      "clientId": "123456",
      "profilePhoto": "https://..."
    },
    "allergies": "Peanuts, Dairy",
    "medicalHistory": "Hypertension",
    "familyHistory": "Heart disease",
    "trainingModule": [...],
    "supplements": [],
    "injuries": [],
    "dietRecall": [],
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  },
  "message": "Preferences saved successfully"
}
```

---

### 3. PUT - Partial Update Preferences

Update specific fields in existing preferences. Only provided fields will be updated.

**Endpoint:** `PUT /api/app/roundglass/client-preference`

**Query Parameters:**
- `person` (required): Either `client` or `coach`

**Request Body (Partial Update Example):**
```json
{
  "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "allergies": "Updated allergies list",
  "trainingModule": [
    {
      "trainingFrequency": "6 times per week",
      "duration": "45 minutes",
      "intensity": "High",
      "conditioningDays": "Monday to Saturday"
    }
  ]
}
```

**Curl Example:**
```bash
curl -X PUT "http://your-domain/api/app/roundglass/client-preference?person=client" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "allergies": "Updated allergies: Peanuts only",
    "medicalHistory": "Updated medical history"
  }'
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "clientId": {...},
    "allergies": "Updated allergies: Peanuts only",
    "medicalHistory": "Updated medical history",
    "familyHistory": "Heart disease",
    "trainingModule": [...],
    "supplements": [...],
    "injuries": [...],
    "dietRecall": [...],
    "updatedAt": "2024-01-16T00:00:00.000Z"
  },
  "message": "Preferences updated successfully"
}
```

**Request Body (Diet Recall Update Example):**
```json
{
  "clientId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "dietRecall": [
    {
      "date": "18-01-2024",
      "practionerNotes": {
        "totalEnergyIntake": "2500",
        "proteinG": "150",
        "carbohydrateG": "300",
        "fatG": "80",
        "commentsKeyObservations": "Good protein intake"
      },
      "meals": [
        {
          "mealType": "Breakfast",
          "foodBeverage": "Oatmeal",
          "quantity": "1 bowl",
          "location": "Home",
          "comments": "With fruits"
        }
      ]
    }
  ]
}
```

**Note:** You can update arrays by providing the entire array. The array will be replaced with the new values.

---

### 4. DELETE - Delete Preferences

Delete client preferences by clientId.

**Endpoint:** `DELETE /api/app/roundglass/client-preference`

**Query Parameters:**
- `person` (required): Either `client` or `coach`
- `clientId` (required): Client ID (MongoDB ObjectId)

**Curl Example (Coach):**
```bash
curl -X DELETE "http://your-domain/api/app/roundglass/client-preference?person=coach&clientId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Curl Example (Client):**
```bash
curl -X DELETE "http://your-domain/api/app/roundglass/client-preference?person=client&clientId=64a1b2c3d4e5f6g7h8i9j0k1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response (200 OK):**
```json
{
  "status_code": 200,
  "data": {
    "clientId": "64a1b2c3d4e5f6g7h8i9j0k1"
  },
  "message": "Preferences deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "status_code": 400,
  "message": "Valid clientId is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "status_code": 401,
  "message": "Please login!"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "status_code": 403,
  "message": "You don't have access to this client's data"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "status_code": 404,
  "message": "Preferences not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "status_code": 500,
  "message": "Internal server error"
}
```

---

## Data Models

### Training Module
```json
{
  "_id": "MongoDB ObjectId (auto-generated)",
  "trainingFrequency": "String",
  "duration": "String",
  "intensity": "String",
  "conditioningDays": "String"
}
```

### Supplement
```json
{
  "_id": "MongoDB ObjectId (auto-generated)",
  "brand": "String",
  "dosage": "String",
  "frequency": "String",
  "source": "String",
  "purpose": "String",
  "dateTime": "String (ISO date string)"
}
```

### Injury
```json
{
  "_id": "MongoDB ObjectId (auto-generated)",
  "injuryType": "String",
  "bodyPart": "String",
  "incidentDate": "Date (ISO format)",
  "rehabProgress": "String",
  "physiotherapistAssignment": "String",
  "fileUpload": "String (file URL/path)"
}
```

### Diet Recall
```json
{
  "_id": "MongoDB ObjectId (auto-generated)",
  "date": "String (dd-MM-yyyy format)",
  "practionerNotes": {
    "totalEnergyIntake": "String",
    "proteinG": "String",
    "carbohydrateG": "String",
    "fatG": "String",
    "commentsKeyObservations": "String"
  },
  "meals": [
    {
      "_id": "MongoDB ObjectId (auto-generated)",
      "mealType": "String",
      "foodBeverage": "String",
      "quantity": "String",
      "location": "String",
      "comments": "String"
    }
  ]
}
```

**Field Mapping:**
- `foodBeverage` → Maps to "Food/Beverage"
- `quantity` → Maps to "Quantity"
- `totalEnergyIntake` → Maps to "Total Energy Intake"
- `proteinG` → Maps to "Protein (g)"
- `carbohydrateG` → Maps to "Carbohydrate (g)"
- `fatG` → Maps to "Fat (g)"
- `commentsKeyObservations` → Maps to "Comments / Key Observations"

---

## Notes

1. **Authentication:** All endpoints require valid authentication token in the Authorization header.
2. **Person Parameter:** The `person` query parameter is mandatory and determines access level:
   - `client`: Can only access/update their own data
   - `coach`: Can access/update data for clients they have access to (requires `clientId` for GET/DELETE)
3. **Partial Updates:** PUT endpoint supports partial updates - only provide fields you want to update.
4. **Array Updates:** When updating arrays via PUT, the entire array is replaced. To add/remove items, you need to send the complete updated array.
5. **Upsert Behavior:** POST endpoint creates a new document if it doesn't exist, or updates existing one if it does (based on `clientId`).
6. **Client-Coach Relationship:** Coaches can only access data for clients that belong to them (validated via client's `coach` field or coach's `clients` array).
