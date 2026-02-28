"""Generate a sample PDF travel guide for Clark & Angeles."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Register a Unicode-capable font (DejaVu Sans ships with many systems)
FONT_DIR = None
FONT_CANDIDATES = [
    # Windows
    os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "segoeui.ttf"),
    os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "segoeuib.ttf"),
    os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", "segoeuii.ttf"),
]

# Try to register Segoe UI (has peso sign)
_has_segoe = False
if os.path.exists(FONT_CANDIDATES[0]):
    pdfmetrics.registerFont(TTFont("SegoeUI", FONT_CANDIDATES[0]))
    pdfmetrics.registerFont(TTFont("SegoeUI-Bold", FONT_CANDIDATES[1]))
    pdfmetrics.registerFont(TTFont("SegoeUI-Italic", FONT_CANDIDATES[2]))
    _has_segoe = True

BODY_FONT = "SegoeUI" if _has_segoe else "Helvetica"
BODY_BOLD = "SegoeUI-Bold" if _has_segoe else "Helvetica-Bold"
BODY_ITALIC = "SegoeUI-Italic" if _has_segoe else "Helvetica-Oblique"

# Colors from the design system
OCEAN_TEAL = HexColor("#0D7377")
WARM_CORAL = HexColor("#E8654A")
DEEP_NIGHT = HexColor("#1A2332")
SAND = HexColor("#F5F0E8")
SKY = HexColor("#E8F4F5")
SLATE = HexColor("#64748B")
WHITE = white

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "guides")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "clark-travel-guide.pdf")


class ColorBlock(Flowable):
    """A colored rectangle behind text content."""
    def __init__(self, width, height, color, text="", text_color=white, font_size=24):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color
        self.text = text
        self.text_color = text_color
        self.font_size = font_size

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 10, fill=1, stroke=0)
        if self.text:
            self.canv.setFillColor(self.text_color)
            self.canv.setFont(BODY_BOLD, self.font_size)
            self.canv.drawCentredString(self.width / 2, self.height / 2 - self.font_size / 3, self.text)


class ChecklistItem(Flowable):
    """A checkmark bullet item."""
    def __init__(self, text, width=6*inch):
        super().__init__()
        self.text = text
        self._width = width
        self.height = 20

    def draw(self):
        # Teal filled circle bullet
        self.canv.setFillColor(OCEAN_TEAL)
        self.canv.circle(5, 8, 5, fill=1, stroke=0)
        # White "v" as checkmark
        self.canv.setStrokeColor(WHITE)
        self.canv.setLineWidth(1.5)
        self.canv.line(2.5, 8, 4.5, 5.5)
        self.canv.line(4.5, 5.5, 8, 10.5)
        # Text
        self.canv.setFillColor(DEEP_NIGHT)
        self.canv.setFont(BODY_FONT, 10)
        self.canv.drawString(18, 4, self.text)


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="CoverTitle",
        fontName=BODY_BOLD,
        fontSize=32,
        textColor=WHITE,
        alignment=TA_CENTER,
        leading=38,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="CoverSubtitle",
        fontName=BODY_FONT,
        fontSize=14,
        textColor=HexColor("#CCEEEE"),
        alignment=TA_CENTER,
        leading=20,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontName=BODY_BOLD,
        fontSize=18,
        textColor=OCEAN_TEAL,
        spaceBefore=18,
        spaceAfter=10,
        leading=22,
    ))
    styles.add(ParagraphStyle(
        name="SubSection",
        fontName=BODY_BOLD,
        fontSize=13,
        textColor=DEEP_NIGHT,
        spaceBefore=12,
        spaceAfter=6,
        leading=16,
    ))
    styles.add(ParagraphStyle(
        name="BodyText2",
        fontName=BODY_FONT,
        fontSize=10,
        textColor=DEEP_NIGHT,
        alignment=TA_JUSTIFY,
        leading=14,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="TipText",
        fontName=BODY_FONT,
        fontSize=9.5,
        textColor=DEEP_NIGHT,
        leading=13,
        spaceAfter=4,
        leftIndent=12,
    ))
    styles.add(ParagraphStyle(
        name="TipHeader",
        fontName=BODY_BOLD,
        fontSize=11,
        textColor=OCEAN_TEAL,
        spaceBefore=8,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="Caption",
        fontName=BODY_ITALIC,
        fontSize=9,
        textColor=SLATE,
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="Footer",
        fontName=BODY_FONT,
        fontSize=8,
        textColor=SLATE,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="PriceTag",
        fontName=BODY_BOLD,
        fontSize=10,
        textColor=WARM_CORAL,
        leading=13,
        spaceAfter=2,
    ))
    return styles


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(BODY_FONT, 8)
    canvas.setFillColor(SLATE)
    canvas.drawCentredString(
        doc.pagesize[0] / 2, 0.5 * inch,
        f"DiscoverPhilippines.travel  \u2022  Clark & Angeles Travel Guide  \u2022  Page {doc.page}"
    )
    canvas.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.85 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
    )
    styles = build_styles()
    story = []
    W = doc.width

    # ── COVER PAGE ──
    story.append(Spacer(1, 0.5 * inch))
    story.append(ColorBlock(W, 220, OCEAN_TEAL))
    story.append(Spacer(1, -200))

    # Title overlay (we use a table trick to center over the block)
    cover_content = []
    cover_content.append(Spacer(1, 30))
    cover_content.append(Paragraph("Clark & Angeles", styles["CoverTitle"]))
    cover_content.append(Paragraph("Travel Guide 2026", styles["CoverTitle"]))
    cover_content.append(Spacer(1, 8))
    cover_content.append(Paragraph(
        "Real itineraries from our trips \u2014 with prices, transport details, and local tips.",
        styles["CoverSubtitle"]
    ))
    cover_content.append(Paragraph(
        "By Scott & Jenice  \u2022  DiscoverPhilippines.travel",
        styles["CoverSubtitle"]
    ))

    # Overlay text on the color block
    t = Table([[cover_content]], colWidths=[W])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(t)
    story.append(Spacer(1, 30))

    # What's inside
    story.append(Paragraph("What\u2019s Inside This Guide", styles["SectionTitle"]))
    checklist = [
        "Day-by-day itinerary with prices in PHP and USD",
        "Best hotels and restaurants (budget to splurge)",
        "Getting there, getting around, and money tips",
        "Local phrases and cultural etiquette",
        "Scott\u2019s Pro Tips from 20+ years of travel",
        "Jenice\u2019s local knowledge from growing up in Mabalacat",
    ]
    for item in checklist:
        story.append(ChecklistItem(item, W))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 20))

    # Quick facts bar
    facts_data = [
        ["Region", "Best Time", "Daily Budget", "Airport", "Language"],
        ["Central Luzon", "Nov \u2013 May", "$35\u2013$106 USD", "CRK", "Kapampangan"],
    ]
    facts_table = Table(facts_data, colWidths=[W/5]*5)
    facts_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SKY),
        ("TEXTCOLOR", (0, 0), (-1, 0), OCEAN_TEAL),
        ("FONTNAME", (0, 0), (-1, 0), BODY_BOLD),
        ("FONTNAME", (0, 1), (-1, -1), BODY_FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#D1D5DB")),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
    ]))
    story.append(facts_table)

    story.append(PageBreak())

    # ── PAGE 2: ITINERARY ──
    story.append(Paragraph("Sample 3-Day Clark Itinerary", styles["SectionTitle"]))

    # Day 1
    story.append(Paragraph("Day 1: Arrive & Settle In", styles["SubSection"]))
    story.append(Paragraph(
        "Fly into Clark International Airport (CRK). Skip the taxi touts outside arrivals \u2014 open Grab immediately "
        "(airport WiFi works). Grab to Angeles: \u20b1200\u2013350 (~$3.50\u2013$6.20 USD). Check into your hotel and rest up.",
        styles["BodyText2"]
    ))
    day1_items = [
        ("\u2022 Afternoon:", "Explore Clark Freeport Zone. Wide tree-lined roads, no tricycle traffic, different vibe from Angeles."),
        ("\u2022 Dinner:", "Aling Lucing\u2019s Sisig \u2014 the original sizzling pork masterpiece. \u20b1150 (~$2.65 USD). Pilgrimage-level."),
        ("\u2022 Evening:", "Stroll Parking Circle on the base. Restaurants, cold beer, relaxed atmosphere."),
    ]
    for label, desc in day1_items:
        story.append(Paragraph(f"<b>{label}</b> {desc}", styles["TipText"]))

    story.append(Spacer(1, 6))

    # Day 2
    story.append(Paragraph("Day 2: Food Capital & Family Fun", styles["SubSection"]))
    story.append(Paragraph(
        "Pampanga is the culinary capital of the Philippines. Today is about eating your way through it \u2014 "
        "plus some family-friendly activities on the base.",
        styles["BodyText2"]
    ))
    day2_items = [
        ("\u2022 Morning:", "Lola Nor\u2019s Meryendahan for bringhe (Pampanga paella) and morcon. Mains \u20b1180\u2013350."),
        ("\u2022 Midday:", "Dinosaurs Island (\u20b1500/~$8.85 USD) or Clark Zoo. Great for families."),
        ("\u2022 Lunch:", "Korean BBQ Row \u2014 unlimited samgyeopsal \u20b1399\u2013599/person. Better value than Manila."),
        ("\u2022 Afternoon:", "Pool villa rental \u2014 private villas available from \u20b13,000\u20135,000 for the day."),
        ("\u2022 Dinner:", "Margarita Station \u2014 Filipino-fusion, live music weekends. \u20b1300\u2013600/person."),
    ]
    for label, desc in day2_items:
        story.append(Paragraph(f"<b>{label}</b> {desc}", styles["TipText"]))

    story.append(Spacer(1, 6))

    # Day 3
    story.append(Paragraph("Day 3: Day Trip or Fly Out", styles["SubSection"]))
    story.append(Paragraph(
        "Use Clark as a hub. Fly to Cebu (~$30, 1 hour), drive to Subic Bay (45 min via SCTEX), "
        "or head to Manila via the Skyway (2\u20133 hrs, ~$10 tolls).",
        styles["BodyText2"]
    ))
    day3_items = [
        ("\u2022 Option A:", "Clark \u2192 Cebu (1hr flight, ~$30). Start your island-hopping from there."),
        ("\u2022 Option B:", "Drive to Subic Bay via SCTEX (45 min). Jungle trails, duty-free shopping, different vibe."),
        ("\u2022 Option C:", "Manila via Skyway. The highway-over-the-city cuts the drive from 4 hours to 2\u20133."),
    ]
    for label, desc in day3_items:
        story.append(Paragraph(f"<b>{label}</b> {desc}", styles["TipText"]))

    story.append(PageBreak())

    # ── PAGE 3: WHERE TO STAY ──
    story.append(Paragraph("Where to Stay", styles["SectionTitle"]))

    hotels = [
        ("The Mansion Hotel", "Upscale", "\u20b13,500\u20135,500/night (~$62\u2013$97 USD)",
         "Inside the Freeport Zone. Good pool, solid restaurant. Our top pick for a proper hotel experience."),
        ("La Grande Residence", "Mid-Range", "\u20b12,000\u20133,500/night (~$35\u2013$62 USD)",
         "Near Mabalacat. Clean, modern rooms, gym, restaurant better than it needs to be. Our home base for family visits."),
        ("Clarkton Hotel", "Business", "\u20b12,200\u20133,800/night (~$39\u2013$67 USD)",
         "Inside the Freeport Zone. Nothing fancy but reliable, clean, and well-located."),
    ]

    for name, tier, price, desc in hotels:
        hotel_block = []
        hotel_block.append(Paragraph(f"{name} <font color='#64748B'>({tier})</font>", styles["SubSection"]))
        hotel_block.append(Paragraph(price, styles["PriceTag"]))
        hotel_block.append(Paragraph(desc, styles["BodyText2"]))
        story.append(KeepTogether(hotel_block))
        story.append(Spacer(1, 4))

    # ── WHERE TO EAT ──
    story.append(Paragraph("Where to Eat", styles["SectionTitle"]))

    restaurants = [
        ("Aling Lucing\u2019s Sisig", "\u20b1150 (~$2.65)", "The original sisig. Sizzling pork face and ears on a hot plate. Pilgrimage-level."),
        ("Lola Nor\u2019s Meryendahan", "\u20b1180\u2013350", "Jenice\u2019s family pick. Order the bringhe and morcon."),
        ("Margarita Station", "\u20b1300\u2013600/person", "Local institution. Filipino-fusion, cold beer, live music weekends."),
        ("Korean BBQ Row", "\u20b1399\u2013599/person", "Unlimited samgyeopsal. Better value than Manila. Angeles has a huge Korean community."),
        ("Parking Circle", "Varies", "On the base. Great evening spot with a surprising range of options."),
    ]

    # Use Paragraph objects in table cells so the registered font handles ₱
    tbl_header = ParagraphStyle("TblHead", fontName=BODY_BOLD, fontSize=9, textColor=WHITE, leading=12)
    tbl_name = ParagraphStyle("TblName", fontName=BODY_BOLD, fontSize=9, textColor=DEEP_NIGHT, leading=12)
    tbl_price = ParagraphStyle("TblPrice", fontName=BODY_BOLD, fontSize=9, textColor=WARM_CORAL, alignment=TA_CENTER, leading=12)
    tbl_desc = ParagraphStyle("TblDesc", fontName=BODY_FONT, fontSize=9, textColor=DEEP_NIGHT, leading=12)

    rest_data = [[
        Paragraph("Restaurant", tbl_header),
        Paragraph("Price", tbl_header),
        Paragraph("What to Know", tbl_header),
    ]]
    for name, price, desc in restaurants:
        rest_data.append([
            Paragraph(name, tbl_name),
            Paragraph(price, tbl_price),
            Paragraph(desc, tbl_desc),
        ])

    rest_table = Table(rest_data, colWidths=[1.6*inch, 1.2*inch, W - 2.8*inch])
    rest_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), OCEAN_TEAL),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#D1D5DB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, HexColor("#F9FAFB")]),
    ]))
    story.append(rest_table)

    story.append(PageBreak())

    # ── PAGE 4: TRANSPORT + PRO TIPS ──
    story.append(Paragraph("Getting Around", styles["SectionTitle"]))

    transport = [
        ("Grab Car (Best Option)", "\u20b1150\u2013400 (~$2.65\u2013$7.10)",
         "Air-conditioned, fixed price, tracked route. Our default for everything."),
        ("Car Rental", "~\u20b11,700/day (~$30 USD)",
         "What we actually do for extended stays. Local agency, insurance included. Great for families."),
        ("Tricycle", "\u20b130\u2013100",
         "The original Filipino ride. Great for short hops. Expect traffic jams during peak hours."),
        ("Taxi", "Don\u2019t",
         "50 combined years of travel, zero functional meters. Use Grab."),
    ]

    for mode, price, desc in transport:
        story.append(Paragraph(f"<b>{mode}</b> \u2014 {price}", styles["TipText"]))
        story.append(Paragraph(desc, styles["TipText"]))
        story.append(Spacer(1, 4))

    # Scott's Pro Tips box
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=OCEAN_TEAL))
    story.append(Paragraph("Scott\u2019s Pro Tips", styles["SectionTitle"]))

    tips = [
        "<b>Airport arrival:</b> Do NOT take taxis outside arrivals. Open Grab immediately \u2014 airport WiFi works. "
        "Grab to Angeles: \u20b1200\u2013350. Taxis will quote \u20b1500\u2013800 for the same trip.",
        "<b>SIM card:</b> Get Globe or Smart at the airport. \u20b1300 (~$5.30). Essential for Grab and navigation.",
        "<b>Money:</b> ATMs widely available in Angeles and Clark. Much better than remote islands. "
        "Bring a debit card with no foreign transaction fees.",
        "<b>Safety:</b> Clark and Angeles are generally very safe. Angeles City can feel seedy at night \u2014 "
        "stick to main roads. Nearest hospital: The Medical City Clark.",
        "<b>Best time:</b> Dry season Nov\u2013May. Sweet spot is Dec\u2013Feb (warm, not brutal). Mar\u2013May gets very hot.",
        "<b>Packing:</b> Mosquito repellent, reef-safe sunscreen, sturdy flip-flops, rain jacket if visiting Jun\u2013Oct.",
    ]

    for tip in tips:
        story.append(Paragraph(f"<font color='#0D7377'><b>&gt;</b></font>  {tip}", styles["TipText"]))
        story.append(Spacer(1, 2))

    # Jenice's Local Knowledge
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=WARM_CORAL))
    story.append(Paragraph("Jenice\u2019s Local Knowledge", styles["SectionTitle"]))
    story[-1].style = ParagraphStyle(
        "JeniceTitle", parent=styles["SectionTitle"], textColor=WARM_CORAL
    )

    jenice_tips = [
        "<b>Holiday lechon:</b> Order from a Pampanga supplier \u2014 better quality than Manila. "
        "Whole pig: \u20b18,000\u201312,000 (~$142\u2013$212). Worth every peso for family gatherings.",
        "<b>Korean food scene:</b> Angeles has one of the biggest Korean communities outside Korea and Manila. "
        "Don\u2019t sleep on the samgyeopsal spots.",
        "<b>Language:</b> Local language is Kapampangan. \u201cOy\u201d is casual for getting attention. "
        "Use \u201cpo\u201d and \u201copo\u201d for respect with elders.",
        "<b>Base shortcut:</b> When tricycle traffic is gridlocked, jump onto the Clark Freeport Zone base \u2014 "
        "they don\u2019t allow trikes, so it\u2019s just cars. Zip right through.",
    ]

    for tip in jenice_tips:
        story.append(Paragraph(f"<font color='#0D7377'><b>&gt;</b></font>  {tip}", styles["TipText"]))
        story.append(Spacer(1, 2))

    # ── BACK PAGE ──
    story.append(PageBreak())
    story.append(Spacer(1, 1.5 * inch))
    story.append(ColorBlock(W, 160, OCEAN_TEAL))
    story.append(Spacer(1, -145))

    closing = []
    closing.append(Paragraph("Plan Your Clark Trip", styles["CoverTitle"]))
    closing.append(Spacer(1, 6))
    closing.append(Paragraph(
        "Visit DiscoverPhilippines.travel for interactive maps, more destination guides, and our AI trip planner.",
        styles["CoverSubtitle"]
    ))
    closing.append(Spacer(1, 6))
    closing.append(Paragraph(
        "More Guides: Cebu \u2022 Bohol \u2022 Siargao \u2022 El Nido \u2022 Siquijor \u2022 and 12 more destinations",
        styles["CoverSubtitle"]
    ))

    ct = Table([[closing]], colWidths=[W])
    ct.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(ct)

    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "This guide was created by Scott & Jenice for DiscoverPhilippines.travel",
        styles["Caption"]
    ))
    story.append(Paragraph(
        "Last updated: February 2026  \u2022  Prices verified on-site",
        styles["Caption"]
    ))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "\u00a9 2026 Discover Philippines. All rights reserved. No spam, unsubscribe anytime.",
        styles["Footer"]
    ))

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    print(f"PDF generated: {os.path.abspath(OUTPUT_PATH)}")


if __name__ == "__main__":
    build_pdf()
