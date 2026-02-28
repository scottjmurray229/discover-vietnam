import { useState } from "react";

// ═══════════════════════════════════════════
// DISCOVER PHILIPPINES — PAYMENT ARCHITECTURE
// Stripe + Cloudflare Workers + KV
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
  stripe: "#635BFF", stripeLight: "#F0EFFF",
  gray100: "#F7F7F8", gray200: "#E8E8EC",
  gray400: "#9CA3AF", gray600: "#6B7280", gray800: "#374151",
};

const FLOW_STEPS = [
  {
    id: "trigger",
    title: "1. User Triggers Purchase",
    where: "PWA (Client)",
    tech: "Astro + React",
    detail: "User taps 'Get My Trip Companion' on the preview screen. Client sends trip manifest ID to your Cloudflare Worker.",
    code: `// Client-side (PWA)
const response = await fetch(
  'https://api.discoverphilippines.com/create-checkout',
  {
    method: 'POST',
    body: JSON.stringify({
      tripId: 'trip_cebu_bohol_siquijor_2026',
      email: 'scott@email.com',
      companions: 4
    })
  }
);
const { checkoutUrl } = await response.json();
window.location.href = checkoutUrl;`,
    icon: "📱",
    color: COLORS.ocean,
  },
  {
    id: "checkout",
    title: "2. Create Stripe Checkout Session",
    where: "Cloudflare Worker",
    tech: "Workers + Stripe SDK",
    detail: "Worker creates a Stripe Checkout session with your product, price, and trip metadata. Returns the hosted checkout URL. You never touch card data.",
    code: `// Cloudflare Worker: /create-checkout
export default {
  async fetch(request, env) {
    const { tripId, email } = await request.json();
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: env.STRIPE_PRICE_ID, // $7.99 one-time
        quantity: 1,
      }],
      customer_email: email,
      metadata: { tripId },  // Links payment to trip
      success_url: 'https://discoverphilippines.com'
        + '/companion/\${tripId}?session={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://discoverphilippines.com'
        + '/companion/\${tripId}?cancelled=true',
      // Optional: Enable Apple Pay + Google Pay
      payment_method_options: {
        card: { setup_future_usage: null }
      }
    });
    
    return Response.json({ checkoutUrl: session.url });
  }
}`,
    icon: "⚡",
    color: COLORS.stripe,
  },
  {
    id: "pay",
    title: "3. User Pays on Stripe",
    where: "Stripe Hosted Checkout",
    tech: "Stripe",
    detail: "User sees Stripe's hosted checkout page. Credit card, Apple Pay, Google Pay all available. Stripe handles PCI compliance, fraud detection, 3D Secure. You handle nothing.",
    code: `// You don't write any code here!
// Stripe handles:
// ✅ Card number collection (PCI compliant)
// ✅ Apple Pay / Google Pay buttons
// ✅ 3D Secure authentication
// ✅ Fraud detection (Radar)
// ✅ International cards & currencies
// ✅ Mobile-optimized checkout UI
// 
// Cost: 2.9% + $0.30 per transaction
// On $7.99: you keep $7.46`,
    icon: "💳",
    color: COLORS.stripe,
  },
  {
    id: "webhook",
    title: "4. Webhook Confirms Payment",
    where: "Cloudflare Worker",
    tech: "Workers + Stripe Webhooks",
    detail: "Stripe sends a webhook to your Worker endpoint when payment succeeds. Worker verifies the webhook signature (critical for security), extracts trip metadata, and proceeds to generate access.",
    code: `// Cloudflare Worker: /stripe-webhook
export default {
  async fetch(request, env) {
    const signature = request.headers
      .get('stripe-signature');
    const body = await request.text();
    
    // CRITICAL: Verify webhook is really from Stripe
    const event = stripe.webhooks
      .constructEvent(
        body, signature, env.WEBHOOK_SECRET
      );
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tripId = session.metadata.tripId;
      const email = session.customer_email;
      
      // Generate access token
      const accessToken = crypto.randomUUID();
      
      // Store in Cloudflare KV
      await env.TRIPS_KV.put(
        'access:\${tripId}',
        JSON.stringify({
          token: accessToken,
          email,
          tripId,
          paidAt: new Date().toISOString(),
          companions: [],
          stripeSessionId: session.id
        }),
        { expirationTtl: 365 * 24 * 60 * 60 }
      );
      
      // TODO: Send confirmation email via
      // Resend / Mailgun / SendGrid
    }
    
    return new Response('ok', { status: 200 });
  }
}`,
    icon: "🔔",
    color: COLORS.palm,
  },
  {
    id: "unlock",
    title: "5. Companion Unlocks",
    where: "PWA (Client)",
    tech: "Service Worker + Cache API",
    detail: "User returns from Stripe checkout to your success URL. PWA checks the access token, stores it locally, and begins caching all premium content for offline use. The download progress screen shows what's being cached.",
    code: `// Client-side: Success page handler
const session = new URLSearchParams(
  window.location.search
).get('session');

// Verify purchase with your Worker
const res = await fetch(
  '/api/verify-purchase?session=' + session
);
const { token, tripManifest } = await res.json();

// Store token locally (survives offline)
localStorage.setItem('trip_token', token);
localStorage.setItem('trip_id', tripManifest.tripId);

// Begin offline caching via Service Worker
navigator.serviceWorker.controller
  .postMessage({
    type: 'CACHE_TRIP',
    manifest: tripManifest,
    // Includes: pages, videos, maps, contacts
    assets: tripManifest.offlineAssets
  });

// Service Worker caches everything
// User sees download progress bar
// "Downloading Day 1... Day 2... 360° videos..."`,
    icon: "🔓",
    color: COLORS.ocean,
  },
  {
    id: "share",
    title: "6. Group Sharing",
    where: "Cloudflare Worker + KV",
    tech: "Workers + KV + Share Links",
    detail: "Host generates a share link. When a companion clicks it, your Worker checks the trip's access record in KV, adds them as a companion (up to 8), and grants them the same access token. No payment required.",
    code: `// Cloudflare Worker: /join-trip
export default {
  async fetch(request, env) {
    const { tripId, shareCode, name } = 
      await request.json();
    
    // Look up trip access in KV
    const access = JSON.parse(
      await env.TRIPS_KV.get('access:\${tripId}')
    );
    
    if (!access) return new Response(
      'Trip not found', { status: 404 }
    );
    
    // Check companion limit
    if (access.companions.length >= 8) {
      return Response.json(
        { error: 'Group is full (8 max)' },
        { status: 403 }
      );
    }
    
    // Add companion
    access.companions.push({
      name,
      joinedAt: new Date().toISOString()
    });
    
    await env.TRIPS_KV.put(
      'access:\${tripId}',
      JSON.stringify(access)
    );
    
    // Return same access token
    // Companion gets full premium access
    return Response.json({
      token: access.token,
      tripId,
      role: 'companion'
    });
  }
}`,
    icon: "👥",
    color: COLORS.purple,
  },
];

const REVENUE_MODEL = {
  scenarios: [
    {
      label: "Conservative (Year 1)",
      monthlyVisitors: 5000,
      conversionToFree: 0.08,
      freeToPayRate: 0.15,
      avgCompanions: 2.5,
      affiliateBookingRate: 0.12,
      avgBookingValue: 35,
      affiliateCommission: 0.05,
    },
    {
      label: "Moderate (Year 2)",
      monthlyVisitors: 15000,
      conversionToFree: 0.10,
      freeToPayRate: 0.18,
      avgCompanions: 3,
      affiliateBookingRate: 0.15,
      avgBookingValue: 40,
      affiliateCommission: 0.05,
    },
    {
      label: "Growth (Year 3)",
      monthlyVisitors: 40000,
      conversionToFree: 0.12,
      freeToPayRate: 0.20,
      avgCompanions: 3.5,
      affiliateBookingRate: 0.18,
      avgBookingValue: 45,
      affiliateCommission: 0.06,
    },
  ],
  price: 7.99,
  stripeFee: 0.029,
  stripeFixed: 0.30,
  activitiesPerTrip: 6,
};

const INFRA_COSTS = [
  { item: "Cloudflare Pages", cost: "Free", note: "Static hosting for Astro site" },
  { item: "Cloudflare Workers", cost: "~$5/mo", note: "First 10M requests free, then $0.50/M" },
  { item: "Cloudflare KV", cost: "~$5/mo", note: "First 100K reads/day free" },
  { item: "Stripe", cost: "2.9% + $0.30/txn", note: "No monthly fee. ~$0.53 per $7.99 sale" },
  { item: "Stripe Tax (optional)", cost: "$0.50/txn", note: "Add when volume justifies it" },
  { item: "Domain + SSL", cost: "~$12/year", note: "Already have this" },
  { item: "Email (Resend)", cost: "Free tier", note: "First 3K emails/mo free" },
  { item: "Claude API", cost: "~$0.01–0.05/trip", note: "For AI trip planner + itinerary parsing" },
];

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export default function PaymentArchitecture() {
  const [activeStep, setActiveStep] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [view, setView] = useState("flow"); // flow, revenue, infra, tax
  const [scenarioIdx, setScenarioIdx] = useState(0);

  const scenario = REVENUE_MODEL.scenarios[scenarioIdx];
  const monthlyFreeUsers = Math.round(scenario.monthlyVisitors * scenario.conversionToFree);
  const monthlyPaidUsers = Math.round(monthlyFreeUsers * scenario.freeToPayRate);
  const yearlyPaidUsers = monthlyPaidUsers * 12;
  const grossRevenue = yearlyPaidUsers * REVENUE_MODEL.price;
  const stripeFees = yearlyPaidUsers * (REVENUE_MODEL.price * REVENUE_MODEL.stripeFee + REVENUE_MODEL.stripeFixed);
  const netDirectRevenue = grossRevenue - stripeFees;
  const totalEyeballs = yearlyPaidUsers * (1 + scenario.avgCompanions);
  const affiliateBookings = totalEyeballs * scenario.affiliateBookingRate * REVENUE_MODEL.activitiesPerTrip;
  const affiliateRevenue = affiliateBookings * scenario.avgBookingValue * scenario.affiliateCommission;
  const totalRevenue = netDirectRevenue + affiliateRevenue;

  const Pill = ({ active, children, onClick }) => (
    <div onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap",
      fontSize: 13, fontWeight: 600, background: active ? COLORS.oceanDark : "#fff",
      color: active ? "#fff" : COLORS.gray600,
      border: active ? "none" : "1px solid #E8E8EC",
      boxShadow: active ? "0 2px 8px rgba(10,110,120,0.25)" : "none",
    }}>{children}</div>
  );

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.nightMid, marginBottom: 12, marginTop: 8 }}>{children}</div>
  );

  // ── FLOW VIEW ──
  const FlowView = () => (
    <>
      <SectionTitle>Payment Flow Architecture</SectionTitle>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 16, lineHeight: 1.5 }}>
        End-to-end from purchase tap to offline companion. All on your existing Astro + Cloudflare stack.
      </div>

      {FLOW_STEPS.map((step, i) => {
        const isActive = activeStep === i;
        return (
          <div key={step.id}>
            <div onClick={() => setActiveStep(isActive ? -1 : i)} style={{
              background: "#fff", borderRadius: 16, padding: 16, marginBottom: 4, cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: isActive ? `1.5px solid ${step.color}33` : "1.5px solid transparent",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: step.color + "15",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>{step.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.nightMid, lineHeight: 1.3 }}>{step.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: step.color + "12", color: step.color }}>{step.where}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: COLORS.gray100, color: COLORS.gray600 }}>{step.tech}</span>
                  </div>
                </div>
                <div style={{ fontSize: 18, color: COLORS.gray400, transform: isActive ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</div>
              </div>

              {isActive && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.6, marginBottom: 12 }}>{step.detail}</div>
                  <div style={{
                    background: COLORS.nightMid, borderRadius: 12, padding: 16,
                    fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11.5,
                    color: "#E8E8EC", lineHeight: 1.7, overflowX: "auto",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {step.code}
                  </div>
                </div>
              )}
            </div>

            {/* Connector line */}
            {i < FLOW_STEPS.length - 1 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
                <div style={{ width: 2, height: 16, background: COLORS.gray200, borderRadius: 1 }} />
              </div>
            )}
          </div>
        );
      })}

      <div style={{
        background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 16,
        border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.6,
      }}>
        💡 <strong>Key security points:</strong> You never handle credit card data (Stripe does). Webhook signatures prevent fake payment confirmations. Access tokens are UUID v4 (unguessable). KV entries auto-expire after 1 year. All Workers run on Cloudflare's edge — fast globally.
      </div>
    </>
  );

  // ── REVENUE VIEW ──
  const RevenueView = () => (
    <>
      <SectionTitle>Revenue Projections</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {REVENUE_MODEL.scenarios.map((s, i) => (
          <Pill key={i} active={scenarioIdx === i} onClick={() => setScenarioIdx(i)}>{s.label}</Pill>
        ))}
      </div>

      {/* Funnel */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.ocean})`,
        borderRadius: 20, padding: 20, color: "#fff", marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginBottom: 12 }}>ANNUAL FUNNEL</div>
        {[
          { label: "Monthly site visitors", value: scenario.monthlyVisitors.toLocaleString(), sub: "" },
          { label: "→ Free companion downloads/mo", value: monthlyFreeUsers.toLocaleString(), sub: `${(scenario.conversionToFree * 100)}% conversion` },
          { label: "→ Paid upgrades/mo", value: monthlyPaidUsers.toLocaleString(), sub: `${(scenario.freeToPayRate * 100)}% free→paid` },
          { label: "→ Paid companions/year", value: yearlyPaidUsers.toLocaleString(), sub: "× 12 months" },
          { label: "→ Total users with app/year", value: Math.round(totalEyeballs).toLocaleString(), sub: `avg ${scenario.avgCompanions} companions per trip` },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.1)" : "none",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: i === 0 ? 400 : 600, opacity: i === 0 ? 0.7 : 1 }}>{row.label}</div>
              {row.sub && <div style={{ fontSize: 11, opacity: 0.5 }}>{row.sub}</div>}
            </div>
            <div style={{ fontSize: i >= 3 ? 20 : 16, fontWeight: 800 }}>{row.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.nightMid, marginBottom: 12 }}>Annual Revenue</div>
        {[
          { label: "Direct sales", value: grossRevenue, detail: `${yearlyPaidUsers} × $${REVENUE_MODEL.price}`, color: COLORS.ocean },
          { label: "Stripe fees", value: -stripeFees, detail: "2.9% + $0.30 per txn", color: COLORS.coral },
          { label: "Net direct revenue", value: netDirectRevenue, detail: "", color: COLORS.palm, bold: true },
          { label: "Affiliate revenue", value: affiliateRevenue, detail: `${Math.round(affiliateBookings).toLocaleString()} bookings × $${scenario.avgBookingValue} avg × ${scenario.affiliateCommission * 100}%`, color: COLORS.sun },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: i < 3 ? "1px solid #f0f0f0" : "none",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: COLORS.nightMid }}>{row.label}</div>
              {row.detail && <div style={{ fontSize: 11, color: COLORS.gray400 }}>{row.detail}</div>}
            </div>
            <div style={{ fontSize: row.bold ? 18 : 15, fontWeight: 700, color: row.color }}>
              {row.value < 0 ? "-" : ""}${Math.abs(row.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 0 0", marginTop: 8, borderTop: `2px solid ${COLORS.ocean}`,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.nightMid }}>Total Annual Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.ocean }}>${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      <div style={{
        background: COLORS.palmLight, borderRadius: 14, padding: 14,
        border: `1px solid ${COLORS.palm}30`, fontSize: 13, color: COLORS.palm, lineHeight: 1.6,
      }}>
        ✅ <strong>Key insight:</strong> Free group sharing INCREASES revenue. Each $7.99 purchase puts the app on {scenario.avgCompanions + 1} phones. All {scenario.avgCompanions + 1} users see Klook/Agoda affiliate links. Affiliate revenue from companions = free money you wouldn't get if you charged per seat.
      </div>
    </>
  );

  // ── INFRA VIEW ──
  const InfraView = () => (
    <>
      <SectionTitle>Infrastructure Costs</SectionTitle>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 16, lineHeight: 1.5 }}>
        Your entire stack runs on Cloudflare's free/cheap tiers. Monthly overhead is minimal.
      </div>

      {INFRA_COSTS.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          background: "#fff", borderRadius: 12, marginBottom: 6,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.nightMid }}>{item.item}</div>
            <div style={{ fontSize: 12, color: COLORS.gray600 }}>{item.note}</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ocean, whiteSpace: "nowrap" }}>{item.cost}</div>
        </div>
      ))}

      <div style={{
        background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.ocean})`,
        borderRadius: 16, padding: 18, color: "#fff", marginTop: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginBottom: 8 }}>ESTIMATED MONTHLY OVERHEAD</div>
        <div style={{ fontSize: 32, fontWeight: 800 }}>~$10–15<span style={{ fontSize: 14, fontWeight: 500, opacity: 0.6 }}>/month</span></div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Before Stripe per-transaction fees</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
          Cloudflare's free tiers cover you well into thousands of monthly users. You don't hit meaningful infrastructure costs until you're already profitable.
        </div>
      </div>

      <div style={{
        background: "#fff", borderRadius: 16, padding: 18, marginTop: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.nightMid, marginBottom: 12 }}>Per-sale economics ($7.99 purchase)</div>
        {[
          { label: "Sale price", value: "$7.99" },
          { label: "Stripe fee (2.9% + $0.30)", value: "-$0.53" },
          { label: "Claude API (trip parsing)", value: "-$0.03" },
          { label: "Cloudflare (marginal)", value: "-$0.01" },
          { label: "Net per sale", value: "$7.42", bold: true },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", padding: "6px 0",
            borderBottom: i < 4 ? "1px solid #f0f0f0" : "none",
            borderTop: row.bold ? `2px solid ${COLORS.palm}` : "none",
            marginTop: row.bold ? 4 : 0, paddingTop: row.bold ? 8 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: COLORS.nightMid }}>{row.label}</span>
            <span style={{ fontSize: row.bold ? 16 : 13, fontWeight: 700, color: row.bold ? COLORS.palm : COLORS.nightMid }}>{row.value}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: COLORS.gray600, marginTop: 10 }}>
          92.8% margin per sale. Plus affiliate revenue on top.
        </div>
      </div>
    </>
  );

  // ── TAX VIEW ──
  const TaxView = () => (
    <>
      <SectionTitle>Tax Handling Strategy</SectionTitle>
      <div style={{ fontSize: 13, color: COLORS.gray600, marginBottom: 16, lineHeight: 1.5 }}>
        At launch volume, tax is manageable. Here's the phased approach.
      </div>

      {[
        {
          phase: "Phase 1: Launch",
          title: "Keep it simple",
          items: [
            "US customers: Collect sales tax only in states where you have nexus (your home state)",
            "International: No collection needed at low volume — most countries have a threshold (EU: €10K/year in sales to trigger VAT)",
            "Track everything in Stripe Dashboard — it logs customer location automatically",
            "Report digital product sales on your Schedule C (Discover Philippines business)",
          ],
          color: COLORS.palm,
        },
        {
          phase: "Phase 2: Growing ($1K+/mo)",
          title: "Add Stripe Tax",
          items: [
            "Enable Stripe Tax ($0.50/transaction) — it auto-calculates and collects the right tax rate based on customer location",
            "Handles US state sales tax, EU VAT, and other international digital goods taxes",
            "On a $7.99 sale, adds ~$0.50 in cost but keeps you compliant",
            "Stripe provides tax reports for your filing",
          ],
          color: COLORS.sun,
        },
        {
          phase: "Phase 3: Scale ($5K+/mo)",
          title: "Consider merchant of record",
          items: [
            "If international tax compliance becomes a burden, switch to Lemon Squeezy or Paddle",
            "They become your 'merchant of record' and handle ALL tax globally",
            "Higher fees (5-8%) but zero tax headaches",
            "Only worth it at volume where the time savings justify the cost",
          ],
          color: COLORS.coral,
        },
      ].map((phase, i) => (
        <div key={i} style={{
          background: "#fff", borderRadius: 16, padding: 16, marginBottom: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          borderLeft: `4px solid ${phase.color}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: phase.color, marginBottom: 4, letterSpacing: 0.5 }}>{phase.phase}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.nightMid, marginBottom: 8 }}>{phase.title}</div>
          {phase.items.map((item, j) => (
            <div key={j} style={{
              display: "flex", gap: 8, padding: "4px 0",
              fontSize: 13, color: COLORS.gray600, lineHeight: 1.5,
            }}>
              <span style={{ color: phase.color, flexShrink: 0 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ))}

      <div style={{
        background: COLORS.sandLight, borderRadius: 14, padding: 14, marginTop: 8,
        border: `1px solid ${COLORS.sand}`, fontSize: 13, color: COLORS.gray800, lineHeight: 1.6,
      }}>
        💡 <strong>Bottom line:</strong> Don't let tax complexity delay your launch. Phase 1 is straightforward — just track your sales in Stripe and report on Schedule C. Add automated tax collection when revenue justifies the per-transaction cost.
      </div>
    </>
  );

  return (
    <div style={{
      width: "100%", maxWidth: 480, margin: "0 auto", minHeight: "100vh",
      background: COLORS.gray100,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.oceanDeep}, ${COLORS.ocean})`,
        padding: "24px 20px 20px", color: "#fff",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6, marginBottom: 4 }}>
          DISCOVER PHILIPPINES
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>Payment & Revenue Architecture</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Stripe + Cloudflare Workers + KV</div>
      </div>

      {/* Tab pills */}
      <div style={{ display: "flex", gap: 6, padding: "16px 16px 0", overflowX: "auto" }}>
        <Pill active={view === "flow"} onClick={() => setView("flow")}>⚡ Payment Flow</Pill>
        <Pill active={view === "revenue"} onClick={() => setView("revenue")}>📊 Revenue</Pill>
        <Pill active={view === "infra"} onClick={() => setView("infra")}>🏗️ Costs</Pill>
        <Pill active={view === "tax"} onClick={() => setView("tax")}>🧾 Tax</Pill>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 40px" }}>
        {view === "flow" && <FlowView />}
        {view === "revenue" && <RevenueView />}
        {view === "infra" && <InfraView />}
        {view === "tax" && <TaxView />}
      </div>
    </div>
  );
}