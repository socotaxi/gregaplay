-- Add missing description column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the schema description to reflect this change
COMMENT ON TABLE events IS 'Table to store events with their details';
COMMENT ON COLUMN events.description IS 'Description of the event';

-- Clear schema cache to ensure the column is recognized
DROP EXTENSION IF EXISTS pg_stat_statements CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;

-- Install pgMustard extension to help with query performance if needed
-- CREATE EXTENSION IF NOT EXISTS pg_mustard WITH SCHEMA public;

-- Notify about the schema change
DO $$ 
BEGIN
  RAISE NOTICE 'The description column has been added to the events table';
END $$;