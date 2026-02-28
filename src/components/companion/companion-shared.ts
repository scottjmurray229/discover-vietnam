// ═══════════════════════════════════════════
// TRIP COMPANION — Shared types & constants
// ═══════════════════════════════════════════

export const COLORS = {
  oceanTeal: '#0D7377',
  oceanDeep: '#064E56',
  oceanDark: '#0B3D42',
  warmCoral: '#E8654A',
  coralHover: '#D4553B',
  deepNight: '#1A2332',
  slate: '#4A5568',
  sand: '#F5F0E8',
  sandDark: '#EBE4D8',
  sandLight: '#FFF8ED',
  sky: '#E8F4F5',
  white: '#FFFFFF',
  palm: '#2D8A4E',
  palmLight: '#E8F5EC',
  sun: '#F2B531',
  sunLight: '#FFF9E6',
  coralLight: '#FFF3ED',
  purple: '#7C3AED',
  purpleLight: '#F0E8FF',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  gray100: '#F7F7F8',
  gray200: '#E8E8EC',
  gray400: '#9CA3AF',
  gray600: '#6B7280',
  gray800: '#374151',
  red: '#DC2626',
  redLight: '#FEE2E2',
};

export type TabId = 'trip' | 'map' | 'edit' | 'updates' | 'history' | 'tools';

export const TAB_CONFIG: { id: TabId; icon: string; label: string }[] = [
  { id: 'trip', icon: '📋', label: 'Trip' },
  { id: 'map', icon: '🗺️', label: 'Map' },
  { id: 'edit', icon: '✏️', label: 'Edit' },
  { id: 'updates', icon: '🔔', label: 'Updates' },
  { id: 'history', icon: '📜', label: 'History' },
  { id: 'tools', icon: '🧰', label: 'Tools' },
];

export const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚐',
  activity: '🎯',
  food: '🍽️',
  accommodation: '🏨',
};

export const CATEGORY_BG: Record<string, string> = {
  transport: '#E8F4F8',
  activity: '#E8F5EC',
  food: '#FFF3ED',
  accommodation: '#F0E8FF',
};

export const STATUS_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: COLORS.palmLight, color: COLORS.palm, label: 'Confirmed' },
  changed: { bg: '#FFF3ED', color: COLORS.warmCoral, label: 'Changed' },
  weather_watch: { bg: COLORS.sunLight, color: '#B8860B', label: 'Weather Watch' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
  tentative: { bg: COLORS.blueLight, color: COLORS.blue, label: 'Tentative' },
};

// ── Type definitions ──

export interface Activity {
  id: string;
  time: string;
  icon: string;
  type: 'transport' | 'activity' | 'food' | 'accommodation';
  title: string;
  detail: string;
  directions?: string;
  status: 'confirmed' | 'changed' | 'weather_watch' | 'cancelled' | 'tentative';
  changeNote?: string;
  changedBy?: string;
  weatherNote?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface TripDay {
  day: number;
  date: string;
  title: string;
  location: string;
  items: Activity[];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface WeatherDay {
  day: string;
  icon: string;
  high: number;
  low: number;
  rain: number;
}

export interface Contact {
  icon: string;
  name: string;
  role: string;
  phone: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'editor' | 'viewer';
  color: string;
}

export interface Notification {
  id: number;
  type: 'change' | 'weather' | 'enriched' | 'sync' | 'currency';
  by?: string;
  text: string;
  time: string;
  read: boolean;
}

export interface ChangeLogEntry {
  id: number;
  type: 'moved' | 'added' | 'removed' | 'swapped' | 'time_changed' | 'note' | 'edited';
  by: string;
  time: string;
  title: string;
  from?: string;
  to?: string;
  detail?: string;
  reason?: string;
  day: number;
  synced: boolean;
}

export interface TripData {
  name: string;
  subtitle: string;
  dates: string;
  days: TripDay[];
  weather: WeatherDay[];
  contacts: Contact[];
  group: GroupMember[];
  notifications: Notification[];
  changeLog: ChangeLogEntry[];
}

// ── Helper functions ──

export function getMember(group: GroupMember[], id: string): GroupMember | undefined {
  return group.find((m) => m.id === id);
}
