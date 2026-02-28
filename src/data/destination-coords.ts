// Shared destination coordinates — single source of truth
// Vietnam destinations. Used by plan page + companion app + generate-itinerary API.

export const DESTINATION_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  hanoi: { lat: 21.0285, lng: 105.8542, label: 'Hanoi' },
  'ho-chi-minh-city': { lat: 10.8231, lng: 106.6297, label: 'Ho Chi Minh City' },
  'da-nang': { lat: 16.0544, lng: 108.2022, label: 'Da Nang' },
  'hoi-an': { lat: 15.8801, lng: 108.3380, label: 'Hoi An' },
  hue: { lat: 16.4637, lng: 107.5909, label: 'Hue' },
  'ha-long-bay': { lat: 20.9101, lng: 107.1839, label: 'Ha Long Bay' },
  sapa: { lat: 22.3363, lng: 103.8438, label: 'Sapa' },
  'nha-trang': { lat: 12.2388, lng: 109.1967, label: 'Nha Trang' },
  'phu-quoc': { lat: 10.2270, lng: 103.9684, label: 'Phu Quoc' },
  dalat: { lat: 11.9404, lng: 108.4583, label: 'Dalat' },
  'ninh-binh': { lat: 20.2506, lng: 105.9745, label: 'Ninh Binh' },
  'mui-ne': { lat: 10.9370, lng: 108.2874, label: 'Mui Ne' },
  'can-tho': { lat: 10.0452, lng: 105.7469, label: 'Can Tho' },
};
