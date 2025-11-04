-- ================================================
-- DATABASE SETUP FOR HEALTH TRACKING APP
-- ================================================
-- Run this script as PostgreSQL superuser (postgres)

-- Step 1: Create Database and User
CREATE DATABASE health_tracking_db;

-- Create user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'health_admin') THEN
    CREATE USER health_admin WITH PASSWORD 'Anika123!';
  END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE health_tracking_db TO health_admin;

-- Connect to the database
\c health_tracking_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO health_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO health_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO health_admin;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

GRANT USAGE ON SCHEMA public TO health_admin;

\echo '✅ Database setup completed successfully!'
\echo '📝 Database: health_tracking_db'
\echo '👤 User: health_admin'
\echo '🔑 Password: Anika123!'
\echo ''
\echo '⏭️  Next step: Run the schema migrations'
\echo '   cd backend'
\echo '   npm run migrate'
