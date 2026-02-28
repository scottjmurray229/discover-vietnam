import { useState, useRef, useEffect } from 'react';
import templates from '../../data/templates/trip-templates.json';
import { transformItinerary } from './transform-itinerary';
import type { ApiItinerary } from './transform-itinerary';
import type { TripData } from './companion-shared';

// CSS custom properties from the site's design system
const COLORS = {
  oceanTeal: '#0D7377',
  oceanDeep: '#064E56',
  warmCoral: '#E8654A',
  coralHover: '#D4553B',
  deepNight: '#1A2332',
  slate: '#4A5568',
  sand: '#F5F0E8',
  sandDark: '#EBE4D8',
  sky: '#E8F4F5',
  white: '#FFFFFF',
  palm: '#2D8A4E',
  palmLight: '#E8F5EC',
  sun: '#F2B531',
  sunLight: '#FFF9E6',
  coralLight: '#FFF3ED',
  gray100: '#F7F7F8',
  gray200: '#E8E8EC',
  gray400: '#9CA3AF',
  gray600: '#6B7280',
};

const SAMPLE_PASTE = `Day 1 - Arrive Hanoi, explore Old Quarter
Day 2 - Ha Long Bay overnight cruise
Day 3 - Ha Long Bay, return to Hanoi
Day 4 - Train to Hue, Imperial Citadel
Day 5 - Hue temples, Perfume River boat ride
Day 6 - Drive to Hoi An, lantern-lit old town
Day 7 - Hoi An cooking class, fly home from Da Nang`;

const ENRICHMENT_FEATURES = [
  { icon: '🧭', title: 'Real Directions' },
  { icon: '🌅', title: 'Sunrise/Sunset' },
  { icon: '💬', title: 'Local Phrases' },
  { icon: '📞', title: 'Key Contacts' },
  { icon: '🎒', title: 'Smart Packing' },
  { icon: '💰', title: 'Budget Tracker' },
  { icon: '💵', title: 'Tipping Guide' },
  { icon: '🌅', title: 'Sunrise/Sunset' },
  { icon: '📶', title: 'Works Offline' },
];

const PROCESSING_STEPS = [
  { label: 'Reading your itinerary...', icon: '📖' },
  { label: 'Identifying destinations...', icon: '📍' },
  { label: 'Matching local content...', icon: '🔗' },
  { label: 'Adding real directions...', icon: '🧭' },
  { label: 'Preparing sunrise & sunset times...', icon: '🌅' },
  { label: 'Building your trip companion...', icon: '✨' },
];

const STORAGE_KEY = 'companion_generated_itinerary';

type Screen = 'home' | 'upload' | 'paste' | 'templates' | 'processing' | 'preview';

interface TemplateData {
  id: string;
  title: string;
  duration: string;
  route: string;
  highlights: string[];
  difficulty: string;
  bestFor: string;
  emoji: string;
  popular: boolean;
  destinations: number;
  activities: number;
  destinationSlugs: string[];
}

export default function IntakeFlow() {
  const [screen, setScreen] = useState<Screen>('home');
  const [pasteText, setPasteText] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // New state for API integration
  const [apiError, setApiError] = useState<string | null>(null);
  const [generatedTrip, setGeneratedTrip] = useState<TripData | null>(null);
  const [apiFinished, setApiFinished] = useState(false);
  const [animFinished, setAnimFinished] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cancelled') === 'true') {
      setCancelled(true);
      // Restore trip from localStorage if returning from cancelled checkout
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setGeneratedTrip(JSON.parse(stored));
        }
      } catch { /* ignore parse errors */ }
      setScreen('preview');
    }
  }, []);

  // Build the API request body depending on which path the user took
  function buildApiRequestBody(): { destinations?: string[]; duration?: string; description?: string } {
    if (selectedTemplate) {
      const tmpl = (templates as TemplateData[]).find(t => t.id === selectedTemplate);
      if (tmpl) {
        return {
          destinations: tmpl.destinationSlugs,
          duration: tmpl.duration,
          description: tmpl.highlights.join(', '),
        };
      }
    }

    if (pasteText.trim()) {
      return { description: pasteText.trim() };
    }

    // Upload path — text file content used as description
    return { description: '' };
  }

  async function callApi(body: { destinations?: string[]; duration?: string; description?: string }): Promise<TripData> {
    const res = await fetch('/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate itinerary. Please try again.');
    }

    return transformItinerary(data.itinerary as ApiItinerary);
  }

  function runAnimation(): Promise<void> {
    return new Promise((resolve) => {
      setProcessingStep(0);
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= PROCESSING_STEPS.length) {
          clearInterval(interval);
          setTimeout(resolve, 600);
        } else {
          setProcessingStep(step);
        }
      }, 900);
    });
  }

  async function startProcessing() {
    setScreen('processing');
    setApiError(null);
    setApiFinished(false);
    setAnimFinished(false);

    let requestBody = buildApiRequestBody();

    // Upload path: read text file content
    if (uploadFile) {
      try {
        const text = await uploadFile.text();
        requestBody = { description: text };
      } catch {
        requestBody = { description: '' };
      }
    }

    // Run animation and API call concurrently
    const animPromise = runAnimation().then(() => setAnimFinished(true));
    const apiPromise = callApi(requestBody)
      .then((trip) => {
        setGeneratedTrip(trip);
        // Store in localStorage for persistence across Stripe redirect
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trip)); } catch { /* quota */ }
        setApiFinished(true);
        return true;
      })
      .catch((err) => {
        setApiError(err.message);
        setApiFinished(true);
        return false;
      });

    // Wait for both to complete
    const [, apiSuccess] = await Promise.all([animPromise, apiPromise]);
    // If API failed, stay on processing screen — useEffect below handles transition
    if (apiSuccess) {
      setScreen('preview');
    }
  }

  // Handle the case where API finishes with error after animation
  useEffect(() => {
    if (animFinished && apiFinished && apiError) {
      // Show error on preview screen with retry option
      setScreen('preview');
    }
  }, [animFinished, apiFinished, apiError]);

  const goBack = () => {
    setScreen('home');
    setSelectedTemplate(null);
    setApiError(null);
  };

  // Compute preview stats from generated trip
  const previewStats = generatedTrip ? {
    days: generatedTrip.days.length,
    destinations: new Set(generatedTrip.days.map(d => d.location)).size,
    activities: generatedTrip.days.reduce((sum, d) => sum + d.items.length, 0),
  } : { days: 0, destinations: 0, activities: 0 };

  // ── HOME SCREEN ──
  const HomeScreen = () => (
    <>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.oceanTeal})`,
        borderRadius: 24, padding: '28px 24px', color: '#fff', marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20, fontSize: 100, opacity: 0.08,
          transform: 'rotate(-15deg)',
        }}>🇻🇳</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, opacity: 0.6, marginBottom: 8 }}>
          DISCOVER VIETNAM
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          Your Trip.<br />Your Companion.
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5, maxWidth: 300 }}>
          Turn any Vietnam itinerary into an offline trip companion with local directions, budget tracking, and insider tips.
        </div>
      </div>

      {/* Get started */}
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray600, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
        Get started
      </div>

      {/* AI Trip Planner */}
      <div
        onClick={() => setScreen('templates')}
        style={{
          background: `linear-gradient(135deg, ${COLORS.palm}, #1a7a3a)`,
          borderRadius: 18, padding: '20px 20px', marginBottom: 10, cursor: 'pointer',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 10, right: 16, fontSize: 36, opacity: 0.2 }}>🤖</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.7, marginBottom: 4 }}>RECOMMENDED</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Build with AI Trip Planner</div>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>
          Tell us your dates, interests, and budget. Our AI builds a complete itinerary with all companion features.
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
          background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '6px 14px',
          fontSize: 12, fontWeight: 600,
        }}>Start Planning →</div>
      </div>

      {/* Upload */}
      <PathCard
        onClick={() => setScreen('upload')}
        icon="📄"
        iconBg={COLORS.coralLight}
        title="Upload Itinerary"
        desc="PDF, screenshot, or document from your travel agent or planner"
      />

      {/* Paste */}
      <PathCard
        onClick={() => setScreen('paste')}
        icon="✏️"
        iconBg={COLORS.sunLight}
        title="Paste or Type"
        desc="Copy from email, notes, or just describe your plans"
      />

      {/* Templates */}
      <PathCard
        onClick={() => setScreen('templates')}
        icon="📋"
        iconBg="#F0E8FF"
        title="Start from Template"
        desc="Popular routes you can customize — North, Central, South Vietnam & more"
        style={{ marginBottom: 20 }}
      />

      {/* What you get */}
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gray600, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
        What your companion includes
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {ENRICHMENT_FEATURES.map((f, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center' as const,
            border: '1px solid #f0f0f0',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.deepNight, lineHeight: 1.3 }}>{f.title}</div>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div style={{
        background: COLORS.sand, borderRadius: 16, padding: 16, marginBottom: 20,
        border: `1px solid ${COLORS.sandDark}`,
      }}>
        <div style={{ fontSize: 13, color: COLORS.deepNight, lineHeight: 1.6, fontStyle: 'italic' }}>
          "We had zero signal on the sleeper bus to Sapa and the app had everything — directions, restaurant picks, even the right phrases. Felt like traveling with a local friend."
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.oceanTeal, marginTop: 8 }}>
          — Sarah & Mike, 7-day Vietnam trip
        </div>
      </div>
    </>
  );

  // ── UPLOAD SCREEN ──
  const UploadScreen = () => {
    const isTextFile = uploadFile && /\.(txt|text|csv|md)$/i.test(uploadFile.name);
    const isUnsupported = uploadFile && !isTextFile;

    return (
      <>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.deepNight, marginBottom: 4 }}>Upload Itinerary</div>
        <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 20, lineHeight: 1.5 }}>
          Upload a text file with your itinerary. Our AI reads it, finds your destinations, and builds your trip companion.
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${uploadFile ? (isUnsupported ? COLORS.warmCoral : COLORS.palm) : COLORS.gray200}`,
            borderRadius: 20, padding: '40px 20px', textAlign: 'center' as const, cursor: 'pointer',
            background: uploadFile ? (isUnsupported ? COLORS.coralLight : COLORS.palmLight) : '#fff',
            transition: 'all 0.2s', marginBottom: 16,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.text,.csv,.md,.doc,.docx,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          />
          {uploadFile ? (
            isUnsupported ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.warmCoral }}>{uploadFile.name}</div>
                <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4, lineHeight: 1.5 }}>
                  PDF and image files aren't supported yet. Please paste your itinerary text instead, or upload a .txt file.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.palm }}>{uploadFile.name}</div>
                <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4 }}>Tap to change file</div>
              </>
            )
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.deepNight }}>Tap to upload</div>
              <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 4 }}>
                Text file (.txt, .md, .csv)
              </div>
            </>
          )}
        </div>

        <div style={{
          background: COLORS.sand, borderRadius: 14, padding: 14, marginBottom: 20,
          border: `1px solid ${COLORS.sandDark}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.deepNight, marginBottom: 6 }}>Works with:</div>
          <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.7 }}>
            ✓ Text files with day-by-day plans<br />
            ✓ Copy-pasted itineraries saved as .txt<br />
            ✓ Markdown or CSV exports<br />
            <br />
            <strong>Tip:</strong> For PDFs or images, use the "Paste or Type" option instead — just copy the text from your document.
          </div>
        </div>

        <ActionButton onClick={startProcessing} disabled={!uploadFile || !!isUnsupported}>
          Build My Trip Companion →
        </ActionButton>
      </>
    );
  };

  // ── PASTE SCREEN ──
  const PasteScreen = () => (
    <>
      <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.deepNight, marginBottom: 4 }}>Paste or Type</div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 16, lineHeight: 1.5 }}>
        Paste your itinerary from anywhere, or just describe your trip. Our AI handles the rest.
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"Paste your itinerary here, or describe your trip...\n\nExamples:\n• Copy/paste from an email\n• \"5 days in Hanoi and Ha Long Bay, want to explore temples and cruise the bay\"\n• Day-by-day breakdown from a travel blog"}
          style={{
            width: '100%', minHeight: 200, padding: 16, borderRadius: 16,
            border: `1.5px solid ${pasteText ? COLORS.oceanTeal : '#E8E8EC'}`,
            fontSize: 14, lineHeight: 1.6, resize: 'vertical' as const,
            fontFamily: "'Outfit', system-ui, sans-serif", outline: 'none', boxSizing: 'border-box' as const,
            background: '#fff', color: COLORS.deepNight,
          }}
        />
        {!pasteText && (
          <button onClick={() => setPasteText(SAMPLE_PASTE)} style={{
            position: 'absolute', bottom: 12, right: 12,
            padding: '6px 14px', borderRadius: 10, border: '1.5px solid #E8E8EC',
            background: '#fff', fontSize: 12, fontWeight: 600, color: COLORS.oceanTeal,
            cursor: 'pointer',
          }}>Try sample</button>
        )}
      </div>

      {pasteText && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', background: COLORS.palmLight, borderRadius: 12, marginBottom: 16,
        }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <div style={{ fontSize: 13, color: COLORS.palm, fontWeight: 600 }}>
            {pasteText.split('\n').filter((l) => l.trim()).length} lines detected — ready to process
          </div>
        </div>
      )}

      <ActionButton onClick={startProcessing} disabled={!pasteText.trim()}>
        Build My Trip Companion →
      </ActionButton>
    </>
  );

  // ── TEMPLATES SCREEN ──
  const TemplatesScreen = () => {
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all'
      ? templates
      : templates.filter((t) => {
          if (filter === 'north') return t.route.match(/Hanoi|Sapa|Ha Long|Ninh Binh/i);
          if (filter === 'central') return t.route.match(/Hue|Da Nang|Hoi An|Nha Trang|Dalat/i);
          if (filter === 'south') return t.route.match(/Ho Chi Minh|Phu Quoc|Dalat|Nha Trang|Mekong|Can Tho|Mui Ne/i);
          return true;
        });

    return (
      <>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.deepNight, marginBottom: 4 }}>Trip Templates</div>
        <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 20, lineHeight: 1.5 }}>
          Start from a proven route and customize. Each template comes fully loaded with insider content.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' as const }}>
          {['all', 'north', 'central', 'south'].map((f) => (
            <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Pill>
          ))}
        </div>

        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
            style={{
              background: '#fff', borderRadius: 18, marginBottom: 10, overflow: 'hidden',
              border: selectedTemplate === t.id ? `2px solid ${COLORS.oceanTeal}` : '1.5px solid #E8E8EC',
              boxShadow: selectedTemplate === t.id ? '0 4px 16px rgba(13,115,119,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 28,
                  background: COLORS.sand, flexShrink: 0,
                }}>{t.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.deepNight }}>{t.title}</div>
                    {t.popular && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(232,101,74,0.1)', color: COLORS.warmCoral,
                      }}>POPULAR</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.gray600, marginTop: 2 }}>{t.route}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: COLORS.oceanTeal, fontWeight: 600 }}>📅 {t.duration}</span>
                    <span style={{ fontSize: 12, color: COLORS.gray400 }}>📍 {t.destinations} dest.</span>
                    <span style={{ fontSize: 12, color: COLORS.gray400 }}>🎯 {t.activities} activities</span>
                  </div>
                </div>
              </div>

              {selectedTemplate === t.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, marginBottom: 2 }}>DIFFICULTY</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.deepNight }}>{t.difficulty}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, marginBottom: 2 }}>BEST FOR</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.deepNight }}>{t.bestFor}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.gray400, marginBottom: 6 }}>HIGHLIGHTS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 14 }}>
                    {t.highlights.map((h, i) => (
                      <span key={i} style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: 'rgba(13,115,119,0.08)', color: COLORS.oceanTeal,
                      }}>{h}</span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); startProcessing(); }}
                    style={{
                      width: '100%', padding: 14, borderRadius: 12, border: 'none',
                      background: COLORS.oceanTeal, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Use This Template →
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </>
    );
  };

  // ── PROCESSING SCREEN ──
  const ProcessingScreen = () => (
    <div style={{
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      justifyContent: 'center', minHeight: '70vh', textAlign: 'center' as const, padding: '0 20px',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: `linear-gradient(135deg, ${COLORS.oceanTeal}, ${COLORS.oceanDeep})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 40, marginBottom: 24,
        animation: 'companion-process-pulse 2s ease-in-out infinite',
      }}>
        {animFinished && !apiFinished
          ? '⏳'
          : PROCESSING_STEPS[processingStep]?.icon}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.deepNight, marginBottom: 8 }}>
        {animFinished && !apiFinished
          ? 'Finalizing your itinerary...'
          : PROCESSING_STEPS[processingStep]?.label}
      </div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 32 }}>
        {animFinished && !apiFinished
          ? 'Almost there — our AI is crafting your perfect trip'
          : 'Enriching your trip with local insider knowledge'}
      </div>

      <div style={{ width: '100%', maxWidth: 280 }}>
        {PROCESSING_STEPS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
            opacity: i <= processingStep ? 1 : 0.3, transition: 'opacity 0.4s',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: i < processingStep ? COLORS.palm : i === processingStep ? COLORS.oceanTeal : COLORS.gray200,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, transition: 'background 0.4s',
            }}>
              {i < processingStep ? '✓' : s.icon}
            </div>
            <div style={{
              fontSize: 13, fontWeight: i === processingStep ? 700 : 500,
              color: i <= processingStep ? COLORS.deepNight : COLORS.gray400,
              textAlign: 'left' as const,
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes companion-process-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );

  const handleCheckout = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setCheckoutLoading(true);

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          source: selectedTemplate ? 'template' : uploadFile ? 'upload' : pasteText ? 'paste' : 'direct',
          templateId: selectedTemplate || '',
        }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setEmailError(data.error || 'Something went wrong. Please try again.');
        setCheckoutLoading(false);
      }
    } catch {
      setEmailError('Connection error. Please try again.');
      setCheckoutLoading(false);
    }
  };

  // ── PREVIEW SCREEN ──
  const PreviewScreen = () => (
    <>
      {/* Cancelled banner */}
      {cancelled && (
        <div style={{
          background: '#FFF3ED', borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          border: '1.5px solid rgba(232,101,74,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>↩️</span>
          <div style={{ fontSize: 13, color: COLORS.deepNight, lineHeight: 1.4 }}>
            <strong>Checkout cancelled.</strong> No worries — your companion is still ready. Enter your email below when you're ready to purchase.
          </div>
        </div>
      )}

      {/* Error state */}
      {apiError && (
        <div style={{
          background: '#FEE2E2', borderRadius: 16, padding: '20px', marginBottom: 16,
          border: '1.5px solid rgba(220,38,38,0.2)', textAlign: 'center' as const,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>😔</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.deepNight, marginBottom: 6 }}>
            Couldn't generate your itinerary
          </div>
          <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.5, marginBottom: 16 }}>
            {apiError}
          </div>
          <button
            onClick={() => { setApiError(null); startProcessing(); }}
            style={{
              padding: '12px 28px', borderRadius: 12, border: 'none',
              background: COLORS.oceanTeal, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Success banner */}
      {!apiError && (
        <>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.palm}, #1a7a3a)`,
            borderRadius: 20, padding: '24px 20px', color: '#fff', marginBottom: 20,
            textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Trip Companion Ready!</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {previewStats.days} days · {previewStats.destinations} destination{previewStats.destinations !== 1 ? 's' : ''} · {previewStats.activities} activities enriched
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.deepNight, marginBottom: 12 }}>
            Here's what we built for you
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { icon: '🧭', value: String(previewStats.activities), label: 'Activities planned' },
              { icon: '📍', value: String(previewStats.destinations), label: 'Destinations' },
              { icon: '📅', value: String(previewStats.days), label: 'Days planned' },
              { icon: '💰', value: String(generatedTrip?.days.reduce((sum, d) => sum + d.items.filter(i => i.type === 'food').length, 0) || 0), label: 'Meals included' },
            ].map((s, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #f0f0f0',
              }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.deepNight }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Day 1 preview — real data */}
          {generatedTrip && generatedTrip.days.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 18, overflow: 'hidden',
              border: '1.5px solid #E8E8EC', marginBottom: 16,
            }}>
              <div style={{
                background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.oceanTeal})`,
                padding: '16px 18px', color: '#fff',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.6 }}>PREVIEW</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Day 1: {generatedTrip.days[0].title}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>📍 {generatedTrip.days[0].location} · {generatedTrip.days[0].date}</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                {generatedTrip.days[0].items.slice(0, 3).map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: i < Math.min(generatedTrip.days[0].items.length, 3) - 1 ? '1px solid #f0f0f0' : 'none',
                  }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.deepNight }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: COLORS.oceanTeal, fontWeight: 600 }}>
                        {item.type === 'transport' ? 'Directions included' : item.type === 'food' ? 'Local recommendation' : 'Local tips included'}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.gray400 }}>{item.time}</div>
                  </div>
                ))}
                {previewStats.days > 1 && (
                  <div style={{
                    textAlign: 'center' as const, padding: '8px 0 4px', fontSize: 13, color: COLORS.gray400,
                  }}>+ {previewStats.days - 1} more day{previewStats.days > 2 ? 's' : ''}...</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pricing CTA */}
      {!apiError && (
        <div style={{
          background: COLORS.sand, borderRadius: 16, padding: 20, marginBottom: 16,
          border: `1.5px solid ${COLORS.sandDark}`, textAlign: 'center' as const,
        }}>
          <div style={{ display: 'inline-block', background: '#38A169', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: 100, marginBottom: 8 }}>Free Through June 30</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.deepNight, marginBottom: 2 }}><s style={{ fontSize: 16, color: COLORS.gray600, opacity: 0.5, fontWeight: 600, marginRight: 6 }}>$7.99</s> Free</div>
          <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 16 }}>
            Free during launch · $7.99 starting July 1, 2026
          </div>

          {/* Email input */}
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            placeholder="Enter your email"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12, marginBottom: 8,
              border: `1.5px solid ${emailError ? COLORS.warmCoral : '#E8E8EC'}`,
              fontSize: 15, outline: 'none', boxSizing: 'border-box' as const,
              fontFamily: "'Outfit', system-ui, sans-serif", textAlign: 'left' as const,
              background: '#fff',
            }}
          />
          {emailError && (
            <div style={{
              fontSize: 12, color: COLORS.warmCoral, textAlign: 'left' as const,
              marginBottom: 8, fontWeight: 600,
            }}>
              {emailError}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            style={{
              width: '100%', padding: 16, borderRadius: 14, border: 'none',
              background: checkoutLoading
                ? COLORS.gray200
                : `linear-gradient(135deg, ${COLORS.warmCoral}, ${COLORS.coralHover})`,
              color: checkoutLoading ? COLORS.gray600 : '#fff',
              fontSize: 17, fontWeight: 800,
              cursor: checkoutLoading ? 'default' : 'pointer',
              boxShadow: checkoutLoading ? 'none' : '0 4px 16px rgba(232,101,74,0.4)',
            }}
          >
            {checkoutLoading ? 'Redirecting to checkout...' : 'Get My Trip Companion'}
          </button>
          <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 10 }}>
            Works on any device · No app store needed
          </div>
        </div>
      )}

      {/* Features list */}
      {!apiError && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.deepNight, marginBottom: 10 }}>Everything included:</div>
          {[
            { icon: '🧭', title: 'Real Directions', desc: "Not Google Maps pins — actual 'grab a xe om, tell the driver Bui Vien' directions" },
            { icon: '🌅', title: 'Sunrise/Sunset', desc: 'Golden hour times with best viewpoints matched to your daily locations' },
            { icon: '💬', title: 'Local Phrases', desc: 'Vietnamese phrases tuned to your destinations with pronunciation' },
            { icon: '📞', title: 'Key Contacts', desc: 'Emergency numbers, hospitals, trusted local drivers & guides for your specific route' },
            { icon: '🎒', title: 'Smart Packing', desc: 'Checklist auto-generated from your activities — canyoneering adds water shoes' },
            { icon: '💰', title: 'Budget Tracker', desc: 'Log expenses, see typical costs, convert currency — all offline' },
            { icon: '💵', title: 'Tipping Guide', desc: 'What to tip in every Vietnam situation, from trike drivers to dive masters' },
            { icon: '🌅', title: 'Sunrise/Sunset', desc: 'Golden hour times with best viewpoints matched to your daily locations' },
            { icon: '📶', title: 'Works Offline', desc: 'Everything cached to your phone. No signal on the ferry? No problem' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0',
              borderBottom: i < 8 ? '1px solid #f0f0f0' : 'none',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.deepNight }}>{f.title}</div>
                <div style={{ fontSize: 12, color: COLORS.gray600, lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );

  // ── SHARED SUB-COMPONENTS ──
  const showBack = screen !== 'home';
  const screenTitle: Record<string, string> = {
    upload: 'Upload Itinerary',
    paste: 'Paste Itinerary',
    templates: 'Trip Templates',
    preview: 'Your Trip Companion',
  };

  return (
    <div style={{
      width: '100%', maxWidth: 430, margin: '0 auto', minHeight: '100vh',
      background: COLORS.gray100,
      fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
    }}>
      {/* Top bar */}
      {showBack && screen !== 'processing' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 8px',
          position: 'sticky' as const, top: 0, background: COLORS.gray100, zIndex: 10,
        }}>
          <button onClick={goBack} style={{
            width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E8E8EC',
            background: '#fff', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.deepNight }}>
            {screenTitle[screen] || ''}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: screen === 'processing' ? '0 16px' : '12px 16px 40px' }}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'upload' && <UploadScreen />}
        {screen === 'paste' && <PasteScreen />}
        {screen === 'templates' && <TemplatesScreen />}
        {screen === 'processing' && <ProcessingScreen />}
        {screen === 'preview' && <PreviewScreen />}
      </div>
    </div>
  );
}

// ── Reusable sub-components ──

function PathCard({
  onClick, icon, iconBg, title, desc, style: extraStyle,
}: {
  onClick: () => void;
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  style?: React.CSSProperties;
}) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 18, padding: '18px 20px', marginBottom: 10,
      cursor: 'pointer', border: '1.5px solid #E8E8EC',
      display: 'flex', alignItems: 'center', gap: 16,
      ...extraStyle,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 26,
        background: iconBg, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2332', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div style={{ color: '#9CA3AF', fontSize: 18, flexShrink: 0 }}>→</div>
    </div>
  );
}

function Pill({
  active, children, onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      padding: '8px 18px', borderRadius: 24, cursor: 'pointer', whiteSpace: 'nowrap' as const,
      fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
      background: active ? '#064E56' : '#fff',
      color: active ? '#fff' : '#6B7280',
      border: active ? 'none' : '1.5px solid #E8E8EC',
      boxShadow: active ? '0 2px 8px rgba(13,115,119,0.25)' : 'none',
    }}>{children}</div>
  );
}

function ActionButton({
  onClick, disabled, children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: 16, borderRadius: 14, border: 'none',
      background: disabled ? '#E8E8EC' : '#0D7377',
      color: disabled ? '#9CA3AF' : '#fff',
      fontSize: 16, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    }}>
      {children}
    </button>
  );
}
