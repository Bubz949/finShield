# Database Setup Fix for Nuvanta

## Problem
Your PostgreSQL database is missing the required tables/columns, causing login errors with code `42703` (undefined_column).

## Quick Fix

### Option 1: Run the Migration Script
```bash
# Set your DATABASE_URL environment variable first
export DATABASE_URL="your_postgresql_connection_string"

# Run the database setup
npm run db:setup
```

### Option 2: Manual SQL Execution
Connect to your PostgreSQL database and run the SQL from `migrate.sql`:

```sql
-- Connect to your database and run:
\i migrate.sql
```

### Option 3: Use Drizzle Push (Recommended)
```bash
npm run db:push
```

## What the Migration Does

1. **Creates all required tables**:
   - users
   - auth_tokens  
   - accounts
   - transactions
   - alerts
   - family_members
   - bills

2. **Adds a demo user**:
   - Username: `mary.johnson`
   - Password: `password123`
   - Email: `mary.johnson@email.com`

## Test the Fix

After running the migration:

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Test login**:
   - Username: `mary.johnson`
   - Password: `password123`

3. **Check the chatbot**:
   - Look for the blue chat button in bottom-right corner
   - Try asking: "How do I review a transaction?"

## Environment Variables Required

Make sure you have these in your `.env` file:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Troubleshooting

If you still get errors:

1. **Check database connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. **Verify tables exist**:
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

3. **Check user exists**:
   ```bash
   psql $DATABASE_URL -c "SELECT username FROM users;"
   ```

The chatbot will work once the database is properly set up and you can log in successfully.