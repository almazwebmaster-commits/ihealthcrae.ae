# iHealthcare.ae — Homepage image plan

Every homepage slot that needs imagery, its exact dimensions and file path, and a
ready-to-paste Google Gemini prompt for each one.

- Reference viewport: **1440 px desktop** (content width 1392 px) and **390 px mobile**.
- Export everything as **WebP, quality ~82**, at **2× the display size** (crisp on Retina screens).
- Gemini only outputs fixed aspect ratios (1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9),
  so every slot below uses one of those. The final crop/resize to exact pixels is done afterwards.

---

## 1. Slot inventory

### Required — 17 images

| ID | Slot | Ratio | Display size | **Export size** | File path (`public/…`) | Clean zone for text |
|---|---|---|---|---|---|---|
| H1-D | Hero · Vitamins · desktop/tablet | 21:9 | 924 × 396 | **1848 × 792** | `images/home/hero/vitamins-desktop.webp` | Left 45% |
| H1-M | Hero · Vitamins · mobile | 4:5 | 358 × 448 | **1080 × 1350** | `images/home/hero/vitamins-mobile.webp` | Top 45% |
| H2-D | Hero · Skincare · desktop/tablet | 21:9 | 924 × 396 | **1848 × 792** | `images/home/hero/skincare-desktop.webp` | Left 45% |
| H2-M | Hero · Skincare · mobile | 4:5 | 358 × 448 | **1080 × 1350** | `images/home/hero/skincare-mobile.webp` | Top 45% |
| H3-D | Hero · Devices · desktop/tablet | 21:9 | 924 × 396 | **1848 × 792** | `images/home/hero/devices-desktop.webp` | Left 45% |
| H3-M | Hero · Devices · mobile | 4:5 | 358 × 448 | **1080 × 1350** | `images/home/hero/devices-mobile.webp` | Top 45% |
| H4-D | Hero · Mother & baby · desktop/tablet | 21:9 | 924 × 396 | **1848 × 792** | `images/home/hero/baby-desktop.webp` | Left 45% |
| H4-M | Hero · Mother & baby · mobile | 4:5 | 358 × 448 | **1080 × 1350** | `images/home/hero/baby-mobile.webp` | Top 45% |
| C1 | Category tile · Health & medicine | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/health-medicine.webp` | — (centered, 15% margin) |
| C2 | Category tile · Vitamins & supplements | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/vitamins-supplements.webp` | — |
| C3 | Category tile · Beauty & skincare | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/beauty-skincare.webp` | — |
| C4 | Category tile · Personal care | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/personal-care.webp` | — |
| C5 | Category tile · Mother & baby | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/mother-baby.webp` | — |
| C6 | Category tile · Medical devices | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/medical-devices.webp` | — |
| C7 | Category tile · Sports nutrition | 1:1 | 96 × 96 | **400 × 400** | `images/home/categories/sports-nutrition.webp` | — |
| B1-D | Skincare bento promo · desktop | 4:5 | 690 × 862 | **1380 × 1725** | `images/home/promo/skincare-desktop.webp` | Bottom 40% |
| B1-M | Skincare bento promo · mobile/tablet | 16:9 | 720 × 405 | **1600 × 900** | `images/home/promo/skincare-mobile.webp` | Left 50% |

### Optional — 3 images (the icon versions already work well)

| ID | Slot | Ratio | Display size | **Export size** | File path | Notes |
|---|---|---|---|---|---|---|
| P1 | Cash-on-delivery promo tile | 4:3 | 291 × 218 | **880 × 660** | `images/home/promo/cod.webp` | Replaces the decorative mosaic in the tile |
| S1 | Subscribe & save tile | 1:1 | 112 × 112 | **448 × 448** | `images/home/promo/subscribe.webp` | Replaces the icon square |
| S2 | Buy more, save more tile | 1:1 | 112 × 112 | **448 × 448** | `images/home/promo/multibuy.webp` | Replaces the icon square |

### Slots that should NOT be AI-generated

| Slot | Why | What to use instead |
|---|---|---|
| **Product photos** (cards, product page gallery, QuadBoxes, deals/best-seller/new rows, spotlight tiles, search suggestions — 42 products today) | These are real branded products (Panadol, CeraVe, Pampers…). An AI image shows packaging that doesn't match what the customer receives. That is misleading under UAE consumer-protection rules, risks trademark problems, and causes returns. | Official packshots from the brand or distributor (ask for their "digital asset kit"). Spec: **1:1, 2000 × 2000, pure white #FFFFFF background, product filling ~80% of the frame, centered**, plus 2–3 extra angles. AI may be used **only** to clean up or whiten a real photo's background. |
| **Brand grid** | Brand logos are trademarks. | Official logo files (SVG preferred) from each brand's media kit, shown in one colour. |
| New arrivals / Best sellers side tiles, trust strip, countdown | Icon-led by design; photos would compete with the hero. | Keep as is. |

---

## 2. Background colours (images must blend into their slot)

Each image's background must be a **flat, seamless field of the slot's exact colour**, so the photo
melts into the boxy tile with no visible edge.

| Slot | Hex | Token |
|---|---|---|
| Hero · Vitamins | `#095A56` | brand-700 |
| Hero · Skincare | `#BE123C` | rose-700 |
| Hero · Devices | `#0E1B2C` | ink-900 |
| Hero · Mother & baby | `#FFB400` | accent-500 |
| Category · Health & medicine | `#E8F5F4` | brand-50 |
| Category · Vitamins | `#FFF8E1` | accent-50 |
| Category · Beauty | `#FFF1F2` | rose-50 |
| Category · Personal care | `#F5F3FF` | violet-50 |
| Category · Mother & baby | `#F0F9FF` | sky-50 |
| Category · Devices | `#FEF2F2` | red-50 |
| Category · Sports | `#ECFDF5` | emerald-50 |
| Skincare bento | `#BE123C` | rose-700 |
| Subscribe & save tile | `#E8F5F4` | brand-50 |
| Multi-buy tile | `#FFF8E1` | accent-50 |

Gemini won't always hit a hex exactly. Small differences get hidden in code with a soft gradient
on the seam, so it doesn't need to be perfect.

---

## 3. Arabic (RTL) rule

Images contain **no text at all**. That lets the site **mirror the hero and bento images
horizontally in Arabic**, so the clean zone moves to the right, where the Arabic headline sits.
One set of files serves both languages. That is why every prompt insists on "no text, no logos".

---

## 4. Prompts

### 4.1 Style block — paste this at the start of EVERY prompt

```
STYLE: Photorealistic premium health and beauty retail photography for a modern
online store in the UAE. Clean, bright, minimal and BOXY: objects are arranged on
simple geometric square plinths, cubes and stepped blocks with crisp straight
edges. Soft diffused studio light from the upper left, gentle soft shadows, sharp
focus on the main object, subtle depth of field, high detail, true-to-life
materials (glass, matte plastic, cream texture). Accent palette only: deep teal
#0B6E69 and warm saffron amber #FFB400, used sparingly on props and blocks.
ALL packaging is generic and unbranded: plain white, frosted glass, amber glass
or teal containers with completely blank labels.
ABSOLUTELY NO text, letters, numbers, logos, brand names, watermarks, icons or
symbols anywhere in the image. No people's faces.
```

### 4.2 Avoid list — paste this at the END of every prompt

```
AVOID: any readable text, letters, digits or logos; real brand packaging;
pills spilling everywhere; syringes, needles, hospitals, clinics, doctors,
prescriptions; distorted or extra fingers; clutter; busy or patterned
backgrounds; gradients or texture in the empty area; harsh shadows; vignette;
borders or frames; cut-off objects at the frame edge.
```

---

### H1-D — Hero · Vitamins · desktop (21:9)

```
Aspect ratio 21:9, wide web banner.
[STYLE BLOCK]
Scene: a composed still life of five unbranded supplement bottles — three amber
glass bottles and two matte white bottles, all with white caps and blank labels —
with a small heap of golden softgel capsules, a few round white tablets, and
fresh halved oranges and lemon slices. Arrange everything on stacked deep-teal
and white square plinths of different heights, forming a stepped, boxy layout.
Composition: the ENTIRE arrangement sits in the RIGHT 55% of the frame. The LEFT
45% is completely empty — a smooth, flat, seamless field of solid deep teal
#095A56 with no objects, no gradient and no texture (a headline will go there).
The whole background is the same deep teal #095A56.
Camera: eye level, 50 mm lens, slight three-quarter angle.
[AVOID LIST]
```

### H1-M — Hero · Vitamins · mobile (4:5)

```
Aspect ratio 4:5, vertical.
[STYLE BLOCK]
Scene: the same vitamin still life — unbranded amber and white supplement
bottles with blank labels, golden softgels, halved oranges and lemon slices, on
stacked deep-teal and white square plinths.
Composition: the arrangement fills the BOTTOM 55% of the frame, centered
horizontally. The TOP 45% is completely empty flat deep teal #095A56 with no
objects, no gradient and no texture. The whole background is deep teal #095A56.
Camera: slightly above eye level, 50 mm.
[AVOID LIST]
```

### H2-D — Hero · Skincare · desktop (21:9)

```
Aspect ratio 21:9, wide web banner.
[STYLE BLOCK]
Scene: unbranded dermatological skincare — a frosted glass serum bottle with a
dropper, a tall white pump bottle, a round white cream jar with its lid off
showing a smooth swirl of white cream, and a soft squeeze tube, all with blank
labels. Add a few crystal-clear water droplets on the bottles and a single sprig
of small white flowers. Objects stand on white and pale blush-pink square blocks.
Composition: the arrangement sits in the RIGHT 55% of the frame. The LEFT 45% is
completely empty flat deep rose #BE123C with no objects, gradient or texture.
The whole background is deep rose #BE123C.
Camera: eye level, 70 mm, soft glossy highlights.
[AVOID LIST]
```

### H2-M — Hero · Skincare · mobile (4:5)

```
Aspect ratio 4:5, vertical.
[STYLE BLOCK]
Scene: the same unbranded skincare set — frosted serum dropper bottle, white pump
bottle, open cream jar with a swirl of white cream, squeeze tube, water droplets,
a sprig of small white flowers — on white and blush-pink square blocks.
Composition: the arrangement fills the BOTTOM 55%, centered. The TOP 45% is
completely empty flat deep rose #BE123C. Whole background deep rose #BE123C.
[AVOID LIST]
```

### H3-D — Hero · Medical devices · desktop (21:9)

```
Aspect ratio 21:9, wide web banner.
[STYLE BLOCK]
Scene: generic, unbranded home health devices — a white upper-arm digital blood
pressure monitor with its grey cuff neatly coiled beside it, a white digital ear
thermometer, and a compact white glucose meter. All screens are switched off,
dark and blank (no digits). The devices stand on matte white and deep-teal square
plinths. A subtle cool rim light separates them from the background.
Composition: devices in the RIGHT 55% of the frame. The LEFT 45% is completely
empty flat dark navy #0E1B2C with no objects, gradient or texture. Whole
background dark navy #0E1B2C.
Camera: eye level, 50 mm, clean product-catalogue feel.
[AVOID LIST]
```

### H3-M — Hero · Medical devices · mobile (4:5)

```
Aspect ratio 4:5, vertical.
[STYLE BLOCK]
Scene: the same unbranded white blood pressure monitor with coiled cuff, ear
thermometer and glucose meter, screens dark and blank, on matte white and
deep-teal square plinths with a cool rim light.
Composition: devices fill the BOTTOM 55%, centered. TOP 45% completely empty flat
dark navy #0E1B2C. Whole background dark navy #0E1B2C.
[AVOID LIST]
```

### H4-D — Hero · Mother & baby · desktop (21:9)

```
Aspect ratio 21:9, wide web banner.
[STYLE BLOCK]
Scene: gentle baby essentials — a neat stack of plain white unbranded diapers, a
white baby lotion bottle with a blank label, a clear feeding bottle with a white
teat, a softly folded white muslin cloth, and a small knitted plush bunny in
deep teal. Arranged on white square blocks of stepped heights. Warm, soft,
comforting light. No baby and no people in the image.
Composition: the arrangement sits in the RIGHT 55% of the frame. The LEFT 45% is
completely empty flat saffron amber #FFB400 with no objects, gradient or texture.
Whole background saffron amber #FFB400.
Camera: eye level, 50 mm.
[AVOID LIST]
```

### H4-M — Hero · Mother & baby · mobile (4:5)

```
Aspect ratio 4:5, vertical.
[STYLE BLOCK]
Scene: the same baby essentials — a stack of plain white diapers, blank white
lotion bottle, clear feeding bottle, folded white muslin, small teal knitted
bunny — on stepped white square blocks, warm soft light, no people.
Composition: the arrangement fills the BOTTOM 55%, centered. TOP 45% completely
empty flat saffron amber #FFB400. Whole background saffron amber #FFB400.
[AVOID LIST]
```

---

### Category tiles C1–C7 (1:1) — shared template

```
Aspect ratio 1:1, square.
[STYLE BLOCK]
Scene: a tight, centered group of three unbranded items representing
{CATEGORY}: {ITEMS}. Items are grouped on a single small white square block.
Composition: the group fills the central 70% of the frame with an even 15%
margin on every side; nothing touches or crosses the edges. Seamless flat
background in exactly {HEX} — no horizon line, no gradient — with only a soft
contact shadow under the block.
Camera: front three-quarter view, slightly above eye level, 85 mm.
[AVOID LIST]
```

| ID | {CATEGORY} | {ITEMS} | {HEX} |
|---|---|---|---|
| C1 | health and medicine | a white first-aid case, an amber glass medicine bottle with a blank label, a rolled white bandage | `#E8F5F4` |
| C2 | vitamins and supplements | an amber supplement bottle with a blank label, a small heap of golden softgels, half an orange | `#FFF8E1` |
| C3 | beauty and skincare | a frosted serum dropper bottle, an open white cream jar with a swirl of cream, a white pump bottle | `#FFF1F2` |
| C4 | personal care | a white toothbrush, a blank white toothpaste tube, a plain white deodorant spray can | `#F5F3FF` |
| C5 | mother and baby | a folded plain white diaper, a clear feeding bottle, a blank white baby lotion bottle | `#F0F9FF` |
| C6 | medical devices | a white digital blood pressure monitor with coiled cuff, a white digital thermometer, screens dark and blank | `#FEF2F2` |
| C7 | sports nutrition | a matte white protein powder tub with a blank label, a clear shaker bottle, a protein bar in a plain silver wrapper | `#ECFDF5` |

---

### B1-D — Skincare bento promo · desktop (4:5)

```
Aspect ratio 4:5, vertical.
[STYLE BLOCK — the "no people's faces" rule still applies; hands are allowed]
Scene: close-up beauty moment — a woman's hand with a natural manicure and warm
medium skin tone, wearing a soft cream long sleeve, holds a frosted glass dropper
bottle (blank label) and releases a single glossy drop of serum onto the back of
her other hand. Beside them, a round white cream jar sits on a white square block.
Composition: the subject occupies the TOP 55% of the frame. The BOTTOM 40% is
completely empty flat deep rose #BE123C with no objects, gradient or texture
(text goes there). Whole background deep rose #BE123C.
Camera: 85 mm macro-style, shallow depth of field.
[AVOID LIST]
```

### B1-M — Skincare bento promo · mobile/tablet (16:9)

```
Aspect ratio 16:9, landscape.
[STYLE BLOCK — hands allowed, no faces]
Scene: the same moment — a hand with a natural manicure releasing a drop of serum
from a frosted glass dropper bottle (blank label) onto the back of the other
hand, a white cream jar on a white square block nearby.
Composition: subject in the RIGHT 50% of the frame. The LEFT 50% is completely
empty flat deep rose #BE123C. Whole background deep rose #BE123C.
[AVOID LIST]
```

### P1 — Cash-on-delivery tile (optional, 4:3)

```
Aspect ratio 4:3.
[STYLE BLOCK — hands and torsos allowed, no faces]
Scene: a delivery hand-off at the door of a modern UAE apartment — one pair of
hands passes a plain kraft cardboard box sealed with deep-teal tape to another
pair of hands. The courier wears a plain deep-teal polo shirt with no logo; only
hands and torsos are visible. Warm late-afternoon daylight, clean white wall and
a light oak door.
Composition: the box and hands centered, filling the middle 60% of the frame.
[AVOID LIST]
```

### S1 — Subscribe & save tile (optional, 1:1)

```
Aspect ratio 1:1, square.
[STYLE BLOCK]
Scene: three identical plain kraft delivery boxes sealed with deep-teal tape,
arranged in a neat row on ascending white square steps — suggesting regular,
repeat deliveries. Centered, 15% margin on all sides.
Seamless flat background #E8F5F4, soft contact shadows only.
[AVOID LIST]
```

### S2 — Buy more, save more tile (optional, 1:1)

```
Aspect ratio 1:1, square.
[STYLE BLOCK]
Scene: three identical unbranded white pump bottles with blank labels, grouped
tightly on three stepped saffron-amber square blocks of increasing height —
suggesting "buy more". Centered, 15% margin on all sides.
Seamless flat background #FFF8E1, soft contact shadows only.
[AVOID LIST]
```

---

## 5. Workflow

1. **Generate.** In Gemini, choose image creation. Paste the STYLE block, then the slot prompt,
   then the AVOID list (replace `[STYLE BLOCK]` / `[AVOID LIST]` with the actual text). If an
   aspect-ratio selector is shown, pick the slot's ratio; it's also stated in the prompt.
   Generate 3–4 variations.
2. **Refine with follow-ups** instead of starting over, for example:
   *"Keep everything the same but make the left 45% a perfectly flat, empty teal #095A56."*
   *"Remove any text or markings on the bottle labels."*
   *"Move the arrangement further right; nothing should cross the centre line."*
3. **Quality check** before accepting an image:
   - [ ] No text, digits or logos anywhere (zoom into labels and device screens)
   - [ ] The clean zone is truly empty and flat
   - [ ] The background is close to the slot hex
   - [ ] Nothing is cut off at the edges; hands look natural (5 fingers)
   - [ ] Consistent with the other images (same lighting direction, same plinth style)
4. **Drop the raw downloads** into `design/raw/` named by slot ID (for example `H1-D.png`). A
   script then crops each to its exact ratio, resizes it to the export size, converts it to WebP
   and saves it at the file path above.
5. **Wire up.** Code changes that go with the images:
   - Hero becomes a fixed **21:9 box from tablet up and 4:5 on mobile**, using a different image
     per breakpoint, with the image mirrored in Arabic and a soft gradient on the text side.
   - The category-strip icon square (56 px) becomes a **96 px photo square**.
   - The skincare bento becomes **4:5 on desktop and 16:9 below**, with its text in the bottom
     clean zone.
   - Every slot keeps its current icon/colour design as a **fallback**, so a missing image never
     breaks the page.
