export interface NetworkSite {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  url: string;
  flag: string;
  region: 'hub' | 'southeast-asia' | 'east-asia' | 'mexico' | 'us-west' | 'us-central' | 'us-east' | 'south-america' | 'caribbean' | 'europe';
  status: 'live' | 'coming-soon';
  tagline: string;
}

export const NETWORK_SITES: NetworkSite[] = [
  { id: 'hub', name: 'Discover More Travel', shortName: 'Hub', domain: 'discovermore.travel', url: 'https://discovermore.travel', flag: '\u{1F30D}', region: 'hub', status: 'live', tagline: 'Your gateway to authentic travel worldwide' },
  // Southeast Asia
  { id: 'philippines', name: 'Discover Philippines', shortName: 'Philippines', domain: 'discoverphilippines.info', url: 'https://discoverphilippines.info', flag: '\u{1F1F5}\u{1F1ED}', region: 'southeast-asia', status: 'live', tagline: 'Immersive guides to 7,641 islands' },
  { id: 'thailand', name: 'Discover Thailand', shortName: 'Thailand', domain: 'discoverthailand.info', url: 'https://discoverthailand.info', flag: '\u{1F1F9}\u{1F1ED}', region: 'southeast-asia', status: 'coming-soon', tagline: 'Temples, street food, and tropical beaches' },
  { id: 'cambodia', name: 'Discover Cambodia', shortName: 'Cambodia', domain: 'discovercambodia.info', url: 'https://discovercambodia.info', flag: '\u{1F1F0}\u{1F1ED}', region: 'southeast-asia', status: 'coming-soon', tagline: 'Ancient temples and hidden coastlines' },
  { id: 'laos', name: 'Discover Laos', shortName: 'Laos', domain: 'discoverlaos.info', url: 'https://discoverlaos.info', flag: '\u{1F1F1}\u{1F1E6}', region: 'southeast-asia', status: 'coming-soon', tagline: 'Waterfalls, monks, and the Mekong' },
  { id: 'vietnam', name: 'Discover Vietnam', shortName: 'Vietnam', domain: 'discovervietnam.info', url: 'https://discovervietnam.info', flag: '\u{1F1FB}\u{1F1F3}', region: 'southeast-asia', status: 'coming-soon', tagline: 'From Ha Long Bay to the Mekong Delta' },
  // East Asia
  { id: 'japan', name: 'Discover Japan', shortName: 'Japan', domain: 'discoverjapan.info', url: 'https://discoverjapan.info', flag: '\u{1F1EF}\u{1F1F5}', region: 'east-asia', status: 'coming-soon', tagline: 'Cherry blossoms, shrines, and culinary mastery' },
  // Mexico
  { id: 'baja', name: 'Discover Baja', shortName: 'Baja', domain: 'discoverbaja.info', url: 'https://discoverbaja.info', flag: '\u{1F1F2}\u{1F1FD}', region: 'mexico', status: 'live', tagline: 'Tacos, surf breaks, and desert landscapes' },
  // US West
  { id: 'san-diego', name: 'Discover San Diego', shortName: 'San Diego', domain: 'discoversandiego.info', url: 'https://discoversandiego.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Sun, surf, and craft beer culture' },
  { id: 'california', name: 'Discover California', shortName: 'California', domain: 'discovercali.info', url: 'https://discovercali.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Coast, mountains, and wine country' },
  { id: 'hawaii', name: 'Discover Hawaii', shortName: 'Hawaii', domain: 'discoverhawaii.info', url: 'https://discoverhawaii.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Volcanoes, reefs, and aloha spirit' },
  { id: 'alaska', name: 'Discover Alaska', shortName: 'Alaska', domain: 'discoveralaska.info', url: 'https://discoveralaska.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Glaciers, wildlife, and the last frontier' },
  { id: 'utah', name: 'Discover Utah', shortName: 'Utah', domain: 'discoverutah.info', url: 'https://discoverutah.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Red rock arches, slot canyons, and the Mighty Five' },
  { id: 'colorado', name: 'Discover Colorado', shortName: 'Colorado', domain: 'discovercolorado.info', url: 'https://discovercolorado.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Rocky Mountain peaks and legendary ski towns' },
  { id: 'arizona', name: 'Discovering Arizona', shortName: 'Arizona', domain: 'discoveringarizona.info', url: 'https://discoveringarizona.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Grand Canyon, Sedona red rocks, and desert sunsets' },
  { id: 'nevada', name: 'Discover Nevada', shortName: 'Nevada', domain: 'discovernevada.info', url: 'https://discovernevada.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-west', status: 'coming-soon', tagline: 'Beyond the Strip — neon nights and desert roads' },
  // US Central
  { id: 'midwest', name: 'Discover Midwest', shortName: 'Midwest', domain: 'discovermidwest.info', url: 'https://discovermidwest.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-central', status: 'coming-soon', tagline: "Great Lakes, skyline cities, and America's heartland" },
  { id: 'texas', name: 'Discover Texas', shortName: 'Texas', domain: 'discovertexas.info', url: 'https://discovertexas.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-central', status: 'coming-soon', tagline: 'Legendary BBQ, live music, and Big Bend wilderness' },
  // US East
  { id: 'florida', name: 'Discover Florida', shortName: 'Florida', domain: 'discoverflorida.info', url: 'https://discoverflorida.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-east', status: 'coming-soon', tagline: 'Beaches, everglades, and theme parks' },
  { id: 'new-england', name: 'Discover New England', shortName: 'New England', domain: 'discovernewengland.info', url: 'https://discovernewengland.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-east', status: 'coming-soon', tagline: 'Fall foliage, lobster, and colonial history' },
  { id: 'new-york', name: 'Discovering New York', shortName: 'New York', domain: 'discoveringnewyork.info', url: 'https://discoveringnewyork.info', flag: '\u{1F1FA}\u{1F1F8}', region: 'us-east', status: 'coming-soon', tagline: 'Iconic neighborhoods, world-class food, and hidden gems' },
  // South America
  { id: 'colombia', name: 'Discovering Colombia', shortName: 'Colombia', domain: 'discoveringcolombia.info', url: 'https://discoveringcolombia.info', flag: '\u{1F1E8}\u{1F1F4}', region: 'south-america', status: 'coming-soon', tagline: "Colonial walls, mountain views, and South America's surprise" },
  { id: 'brazil', name: 'Discover Brazil', shortName: 'Brazil', domain: 'discoverbrazil.info', url: 'https://discoverbrazil.info', flag: '\u{1F1E7}\u{1F1F7}', region: 'south-america', status: 'coming-soon', tagline: 'Rhythm, rainforest, and endless coastline' },
  // Caribbean
  { id: 'dr', name: 'Discover DR', shortName: 'Dominican Republic', domain: 'discoverdr.info', url: 'https://discoverdr.info', flag: '\u{1F1E9}\u{1F1F4}', region: 'caribbean', status: 'coming-soon', tagline: 'Turquoise waters and colonial history' },
  { id: 'puerto-rico', name: 'Discover Puerto Rico', shortName: 'Puerto Rico', domain: 'discoverpuertorico.info', url: 'https://discoverpuertorico.info', flag: '\u{1F1F5}\u{1F1F7}', region: 'caribbean', status: 'coming-soon', tagline: 'Old San Juan, bioluminescent bays, and El Yunque' },
  // Europe
  { id: 'amsterdam', name: 'Discover Amsterdam', shortName: 'Amsterdam', domain: 'discoveramsterdam.info', url: 'https://discoveramsterdam.info', flag: '\u{1F1F3}\u{1F1F1}', region: 'europe', status: 'coming-soon', tagline: 'Canals, culture, and Dutch charm' },
  { id: 'greece', name: 'Discovering Greece', shortName: 'Greece', domain: 'discoveringgreece.info', url: 'https://discoveringgreece.info', flag: '\u{1F1EC}\u{1F1F7}', region: 'europe', status: 'coming-soon', tagline: 'Ancient stones and Aegean blue' },
  { id: 'italy', name: 'Discovering Italy', shortName: 'Italy', domain: 'discoveringitaly.info', url: 'https://discoveringitaly.info', flag: '\u{1F1EE}\u{1F1F9}', region: 'europe', status: 'coming-soon', tagline: "Eternal streets and cliffside villages" },
  { id: 'eastern-europe', name: 'Discover Eastern Europe', shortName: 'Eastern Europe', domain: 'discovereasterneurope.info', url: 'https://discovereasterneurope.info', flag: '\u{1F1EA}\u{1F1FA}', region: 'europe', status: 'coming-soon', tagline: 'Capitals by rail — Istanbul to Prague and beyond' },
  { id: 'germany', name: 'Discover Germany', shortName: 'Germany', domain: 'discovergermany.info', url: 'https://discovergermany.info', flag: '\u{1F1E9}\u{1F1EA}', region: 'europe', status: 'coming-soon', tagline: 'Fairy-tale castles and world-class beer halls' },
];

export const HUB_URL = 'https://discovermore.travel';

export const NETWORK_REGIONS = [
  { id: 'southeast-asia', label: 'Southeast Asia' },
  { id: 'east-asia', label: 'East Asia' },
  { id: 'mexico', label: 'Mexico' },
  { id: 'us-west', label: 'US West' },
  { id: 'us-central', label: 'US Central' },
  { id: 'us-east', label: 'US East' },
  { id: 'south-america', label: 'South America' },
  { id: 'caribbean', label: 'Caribbean' },
  { id: 'europe', label: 'Europe' },
] as const;

export const CURRENT_SITE_ID = 'vietnam';

export function getSitesByRegion(region: string): NetworkSite[] {
  return NETWORK_SITES.filter((s) => s.region === region);
}

export function getHub(): NetworkSite {
  return NETWORK_SITES.find((s) => s.region === 'hub')!;
}
