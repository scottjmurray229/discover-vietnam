import { COLORS, getMember } from '../companion-shared';
import type { GroupMember, Notification } from '../companion-shared';

interface UpdatesTabProps {
  notifications: Notification[];
  group: GroupMember[];
}

export default function UpdatesTab({ notifications, group }: UpdatesTabProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifIcon: Record<string, string> = {
    change: '✏️', weather: '⛅', enriched: '🎥', sync: '📶', currency: '💱',
  };

  const notifBg: Record<string, string> = {
    change: COLORS.coralLight, weather: COLORS.sunLight,
    enriched: COLORS.palmLight, sync: COLORS.gray100, currency: COLORS.blueLight,
  };

  return (
    <>
      {/* Section title */}
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12, marginTop: 8 }}>
        Notifications {unreadCount > 0 && <span style={{
          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
          background: COLORS.warmCoral, color: '#fff', marginLeft: 6,
        }}>{unreadCount}</span>}
      </div>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
        Changes, weather alerts, and updates for your trip.
      </div>

      {/* Sync status card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
        background: '#fff', borderRadius: 14, marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: COLORS.palmLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>✅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight }}>All devices synced</div>
          <div style={{ fontSize: 12, color: COLORS.gray600 }}>Last sync 12 min ago · {group.length} devices</div>
        </div>
      </div>

      {/* Notifications list */}
      {notifications.map((n) => {
        const author = n.by ? getMember(group, n.by) : undefined;
        return (
          <div key={n.id} style={{
            display: 'flex', gap: 12, padding: '12px 14px',
            background: n.read ? '#fff' : COLORS.blueLight,
            borderRadius: 14, marginBottom: 6,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: n.read ? '1px solid transparent' : `1px solid ${COLORS.blue}20`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: notifBg[n.type] || COLORS.gray100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {notifIcon[n.type] || '📢'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: COLORS.deepNight, lineHeight: 1.5 }}>
                {author && <><strong>{author.name}</strong> </>}
                {n.text}
              </div>
              <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>{n.time}</div>
            </div>
            {!n.read && (
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                background: COLORS.blue, flexShrink: 0, marginTop: 4,
              }} />
            )}
          </div>
        );
      })}

      {/* Group permissions section */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12 }}>
          Edit Permissions
        </div>
        <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 12 }}>
          Control who can modify the itinerary.
        </div>
        {group.map((m) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: '#fff', borderRadius: 12, marginBottom: 6,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 17,
              background: `${m.color}20`, border: `2px solid ${m.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>{m.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight }}>{m.name}</div>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: m.role === 'host' ? `${COLORS.sun}20` : m.role === 'editor' ? COLORS.palmLight : COLORS.gray100,
              color: m.role === 'host' ? COLORS.sun : m.role === 'editor' ? COLORS.palm : COLORS.gray400,
            }}>
              {m.role === 'host' ? '👑 Host' : m.role === 'editor' ? '✏️ Can edit' : '👁️ View only'}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 8, fontStyle: 'italic' }}>
          Host can always edit. Tap a role to change permissions.
        </div>
      </div>
    </>
  );
}
