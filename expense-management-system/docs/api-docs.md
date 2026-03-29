# API Documentation — Expense RMS Backend

Base URL: `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

---

## 1. Auth APIs

### POST `/api/auth/register` — Register Company + Admin
**Access:** Public

**Body:**
```json
{
  "name": "Admin Name",
  "email": "admin@company.com",
  "password": "password123",
  "companyName": "Acme Corp",
  "country": "India",
  "baseCurrency": "INR"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Company and admin user created successfully",
  "data": {
    "token": "eyJhbG...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "admin", "companyId": "..." },
    "company": { "id": "...", "name": "Acme Corp", "country": "India", "baseCurrency": "INR" }
  }
}
```

---

### POST `/api/auth/login` — Login
**Access:** Public

**Body:**
```json
{
  "email": "admin@company.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbG...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "admin", "companyId": "..." }
  }
}
```

---

## 2. Request APIs

### POST `/api/request/create` — Create Expense Request
**Access:** Protected — `employee` only

**Body:**
```json
{
  "amount": 2500,
  "category": "travel",
  "description": "Client visit cab fare",
  "expenseDate": "2026-03-15",
  "receiptUrl": "/uploads/receipts/file.jpg"
}
```

**Categories:** `travel`, `meals`, `accommodation`, `office_supplies`, `software`, `hardware`, `training`, `client_entertainment`, `communication`, `medical`, `other`

**Response (201):**
```json
{
  "success": true,
  "message": "Expense request created successfully",
  "data": {
    "_id": "...",
    "amount": 2500,
    "category": "travel",
    "status": "pending",
    "approvalLevel": 0,
    "approvers": [
      { "userId": "...", "role": "manager", "status": "pending" },
      { "userId": "...", "role": "finance", "status": "pending" },
      { "userId": "...", "role": "director", "status": "pending" }
    ]
  }
}
```

---

### GET `/api/request/my` — Get My Requests
**Access:** Protected — any authenticated user

**Query Params:** `?status=pending&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [ { ... }, { ... } ],
  "pagination": { "total": 3, "page": 1, "pages": 1 }
}
```

---

### GET `/api/request/all` — Get All Requests
**Access:** Protected — `manager`, `finance`, `director`, `admin`

- **Manager/Director:** Returns requests pending at their approval level
- **Admin/Finance:** Returns all company requests

**Query Params:** `?status=pending&category=travel&page=1&limit=20`

---

### PUT `/api/request/approve/:id` — Approve a Request
**Access:** Protected — `manager`, `finance`, `director`

**Body (optional):**
```json
{ "comment": "Approved — valid business expense" }
```

**Workflow:**
```
Manager approves  → Level 1 → forwarded to Finance
Finance approves  → Level 2 → forwarded to Director
Director approves → Level 3 → status = "approved" (ready for payment)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Request approved at level 1 — forwarded to next approver",
  "data": { ... }
}
```

---

### PUT `/api/request/reject/:id` — Reject a Request
**Access:** Protected — `manager`, `finance`, `director`

**Body (optional):**
```json
{ "comment": "Missing receipt — please resubmit" }
```

Any rejection at any level immediately sets `status = "rejected"`.

**Response (200):**
```json
{
  "success": true,
  "message": "Request rejected by manager",
  "data": { ... }
}
```

---

## 3. Admin APIs

### GET `/api/admin/users` — List Company Users
**Access:** Protected — `admin` only

**Query Params:** `?role=manager&page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    { "_id": "...", "name": "Manager Sharma", "email": "manager@acme.com", "role": "manager" }
  ],
  "pagination": { "total": 5, "page": 1, "pages": 1 }
}
```

---

### GET `/api/admin/analytics` — Company Analytics
**Access:** Protected — `admin` only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRequests": 15,
      "pendingRequests": 5,
      "approvedRequests": 8,
      "rejectedRequests": 2,
      "totalApprovedAmount": 125000,
      "totalPaidAmount": 95000,
      "pendingPayments": 3
    },
    "categoryBreakdown": [
      { "_id": "travel", "count": 6, "totalAmount": 45000 },
      { "_id": "software", "count": 3, "totalAmount": 35000 }
    ],
    "monthlyTrend": [
      { "_id": { "year": 2026, "month": 1 }, "count": 4, "totalAmount": 25000 }
    ],
    "userStats": {
      "total": 5,
      "byRole": [
        { "_id": "employee", "count": 1 },
        { "_id": "manager", "count": 1 }
      ]
    }
  }
}
```

---

### GET `/api/admin/all-requests` — All Company Requests
**Access:** Protected — `admin` only

**Query Params:** `?status=approved&category=travel&page=1&limit=20`

**Response (200):**
```json
{
  "success": true,
  "count": 15,
  "data": [ { ... } ],
  "pagination": { "total": 15, "page": 1, "pages": 1 }
}
```

---

## 4. Extended APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/auth/me` | Any auth | Current user profile |
| GET | `/api/approvals/history/:requestId` | Any auth | Approval audit trail |
| PUT | `/api/payments/:requestId/pay` | Finance | Mark as paid |
| GET | `/api/payments` | Finance/Admin | List payments |
| GET | `/api/dashboard` | Any auth | Role-specific dashboard |
| POST | `/api/upload/receipt` | Any auth | Upload receipt + OCR |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |
| GET | `/api/health` | Public | Health check |

---

## Error Response Format

All errors return a consistent JSON shape:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Status codes:
- `400` — Validation error / bad request
- `401` — Not authenticated / invalid token
- `403` — Not authorized (wrong role)
- `404` — Resource not found
- `500` — Server error
