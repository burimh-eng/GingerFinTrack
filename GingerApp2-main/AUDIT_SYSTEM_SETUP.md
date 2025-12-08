# Audit Logging System Setup

## Overview
A comprehensive audit logging system has been implemented to track:
- User login/logout times
- Who created each transaction
- Who modified each transaction  
- All data changes with timestamps
- IP addresses and user agents

## Database Changes

### New Table: AuditLog
Tracks all user actions with:
- `username` - Who performed the action
- `action` - LOGIN, LOGOUT, CREATE, UPDATE, DELETE, IMPORT
- `entityType` - What was affected (TRANSACTION, USER, etc.)
- `entityId` - ID of the affected record
- `details` - JSON with additional information
- `ipAddress` - User's IP address
- `userAgent` - Browser/device information
- `timestamp` - When the action occurred

### Updated Table: Transaction
Added tracking fields:
- `createdBy` - Username who created the transaction
- `modifiedBy` - Username who last modified the transaction

## Setup Instructions

### 1. Run Database Migration
```bash
cd server
npx prisma migrate dev --name add_audit_logging
```

This will:
- Create the `AuditLog` table
- Add `createdBy` and `modifiedBy` fields to `Transaction` table
- Update the Prisma client

### 2. Restart Backend Server
```bash
npm run dev
```

## Features Implemented

### 1. Login/Logout Tracking
- Automatically logs when users log in
- Automatically logs when users log out
- Records IP address and timestamp

### 2. Transaction Tracking
- Records who created each transaction
- Records who last modified each transaction
- Tracks creation and modification timestamps

### 3. Audit Log API Endpoints

#### Get All Audit Logs
```
GET /api/audit?username=Burimi&action=LOGIN&limit=50
```

#### Get User Activity Summary
```
GET /api/audit/user/Burimi?days=30
```
Returns:
- Total actions count
- Login/logout counts
- Create/update/delete counts
- Last login/logout times
- Recent activity list

#### Get Login/Logout Sessions
```
GET /api/audit/sessions?username=Burimi
```

## Usage Examples

### View Burimi's Activity
```
GET /api/audit/user/Burimi
```

Response:
```json
{
  "success": true,
  "activity": {
    "username": "Burimi",
    "period": "Last 30 days",
    "statistics": {
      "totalActions": 145,
      "logins": 12,
      "logouts": 11,
      "creates": 45,
      "updates": 23,
      "deletes": 5,
      "imports": 2
    },
    "lastLogin": "2024-12-04T16:20:00.000Z",
    "lastLogout": "2024-12-03T18:30:00.000Z",
    "recentActivity": [...]
  }
}
```

### View All Login Events
```
GET /api/audit?action=LOGIN&limit=20
```

### View Recent Activity
```
GET /api/audit?limit=50
```

## Frontend Integration

### Login Tracking
When a user logs in, the system automatically:
1. Stores credentials in localStorage
2. Sends audit log to `/api/audit/log-login`
3. Records IP address and timestamp

### Logout Tracking
When a user logs out, the system automatically:
1. Sends audit log to `/api/audit/log-logout`
2. Clears localStorage
3. Records timestamp

### Transaction Creation
When creating a transaction:
- `createdBy` field is automatically set to current username
- Audit log entry is created with action='CREATE'

### Transaction Modification
When updating a transaction:
- `modifiedBy` field is updated to current username
- Audit log entry is created with action='UPDATE'

## Security & Privacy

- IP addresses are logged for security purposes
- User agents help identify suspicious activity
- All timestamps are in UTC
- Audit logs cannot be deleted (append-only)
- Only admins can view audit logs

## Future Enhancements

Potential additions:
1. **Audit Log Viewer UI** - Frontend component to view logs
2. **Export Audit Reports** - Download audit logs as CSV
3. **Real-time Alerts** - Notify admins of suspicious activity
4. **Data Retention Policy** - Auto-archive old logs
5. **Advanced Filtering** - Search by date range, action type, etc.

## Troubleshooting

### Migration Fails
If migration fails, check:
- PostgreSQL is running
- DATABASE_URL is correct in .env
- No active connections to database

### Audit Logs Not Created
Check:
- Backend server is running
- Network requests succeed (check browser console)
- Database connection is working

### Missing createdBy/modifiedBy
For existing transactions:
- These fields will be NULL
- Only new transactions will have tracking
- Can run a script to backfill if needed

## Monitoring

To monitor audit logs:
```sql
-- Recent logins
SELECT * FROM "AuditLog" 
WHERE action = 'LOGIN' 
ORDER BY timestamp DESC 
LIMIT 10;

-- User activity count
SELECT username, COUNT(*) as actions
FROM "AuditLog"
GROUP BY username
ORDER BY actions DESC;

-- Actions by type
SELECT action, COUNT(*) as count
FROM "AuditLog"
GROUP BY action
ORDER BY count DESC;
```
