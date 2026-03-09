export const NETWORK_CLUSTERS: Record<string, { name: string; sites: { label: string; url: string }[] }> = {
  'southeast-asia': {
    name: 'Southeast Asia',
    sites: [
      { label: 'Philippines', url: 'https://discoverphilippines.info' },
      { label: 'Thailand', url: 'https://discoverthailand.info' },
      { label: 'Cambodia', url: 'https://discovercambodia.info' },
      { label: 'Vietnam', url: 'https://discovervietnam.info' },
      { label: 'Laos', url: 'https://discoverlaos.info' },
      { label: 'Indonesia', url: 'https://discoverindonesia.info' },
      { label: 'Malaysia', url: 'https://discovermalaysia.info' },
      { label: 'Singapore', url: 'https://discoversingapore.info' },
    ],
  },
  'east-asia': {
    name: 'East Asia',
    sites: [
      { label: 'Japan', url: 'https://discoverjapan.info' },
      { label: 'Korea', url: 'https://discoverkorea.info' },
      { label: 'Hong Kong', url: 'https://discoveringhongkong.info' },
      { label: 'Macau', url: 'https://discovermacau.info' },
    ],
  },
  'us-west': {
    name: 'US West',
    sites: [
      { label: 'California', url: 'https://discovercali.info' },
      { label: 'San Diego', url: 'https://discoversandiego.info' },
      { label: 'Arizona', url: 'https://discoveringarizona.info' },
      { label: 'Nevada', url: 'https://discovernevada.info' },
      { label: 'Utah', url: 'https://discoverutah.info' },
      { label: 'Colorado', url: 'https://discovercolorado.info' },
      { label: 'Alaska', url: 'https://discoveralaska.info' },
      { label: 'Hawaii', url: 'https://discoverhawaii.info' },
    ],
  },
  'north-america': {
    name: 'North America',
    sites: [
      { label: 'Canada', url: 'https://discoveringcanada.info' },
      { label: 'Florida', url: 'https://discoverflorida.info' },
      { label: 'Texas', url: 'https://discovertexas.info' },
      { label: 'New York', url: 'https://discoveringnewyork.info' },
      { label: 'New England', url: 'https://discovernewengland.info' },
      { label: 'Midwest', url: 'https://discovermidwest.info' },
    ],
  },
  'caribbean-latam': {
    name: 'Caribbean & Latin America',
    sites: [
      { label: 'Mexico', url: 'https://discovermexico.info' },
      { label: 'Baja', url: 'https://discoverbaja.info' },
      { label: 'Cuba', url: 'https://discovercuba.info' },
      { label: 'Puerto Rico', url: 'https://discoverpuertorico.info' },
      { label: 'Dominican Republic', url: 'https://discoverdr.info' },
      { label: 'Colombia', url: 'https://discoveringcolombia.info' },
      { label: 'Brazil', url: 'https://discoverbrazil.info' },
    ],
  },
  'europe': {
    name: 'Europe',
    sites: [
      { label: 'Amsterdam', url: 'https://discoveramsterdam.info' },
      { label: 'Germany', url: 'https://discovergermany.info' },
      { label: 'Greece', url: 'https://discoveringgreece.info' },
      { label: 'Italy', url: 'https://discoveringitaly.info' },
      { label: 'Switzerland', url: 'https://discoverswitzerland.info' },
      { label: 'Turkey', url: 'https://discoveringturkey.info' },
      { label: 'Eastern Europe', url: 'https://discovereasterneurope.info' },
    ],
  },
  'africa-south-asia': {
    name: 'Africa & South Asia',
    sites: [
      { label: 'South Africa', url: 'https://discoversouthafrica.info' },
      { label: 'India', url: 'https://discoverindia.info' },
    ],
  },
};
