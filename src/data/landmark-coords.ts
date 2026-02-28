// Popular Vietnam POI coordinates for itinerary geocoding.
// Keyed by lowercase normalized name. Covers top attractions.
// Used by generate-itinerary.ts to resolve activity coordinates without Geocoding API calls.

export const LANDMARK_COORDS: Record<string, { lat: number; lng: number }> = {
  // ── Ha Long Bay ──
  'ha long bay': { lat: 20.9101, lng: 107.1839 },
  'bai tu long bay': { lat: 21.0500, lng: 107.4500 },
  'cat ba island': { lat: 20.7273, lng: 106.9990 },
  'sung sot cave': { lat: 20.9000, lng: 107.1600 },
  'ti top island': { lat: 20.9200, lng: 107.1700 },

  // ── Hanoi ──
  'hoan kiem lake': { lat: 21.0288, lng: 105.8525 },
  'old quarter hanoi': { lat: 21.0340, lng: 105.8510 },
  'ho chi minh mausoleum': { lat: 21.0368, lng: 105.8352 },
  'temple of literature': { lat: 21.0286, lng: 105.8354 },
  'west lake hanoi': { lat: 21.0530, lng: 105.8230 },
  'noi bai international airport': { lat: 21.2212, lng: 105.8070 },
  'hanoi airport': { lat: 21.2212, lng: 105.8070 },
  'train street hanoi': { lat: 21.0240, lng: 105.8440 },
  'dong xuan market': { lat: 21.0385, lng: 105.8500 },

  // ── Ho Chi Minh City ──
  'cu chi tunnels': { lat: 11.1425, lng: 106.4619 },
  'ben thanh market': { lat: 10.7725, lng: 106.6980 },
  'war remnants museum': { lat: 10.7794, lng: 106.6922 },
  'notre dame cathedral saigon': { lat: 10.7798, lng: 106.6990 },
  'independence palace': { lat: 10.7769, lng: 106.6955 },
  'tan son nhat international airport': { lat: 10.8188, lng: 106.6520 },
  'saigon airport': { lat: 10.8188, lng: 106.6520 },
  'bui vien walking street': { lat: 10.7680, lng: 106.6930 },

  // ── Hue ──
  'imperial city hue': { lat: 16.4698, lng: 107.5786 },
  'thien mu pagoda': { lat: 16.4538, lng: 107.5430 },
  'khai dinh tomb': { lat: 16.4040, lng: 107.5850 },
  'tu duc tomb': { lat: 16.4370, lng: 107.5610 },
  'phu bai airport': { lat: 16.4015, lng: 107.7028 },

  // ── Hoi An ──
  'japanese covered bridge': { lat: 15.8794, lng: 108.3276 },
  'an bang beach': { lat: 15.8950, lng: 108.3550 },
  'cua dai beach': { lat: 15.8750, lng: 108.3660 },
  'hoi an ancient town': { lat: 15.8801, lng: 108.3380 },
  'my son sanctuary': { lat: 15.7637, lng: 108.1224 },

  // ── Da Nang ──
  'marble mountains': { lat: 16.0040, lng: 108.2630 },
  'dragon bridge da nang': { lat: 16.0610, lng: 108.2270 },
  'my khe beach': { lat: 16.0450, lng: 108.2480 },
  'ba na hills': { lat: 15.9958, lng: 107.9920 },
  'golden bridge': { lat: 15.9958, lng: 107.9920 },
  'da nang airport': { lat: 16.0439, lng: 108.1994 },

  // ── Sapa ──
  'sapa rice terraces': { lat: 22.3363, lng: 103.8438 },
  'fansipan peak': { lat: 22.3033, lng: 103.7750 },
  'cat cat village': { lat: 22.3230, lng: 103.8360 },
  'lao chai village': { lat: 22.2980, lng: 103.8260 },

  // ── Nha Trang ──
  'vinpearl nha trang': { lat: 12.2200, lng: 109.2200 },
  'po nagar towers': { lat: 12.2650, lng: 109.1960 },
  'nha trang beach': { lat: 12.2450, lng: 109.2000 },
  'long son pagoda': { lat: 12.2497, lng: 109.1770 },
  'cam ranh airport': { lat: 11.9982, lng: 109.2194 },

  // ── Phu Quoc ──
  'sao beach phu quoc': { lat: 10.1580, lng: 104.0250 },
  'long beach phu quoc': { lat: 10.2150, lng: 103.9560 },
  'phu quoc night market': { lat: 10.2160, lng: 103.9680 },
  'vinwonders phu quoc': { lat: 10.0790, lng: 103.9670 },
  'phu quoc airport': { lat: 10.1700, lng: 103.9930 },

  // ── Dalat ──
  'xuan huong lake': { lat: 11.9430, lng: 108.4420 },
  'crazy house dalat': { lat: 11.9340, lng: 108.4310 },
  'datanla waterfall': { lat: 11.9080, lng: 108.4410 },
  'dalat flower garden': { lat: 11.9460, lng: 108.4430 },

  // ── Ninh Binh ──
  'tam coc': { lat: 20.2150, lng: 105.9370 },
  'trang an': { lat: 20.2506, lng: 105.9100 },
  'mua cave': { lat: 20.2170, lng: 105.9230 },
  'bai dinh pagoda': { lat: 20.2740, lng: 105.8510 },

  // ── Phong Nha ──
  'phong nha cave': { lat: 17.5929, lng: 106.2831 },
  'paradise cave': { lat: 17.5400, lng: 106.2130 },
  'son doong cave': { lat: 17.5450, lng: 106.1420 },
  'dark cave phong nha': { lat: 17.5870, lng: 106.2710 },

  // ── Mekong Delta ──
  'mekong delta': { lat: 10.0452, lng: 105.7469 },
  'cai rang floating market': { lat: 10.0180, lng: 105.7380 },

  // ── Mui Ne ──
  'red sand dunes': { lat: 10.9430, lng: 108.3130 },
  'white sand dunes': { lat: 11.0480, lng: 108.4180 },
  'fairy stream mui ne': { lat: 10.9420, lng: 108.2900 },
};
