import { useState, useRef } from "react";

// ═══════════════════════════════════════════
// DISCOVER PHILIPPINES — ITINERARY INTAKE
// Upload · Paste · Templates → Trip Companion
// ═══════════════════════════════════════════

const COLORS = {
  ocean: "#0A6E78", oceanDark: "#064E56", oceanDeep: "#0B3D42",
  sand: "#F5E6C8", sandLight: "#FFF8ED",
  coral: "#E8734A", coralLight: "#FFF3ED",
  sun: "#F2B531", sunLight: "#FFF9E6",
  palm: "#2D8A4E", palmLight: "#E8F5EC",
  night: "#0D1B2A", nightMid: "#1B2D3E",
  gray100: "#F7F7F8", gray200: "#E8E8EC",
  gray400: "#9CA3AF", gray600: "#6B7280", gray800: "#374151",
};

const TEMPLATES = [
  {
    id: "central-visayas-7",
    title: "Central Visayas Explorer",
    duration: "7 days",
    route: "Cebu → Bohol → Siquijor",
    highlights: ["Sardine Run", "Kawasan Canyoneering", "Chocolate Hills", "Island Hopping", "Paliton Beach Sunset"],
    difficulty: "Moderate",
    bestFor: "First-timers & snorkelers",
    image: "🏝️",
    popular: true,
    destinations: 3,
    activities: 14,
  },
  {
    id: "cebu-bohol-5",
    title: "Cebu & Bohol Express",
    duration: "5 days",
    route: "Cebu → Bohol",
    highlights: ["Moalboal Sardines", "Kawasan Falls", "Tarsiers", "Balicasag Snorkeling"],
    difficulty: "Easy",
    bestFor: "Short trips & families",
    image: "🐢",
    popular: true,
    destinations: 2,
    activities: 10,
  },
  {
    id: "siquijor-3",
    title: "Siquijor Island Escape",
    duration: "3 days",
    route: "Siquijor",
    highlights: ["Cambugahay Falls", "Tubod Marine Sanctuary", "Balete Tree", "Healing Culture"],
    difficulty: "Easy",
    bestFor: "Off-the-beaten-path seekers",
    image: "🌊",
    popular: false,
    destinations: 1,
    activities: 8,
  },
  {
    id: "dumaguete-apo-4",
    title: "Dumaguete & Apo Island",
    duration: "4 days",
    route: "Dumaguete → Dauin → Apo Island",
    highlights: ["Apo Island Turtle Point", "Dauin Diving", "Twin Lakes", "Dumaguete Food Scene"],
    difficulty: "Easy–Moderate",
    bestFor: "Divers & nature lovers",
    image: "🐠",
    popular: false,
    destinations: 3,
    activities: 9,
  },
  {
    id: "palawan-7",
    title: "Palawan Paradise",
    duration: "7 days",
    route: "Puerto Princesa → El Nido → Coron",
    highlights: ["Underground River", "Island Hopping Tours A-D", "Twin Lagoon", "Kayangan Lake"],
    difficulty: "Moderate",
    bestFor: "Adventurers & photographers",
    image: "🦎",
    popular: true,
    destinations: 3,
    activities: 16,
  },
  {
    id: "siargao-5",
    title: "Siargao Surf & Soul",
    duration: "5 days",
    route: "Siargao Island",
    highlights: ["Cloud 9 Surfing", "Sugba Lagoon", "Magpupungko Tidal Pools", "Island Hopping"],
    difficulty: "Easy–Moderate",
    bestFor: "Surfers & island vibes",
    image: "🏄",
    popular: false,
    destinations: 1,
    activities: 11,
  },
];

const SAMPLE_PASTE = `Day 1 - Arrive Cebu, transfer to Moalboal
Day 2 - Sardine run snorkeling, Kawasan Falls canyoneering
Day 3 - Ferry to Bohol, Chocolate Hills, Tarsier Sanctuary
Day 4 - Island hopping Balicasag & Virgin Island
Day 5 - Ferry to Siquijor, Cambugahay Falls, Paliton Beach sunset
Day 6 - Tubod Marine Sanctuary, Balete Tree, free afternoon
Day 7 - Ferry to Dumaguete, fly home`;

const ENRICHMENT_FEATURES = [
  { icon: "🧭", title: "Real Directions", desc: "Not Google Maps pins — actual 'take the Ceres bus, tell the conductor Panagsama' directions" },
  { icon: "🎥", title: "360° Video", desc: "Immersive previews of every destination so you know what to expect" },
  { icon: "💬", title: "Local Phrases", desc: "Cebuano & Tagalog phrases tuned to your destinations with pronunciation" },
  { icon: "📞", title: "Key Contacts", desc: "Emergency numbers, hospitals, trusted local drivers & guides for your specific route" },
  { icon: "🎒", title: "Smart Packing", desc: "Checklist auto-generated from your activities — canyoneering adds water shoes" },
  { icon: "💰", title: "Budget Tracker", desc: "Log expenses, see typical costs, convert currency — all offline" },
  { icon: "💵", title: "Tipping Guide", desc: "What to tip in every Philippines situation, from trike drivers to dive masters" },
  { icon: "🌅", title: "Sunrise/Sunset", desc: "Golden hour times with best viewpoints matched to your daily locations" },
  { icon: "📶", title: "Works Offline", desc: "Everything cached to your phone. No signal on the ferry? No problem" },
];

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export default function ItineraryIntake() {
  const [mode, setMode] = useState("home"); // home, upload, paste, templates, processing, preview
  const [pasteText, setPasteText] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const fileRef = useRef(null);

  const processingSteps = [
    { label: "Reading your itinerary...", icon: "📖" },
    { label: "Identifying destinations...", icon: "📍" },
    { label: "Matching local content...", icon: "🔗" },
    { label: "Adding real directions...", icon: "🧭" },
    { label: "Loading 360° video...", icon: "🎥" },
    { label: "Building your trip companion...", icon: "✨" },
  ];

  const startProcessing = () => {
    setMode("processing");
    setProcessingStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= processingSteps.length) {
        clearInterval(interval);
        setTimeout(() => setMode("preview"), 600);
      } else {
        setProcessingStep(step);
      }
    }, 900);
  };

  const Pill = ({ active, children, onClick, style: s }) => (
    <div onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 24, cursor: "pointer", whiteSpace: "nowrap",
      fontSize: 14, fontWeight: 600, transition: "all 0.2s",
      background: active ? COLORS.oceanDark : "#fff",
      color: active ? "#fff" : COLORS.gray600,
      border: active ? "none" : "1.5px solid #E8E8EC",
      boxShadow: active ? "0 2px 8px rgba(10,110,120,0.25)" : "none",
      ...s,
    }}>{children}</div>
  );

  // ── HOME SCREEN ──
  const HomeScreen = () => (
    <>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.ocean})`,
        borderRadius: 24, padding: "28px 24px", color: "#fff", marginBottom: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.08,
          transform: "rotate(-15deg)",
        }}>🇵🇭</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>
          DISCOVER PHILIPPINES
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          Your Trip.<br />Your Companion.
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5, maxWidth: 300 }}>
          Turn any Philippines itinerary into an offline trip companion with local directions, 360° video, and insider tips.
        </div>
      </div>

      {/* Three paths */}
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
        Get started
      </div>

      {/* AI Trip Planner */}
      <div onClick={() => setMode("templates")} style={{
        background: `linear-gradient(135deg, ${COLORS.palm}, #1a7a3a)`,
        borderRadius: 18, padding: "20px 20px", marginBottom: 10, cursor: "pointer",
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 10, right: 16, fontSize: 36, opacity: 0.2 }}>🤖</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.7, marginBottom: 4 }}>RECOMMENDED</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Build with AI Trip Planner</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>
          Tell us your dates, interests, and budget. Our AI builds a complete itinerary with all companion features.
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
          background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "6px 14px",
          fontSize: 12, fontWeight: 600,
        }}>Start Planning →</div>
      </div>

      {/* Upload */}
      <div onClick={() => setMode("upload")} style={{
        background: "#fff", borderRadius: 18, padding: "18px 20px", marginBottom: 10,
        cursor: "pointer", border: "1.5px solid #E8E8EC",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 26,
          background: COLORS.coralLight, flexShrink: 0,
        }}>📄</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.nightMid, marginBottom: 2 }}>Upload Itinerary</div>
          <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.4 }}>
            PDF, screenshot, or document from your travel agent or planner
          </div>
        </div>
        <div style={{ color: COLORS.gray400, fontSize: 18, flexShrink: 0 }}>→</div>
      </div>

      {/* Paste */}
      <div onClick={() => setMode("paste")} style={{
        background: "#fff", borderRadius: 18, padding: "18px 20px", marginBottom: 10,
        cursor: "pointer", border: "1.5px solid #E8E8EC",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 26,
          background: COLORS.sunLight, flexShrink: 0,
        }}>✏️</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.nightMid, marginBottom: 2 }}>Paste or Type</div>
          <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.4 }}>
            Copy from email, notes, or just describe your plans
          </div>
        </div>
        <div style={{ color: COLORS.gray400, fontSize: 18, flexShrink: 0 }}>→</div>
      </div>

      {/* Templates */}
      <div onClick={() => setMode("templates")} style={{
        background: "#fff", borderRadius: 18, padding: "18px 20px", marginBottom: 20,
        cursor: "pointer", border: "1.5px solid #E8E8EC",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 26,
          background: "#F0E8FF", flexShrink: 0,
        }}>📋</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.nightMid, marginBottom: 2 }}>Start from Template</div>
          <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.4 }}>
            Popular routes you can customize — Visayas, Palawan, Siargao & more
          </div>
        </div>
        <div style={{ color: COLORS.gray400, fontSize: 18, flexShrink: 0 }}>→</div>
      </div>

      {/* What you get */}
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
        What your companion includes
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {ENRICHMENT_FEATURES.slice(0, 9).map((f, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 14, padding: "14px 10px", textAlign: "center",
            border: "1px solid #f0f0f0",
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.nightMid, lineHeight: 1.3 }}>{f.title}</div>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div style={{
        background: COLORS.sandLight, borderRadius: 16, padding: 16, marginBottom: 20,
        border: `1px solid ${COLORS.sand}`,
      }}>
        <div style={{ fontSize: 13, color: COLORS.gray800, lineHeight: 1.6, fontStyle: "italic" }}>
          "We had zero signal on the ferry to Siquijor and the app had everything — directions, restaurant picks, even the right phrases. Felt like traveling with a local friend."
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ocean, marginTop: 8 }}>
          — Sarah & Mike, 7-day Visayas trip
        </div>
      </div>
    </>
  );

  // ── UPLOAD SCREEN ──
  const UploadScreen = () => (
    <>
      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.nightMid, marginBottom: 4 }}>Upload Itinerary</div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 20, lineHeight: 1.5 }}>
        Upload a PDF, image, or document. Our AI reads it, finds your destinations, and builds your trip companion.
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${uploadFile ? COLORS.palm : COLORS.gray200}`,
          borderRadius: 20, padding: "40px 20px", textAlign: "center", cursor: "pointer",
          background: uploadFile ? COLORS.palmLight : "#fff",
          transition: "all 0.2s", marginBottom: 16,
        }}
      >
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
          style={{ display: "none" }}
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
        {uploadFile ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.palm }}>{uploadFile.name}</div>
            <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4 }}>Tap to change file</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.nightMid }}>Tap to upload</div>
            <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4 }}>
              PDF, image, Word doc, or text file
            </div>
          </>
        )}
      </div>

      <div style={{
        background: COLORS.sandLight, borderRadius: 14, padding: 14, marginBottom: 20,
        border: `1px solid ${COLORS.sand}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray800, marginBottom: 6 }}>Works with:</div>
        <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.7 }}>
          ✓ Travel agent itinerary PDFs<br />
          ✓ Screenshots from email or chat<br />
          ✓ Google Docs / Word documents<br />
          ✓ Booking confirmations<br />
          ✓ Even handwritten notes (photo)
        </div>
      </div>

      <button onClick={startProcessing} disabled={!uploadFile} style={{
        width: "100%", padding: 16, borderRadius: 14, border: "none",
        background: uploadFile ? COLORS.ocean : COLORS.gray200,
        color: uploadFile ? "#fff" : COLORS.gray400,
        fontSize: 16, fontWeight: 700, cursor: uploadFile ? "pointer" : "default",
      }}>
        Build My Trip Companion →
      </button>
    </>
  );

  // ── PASTE SCREEN ──
  const PasteScreen = () => (
    <>
      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.nightMid, marginBottom: 4 }}>Paste or Type</div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 16, lineHeight: 1.5 }}>
        Paste your itinerary from anywhere, or just describe your trip. Our AI handles the rest.
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"Paste your itinerary here, or describe your trip...\n\nExamples:\n• Copy/paste from an email\n• \"5 days in Cebu and Bohol, want to snorkel and see Chocolate Hills\"\n• Day-by-day breakdown from a travel blog"}
          style={{
            width: "100%", minHeight: 200, padding: 16, borderRadius: 16,
            border: `1.5px solid ${pasteText ? COLORS.ocean : "#E8E8EC"}`,
            fontSize: 14, lineHeight: 1.6, resize: "vertical",
            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            background: "#fff", color: COLORS.nightMid,
          }}
        />
        {!pasteText && (
          <button onClick={() => setPasteText(SAMPLE_PASTE)} style={{
            position: "absolute", bottom: 12, right: 12,
            padding: "6px 14px", borderRadius: 10, border: "1.5px solid #E8E8EC",
            background: "#fff", fontSize: 12, fontWeight: 600, color: COLORS.ocean,
            cursor: "pointer",
          }}>Try sample</button>
        )}
      </div>

      {pasteText && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", background: COLORS.palmLight, borderRadius: 12, marginBottom: 16,
        }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <div style={{ fontSize: 13, color: COLORS.palm, fontWeight: 600 }}>
            {pasteText.split("\n").filter((l) => l.trim()).length} lines detected — ready to process
          </div>
        </div>
      )}

      <button onClick={startProcessing} disabled={!pasteText.trim()} style={{
        width: "100%", padding: 16, borderRadius: 14, border: "none",
        background: pasteText.trim() ? COLORS.ocean : COLORS.gray200,
        color: pasteText.trim() ? "#fff" : COLORS.gray400,
        fontSize: 16, fontWeight: 700, cursor: pasteText.trim() ? "pointer" : "default",
      }}>
        Build My Trip Companion →
      </button>
    </>
  );

  // ── TEMPLATES SCREEN ──
  const TemplatesScreen = () => (
    <>
      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.nightMid, marginBottom: 4 }}>Trip Templates</div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 20, lineHeight: 1.5 }}>
        Start from a proven route and customize. Each template comes fully loaded with insider content.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        <Pill active={true} onClick={() => {}}>All</Pill>
        <Pill active={false} onClick={() => {}}>Visayas</Pill>
        <Pill active={false} onClick={() => {}}>Palawan</Pill>
        <Pill active={false} onClick={() => {}}>Mindanao</Pill>
      </div>

      {TEMPLATES.map((t) => (
        <div key={t.id} onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)} style={{
          background: "#fff", borderRadius: 18, marginBottom: 10, overflow: "hidden",
          border: selectedTemplate === t.id ? `2px solid ${COLORS.ocean}` : "1.5px solid #E8E8EC",
          boxShadow: selectedTemplate === t.id ? "0 4px 16px rgba(10,110,120,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
          cursor: "pointer", transition: "all 0.2s",
        }}>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 28,
                background: COLORS.sandLight, flexShrink: 0,
              }}>{t.image}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.nightMid }}>{t.title}</div>
                  {t.popular && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      background: COLORS.coral + "18", color: COLORS.coral,
                    }}>POPULAR</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 2 }}>{t.route}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: COLORS.ocean, fontWeight: 600 }}>📅 {t.duration}</span>
                  <span style={{ fontSize: 12, color: COLORS.gray400 }}>📍 {t.destinations} dest.</span>
                  <span style={{ fontSize: 12, color: COLORS.gray400 }}>🎯 {t.activities} activities</span>
                </div>
              </div>
            </div>

            {selectedTemplate === t.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, marginBottom: 2 }}>DIFFICULTY</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.nightMid }}>{t.difficulty}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, marginBottom: 2 }}>BEST FOR</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.nightMid }}>{t.bestFor}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, marginBottom: 6 }}>HIGHLIGHTS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {t.highlights.map((h, i) => (
                    <span key={i} style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: COLORS.ocean + "12", color: COLORS.ocean,
                    }}>{h}</span>
                  ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); startProcessing(); }} style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: COLORS.ocean, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>
                  Use This Template →
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );

  // ── PROCESSING SCREEN ──
  const ProcessingScreen = () => (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "70vh", textAlign: "center", padding: "0 20px",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: `linear-gradient(135deg, ${COLORS.ocean}, ${COLORS.oceanDark})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 24,
        animation: "pulse 2s ease-in-out infinite",
      }}>
        {processingSteps[processingStep]?.icon}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.nightMid, marginBottom: 8 }}>
        {processingSteps[processingStep]?.label}
      </div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 32 }}>
        Enriching your trip with local insider knowledge
      </div>

      {/* Progress steps */}
      <div style={{ width: "100%", maxWidth: 280 }}>
        {processingSteps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "8px 0",
            opacity: i <= processingStep ? 1 : 0.3, transition: "opacity 0.4s",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: i < processingStep ? COLORS.palm : i === processingStep ? COLORS.ocean : COLORS.gray200,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, transition: "background 0.4s",
            }}>
              {i < processingStep ? "✓" : s.icon}
            </div>
            <div style={{
              fontSize: 13, fontWeight: i === processingStep ? 700 : 500,
              color: i <= processingStep ? COLORS.nightMid : COLORS.gray400,
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );

  // ── PREVIEW / CONVERSION SCREEN ──
  const PreviewScreen = () => (
    <>
      {/* Success banner */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.palm}, #1a7a3a)`,
        borderRadius: 20, padding: "24px 20px", color: "#fff", marginBottom: 20,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Trip Companion Ready!</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          7 days · 3 destinations · 14 activities enriched
        </div>
      </div>

      {/* What we found */}
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.nightMid, marginBottom: 12 }}>
        Here's what we built for you
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { icon: "🧭", value: "47", label: "Local directions" },
          { icon: "🎥", value: "12", label: "360° videos" },
          { icon: "📞", value: "9", label: "Key contacts" },
          { icon: "🎒", value: "32", label: "Packing items" },
          { icon: "💬", value: "24", label: "Local phrases" },
          { icon: "💰", value: "18", label: "Cost references" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12, border: "1px solid #f0f0f0",
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.nightMid }}>{s.value}</div>
              <div style={{ fontSize: 11, color: COLORS.gray600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview card */}
      <div style={{
        background: "#fff", borderRadius: 18, overflow: "hidden",
        border: "1.5px solid #E8E8EC", marginBottom: 16,
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.ocean})`,
          padding: "16px 18px", color: "#fff",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.6 }}>PREVIEW</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Day 1: Arrive & Moalboal</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>📍 Moalboal, Cebu · Sat, Mar 15</div>
        </div>
        <div style={{ padding: "14px 18px" }}>
          {[
            { time: "10:30 AM", icon: "✈️", title: "Arrive Mactan-Cebu", tag: "Directions included" },
            { time: "3:00 PM", icon: "🐟", title: "Sardine Run Snorkeling", tag: "360° video + directions" },
            { time: "6:30 PM", icon: "🍽️", title: "Dinner at Pleasure Point", tag: "Local pick by Jenice" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: i < 2 ? "1px solid #f0f0f0" : "none",
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.nightMid }}>{item.title}</div>
                <div style={{ fontSize: 11, color: COLORS.ocean, fontWeight: 600 }}>{item.tag}</div>
              </div>
              <div style={{ fontSize: 12, color: COLORS.gray400 }}>{item.time}</div>
            </div>
          ))}
          <div style={{
            textAlign: "center", padding: "8px 0 4px", fontSize: 13, color: COLORS.gray400,
          }}>+ 6 more days...</div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: COLORS.sandLight, borderRadius: 16, padding: 20, marginBottom: 16,
        border: `1.5px solid ${COLORS.sand}`, textAlign: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.nightMid, marginBottom: 2 }}>$4.99</div>
        <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 16 }}>
          One-time purchase · Yours forever · Works offline
        </div>
        <button style={{
          width: "100%", padding: 16, borderRadius: 14, border: "none",
          background: `linear-gradient(135deg, ${COLORS.coral}, ${COLORS.coralDark || "#c55a33"})`,
          color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(232,115,74,0.4)",
        }}>
          Get My Trip Companion
        </button>
        <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 10 }}>
          📶 342 MB · Downloads to your phone for offline use
        </div>
      </div>

      {/* What's included */}
      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.nightMid, marginBottom: 10 }}>Everything included:</div>
      {ENRICHMENT_FEATURES.map((f, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0",
          borderBottom: i < ENRICHMENT_FEATURES.length - 1 ? "1px solid #f0f0f0" : "none",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>{f.title}</div>
            <div style={{ fontSize: 12, color: COLORS.gray600, lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        </div>
      ))}
    </>
  );

  // ── MAIN LAYOUT ──
  const showBack = mode !== "home";

  return (
    <div style={{
      width: "100%", maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: COLORS.gray100,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Top bar */}
      {showBack && mode !== "processing" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 8px",
          position: "sticky", top: 0, background: COLORS.gray100, zIndex: 10,
        }}>
          <button onClick={() => setMode("home")} style={{
            width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E8E8EC",
            background: "#fff", cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.nightMid }}>
            {mode === "upload" && "Upload Itinerary"}
            {mode === "paste" && "Paste Itinerary"}
            {mode === "templates" && "Trip Templates"}
            {mode === "preview" && "Your Trip Companion"}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: mode === "processing" ? "0 16px" : "12px 16px 40px" }}>
        {mode === "home" && <HomeScreen />}
        {mode === "upload" && <UploadScreen />}
        {mode === "paste" && <PasteScreen />}
        {mode === "templates" && <TemplatesScreen />}
        {mode === "processing" && <ProcessingScreen />}
        {mode === "preview" && <PreviewScreen />}
      </div>
    </div>
  );
}