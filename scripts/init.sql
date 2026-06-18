-- MedAI Database Initialization
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pgcrypto for additional encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Enable PostGIS for geospatial queries (doctor proximity)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Set timezone to South Africa Standard Time
SET timezone = 'Africa/Johannesburg';
