# API Documentation - Class Management System

## Overview

This API provides comprehensive class management functionality for computer science teachers, allowing them to manage classes, students, and labs.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Classes

#### Create a Class
```http
POST /classes
Content-Type: application/json

{
  "level": "1st_year_middle",
  "name": "Computer Science 1A",
  "subject": "Computer Science",
  "labId": 1,  // Optional
  "weeklySessions": 3
}
```

**Response:**
```json
{
  "id": 1,
  "level": "1st_year_middle",
  "name": "Computer Science 1A",
  "subject": "Computer Science",
  "labId": 1,
  "lab": {
    "id": 1,
    "name": "Lab A",
    "location": "Building 1, Room 101"
  },
  "weeklySessions": 3,
  "studentCount": 0,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### Get All Classes
```http
GET /classes
```

**Response:**
```json
[
  {
    "id": 1,
    "level": "1st_year_middle",
    "name": "Computer Science 1A",
    "subject": "Computer Science",
    "labId": 1,
    "lab": {
      "id": 1,
      "name": "Lab A",
      "location": "Building 1, Room 101"
    },
    "weeklySessions": 3,
    "studentCount": 25,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

#### Get Class by ID
```http
GET /classes/:id
```

**Response:**
```json
{
  "id": 1,
  "level": "1st_year_middle",
  "name": "Computer Science 1A",
  "subject": "Computer Science",
  "labId": 1,
  "lab": {
    "id": 1,
    "name": "Lab A",
    "location": "Building 1, Room 101"
  },
  "weeklySessions": 3,
  "studentCount": 25,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### Get Student Count for a Class
```http
GET /classes/:id/student-count
```

**Response:**
```json
{
  "studentCount": 25
}
```

#### Update a Class
```http
PATCH /classes/:id
Content-Type: application/json

{
  "name": "Computer Science 1A - Updated",
  "weeklySessions": 4
}
```

**Response:**
```json
{
  "id": 1,
  "level": "1st_year_middle",
  "name": "Computer Science 1A - Updated",
  "subject": "Computer Science",
  "labId": 1,
  "lab": {
    "id": 1,
    "name": "Lab A",
    "location": "Building 1, Room 101"
  },
  "weeklySessions": 4,
  "studentCount": 25,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Delete a Class
```http
DELETE /classes/:id
```

**Response:** `204 No Content`

## Class Levels

The following class levels are supported:

- `1st_year_middle` - 1st Year Middle School
- `2nd_year_middle` - 2nd Year Middle School
- `3rd_year_middle` - 3rd Year Middle School
- `4th_year_middle` - 4th Year Middle School
- `1st_year_high` - 1st Year High School
- `2nd_year_high` - 2nd Year High School
- `3rd_year_high` - 3rd Year High School

## Data Models

### Class Entity
- `id` (number) - Unique identifier
- `level` (enum) - Class level (see above)
- `name` (string) - Class name
- `subject` (string) - Subject name
- `labId` (number, optional) - Reference to lab
- `weeklySessions` (number) - Number of weekly sessions (0-20)
- `studentCount` (number, computed) - Number of students in the class
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Last update timestamp

### Lab Entity
- `id` (number) - Unique identifier
- `name` (string) - Lab name
- `description` (string, optional) - Lab description
- `location` (string, optional) - Lab location
- `isAvailable` (boolean) - Availability status

### Student Entity
- `id` (number) - Unique identifier
- `firstName` (string) - Student first name
- `lastName` (string) - Student last name
- `email` (string, optional) - Student email
- `studentNumber` (string, optional) - Student number
- `classId` (number, optional) - Reference to class

## Validation Rules

### Create Class DTO
- `level`: Required, must be a valid enum value
- `name`: Required, must be a string
- `subject`: Required, must be a string
- `labId`: Optional, must be a valid integer
- `weeklySessions`: Required, must be an integer between 0 and 20

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Class with ID 999 not found",
  "error": "Not Found"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": [
    "level must be a valid enum value",
    "weeklySessions must be a number"
  ],
  "error": "Bad Request"
}
```

## Example Usage

### Create a new class
```bash
curl -X POST http://localhost:3000/classes \
  -H "Content-Type: application/json" \
  -d '{
    "level": "1st_year_middle",
    "name": "Introduction to Programming",
    "subject": "Computer Science",
    "weeklySessions": 3
  }'
```

### Get all classes
```bash
curl http://localhost:3000/classes
```

### Get student count for a class
```bash
curl http://localhost:3000/classes/1/student-count
```

### Update a class
```bash
curl -X PATCH http://localhost:3000/classes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "weeklySessions": 4
  }'
```

### Delete a class
```bash
curl -X DELETE http://localhost:3000/classes/1
```









