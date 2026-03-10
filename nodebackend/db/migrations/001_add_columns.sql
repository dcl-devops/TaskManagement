-- Migration 001: Add columns for enhanced project/meeting/task features
-- Run this on your Digital Ocean PostgreSQL database after pulling latest code
-- This is safe to run multiple times (uses IF NOT EXISTS)

-- Organizations: add status column for super admin management
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Meetings: add project linking
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);

-- Users: add super admin flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;

-- Note: No data-destructive changes. All existing data is preserved.
