import { useState } from 'react';
import { COLORS, CATEGORY_BG, STATUS_BADGES, getMember } from '../companion-shared';
import type { TripDay, GroupMember, WeatherDay } from '../companion-shared';

interface TripTabProps {
  days: TripDay[];
  weather: WeatherDay[];
  group: GroupMember[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  onEditDay: () => void;
}

export default function TripTab({ days, weather, group, selectedDay, setSelectedDay, onEditDay }: TripTabProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const day = days[selectedDay];
  if (!day) return null;

  return (
    <>
      {/* Weather row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {weather.map((w, i) => (
          <div key={i} style={{
            flex: '0 0 auto', textAlign: 'center', padding: '6px 8px', borderRadius: 12,
            background: i === selectedDay ? `${COLORS.oceanTeal}15` : '#fff',
            border: i === selectedDay ? `1.5px solid ${COLORS.oceanTeal}40` : '1.5px solid #f0f0f0',
            minWidth: 48, cursor: 'pointer',
          }} onClick={() => setSelectedDay(i)}>
            <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.gray600 }}>{w.day}</div>
            <div style={{ fontSize: 16, margin: '2px 0' }}>{w.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.deepNight }}>{w.high}°</div>
            <div style={{ fontSize: 10, color: COLORS.gray400 }}>{w.low}°</div>
            {w.rain > 25 && <div style={{ fontSize: 9, color: COLORS.blue }}>💧{w.rain}%</div>}
          </div>
        ))}
      </div>

      {/* Day selector pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {days.map((d, i) => (
          <div key={i} onClick={() => { setSelectedDay(i); setExpandedItem(null); }} style={{
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600,
            background: selectedDay === i ? COLORS.oceanDeep : '#fff',
            color: selectedDay === i ? '#fff' : COLORS.gray600,
            border: selectedDay === i ? 'none' : '1px solid #E8E8EC',
            boxShadow: selectedDay === i ? '0 2px 8px rgba(13,115,119,0.25)' : 'none',
          }}>
            Day {d.day}
          </div>
        ))}
      </div>

      {/* Day header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.deepNight, marginBottom: 2 }}>{day.title}</div>
          <div style={{ fontSize: 13, color: COLORS.gray600 }}>📍 {day.location} — {day.date}</div>
        </div>
        <button onClick={onEditDay} style={{
          padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: `${COLORS.oceanTeal}15`, color: COLORS.oceanTeal,
          fontSize: 12, fontWeight: 700,
        }}>✏️ Edit</button>
      </div>

      {/* Activity cards */}
      {day.items.map((item, i) => {
        const key = `${selectedDay}-${i}`;
        const open = expandedItem === key;
        const sc = STATUS_BADGES[item.status] || STATUS_BADGES.confirmed;
        const author = item.changedBy ? getMember(group, item.changedBy) : undefined;

        return (
          <div key={key} onClick={() => setExpandedItem(open ? null : key)} style={{
            background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: open ? `1.5px solid ${COLORS.oceanTeal}33` : '1.5px solid transparent',
          }}>
            {/* Status indicator */}
            {item.status !== 'confirmed' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 8, marginBottom: 10,
                background: sc.bg, fontSize: 11, fontWeight: 700, color: sc.color,
              }}>
                {item.status === 'weather_watch' && '⛅ '}
                {item.status === 'changed' && '✏️ '}
                {sc.label}
                {item.changeNote && ` — ${item.changeNote}`}
                {item.weatherNote && ` — ${item.weatherNote}`}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 20,
                flexShrink: 0, background: CATEGORY_BG[item.type] || '#f5f5f5',
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.oceanTeal }}>{item.time}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.deepNight, lineHeight: 1.3 }}>{item.title}</div>
                {!open && (
                  <div style={{
                    fontSize: 13, color: COLORS.gray600, marginTop: 4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>{item.detail}</div>
                )}
              </div>
              <div style={{
                fontSize: 18, color: COLORS.gray400,
                transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
              }}>▾</div>
            </div>

            {/* Expanded view */}
            {open && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.6 }}>{item.detail}</div>
                {item.directions && (
                  <div style={{
                    background: '#F0F9FA', borderRadius: 12, padding: 12, marginTop: 10,
                    borderLeft: `3px solid ${COLORS.oceanTeal}`,
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: COLORS.oceanTeal,
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
                    }}>🧭 Directions</div>
                    <div style={{ fontSize: 13, color: COLORS.deepNight, lineHeight: 1.6 }}>{item.directions}</div>
                  </div>
                )}
                {item.type === 'transport' && (
                  <a
                    href="https://12go.asia/en/travel/philippines?z=15062413&sub_id=discoverph-companion"
                    target="_blank"
                    rel="noopener sponsored"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 10, padding: '10px 18px', borderRadius: 12,
                      background: COLORS.oceanTeal, color: '#fff',
                      fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    Book Transport on 12Go
                  </a>
                )}
                {author && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                    padding: '8px 12px', background: COLORS.coralLight, borderRadius: 10,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 11,
                      background: `${author.color}20`, border: `2px solid ${author.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                    }}>{author.avatar}</div>
                    <span style={{ fontSize: 12, color: COLORS.warmCoral }}>
                      <strong>{author.name}</strong> modified this activity
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                    borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: `${COLORS.oceanTeal}18`, color: COLORS.oceanTeal,
                  }}>📶 Offline</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                    borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: `${sc.color}18`, color: sc.color,
                  }}>{sc.label}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
