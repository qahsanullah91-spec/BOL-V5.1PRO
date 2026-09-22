-- Add truck_number column to bill_of_lading table
ALTER TABLE bill_of_lading ADD COLUMN IF NOT EXISTS truck_number TEXT;

-- Create routes table for multiple route stops
CREATE TABLE IF NOT EXISTS bol_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bol_id UUID REFERENCES bill_of_lading(id) ON DELETE CASCADE,
  route_order INTEGER NOT NULL DEFAULT 0,
  departure_location TEXT NOT NULL,
  departure_location_fa TEXT, -- Persian/Dari name
  destination_location TEXT NOT NULL,
  destination_location_fa TEXT, -- Persian/Dari name
  distance_km DECIMAL(10,2),
  estimated_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster route lookups by BOL
CREATE INDEX IF NOT EXISTS idx_bol_routes_bol_id ON bol_routes(bol_id);
CREATE INDEX IF NOT EXISTS idx_bol_routes_order ON bol_routes(bol_id, route_order);

-- Predefined common routes in Afghanistan/Iran region
CREATE TABLE IF NOT EXISTS predefined_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departure TEXT NOT NULL,
  departure_fa TEXT,
  destination TEXT NOT NULL,
  destination_fa TEXT,
  distance_km DECIMAL(10,2),
  estimated_time TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert common routes (Kandahar, Nimroz, etc.)
INSERT INTO predefined_routes (departure, departure_fa, destination, destination_fa, distance_km, estimated_time) VALUES
  ('Kandahar', 'کندهار', 'Nimroz', 'نیمروز', 450, '8-10 hours'),
  ('Kandahar', 'کندهار', 'Zaranj', 'زرنج', 480, '9-11 hours'),
  ('Kandahar', 'کندهار', 'Herat', 'هرات', 560, '10-12 hours'),
  ('Kandahar', 'کندهار', 'Kabul', 'کابل', 480, '8-10 hours'),
  ('Nimroz', 'نیمروز', 'Zaranj', 'زرنج', 30, '30 minutes'),
  ('Nimroz', 'نیمروز', 'Zahedan', 'زاهدان', 150, '3-4 hours'),
  ('Zaranj', 'زرنج', 'Zahedan', 'زاهدان', 120, '2-3 hours'),
  ('Herat', 'هرات', 'Islam Qala', 'اسلام قلعه', 120, '2-3 hours'),
  ('Islam Qala', 'اسلام قلعه', 'Mashhad', 'مشهد', 180, '3-4 hours'),
  ('Bandar Abbas', 'بندرعباس', 'Zahedan', 'زاهدان', 700, '10-12 hours'),
  ('Chabahar', 'چابهار', 'Zahedan', 'زاهدان', 650, '9-11 hours'),
  ('Karachi', 'کراچی', 'Quetta', 'کویته', 680, '10-12 hours'),
  ('Quetta', 'کویته', 'Kandahar', 'کندهار', 220, '4-5 hours')
ON CONFLICT DO NOTHING;

-- Disable RLS for these tables (no auth)
ALTER TABLE bol_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_routes DISABLE ROW LEVEL SECURITY;
