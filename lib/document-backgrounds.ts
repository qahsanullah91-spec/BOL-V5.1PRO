import artwork from './document-backgrounds.json'

export interface DocumentBackground {
  label: string
  category: string
  url: string
  opacity: number
}

// 1. Clean White Base
export const BASE_BACKGROUNDS: DocumentBackground[] = [
  { label: 'Clean White', category: 'Classic', url: '', opacity: 0 },
]

// 2. High-Definition Photographic & Realistic Picture Watermarks
export const PHOTO_BACKGROUNDS: DocumentBackground[] = [
  // Mountains
  { label: 'Hindu Kush Peaks (Photo)', category: 'Mountains', url: '/images/photo_hindu_kush_peaks.jpg', opacity: 0.16 },
  { label: 'Salang Summit Pass (Photo)', category: 'Mountains', url: '/images/mountain-watermark-premium.png', opacity: 0.18 },
  { label: 'Afghan Mountain Ridge', category: 'Mountains', url: '/images/afghan_mountain_blueprint_bg.jpg', opacity: 0.15 },
  { label: 'Pamir Valley Transit', category: 'Mountains', url: '/images/mountain_logistics_bg.jpg', opacity: 0.15 },

  // Overland Transit & Logistics
  { label: 'Freight Truck Convoy (Photo)', category: 'Overland', url: '/images/photo_overland_truck_convoy.jpg', opacity: 0.16 },
  { label: 'Border Customs Terminal (Photo)', category: 'Overland', url: '/images/photo_border_customs_terminal.jpg', opacity: 0.16 },
  { label: 'Intermodal Freight Train (Photo)', category: 'Overland', url: '/images/photo_intermodal_freight_train.jpg', opacity: 0.16 },
  { label: 'Mountain Highway Transit', category: 'Overland', url: '/images/mountain_transit_highway_bg.jpg', opacity: 0.15 },
  { label: 'Modern Cargo Fleet', category: 'Overland', url: '/images/modern_cargo_convoy.jpg', opacity: 0.15 },
  { label: 'Afghan Transit Pass', category: 'Overland', url: '/images/afghan_cargo_fleet_pass.jpg', opacity: 0.15 },
  { label: 'Inland Dry Port Hub', category: 'Overland', url: '/images/border_dry_port.jpg', opacity: 0.15 },

  // Maritime & Ocean Shipping
  { label: 'Ocean Container Ship (Photo)', category: 'Maritime', url: '/images/photo_ocean_containership.jpg', opacity: 0.16 },
  { label: 'Harbor Gantry Terminal (Photo)', category: 'Maritime', url: '/images/photo_harbor_cranes_port.jpg', opacity: 0.16 },
  { label: 'Deep Sea Cargo Vessel', category: 'Maritime', url: '/images/maritime_port_cargo_ship.jpg', opacity: 0.15 },
  { label: 'Container Port Sunset', category: 'Maritime', url: '/images/container_terminal_sunset.jpg', opacity: 0.15 },

  // Aviation & Air Freight
  { label: 'Cargo Freighter Jet (Photo)', category: 'Aviation', url: '/images/photo_cargo_freighter_jet.jpg', opacity: 0.16 },
  { label: 'Airport Cargo Ramp Night (Photo)', category: 'Aviation', url: '/images/photo_airport_cargo_night.jpg', opacity: 0.16 },
  { label: 'Sky Freight Jumbo', category: 'Aviation', url: '/images/sky_freight_cargo_plane.jpg', opacity: 0.15 },
  { label: 'Night Air Dispatch', category: 'Aviation', url: '/images/cargo_aircraft_night.jpg', opacity: 0.15 },
  { label: 'Air Cargo Jet Tarmac', category: 'Aviation', url: '/images/air_cargo_jet.jpg', opacity: 0.15 },
  { label: 'Global Flight Security', category: 'Aviation', url: '/images/document-backgrounds/global-flight-premium.png', opacity: 0.18 },

  // Banknote Security Art & Heraldic Crests
  { label: 'Banknote Security Crest (Art)', category: 'Geometric', url: '/images/photo_banknote_security_crest.jpg', opacity: 0.16 },
  { label: 'Golden Compass Rose (Art)', category: 'Geometric', url: '/images/photo_golden_compass_rose.jpg', opacity: 0.16 },
]

// 3. Classic Technical Blueprints
export const CLASSIC_BACKGROUNDS: DocumentBackground[] = [
  ...BASE_BACKGROUNDS,
  { label: 'Truck Blueprint', category: 'Classic', url: '/images/overland_transit_blueprint.svg', opacity: 0.18 },
  { label: 'Ship Blueprint', category: 'Classic', url: '/images/maritime_shipping_blueprint.svg', opacity: 0.18 },
  { label: 'Flight Blueprint', category: 'Classic', url: '/images/air_cargo_blueprint.svg', opacity: 0.18 },
]

// 4. Combined Master Document Backgrounds Catalog
export const DOCUMENT_BACKGROUNDS: DocumentBackground[] = [
  ...BASE_BACKGROUNDS,
  ...PHOTO_BACKGROUNDS,
  ...artwork,
  { label: 'Truck Blueprint', category: 'Classic', url: '/images/overland_transit_blueprint.svg', opacity: 0.18 },
  { label: 'Ship Blueprint', category: 'Classic', url: '/images/maritime_shipping_blueprint.svg', opacity: 0.18 },
  { label: 'Flight Blueprint', category: 'Classic', url: '/images/air_cargo_blueprint.svg', opacity: 0.18 },
]
