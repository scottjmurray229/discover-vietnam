import { COLORS, getMember } from '../companion-shared';
import type { ChangeLogEntry, GroupMember } from '../companion-shared';

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  moved: { icon: '📅', label: 'Rescheduled', color: COLORS.blue },
  added: { icon: '➕', label: 'Added', color: COLORS.palm },
  removed: { icon: '🗑️', label: 'Removed', color: '#DC2626' },
  swapped: { icon: '🔄', label: 'Swapped', color: COLORS.purple },
  time_changed: { icon: '⏰', label: 'Time changed', color: COLORS.oceanTeal },
  note: { icon: '💬', label: 'Note', color: COLORS.gray600 },
  edited: { icon: '✏️', label: 'Edited', color: COLORS.warmCoral },
};

interface HistoryTabProps {
  changeLog: ChangeLogEntry[];
  group: GroupMember[];
  onUndo: (entryId: number) => void;
}

export default function HistoryTab({ changeLog, group, onUndo }: HistoryTabProps) {
  if (changeLog.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.deepNight, marginBottom: 8 }}>No changes yet</div>
        <div style={{ fontSize: 14, color: COLORS.gray600, lineHeight: 1.5 }}>
          When you or your group edit the itinerary, changes will appear here with full undo history.
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12, marginTop: 8 }}>
        Change History
      </div>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
        Full log of every itinerary change. Tap Undo to revert.
      </div>

      {changeLog.map((change) => {
        const author = getMember(group, change.by);
        const tc = TYPE_CONFIG[change.type] || TYPE_CONFIG.note;

        return (
          <div key={change.id} style={{
            background: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${tc.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>{tc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {author && (
                    <div style={{
                      width: 20, height: 20, borderRadius: 10,
                      background: `${author.color}20`, border: `2px solid ${author.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                    }}>{author.avatar}</div>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.deepNight }}>{author?.name || change.by}</span>
                  <span style={{ fontSize: 11, color: COLORS.gray400 }}>{change.time}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight, marginBottom: 2 }}>
                  <span style={{ color: tc.color }}>{tc.label}:</span> {change.title}
                </div>
                {change.from && change.to && (
                  <div style={{ fontSize: 12, color: COLORS.gray600 }}>
                    <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{change.from}</span>
                    {' → '}
                    <span style={{ fontWeight: 600 }}>{change.to}</span>
                  </div>
                )}
                {change.reason && (
                  <div style={{ fontSize: 12, color: COLORS.gray600, fontStyle: 'italic', marginTop: 2 }}>
                    "{change.reason}"
                  </div>
                )}
                {change.detail && (
                  <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 2 }}>{change.detail}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: COLORS.gray400 }}>Day {change.day}</span>
                  {change.synced && <span style={{ fontSize: 11, color: COLORS.palm }}>✓ Synced</span>}
                </div>
              </div>
              <button onClick={() => onUndo(change.id)} style={{
                padding: '4px 10px', borderRadius: 8, border: '1px solid #E8E8EC',
                background: '#fff', fontSize: 11, fontWeight: 600, color: COLORS.gray600,
                cursor: 'pointer',
              }}>Undo</button>
            </div>
          </div>
        );
      })}

      <div style={{
        background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 12,
        border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.5,
      }}>
        💡 <strong>Version history:</strong> Every change is saved. You can undo any modification. The original itinerary is always preserved as a baseline you can restore.
      </div>
    </>
  );
}
