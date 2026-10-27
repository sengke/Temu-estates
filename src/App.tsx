import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Search, MapPin, Bed, Bath, Maximize2, ShieldCheck, 
  Crown, Phone, MessageSquare, Plus, Trash2, Edit3, Eye, Send, ArrowUp, ArrowDown, 
  CheckCircle, Lock, X, Upload, Camera, Filter, ArrowRight,
  DollarSign, Check, SlidersHorizontal, RefreshCw, AlertTriangle, Mail,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Sparkles, Flower2, Calendar
} from 'lucide-react';

// Exchange rate constants: USD_TO_ETB_RATE is the legacy static fallback. The live rate is
// fetched every 6 hours from a public exchange-rate source (CBE-compatible) and cached with
// the date/time it was last updated. Starting rate shown until the first successful sync.
const USD_TO_ETB_RATE = 120;
const STARTING_USD_TO_ETB_RATE = 163.00;
const RATE_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // auto-refresh every 6 hours
const RATE_STORAGE_KEY = 'temu_estates_rate_v1';

// Agent contact line shared by both WhatsApp and Telegram
const AGENT_PHONE_INTL = '251990272812';

// Pre-mapped location coordinates for quick Addis Ababa neighborhood match
const ADDIS_NEIGHBORHOODS = {
  'bole atlas': { lat: 8.9984, lng: 38.7842 },
  'bole medhanialem': { lat: 8.9942, lng: 38.7885 },
  'kazanchis': { lat: 9.0210, lng: 38.7663 },
  'old airport': { lat: 8.9723, lng: 38.7391 },
  'sarbet': { lat: 8.9895, lng: 38.7360 },
  'cmc': { lat: 9.0195, lng: 38.8310 },
  'megenagna': { lat: 9.0205, lng: 38.8020 },
  'piassa': { lat: 9.0345, lng: 38.7512 },
  'gotera': { lat: 8.9780, lng: 38.7610 },
  'meskel square': { lat: 9.0105, lng: 38.7615 },
  'bisrate gabriel': { lat: 8.9760, lng: 38.7290 },
  'ayat': { lat: 9.0250, lng: 38.8680 },
  'gerji': { lat: 8.9950, lng: 38.8100 },
  'lebu': { lat: 8.9530, lng: 38.7180 },
  'summit': { lat: 9.0310, lng: 38.8450 }
};

// SVG Adey Abeba (Ethiopian New Year Yellow Flower) Icon Component
const AdeyAbebaIcon = ({ className = "w-4 h-4 text-amber-400" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    {/* Flower Petals */}
    <g fill="#F59E0B" opacity="0.95">
      <ellipse cx="50" cy="22" rx="10" ry="20" />
      <ellipse cx="50" cy="78" rx="10" ry="20" />
      <ellipse cx="22" cy="50" rx="20" ry="10" />
      <ellipse cx="78" cy="50" rx="20" ry="10" />
      <ellipse cx="30" cy="30" rx="11" ry="18" transform="rotate(-45 30 30)" />
      <ellipse cx="70" cy="70" rx="11" ry="18" transform="rotate(-45 70 70)" />
      <ellipse cx="70" cy="30" rx="11" ry="18" transform="rotate(45 70 30)" />
      <ellipse cx="30" cy="70" rx="11" ry="18" transform="rotate(45 30 70)" />
    </g>
    {/* Flower Center */}
    <circle cx="50" cy="50" r="12" fill="#78350F" />
    <circle cx="50" cy="50" r="8" fill="#FBBF24" />
  </svg>
);

// High quality photo pools for each area
const COMPOUND_PHOTOS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
];

const LIVING_PHOTOS = [
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
];

const KITCHEN_PHOTOS = [
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80'
];

const BEDROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80'
];

const BATHROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80'
];

// Commercial property photo pool (offices, retail, showrooms, warehouses)
const COMMERCIAL_PHOTOS = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80'
];

const makeCommercialPhotos = (idx) => Array.from({ length: 7 }, (_, i) => COMMERCIAL_PHOTOS[(idx + i) % COMMERCIAL_PHOTOS.length]);

// Initial Commercial Listings (4 listings with 7 pictures each) — fully managed from the admin dashboard
const COMMERCIAL_PROPERTIES = [
  {
    id: 'comm-1', title: 'Bole Atlas Premium Office Floor', priceETB: 95000000, priceType: 'sale',
    status: 'AVAILABLE', locationName: 'Bole Atlas', lat: 8.9984, lng: 38.7842,
    bedrooms: 0, bathrooms: 4, areaSqFt: 640, type: 'Office Space', category: 'commercial', isVIP: false,
    description: 'Grade-A office floor in Bole Atlas with private elevators, backup generator, dedicated parking, and 24/7 security.',
    images: makeCommercialPhotos(0)
  },
  {
    id: 'comm-2', title: 'Kazanchis Corporate Headquarters Building', priceETB: 320000000, priceType: 'sale',
    status: 'AVAILABLE', locationName: 'Kazanchis', lat: 9.0210, lng: 38.7663,
    bedrooms: 0, bathrooms: 10, areaSqFt: 1450, type: 'Office Building', category: 'commercial', isVIP: true,
    description: 'Stand-alone corporate building near the UN Economic Commission with conference facilities, parking, generator backup, and fiber-ready infrastructure.',
    images: makeCommercialPhotos(2)
  },
  {
    id: 'comm-3', title: 'Megenagna Retail Shopfront', priceETB: 450000, priceType: 'rent',
    status: 'AVAILABLE', locationName: 'Megenagna', lat: 9.0205, lng: 38.8020,
    bedrooms: 0, bathrooms: 2, areaSqFt: 310, type: 'Shop', category: 'commercial', isVIP: false,
    description: 'High-visibility ground-floor shop with glass frontage, storage room, and strong foot traffic. Suitable for retail or franchise businesses.',
    images: makeCommercialPhotos(5)
  },
  {
    id: 'comm-4', title: 'Gerji Logistics Warehouse & Distribution Hub', priceETB: 780000, priceType: 'rent',
    status: 'AVAILABLE', locationName: 'Gerji', lat: 8.9950, lng: 38.8100,
    bedrooms: 0, bathrooms: 3, areaSqFt: 1200, type: 'Warehouse / Godown', category: 'commercial', isVIP: false,
    description: 'Warehouse with loading access, open storage space, office mezzanine, and truck access for distribution and light assembly.',
    images: makeCommercialPhotos(8)
  },
  {
    id: 'comm-5', title: 'Piassa Flexible Retail Stall', priceETB: 65000, priceType: 'rent',
    status: 'AVAILABLE', locationName: 'Piassa', lat: 9.0345, lng: 38.7512,
    bedrooms: 0, bathrooms: 1, areaSqFt: 35, type: 'Stall', category: 'commercial', isVIP: false,
    description: 'Compact retail stall in a busy commercial area, suitable for accessories, small goods, and takeaway retail.',
    images: makeCommercialPhotos(1)
  },
  {
    id: 'comm-6', title: 'Meskel Square Multipurpose Event Hall', priceETB: 1250000, priceType: 'rent',
    status: 'AVAILABLE', locationName: 'Meskel Square', lat: 9.0105, lng: 38.7615,
    bedrooms: 0, bathrooms: 4, areaSqFt: 900, type: 'Hall', category: 'commercial', isVIP: false,
    description: 'Spacious multipurpose hall for corporate events, trainings, celebrations, and exhibitions, with convenient central access.',
    images: makeCommercialPhotos(3)
  },
  {
    id: 'comm-7', title: 'CMC Industrial Storage Godown', priceETB: 42000000, priceType: 'sale',
    status: 'AVAILABLE', locationName: 'CMC', lat: 9.0195, lng: 38.8310,
    bedrooms: 0, bathrooms: 2, areaSqFt: 1100, type: 'Godown', category: 'commercial', isVIP: false,
    description: 'Practical industrial storage property with a broad access entrance and flexible floor space for stock, equipment, or wholesale goods.',
    images: makeCommercialPhotos(6)
  },
  {
    id: 'comm-8', title: 'Bole Atlas Boutique Retail Unit', priceETB: 380000, priceType: 'rent',
    status: 'AVAILABLE', locationName: 'Bole Atlas', lat: 8.9984, lng: 38.7842,
    bedrooms: 0, bathrooms: 1, areaSqFt: 180, type: 'Retail Shop', category: 'commercial', isVIP: false,
    description: 'Neat street-facing retail unit for a boutique, salon, office reception, or specialty store.',
    images: makeCommercialPhotos(7)
  },
  {
    id: 'comm-9', title: 'Megenagna Commercial Showroom', priceETB: 68000000, priceType: 'sale',
    status: 'AVAILABLE', locationName: 'Megenagna', lat: 9.0205, lng: 38.8020,
    bedrooms: 0, bathrooms: 2, areaSqFt: 520, type: 'Showroom', category: 'commercial', isVIP: true,
    description: 'Bright commercial showroom with wide display frontage and space for customer service, product display, or business operations.',
    images: makeCommercialPhotos(9)
  },
  {
    id: 'comm-10', title: 'Summit Light-Industrial Warehouse', priceETB: 920000, priceType: 'rent',
    status: 'AVAILABLE', locationName: 'Summit', lat: 9.0310, lng: 38.8450,
    bedrooms: 0, bathrooms: 2, areaSqFt: 1500, type: 'Warehouse', category: 'commercial', isVIP: false,
    description: 'Large flexible warehouse suitable for stock holding, wholesale operations, and light industrial use with vehicle access.',
    images: makeCommercialPhotos(10)
  }
];

// Helper to construct complete 5-area photos
const makePhotos = (idx) => [
  COMPOUND_PHOTOS[idx % COMPOUND_PHOTOS.length],
  LIVING_PHOTOS[idx % LIVING_PHOTOS.length],
  KITCHEN_PHOTOS[idx % KITCHEN_PHOTOS.length],
  BEDROOM_PHOTOS[idx % BEDROOM_PHOTOS.length],
  BATHROOM_PHOTOS[idx % BATHROOM_PHOTOS.length]
];

// Initial Mock Property Data extended to 30 listings
const INITIAL_PROPERTIES = [
  {
    id: 'prop-1',
    title: 'The Grand Imperial Penthouse in Bole Atlas',
    priceETB: 102000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Bole Atlas',
    lat: 8.9984,
    lng: 38.7842,
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 480,
    type: 'Penthouse',
    isVIP: true,
    description: 'An architectural masterpiece in Addis Ababa featuring panoramic skyline views, private elevator access, 24/7 elite security, and smart home automation.',
    images: makePhotos(0)
  },
  {
    id: 'prop-2',
    title: 'Old Airport Diplomatic Villa & Green Compound',
    priceETB: 144000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Old Airport',
    lat: 8.9723,
    lng: 38.7391,
    bedrooms: 6,
    bathrooms: 7,
    areaSqFt: 850,
    type: 'Villa',
    isVIP: true,
    description: 'Expansive ambassadorial estate with manicured compound gardens, high boundary wall with electric security wire, guest house, and swimming pool.',
    images: makePhotos(1)
  },
  {
    id: 'prop-3',
    title: 'Diplomatic Executive Monthly Residence in Kazanchis',
    priceETB: 420000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Kazanchis',
    lat: 9.0210,
    lng: 38.7663,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 220,
    type: 'Rentals',
    isVIP: false,
    description: 'Fully furnished 3 bedroom luxury residence customized for ambassadors, high-net-worth investors, and executive leadership near UN Economic Commission.',
    images: makePhotos(2)
  },
  {
    id: 'prop-4',
    title: 'CMC Horizon Modern Villa',
    priceETB: 74400000,
    priceType: 'sale',
    status: 'RESERVED',
    locationName: 'CMC',
    lat: 9.0195,
    lng: 38.8310,
    bedrooms: 5,
    bathrooms: 4,
    areaSqFt: 380,
    type: 'Villa',
    isVIP: false,
    description: 'Contemporary architectural masterpiece with floor-to-ceiling modern glass paneling, smart home system, and generous multi-car parking space.',
    images: makePhotos(3)
  },
  {
    id: 'prop-5',
    title: 'Bole Medhanialem Executive Sky Suite Airbnb',
    priceETB: 18000,
    priceType: 'airbnb',
    status: 'AVAILABLE',
    locationName: 'Bole Medhanialem',
    lat: 8.9942,
    lng: 38.7885,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 130,
    type: 'Airbnb',
    isVIP: true,
    description: 'Luxury turnkey serviced Airbnb apartment located steps away from Bole Medhanialem Church. Includes high-speed Wi-Fi, daily housekeeping, and concierge.',
    images: makePhotos(4)
  },
  {
    id: 'prop-6',
    title: 'Sarbet Own Compound Luxury Estate',
    priceETB: 174000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Sarbet',
    lat: 8.9895,
    lng: 38.7360,
    bedrooms: 7,
    bathrooms: 8,
    areaSqFt: 920,
    type: 'Own Compound',
    isVIP: true,
    description: 'Private gated mansion with expansive green garden, guest quarters, standby generator, underground water tank, and multi-vehicle garage.',
    images: makePhotos(5)
  },
  {
    id: 'prop-7',
    title: 'Meskel Square Duplex Resell Apartment',
    priceETB: 45600000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Meskel Square',
    lat: 9.0105,
    lng: 38.7615,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 210,
    type: 'Resell',
    isVIP: false,
    description: 'Prime central resale apartment unit offering open-concept living space, renovated kitchen, and sweeping views over Meskel Square.',
    images: makePhotos(6)
  },
  {
    id: 'prop-8',
    title: 'Bisrate Gabriel Private Compound Villa',
    priceETB: 106800000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Bisrate Gabriel',
    lat: 8.9760,
    lng: 38.7290,
    bedrooms: 5,
    bathrooms: 5,
    areaSqFt: 550,
    type: 'Own Compound',
    isVIP: false,
    description: 'Elegant standalone villa in quiet residential quarter. Features expansive terrace, dual kitchens, service rooms, and serene courtyard gardens.',
    images: makePhotos(7)
  },
  {
    id: 'prop-9',
    title: 'Bole Rwanda Luxury Nightly Airbnb Suite',
    priceETB: 24000,
    priceType: 'airbnb',
    status: 'AVAILABLE',
    locationName: 'Bole Atlas',
    lat: 8.9980,
    lng: 38.7830,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 140,
    type: 'Airbnb',
    isVIP: true,
    description: 'Boutique stay in Bole Rwanda. Smart lock entry, jacuzzi bathroom, high-speed fiber internet and 24/7 security.',
    images: makePhotos(8)
  },
  {
    id: 'prop-10',
    title: 'Old Airport Diplomatic Monthly Rental Haven',
    priceETB: 380000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Old Airport',
    lat: 8.9723,
    lng: 38.7391,
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 320,
    type: 'Rentals',
    isVIP: false,
    description: 'Long term luxury family rental with high boundary walls, backup water systems, and standby generator.',
    images: makePhotos(9)
  },
  {
    id: 'prop-11',
    title: 'Kazanchis UN Heights Sky Penthouse',
    priceETB: 125000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Kazanchis',
    lat: 9.0210,
    lng: 38.7663,
    bedrooms: 5,
    bathrooms: 6,
    areaSqFt: 520,
    type: 'Penthouse',
    isVIP: true,
    description: 'Top floor penthouse with panoramic city skylines, double height ceilings, luxury Italian kitchen, and personal gym.',
    images: makePhotos(10)
  },
  {
    id: 'prop-12',
    title: 'Ayat Zone 3 Modern Compound Villa',
    priceETB: 68000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Ayat',
    lat: 9.0250,
    lng: 38.8680,
    bedrooms: 5,
    bathrooms: 5,
    areaSqFt: 420,
    type: 'Villa',
    isVIP: false,
    description: 'Spacious 5 bedroom villa in Ayat with landscaped front garden, multi-car driveway, and backup power supply.',
    images: makePhotos(11)
  },
  {
    id: 'prop-13',
    title: 'Gerji Imperial Park Monthly Residence',
    priceETB: 280000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Gerji',
    lat: 8.9950,
    lng: 38.8100,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 210,
    type: 'Rentals',
    isVIP: false,
    description: 'Spacious furnished residence available for long term rent at monthly rate. Located in quiet Gerji neighborhood.',
    images: makePhotos(12)
  },
  {
    id: 'prop-14',
    title: 'Bole Brass Nightly Luxury Studio Airbnb',
    priceETB: 12000,
    priceType: 'airbnb',
    status: 'AVAILABLE',
    locationName: 'Bole Medhanialem',
    lat: 8.9942,
    lng: 38.7885,
    bedrooms: 0,
    bathrooms: 1,
    areaSqFt: 85,
    type: 'Airbnb',
    isVIP: false,
    description: 'Stylish studio condo in Bole Brass center. Near fine dining restaurants and international airport.',
    images: makePhotos(13)
  },
  {
    id: 'prop-15',
    title: 'CMC Summit Green Own Compound Villa',
    priceETB: 115000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Summit',
    lat: 9.0310,
    lng: 38.8450,
    bedrooms: 6,
    bathrooms: 6,
    areaSqFt: 600,
    type: 'Own Compound',
    isVIP: true,
    description: 'Gated compound mansion with mature gardens, perimeter surveillance, guard house, and dual parking garages.',
    images: makePhotos(14)
  },
  {
    id: 'prop-16',
    title: 'Megenagna Resell Horizon Duplex',
    priceETB: 39500000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Megenagna',
    lat: 9.0205,
    lng: 38.8020,
    bedrooms: 3,
    bathrooms: 2,
    areaSqFt: 180,
    type: 'Resell',
    isVIP: false,
    description: 'Newly renovated duplex apartment available for resale. High floor with excelente natural light and parking space.',
    images: makePhotos(15)
  },
  {
    id: 'prop-17',
    title: 'Piassa Historical Heritage View Apartment',
    priceETB: 32000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Piassa',
    lat: 9.0345,
    lng: 38.7512,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 140,
    type: 'Apartment',
    isVIP: false,
    description: 'Modern apartment in Piassa overlooking iconic municipal landmarks, equipped with modern kitchen and security.',
    images: makePhotos(16)
  },
  {
    id: 'prop-18',
    title: 'Lebu Royal Residence Monthly Lease',
    priceETB: 220000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Lebu',
    lat: 8.9530,
    lng: 38.7180,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 200,
    type: 'Rentals',
    isVIP: false,
    description: 'Quiet family home in Lebu for monthly rent. Features high boundary fence, garden patio, and generator.',
    images: makePhotos(17)
  },
  {
    id: 'prop-19',
    title: 'Gotera Towers Executive Nightly Airbnb',
    priceETB: 15000,
    priceType: 'airbnb',
    status: 'AVAILABLE',
    locationName: 'Gotera',
    lat: 8.9780,
    lng: 38.7610,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 120,
    type: 'Airbnb',
    isVIP: false,
    description: 'Fully serviced 2-bedroom Airbnb stay. Complete with elevator access and mountain view.',
    images: makePhotos(18)
  },
  {
    id: 'prop-20',
    title: 'Old Airport Ambassador Sky Penthouse',
    priceETB: 160000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Old Airport',
    lat: 8.9723,
    lng: 38.7391,
    bedrooms: 5,
    bathrooms: 6,
    areaSqFt: 580,
    type: 'Penthouse',
    isVIP: true,
    description: 'Exclusive Old Airport top-tier penthouse featuring private spa, wrap-around balcony, and dedicated security detailing.',
    images: makePhotos(19)
  },
  {
    id: 'prop-21',
    title: 'Sarbet Embassy Quarter Monthly Villa',
    priceETB: 500000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Sarbet',
    lat: 8.9895,
    lng: 38.7360,
    bedrooms: 5,
    bathrooms: 6,
    areaSqFt: 480,
    type: 'Rentals',
    isVIP: true,
    description: 'Prestigious Sarbet residence for long-term lease. Suitable for embassy staff or corporate headquarters.',
    images: makePhotos(20)
  },
  {
    id: 'prop-22',
    title: 'Bole Japanese Embassy Nightly Airbnb Villa',
    priceETB: 35000,
    priceType: 'airbnb',
    status: 'AVAILABLE',
    locationName: 'Bole Atlas',
    lat: 8.9984,
    lng: 38.7842,
    bedrooms: 3,
    bathrooms: 4,
    areaSqFt: 260,
    type: 'Airbnb',
    isVIP: true,
    description: 'Luxury gated mini-villa Airbnb. Includes private courtyard garden, full security staff, and chef service option.',
    images: makePhotos(21)
  },
  {
    id: 'prop-23',
    title: 'Summit Hilltop Glass Modern Villa',
    priceETB: 89000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Summit',
    lat: 9.0310,
    lng: 38.8450,
    bedrooms: 5,
    bathrooms: 5,
    areaSqFt: 450,
    type: 'Villa',
    isVIP: false,
    description: 'Contemporary architectural home with hilltop views across Summit. Multi-car parking and landscaped green lawns.',
    images: makePhotos(22)
  },
  {
    id: 'prop-24',
    title: 'Kazanchis Financial District Resell Flat',
    priceETB: 38000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Kazanchis',
    lat: 9.0210,
    lng: 38.7663,
    bedrooms: 1,
    bathrooms: 2,
    areaSqFt: 135,
    type: 'Resell',
    isVIP: false,
    description: 'High return resale apartment unit right in Kazanchis banking hub. Ideal for short term rental investors.',
    images: makePhotos(23)
  },
  {
    id: 'prop-25',
    title: 'Gerji Sunshine Village Compound Residence',
    priceETB: 98000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Gerji',
    lat: 8.9950,
    lng: 38.8100,
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 360,
    type: 'Own Compound',
    isVIP: false,
    description: 'Gated family estate in Gerji with private garden, service quarters, underground water reservoir, and dual gates.',
    images: makePhotos(24)
  },
  {
    id: 'prop-26',
    title: 'Bole Medhanialem Presidential Monthly Lease',
    priceETB: 600000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Bole Medhanialem',
    lat: 8.9942,
    lng: 38.7885,
    bedrooms: 4,
    bathrooms: 5,
    areaSqFt: 350,
    type: 'Rentals',
    isVIP: true,
    description: 'Fully serviced monthly rental suite located in the diplomatic heart of Bole Medhanialem.',
    images: makePhotos(25)
  },
  {
    id: 'prop-27',
    title: 'Meskel Flower District Nightly Airbnb Haven',
    priceETB: 20000,
    priceType: 'airbnb',
    status: 'AVAILABLE',
    locationName: 'Meskel Square',
    lat: 9.0105,
    lng: 38.7615,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 125,
    type: 'Airbnb',
    isVIP: false,
    description: 'Cozy night-to-night stay near Meskel Flower area. Features underground parking, gym access, and continuous generator backup.',
    images: makePhotos(26)
  },
  {
    id: 'prop-28',
    title: 'Ayat Grand Avenue Penthouse Sky Suite',
    priceETB: 88000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Ayat',
    lat: 9.0250,
    lng: 38.8680,
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 390,
    type: 'Penthouse',
    isVIP: false,
    description: 'Spacious top-floor penthouse with unobstructed sunrise views over Ayat. Smart lighting and private elevator access.',
    images: makePhotos(27)
  },
  {
    id: 'prop-29',
    title: 'Bisrate Gabriel Executive Monthly Residence',
    priceETB: 310000,
    priceType: 'rent',
    status: 'AVAILABLE',
    locationName: 'Bisrate Gabriel',
    lat: 8.9760,
    lng: 38.7290,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 230,
    type: 'Rentals',
    isVIP: false,
    description: 'Generous 3-bedroom apartment for long term lease in serene Bisrate Gabriel.',
    images: makePhotos(28)
  },
  {
    id: 'prop-30',
    title: 'Bole Atlas Crown Jewel VIP Mansion',
    priceETB: 210000000,
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: 'Bole Atlas',
    lat: 8.9984,
    lng: 38.7842,
    bedrooms: 8,
    bathrooms: 8,
    areaSqFt: 980,
    type: 'Own Compound',
    isVIP: true,
    description: 'The pinnacle of luxury in Bole Atlas. Featuring personal indoor pool, private security post, subterranean garage for 8 vehicles, and staff quarters.',
    images: makePhotos(29)
  }
];

// Merge residential + commercial seed data, tagging a default listing category
const ALL_INITIAL_PROPERTIES = [...INITIAL_PROPERTIES, ...COMMERCIAL_PROPERTIES].map(p => ({
  ...p,
  category: p.category || 'residential'
}));

// ---------------------------------------------------------------------------
// Client-side image optimization pipeline (runs in the admin browser, no backend):
// - subtle natural enhancement only (brightness/contrast/saturation, no color shifts)
// - resize to max 1920px width and convert PNG/JPEG to WebP at ~150-300KB
// - auto-generate a 640px-wide thumbnail at ~50-100KB for cards and previews
// ---------------------------------------------------------------------------
const MAX_PROPERTY_IMAGES = 12;

const optimizeImageFile = (file) => new Promise((resolve, reject) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    reject(new Error('Unsupported file type'));
    return;
  }
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onloadend = () => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      try {
        const drawTo = (targetWidth) => {
          const scaleFactor = Math.min(1, targetWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scaleFactor));
          canvas.height = Math.max(1, Math.round(img.height * scaleFactor));
          const ctx = canvas.getContext('2d');
          // Subtle, natural enhancement only — improves brightness, contrast and
          // clarity without changing the true appearance of the property.
          ctx.filter = 'brightness(1.04) contrast(1.05) saturate(1.02)';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas;
        };

        const toWebpDataUrl = (canvas, maxBytes) => new Promise((done, fail) => {
          let quality = 0.85;
          const attempt = () => {
            canvas.toBlob((blob) => {
              if (!blob) { fail(new Error('WebP encoding failed')); return; }
              if (blob.size > maxBytes && quality > 0.4) {
                quality -= 0.1;
                attempt();
                return;
              }
              const blobReader = new FileReader();
              blobReader.onloadend = () => done(blobReader.result);
              blobReader.onerror = fail;
              blobReader.readAsDataURL(blob);
            }, 'image/webp', quality);
          };
          attempt();
        });

        const fullCanvas = drawTo(1920);
        const thumbCanvas = drawTo(Math.min(640, img.width));
        Promise.all([
          toWebpDataUrl(fullCanvas, 300 * 1024),
          toWebpDataUrl(thumbCanvas, 100 * 1024)
        ]).then(([full, thumb]) => resolve({ full, thumb })).catch(reject);
      } catch (err) {
        reject(err);
      }
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// Reusable drag-and-drop photo manager for the admin dashboard (max 12 images).
// The first photo in the list is automatically used as the main/featured image.
const PhotoManager = ({ photos, thumbs = [], onChange, label, max = MAX_PROPERTY_IMAGES }) => {
  const dragIndexRef = React.useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const remaining = Math.max(0, max - photos.length);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type && f.type.startsWith('image/')).slice(0, remaining);
    if (files.length === 0) return;
    setIsUploading(true);
    const results = await Promise.all(files.map(f => optimizeImageFile(f).catch(() => null)));
    const nextPhotos = [...photos];
    const nextThumbs = [...thumbs];
    results.forEach(res => {
      if (res) {
        nextPhotos.push(res.full);
        nextThumbs.push(res.thumb);
      }
    });
    setIsUploading(false);
    onChange(nextPhotos, nextThumbs);
  };

  const handleDrop = (targetIndex) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === targetIndex) return;
    const nextPhotos = [...photos];
    const nextThumbs = [...thumbs];
    const [movedPhoto] = nextPhotos.splice(from, 1);
    const [movedThumb] = nextThumbs.splice(from, 1);
    nextPhotos.splice(targetIndex, 0, movedPhoto);
    nextThumbs.splice(targetIndex, 0, movedThumb);
    onChange(nextPhotos, nextThumbs);
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index), thumbs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">{label}</label>}
      <div className="flex flex-wrap gap-3">
        {photos.map((photo, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => { dragIndexRef.current = idx; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-500/40 cursor-move"
          >
            <img src={(thumbs && thumbs[idx]) || photo} alt={`Property view ${idx + 1}`} className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 bg-amber-500 text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Featured</span>
            )}
            <span className="absolute bottom-1 left-1 bg-black/80 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded">{idx + 1}</span>
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              className="absolute top-1 right-1 bg-black/80 text-red-400 p-0.5 rounded hover:text-red-300"
              title="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < max && (
          <label className="w-24 h-24 border border-dashed border-neutral-600 hover:border-amber-400 rounded-xl flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-amber-400 transition text-center">
            <Camera className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-semibold px-1">{isUploading ? 'Optimizing…' : 'Upload Photo'}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <p className="text-[10px] text-neutral-500">
        {photos.length}/{max} photos • Uploaded images are auto-optimized (WebP, max 1920px, ~150–300KB) with a ~50–100KB thumbnail. Drag photos to reorder — the first photo is the main/featured image.
      </p>
    </div>
  );
};

export default function App() {
  const [properties, setProperties] = useState(() => {
    try {
      const saved = localStorage.getItem('temu_estates_properties_v7');
      if (!saved) return ALL_INITIAL_PROPERTIES;
      const savedProperties = JSON.parse(saved);
      // Add the six new commercial demo listings to existing browser-saved inventory once.
      const missingCommercial = COMMERCIAL_PROPERTIES.filter(seed =>
        ['comm-5', 'comm-6', 'comm-7', 'comm-8', 'comm-9', 'comm-10'].includes(seed.id) &&
        !savedProperties.some(existing => existing.id === seed.id)
      );
      return [...missingCommercial, ...savedProperties];
    } catch (e) {
      return ALL_INITIAL_PROPERTIES;
    }
  });

  // ---- Live USD → ETB exchange-rate state (syncs every 6 hours) ----
  const [exchangeRate, setExchangeRate] = useState(() => {
    try {
      const saved = localStorage.getItem(RATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.rate) return parsed;
      }
    } catch (e) { /* fall through to starting rate */ }
    return { rate: STARTING_USD_TO_ETB_RATE, updatedAt: null, source: 'Starting rate (not yet synced)' };
  });
  const [rateSyncing, setRateSyncing] = useState(false);
  const [rateError, setRateError] = useState('');

  const fetchExchangeRate = async () => {
    setRateSyncing(true);
    setRateError('');
    try {
      // Primary: open ExchangeRate-API (daily CBE-compatible mid-market rate)
      // Fallback: fawazahmed0 currency API on jsDelivr CDN
      let fetchedRate = null;
      let source = '';
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && data.rates.ETB) {
            fetchedRate = data.rates.ETB;
            source = 'ExchangeRate-API (CBE-compatible daily rate)';
          }
        }
      } catch (e) { /* try fallback */ }
      if (!fetchedRate) {
        const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.usd && data.usd.etb) {
            fetchedRate = data.usd.etb;
            source = 'Currency API (CDN fallback)';
          }
        }
      }
      if (!fetchedRate) throw new Error('Exchange rate source unavailable');
      const next = { rate: fetchedRate, updatedAt: new Date().toISOString(), source };
      setExchangeRate(next);
      try { localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    } catch (err) {
      // Source unavailable: keep the last successfully fetched rate and its timestamp
      setRateError('CBE rate source unavailable — showing last synced rate.');
    } finally {
      setRateSyncing(false);
    }
  };

  // Fetch immediately on load, then re-sync every 6 hours
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, RATE_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const [activeTab, setActiveTab] = useState('browse');
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Global Currency Preference State: 'ETB' (Default) or 'USD'
  const [currency, setCurrency] = useState('ETB');

  // Lightbox & Zoom States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Hero Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterBedrooms, setFilterBedrooms] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterVIPOnly, setFilterVIPOnly] = useState(false);
  const [filterCategory, setFilterCategory] = useState('residential'); // 'residential' | 'commercial' | ''

  // VIP Auth States
  const [isVIPAuthenticated, setIsVIPAuthenticated] = useState(false);
  const [vipEmail, setVipEmail] = useState('');
  const [vipPassword, setVipPassword] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [vipAuthError, setVipAuthError] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyInquiry: 'General Inquiry',
    message: ''
  });
  const [formSent, setFormSent] = useState(false);

  // Photo slots object state for mandatory property areas
  const [categorizedPhotos, setCategorizedPhotos] = useState({
    compound: '',
    sitting: '',
    kitchen: '',
    bedroom: '',
    toilet: ''
  });

  // Admin New Property Form State
  const [newProp, setNewProp] = useState({
    title: '',
    priceETB: '',
    priceType: 'sale',
    status: 'AVAILABLE',
    locationName: '',
    lat: 8.9984,
    lng: 38.7842,
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 250,
    type: 'Apartment',
    isVIP: false,
    description: '',
    images: [],
    thumbs: [],
    category: 'residential'
  });

  // Admin editing state for existing listings (full inventory editing)
  const [editingProp, setEditingProp] = useState(null); // holds a full copy of the property being edited

  const startEditProperty = (p) => {
    setEditingProp({
      ...p,
      priceETB: String(p.priceETB),
      bedrooms: String(p.bedrooms),
      bathrooms: String(p.bathrooms),
      areaSqFt: String(p.areaSqFt),
      images: [...(p.images || [])],
      thumbs: [...(p.thumbs || p.images || [])],
      priceType: p.priceType,
      status: p.status,
      isVIP: !!p.isVIP,
      category: p.category || 'residential'
    });
  };

  const handleSaveEdit = () => {
    if (!editingProp) return;
    setProperties(prev => prev.map(p => p.id === editingProp.id ? {
      ...p,
      title: editingProp.title,
      priceETB: parseFloat(editingProp.priceETB) || 0,
      priceType: editingProp.priceType,
      status: editingProp.status,
      locationName: editingProp.locationName,
      bedrooms: parseInt(editingProp.bedrooms) || 0,
      bathrooms: parseInt(editingProp.bathrooms) || 0,
      areaSqFt: parseInt(editingProp.areaSqFt) || 0,
      type: editingProp.type,
      isVIP: editingProp.isVIP,
      category: editingProp.category,
      description: editingProp.description,
      images: editingProp.images,
      thumbs: editingProp.thumbs
    } : p));
    setAdminNotification('Listing updated successfully — photos reordered/optimized and details saved.');
    setTimeout(() => setAdminNotification(''), 4000);
    setEditingProp(null);
  };

  // Reorder a listing up/down directly from the inventory table
  const moveProperty = (id, direction) => {
    setProperties(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const [adminNotification, setAdminNotification] = useState('');

  // Local storage persistence
  useEffect(() => {
    try {
      localStorage.setItem('temu_estates_properties_v7', JSON.stringify(properties));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }, [properties]);

  // Price Formatter Helper — uses the LIVE synced rate (falls back to the starting rate)
  const formatPrice = (priceETB, priceType) => {
    if (!priceETB && priceETB !== 0) return '';
    const numericETB = Number(priceETB);

    if (currency === 'USD') {
      const usdVal = Math.round(numericETB / exchangeRate.rate);
      return `$${usdVal.toLocaleString()} USD`;
    }
    return `${numericETB.toLocaleString()} ETB`;
  };

  // Handle Freeform Manual Neighborhood Input Change
  const handleManualLocationChange = (customLoc) => {
    const cleanKey = customLoc.trim().toLowerCase();
    const matched = ADDIS_NEIGHBORHOODS[cleanKey];

    if (matched) {
      setNewProp(prev => ({
        ...prev,
        locationName: customLoc,
        lat: matched.lat,
        lng: matched.lng
      }));
    } else {
      setNewProp(prev => ({
        ...prev,
        locationName: customLoc
      }));
    }
  };

  // Lightbox Controls
  const openLightbox = (index = 0) => {
    setActiveImageIndex(index);
    setZoomScale(1);
    setIsLightboxOpen(true);
  };

  // Handler for categorized room photo slots upload
  const handleCategorizedPhotoUpload = (categoryKey, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCategorizedPhotos(prev => ({
        ...prev,
        [categoryKey]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // VIP & Admin Login Authentication
  const handleVIPLogin = (e) => {
    e.preventDefault();
    const cleanEmail = vipEmail.trim().toLowerCase();

    if (cleanEmail === 'temu.estate@gmail.com' && vipPassword === 'Admin123!') {
      setIsVIPAuthenticated(true);
      setUserRole('ADMIN');
      setVipAuthError('');
      setActiveTab('admin');
    } else if (cleanEmail.length > 3 && vipPassword.length > 2) {
      if (!newsletterConsent) {
        setVipAuthError('Please consent to promotional emails to proceed as VIP client.');
        return;
      }
      setIsVIPAuthenticated(true);
      setUserRole('CLIENT');
      setVipAuthError('');
      setFilterVIPOnly(true);
      setActiveTab('browse');
    } else {
      setVipAuthError('Invalid email or password credentials.');
    }
  };

  // Create New Property
  const handleAddProperty = (e) => {
    e.preventDefault();
    if (!newProp.title || !newProp.priceETB || !newProp.locationName) {
      return;
    }

    const categoryPhotosList = [
      categorizedPhotos.compound,
      categorizedPhotos.sitting,
      categorizedPhotos.kitchen,
      categorizedPhotos.bedroom,
      categorizedPhotos.toilet
    ].filter(Boolean);

    const allImages = [...categoryPhotosList, ...newProp.images].slice(0, MAX_PROPERTY_IMAGES);
    const allThumbs = [...categoryPhotosList, ...newProp.thumbs].slice(0, MAX_PROPERTY_IMAGES);
    const fallbackPhotos = makePhotos(Math.floor(Math.random() * 10));

    const createdProperty = {
      ...newProp,
      id: (newProp.category === 'commercial' ? 'comm-' : 'prop-') + Date.now(),
      priceETB: parseFloat(newProp.priceETB),
      bedrooms: parseInt(newProp.bedrooms),
      bathrooms: parseInt(newProp.bathrooms),
      areaSqFt: parseInt(newProp.areaSqFt),
      images: allImages.length > 0 ? allImages : fallbackPhotos,
      thumbs: allThumbs.length > 0 ? allThumbs : (allImages.length > 0 ? allImages : fallbackPhotos)
    };

    setProperties([createdProperty, ...properties]);
    setAdminNotification(newProp.category === 'commercial'
      ? 'Commercial listing published successfully — now live on the Commercial page.'
      : 'Addis Ababa Luxury Estate listing published successfully!');
    setTimeout(() => setAdminNotification(''), 4000);

    setCategorizedPhotos({
      compound: '',
      sitting: '',
      kitchen: '',
      bedroom: '',
      toilet: ''
    });

    setNewProp({
      title: '',
      priceETB: '',
      priceType: 'sale',
      status: 'AVAILABLE',
      locationName: '',
      lat: 8.9984,
      lng: 38.7842,
      bedrooms: 3,
      bathrooms: 3,
      areaSqFt: 250,
      type: 'Apartment',
      isVIP: false,
      description: '',
      images: [],
      thumbs: [],
      category: 'residential'
    });
  };

  // Contact Form Submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    const message = [
      'Temu Estates website inquiry',
      `Name: ${contactForm.fullName}`,
      `Email: ${contactForm.email}`,
      `Phone: ${contactForm.phone || 'Not provided'}`,
      `Inquiry: ${contactForm.propertyInquiry}`,
      `Message: ${contactForm.message}`
    ].join('\\n');
    // Telegram opens with a prepared draft; the visitor must press Send in Telegram.
    const telegramUrl = `https://t.me/${AGENT_TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    setFormSent(true);
  };

  // Real-time Status Switching
  const handleStatusChange = (id, newStatus) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  // Complete Property Deletion
  const handleDeleteProperty = (id) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    if (selectedProperty?.id === id) {
      setSelectedProperty(null);
      setActiveTab('browse');
    }
  };

  // Property Filters with Exact Studio to 8 Bedrooms Support
  // (also respects the active listing category: residential vs commercial)
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchesCategory = !filterCategory || (p.category || 'residential') === filterCategory;
      if (!matchesCategory) return false;

      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'ALL' || p.type.toUpperCase() === filterType.toUpperCase();
      const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
      const matchesVIP = !filterVIPOnly || p.isVIP;

      let matchesBeds = true;
      if (filterBedrooms !== 'ALL') {
        const bedTarget = parseInt(filterBedrooms);
        if (bedTarget === 0) {
          // Studio
          matchesBeds = p.bedrooms === 1 || p.bedrooms === 0;
        } else {
          matchesBeds = p.bedrooms >= bedTarget;
        }
      }

      return matchesSearch && matchesType && matchesStatus && matchesVIP && matchesBeds;
    });
  }, [properties, searchTerm, filterType, filterStatus, filterVIPOnly, filterBedrooms, filterCategory]);

  const commercialProperties = useMemo(
    () => properties.filter(p => (p.category || 'residential') === 'commercial'),
    [properties]
  );

  const residentialCount = useMemo(
    () => properties.filter(p => (p.category || 'residential') === 'residential').length,
    [properties]
  );

  const openCategoryPage = (category) => {
    setFilterCategory(category);
    setActiveTab(category === 'commercial' ? 'commercial' : 'browse');
    setSelectedProperty(null);
  };

  // Contact helpers — WhatsApp & Telegram open a direct chat with the agent on
  // the same number, pre-filled with a short professional message naming the property.
  // Note: Telegram cannot pre-fill a message when opening a chat by phone number,
  // so the message is copied to the clipboard and pasted by the visitor.
  const AGENT_TELEGRAM_USERNAME = 'Tete333333'; // agent's Telegram username

  const buildInquiryMessage = (propTitle) =>
    `Hello Temu Estates, I am interested in "${propTitle || 'a property in Addis Ababa'}". Please share availability and next steps.`;

  const openWhatsApp = (propTitle) => {
    const text = encodeURIComponent(buildInquiryMessage(propTitle));
    window.open(`https://wa.me/${AGENT_PHONE_INTL}?text=${text}`, '_blank');
  };

  const openTelegram = async (propTitle) => {
    const message = buildInquiryMessage(propTitle);
    try { await navigator.clipboard.writeText(message); } catch (e) { /* clipboard may be unavailable */ }
    if (AGENT_TELEGRAM_USERNAME) {
      window.open(`https://t.me/${AGENT_TELEGRAM_USERNAME}`, '_blank');
    } else {
      window.open(`https://t.me/+${AGENT_PHONE_INTL}`, '_blank');
    }
  };

  // Shared WhatsApp + Telegram button pair for listing cards and detail pages
  const renderContactButtons = (propTitle, compact = false) => (
    <div className={`flex ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <button
        onClick={(e) => { e.stopPropagation(); openWhatsApp(propTitle); }}
        title="Chat on WhatsApp"
        className={`bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition flex items-center justify-center gap-1.5 font-bold ${compact ? 'p-1.5' : 'p-2'}`}
      >
        <MessageSquare className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {!compact && <span className="text-[10px] uppercase tracking-wider">WhatsApp</span>}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); openTelegram(propTitle); }}
        title="Chat on Telegram — the inquiry message is copied to your clipboard"
        className={`bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition flex items-center justify-center gap-1.5 font-bold ${compact ? 'p-1.5' : 'p-2'}`}
      >
        <Send className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {!compact && <span className="text-[10px] uppercase tracking-wider">Telegram</span>}
      </button>
    </div>
  );

  return (
    <div className="temu-app w-full min-h-screen bg-black text-amber-100 font-sans flex flex-col selection:bg-amber-500 selection:text-black">
      <style>{`
        html, body, #root { width: 100%; max-width: none; min-width: 0; margin: 0; padding: 0; }
        *, *::before, *::after { box-sizing: border-box; }
        body { overflow-x: hidden; }
        .temu-app { width: 100%; max-width: none; min-width: 0; overflow-x: clip; }
        .temu-app main, .temu-app nav, .temu-app footer { min-width: 0; max-width: 100%; }
        .temu-app img, .temu-app input, .temu-app select, .temu-app textarea, .temu-app button { max-width: 100%; }
        .temu-app table { min-width: 680px; }
        @media (max-width: 1023px) {
          .temu-app nav > div:first-of-type { flex-wrap: wrap; row-gap: .75rem; }
          .temu-app nav > div:first-of-type > div:first-child { min-width: 0; flex: 1 1 auto; }
          .temu-app nav > div:first-of-type > div:last-child { flex-wrap: wrap; justify-content: flex-end; }
        }
        @media (max-width: 640px) {
          .temu-app main { padding-left: .75rem; padding-right: .75rem; padding-top: 1rem; padding-bottom: 1.5rem; }
          .temu-app nav { padding-left: .75rem; padding-right: .75rem; }
          .temu-app nav > div:first-of-type > div:first-child span.text-xl { font-size: 1rem; letter-spacing: .08em; }
          .temu-app h1 { overflow-wrap: anywhere; }
          .temu-app h2 { font-size: clamp(1.1rem, 5vw, 1.5rem); }
          .temu-app .grid.grid-cols-3 { grid-template-columns: minmax(0, 1fr); }
          .temu-app .grid.grid-cols-2 { grid-template-columns: minmax(0, 1fr); }
          .temu-app form .flex.gap-2 { flex-wrap: wrap; }
          .temu-app form .flex.gap-2 > input, .temu-app form .flex.gap-2 > select { min-width: 0; width: 100%; }
          .temu-app [class*="p-8"] { padding: 1rem; }
          .temu-app table { min-width: 680px; }
        }
      `}</style>
      
      {/* TOP ACCENT BORDER WITH FLOWER PATTERN */}
      <div className="w-full h-2 bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600"></div>

      {/* NAVIGATION BAR - Full Width Responsive Layout */}
      <nav className="w-full border-b border-amber-500/30 bg-neutral-950/95 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-3.5">
        <div className="w-full flex flex-wrap justify-between items-center gap-y-3">
          
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => { setActiveTab('browse'); setFilterVIPOnly(false); setSelectedProperty(null); }}>
            <div className="relative p-2 bg-gradient-to-br from-amber-400/20 to-amber-600/30 border border-amber-500/40 rounded-xl flex items-center justify-center">
              <AdeyAbebaIcon className="w-8 h-8 text-amber-400 animate-pulse" />
              <div className="absolute -top-1 -right-1">
                <AdeyAbebaIcon className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-widest font-serif">
                  TEMU ESTATES
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-serif font-bold">
                  ተሙ ኤስቴት
                </span>
              </div>
              <span className="text-[9px] tracking-[0.25em] text-amber-500 uppercase font-semibold flex items-center gap-1">
                <AdeyAbebaIcon className="w-2.5 h-2.5 text-amber-400" /> Addis Ababa Real Estate
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs font-bold uppercase tracking-widest">
            <button
              onClick={() => { setActiveTab('browse'); setFilterVIPOnly(false); setFilterType('ALL'); setSelectedProperty(null); }}
              className={`${activeTab === 'browse' && filterType === 'ALL' && !filterVIPOnly ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1`}
            >
              Home
            </button>
            <button
              onClick={() => { setActiveTab('browse'); setFilterType('Rentals'); setSelectedProperty(null); }}
              className={`${filterType === 'Rentals' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1 flex items-center gap-1`}
            >
              Rental
            </button>
            <button
              onClick={() => { setActiveTab('browse'); setFilterType('Airbnb'); setSelectedProperty(null); }}
              className={`${filterType === 'Airbnb' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1 flex items-center gap-1 relative`}
            >
              Airbnb
              <AdeyAbebaIcon className="w-3 h-3 text-amber-400 absolute -top-1.5 -right-2.5" />
            </button>
            <button
              onClick={() => { setActiveTab('browse'); setFilterType('Penthouse'); setSelectedProperty(null); }}
              className={`${filterType === 'Penthouse' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1`}
            >
              Penthouses
            </button>
            <button
              onClick={() => { setActiveTab('browse'); setFilterType('Villa'); setSelectedProperty(null); }}
              className={`${filterType === 'Villa' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1`}
            >
              Villas
            </button>
            <button
              onClick={() => openCategoryPage('commercial')}
              className={`${activeTab === 'commercial' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1`}
            >
              Commercial
            </button>
            <button
              onClick={() => { setActiveTab('contact'); }}
              className={`${activeTab === 'contact' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1`}
            >
              Contact
            </button>
            <button
              onClick={() => { setActiveTab('map'); }}
              className={`${activeTab === 'map' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-neutral-400 hover:text-amber-300'} transition pb-1 flex items-center gap-1`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Map View
            </button>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Global Currency Display Switcher: ETB / USD */}
            <div className="flex items-center bg-neutral-900 border border-amber-500/30 rounded-lg p-0.5 text-xs font-bold">
              <button
                onClick={() => { setCurrency('ETB'); fetchExchangeRate(); }}
                className={`px-2.5 py-1 rounded-md transition ${currency === 'ETB' ? 'bg-amber-500 text-black font-extrabold shadow' : 'text-neutral-400 hover:text-amber-300'}`}
              >
                ETB
              </button>
              <button
                onClick={() => { setCurrency('USD'); fetchExchangeRate(); }}
                title="Click to refresh the live exchange rate"
                className={`px-2.5 py-1 rounded-md transition ${currency === 'USD' ? 'bg-amber-500 text-black font-extrabold shadow' : 'text-neutral-400 hover:text-amber-300'}`}
              >
                USD ($)
              </button>
            </div>

            {isVIPAuthenticated ? (
              <div className="flex items-center space-x-2">
                {userRole === 'ADMIN' && (
                  <button 
                    onClick={() => setActiveTab('admin')} 
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-amber-500/30 transition flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Dashboard
                  </button>
                )}
                <button 
                  onClick={() => { setIsVIPAuthenticated(false); setUserRole(null); setActiveTab('browse'); }} 
                  className="px-3 py-1.5 bg-red-950/60 border border-red-800/60 text-red-300 hover:text-red-200 rounded-md text-xs font-bold uppercase transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('vip')} 
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-lg text-xs uppercase tracking-widest hover:brightness-110 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 relative group overflow-hidden"
              >
                <AdeyAbebaIcon className="w-4 h-4 text-neutral-950" />
                <span>VIP Portal</span>
              </button>
            )}
          </div>

        </div>
        <div className="lg:hidden w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap pt-3 pb-1 text-[10px] font-bold uppercase tracking-wide">
          <button onClick={() => { setActiveTab('browse'); setFilterVIPOnly(false); setFilterType('ALL'); setSelectedProperty(null); }} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Home</button>
          <button onClick={() => { setActiveTab('browse'); setFilterType('Rentals'); setSelectedProperty(null); }} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Rentals</button>
          <button onClick={() => { setActiveTab('browse'); setFilterType('Airbnb'); setSelectedProperty(null); }} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Airbnb</button>
          <button onClick={() => { setActiveTab('browse'); setFilterType('Penthouse'); setSelectedProperty(null); }} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Penthouses</button>
          <button onClick={() => { setActiveTab('browse'); setFilterType('Villa'); setSelectedProperty(null); }} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Villas</button>
          <button onClick={() => openCategoryPage('commercial')} className={`shrink-0 rounded-lg border px-3 py-2 ${activeTab === 'commercial' ? 'bg-amber-500 text-black border-amber-400' : 'border-amber-500/30 text-amber-300'}`}>Commercial</button>
          <button onClick={() => setActiveTab('contact')} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Contact</button>
          <button onClick={() => setActiveTab('map')} className="shrink-0 rounded-lg border border-amber-500/30 px-3 py-2 text-amber-300">Map View</button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA - Responsive Full Fluid Width */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-8 space-y-10">

        {/* HERO BANNER SECTION */}
        {activeTab === 'browse' && !selectedProperty && (
          <section className="w-full relative bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden">
            
            <div className="absolute top-2 right-4 flex gap-2 opacity-30 pointer-events-none animate-bounce">
              <AdeyAbebaIcon className="w-12 h-12 text-amber-400" />
              <AdeyAbebaIcon className="w-16 h-16 text-amber-300" />
            </div>
            <div className="absolute bottom-2 left-6 opacity-20 pointer-events-none">
              <AdeyAbebaIcon className="w-32 h-32 text-amber-400" />
            </div>

            <div className="max-w-4xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-lg">
                <AdeyAbebaIcon className="w-4 h-4 text-amber-400" />
                <span>እንኳን ደህና መጣችሁAddis Ababa Real Estate</span>
                <AdeyAbebaIcon className="w-4 h-4 text-amber-400" />
              </div>
              
              <h1 className="text-3xl md:text-5xl font-serif font-black text-amber-200 leading-tight">
                Estates, Rental & Airbnb Stays
              </h1>
              <p className="text-sm md:text-base text-neutral-400 max-w-2xl">
                Browse our verified catalog of properties in Addis Ababa. View prices in Ethiopian Birr (ETB) with instant USD conversions.
              </p>
            </div>

            {/* HERO SEARCH & FILTER BAR */}
            <div className="mt-8 bg-neutral-950/90 border border-amber-500/40 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 backdrop-blur-md shadow-xl relative z-10">
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-amber-400 absolute left-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Neighborhood (Bole, Old Airport, Kazanchis)"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-100 placeholder-neutral-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-amber-100 focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="ALL">All Property Types</option>
                  <option value="Rentals">Rental</option>
                  <option value="Airbnb">Airbnb</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Own Compound">Own Compound</option>
                  <option value="Resell">Resell</option>
                </select>
              </div>

              {/* BEDROOM FILTER FROM STUDIO TO 8 BEDROOMS */}
              <div>
                <select
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-amber-100 focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="ALL">Any Bedrooms</option>
                  <option value="0">Studio / 1 Bed</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5 Bedrooms</option>
                  <option value="6">6 Bedrooms</option>
                  <option value="7">7 Bedrooms</option>
                  <option value="8">8 Bedrooms</option>
                </select>
              </div>

              <button
                onClick={() => setActiveTab('browse')}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-amber-500/20"
              >
                <Search className="w-4 h-4" /> Filter Properties
              </button>
            </div>
          </section>
        )}

        {/* PROPERTY BROWSER GRID */}
        {activeTab === 'browse' && !selectedProperty && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <AdeyAbebaIcon className="w-7 h-7 text-amber-400" />
                <h2 className="text-2xl font-serif font-black text-amber-300 uppercase tracking-wide">
                  Available Listings ({filteredProperties.length})
                </h2>
                <AdeyAbebaIcon className="w-5 h-5 text-amber-400" />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterType(filterType === 'Airbnb' ? 'ALL' : 'Airbnb')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    filterType === 'Airbnb' ? 'bg-amber-500 text-black border-amber-400' : 'bg-neutral-900 border-amber-500/30 text-amber-300 hover:border-amber-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Airbnb
                </button>
                <button
                  onClick={() => setFilterType(filterType === 'Rentals' ? 'ALL' : 'Rentals')}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    filterType === 'Rentals' ? 'bg-amber-500 text-black border-amber-400' : 'bg-neutral-900 border-amber-500/30 text-amber-300 hover:border-amber-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Rental
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => { setSelectedProperty(prop); setActiveTab('details'); }}
                  className="bg-neutral-900/80 border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between shadow-xl relative"
                >
                  <div>
                    <div className="relative h-52 overflow-hidden bg-neutral-950">
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          prop.type === 'Airbnb' ? 'bg-purple-950/90 text-purple-300 border-purple-500/50' :
                          prop.type === 'Rentals' ? 'bg-blue-950/90 text-blue-300 border-blue-500/50' :
                          'bg-black/80 text-amber-300 border-amber-500/40'
                        }`}>
                          {prop.type === 'Airbnb' ? 'Airbnb' : prop.type === 'Rentals' ? 'Rental' : prop.type}
                        </span>
                        
                        {prop.isVIP && (
                          <span className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                            <Crown className="w-3 h-3" /> VIP
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <div className="p-1.5 bg-black/70 backdrop-blur-md border border-amber-500/40 rounded-full">
                          <AdeyAbebaIcon className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      </div>

                      <div className="absolute bottom-3 right-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          prop.status === 'AVAILABLE' ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40' :
                          prop.status === 'RESERVED' ? 'bg-amber-950/90 text-amber-400 border border-amber-500/40' :
                          'bg-red-950/90 text-red-400 border border-red-500/40'
                        }`}>
                          {prop.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {prop.locationName}, Addis Ababa
                      </p>

                      <div className="flex items-center gap-4 text-xs text-neutral-300 pt-2 border-t border-neutral-800">
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4 text-amber-400" /> {prop.bedrooms} Beds
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4 text-amber-400" /> {prop.bathrooms} Baths
                        </span>
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> {prop.areaSqFt} Sqm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex justify-between items-center border-t border-neutral-800/50 mt-3">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        {prop.priceType === 'airbnb' ? 'Airbnb' : prop.priceType === 'rent' ? 'Rental' : 'Sale'} ({currency})
                      </span>
                      <span className="text-base font-black text-amber-400">
                        {formatPrice(prop.priceETB, prop.priceType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {renderContactButtons(prop.title, true)}
                      <button className="p-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black rounded-xl border border-amber-500/30 transition flex items-center gap-1">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PROPERTY DETAILS PAGE */}
        {(activeTab === 'details' || selectedProperty) && activeTab !== 'admin' && activeTab !== 'vip' && activeTab !== 'contact' && activeTab !== 'map' && selectedProperty && (
          <div className="space-y-8">
            <button
              onClick={() => { setSelectedProperty(null); setActiveTab('browse'); }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-2 bg-neutral-900 border border-amber-500/30 px-4 py-2 rounded-xl transition w-fit"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Available Listings
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl overflow-hidden p-4 space-y-4 shadow-2xl">
                  <div className="relative h-[420px] rounded-2xl overflow-hidden bg-neutral-950 cursor-pointer" onClick={() => openLightbox(0)}>
                    <img
                      src={selectedProperty.images[activeImageIndex] || selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg uppercase">
                      {selectedProperty.type === 'Airbnb' ? 'Airbnb' : selectedProperty.type === 'Rentals' ? 'Rental' : selectedProperty.type}
                    </div>
                    
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <div className="p-2 bg-black/80 backdrop-blur-md border border-amber-500/40 rounded-full">
                        <AdeyAbebaIcon className="w-5 h-5 text-amber-400" />
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); openLightbox(activeImageIndex); }}
                      className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-amber-500/40 text-amber-300 p-2.5 rounded-xl hover:bg-amber-500 hover:text-black transition"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                      Categorized Room Views (Compound, Living Room, Kitchen, Bedroom, Bathroom):
                    </span>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedProperty.images.map((img, idx) => {
                        const labels = ["Compound / Facade", "Sitting Room", "Kitchen", "Bedroom", "Bathroom / Toilet"];
                        const areaLabel = labels[idx] || `View ${idx + 1}`;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition flex flex-col justify-end ${
                              activeImageIndex === idx ? 'border-amber-400 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={areaLabel} loading="lazy" className="w-full h-full object-cover absolute inset-0" />
                            <div className="relative z-10 bg-black/80 text-[9px] font-bold text-amber-300 p-1 text-center w-full truncate">
                              {areaLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <AdeyAbebaIcon className="w-5 h-5" />
                    <h2 className="text-2xl font-serif font-black text-amber-300">Property Overview</h2>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    {selectedProperty.description}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
                  <div className="absolute top-4 right-4">
                    <AdeyAbebaIcon className="w-6 h-6 text-amber-400" />
                  </div>

                  <div>
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block">
                      {selectedProperty.priceType === 'airbnb' ? 'Airbnb' : selectedProperty.priceType === 'rent' ? 'Rental' : 'Asking Sale Price'} ({currency})
                    </span>
                    <span className="text-3xl font-black text-amber-400 font-serif">
                      {formatPrice(selectedProperty.priceETB, selectedProperty.priceType)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-neutral-950 rounded-2xl border border-amber-500/20 text-center">
                    <div>
                      <Bed className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs font-bold block">{selectedProperty.bedrooms}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">Bedrooms</span>
                    </div>
                    <div>
                      <Bath className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs font-bold block">{selectedProperty.bathrooms}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">Baths</span>
                    </div>
                    <div>
                      <Maximize2 className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs font-bold block">{selectedProperty.areaSqFt}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">Sqm</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => openWhatsApp(selectedProperty.title)}
                        className="py-3.5 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                      >
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                      </button>
                      <button
                        onClick={() => openTelegram(selectedProperty.title)}
                        className="py-3.5 bg-sky-600 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
                      >
                        <Send className="w-4 h-4" /> Telegram
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-500 text-center -mt-1">Telegram opens the agent chat with your inquiry copied to the clipboard — just paste and send.</p>

                    <button
                      onClick={() => setActiveTab('contact')}
                      className="w-full py-3.5 bg-neutral-950 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-amber-500/10 transition flex items-center justify-center gap-2"
                    >
                      <AdeyAbebaIcon className="w-4 h-4 text-amber-400" /> Schedule Private Viewing
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-3 sm:p-6 space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Managing Director</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg font-serif">
                      TT
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Temesgen Teklay</h4>
                      <p className="text-xs text-amber-500">Chief Executive Broker</p>
                      <a href="tel:+251990272812" className="text-xs text-neutral-400 hover:text-amber-300 block mt-0.5">
                        +251 99 027 2812
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMMERCIAL LISTINGS PAGE */}
        {activeTab === 'commercial' && !selectedProperty && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-7 h-7 text-amber-400" />
                <h2 className="text-2xl font-serif font-black text-amber-300 uppercase tracking-wide">
                  Commercial Listings ({commercialProperties.length})
                </h2>
              </div>
              <button
                onClick={() => { setFilterCategory('residential'); setActiveTab('browse'); }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-2 bg-neutral-900 border border-amber-500/30 px-4 py-2 rounded-xl transition w-fit"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Residential Listings
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {commercialProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => { setSelectedProperty(prop); setActiveTab('details'); }}
                  className="bg-neutral-900/80 border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between shadow-xl relative"
                >
                  <div>
                    <div className="relative h-52 overflow-hidden bg-neutral-950">
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-black/80 text-amber-300 border-amber-500/40">
                          Commercial
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          prop.status === 'AVAILABLE' ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40' :
                          prop.status === 'RESERVED' ? 'bg-amber-950/90 text-amber-400 border border-amber-500/40' :
                          'bg-red-950/90 text-red-400 border border-red-500/40'
                        }`}>
                          {prop.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {prop.locationName}, Addis Ababa
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-300 pt-2 border-t border-neutral-800">
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4 text-amber-400" /> {prop.bathrooms} Baths
                        </span>
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> {prop.areaSqFt} Sqm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex justify-between items-center border-t border-neutral-800/50 mt-3">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        {prop.priceType === 'rent' ? 'Rental' : 'Sale'} ({currency})
                      </span>
                      <span className="text-base font-black text-amber-400">
                        {formatPrice(prop.priceETB, prop.priceType)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {renderContactButtons(prop.title, true)}
                      <button className="p-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black rounded-xl border border-amber-500/30 transition flex items-center gap-1">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 1: VIP SIGN-IN PORTAL */}
        {activeTab === 'vip' && (
          <div className="max-w-md mx-auto my-12 bg-neutral-900 border border-amber-500/30 p-8 rounded-3xl space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <AdeyAbebaIcon className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-amber-400 font-serif">VIP Portal Sign-In</h2>
              <p className="text-xs text-neutral-400">Authenticate to view restricted luxury properties or enter admin management center.</p>
            </div>

            {vipAuthError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{vipAuthError}</span>
              </div>
            )}

            <form onSubmit={handleVIPLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={vipEmail}
                  onChange={(e) => setVipEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-amber-500/30 rounded-xl p-3 text-xs text-neutral-100 outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={vipPassword}
                  onChange={(e) => setVipPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-amber-500/30 rounded-xl p-3 text-xs text-neutral-100 outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-amber-500/20">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    className="mt-0.5 accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-[11px] text-neutral-300 leading-tight">
                    I consent to receive exclusive promotional property offers directly to my email address.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <AdeyAbebaIcon className="w-4 h-4 text-black" />
                <span>Authenticate</span>
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: CONTACT US PAGE */}
        {activeTab === 'contact' && (
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <AdeyAbebaIcon className="w-3.5 h-3.5" /> Get In Touch <AdeyAbebaIcon className="w-3.5 h-3.5" />
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-black text-amber-200">Contact Temu Estates</h1>
              <p className="text-xs md:text-sm text-neutral-400">
                Connect with our real estate specialists for private viewings, rental, Airbnb bookings, or custom property requests in Addis Ababa.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                <h2 className="text-2xl font-serif font-black text-amber-400 flex items-center gap-2">
                  <AdeyAbebaIcon className="w-6 h-6" /> Managing Director
                </h2>
                
                <div className="space-y-5 text-xs text-neutral-300">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Chief Broker</p>
                      <p className="text-sm font-bold text-white mt-0.5">Temesgen Teklay</p>
                      <p className="text-amber-400 text-[11px]">Founder & CEO</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Phone Line</p>
                      <a href="tel:+251990272812" className="text-sm font-bold text-amber-200 hover:text-amber-400 transition mt-0.5 block">
                        +251 99 027 2812
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Official Email</p>
                      <a href="mailto:temu.estate@gmail.com" className="text-sm font-bold text-amber-200 hover:text-amber-400 transition mt-0.5 block">
                        temu.estate@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Head Office</p>
                      <p className="text-sm font-bold text-white mt-0.5">Bole Atlas, Addis Ababa, Ethiopia</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-500/20">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openWhatsApp('General Contact Request')}
                      className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </button>
                    <button
                      onClick={() => openTelegram('General Contact Request')}
                      className="w-full py-3 bg-sky-600 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
                    >
                      <Send className="w-4 h-4" /> Telegram
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 text-center">Choose a direct contact option or follow Temu Estates on social media.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <a href="https://www.instagram.com/temuestates.et/" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                      Instagram
                    </a>
                    <a href="https://www.tiktok.com/@temesgen.teklay33" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-neutral-800 border border-neutral-600 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-700 transition">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M19.6 7.2a6.7 6.7 0 0 1-4.1-1.4v8.1a5.5 5.5 0 1 1-4.8-5.4v3a2.6 2.6 0 1 0 1.8 2.5V2.5h3a3.8 3.8 0 0 0 4.1 3.7v1z"/></svg>
                      TikTok
                    </a>
                    <a href="https://t.me/Tete333333" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-sky-600 text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-500 transition">
                      <Send className="w-4 h-4" /> Telegram
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                <h2 className="text-2xl font-serif font-black text-amber-400">Send Us A Message</h2>

                {formSent ? (
                  <div className="p-6 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-bold text-emerald-300 font-serif">Continue in Telegram</h3>
                    <p className="text-xs text-neutral-300">
                      Your message draft has been prepared for @Tete333333 in Telegram. Please press Send in Telegram to deliver your inquiry.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.fullName}
                        onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                        placeholder="e.g. Abebe Bikila"
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs text-neutral-100 outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs text-neutral-100 outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="+251 9..."
                          className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs text-neutral-100 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Inquiry Purpose</label>
                      <select
                        value={contactForm.propertyInquiry}
                        onChange={(e) => setContactForm({ ...contactForm, propertyInquiry: e.target.value })}
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs text-neutral-100 outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="General Inquiry">General Property Inquiry</option>
                        <option value="Airbnb Stay">Book Airbnb Stay</option>
                        <option value="Rental">Long Term Rental</option>
                        <option value="Buying Luxury Property">Buying Property</option>
                        <option value="Property Listing">List My Property</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Message *</label>
                      <textarea
                        rows="4"
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Tell us about desired neighborhood, budget in ETB, or dates..."
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs text-neutral-100 outline-none focus:border-amber-400"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                      <AdeyAbebaIcon className="w-4 h-4 text-black" /> Submit Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MAP INTEGRATION */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif font-black text-amber-400 flex items-center gap-2">
                  <AdeyAbebaIcon className="w-6 h-6" /> Addis Ababa Interactive Map
                </h2>
                <p className="text-xs text-neutral-400">Satellite & map views across Addis Ababa neighborhoods.</p>
              </div>
              <button onClick={() => setActiveTab('browse')} className="text-xs text-amber-400 hover:underline">
                ← Back to Available Listings
              </button>
            </div>

            <div className="w-full h-[550px] bg-neutral-900 border border-amber-500/30 rounded-3xl overflow-hidden relative shadow-2xl">
              <iframe
                title="Google Maps Addis Ababa"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=Addis%20Ababa,%20Ethiopia&t=m&z=12&output=embed`}
              ></iframe>
            </div>
          </div>
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {activeTab === 'admin' && isVIPAuthenticated && userRole === 'ADMIN' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/30 pb-6">
              <div>
                <h2 className="text-3xl font-serif font-black text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-8 h-8" /> Admin Management Center
                </h2>
              <p className="text-xs text-neutral-400 mt-1">Full control to manage listings, distinguish Residential vs Commercial, and assign room photos.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-neutral-900 border border-amber-500/30 rounded-xl p-1 text-xs font-bold">
                  <span className="text-[10px] text-neutral-400 px-2 uppercase">Display Currency:</span>
                  <button
                    onClick={() => setCurrency('ETB')}
                    className={`px-3 py-1 rounded-lg transition ${currency === 'ETB' ? 'bg-amber-500 text-black font-extrabold' : 'text-neutral-400 hover:text-amber-300'}`}
                  >
                    ETB
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded-lg transition ${currency === 'USD' ? 'bg-amber-500 text-black font-extrabold' : 'text-neutral-400 hover:text-amber-300'}`}
                  >
                    USD ($)
                  </button>
                </div>

                <button
                  onClick={() => { setIsVIPAuthenticated(false); setUserRole(null); setActiveTab('browse'); }}
                  className="px-4 py-2 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Exit Admin
                </button>
              </div>
            </div>

            {adminNotification && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{adminNotification}</span>
              </div>
            )}

            {/* EXCHANGE RATE PANEL — live CBE-compatible rate, 6-hour auto-sync, refresh on demand */}
            <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 space-y-3">
              <h3 className="text-lg font-bold font-serif text-amber-300 flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 ${rateSyncing ? 'animate-spin' : ''}`} /> USD → ETB Exchange Rate
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-2xl font-black text-amber-400 font-serif">
                  1 USD = {exchangeRate.rate.toFixed(2)} ETB
                </span>
                <button
                  onClick={fetchExchangeRate}
                  disabled={rateSyncing}
                  className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-500/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${rateSyncing ? 'animate-spin' : ''}`} /> Sync Now
                </button>
              </div>
              <p className="text-[11px] text-amber-500 font-semibold">
                {exchangeRate.source}
                {exchangeRate.updatedAt ? ` • Last synced: ${new Date(exchangeRate.updatedAt).toLocaleString()}` : ' • Starting rate (not yet synced)'}
              </p>
              {rateError && (
                <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{rateError} CBE unavailable - showing starting rate.</span>
                </div>
              )}
              <p className="text-[10px] text-neutral-500">Auto-refreshes every 6 hours. If the rate source is unavailable, the last successfully fetched rate and its sync date/time remain displayed site-wide.</p>
            </div>

            {/* INVENTORY TABLE */}
            <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-3 sm:p-6 space-y-4">
              <h3 className="text-xl font-bold font-serif text-amber-300 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Available Property Inventory ({properties.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-200">
                  <thead className="bg-neutral-950 text-amber-400 uppercase tracking-wider border-b border-amber-500/30">
                    <tr>
                      <th className="p-3">Property</th>
                      <th className="p-3">Neighborhood</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Price ({currency})</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {properties.map((p, rowIdx) => (
                      <tr key={p.id} className="hover:bg-neutral-950/50 transition">
                        <td className="p-3 flex items-center gap-3">
                          <img src={p.images[0]} alt={p.title} loading="lazy" className="w-10 h-10 rounded-lg object-cover border border-amber-500/30" />
                          <div>
                            <span className="font-bold text-white block">{p.title}</span>
                            <span className="text-[10px] text-amber-500">{p.type}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-amber-200">
                          {p.locationName}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (p.category || 'residential') === 'commercial' ? 'bg-orange-950 text-orange-300 border border-orange-500/40' :
                            p.priceType === 'airbnb' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' :
                            p.priceType === 'rent' ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                            'bg-neutral-800 text-amber-300'
                          }`}>
                            {(p.category || 'residential') === 'commercial' ? 'Commercial' : p.priceType === 'airbnb' ? 'Airbnb' : p.priceType === 'rent' ? 'Rental' : 'Sale'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-amber-300">
                          {formatPrice(p.priceETB, p.priceType)}
                        </td>
                        <td className="p-3">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg font-bold border bg-neutral-950 outline-none cursor-pointer ${
                              p.status === 'AVAILABLE' ? 'border-emerald-500/50 text-emerald-400' :
                              p.status === 'BOUGHT' ? 'border-red-500/50 text-red-400' :
                              p.status === 'RENTED' ? 'border-blue-500/50 text-blue-400' : 'border-amber-500/50 text-amber-400'
                            }`}
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="BOUGHT">BOUGHT / SOLD</option>
                            <option value="RENTED">RENTED</option>
                            <option value="RESERVED">RESERVED</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => moveProperty(p.id, -1)}
                              disabled={rowIdx === 0}
                              className="p-2 bg-neutral-950 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition disabled:opacity-30"
                              title="Move up (reorder)"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveProperty(p.id, 1)}
                              disabled={rowIdx === properties.length - 1}
                              className="p-2 bg-neutral-950 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition disabled:opacity-30"
                              title="Move down (reorder)"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditProperty(p)}
                              className="p-2 bg-neutral-950 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition"
                              title="Edit property"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProperty(p.id)}
                              className="p-2 bg-red-950 text-red-400 border border-red-800 rounded-lg hover:bg-red-900 transition"
                              title="Delete Property"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CREATE PROPERTY FORM */}
            <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <AdeyAbebaIcon className="w-6 h-6" />
                <h3 className="text-2xl font-bold font-serif text-amber-300">Add New Available Listing</h3>
              </div>

              <form onSubmit={handleAddProperty} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Title *</label>
                    <input
                      type="text"
                      value={newProp.title}
                      onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                      placeholder="e.g. Imperial Compound Villa in Sarbet"
                      className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Neighborhood Location *</label>
                    <input
                      type="text"
                      value={newProp.locationName}
                      onChange={(e) => handleManualLocationChange(e.target.value)}
                      placeholder="e.g. Bole Rwanda, Old Airport, CMC, Sarbet"
                      className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-100 outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Price in Ethiopian Birr (ETB) & Type *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newProp.priceETB}
                        onChange={(e) => setNewProp({ ...newProp, priceETB: e.target.value })}
                        placeholder="Price amount"
                        className="flex-1 bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400 font-bold"
                        required
                      />
                      <select
                        value={newProp.priceType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewProp({ 
                            ...newProp, 
                            priceType: val,
                            type: val === 'airbnb' ? 'Airbnb' : val === 'rent' ? 'Rentals' : newProp.type
                          });
                        }}
                        className="bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none cursor-pointer"
                      >
                        <option value="sale">For Sale</option>
                        <option value="rent">Rental</option>
                        <option value="airbnb">Airbnb</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Bedrooms *</label>
                      <input
                        type="number"
                        min="0"
                        value={newProp.bedrooms}
                        onChange={(e) => setNewProp({ ...newProp, bedrooms: e.target.value })}
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Bathrooms *</label>
                      <input
                        type="number"
                        min="1"
                        value={newProp.bathrooms}
                        onChange={(e) => setNewProp({ ...newProp, bathrooms: e.target.value })}
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Area (Sqm) *</label>
                      <input
                        type="number"
                        min="10"
                        value={newProp.areaSqFt}
                        onChange={(e) => setNewProp({ ...newProp, areaSqFt: e.target.value })}
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Category Type</label>
                      <select
                        value={newProp.type}
                        onChange={(e) => setNewProp({ ...newProp, type: e.target.value })}
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none"
                      >
                        <option value="Rentals">Rental</option>
                        <option value="Airbnb">Airbnb</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Villa">Villa</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Own Compound">Own Compound</option>
                        <option value="Resell">Resell</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Listing Category</label>
                      <select
                        value={newProp.category}
                        onChange={(e) => setNewProp({ ...newProp, category: e.target.value })}
                        className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none"
                      >
                        <option value="residential">Residential / House</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-amber-400">
                        <input
                          type="checkbox"
                          checked={newProp.isVIP}
                          onChange={(e) => setNewProp({ ...newProp, isVIP: e.target.checked })}
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span>VIP Exclusive Listing</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* UP TO 12 PHOTOS WITH DRAG-AND-DROP REORDERING (auto WebP-optimized) */}
                <div className="space-y-4 pt-2 border-t border-amber-500/20">
                  <PhotoManager
                    label={`Property Photos — up to ${MAX_PROPERTY_IMAGES} (drag to reorder, first = featured)`}
                    photos={newProp.images}
                    thumbs={newProp.thumbs}
                    onChange={(nextPhotos, nextThumbs) => setNewProp(prev => ({ ...prev, images: nextPhotos, thumbs: nextThumbs }))}
                  />
                </div>

                {/* CATEGORIZED ROOM PHOTO UPLOADS */}
                <div className="space-y-4 pt-2 border-t border-amber-500/20">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Designated Area Photos (Compound, Sitting Room, Kitchen, Bedroom, Bathroom/Toilet)
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-neutral-950 border border-amber-500/30 p-3 rounded-2xl flex flex-col items-center justify-between text-center gap-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">1. Compound / Exterior</span>
                      {categorizedPhotos.compound ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-400">
                          <img src={categorizedPhotos.compound} alt="Compound" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setCategorizedPhotos(prev => ({...prev, compound: ''}))} className="absolute top-1 right-1 bg-black/80 text-red-400 p-1 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-24 border border-dashed border-neutral-700 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-amber-400 transition">
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold">Upload Photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCategorizedPhotoUpload('compound', e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    <div className="bg-neutral-950 border border-amber-500/30 p-3 rounded-2xl flex flex-col items-center justify-between text-center gap-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">2. Sitting / Living</span>
                      {categorizedPhotos.sitting ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-400">
                          <img src={categorizedPhotos.sitting} alt="Sitting Room" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setCategorizedPhotos(prev => ({...prev, sitting: ''}))} className="absolute top-1 right-1 bg-black/80 text-red-400 p-1 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-24 border border-dashed border-neutral-700 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-amber-400 transition">
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold">Upload Photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCategorizedPhotoUpload('sitting', e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    <div className="bg-neutral-950 border border-amber-500/30 p-3 rounded-2xl flex flex-col items-center justify-between text-center gap-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">3. Kitchen Area</span>
                      {categorizedPhotos.kitchen ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-400">
                          <img src={categorizedPhotos.kitchen} alt="Kitchen" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setCategorizedPhotos(prev => ({...prev, kitchen: ''}))} className="absolute top-1 right-1 bg-black/80 text-red-400 p-1 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-24 border border-dashed border-neutral-700 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-amber-400 transition">
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold">Upload Photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCategorizedPhotoUpload('kitchen', e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    <div className="bg-neutral-950 border border-amber-500/30 p-3 rounded-2xl flex flex-col items-center justify-between text-center gap-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">4. Bedroom Suite</span>
                      {categorizedPhotos.bedroom ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-400">
                          <img src={categorizedPhotos.bedroom} alt="Bedroom" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setCategorizedPhotos(prev => ({...prev, bedroom: ''}))} className="absolute top-1 right-1 bg-black/80 text-red-400 p-1 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-24 border border-dashed border-neutral-700 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-amber-400 transition">
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold">Upload Photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCategorizedPhotoUpload('bedroom', e.target.files[0])} />
                        </label>
                      )}
                    </div>

                    <div className="bg-neutral-950 border border-amber-500/30 p-3 rounded-2xl flex flex-col items-center justify-between text-center gap-2">
                      <span className="text-[11px] font-bold text-amber-400 uppercase">5. Bathroom / Toilet</span>
                      {categorizedPhotos.toilet ? (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-amber-400">
                          <img src={categorizedPhotos.toilet} alt="Toilet" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setCategorizedPhotos(prev => ({...prev, toilet: ''}))} className="absolute top-1 right-1 bg-black/80 text-red-400 p-1 rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-24 border border-dashed border-neutral-700 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-amber-400 transition">
                          <Camera className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold">Upload Photo</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCategorizedPhotoUpload('toilet', e.target.files[0])} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows="3"
                    value={newProp.description}
                    onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                    placeholder="Enter detailed description..."
                    className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4 text-black" /> Publish Real Estate Listing
                </button>
              </form>
            </div>
          </div>
        )}

        {/* EDIT PROPERTY MODAL — full inventory editing */}
        {editingProp && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto my-8 bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-serif text-amber-300 flex items-center gap-2">
                  <Edit3 className="w-5 h-5" /> Edit Listing — {editingProp.title}
                </h3>
                <button onClick={() => setEditingProp(null)} className="p-2 bg-red-950 text-red-400 rounded-lg hover:bg-red-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Title</label>
                  <input type="text" value={editingProp.title} onChange={(e) => setEditingProp({ ...editingProp, title: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Neighborhood</label>
                  <input type="text" value={editingProp.locationName} onChange={(e) => setEditingProp({ ...editingProp, locationName: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Price (ETB)</label>
                  <input type="number" value={editingProp.priceETB} onChange={(e) => setEditingProp({ ...editingProp, priceETB: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Price Type</label>
                  <select value={editingProp.priceType} onChange={(e) => setEditingProp({ ...editingProp, priceType: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none">
                    <option value="sale">For Sale</option>
                    <option value="rent">Rental</option>
                    <option value="airbnb">Airbnb</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Status</label>
                  <select value={editingProp.status} onChange={(e) => setEditingProp({ ...editingProp, status: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none">
                    <option value="AVAILABLE">Available</option>
                    <option value="RENTED">Rented</option>
                    <option value="BOUGHT">Sold</option>
                    <option value="RESERVED">Unavailable / Reserved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Category</label>
                  <select value={editingProp.category} onChange={(e) => setEditingProp({ ...editingProp, category: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none">
                    <option value="residential">Residential / House</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2 md:col-span-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Bedrooms</label>
                    <input type="number" min="0" value={editingProp.bedrooms} onChange={(e) => setEditingProp({ ...editingProp, bedrooms: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Bathrooms</label>
                    <input type="number" min="1" value={editingProp.bathrooms} onChange={(e) => setEditingProp({ ...editingProp, bathrooms: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Area (Sqm)</label>
                    <input type="number" min="10" value={editingProp.areaSqFt} onChange={(e) => setEditingProp({ ...editingProp, areaSqFt: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea rows="3" value={editingProp.description} onChange={(e) => setEditingProp({ ...editingProp, description: e.target.value })} className="w-full bg-neutral-950 border border-amber-500/30 p-3 rounded-xl text-xs outline-none focus:border-amber-400"></textarea>
                </div>
                <div className="md:col-span-2 flex items-center">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-amber-400">
                    <input type="checkbox" checked={editingProp.isVIP} onChange={(e) => setEditingProp({ ...editingProp, isVIP: e.target.checked })} className="accent-amber-400 w-4 h-4" />
                    <span>VIP Exclusive Listing</span>
                  </label>
                </div>
              </div>

              <PhotoManager
                label={`Photos — add, delete, or drag to reorder (up to ${MAX_PROPERTY_IMAGES}; first = featured)`}
                photos={editingProp.images}
                thumbs={editingProp.thumbs}
                onChange={(nextPhotos, nextThumbs) => setEditingProp(prev => ({ ...prev, images: nextPhotos, thumbs: nextThumbs }))}
              />

              <div className="flex gap-3">
                <button onClick={handleSaveEdit} className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Save Changes
                </button>
                <button onClick={() => setEditingProp(null)} className="px-6 py-3.5 bg-neutral-950 border border-neutral-700 text-neutral-300 font-bold rounded-xl text-xs uppercase tracking-widest hover:border-amber-500/40 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* LIGHTBOX POPUP MODAL */}
      {isLightboxOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 sm:p-6">
          <div className="w-full flex justify-between items-center text-amber-400">
            <span className="text-xs font-bold font-serif">
              {selectedProperty.title} ({activeImageIndex + 1} / {selectedProperty.images.length})
            </span>
            <div className="flex items-center space-x-3">
              <button onClick={() => setZoomScale(prev => Math.min(prev + 0.3, 2.5))} className="p-2 bg-neutral-900 rounded-lg hover:text-white">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoomScale(prev => Math.max(prev - 0.3, 0.7))} className="p-2 bg-neutral-900 rounded-lg hover:text-white">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => setZoomScale(1)} className="p-2 bg-neutral-900 rounded-lg hover:text-white">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setIsLightboxOpen(false)} className="p-2 bg-red-950 text-red-400 rounded-lg hover:bg-red-900">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-4">
            <img
              src={selectedProperty.images[activeImageIndex]}
              alt="Expanded view"
              style={{ transform: `scale(${zoomScale})` }}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
            />

            <button
              onClick={() => setActiveImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 border border-amber-500/40 text-amber-400 rounded-full hover:bg-amber-500 hover:text-black transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev + 1) % selectedProperty.images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 border border-amber-500/40 text-amber-400 rounded-full hover:bg-amber-500 hover:text-black transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto max-w-full pb-2">
            {selectedProperty.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => { setActiveImageIndex(idx); setZoomScale(1); }}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 ${activeImageIndex === idx ? 'border-amber-400' : 'border-transparent opacity-50'}`}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full border-t border-amber-500/20 bg-neutral-950 py-6 px-4 sm:px-8 text-center text-xs text-neutral-500 space-y-2">
        <div className="flex justify-center items-center gap-2 text-amber-400 font-bold">
          <AdeyAbebaIcon className="w-4 h-4" />
          <span>TEMU ESTATES • ተሙ ኤስቴት</span>
          <AdeyAbebaIcon className="w-4 h-4" />
        </div>
        <p>© 2026 Temu Estates Addis Ababa. Direct Managed Real Estate Solutions.</p>
      </footer>

    </div>
  );
}