-- Grant all permissions to health_admin user
-- Run this as postgres superuser

-- Grant permissions on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO health_admin;

-- Grant permissions on sequences (for auto-increment IDs)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO health_admin;

-- Grant default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO health_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO health_admin;

-- Verify permissions
\dp users
