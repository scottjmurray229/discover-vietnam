import { useState } from 'react';
import { COLORS, CATEGORY_BG, STATUS_BADGES } from '../companion-shared';
import type { TripDay, Activity } from '../companion-shared';

interface EditTabProps {
  days: TripDay[];
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  onUpdateActivity: (dayIndex: number, activityId: string, updates: Partial<Activity>) => void;
  onAddActivity: (dayIndex: number, activity: Activity) => void;
  onDeleteActivity: (dayIndex: number, activityId: string) => void;
  onReorderActivity: (dayIndex: number, activityId: string, direction: 'up' | 'down') => void;
}

export default function EditTab({
  days, selectedDay, setSelectedDay,
  onUpdateActivity, onAddActivity, onDeleteActivity, onReorderActivity,
}: EditTabProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: '', time: '', type: 'activity' as Activity['type'], detail: '',
  });

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDetail, setEditDetail] = useState('');

  const day = days[selectedDay];
  if (!day) return null;

  const startEditing = (item: Activity) => {
    setEditingItem(item.id);
    setEditTitle(item.title);
    setEditTime(item.time);
    setEditDetail(item.detail);
  };

  const saveEdit = (item: Activity) => {
    onUpdateActivity(selectedDay, item.id, {
      title: editTitle, time: editTime, detail: editDetail,
    });
    setEditingItem(null);
  };

  const handleAdd = () => {
    if (!newActivity.title.trim() || !newActivity.time.trim()) return;
    const activity: Activity = {
      id: `d${day.day}-new-${Date.now()}`,
      time: newActivity.time,
      icon: newActivity.type === 'food' ? '🍽️' : newActivity.type === 'transport' ? '🚐' : '🎯',
      type: newActivity.type,
      title: newActivity.title,
      detail: newActivity.detail,
      status: 'confirmed',
    };
    onAddActivity(selectedDay, activity);
    setNewActivity({ title: '', time: '', type: 'activity', detail: '' });
    setShowAddActivity(false);
  };

  return (
    <>
      {/* Day selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {days.map((d, i) => (
          <div key={i} onClick={() => setSelectedDay(i)} style={{
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
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.deepNight, marginBottom: 2 }}>{day.title}</div>
        <div style={{ fontSize: 13, color: COLORS.gray600 }}>📍 {day.location} — {day.date}</div>
      </div>

      {/* Activity cards with edit controls */}
      {day.items.map((item, i) => {
        const sc = STATUS_BADGES[item.status] || STATUS_BADGES.confirmed;

        return (
          <div key={item.id} style={{
            background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            border: `1.5px dashed ${COLORS.oceanTeal}44`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Reorder arrows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                {i > 0 && (
                  <button onClick={() => onReorderActivity(selectedDay, item.id, 'up')} style={{
                    width: 24, height: 24, borderRadius: 6, border: '1px solid #ddd',
                    background: '#fff', cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>↑</button>
                )}
                {i < day.items.length - 1 && (
                  <button onClick={() => onReorderActivity(selectedDay, item.id, 'down')} style={{
                    width: 24, height: 24, borderRadius: 6, border: '1px solid #ddd',
                    background: '#fff', cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>↓</button>
                )}
              </div>

              <div style={{
                width: 40, height: 40, borderRadius: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 20,
                flexShrink: 0, background: CATEGORY_BG[item.type] || '#f5f5f5',
              }}>{item.icon}</div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.oceanTeal }}>{item.time}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.deepNight, lineHeight: 1.3 }}>{item.title}</div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setShowReschedule(showReschedule === item.id ? null : item.id)} style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8EC',
                  background: '#fff', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title="Reschedule">📅</button>
                <button onClick={() => startEditing(item)} style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #E8E8EC',
                  background: '#fff', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title="Edit">✏️</button>
                <button onClick={() => setDeleteConfirm(deleteConfirm === item.id ? null : item.id)} style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #FEE2E2',
                  background: '#FFF5F5', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title="Remove">🗑️</button>
              </div>
            </div>

            {/* Delete confirmation */}
            {deleteConfirm === item.id && (
              <div style={{
                marginTop: 12, padding: 12, background: '#FFF5F5', borderRadius: 12,
                border: '1.5px solid #FCA5A5', display: 'flex', gap: 8,
              }}>
                <button onClick={() => { onDeleteActivity(selectedDay, item.id); setDeleteConfirm(null); }} style={{
                  flex: 1, padding: 10, borderRadius: 10, border: 'none',
                  background: COLORS.red, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>Delete</button>
                <button onClick={() => setDeleteConfirm(null)} style={{
                  flex: 1, padding: 10, borderRadius: 10, border: 'none',
                  background: '#fff', color: COLORS.gray600, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            )}

            {/* Reschedule overlay */}
            {showReschedule === item.id && (
              <div style={{
                marginTop: 12, padding: 14, background: COLORS.blueLight, borderRadius: 12,
                border: `1.5px solid ${COLORS.blue}30`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.blue, marginBottom: 10 }}>📅 Move to another day</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {days.map((d, di) => (
                    <div key={di} onClick={() => setRescheduleDay(di)} style={{
                      padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: rescheduleDay === di ? COLORS.blue : '#fff',
                      color: rescheduleDay === di ? '#fff' : COLORS.gray600,
                      border: `1px solid ${rescheduleDay === di ? COLORS.blue : '#ddd'}`,
                    }}>Day {d.day}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowReschedule(null)} style={{
                    flex: 1, padding: 10, borderRadius: 10, border: 'none',
                    background: COLORS.blue, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Move Activity</button>
                  <button onClick={() => setShowReschedule(null)} style={{
                    flex: 1, padding: 10, borderRadius: 10, border: 'none',
                    background: '#fff', color: COLORS.gray600, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Edit overlay */}
            {editingItem === item.id && (
              <div style={{
                marginTop: 12, padding: 14, background: '#FEFCE8', borderRadius: 12,
                border: `1.5px solid ${COLORS.sun}40`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 10 }}>✏️ Edit Activity</div>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #ddd',
                  fontSize: 14, fontWeight: 600, outline: 'none', marginBottom: 8,
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }} />
                <input value={editTime} onChange={(e) => setEditTime(e.target.value)} placeholder="Time" style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #ddd',
                  fontSize: 13, outline: 'none', marginBottom: 8,
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }} />
                <textarea value={editDetail} onChange={(e) => setEditDetail(e.target.value)} rows={3} style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #ddd',
                  fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 8,
                  boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5,
                }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(item)} style={{
                    flex: 1, padding: 10, borderRadius: 10, border: 'none',
                    background: COLORS.oceanTeal, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Save Changes</button>
                  <button onClick={() => setEditingItem(null)} style={{
                    flex: 1, padding: 10, borderRadius: 10, border: 'none',
                    background: '#fff', color: COLORS.gray600, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add activity button / form */}
      {!showAddActivity ? (
        <button onClick={() => setShowAddActivity(true)} style={{
          width: '100%', padding: 14, borderRadius: 14, border: `2px dashed ${COLORS.oceanTeal}55`,
          background: `${COLORS.oceanTeal}08`, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          color: COLORS.oceanTeal,
        }}>+ Add Activity to Day {day.day}</button>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight, marginBottom: 12 }}>Add New Activity</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {([
              { type: 'activity' as const, label: '🎯 Activity' },
              { type: 'food' as const, label: '🍽️ Food' },
              { type: 'transport' as const, label: '🚐 Transport' },
            ]).map((t) => (
              <div key={t.type} onClick={() => setNewActivity((p) => ({ ...p, type: t.type }))} style={{
                padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: newActivity.type === t.type ? COLORS.oceanTeal : '#f5f5f5',
                color: newActivity.type === t.type ? '#fff' : COLORS.gray600,
              }}>{t.label}</div>
            ))}
          </div>
          <input placeholder="Activity name" value={newActivity.title}
            onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E8E8EC',
              fontSize: 14, outline: 'none', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit',
            }} />
          <input placeholder="Time (e.g. 2:00 PM)" value={newActivity.time}
            onChange={(e) => setNewActivity((p) => ({ ...p, time: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E8E8EC',
              fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit',
            }} />
          <textarea placeholder="Details, notes, or directions..." value={newActivity.detail}
            onChange={(e) => setNewActivity((p) => ({ ...p, detail: e.target.value }))}
            rows={3} style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E8E8EC',
              fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 10,
              boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5,
            }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{
              flex: 1, padding: 12, borderRadius: 10, border: 'none',
              background: COLORS.oceanTeal, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Add Activity</button>
            <button onClick={() => setShowAddActivity(false)} style={{
              flex: 1, padding: 12, borderRadius: 10, border: 'none',
              background: '#eee', color: COLORS.gray600, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Edit mode tips */}
      <div style={{
        background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 12,
        border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.5,
      }}>
        💡 <strong>Edit mode:</strong> Reorder with ↑↓ arrows, tap 📅 to move to another day, ✏️ to edit details, or 🗑️ to remove. All changes are tracked in History.
      </div>
    </>
  );
}
