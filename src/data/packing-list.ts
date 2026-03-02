import type { PackingItem, PackingConfig, GearRecommendation } from './packing-base';

export const VIETNAM_ESSENTIALS: PackingItem[] = [
  { id: 'vn-adapter', name: 'Type A/C/F Power Adapter', category: 'destination', description: 'Vietnam officially uses Type A and C plugs at 220V/50Hz. Many hotels have universal sockets, but rural guesthouses and homestays in Sapa and the Mekong Delta often do not. A universal travel adapter covers all scenarios — buy before departure.', essential: true, amazonSearchFallback: 'universal+power+adapter+type+c+travel', affiliatePrice: '$12–20' },
  { id: 'vn-rain', name: 'Lightweight Rain Jacket', category: 'destination', description: 'Vietnam has two monsoon seasons depending on region. The north (Hanoi, Sapa) gets rain May–September; the south (Ho Chi Minh City, Mekong) gets rain June–November; central Vietnam (Hoi An) gets heavy rain October–December. A packable rain jacket is essential year-round somewhere in Vietnam.', essential: true, amazonSearchFallback: 'packable+rain+jacket+lightweight+travel', affiliatePrice: '$35–75' },
  { id: 'vn-cash', name: 'Vietnamese Dong (VND) Cash', category: 'destination', description: 'Vietnam is still largely cash-based outside major hotels. Street food, markets, motorbike rentals, and rural guesthouses are cash-only. Vietcombank and BIDV ATMs have the best rates. Withdraw large amounts — fees apply per transaction. Carry small denominations for street food (₫20,000–50,000).', essential: true, amazonSearchFallback: 'travel+money+belt+rfid+slim', affiliatePrice: '$15–25' },
  { id: 'vn-mosquito', name: 'DEET Mosquito Repellent', category: 'destination', description: 'Dengue fever is endemic in Vietnam and transmitted by day-biting mosquitoes. The Mekong Delta, Phu Quoc, and rural areas have the highest risk. DEET 30%+ is recommended. Apply before outdoor activities — not just at night. Vietnamese brands exist but quality varies; bring a reliable brand from home.', essential: true, amazonSearchFallback: 'deet+mosquito+repellent+30+percent+travel', affiliatePrice: '$8–18' },
];

export const VIETNAM_GEAR_RECOMMENDATIONS: GearRecommendation[] = [
  { id: 'gr-vn-daypack', name: 'Anti-Theft Daypack', reason: "Hanoi's Old Quarter and Ho Chi Minh City's Ben Thanh Market area are bag-snatch hotspots, often from passing motorbikes. A bag that closes securely and crosses your body rather than hanging open is not optional — it's basic safety.", amazonSearchFallback: 'anti+theft+crossbody+bag+travel+secure', affiliatePrice: '~$45' },
  { id: 'gr-vn-rain', name: 'Packable Rain Jacket', reason: 'Vietnam has regional monsoons year-round. Even in dry season, afternoon showers appear in the highlands (Sapa, Da Lat). A packable jacket compresses to fist-size and weighs under a pound — worth carrying every day in Vietnam.', amazonSearchFallback: 'packable+rain+jacket+lightweight+compact', affiliatePrice: '~$55' },
  { id: 'gr-vn-sandals', name: 'Sturdy Walking Sandals', reason: "Vietnam's heat and humidity make closed shoes miserable after a few hours. Quality walking sandals (Teva or Birkenstock-style) handle Hoi An's ancient town, beach walking, and casual temple visits. Leave trail runners for Sapa trekking.", amazonSearchFallback: 'walking+sandals+arch+support+travel+adjustable', affiliatePrice: '~$60' },
  { id: 'gr-vn-mosquito', name: 'DEET 30%+ Repellent', reason: 'Dengue is endemic in Vietnam and peaks June–November. Day-biting Aedes mosquitoes are the vector — sunscreen-first, repellent-second application order matters. Vietnamese pharmacy repellent is weak; bring your own proven formula.', amazonSearchFallback: 'deet+mosquito+repellent+30+percent+spray', affiliatePrice: '~$12' },
  { id: 'gr-vn-stomach', name: 'Probiotic + Digestive Support', reason: "Vietnam's street food is the highlight of the trip — and the most common source of traveler's stomach. A probiotic taken daily before and during travel, plus loperamide for emergencies, keeps you on the street food trail rather than near the bathroom.", amazonSearchFallback: 'probiotic+travel+digestive+support+capsules', affiliatePrice: '~$20' },
];

export const VIETNAM_CONFIG: PackingConfig = {
  sitePrefix: 'dvn',
  destination: 'Vietnam',
  climate: ['tropical', 'temperate', 'highland'],
  currency: 'VND',
  plugType: 'Type A/C/F',
  plugVoltage: '220V',
  affiliateTag: 'discoverviet-20',
  destinationEssentials: VIETNAM_ESSENTIALS,
  gearRecommendations: VIETNAM_GEAR_RECOMMENDATIONS,
};

export const SITE_CONFIG = VIETNAM_CONFIG;

export const VIETNAM_PACKING_FAQS = [
  { question: 'What should I pack for Vietnam?', answer: 'The Vietnam essentials: a universal power adapter (220V, Type A/C/F), DEET 30%+ mosquito repellent (dengue is endemic), Vietnamese Dong cash (Vietnam is largely cash-based), and a packable rain jacket (regional monsoons hit different areas year-round). Lightweight layers for the highlands (Sapa hits near-freezing in winter) and reef-safe sunscreen for Phu Quoc and Ha Long Bay.' },
  { question: 'Do I need a visa for Vietnam?', answer: 'Most nationalities need an e-Visa, obtained online before arrival at evisa.gov.vn. The e-Visa costs $25 USD and is valid for 90 days, single or multiple entry. Citizens of select countries (including UK and several EU nations) have visa-free access for varying periods. Always check current rules before departure — Vietnam visa policy changes frequently.' },
  { question: 'What power adapter do I need for Vietnam?', answer: 'Vietnam officially uses Type A and C plugs at 220V/50Hz. Many modern hotels have universal sockets, but rural guesthouses do not. A universal travel adapter is safest. Check that your electronics are dual-voltage (100–240V) — most modern chargers and laptops are, but older hair dryers and electric shavers may not be.' },
  { question: 'Is Vietnam safe for tourists?', answer: 'Vietnam is generally very safe for tourists. The main risks are traffic (motorbike culture is intense — cross streets slowly and confidently, never stop mid-road), bag snatching from motorbikes in busy markets (use a secure crossbody bag), and street food stomach issues (start with cooked foods, work up to raw dishes). Violent crime against tourists is extremely rare.' },
  { question: 'What should I pack for Sapa trekking?', answer: 'Sapa is cold and wet year-round — temperatures drop below freezing December–February. Pack: waterproof hiking boots (trails are muddy most of the year), a warm mid-layer (fleece), a waterproof shell jacket, and quick-dry hiking pants. Even in summer, Sapa mornings start at 55–60°F. The rice terrace views are worth every extra layer.' },
  { question: 'What should I NOT bring to Vietnam?', answer: 'Skip expensive jewelry and electronics you cannot afford to lose (bag snatching is real in cities), heavy clothing for tropical destinations (buy lightweight clothing in Hoi An markets for a fraction of Western prices), and single-use plastic items — Vietnam has a plastic waste problem and bringing reusables is both practical and respectful.' },
];
