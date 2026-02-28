export interface NetworkSite {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  url: string;
  flag: string;
  region: 'hub' | 'southeast-asia' | 'east-asia' | 'americas';
  status: 'live' | 'coming-soon';
  tagline: string;
}

export const NETWORK_SITES: NetworkSite[] = [
  // Hub
  {
    id: 'hub',
    name: 'Discover More Travel',
    shortName: 'Hub',
    domain: 'discovermore.travel',
    url: 'https://discovermore.travel',
    flag: '🌍',
    region: 'hub',
    status: 'coming-soon',
    tagline: 'Your gateway to authentic travel worldwide',
  },
  // Southeast Asia
  {
    id: 'thailand',
    name: 'Discover Thailand',
    shortName: 'Thailand',
    domain: 'discoverthailand.info',
    url: 'https://discoverthailand.info',
    flag: '🇹🇭',
    region: 'southeast-asia',
    status: 'coming-soon',
    tagline: 'Temples, street food, and tropical beaches',
  },
  {
    id: 'cambodia',
    name: 'Discover Cambodia',
    shortName: 'Cambodia',
    domain: 'discovercambodia.info',
    url: 'https://discovercambodia.info',
    flag: '🇰🇭',
    region: 'southeast-asia',
    status: 'live',
    tagline: 'Ancient temples and hidden coastlines',
  },
  {
    id: 'laos',
    name: 'Discover Laos',
    shortName: 'Laos',
    domain: 'discoverlaos.info',
    url: 'https://discoverlaos.info',
    flag: '🇱🇦',
    region: 'southeast-asia',
    status: 'coming-soon',
    tagline: 'Waterfalls, monks, and the Mekong',
  },
  {
    id: 'vietnam',
    name: 'Discover Vietnam',
    shortName: 'Vietnam',
    domain: 'discovervietnam.info',
    url: 'https://discovervietnam.info',
    flag: '🇻🇳',
    region: 'southeast-asia',
    status: 'live',
    tagline: 'From Ha Long Bay to the Mekong Delta',
  },
  // East Asia
  {
    id: 'japan',
    name: 'Discover Japan',
    shortName: 'Japan',
    domain: 'discoverjapan.info',
    url: 'https://discoverjapan.info',
    flag: '🇯🇵',
    region: 'east-asia',
    status: 'coming-soon',
    tagline: 'Cherry blossoms, shrines, and culinary mastery',
  },
  // Americas
  {
    id: 'baja',
    name: 'Discover Baja',
    shortName: 'Baja',
    domain: 'discoverbaja.info',
    url: 'https://discoverbaja.info',
    flag: '🇲🇽',
    region: 'americas',
    status: 'live',
    tagline: 'Tacos, surf breaks, and desert landscapes',
  },
  {
    id: 'san-diego',
    name: 'Discover San Diego',
    shortName: 'San Diego',
    domain: 'discoversandiego.info',
    url: 'https://discoversandiego.info',
    flag: '🇺🇸',
    region: 'americas',
    status: 'coming-soon',
    tagline: 'Sun, surf, and craft beer culture',
  },
  {
    id: 'california',
    name: 'Discover California',
    shortName: 'California',
    domain: 'discovercalifornia.info',
    url: 'https://discovercalifornia.info',
    flag: '🇺🇸',
    region: 'americas',
    status: 'coming-soon',
    tagline: 'Coast, mountains, and wine country',
  },
  {
    id: 'hawaii',
    name: 'Discover Hawaii',
    shortName: 'Hawaii',
    domain: 'discoverhawaii.info',
    url: 'https://discoverhawaii.info',
    flag: '🇺🇸',
    region: 'americas',
    status: 'coming-soon',
    tagline: 'Volcanoes, reefs, and aloha spirit',
  },
  {
    id: 'florida',
    name: 'Discover Florida',
    shortName: 'Florida',
    domain: 'discoverflorida.info',
    url: 'https://discoverflorida.info',
    flag: '🇺🇸',
    region: 'americas',
    status: 'coming-soon',
    tagline: 'Beaches, everglades, and theme parks',
  },
  {
    id: 'new-england',
    name: 'Discover New England',
    shortName: 'New England',
    domain: 'discovernewengland.info',
    url: 'https://discovernewengland.info',
    flag: '🇺🇸',
    region: 'americas',
    status: 'coming-soon',
    tagline: 'Fall foliage, lobster, and colonial history',
  },
  {
    id: 'alaska',
    name: 'Discover Alaska',
    shortName: 'Alaska',
    domain: 'discoveralaska.info',
    url: 'https://discoveralaska.info',
    flag: '🇺🇸',
    region: 'americas',
    status: 'coming-soon',
    tagline: 'Glaciers, wildlife, and the last frontier',
  },
];

export const HUB_URL = 'https://discovermore.travel';

export const NETWORK_REGIONS = [
  { id: 'southeast-asia', label: 'Southeast Asia' },
  { id: 'east-asia', label: 'East Asia' },
  { id: 'americas', label: 'Americas' },
] as const;

export const CURRENT_SITE_ID = 'vietnam';

export function getSitesByRegion(region: string): NetworkSite[] {
  return NETWORK_SITES.filter((s) => s.region === region);
}

export function getHub(): NetworkSite {
  return NETWORK_SITES.find((s) => s.region === 'hub')!;
}
