import { useState, useCallback, useEffect } from 'react';
import { COLORS, TAB_CONFIG } from './companion-shared';
import type { TabId, TripData, Activity, ChangeLogEntry } from './companion-shared';
import mockTrip from '../../data/mock-trip-vietnam.json';
import TripTab from './tabs/TripTab';
import EditTab from './tabs/EditTab';
import UpdatesTab from './tabs/UpdatesTab';
import HistoryTab from './tabs/HistoryTab';
import ToolsTab from './tabs/ToolsTab';
import MapTab from './MapTab';
import CompanionMiniMap from './CompanionMiniMap';
import { DAY_COLORS } from '../../data/map-styles';

const STORAGE_KEY = 'companion_generated_itinerary';
const STORAGE_VERSION = 2; // Bump when mock data schema changes (e.g. added lat/lng)

function loadTripData(): TripData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Must have days array AND matching schema version
      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0 && parsed._v === STORAGE_VERSION) {
        return parsed as TripData;
      }
    }
  } catch { /* fall through to mock */ }
  return mockTrip as TripData;
}

export default function TripCompanion() {
  const [currentTab, setCurrentTab] = useState<TabId>('trip');
  const [selectedDay, setSelectedDay] = useState(0);
  const [tripData, setTripData] = useState<TripData>(loadTripData);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>(() => loadTripData().changeLog || []);
  const [nextChangeId, setNextChangeId] = useState(100);

  const unreadCount = tripData.notifications.filter((n) => !n.read).length;

  // Persist trip data to localStorage on every mutation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...tripData, changeLog, _v: STORAGE_VERSION }));
    } catch { /* quota exceeded — non-fatal */ }
  }, [tripData, changeLog]);

  // ── Mutation functions ──

  const addChangeEntry = useCallback((entry: Omit<ChangeLogEntry, 'id' | 'synced' | 'time'>) => {
    const id = nextChangeId;
    setNextChangeId((prev) => prev + 1);
    const newEntry: ChangeLogEntry = {
      ...entry,
      id,
      time: 'Just now',
      synced: true,
    };
    setChangeLog((prev) => [newEntry, ...prev]);
    return id;
  }, [nextChangeId]);

  const updateActivity = useCallback((dayIndex: number, activityId: string, updates: Partial<Activity>) => {
    setTripData((prev) => {
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex], items: [...newDays[dayIndex].items] };
      const idx = day.items.findIndex((a) => a.id === activityId);
      if (idx === -1) return prev;
      const oldItem = day.items[idx];
      day.items[idx] = { ...oldItem, ...updates, status: 'changed' as const, changedBy: 'scott' };
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
    addChangeEntry({
      type: 'edited',
      by: 'scott',
      title: updates.title || 'Activity',
      day: dayIndex + 1,
    });
  }, [addChangeEntry]);

  const addActivity = useCallback((dayIndex: number, activity: Activity) => {
    setTripData((prev) => {
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex], items: [...newDays[dayIndex].items, activity] };
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
    addChangeEntry({
      type: 'added',
      by: 'scott',
      title: activity.title,
      detail: `Added to Day ${dayIndex + 1}`,
      day: dayIndex + 1,
    });
  }, [addChangeEntry]);

  const deleteActivity = useCallback((dayIndex: number, activityId: string) => {
    let deletedTitle = '';
    setTripData((prev) => {
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex], items: [...newDays[dayIndex].items] };
      const idx = day.items.findIndex((a) => a.id === activityId);
      if (idx === -1) return prev;
      deletedTitle = day.items[idx].title;
      day.items.splice(idx, 1);
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
    addChangeEntry({
      type: 'removed',
      by: 'scott',
      title: deletedTitle || 'Activity',
      day: dayIndex + 1,
    });
  }, [addChangeEntry]);

  const reorderActivity = useCallback((dayIndex: number, activityId: string, direction: 'up' | 'down') => {
    setTripData((prev) => {
      const newDays = [...prev.days];
      const day = { ...newDays[dayIndex], items: [...newDays[dayIndex].items] };
      const idx = day.items.findIndex((a) => a.id === activityId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= day.items.length) return prev;
      [day.items[idx], day.items[targetIdx]] = [day.items[targetIdx], day.items[idx]];
      newDays[dayIndex] = day;
      return { ...prev, days: newDays };
    });
  }, []);

  const undoChange = useCallback((entryId: number) => {
    setChangeLog((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  return (
    <div style={{
      width: '100%', maxWidth: 430, margin: '0 auto', height: '100dvh',
      background: COLORS.gray100,
      fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar — gradient header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.oceanDark}, ${COLORS.oceanTeal})`,
        padding: '20px 20px 16px', color: '#fff', position: 'relative', zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              textTransform: 'uppercase' as const, opacity: 0.7, marginBottom: 4,
            }}>DISCOVER VIETNAM</div>
            <div style={{
              fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 2,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>{tripData.name}</div>
            <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>
              {tripData.subtitle} · {tripData.dates}
            </div>
          </div>
          {/* Group avatars */}
          <div style={{ display: 'flex' }}>
            {tripData.group.map((m, i) => (
              <div key={m.id} style={{
                width: 28, height: 28, borderRadius: 14,
                background: `${m.color}40`, border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, marginLeft: i > 0 ? -7 : 0, zIndex: 4 - i,
              }}>{m.avatar}</div>
            ))}
          </div>
        </div>
        {/* Status badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(45,138,78,0.9)', borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7' }} /> Offline Ready
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(37,99,235,0.7)', borderRadius: 20, padding: '4px 12px',
            fontSize: 11, fontWeight: 600,
          }}>✏️ Editable</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: currentTab === 'map' ? '0' : '20px 16px 100px',
      }}>
        {currentTab === 'trip' && (
          <>
            {/* Mini-map preview */}
            {(() => {
              const day = tripData.days[selectedDay];
              const mapActivities = day?.items
                .filter(a => a.lat != null && a.lng != null)
                .map(a => ({ lat: a.lat!, lng: a.lng!, title: a.title, icon: a.icon })) || [];
              return mapActivities.length > 0 ? (
                <CompanionMiniMap
                  activities={mapActivities}
                  dayColor={DAY_COLORS[selectedDay % DAY_COLORS.length]}
                  onTap={() => setCurrentTab('map')}
                />
              ) : null;
            })()}
            <TripTab
              days={tripData.days}
              weather={tripData.weather}
              group={tripData.group}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              onEditDay={() => setCurrentTab('edit')}
            />
          </>
        )}
        {currentTab === 'map' && (
          <MapTab
            tripData={tripData}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        )}
        {currentTab === 'edit' && (
          <EditTab
            days={tripData.days}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onUpdateActivity={updateActivity}
            onAddActivity={addActivity}
            onDeleteActivity={deleteActivity}
            onReorderActivity={reorderActivity}
          />
        )}
        {currentTab === 'updates' && (
          <UpdatesTab
            notifications={tripData.notifications}
            group={tripData.group}
          />
        )}
        {currentTab === 'history' && (
          <HistoryTab
            changeLog={changeLog}
            group={tripData.group}
            onUndo={undoChange}
          />
        )}
        {currentTab === 'tools' && (
          <ToolsTab
            contacts={tripData.contacts}
            weather={tripData.weather}
          />
        )}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, background: '#fff',
        borderTop: '1px solid #E8E8EC', display: 'flex',
        padding: '8px 0', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
      }}>
        {TAB_CONFIG.map((t) => (
          <button key={t.id} onClick={() => setCurrentTab(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, padding: '6px 0', cursor: 'pointer', border: 'none', background: 'none',
            color: currentTab === t.id ? COLORS.oceanTeal : COLORS.gray400,
            fontWeight: currentTab === t.id ? 700 : 500, fontSize: 10,
            transition: 'color 0.2s', position: 'relative',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
            {t.id === 'updates' && unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: '50%', marginRight: -16,
                width: 16, height: 16, borderRadius: 8,
                background: COLORS.warmCoral, color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
