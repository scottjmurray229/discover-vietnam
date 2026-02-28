import { useState } from 'react';
import { COLORS } from '../companion-shared';
import type { Contact, WeatherDay } from '../companion-shared';

interface ToolsTabProps {
  contacts: Contact[];
  weather: WeatherDay[];
}

export default function ToolsTab({ contacts, weather }: ToolsTabProps) {
  const [section, setSection] = useState<'contacts' | 'weather' | 'auto' | 'insurance'>('contacts');

  const sections = [
    { id: 'contacts' as const, label: '📞 Contacts' },
    { id: 'weather' as const, label: '⛅ Weather' },
    { id: 'auto' as const, label: '🤖 Auto-update' },
    { id: 'insurance' as const, label: '🛡️ Insurance' },
  ];

  return (
    <>
      {/* Section pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {sections.map((s) => (
          <div key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600,
            background: section === s.id ? COLORS.oceanDeep : '#fff',
            color: section === s.id ? '#fff' : COLORS.gray600,
            border: section === s.id ? 'none' : '1px solid #E8E8EC',
            boxShadow: section === s.id ? '0 2px 8px rgba(13,115,119,0.25)' : 'none',
          }}>{s.label}</div>
        ))}
      </div>

      {/* Contacts section */}
      {section === 'contacts' && (
        <>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12 }}>Key Contacts</div>
          {contacts.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: '#fff', borderRadius: 14, marginBottom: 6,
            }}>
              <span style={{ fontSize: 24 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight }}>{c.name}</div>
                <div style={{ fontSize: 12, color: COLORS.gray600 }}>{c.role}</div>
              </div>
              <a href={`tel:${c.phone}`} style={{
                padding: '6px 14px', borderRadius: 10, border: 'none',
                background: COLORS.palm, color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', textDecoration: 'none', display: 'inline-flex',
                alignItems: 'center', gap: 4,
              }}>📞 Call</a>
            </div>
          ))}
        </>
      )}

      {/* Weather section */}
      {section === 'weather' && (
        <>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12 }}>7-Day Forecast</div>
          <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
            Weather is checked every 6 hours when connected.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginBottom: 16 }}>
            {weather.map((w, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 14, padding: '12px 8px', textAlign: 'center',
                border: '1px solid #f0f0f0',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray600, marginBottom: 4 }}>{w.day}</div>
                <div style={{ fontSize: 28, margin: '4px 0' }}>{w.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight }}>{w.high}°</div>
                <div style={{ fontSize: 12, color: COLORS.gray400 }}>{w.low}°</div>
                {w.rain > 0 && (
                  <div style={{ fontSize: 11, color: COLORS.blue, marginTop: 4 }}>💧 {w.rain}%</div>
                )}
              </div>
            ))}
          </div>

          {/* Active weather watch */}
          {weather.some((w) => w.rain > 25) && (
            <div style={{
              background: COLORS.sunLight, borderRadius: 14, padding: 14,
              border: `1.5px solid ${COLORS.sun}40`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>⛅ Active Weather Watch</div>
              <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.5 }}>
                Rain chance detected on some days. If it rises above 50%, you'll get a notification suggesting backup activities.
              </div>
            </div>
          )}
        </>
      )}

      {/* Auto-update section */}
      {section === 'auto' && (
        <>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12 }}>Smart Auto-Updates</div>
          <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
            Your companion gets smarter over time. When connected, it pulls fresh data.
          </div>
          {[
            { icon: '⛅', title: 'Weather Forecasts', freq: 'Every 6 hours', detail: '7-day forecast for each destination' },
            { icon: '💱', title: 'Currency Rates', freq: 'Every 12 hours', detail: 'USD/PHP rate for budget tracker' },
            { icon: '🧭', title: 'Direction Updates', freq: 'Weekly', detail: 'Price changes, new routes, closures' },
            { icon: '📰', title: 'Local Advisories', freq: 'Real-time', detail: 'Travel advisories and weather alerts' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: '#fff', borderRadius: 14, marginBottom: 6,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${COLORS.oceanTeal}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight }}>{item.title}</div>
                <div style={{ fontSize: 12, color: COLORS.gray600 }}>{item.detail}</div>
                <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>Updates: {item.freq}</div>
              </div>
              {/* Decorative toggle */}
              <div style={{
                width: 40, height: 22, borderRadius: 11,
                background: COLORS.palm, position: 'relative',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 9, background: '#fff',
                  position: 'absolute', top: 2, left: 20,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}

          <div style={{
            background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 12,
            border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.5,
          }}>
            💡 <strong>Offline-first:</strong> Everything works without internet. Auto-updates only happen when you have a connection — the app never interrupts your trip to sync.
          </div>
        </>
      )}

      {/* Insurance section */}
      {section === 'insurance' && (
        <>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12 }}>Travel Insurance</div>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 18,
            border: `1.5px solid ${COLORS.oceanTeal}25`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${COLORS.oceanTeal}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>🛡️</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.deepNight }}>SafetyWing</div>
                <div style={{ fontSize: 12, color: COLORS.gray600 }}>Nomad & travel insurance</div>
              </div>
            </div>
            <div style={{
              fontSize: 13, color: COLORS.gray600, lineHeight: 1.6, marginBottom: 14,
              fontStyle: 'italic', padding: '10px 14px',
              background: `${COLORS.oceanTeal}08`, borderRadius: 10,
            }}>
              "We use SafetyWing for every trip and thankfully we've never had to actually use it, but having it is peace of mind." — Scott
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { icon: '🏥', text: 'Medical coverage up to $250,000' },
                { icon: '🚁', text: 'Emergency medical evacuation' },
                { icon: '✈️', text: 'Trip interruption protection' },
                { icon: '📅', text: 'Sign up even after leaving home' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.gray800 }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <a
              href="https://safetywing.com/?referenceID=24858745&utm_source=24858745&utm_medium=Ambassador"
              target="_blank"
              rel="noopener sponsored"
              style={{
                display: 'block', textAlign: 'center',
                padding: '12px 20px', borderRadius: 12,
                background: COLORS.oceanTeal, color: '#fff',
                fontSize: 14, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Get Covered →
            </a>
          </div>
          <div style={{
            fontSize: 11, color: COLORS.gray400, textAlign: 'center',
            marginTop: 8, lineHeight: 1.4,
          }}>
            Affiliate link — we earn a commission at no extra cost to you.
          </div>
        </>
      )}
    </>
  );
}
