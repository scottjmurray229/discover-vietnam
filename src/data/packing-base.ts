// packing-base.ts — Universal packing items shared across all Discover sites
// ~60 items covering all travelers. Merged with site-specific packing-list.ts overrides.
// NOTE: No ASINs here — search fallbacks only. ASINs go stale when listings change.
// Put specific product ASINs in the site's packing-list.ts gear recommendations only.

export type Category = 'documents' | 'clothing' | 'toiletries' | 'electronics' | 'gear' | 'destination' | 'activity';
export type Climate = 'tropical' | 'temperate' | 'cold' | 'desert' | 'alpine' | 'coastal';
export type Activity = 'snorkeling' | 'hiking' | 'diving' | 'surfing' | 'temples' | 'nightlife' | 'photography' | 'camping';
export type Season = 'dry' | 'rainy' | 'cool' | 'shoulder';
export type Style = 'backpacker' | 'midrange' | 'luxury' | 'family' | 'business';

export interface PackingItem {
  id: string;
  name: string;
  category: Category;
  description?: string;
  essential: boolean;
  climate?: Climate[];
  activities?: Activity[];
  seasons?: Season[];
  styles?: Style[];
  quantityMultiplier?: number;
  amazonAsin?: string;
  amazonSearchFallback?: string;
  affiliatePrice?: string;
  localAlternative?: string;
  affiliateUrl?: string;
  affiliatePartner?: string;
}

export interface GearRecommendation {
  id: string;
  name: string;
  reason: string;
  amazonAsin?: string;
  amazonSearchFallback: string;
  affiliatePrice: string;
}

export interface PackingConfig {
  sitePrefix: string;        // e.g. "dph" → localStorage key "dph_packing_list"
  destination: string;       // "Philippines"
  climate: Climate[];
  currency: string;          // "PHP"
  plugType: string;          // "Type A/B/C"
  plugVoltage: string;       // "220V"
  affiliateTag: string;      // Amazon Associates tag
  destinationEssentials: PackingItem[];
  gearRecommendations: GearRecommendation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS & MONEY (8 items)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_DOCUMENTS: PackingItem[] = [
  {
    id: 'doc-passport',
    name: 'Valid Passport',
    category: 'documents',
    description: 'Must have 6+ months validity from your travel date — airlines and immigration will turn you away without it.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-visa',
    name: 'Visa / eTA / Entry Permit',
    category: 'documents',
    description: 'Check requirements for your passport — many countries have visa-on-arrival or eVisa options.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-insurance',
    name: 'Travel Insurance Documents',
    category: 'documents',
    description: 'Print a copy AND have it on your phone. Include the emergency phone number.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-bookings',
    name: 'Flight & Booking Confirmations',
    category: 'documents',
    description: 'Printed + digital copies of flights, hotels, and any pre-booked tours.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-photos',
    name: '2 Passport-Size Photos',
    category: 'documents',
    description: 'Some visa-on-arrival counters still require physical photos. Print at CVS, Walgreens, or any pharmacy before you go — takes 10 minutes.',
    essential: false,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-currency',
    name: 'Local Currency (cash)',
    category: 'documents',
    description: 'Have some local cash before leaving the airport — not everywhere accepts cards.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-cards',
    name: 'Credit/Debit Cards (no foreign tx fee)',
    category: 'documents',
    description: 'Charles Schwab, Wise, or a travel card — foreign transaction fees add up fast.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-emergency',
    name: 'Emergency Contacts Card',
    category: 'documents',
    description: 'Laminated card: embassy number, insurance hotline, family contacts. Keep separate from wallet.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'doc-mail-hold',
    name: 'USPS Mail Hold (trips 3+ days)',
    category: 'documents',
    description: 'Schedule at usps.com/manage/hold-mail.htm — free, takes 2 minutes, holds mail up to 30 days. Overflowing mailbox is a visible signal your home is empty.',
    essential: false,
    quantityMultiplier: 0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLOTHING — TROPICAL (10 items)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_CLOTHING_TROPICAL: PackingItem[] = [
  {
    id: 'cloth-shirts',
    name: 'Lightweight Breathable Shirts',
    category: 'clothing',
    description: 'Quick-dry, light-colored. Pack roughly 1 per 2 days — laundry is cheap and available.',
    essential: true,
    climate: ['tropical', 'coastal'],
    quantityMultiplier: 0.5,
    amazonSearchFallback: 'quick+dry+travel+shirts',
    affiliatePrice: '$18–35',
  },
  {
    id: 'cloth-shorts',
    name: 'Quick-Dry Shorts / Skirts',
    category: 'clothing',
    description: 'Doubles as beach and town wear. Avoid cotton — it stays wet forever in humidity.',
    essential: true,
    climate: ['tropical', 'coastal'],
    quantityMultiplier: 0.33,
    amazonSearchFallback: 'quick+dry+travel+shorts',
    affiliatePrice: '$22–45',
  },
  {
    id: 'cloth-pants',
    name: 'Long Pants (1–2 pairs)',
    category: 'clothing',
    description: 'Required for temples, nicer restaurants, and cooler evenings. Lightweight linen or nylon.',
    essential: true,
    climate: ['tropical', 'temperate', 'coastal'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'lightweight+travel+pants',
    affiliatePrice: '$35–65',
  },
  {
    id: 'cloth-swimsuit',
    name: 'Swimsuit (1–2)',
    category: 'clothing',
    description: 'You\'ll be in the water. A lot. Pack two so one can dry.',
    essential: true,
    climate: ['tropical', 'coastal'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'travel+swimsuit',
    affiliatePrice: '$20–50',
  },
  {
    id: 'cloth-sarong',
    name: 'Sarong / Cover-Up',
    category: 'clothing',
    description: 'Beach cover-up, temple scarf, picnic blanket, emergency towel. Most versatile item you\'ll pack.',
    essential: true,
    climate: ['tropical', 'coastal'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'travel+sarong+cover+up',
    affiliatePrice: '$12–25',
  },
  {
    id: 'cloth-rain',
    name: 'Light Rain Jacket / Poncho',
    category: 'clothing',
    description: 'Tropical downpours arrive with zero warning. Packable jacket that fits in your day bag.',
    essential: true,
    climate: ['tropical'],
    seasons: ['rainy', 'shoulder'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'packable+rain+jacket+travel',
    affiliatePrice: '$30–65',
  },
  {
    id: 'cloth-shoes',
    name: 'Walking Shoes / Sneakers',
    category: 'clothing',
    description: 'Lightweight, broken-in before you go. Your feet will thank you after 15,000 steps on cobblestones.',
    essential: true,
    quantityMultiplier: 0,
    amazonSearchFallback: 'lightweight+travel+walking+shoes',
    affiliatePrice: '$55–120',
  },
  {
    id: 'cloth-sandals',
    name: 'Flip-Flops / Waterproof Sandals',
    category: 'clothing',
    description: 'Beach, boats, showers at budget guesthouses. Chacos or Tevas hold up far better than cheap flip-flops.',
    essential: true,
    climate: ['tropical', 'coastal'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'waterproof+travel+sandals+chaco',
    affiliatePrice: '$25–80',
  },
  {
    id: 'cloth-hat',
    name: 'Sun Hat / Cap',
    category: 'clothing',
    description: 'Packable wide-brim hat for all-day sun exposure. Baseball caps don\'t protect your neck.',
    essential: true,
    climate: ['tropical', 'coastal', 'desert'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'packable+sun+hat+travel+upf',
    affiliatePrice: '$18–40',
  },
  {
    id: 'cloth-sleep',
    name: 'Sleepwear',
    category: 'clothing',
    description: 'Lightweight. You\'ll want it in air-conditioned rooms which can be arctic.',
    essential: true,
    quantityMultiplier: 0,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLOTHING — COLD CLIMATE ADDITIONS (swap/add for cold destinations)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_CLOTHING_COLD: PackingItem[] = [
  {
    id: 'cloth-thermal-top',
    name: 'Thermal Base Layer Top',
    category: 'clothing',
    description: 'Merino wool is worth it — warm, odor-resistant, and packs small.',
    essential: true,
    climate: ['cold', 'alpine'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'merino+wool+base+layer+top',
    affiliatePrice: '$45–90',
  },
  {
    id: 'cloth-thermal-bottom',
    name: 'Thermal Base Layer Bottom',
    category: 'clothing',
    description: 'Under pants for extreme cold or inside sleeping bags on cold nights.',
    essential: true,
    climate: ['cold', 'alpine'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'thermal+base+layer+pants',
    affiliatePrice: '$35–75',
  },
  {
    id: 'cloth-insulated',
    name: 'Insulated Jacket / Down Layer',
    category: 'clothing',
    description: 'Packable down jacket as mid-layer. Essential for cold mornings even in temperate climates.',
    essential: true,
    climate: ['cold', 'alpine', 'temperate'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'packable+down+jacket+travel',
    affiliatePrice: '$80–180',
  },
  {
    id: 'cloth-warm-hat',
    name: 'Warm Hat + Gloves',
    category: 'clothing',
    description: 'Beanie + lightweight glove liners. More useful than you\'d think even in shoulder season.',
    essential: true,
    climate: ['cold', 'alpine'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'travel+beanie+glove+set',
    affiliatePrice: '$20–40',
  },
  {
    id: 'cloth-shell',
    name: 'Waterproof Outer Shell',
    category: 'clothing',
    description: 'Hard shell over insulated layer for rain + cold combo. Non-negotiable in alpine and subarctic.',
    essential: true,
    climate: ['cold', 'alpine'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'waterproof+hardshell+jacket',
    affiliatePrice: '$100–250',
  },
  {
    id: 'cloth-wool-socks',
    name: 'Wool Socks',
    category: 'clothing',
    description: 'Merino wool socks keep feet warm even when damp. Pack 1 pair per 2 days.',
    essential: true,
    climate: ['cold', 'alpine'],
    quantityMultiplier: 0.5,
    amazonSearchFallback: 'merino+wool+hiking+socks',
    affiliatePrice: '$15–30',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TOILETRIES & HEALTH (12 items)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_TOILETRIES: PackingItem[] = [
  {
    id: 'toi-sunscreen',
    name: 'Sunscreen SPF 50+',
    category: 'toiletries',
    description: 'Reef-safe mineral sunscreen for coastal destinations — oxybenzone destroys coral. Apply every 2 hours.',
    essential: true,
    climate: ['tropical', 'coastal', 'desert'],
    amazonSearchFallback: 'reef+safe+mineral+sunscreen+spf50+zinc',
    affiliatePrice: '$12–22',
    localAlternative: 'Available locally but reef-safe options are limited and expensive',
  },
  {
    id: 'toi-repellent',
    name: 'Insect Repellent (DEET or Picaridin)',
    category: 'toiletries',
    description: '30-40% DEET for dengue and malaria risk areas. Picaridin is gentler on skin and gear — both work.',
    essential: true,
    climate: ['tropical'],
    amazonSearchFallback: 'deet+30+percent+insect+repellent+travel',
    affiliatePrice: '$8–18',
    localAlternative: 'Available locally — buy on arrival if packing light',
  },
  {
    id: 'toi-meds',
    name: 'Personal Medications + Prescription Copies',
    category: 'toiletries',
    description: 'Bring 2x what you need plus copies of prescriptions. Some medications are controlled or unavailable abroad.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'toi-firstaid',
    name: 'Basic First Aid Kit',
    category: 'toiletries',
    description: 'Band-aids, antiseptic wipes, gauze, medical tape, pain relievers. Compact kits fit in a zip-lock.',
    essential: true,
    amazonSearchFallback: 'compact+travel+first+aid+kit',
    affiliatePrice: '$15–30',
    localAlternative: 'Available at pharmacies — assemble your own or buy compact kits',
  },
  {
    id: 'toi-sanitizer',
    name: 'Hand Sanitizer',
    category: 'toiletries',
    description: 'Before every meal, after every market, after every tuk-tuk. Non-negotiable.',
    essential: true,
    quantityMultiplier: 0,
    localAlternative: 'Available everywhere — buy on arrival',
  },
  {
    id: 'toi-toothbrush',
    name: 'Toothbrush + Toothpaste',
    category: 'toiletries',
    description: 'Travel-size toothpaste goes fast. Pack 2 tubes for longer trips.',
    essential: true,
    quantityMultiplier: 0,
    localAlternative: 'Available everywhere locally',
  },
  {
    id: 'toi-shampoo',
    name: 'Shampoo / Conditioner (travel size)',
    category: 'toiletries',
    description: 'Solid shampoo bars are great for travel — no liquids restriction, last longer.',
    essential: false,
    quantityMultiplier: 0,
    amazonSearchFallback: 'solid+shampoo+bar+travel',
    affiliatePrice: '$5–15',
    localAlternative: 'Most hotels provide basics — buy locally for longer stays',
  },
  {
    id: 'toi-deodorant',
    name: 'Deodorant',
    category: 'toiletries',
    description: 'Get a solid stick or crystal deodorant — gels count as liquids at security.',
    essential: true,
    quantityMultiplier: 0,
    localAlternative: 'Available locally but familiar brands may not be found',
  },
  {
    id: 'toi-contacts',
    name: 'Contact Lenses + Solution',
    category: 'toiletries',
    description: 'Pack more solution than you think you need. Daily disposables eliminate solution hassle.',
    essential: false,
    quantityMultiplier: 0,
  },
  {
    id: 'toi-lipbalm',
    name: 'Lip Balm with SPF',
    category: 'toiletries',
    description: 'Lips burn too — especially on boats and beaches at altitude.',
    essential: false,
    climate: ['tropical', 'coastal', 'desert', 'alpine'],
    amazonSearchFallback: 'spf+lip+balm+sun+protection',
    affiliatePrice: '$4–10',
  },
  {
    id: 'toi-aftersun',
    name: 'After-Sun / Aloe Vera Gel',
    category: 'toiletries',
    description: 'You will get burned. Have this ready. Keeps in the fridge of your room for maximum relief.',
    essential: false,
    climate: ['tropical', 'coastal', 'desert'],
    amazonSearchFallback: 'aloe+vera+gel+after+sun+cooling',
    affiliatePrice: '$6–12',
    localAlternative: 'Available at pharmacies and 7-Eleven',
  },
  {
    id: 'toi-antidiarrheal',
    name: 'Anti-Diarrheal + Rehydration Salts',
    category: 'toiletries',
    description: 'Imodium + ORS packets. The ones who don\'t pack these are the ones who need them most.',
    essential: true,
    amazonSearchFallback: 'imodium+oral+rehydration+salts+travel',
    affiliatePrice: '$8–15',
    localAlternative: 'Available at pharmacies everywhere',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRONICS (7 items)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_ELECTRONICS: PackingItem[] = [
  {
    id: 'elec-phone',
    name: 'Phone + Charger',
    category: 'electronics',
    description: 'Your navigation, translation, offline maps, and camera all in one. Pack the cable AND a wall adapter.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'elec-powerbank',
    name: 'Power Bank (20,000mAh+)',
    category: 'electronics',
    description: 'Big enough to charge your phone 4–5x. Non-negotiable on long travel days and remote islands.',
    essential: true,
    amazonSearchFallback: 'anker+power+bank+20000mah+portable+charger',
    affiliatePrice: '$35–60',
  },
  {
    id: 'elec-adapter',
    name: 'Universal Power Adapter',
    category: 'electronics',
    description: 'Check the plug type for your destination. A universal adapter works everywhere.',
    essential: true,
    amazonSearchFallback: 'universal+travel+power+adapter+worldwide',
    affiliatePrice: '$15–30',
  },
  {
    id: 'elec-earbuds',
    name: 'Earbuds / Headphones',
    category: 'electronics',
    description: 'For long flights, buses, and drowning out snoring hostel roommates.',
    essential: true,
    quantityMultiplier: 0,
    amazonSearchFallback: 'wireless+earbuds+travel+noise+cancelling',
    affiliatePrice: '$25–80',
  },
  {
    id: 'elec-camera',
    name: 'Camera (optional)',
    category: 'electronics',
    description: 'If you want shots better than your phone. Even a compact point-and-shoot is a step up for landscapes.',
    essential: false,
    quantityMultiplier: 0,
  },
  {
    id: 'elec-waterproof-pouch',
    name: 'Waterproof Phone Pouch',
    category: 'electronics',
    description: 'Cheap insurance. One wave on a boat and your unprotected phone is gone.',
    essential: true,
    climate: ['tropical', 'coastal'],
    amazonSearchFallback: 'waterproof+phone+pouch+lanyard+floating',
    affiliatePrice: '$10–20',
  },
  {
    id: 'elec-ereader',
    name: 'E-Reader / Tablet (optional)',
    category: 'electronics',
    description: 'Kindle Paperwhite is the standard. Hundreds of books, weeks of battery, beach-readable in sunlight.',
    essential: false,
    styles: ['midrange', 'luxury'],
    quantityMultiplier: 0,
    amazonSearchFallback: 'kindle+paperwhite+waterproof',
    affiliatePrice: '$140–200',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GEAR & ACCESSORIES (11 items)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_GEAR: PackingItem[] = [
  {
    id: 'gear-daypack',
    name: 'Daypack / Packable Backpack (20–25L)',
    category: 'gear',
    description: 'Separate from your main luggage for daily exploring. Packable ones fold to nothing.',
    essential: true,
    amazonSearchFallback: 'packable+daypack+20l+travel+lightweight',
    affiliatePrice: '$25–55',
  },
  {
    id: 'gear-waterbottle',
    name: 'Reusable Water Bottle',
    category: 'gear',
    description: 'Insulated bottle keeps water cold for hours in tropical heat. Reduces plastic waste too.',
    essential: true,
    amazonSearchFallback: 'insulated+water+bottle+32oz+travel',
    affiliatePrice: '$20–40',
  },
  {
    id: 'gear-sunglasses',
    name: 'Polarized Sunglasses',
    category: 'gear',
    description: 'Polarized lenses cut ocean glare and protect your eyes properly. Don\'t cheap out on this one.',
    essential: true,
    climate: ['tropical', 'coastal', 'desert'],
    amazonSearchFallback: 'polarized+sunglasses+uv400+travel',
    affiliatePrice: '$20–60',
  },
  {
    id: 'gear-towel',
    name: 'Quick-Dry Travel Towel',
    category: 'gear',
    description: 'Beach resorts provide towels. Island-hopping boats, waterfalls, and homestays don\'t.',
    essential: true,
    amazonSearchFallback: 'quick+dry+microfiber+travel+towel',
    affiliatePrice: '$15–30',
  },
  {
    id: 'gear-packing-cubes',
    name: 'Packing Cubes',
    category: 'gear',
    description: 'Game-changer for organization. Your bag stays tidy even after 3 weeks of living out of it.',
    essential: false,
    styles: ['midrange', 'luxury'],
    amazonSearchFallback: 'packing+cubes+set+travel+luggage',
    affiliatePrice: '$20–40',
  },
  {
    id: 'gear-drybag',
    name: 'Dry Bag (20L)',
    category: 'gear',
    description: 'Island hopping means your stuff rides in open boats. One wave and your unprotected gear is soaked.',
    essential: true,
    climate: ['tropical', 'coastal'],
    amazonSearchFallback: 'dry+bag+20l+waterproof+roll+top',
    affiliatePrice: '$18–35',
  },
  {
    id: 'gear-lock',
    name: 'Luggage Lock (TSA-Approved)',
    category: 'gear',
    description: 'For checked baggage and hostel lockers. TSA-approved so security can open without cutting it.',
    essential: false,
    styles: ['backpacker', 'midrange'],
    amazonSearchFallback: 'tsa+approved+luggage+lock+combination',
    affiliatePrice: '$8–15',
  },
  {
    id: 'gear-neckpillow',
    name: 'Neck Pillow (for long flights)',
    category: 'gear',
    description: 'Worth it for anything over 6 hours. Memory foam compressible ones are far better than inflatable.',
    essential: false,
    amazonSearchFallback: 'memory+foam+neck+pillow+travel+compressible',
    affiliatePrice: '$20–40',
  },
  {
    id: 'gear-bag',
    name: 'Reusable Shopping Bag',
    category: 'gear',
    description: 'Markets, beach trips, random purchases. Many countries now charge for plastic bags.',
    essential: false,
    quantityMultiplier: 0,
  },
  {
    id: 'gear-ziplock',
    name: 'Ziplock Bags (assorted)',
    category: 'gear',
    description: 'Wet clothes, snacks, liquids for carry-on, sand-proofing electronics. Pack 5–10.',
    essential: true,
    quantityMultiplier: 0,
  },
  {
    id: 'gear-umbrella',
    name: 'Compact Travel Umbrella',
    category: 'gear',
    description: 'Tropical downpours soak you in 30 seconds. A packable umbrella lives in your day bag and saves you from getting drenched on the way to dinner.',
    essential: true,
    climate: ['tropical'],
    seasons: ['rainy', 'shoulder'],
    amazonSearchFallback: 'compact+travel+umbrella+windproof+auto+open',
    affiliatePrice: '$15–30',
    localAlternative: 'Available at 7-Eleven and SM for about ₱200–400',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY GEAR — SNORKELING (5 items, conditional)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_ACTIVITY_SNORKELING: PackingItem[] = [
  {
    id: 'act-snorkel-mask',
    name: 'Snorkel Mask (own)',
    category: 'activity',
    description: 'Rental masks are often scratched or foggy and shared by hundreds of people. Your own costs $25 and lasts years.',
    essential: true,
    activities: ['snorkeling', 'diving'],
    amazonSearchFallback: 'snorkel+mask+set+anti+fog+cressi',
    affiliatePrice: '$20–50',
    localAlternative: 'Rentable at most dive shops for $3–8/day but quality varies',
  },
  {
    id: 'act-snorkel-fins',
    name: 'Fins (travel fins)',
    category: 'activity',
    description: 'Travel-size split fins or short blade fins fit in checked luggage. Full-size fins can be rented locally.',
    essential: false,
    activities: ['snorkeling', 'diving'],
    amazonSearchFallback: 'travel+snorkel+fins+short+blade',
    affiliatePrice: '$30–60',
    localAlternative: 'Rent locally for $2–5/day — perfectly reasonable',
  },
  {
    id: 'act-rashguard',
    name: 'Rash Guard / UV Shirt',
    category: 'activity',
    description: 'UPF 50+ protection while snorkeling. Reduces sunscreen needed, prevents jellyfish scratches.',
    essential: true,
    activities: ['snorkeling', 'diving', 'surfing'],
    climate: ['tropical', 'coastal'],
    amazonSearchFallback: 'rash+guard+upf50+long+sleeve+snorkeling',
    affiliatePrice: '$20–45',
  },
  {
    id: 'act-reef-sunscreen',
    name: 'Reef-Safe Sunscreen (snorkeling)',
    category: 'activity',
    description: 'Marine park rangers at many sites will turn you away with chemical sunscreen. Zinc oxide is mandatory.',
    essential: true,
    activities: ['snorkeling', 'diving'],
    climate: ['tropical', 'coastal'],
    amazonSearchFallback: 'reef+safe+sunscreen+zinc+oxide+snorkeling',
    affiliatePrice: '$14–25',
  },
  {
    id: 'act-gopro',
    name: 'Underwater Camera / GoPro',
    category: 'activity',
    description: 'GoPro HERO is the standard. Captures video your phone camera cannot touch underwater.',
    essential: false,
    activities: ['snorkeling', 'diving', 'photography'],
    amazonSearchFallback: 'gopro+hero+waterproof+action+camera',
    affiliatePrice: '$200–400',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY GEAR — HIKING (6 items, conditional)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_ACTIVITY_HIKING: PackingItem[] = [
  {
    id: 'act-hike-boots',
    name: 'Hiking Boots / Trail Shoes (broken in!)',
    category: 'activity',
    description: 'Break them in for at least 20 miles before your trip. Blisters from new boots on day 1 ruin everything.',
    essential: true,
    activities: ['hiking', 'camping'],
    amazonSearchFallback: 'waterproof+hiking+boots+trail+shoes',
    affiliatePrice: '$80–180',
  },
  {
    id: 'act-hike-poles',
    name: 'Trekking Poles (collapsible)',
    category: 'activity',
    description: 'Reduces knee impact by 30% on descents. Collapsible carbon poles pack down small.',
    essential: false,
    activities: ['hiking', 'camping'],
    amazonSearchFallback: 'collapsible+trekking+poles+carbon+fiber',
    affiliatePrice: '$40–100',
  },
  {
    id: 'act-hike-headlamp',
    name: 'Headlamp + Spare Batteries',
    category: 'activity',
    description: 'For pre-dawn summit starts, cave tours, and power outages. 200+ lumen minimum.',
    essential: true,
    activities: ['hiking', 'camping'],
    amazonSearchFallback: 'rechargeable+headlamp+200+lumen+hiking',
    affiliatePrice: '$18–40',
  },
  {
    id: 'act-hike-snacks',
    name: 'Trail Snacks / Energy Bars',
    category: 'activity',
    description: 'Pack more than you think for day hikes. Clif bars, jerky, nuts. Hard to find on trails.',
    essential: false,
    activities: ['hiking', 'camping'],
    quantityMultiplier: 0,
    localAlternative: 'Buy before the hike at local markets or convenience stores',
  },
  {
    id: 'act-hike-blister',
    name: 'Blister Kit (moleskin + sports tape)',
    category: 'activity',
    description: 'Moleskin on hot spots before blisters form. Carry this in your day bag every hike.',
    essential: true,
    activities: ['hiking'],
    amazonSearchFallback: 'moleskin+blister+prevention+kit+hiking',
    affiliatePrice: '$8–15',
  },
  {
    id: 'act-hike-repellent',
    name: 'Strong Insect Repellent (hiking)',
    category: 'activity',
    description: 'Trail insects are worse than beach insects. 40% DEET for jungle and forest trails.',
    essential: true,
    activities: ['hiking', 'camping'],
    climate: ['tropical'],
    amazonSearchFallback: '40+percent+deet+insect+repellent+jungle',
    affiliatePrice: '$8–15',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY GEAR — TEMPLES / CULTURAL SITES (3 items, conditional)
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_ACTIVITY_TEMPLES: PackingItem[] = [
  {
    id: 'act-temple-modest',
    name: 'Modest Clothing (covers shoulders + knees)',
    category: 'activity',
    description: 'Required at most temples and mosques. Keep a lightweight long-sleeve and pants accessible — not buried in your bag.',
    essential: true,
    activities: ['temples'],
    quantityMultiplier: 0,
  },
  {
    id: 'act-temple-slipon',
    name: 'Slip-On Shoes (easy removal)',
    category: 'activity',
    description: 'You\'ll remove shoes constantly at temples. Laced boots become frustrating fast.',
    essential: true,
    activities: ['temples'],
    quantityMultiplier: 0,
  },
  {
    id: 'act-temple-scarf',
    name: 'Small Scarf / Shawl',
    category: 'activity',
    description: 'Cover shoulders on short notice. Many temples loan sarongs but they\'re often worn and uncomfortable.',
    essential: false,
    activities: ['temples'],
    quantityMultiplier: 0,
    localAlternative: 'Buy one at the first market you visit — cheap and locally made',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FULL BASE ARRAY (all universal items)
// ─────────────────────────────────────────────────────────────────────────────
export const PACKING_BASE: PackingItem[] = [
  ...BASE_DOCUMENTS,
  ...BASE_CLOTHING_TROPICAL,
  ...BASE_CLOTHING_COLD,
  ...BASE_TOILETRIES,
  ...BASE_ELECTRONICS,
  ...BASE_GEAR,
  ...BASE_ACTIVITY_SNORKELING,
  ...BASE_ACTIVITY_HIKING,
  ...BASE_ACTIVITY_TEMPLES,
];
