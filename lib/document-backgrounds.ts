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
  { label: 'Winding Mountain Pass (Photo)', category: 'Mountains', url: '/images/watermark-photos/winding-pass.jpg', opacity: 0.16 },

  // Overland Transit & Logistics
  { label: 'Freight Truck Convoy (Photo)', category: 'Overland', url: '/images/photo_overland_truck_convoy.jpg', opacity: 0.16 },
  { label: 'Border Customs Terminal (Photo)', category: 'Overland', url: '/images/photo_border_customs_terminal.jpg', opacity: 0.16 },
  { label: 'Intermodal Freight Train (Photo)', category: 'Overland', url: '/images/photo_intermodal_freight_train.jpg', opacity: 0.16 },
  { label: 'Mountain Highway Transit', category: 'Overland', url: '/images/mountain_transit_highway_bg.jpg', opacity: 0.15 },
  { label: 'Modern Cargo Fleet', category: 'Overland', url: '/images/modern_cargo_convoy.jpg', opacity: 0.15 },
  { label: 'Afghan Transit Pass', category: 'Overland', url: '/images/afghan_cargo_fleet_pass.jpg', opacity: 0.15 },
  { label: 'Inland Dry Port Hub', category: 'Overland', url: '/images/border_dry_port.jpg', opacity: 0.15 },
  { label: 'Cargo Convoy Fleet (Photo)', category: 'Overland', url: '/images/watermark-photos/cargo-convoy.jpg', opacity: 0.16 },
  { label: 'Trans-Asian Rail Corridor (Photo)', category: 'Overland', url: '/images/watermark-photos/rail-corridor.jpg', opacity: 0.16 },
  { label: 'Desert Horizon Route (Photo)', category: 'Overland', url: '/images/watermark-photos/horizon-route.jpg', opacity: 0.16 },

  // Maritime & Ocean Shipping
  { label: 'Ocean Container Ship (Photo)', category: 'Maritime', url: '/images/photo_ocean_containership.jpg', opacity: 0.16 },
  { label: 'Harbor Gantry Terminal (Photo)', category: 'Maritime', url: '/images/photo_harbor_cranes_port.jpg', opacity: 0.16 },
  { label: 'Deep Sea Cargo Vessel', category: 'Maritime', url: '/images/maritime_port_cargo_ship.jpg', opacity: 0.15 },
  { label: 'Container Port Sunset', category: 'Maritime', url: '/images/container_terminal_sunset.jpg', opacity: 0.15 },
  { label: 'Ocean Passage Vessel (Photo)', category: 'Maritime', url: '/images/watermark-photos/ocean-passage.jpg', opacity: 0.16 },
  { label: 'Harbor Morning Terminal (Photo)', category: 'Maritime', url: '/images/watermark-photos/harbor-morning.jpg', opacity: 0.16 },
  { label: 'Coastal Freight Haul (Photo)', category: 'Maritime', url: '/images/watermark-photos/coastal-freight.jpg', opacity: 0.16 },
  { label: 'Container Port Gantry (Photo)', category: 'Maritime', url: '/images/watermark-photos/container-port.jpg', opacity: 0.16 },
  { label: 'Deep Blue Sea Shipping (Photo)', category: 'Maritime', url: '/images/watermark-photos/deep-blue.jpg', opacity: 0.16 },
  { label: 'Island Channel Route (Photo)', category: 'Maritime', url: '/images/watermark-photos/island-channel.jpg', opacity: 0.16 },
  { label: 'Lighthouse Harbor Bay (Photo)', category: 'Maritime', url: '/images/watermark-photos/lighthouse-bay.jpg', opacity: 0.16 },
  { label: 'Sunset Anchorage Harbor (Photo)', category: 'Maritime', url: '/images/watermark-photos/sunset-anchorage.jpg', opacity: 0.16 },

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

// 3. Realistic Logistics & Multi-Modal Transport Watermarks
export const CLASSIC_BACKGROUNDS: DocumentBackground[] = [
  ...BASE_BACKGROUNDS,
  { label: 'Overland Heavy Cargo (Photo)', category: 'Classic', url: '/images/photo_overland_truck_heavy.jpg', opacity: 0.16 },
  { label: 'Maritime Container Vessel (Photo)', category: 'Classic', url: '/images/photo_maritime_container_vessel.jpg', opacity: 0.16 },
  { label: 'Aviation Cargo Freighter (Photo)', category: 'Classic', url: '/images/photo_aviation_cargo_aircraft.jpg', opacity: 0.16 },
]

// 4. Combined Master Document Backgrounds Catalog
export const DOCUMENT_BACKGROUNDS: DocumentBackground[] = [
  ...BASE_BACKGROUNDS,
  ...PHOTO_BACKGROUNDS,
  ...artwork,
  { label: 'Overland Heavy Cargo (Photo)', category: 'Classic', url: '/images/photo_overland_truck_heavy.jpg', opacity: 0.16 },
  { label: 'Maritime Container Vessel (Photo)', category: 'Classic', url: '/images/photo_maritime_container_vessel.jpg', opacity: 0.16 },
  { label: 'Aviation Cargo Freighter (Photo)', category: 'Classic', url: '/images/photo_aviation_cargo_aircraft.jpg', opacity: 0.16 },
]
