import { useState } from "react";

// ═══════════════════════════════════════════
// DISCOVER PHILIPPINES — TRIP COMPANION PWA
// Editable Itinerary with Live Sync & Updates
// ═══════════════════════════════════════════

const COLORS = {
  ocean: "#0A6E78", oceanDark: "#064E56", oceanDeep: "#0B3D42",
  sand: "#F5E6C8", sandLight: "#FFF8ED",
  coral: "#E8734A", coralLight: "#FFF3ED",
  sun: "#F2B531", sunLight: "#FFF9E6",
  palm: "#2D8A4E", palmLight: "#E8F5EC",
  night: "#0D1B2A", nightMid: "#1B2D3E",
  purple: "#7C3AED", purpleLight: "#F0E8FF",
  blue: "#2563EB", blueLight: "#EFF6FF",
  gray100: "#F7F7F8", gray200: "#E8E8EC",
  gray400: "#9CA3AF", gray600: "#6B7280", gray800: "#374151",
};

const GROUP = [
  { id: "scott", name: "Scott", avatar: "🧔", role: "host", color: "#0A6E78" },
  { id: "jenice", name: "Jenice", avatar: "👩", role: "editor", color: "#E8734A" },
  { id: "mike", name: "Mike", avatar: "👨", role: "viewer", color: "#2D8A4E" },
  { id: "sarah", name: "Sarah", avatar: "👱‍♀️", role: "viewer", color: "#7C3AED" },
];

const getMember = (id) => GROUP.find((m) => m.id === id);

const ITINERARY = [
  {
    day: 1, date: "Sat, Mar 15", title: "Arrive & Moalboal", location: "Moalboal, Cebu",
    items: [
      { id: "d1-1", time: "10:30 AM", icon: "✈️", type: "transport", title: "Arrive Mactan-Cebu International", detail: "Terminal 2 — Immigration 20-30 min. Grab Globe SIM.", directions: "Exit arrivals, turn left. V-hire to Moalboal ₱250/person or private van ₱3,500.", status: "confirmed", hasVideo: false },
      { id: "d1-2", time: "11:30 AM", icon: "🚐", type: "transport", title: "Transfer to Moalboal", detail: "3-hour drive south. Stop at Carcar for lechon.", directions: "Ceres bus: aircon ₱180. Tell conductor 'Panagsama.' Trike from town ₱50.", status: "confirmed", hasVideo: false },
      { id: "d1-3", time: "3:00 PM", icon: "🐟", type: "activity", title: "Sardine Run Snorkeling", detail: "Walk into water from Panagsama Beach — sardines 10m from shore.", directions: "Enter near lifeguard station. Drift south with current.", status: "confirmed", hasVideo: true },
      { id: "d1-4", time: "6:30 PM", icon: "🍽️", type: "food", title: "Dinner at Pleasure Point", detail: "Beachfront Filipino-fusion. Try the kinilaw. ₱400-600/person.", directions: "Walk south along Panagsama, 5 min past dive shops.", status: "confirmed", hasVideo: false },
    ],
  },
  {
    day: 2, date: "Sun, Mar 16", title: "Kawasan & Canyoneering", location: "Badian, Cebu",
    items: [
      { id: "d2-1", time: "5:30 AM", icon: "🏞️", type: "activity", title: "Kawasan Falls Canyoneering", detail: "4-hour canyon adventure ending at Kawasan Falls.", directions: "Operator picks up 5:30 AM from hotel.", status: "confirmed", hasVideo: true },
      { id: "d2-2", time: "12:00 PM", icon: "🍚", type: "food", title: "Lunch at Kawasan Falls", detail: "Grilled fish and rice at falls base. ₱150-250.", directions: "Covered eating areas at base of falls.", status: "confirmed", hasVideo: false },
      { id: "d2-3", time: "3:00 PM", icon: "🐢", type: "activity", title: "Turtle Watching — Tongo Point", detail: "Sea turtles feeding on seagrass. Snorkel from shore.", directions: "Trike from Panagsama ₱100 (10 min).", status: "confirmed", hasVideo: true },
    ],
  },
  {
    day: 3, date: "Mon, Mar 17", title: "Cebu → Bohol", location: "Tagbilaran, Bohol",
    items: [
      { id: "d3-1", time: "8:00 AM", icon: "⛴️", type: "transport", title: "Ferry to Bohol", detail: "OceanJet fast ferry, 2 hours. Ref: OJ-2026-03-17.", directions: "Pier 1, Cebu City. Arrive 1hr early.", status: "confirmed", hasVideo: false },
      { id: "d3-2", time: "2:00 PM", icon: "🏔️", type: "activity", title: "Chocolate Hills", detail: "1,268 limestone hills. 214 steps to observation deck.", directions: "1.5hr drive to Carmen from Tagbilaran.", status: "confirmed", hasVideo: true },
      { id: "d3-3", time: "4:30 PM", icon: "🐒", type: "activity", title: "Tarsier Sanctuary", detail: "Corella. World's smallest primates. No flash.", directions: "Between Tagbilaran and Carmen. Stop on way back.", status: "changed", hasVideo: true, changeNote: "Moved from afternoon to morning slot — Jenice's suggestion", changedBy: "jenice" },
    ],
  },
  {
    day: 4, date: "Tue, Mar 18", title: "Bohol Island Hopping", location: "Panglao, Bohol",
    items: [
      { id: "d4-1", time: "6:00 AM", icon: "🏝️", type: "activity", title: "Balicasag & Virgin Island", detail: "Full-day island hopping. Balicasag marine sanctuary.", directions: "Bangka from Alona Beach. ₱3,000 for the boat.", status: "weather_watch", hasVideo: true, weatherNote: "30% chance of rain — checking forecast. Backup: Loboc River Cruise." },
      { id: "d4-2", time: "5:30 PM", icon: "🦐", type: "food", title: "Seafood at Alona Beach", detail: "Pick from boats. Grilled prawns, squid, lapu-lapu.", directions: "Alona Beach strip. Fresh catch on ice.", status: "confirmed", hasVideo: false },
    ],
  },
];

const CHANGE_LOG = [
  { id: 1, type: "moved", by: "scott", time: "2 hours ago", title: "Ferry to Bohol", from: "Day 3, 6:00 AM", to: "Day 3, 8:00 AM", reason: "Later departure available — more sleep", day: 3, synced: true },
  { id: 2, type: "added", by: "jenice", time: "Yesterday", title: "Loboc River Cruise", detail: "Added as backup for Day 4 if weather is bad", day: 4, synced: true },
  { id: 3, type: "swapped", by: "scott", time: "Yesterday", title: "Dinner restaurant", from: "Bohol Bee Farm", to: "Seafood at Alona Beach", reason: "Mike has shellfish allergy — more options at Alona", day: 4, synced: true },
  { id: 4, type: "removed", by: "scott", time: "3 days ago", title: "Oslob Whale Sharks", reason: "Ethically questionable — replaced with more Moalboal time", day: 2, synced: true },
  { id: 5, type: "time_changed", by: "jenice", time: "3 days ago", title: "Tarsier Sanctuary", from: "2:00 PM", to: "4:30 PM", reason: "Better to visit in cooler afternoon — tarsiers more active", day: 3, synced: true },
  { id: 6, type: "note", by: "mike", time: "5 days ago", title: "Island hopping boat", detail: "Found cheaper boat — ₱3,000 instead of ₱3,500. Booked!", day: 4, synced: true },
];

const NOTIFICATIONS = [
  { id: 1, type: "change", by: "jenice", text: "moved Tarsier Sanctuary to 4:30 PM on Day 3", time: "3 days ago", read: true },
  { id: 2, type: "change", by: "scott", text: "changed ferry time to 8:00 AM on Day 3", time: "2 hours ago", read: false },
  { id: 3, type: "weather", text: "Day 4 weather update: 30% rain chance. Island hopping may need to move.", time: "1 hour ago", read: false },
  { id: 4, type: "enriched", text: "New 360° video added for Cambugahay Falls (Day 5)", time: "4 hours ago", read: true },
  { id: 5, type: "sync", text: "All devices synced. Last update: 12 min ago.", time: "12 min ago", read: true },
];

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

const TABS = [
  { id: "trip", icon: "📋", label: "Trip" },
  { id: "edit", icon: "✏️", label: "Edit" },
  { id: "updates", icon: "🔔", label: "Updates" },
  { id: "history", icon: "📜", label: "History" },
  { id: "tools", icon: "🧰", label: "Tools" },
];

export default function TripCompanionEditable() {
  const [tab, setTab] = useState("trip");
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showReschedule, setShowReschedule] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [syncStatus, setSyncStatus] = useState("synced"); // synced, syncing, offline, conflict
  const [showPermissions, setShowPermissions] = useState(false);
  const [newActivity, setNewActivity] = useState({ title: "", time: "", type: "activity", detail: "" });
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  const iconBg = (t) => ({ transport: "#E8F4F8", activity: "#E8F5EC", food: "#FFF3ED" }[t] || "#F5F5F5");

  const statusColors = {
    confirmed: { bg: COLORS.palmLight, color: COLORS.palm, label: "Confirmed" },
    changed: { bg: "#FFF3ED", color: COLORS.coral, label: "Changed" },
    weather_watch: { bg: COLORS.sunLight, color: "#B8860B", label: "Weather Watch" },
    cancelled: { bg: "#FEE2E2", color: "#DC2626", label: "Cancelled" },
    tentative: { bg: COLORS.blueLight, color: COLORS.blue, label: "Tentative" },
  };

  const Pill = ({ active, children, onClick, small, badge }) => (
    <div onClick={onClick} style={{
      padding: small ? "6px 14px" : "7px 16px", borderRadius: 20, cursor: "pointer",
      whiteSpace: "nowrap", fontSize: small ? 12 : 13, fontWeight: 600,
      background: active ? COLORS.oceanDark : "#fff",
      color: active ? "#fff" : COLORS.gray600,
      border: active ? "none" : "1px solid #E8E8EC",
      boxShadow: active ? "0 2px 8px rgba(10,110,120,0.25)" : "none",
      position: "relative",
    }}>
      {children}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: -6, right: -6,
          width: 18, height: 18, borderRadius: 9,
          background: COLORS.coral, color: "#fff",
          fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{badge}</span>
      )}
    </div>
  );

  const Badge = ({ color, children }) => (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 600, marginRight: 6, marginTop: 4,
      background: color + "18", color,
    }}>{children}</span>
  );

  const SectionTitle = ({ children, right }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.nightMid }}>{children}</div>
      {right}
    </div>
  );

  const Avatar = ({ member, size = 28 }) => (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: member.color + "20", border: `2px solid ${member.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.5, flexShrink: 0,
    }}>{member.avatar}</div>
  );

  // Sync status bar
  const SyncBar = () => {
    const configs = {
      synced: { bg: COLORS.palmLight, color: COLORS.palm, icon: "✓", text: "All synced · 12 min ago" },
      syncing: { bg: COLORS.blueLight, color: COLORS.blue, icon: "↻", text: "Syncing changes..." },
      offline: { bg: COLORS.sunLight, color: "#B8860B", icon: "📶", text: "Offline — changes will sync when connected" },
      conflict: { bg: "#FEE2E2", color: "#DC2626", icon: "⚠️", text: "Sync conflict — tap to resolve" },
    };
    const c = configs[syncStatus];
    return (
      <div onClick={() => {
        if (syncStatus === "synced") setSyncStatus("syncing");
        else if (syncStatus === "syncing") setTimeout(() => setSyncStatus("synced"), 800);
        else if (syncStatus === "offline") setSyncStatus("synced");
        else if (syncStatus === "conflict") setSyncStatus("synced");
      }} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderRadius: 12, marginBottom: 14,
        background: c.bg, cursor: "pointer",
      }}>
        <span style={{ fontSize: 14 }}>{c.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.color, flex: 1 }}>{c.text}</span>
        {syncStatus === "synced" && <span style={{ fontSize: 11, color: c.color, opacity: 0.7 }}>Tap to refresh</span>}
      </div>
    );
  };

  // ── TRIP TAB ──
  const TripTab = () => (
    <>
      <SyncBar />
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {ITINERARY.map((d, i) => (
          <Pill key={i} active={selectedDay === i} onClick={() => { setSelectedDay(i); setExpandedItem(null); }}>
            Day {d.day}
          </Pill>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.nightMid, marginBottom: 2 }}>
            {ITINERARY[selectedDay].title}
          </div>
          <div style={{ fontSize: 13, color: COLORS.gray600 }}>
            📍 {ITINERARY[selectedDay].location} — {ITINERARY[selectedDay].date}
          </div>
        </div>
        <button onClick={() => setEditMode(!editMode)} style={{
          padding: "6px 14px", borderRadius: 10, border: "none", cursor: "pointer",
          background: editMode ? COLORS.coral : COLORS.ocean + "15",
          color: editMode ? "#fff" : COLORS.ocean,
          fontSize: 12, fontWeight: 700,
        }}>{editMode ? "Done" : "✏️ Edit"}</button>
      </div>

      {ITINERARY[selectedDay].items.map((item, i) => {
        const key = `${selectedDay}-${i}`;
        const open = expandedItem === key;
        const sc = statusColors[item.status] || statusColors.confirmed;
        return (
          <div key={key} style={{
            background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10, cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            border: editMode ? `1.5px dashed ${COLORS.ocean}44` : open ? `1.5px solid ${COLORS.ocean}33` : "1.5px solid transparent",
            position: "relative",
          }}>
            {/* Status indicator */}
            {item.status !== "confirmed" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 8, marginBottom: 10,
                background: sc.bg, fontSize: 11, fontWeight: 700, color: sc.color,
              }}>
                {item.status === "weather_watch" && "⛅ "}
                {item.status === "changed" && "✏️ "}
                {sc.label}
                {item.changeNote && ` — ${item.changeNote}`}
                {item.weatherNote && ` — ${item.weatherNote}`}
              </div>
            )}

            <div onClick={() => !editMode && setExpandedItem(open ? null : key)} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {editMode && (
                <div style={{
                  display: "flex", flexDirection: "column", gap: 4, marginRight: 4,
                  alignItems: "center", justifyContent: "center",
                }}>
                  {i > 0 && <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>}
                  {i < ITINERARY[selectedDay].items.length - 1 && <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>}
                </div>
              )}
              <div style={{
                width: 40, height: 40, borderRadius: 12, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 20,
                flexShrink: 0, background: iconBg(item.type),
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.ocean }}>{item.time}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.nightMid, lineHeight: 1.3 }}>{item.title}</div>
                {!open && !editMode && (
                  <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.detail}</div>
                )}
              </div>
              {editMode ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); setShowReschedule(item.id); }} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E8EC", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} title="Reschedule">📅</button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingItem(item.id); }} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E8E8EC", background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} title="Remove">🗑️</button>
                </div>
              ) : (
                <div style={{ fontSize: 18, color: COLORS.gray400, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</div>
              )}
            </div>

            {/* Expanded view */}
            {open && !editMode && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.6 }}>{item.detail}</div>
                {item.directions && (
                  <div style={{ background: "#F0F9FA", borderRadius: 12, padding: 12, marginTop: 10, borderLeft: `3px solid ${COLORS.ocean}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.ocean, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>🧭 Directions</div>
                    <div style={{ fontSize: 13, color: COLORS.nightMid, lineHeight: 1.6 }}>{item.directions}</div>
                  </div>
                )}
                {item.changedBy && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 12px", background: COLORS.coralLight, borderRadius: 10 }}>
                    <Avatar member={getMember(item.changedBy)} size={22} />
                    <span style={{ fontSize: 12, color: COLORS.coral }}>
                      <strong>{getMember(item.changedBy).name}</strong> modified this activity
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", marginTop: 8 }}>
                  {item.hasVideo && <Badge color={COLORS.coral}>🎥 360° Video</Badge>}
                  <Badge color={COLORS.ocean}>📶 Offline</Badge>
                  <Badge color={sc.color}>{sc.label}</Badge>
                </div>
              </div>
            )}

            {/* Reschedule overlay */}
            {showReschedule === item.id && (
              <div onClick={(e) => e.stopPropagation()} style={{
                marginTop: 12, padding: 14, background: COLORS.blueLight, borderRadius: 12,
                border: `1.5px solid ${COLORS.blue}30`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.blue, marginBottom: 10 }}>📅 Reschedule "{item.title}"</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray600, marginBottom: 6 }}>Move to:</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {ITINERARY.map((d, di) => (
                    <div key={di} onClick={() => setRescheduleTarget(di)} style={{
                      padding: "6px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: rescheduleTarget === di ? COLORS.blue : "#fff",
                      color: rescheduleTarget === di ? "#fff" : COLORS.gray600,
                      border: `1px solid ${rescheduleTarget === di ? COLORS.blue : "#ddd"}`,
                    }}>Day {d.day}</div>
                  ))}
                </div>
                <input placeholder="New time (e.g. 2:00 PM)" style={{
                  width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #ddd",
                  fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit",
                }} />
                <input placeholder="Reason (optional)" style={{
                  width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #ddd",
                  fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box", fontFamily: "inherit",
                }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowReschedule(null)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: COLORS.blue, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Move & Notify Group</button>
                  <button onClick={() => setShowReschedule(null)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#fff", color: COLORS.gray600, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Edit overlay */}
            {editingItem === item.id && (
              <div onClick={(e) => e.stopPropagation()} style={{
                marginTop: 12, padding: 14, background: "#FEFCE8", borderRadius: 12,
                border: `1.5px solid ${COLORS.sun}40`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>✏️ Edit Activity</div>
                <input defaultValue={item.title} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 600, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }} />
                <input defaultValue={item.time} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }} />
                <textarea defaultValue={item.detail} rows={3} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 13, outline: "none", resize: "vertical", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.5 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: COLORS.ocean, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save & Notify</button>
                  <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#fff", color: COLORS.gray600, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add activity */}
      {editMode && !showAddActivity && (
        <button onClick={() => setShowAddActivity(true)} style={{
          width: "100%", padding: 14, borderRadius: 14, border: `2px dashed ${COLORS.ocean}55`,
          background: COLORS.ocean + "08", cursor: "pointer", fontSize: 14, fontWeight: 600,
          color: COLORS.ocean,
        }}>+ Add Activity to Day {ITINERARY[selectedDay].day}</button>
      )}

      {showAddActivity && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid, marginBottom: 12 }}>Add New Activity</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {[
              { type: "activity", label: "🎯 Activity" }, { type: "food", label: "🍽️ Food" },
              { type: "transport", label: "🚐 Transport" },
            ].map((t) => (
              <div key={t.type} onClick={() => setNewActivity((p) => ({ ...p, type: t.type }))} style={{
                padding: "6px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: newActivity.type === t.type ? COLORS.ocean : "#f5f5f5",
                color: newActivity.type === t.type ? "#fff" : COLORS.gray600,
              }}>{t.label}</div>
            ))}
          </div>
          <input placeholder="Activity name" value={newActivity.title} onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E8E8EC", fontSize: 14, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }} />
          <input placeholder="Time (e.g. 2:00 PM)" value={newActivity.time} onChange={(e) => setNewActivity((p) => ({ ...p, time: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E8E8EC", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }} />
          <textarea placeholder="Details, notes, or directions..." value={newActivity.detail} onChange={(e) => setNewActivity((p) => ({ ...p, detail: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E8E8EC", fontSize: 13, outline: "none", resize: "vertical", marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.5 }} />
          <div style={{ background: COLORS.palmLight, borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 12, color: COLORS.palm }}>
            ✨ <strong>Auto-enrichment:</strong> If this destination is in our database, we'll add 360° video, local directions, and insider tips automatically.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowAddActivity(false); setNewActivity({ title: "", time: "", type: "activity", detail: "" }); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: COLORS.ocean, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Add & Notify Group</button>
            <button onClick={() => setShowAddActivity(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#eee", color: COLORS.gray600, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Edit mode tips */}
      {editMode && (
        <div style={{ background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 12, border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.5 }}>
          💡 <strong>Edit mode:</strong> Reorder with ↑↓ arrows, tap 📅 to reschedule to another day, ✏️ to edit details, or 🗑️ to remove. All changes notify the group.
        </div>
      )}
    </>
  );

  // ── UPDATES TAB ──
  const UpdatesTab = () => (
    <>
      <SectionTitle>Notifications</SectionTitle>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
        Changes, weather alerts, and new content for your trip.
      </div>

      {/* Sync status */}
      <div onClick={() => setSyncStatus((s) => s === "synced" ? "offline" : s === "offline" ? "conflict" : "synced")} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
        background: "#fff", borderRadius: 14, marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)", cursor: "pointer",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: syncStatus === "synced" ? COLORS.palmLight : syncStatus === "offline" ? COLORS.sunLight : "#FEE2E2",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          {syncStatus === "synced" ? "✅" : syncStatus === "offline" ? "📶" : "⚠️"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>
            {syncStatus === "synced" ? "All devices synced" : syncStatus === "offline" ? "Working offline" : "Sync conflict detected"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray600 }}>
            {syncStatus === "synced" ? "Last sync 12 min ago · 4 devices" : syncStatus === "offline" ? "3 pending changes will sync when connected" : "Scott and Jenice both edited Day 3 — tap to resolve"}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ocean }}>
          {syncStatus === "conflict" ? "Resolve" : ""}
        </div>
      </div>

      {/* Conflict resolution preview */}
      {syncStatus === "conflict" && (
        <div style={{
          background: "#FFF5F5", borderRadius: 14, padding: 16, marginBottom: 12,
          border: "1.5px solid #FCA5A5",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 10 }}>⚠️ Conflict: Day 3, Tarsier Sanctuary</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Avatar member={getMember("scott")} size={20} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Scott's edit</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.gray600 }}>Changed time to 10:00 AM</div>
              <button style={{ width: "100%", marginTop: 8, padding: 6, borderRadius: 8, border: "none", background: COLORS.ocean, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Keep this</button>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Avatar member={getMember("jenice")} size={20} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Jenice's edit</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.gray600 }}>Changed time to 4:30 PM</div>
              <button style={{ width: "100%", marginTop: 8, padding: 6, borderRadius: 8, border: "none", background: COLORS.coral, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Keep this</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {NOTIFICATIONS.map((n) => {
        const author = n.by ? getMember(n.by) : null;
        return (
          <div key={n.id} style={{
            display: "flex", gap: 12, padding: "12px 14px",
            background: n.read ? "#fff" : COLORS.blueLight,
            borderRadius: 14, marginBottom: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: n.read ? "1px solid transparent" : `1px solid ${COLORS.blue}20`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: n.type === "change" ? COLORS.coralLight : n.type === "weather" ? COLORS.sunLight : n.type === "enriched" ? COLORS.palmLight : COLORS.gray100,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              {n.type === "change" ? "✏️" : n.type === "weather" ? "⛅" : n.type === "enriched" ? "🎥" : "📶"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: COLORS.nightMid, lineHeight: 1.5 }}>
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

      {/* Permissions */}
      <div style={{ marginTop: 20 }}>
        <SectionTitle>Edit Permissions</SectionTitle>
        <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 12 }}>
          Control who can modify the itinerary.
        </div>
        {GROUP.map((m) => (
          <div key={m.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
            background: "#fff", borderRadius: 12, marginBottom: 6,
          }}>
            <Avatar member={m} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>{m.name}</div>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: m.role === "host" ? COLORS.sun + "20" : m.role === "editor" ? COLORS.palmLight : COLORS.gray100,
              color: m.role === "host" ? COLORS.sun : m.role === "editor" ? COLORS.palm : COLORS.gray400,
              cursor: m.role === "host" ? "default" : "pointer",
            }}>
              {m.role === "host" ? "👑 Host" : m.role === "editor" ? "✏️ Can edit" : "👁️ View only"}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 8, fontStyle: "italic" }}>
          Host can always edit. Tap a role to change permissions.
        </div>
      </div>
    </>
  );

  // ── HISTORY TAB ──
  const HistoryTab = () => (
    <>
      <SectionTitle>Change History</SectionTitle>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
        Full log of every itinerary change. Tap any change to undo.
      </div>

      {CHANGE_LOG.map((change) => {
        const author = getMember(change.by);
        const typeConfig = {
          moved: { icon: "📅", label: "Rescheduled", color: COLORS.blue },
          added: { icon: "➕", label: "Added", color: COLORS.palm },
          removed: { icon: "🗑️", label: "Removed", color: "#DC2626" },
          swapped: { icon: "🔄", label: "Swapped", color: COLORS.purple },
          time_changed: { icon: "⏰", label: "Time changed", color: COLORS.ocean },
          note: { icon: "💬", label: "Note", color: COLORS.gray600 },
        };
        const tc = typeConfig[change.type] || typeConfig.note;

        return (
          <div key={change.id} style={{
            background: "#fff", borderRadius: 14, padding: 14, marginBottom: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: tc.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>{tc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Avatar member={author} size={20} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.nightMid }}>{author.name}</span>
                  <span style={{ fontSize: 11, color: COLORS.gray400 }}>{change.time}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid, marginBottom: 2 }}>
                  <span style={{ color: tc.color }}>{tc.label}:</span> {change.title}
                </div>
                {change.from && change.to && (
                  <div style={{ fontSize: 12, color: COLORS.gray600 }}>
                    <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{change.from}</span>
                    {" → "}
                    <span style={{ fontWeight: 600 }}>{change.to}</span>
                  </div>
                )}
                {change.reason && (
                  <div style={{ fontSize: 12, color: COLORS.gray600, fontStyle: "italic", marginTop: 2 }}>
                    "{change.reason}"
                  </div>
                )}
                {change.detail && (
                  <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 2 }}>{change.detail}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: COLORS.gray400 }}>Day {change.day}</span>
                  {change.synced && <span style={{ fontSize: 11, color: COLORS.palm }}>✓ Synced</span>}
                </div>
              </div>
              <button style={{
                padding: "4px 10px", borderRadius: 8, border: "1px solid #E8E8EC",
                background: "#fff", fontSize: 11, fontWeight: 600, color: COLORS.gray600,
                cursor: "pointer",
              }}>Undo</button>
            </div>
          </div>
        );
      })}

      <div style={{
        background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 12,
        border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.5,
      }}>
        💡 <strong>Version history:</strong> Every change is saved. You can undo any modification and the group will be notified. The original AI-generated itinerary is always preserved as a baseline you can restore.
      </div>
    </>
  );

  // ── TOOLS TAB ──
  const ToolsTab = () => (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { id: "contacts", l: "📞 Contacts" }, { id: "weather", l: "⛅ Weather" },
          { id: "auto", l: "🤖 Auto-update" },
        ].map((s) => (
          <Pill key={s.id} active={toolsSection === s.id} onClick={() => setToolsSection(s.id)}>{s.l}</Pill>
        ))}
      </div>

      {toolsSection === "contacts" && (
        <>
          <SectionTitle>Key Contacts</SectionTitle>
          {[
            { icon: "🚨", name: "Philippine Emergency", num: "911" },
            { icon: "🏥", name: "Chong Hua Hospital (Cebu)", num: "+63-32-233-8000" },
            { icon: "🛺", name: "Kuya Rodel (Moalboal)", num: "+63-917-555-1234" },
            { icon: "🗺️", name: "Ate May (Siquijor)", num: "+63-927-555-5678" },
          ].map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              background: "#fff", borderRadius: 14, marginBottom: 6,
            }}>
              <span style={{ fontSize: 24 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>{c.name}</div>
              </div>
              <button style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: COLORS.palm, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📞</button>
            </div>
          ))}
        </>
      )}

      {toolsSection === "weather" && (
        <>
          <SectionTitle>Weather Auto-Updates</SectionTitle>
          <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
            Weather is checked every 6 hours when connected. Activities are flagged if conditions change.
          </div>
          <div style={{
            background: COLORS.sunLight, borderRadius: 14, padding: 14, marginBottom: 12,
            border: `1.5px solid ${COLORS.sun}40`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>⛅ Active Weather Watch</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>Day 4: Island Hopping</div>
            <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4, lineHeight: 1.5 }}>
              30% rain chance. If it rises above 50%, you'll get a notification suggesting backup plan (Loboc River Cruise).
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.nightMid, marginBottom: 8 }}>Auto-update triggers:</div>
            {[
              { trigger: "Rain > 50% for outdoor activity", action: "Suggest backup or reschedule" },
              { trigger: "Typhoon warning", action: "Alert entire group + emergency info" },
              { trigger: "Ferry cancellation likely", action: "Flag transport + alternatives" },
              { trigger: "Temperature > 35°C", action: "Suggest morning activities, hydration reminder" },
            ].map((t, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.nightMid }}>{t.trigger}</div>
                <div style={{ fontSize: 12, color: COLORS.gray600 }}>→ {t.action}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {toolsSection === "auto" && (
        <>
          <SectionTitle>Smart Auto-Updates</SectionTitle>
          <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 14 }}>
            Your companion gets smarter over time. When connected, it automatically pulls fresh data.
          </div>
          {[
            { icon: "⛅", title: "Weather Forecasts", freq: "Every 6 hours", status: "active", detail: "7-day forecast for each destination on your route" },
            { icon: "💱", title: "Currency Rates", freq: "Every 12 hours", status: "active", detail: "USD/PHP rate for budget tracker and converter" },
            { icon: "🎥", title: "New 360° Content", freq: "When available", status: "active", detail: "If we add new video for your destinations, it auto-downloads" },
            { icon: "🧭", title: "Direction Updates", freq: "Weekly", status: "active", detail: "Price changes, new routes, closed roads" },
            { icon: "📰", title: "Local Advisories", freq: "Real-time", status: "active", detail: "Government travel advisories, natural disaster alerts" },
            { icon: "🎟️", title: "Booking Status", freq: "Daily", status: "active", detail: "Klook/Agoda booking confirmations and changes" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              background: "#fff", borderRadius: 14, marginBottom: 6,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: COLORS.ocean + "12",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>{item.title}</div>
                <div style={{ fontSize: 12, color: COLORS.gray600 }}>{item.detail}</div>
                <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>Updates: {item.freq}</div>
              </div>
              <div style={{
                width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                background: item.status === "active" ? COLORS.palm : COLORS.gray200,
                position: "relative", transition: "background 0.2s",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 9, background: "#fff",
                  position: "absolute", top: 2,
                  left: item.status === "active" ? 20 : 2,
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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
    </>
  );

  return (
    <div style={{
      width: "100%", maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: "linear-gradient(180deg, #0B3D42 0%, #0A6E78 8%, #F5E6C8 30%)",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ padding: "20px 20px 16px", color: "#fff", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>DISCOVER PHILIPPINES</div>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, marginBottom: 2, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{TRIP.name}</div>
            <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>{TRIP.subtitle} · {TRIP.dates}</div>
          </div>
          <div style={{ display: "flex" }}>
            {GROUP.map((m, i) => (
              <div key={m.id} style={{
                width: 28, height: 28, borderRadius: 14,
                background: m.color + "40", border: "2px solid rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, marginLeft: i > 0 ? -7 : 0, zIndex: 4 - i,
              }}>{m.avatar}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(45,138,78,0.9)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6EE7B7" }} /> Offline Ready
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(37,99,235,0.7)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600 }}>
            ✏️ Editable
          </div>
        </div>
      </div>

      {/* WEATHER */}
      <div style={{ display: "flex", gap: 6, padding: "0 20px 14px", overflowX: "auto" }}>
        {TRIP.weather.map((w, i) => (
          <div key={i} style={{
            flex: "0 0 auto", textAlign: "center", padding: "8px 10px", borderRadius: 14,
            background: i === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            color: "#fff", fontSize: 11, minWidth: 52,
            border: i === 0 ? "1.5px solid rgba(255,255,255,0.5)" : "1.5px solid transparent",
          }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{w.day}</div>
            <div style={{ fontSize: 18, margin: "2px 0" }}>{w.icon}</div>
            <div style={{ fontWeight: 700 }}>{w.high}°</div>
            <div style={{ opacity: 0.6, fontSize: 10 }}>{w.low}°</div>
            {w.rain > 40 && <div style={{ fontSize: 10, color: "#7DD3FC", marginTop: 2 }}>💧{w.rain}%</div>}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{
        background: COLORS.gray100, borderRadius: "24px 24px 0 0",
        minHeight: "60vh", padding: "20px 16px 100px", position: "relative", zIndex: 2,
      }}>
        {tab === "trip" && <TripTab />}
        {tab === "edit" && <TripTab />}
        {tab === "updates" && <UpdatesTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "tools" && <ToolsTab />}
      </div>

      {/* TAB BAR */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: "#fff",
        borderTop: "1px solid #E8E8EC", display: "flex",
        padding: "8px 0 12px", zIndex: 100, boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
      }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "edit") setEditMode(true); else setEditMode(false); }} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, padding: "6px 0", cursor: "pointer", border: "none", background: "none",
            color: tab === t.id ? COLORS.ocean : COLORS.gray400,
            fontWeight: tab === t.id ? 700 : 500, fontSize: 10, transition: "color 0.2s",
            position: "relative",
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
            {t.id === "updates" && unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 2, right: "50%", marginRight: -16,
                width: 16, height: 16, borderRadius: 8,
                background: COLORS.coral, color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}