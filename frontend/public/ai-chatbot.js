/**
 * Farmigo KisanAI Chatbot — Standalone Module v2.0
 * Smart Offline Knowledge Engine + Google Gemini API Integration
 *
 * ✅ Works immediately WITHOUT any API key (built-in farming knowledge base)
 * ✅ Upgrades to real Gemini AI when an API key is provided
 * ✅ Full Telugu language support
 * ✅ Does NOT modify any existing dashboard code
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     CONFIG
  ══════════════════════════════════════════════════════════════ */
  const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6JdHf3xCWjSqJx0lx94FOgZw3dxFM-hxwZENd5pyC6-qw';
  const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview'];

  const FARMIGO_LOGO_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;border-radius:inherit;"><defs><linearGradient id="farmigoGradChat" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="#FF9800"/><stop offset="100%" stop-color="#F57C00"/></linearGradient></defs><rect x="4" y="4" width="92" height="92" rx="26" fill="url(#farmigoGradChat)"/><path d="M 48 58 C 30 58 24 42 24 34 C 34 34 48 44 48 58 Z" fill="#FFFFFF"/><path d="M 52 54 C 52 34 66 22 76 22 C 76 34 64 54 52 54 Z" fill="#FFFFFF"/><path d="M 50 56 Q 46 66 40 72" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`;

  let chatHistory = [];
  let isBotTyping  = false;

  const isTeluguActive = () =>
    typeof currentLang !== 'undefined' && currentLang === 'te';

  /* ══════════════════════════════════════════════════════════════
     SMART OFFLINE FARMING KNOWLEDGE BASE
     Covers 40+ farming topics with detailed answers in EN + TE
  ══════════════════════════════════════════════════════════════ */
  const KB = [
    /* ─── KHARIF CROPS ─── */
    {
      keywords: ['kharif','kharip','ఖరీఫ్','kharif crop','kharif season','best crop kharif'],
      en: `🌾 **Best Kharif Season Crops (June–November)**

Kharif crops are sown at the beginning of monsoon and harvested in autumn.

**Top Kharif crops for Andhra Pradesh & Telangana:**
- 🌾 **Paddy (Rice)** – Most popular; needs 1200–1500 mm water
- 🌽 **Maize/Corn** – High demand, 90–100 day crop
- 🫘 **Soybean** – Good market price, improves soil nitrogen
- 🥜 **Groundnut** – Andhra Pradesh's leading oilseed
- 🌶️ **Red Chilli** – High value crop, Guntur variety is famous
- 🍆 **Cotton** – Cash crop, needs black soil
- 🌻 **Sunflower** – Good oil content, drought tolerant
- 🫘 **Pigeonpea (Tur)** – Protein-rich, low water need

**Pro Tips:**
1. Sow in June–July after first monsoon rains
2. Use certified seeds from government seed centers
3. Apply basal fertilizer (DAP + Urea) at sowing time
4. Register on eNAM portal for better market prices`,

      te: `🌾 **ఖరీఫ్ సీజన్ పంటలు (జూన్–నవంబర్)**

వర్షాకాలం మొదట్లో వేసి శీతాకాలంలో కోత పంటలు.

**ఆంధ్రప్రదేశ్ & తెలంగాణలో మంచి పంటలు:**
- 🌾 **వరి (Rice)** – అతి ముఖ్యమైన పంట
- 🌽 **మొక్కజొన్న** – మంచి మార్కెట్ ధర
- 🫘 **సోయాబీన్** – నేలలో నత్రజని పెంచుతుంది
- 🥜 **వేరుశెనగ** – AP లో ప్రధాన నూనె పంట
- 🌶️ **ఎర్ర మిర్చి** – గుంటూరు వెరైటీ ప్రసిద్ధం
- 🍆 **పత్తి** – నల్ల రేగడి నేలకు పనికొస్తుంది
- 🫘 **కందిపప్పు** – తక్కువ నీటితో పెరుగుతుంది

**ముఖ్యమైన సలహాలు:**
1. జూన్–జూలైలో తొలి వర్షాల తర్వాత విత్తండి
2. ప్రభుత్వ విత్తన కేంద్రాల నుండి certified విత్తనాలు తీసుకోండి
3. విత్తేటప్పుడు DAP + యూరియా వేయండి`
    },

    /* ─── RABI CROPS ─── */
    {
      keywords: ['rabi','రబీ','rabi crop','rabi season','winter crop','winter farming'],
      en: `❄️ **Best Rabi Season Crops (November–April)**

Rabi crops are sown in winter and harvested in spring.

**Top Rabi Crops:**
- 🌾 **Wheat** – Primary rabi crop in North India; needs cool weather
- 🫘 **Chickpea (Bengal Gram)** – Drought tolerant, excellent protein
- 🟡 **Mustard** – Quick-growing oilseed, 110–120 days
- 🌿 **Green Peas** – High value vegetable crop
- 🧅 **Onion** – Rabi onion (Feb–March) fetches best prices
- 🍅 **Tomato** – Cool season gives better yield & color
- 🥬 **Leafy Vegetables** – Spinach, fenugreek, coriander

**For AP & Telangana:**
- Sunflower (Rabi sunflower from Oct–Nov)
- Jowar (Rabi sorghum)
- Maize (second crop)

**Key Tips:**
1. Sow in October–November after Kharif harvest
2. Ensure irrigation facility as rabi depends on stored moisture
3. Apply potassium fertilizer for better grain filling`,

      te: `❄️ **రబీ సీజన్ పంటలు (నవంబర్–ఏప్రిల్)**

శీతాకాలంలో వేసి వసంతకాలంలో కోత చేసే పంటలు.

**ముఖ్యమైన రబీ పంటలు:**
- 🌾 **గోధుమ** – ఉత్తర భారతదేశంలో ప్రధాన పంట
- 🫘 **శనగ (Bengal Gram)** – తక్కువ నీటితో పెరుగుతుంది
- 🟡 **ఆవాలు** – 110–120 రోజుల్లో కోత
- 🧅 **ఉల్లిపాయ** – రబీ ఉల్లి మంచి ధర తెస్తుంది
- 🍅 **టమాటా** – చల్లని వాతావరణంలో మంచి దిగుబడి
- 🌻 **పొద్దుతిరుగుడు** – అక్టోబర్–నవంబర్‌లో వేయాలి

**సలహాలు:**
1. అక్టోబర్–నవంబర్‌లో విత్తండి
2. నీటి పారుదల సదుపాయం ఉండాలి
3. పొటాషియం ఎరువు గింజ నింపడానికి సహాయపడుతుంది`
    },

    /* ─── PEST CONTROL ─── */
    {
      keywords: ['pest','insect','bug','కీటకం','పురుగు','disease','fungus','spray','organic pest','neem'],
      en: `🐛 **Organic Pest & Disease Control Guide**

**Natural Pest Control Methods:**

**1. Neem-Based Solutions** (Most Effective)
- Neem oil spray: Mix 5ml neem oil + 1L water + few drops soap
- Spray every 7–10 days on affected plants
- Controls: aphids, whitefly, thrips, mites, leaf miners

**2. Chilli-Garlic Spray**
- Blend 100g garlic + 100g chilli + 1L water
- Strain and dilute (1:10 with water)
- Repels most sucking pests

**3. Sticky Yellow Traps**
- Hang yellow boards coated with castor oil
- Catches whiteflies, aphids, fungus gnats

**4. Beneficial Insects**
- Attract ladybugs, parasitic wasps by planting marigold borders
- Avoid broad-spectrum pesticides that kill beneficials

**5. Disease Prevention**
- Rotate crops every season
- Avoid overwatering — most fungal diseases from excess moisture
- Copper-based fungicides for leaf spots and blights

**When to spray:**
- Early morning (6–8 AM) or late evening (after 5 PM)
- Avoid spraying during flowering
- Never spray in strong wind or rain`,

      te: `🐛 **సేంద్రియ పురుగు నిర్వహణ**

**సహజ పద్ధతులు:**

**1. వేప ఆధారిత పిచికారీ**
- 5ml వేప నూనె + 1L నీళ్ళు + కొంచెం సబ్బు కలపండి
- 7–10 రోజులకొకసారి పిచికారీ చేయండి
- తెల్ల ఈగ, మీటు పురుగులు తగ్గిపోతాయి

**2. మిరప-వెల్లుల్లి కషాయం**
- 100g వెల్లుల్లి + 100g మిర్చి + 1L నీళ్ళు
- 1:10 నిష్పత్తిలో కలిపి పిచికారీ చేయండి

**3. పసుపు రంగు అట్టలు**
- ఆముదం నూనె పూసిన పసుపు అట్టలు వేలాడదీయండి
- తెల్ల ఈగలు అంటుకుంటాయి

**4. వ్యాధి నివారణ**
- ప్రతి సీజన్ పంట మారుపు చేయండి
- అధిక నీరు వేయవద్దు — శిలీంద్ర వ్యాధులు వస్తాయి

**పిచికారీ సమయం:**
- ఉదయం 6–8 గంటలు లేదా సాయంత్రం 5 గంటల తర్వాత`
    },

    /* ─── FERTILIZER ─── */
    {
      keywords: ['fertilizer','ఎరువు','fertiliser','urea','dap','npk','potash','manure','compost','nutrition','nitrogen','phosphorus','potassium'],
      en: `💊 **Fertilizer Guide for Indian Farmers**

**The NPK Foundation:**
- **N (Nitrogen/Urea)** → Leaf growth, green color
- **P (Phosphorus/DAP)** → Root development, flowering
- **K (Potassium/MOP)** → Disease resistance, fruit quality

**Crop-Specific Recommendations:**

| Crop | Basal (at sowing) | Top Dress |
|------|-------------------|-----------|
| Paddy | DAP 50kg + MOP 25kg / acre | Urea 25kg at 21 days, again at 45 days |
| Wheat | DAP 50kg + Urea 30kg / acre | Urea 25kg at first irrigation |
| Tomato | DAP 30kg + MOP 15kg / acre | Water-soluble NPK 19:19:19 weekly |
| Cotton | DAP 25kg / acre | Urea 25kg at 30 & 60 days |
| Maize | DAP 50kg + Urea 40kg / acre | Urea split in 3 doses |

**Organic Alternatives (Better Long-Term):**
- Vermicompost: 500kg–1 ton/acre — best all-rounder
- FYM (Farm Yard Manure): 2–5 tons/acre at land preparation
- Jeevamrutha: Fermented cow dung + urine + jaggery spray

**Soil Test First!**
Visit your nearest Krishi Vigyan Kendra or district agriculture office for a free soil health card.`,

      te: `💊 **ఎరువుల మార్గదర్శకం**

**NPK అర్థం:**
- **N (నత్రజని/యూరియా)** → ఆకుల వృద్ధి
- **P (భాస్వరం/DAP)** → వేర్లు, పూతలు
- **K (పొటాష్)** → వ్యాధి నిరోధకత, పండు నాణ్యత

**పంట ప్రకారం ఎరువులు:**

- **వరి:** DAP 50kg + MOP 25kg (విత్తేటప్పుడు) → 21 రోజులకు యూరియా 25kg
- **టమాటా:** DAP 30kg + MOP 15kg → వారానికొకసారి NPK 19:19:19
- **పత్తి:** DAP 25kg → 30 & 60 రోజులకు యూరియా 25kg
- **మొక్కజొన్న:** DAP 50kg + యూరియా 40kg

**సేంద్రియ ప్రత్యామ్నాయాలు:**
- వర్మీకంపోస్ట్: 500kg–1 టన్/ఎకరా
- పొలం ఎరువు (FYM): 2–5 టన్/ఎకరా
- జీవామృతం: పశువుల పేడ + మూత్రం + బెల్లం కలిపి పిచికారీ`
    },

    /* ─── PADDY / RICE ─── */
    {
      keywords: ['paddy','rice','వరి','धान','paddy crop','paddy farming','rice cultivation'],
      en: `🌾 **Paddy (Rice) Cultivation — Complete Guide**

**Varieties (AP & Telangana):**
- BPT 5204 (Samba Masuri) — most popular
- MTU 1010 — high yield, 125 days
- Rajendra Bhagwa — drought tolerant
- Improved Samba — fine grain

**Season & Sowing:**
- Kharif: Transplanting in July
- Rabi: Transplanting in November–December
- Nursery: Raise seedlings 25–30 days before transplanting
- Seed rate: 20–25 kg/acre for transplanted; 40kg/acre for direct seeding

**Water Management:**
- Maintain 5cm standing water during vegetative stage
- Drain 7 days before harvest for uniform ripening
- AWD (Alternate Wetting & Drying) saves 30% water

**Fertilizer (per acre):**
- Basal: DAP 50kg + MOP 25kg
- 21 days: Urea 25kg
- 45 days: Urea 25kg + Zinc sulphate 5kg

**Common Diseases:**
- Blast: Spray Tricyclazole
- BLB: Spray Copper oxychloride
- Brown Plant Hopper: Spray BPMC

**Expected Yield:** 25–35 quintals/acre`,

      te: `🌾 **వరి సాగు మార్గదర్శకం**

**ప్రముఖ రకాలు:**
- BPT 5204 (సాంబ మసూరి) — అత్యంత ప్రజాదరణ పొందిన రకం
- MTU 1010 — అధిక దిగుబడి, 125 రోజులు
- రాజేంద్ర భాగవ — కరువు తట్టుకుంటుంది

**విత్తన & నారు:**
- ఖరీఫ్: జూలైలో నాటు వేయండి
- నారు వయస్సు: 25–30 రోజులు
- విత్తన రేటు: 20–25 కేజీ/ఎకరా

**నీటి నిర్వహణ:**
- వానస్పతి దశలో 5cm నిలువ నీరు
- కోత కంటే 7 రోజుల ముందు నీరు తీయాలి

**ఎరువులు (ఎకరాకు):**
- విత్తేటప్పుడు: DAP 50kg + MOP 25kg
- 21 రోజులకు: యూరియా 25kg
- 45 రోజులకు: యూరియా 25kg + జింక్ సల్ఫేట్ 5kg

**దిగుబడి:** ఎకరాకు 25–35 క్వింటాళ్ళు`
    },

    /* ─── TOMATO ─── */
    {
      keywords: ['tomato','టమాటా','tamata','tomatoes','tomato farming'],
      en: `🍅 **Tomato Cultivation Guide**

**Best Varieties:**
- Hybrid: NS 585, Arka Rakshak, Rashmi
- Open Pollinated: PKM-1, CO-3

**Season:**
- Kharif: June–July transplanting
- Rabi: September–October transplanting (better yield)

**Water Requirement:**
- 600–800mm total water over crop period
- Drip irrigation saves 40% water and doubles yield
- Critical stages: flowering and fruit set
- Never let soil dry completely — causes blossom end rot

**Fertilizer (per acre):**
- Basal: DAP 30kg + MOP 15kg + Urea 10kg
- Weekly: Water-soluble NPK 19:19:19 (2kg/200L water)
- After fruit set: Increase potassium (MOP 15kg)

**Staking:** Use 1.5m bamboo stakes to support plants

**Key Diseases:**
- Early/Late Blight: Spray Mancozeb 2g/L water
- Leaf Curl (Virus): Control whitefly with Yellow traps + Imidacloprid
- Fruit Rot: Avoid overhead irrigation

**Yield:** 15–25 tons/acre
**Best Season for Price:** December–January`,

      te: `🍅 **టమాటా సాగు మార్గదర్శకం**

**మంచి రకాలు:**
- హైబ్రిడ్: NS 585, అర్క రక్షక్, రష్మి

**సీజన్:**
- ఖరీఫ్: జూన్–జూలై నాటు
- రబీ: సెప్టెంబర్–అక్టోబర్ (మంచి దిగుబడి)

**నీరు:**
- డ్రిప్ ఇరిగేషన్ వాడితే 40% నీళ్ళు ఆదా
- పూత & పండు కట్టే దశలో నీటి లోటు రాకూడదు

**ఎరువులు (ఎకరాకు):**
- విత్తేటప్పుడు: DAP 30kg + MOP 15kg
- వారానికొకసారి: NPK 19:19:19 (2kg/200L నీళ్ళు)
- పండు కట్టిన తర్వాత: MOP 15kg

**దిగుబడి:** ఎకరాకు 15–25 టన్నులు
**మంచి ధర సమయం:** డిసెంబర్–జనవరి`
    },

    /* ─── WATER / IRRIGATION ─── */
    {
      keywords: ['water','irrigation','drip','నీరు','నీటి','watering','sprinkler','irrigation system','how much water'],
      en: `💧 **Water & Irrigation Management Guide**

**Irrigation Systems Comparison:**

| System | Water Saving | Best For | Cost |
|--------|-------------|----------|------|
| Flood Irrigation | 0% (baseline) | Paddy | Low |
| Sprinkler | 30–40% | Wheat, Maize, Vegetables | Medium |
| Drip Irrigation | 40–60% | Vegetables, Fruits, Cotton | High |
| Micro Sprinkler | 35–50% | Orchards, Nurseries | Medium-High |

**Crop Water Requirements:**
- Paddy: 1200–1500mm / season
- Wheat: 400–500mm
- Tomato: 600–800mm
- Tomato (drip): 350–400mm
- Cotton: 500–700mm
- Maize: 400–600mm
- Groundnut: 400–500mm

**Subsidy Available:**
- PM Krishi Sinchayee Yojana (PMKSY): Up to 55% subsidy on drip
- Contact district agriculture office to apply
- Apply online: pmksy.gov.in

**Signs of Water Stress:**
- Leaf wilting in afternoon (severe)
- Light-colored, dry topsoil
- Yellowing from older leaves (nitrogen deficiency from drought)

**Best Irrigation Time:**
- Early morning (5–8 AM) — least evaporation
- Avoid midday irrigation in summer`,

      te: `💧 **నీటి నిర్వహణ మార్గదర్శకం**

**నీటి పారుదల పోలిక:**
- వరద నీటి పారుదల: వరి కోసం, తక్కువ ఖర్చు
- స్ప్రింక్లర్: 30–40% నీళ్ళు ఆదా
- డ్రిప్: 40–60% నీళ్ళు ఆదా, కూరగాయలకు బెస్ట్

**పంటల నీటి అవసరం:**
- వరి: 1200–1500mm
- టమాటా (డ్రిప్): 350–400mm
- పత్తి: 500–700mm

**సబ్సిడీ:**
- PMKSY పథకంలో డ్రిప్ ఇరిగేషన్ కు 55% సబ్సిడీ
- జిల్లా వ్యవసాయ కార్యాలయంలో apply చేయండి

**నీటి ఒత్తిడి సంకేతాలు:**
- మధ్యాహ్నం ఆకులు వాడిపోతాయి
- పాత ఆకులు పసుపు రంగు అవుతాయి`
    },

    /* ─── PM-KISAN ─── */
    {
      keywords: ['pm-kisan','pm kisan','pmkisan','పీఎం కిసాన్','government scheme','scheme','subsidy','loan','కిసాన్','yojana'],
      en: `📋 **Government Agricultural Schemes for Farmers**

**1. PM-KISAN (₹6,000/year)**
- Eligibility: All land-holding farmers
- Benefit: ₹2,000 every 4 months (3 installments/year)
- How to apply: pmkisan.gov.in or CSC center
- Documents: Aadhaar, bank account, land records

**2. Pradhan Mantri Fasal Bima Yojana (PMFBY)**
- Crop insurance for Kharif & Rabi
- Premium: Only 2% of sum insured for Kharif, 1.5% for Rabi
- Apply through bank or CSC before sowing

**3. Kisan Credit Card (KCC)**
- Credit limit: Up to ₹3 lakh at 4% interest (with subsidy)
- For seeds, fertilizers, pesticides
- Apply at any bank or PM-KISAN portal

**4. PM Krishi Sinchayee Yojana**
- 55% subsidy on drip/sprinkler irrigation
- Apply at district agriculture office

**5. Soil Health Card**
- Free soil testing at KVK or district office
- Fertilizer recommendations specific to your soil

**6. eNAM (Electronic National Agriculture Market)**
- Sell your produce at better prices online
- Register at enam.gov.in
- No middlemen!

**Helpline:** Call 1800-180-1551 (Toll Free) for any agricultural scheme query`,

      te: `📋 **రైతుల కోసం ప్రభుత్వ పథకాలు**

**1. PM-KISAN (₹6,000/సంవత్సరం)**
- అర్హత: భూమి కలిగిన అన్ని రైతులు
- ప్రయోజనం: ₹2,000 చొప్పున 3 వాయిదాలు
- దరఖాస్తు: pmkisan.gov.in లేదా CSC కేంద్రం

**2. ఫసల్ బీమా యోజన (PMFBY)**
- పంట బీమా — ప్రీమియం కేవలం 2%
- బ్యాంక్ లేదా CSC ద్వారా apply చేయండి

**3. కిసాన్ క్రెడిట్ కార్డ్**
- ₹3 లక్షల వరకు 4% వడ్డీకి రుణం
- బ్యాంక్‌లో apply చేయండి

**4. PMKSY సూక్ష్మ నీటి పారుదల**
- డ్రిప్/స్ప్రింక్లర్ పై 55% సబ్సిడీ

**5. eNAM పోర్టల్**
- మీ పంటను ఆన్‌లైన్‌లో మంచి ధరకు అమ్మండి
- enam.gov.in లో నమోదు చేసుకోండి

**హెల్ప్‌లైన్:** 1800-180-1551 (టోల్ ఫ్రీ)`
    },

    /* ─── SOIL HEALTH ─── */
    {
      keywords: ['soil','నేల','soil health','soil test','organic matter','compost','vermicompost','jeevamrutha','मिट्टी'],
      en: `🌱 **Soil Health Improvement Guide**

**Why Soil Health Matters:**
Healthy soil = better crop yield + less fertilizer cost + drought resistance

**Signs of Degraded Soil:**
- Hard/compacted after rain
- Waterlogging for hours after irrigation
- Pale/yellow crops despite fertilizer
- Reduced yield every year

**Natural Ways to Improve Soil:**

**1. Add Organic Matter**
- Vermicompost: 500kg–1 ton/acre each season
- FYM: 2–5 tons/acre before sowing
- Green manuring: Grow Dhaincha/Sunhemp, plow it in

**2. Jeevamrutha (Liquid Bio-Fertilizer)**
- 10kg cow dung + 10L cow urine + 1kg jaggery + 1 handful farm soil
- Mix in 200L water, keep in shade for 5 days
- Use 10–20L/acre by drip or spray weekly

**3. Biofertilizers**
- Rhizobium: For legumes (increases nitrogen)
- Azospirillum: For cereals
- PSB (Phosphate Solubilizing Bacteria): Mobilizes phosphorus

**4. Crop Rotation**
- Never grow same crop 2 seasons in a row
- Legume → Cereal → Vegetable rotation is ideal

**Free Soil Testing:**
Visit Krishi Vigyan Kendra (KVK) or call 1800-180-1551`,

      te: `🌱 **నేల ఆరోగ్య మెరుగుదల మార్గదర్శకం**

**సేంద్రియ మార్గాలు:**

**1. సేంద్రియ పదార్థాలు**
- వర్మీకంపోస్ట్: 500kg–1 టన్/ఎకరా
- పొలం ఎరువు: 2–5 టన్/ఎకరా
- హరిత మిశ్రమం: ధైంచా/సన్‌హెంప్ పెంచి దున్నండి

**2. జీవామృతం**
- 10kg పశువుల పేడ + 10L మూత్రం + 1kg బెల్లం + నేల
- 200L నీళ్ళలో కలిపి 5 రోజులు నిల్వ చేయండి
- వారానికొకసారి 10–20L/ఎకరా వేయండి

**3. జీవ ఎరువులు**
- Rhizobium: పప్పుధాన్యాల పంటలకు
- Azospirillum: ధాన్యపు పంటలకు

**4. పంట మారుపు**
- ఒకే పంట రెండు సీజన్లు వేయవద్దు
- పప్పు → ధాన్యం → కూరగాయ క్రమం అనువైనది

**ఉచిత నేల పరీక్ష:**
సమీప KVK లేదా వ్యవసాయ కార్యాలయం సందర్శించండి`
    },

    /* ─── POST HARVEST ─── */
    {
      keywords: ['storage','store','harvest','post harvest','నిల్వ','నిలువ','cold storage','packing','transport','shelf life'],
      en: `📦 **Post-Harvest Storage & Management**

**Why Post-Harvest Matters:**
30–40% of India's fresh produce is wasted due to poor post-harvest practices. Reduce losses = more income!

**Vegetable Storage Tips:**

| Vegetable | Temperature | Humidity | Shelf Life |
|-----------|-------------|----------|------------|
| Tomato | 10–15°C | 85–90% | 2–4 weeks |
| Onion | 1–3°C | 65–75% | 3–6 months |
| Potato | 3–4°C | 90–95% | 4–6 months |
| Brinjal | 10–12°C | 85–90% | 1–2 weeks |
| Green Chilli | 7–10°C | 85–90% | 2–3 weeks |

**Low-Cost Preservation Methods:**
1. **Zero Energy Cool Chamber (ZECC):** Brick chamber with sand and water — maintains 15–18°C
2. **Jute Sacks:** Better ventilation than plastic
3. **Newspaper Wrapping:** For individual fruits (mango, banana)
4. **Shade Drying:** For chilli, turmeric, onion

**Do NOT:**
- Stack produce more than 1m high (crushing)
- Store in direct sunlight
- Mix ripened and unripened produce
- Store near ethylene-producing fruits (banana, apple)

**Government Cold Storage Subsidy:**
APEDA & NHM offer subsidy for cold storage. Contact district horticulture officer.`,

      te: `📦 **కోత తర్వాత నిల్వ & నిర్వహణ**

**భారతదేశంలో 30–40% తాజా కూరగాయలు నిల్వ లోపాల వల్ల వృధా అవుతున్నాయి!**

**కూరగాయల నిల్వ:**
- టమాటా: 10–15°C, 2–4 వారాలు
- ఉల్లిపాయ: 1–3°C, 3–6 నెలలు
- బంగాళాదుంప: 3–4°C, 4–6 నెలలు

**తక్కువ ఖర్చుతో పరిష్కారాలు:**
1. **ZECC:** ఇటుకలు + ఇసుక + నీటితో 15–18°C నిర్వహించే గది
2. **గోనె సంచులు:** ప్లాస్టిక్ కంటే మంచి గాలి ప్రసరణ
3. **నీడలో ఆరబెట్టడం:** మిర్చి, పసుపు, ఉల్లికి

**చేయవద్దు:**
- 1 మీటర్ కంటే ఎక్కువ పేర్చవద్దు
- ప్రత్యక్ష సూర్యరశ్మిలో పెట్టవద్దు

**ప్రభుత్వ సబ్సిడీ:**
NHM ద్వారా కోల్డ్ స్టోరేజ్ సబ్సిడీ — జిల్లా ఉద్యాన శాఖను సంప్రదించండి`
    },

    /* ─── PRICE / MARKET ─── */
    {
      keywords: ['price','market','ధర','sell','selling','msp','minimum support price','enam','wholesale','mandi','apmc','income','profit'],
      en: `💰 **Getting Better Prices for Your Produce**

**1. Use Digital Markets**
- **eNAM Portal** (enam.gov.in): Online auction — skip middlemen
- **Farmigo Platform**: Direct to consumer — premium pricing!
- **APMC Mandi**: Local wholesale market with standardized pricing

**2. Know Current MSP Rates (2024–25)**
- Paddy (Common): ₹2,300/quintal
- Wheat: ₹2,275/quintal
- Maize: ₹2,090/quintal
- Groundnut: ₹6,783/quintal
- Cotton (Medium): ₹7,121/quintal
- Red Chilli: ₹5,440/quintal (indicative)

**3. Timing Your Sale**
- Avoid selling immediately after harvest (all farmers sell = price crash)
- Store 30–45 days if possible = 20–30% higher prices
- Check daily prices on **AgriPrices app** or **Krishi Mandi** portal

**4. Grading & Sorting**
- Grade A produce fetches 15–25% more
- Remove damaged/diseased produce before selling
- Clean, uniform-sized produce = premium buyer interest

**5. Farmer Producer Organizations (FPO)**
- Join or form an FPO to sell in bulk → better negotiation power
- Government provides ₹18 lakh to register an FPO

**6. Value Addition**
- Pickle, powder, dried products → 3–5x more value
- PMFME scheme gives 35% subsidy for food processing`,

      te: `💰 **పంటకు మంచి ధర పొందడం**

**1. డిజిటల్ మార్కెట్ వినియోగం**
- **eNAM పోర్టల్**: మీ పంటను ఆన్‌లైన్‌లో వేలం వేయండి
- **Farmigo**: నేరుగా వినియోగదారులకు అమ్మండి — అధిక ధర!

**2. MSP రేట్లు (2024–25)**
- వరి: ₹2,300/క్వింటాల్
- గోధుమ: ₹2,275/క్వింటాల్
- వేరుశెనగ: ₹6,783/క్వింటాల్
- పత్తి: ₹7,121/క్వింటాల్

**3. అమ్మే సమయం**
- కోత వెంటనే అమ్మవద్దు — ధర తక్కువగా ఉంటుంది
- 30–45 రోజులు నిల్వ చేస్తే 20–30% ఎక్కువ ధర

**4. గ్రేడింగ్**
- Grade A దెబ్బ లేని పంట 15–25% ఎక్కువ ధర తెస్తుంది

**5. FPO (రైతు ఉత్పత్తిదారుల సంఘం)**
- సంఘంగా అమ్మితే మంచి ధర చర్చ చేయవచ్చు`
    },

    /* ─── ORGANIC FARMING ─── */
    {
      keywords: ['organic','సేంద్రియ','organic farming','natural farming','zero budget','subhash palekar','pgpr','biostimulant'],
      en: `🌿 **Organic & Natural Farming Guide**

**Why Go Organic?**
- 20–30% price premium for organic produce
- Lower input cost after 2–3 years
- Healthier soil = sustainable income
- Growing demand in urban markets

**Zero Budget Natural Farming (ZBNF) — Subhash Palekar Method:**

**4 Core Components:**
1. **Jeevamrutha** (liquid fertilizer)
   - 10kg dung + 10L urine + 1kg jaggery + 200L water
   - Ferment 5 days, apply weekly

2. **Bijamrutha** (seed treatment)
   - Cow dung + urine + lime + water
   - Soak seeds 6 hours before sowing

3. **Mulching** (Avarana)
   - Cover soil with straw/dry leaves
   - Conserves moisture, suppresses weeds

4. **Whapasha** (air-water ratio)
   - Less tillage, more earthworm activity
   - Increases soil aeration

**Organic Certification in India:**
- PGS-India (Participatory Guarantee System) — group certification
- NPOP (National Programme for Organic Production)
- Contact: Apeda.gov.in for export certification

**Organic Market Channels:**
- Organic mandis in Hyderabad, Vizag, Vijayawada
- Direct-to-consumer via WhatsApp/Farmigo platform
- Export through APEDA registered exporters`,

      te: `🌿 **సేంద్రియ & సహజ వ్యవసాయం**

**ఎందుకు సేంద్రియం?**
- పంటకు 20–30% అదనపు ధర
- 2–3 సంవత్సరాల తర్వాత ఇన్‌పుట్ ఖర్చు తగ్గుతుంది
- పట్టణ మార్కెట్‌లో పెరుగుతున్న డిమాండ్

**ZBNF (సుభాష్ పాలేకర్ పద్ధతి):**

1. **జీవామృతం** — పశువుల పేడ + మూత్రం + బెల్లం + నీళ్ళు
2. **బీజామృతం** — విత్తనాలు నానబెట్టడం
3. **ఆచ్ఛాదన** — నేలను గడ్డితో కప్పడం
4. **తక్కువ దున్నకం** — వానపాముల కార్యాచరణ పెంచడం

**సేంద్రియ ధ్రువీకరణ:**
- PGS-India: సంఘ ధ్రువీకరణ పద్ధతి
- NPOP: జాతీయ కార్యక్రమం
- Apeda.gov.in లో సంప్రదించండి`
    },

    /* ─── WEATHER ─── */
    {
      keywords: ['weather','rain','drought','flood','వాతావరణం','వర్షం','కరువు','climate','temperature','cold wave'],
      en: `🌦️ **Weather & Climate-Smart Farming**

**Before the Crop Season — Check These:**
1. **IMD Forecast**: imd.gov.in — 5-day to seasonal forecast
2. **Meghdoot App** (by IMD): Free weather alerts for farmers
3. **Kisan Suvidha App**: Integrated weather + advisory

**Heat Stress Management:**
- Spray water on plants at noon during extreme heat (above 40°C)
- Mulch soil to reduce temperature by 5–8°C
- Avoid nitrogen fertilizers during heat stress
- Spray Kaolin clay 5% to reflect sunlight

**Drought Management:**
- Use drought-tolerant varieties (Rajendra Bhagwa paddy, Junagadh 11 groundnut)
- Switch to drip irrigation
- Rainwater harvesting — collect monsoon water in farm ponds
- Grow pulses and millets (lowest water requirement)

**Flood/Waterlogging:**
- Ensure proper drainage channels before monsoon
- Use raised bed or ridge-furrow planting
- After flood — spray micronutrients (Zinc + Boron) to recover

**Cold Wave Tips:**
- Smoke/fires in field margins raise temperature
- Spray Potassium nitrate (13:0:45) to harden plants
- Protect nurseries with poly cover

**Crop Insurance:**
Always insure your crop under PMFBY before the district cutoff date!`,

      te: `🌦️ **వాతావరణ స్మార్ట్ వ్యవసాయం**

**వాతావరణ అంచనా:**
- **Meghdoot App** (IMD): రైతులకు ఉచిత వాతావరణ హెచ్చరికలు
- **imd.gov.in**: 5 రోజుల నుండి సీజన్ అంచనా

**వేడి ఒత్తిడి:**
- 40°C కంటే ఎక్కువ ఉంటే మధ్యాహ్నం నీళ్ళు పిచికారీ
- ఆచ్ఛాదన నేల ఉష్ణోగ్రత 5–8°C తగ్గిస్తుంది

**కరువు:**
- కరువు తట్టుకునే రకాలు వాడండి
- డ్రిప్ ఇరిగేషన్ కు మారండి
- వర్షపు నీటి నిల్వ కోసం పొలం చెరువులు

**వరదలు:**
- పోషకాంశాలు పోతాయి — Zinc + Boron పిచికారీ చేయండి

**పంట బీమా:**
PMFBY లో జిల్లా గడువు తేదీ లోపు నమోదు చేయండి!`
    },

    /* ─── FARMIGO PLATFORM ─── */
    {
      keywords: ['farmigo','platform','sell online','listing','product','farmer dashboard','account','upload'],
      en: `🛒 **Getting the Best from Farmigo Platform**

**How to List Products Effectively:**
1. **High-Quality Photos** — Natural light, clean background, multiple angles
2. **Accurate Descriptions** — Mention variety, weight, quality grade, harvest date
3. **Competitive Pricing** — Check what other farmers charge; price 5–10% lower to start
4. **Stock Updates** — Keep your availability updated to avoid order cancellations
5. **Fast Response** — Respond to customer queries within 1 hour

**Pricing Strategy:**
- Check local mandi price daily
- Price on Farmigo: Mandi price + 20–30% (customer pays for convenience)
- Offer bundle deals (Buy 5kg, get 500g free)

**Building Your Reputation:**
- Deliver on time — most important factor
- Include a handwritten "Thank You" note — customers love it!
- Request reviews from satisfied customers

**Key Sections to Use:**
- **My Products**: List all your farm produce
- **Customer Orders**: Track and update delivery status
- **Analytics**: See which products sell most
- **AI Farm Health**: Get automated suggestions

**Tips to Increase Sales:**
- Upload seasonal products (mango in summer, strawberry in winter)
- Highlight "Organic" or "Pesticide-Free" if applicable
- Add accurate location for faster local delivery`,

      te: `🛒 **Farmigo ప్లాట్‌ఫామ్ సరిగ్గా వాడటం**

**ఉత్పత్తులు లిస్ట్ చేయడం:**
1. మంచి ఫోటోలు — సహజ వెలుతురులో, శుభ్రమైన నేపథ్యంలో
2. వివరణ — రకం, బరువు, కోత తేదీ రాయండి
3. ధర — స్థానిక మంది ధర + 20–30%
4. స్టాక్ అప్‌డేట్ — ఖాళీ అయిన వెంటనే నవీకరించండి

**ప్రతిష్ట పెంచుకోవడం:**
- సమయానికి డెలివరీ చేయండి
- 'ధన్యవాదాలు' చిన్న నోట్ పంపండి
- సంతృప్తి చెందిన కస్టమర్ల నుండి రివ్యూలు కోరండి`
    },

    /* ─── GENERAL GREETING ─── */
    {
      keywords: ['hello','hi','hey','namaste','నమస్కారం','good morning','who are you','your name','మీరు ఎవరు'],
      en: `👋 **Namaste! I'm KisanAI — Your Farming Assistant**

I'm here to help you with all your agricultural questions! Here's what I can help you with:

🌾 **Crop Management** — Which crops to grow, when to sow, how to manage
🐛 **Pest & Disease** — Identify and treat crop problems
💊 **Fertilizers** — What to use, how much, and when
💧 **Irrigation** — Water management and scheduling
📋 **Government Schemes** — PM-KISAN, crop insurance, subsidies
💰 **Market Prices** — MSP rates, selling strategies
🌱 **Soil Health** — Improvement techniques and testing
📦 **Post-Harvest** — Storage, packaging, and value addition

**Just ask me anything in English or Telugu — I'll answer within seconds!**

Examples:
- "How to grow tomatoes in summer?"
- "What is the MSP for paddy in 2025?"
- "వరి పంటకు ఏ ఎరువు వేయాలి?"`,

      te: `👋 **నమస్కారం! నేను KisanAI — మీ వ్యవసాయ సహాయకుడు**

నేను మీ వ్యవసాయ సందేహాలన్నింటికీ సహాయం చేస్తాను!

🌾 **పంట నిర్వహణ** — ఏ పంటలు, ఎప్పుడు వేయాలి
🐛 **పురుగు & వ్యాధులు** — గుర్తించడం మరియు చికిత్స
💊 **ఎరువులు** — ఏ ఎరువు, ఎంత, ఎప్పుడు
💧 **నీటి పారుదల** — నీటి నిర్వహణ
📋 **ప్రభుత్వ పథకాలు** — PM-KISAN, పంట బీమా
💰 **మార్కెట్ ధరలు** — MSP, అమ్మకం వ్యూహాలు

**ఇంగ్లీష్ లేదా తెలుగులో ఏదైనా అడగండి!**`
    }
  ];

  /* ══════════════════════════════════════════════════════════════
     SMART MATCHING ENGINE
  ══════════════════════════════════════════════════════════════ */
  function smartOfflineAnswer(userMsg) {
    const q = userMsg.toLowerCase().trim();
    const isTe = isTeluguActive() ||
      /[\u0C00-\u0C7F]/.test(userMsg); // detect Telugu unicode

    // Score each KB entry
    let bestScore  = 0;
    let bestEntry  = null;

    for (const entry of KB) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (q.includes(kw.toLowerCase())) {
          score += kw.length > 5 ? 3 : 1; // longer keyword = more specific
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestScore > 0 && bestEntry) {
      return isTe ? bestEntry.te : bestEntry.en;
    }

    // Fallback answer
    if (isTe) {
      return `🌾 **మీ ప్రశ్నకు సమాధానం:**

మీరు అడిగిన విషయం గురించి సంక్షిప్త సమాచారం:

నాకు ఈ విషయాలలో సహాయం చేయగలను:
- 🌾 పంట సాగు మరియు నిర్వహణ
- 🐛 పురుగులు & వ్యాధుల నివారణ
- 💊 ఎరువుల సిఫారసులు
- 💧 నీటి పారుదల నిర్వహణ
- 📋 ప్రభుత్వ వ్యవసాయ పథకాలు
- 💰 మార్కెట్ ధరలు & అమ్మకం వ్యూహాలు
- 🌱 నేల ఆరోగ్యం
- 📦 పంటల నిల్వ

దయచేసి మీ సందేహాన్ని మరింత స్పష్టంగా అడగండి, నేను వెంటనే సమాధానం ఇస్తాను! 🙏`;
    }

    return `🌾 **KisanAI is here to help!**

I can answer questions about:
- 🌾 Crop cultivation and management
- 🐛 Pest & disease control
- 💊 Fertilizer recommendations
- 💧 Irrigation and water management
- 📋 Government agricultural schemes (PM-KISAN, etc.)
- 💰 Market prices & selling strategies
- 🌱 Soil health improvement
- 📦 Post-harvest storage

Could you please ask a more specific farming question? For example:
*"How to grow paddy?"* or *"What fertilizer for tomato?"*

I'll answer right away! 🙏`;
  }

  /* ══════════════════════════════════════════════════════════════
     GEMINI API CALL (used only when a real key is saved)
  ══════════════════════════════════════════════════════════════ */
  const SYSTEM_PROMPT = `You are KisanAI, an expert agricultural assistant for Farmigo — an Indian farm-to-customer marketplace platform.

You specialize in: crop cultivation, sowing seasons, best farming practices, pest and disease management (organic & conventional), fertilizer recommendations and soil health, weather-based farming guidance for Indian conditions, Government agricultural schemes (PM-KISAN, Fasal Bima, etc.), market prices, MSP rates, selling strategies, irrigation, organic farming, post-harvest storage, livestock, dairy farming, and Farmigo platform tips.

Guidelines:
- Be concise, practical, and easy to understand for Indian farmers
- Use simple language; avoid overly technical jargon  
- Provide actionable advice with specific steps
- Mention relevant Indian context (states, crops, seasons like Kharif/Rabi)
- If the user writes in Telugu, respond fully in Telugu
- Always be encouraging and supportive
- Use bullet points or numbered lists for steps
- Keep responses under 350 words unless more detail is needed`;

  async function callGemini(userMessage, key) {
    const contents = [];

    // Conversation history (last 16 messages)
    for (const msg of chatHistory.slice(-16)) {
      contents.push({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 700, topP: 0.9 }
    };

    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (resp.ok) {
          const data = await resp.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply.trim();
        }

        const err = await resp.json().catch(() => ({}));
        const msg = err?.error?.message || `HTTP ${resp.status}`;
        if (resp.status === 400 || resp.status === 403) throw new Error('INVALID_KEY');
        if (resp.status === 429) throw new Error('RATE_LIMIT');
        lastError = new Error(msg);
      } catch (err) {
        if (err.message === 'INVALID_KEY' || err.message === 'RATE_LIMIT') throw err;
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini model endpoints failed');
  }

  /* ══════════════════════════════════════════════════════════════
     API KEY MANAGEMENT
  ══════════════════════════════════════════════════════════════ */
  function getSavedKey() {
    const customKey = localStorage.getItem('kisanai_gemini_key');
    if (customKey === 'DISABLED') return '';
    return customKey || DEFAULT_GEMINI_KEY;
  }

  function hasValidKey() {
    const k = getSavedKey();
    return Boolean(k && k.length >= 20);
  }

  window.aichatSaveKey = function () {
    const input = document.getElementById('aichat-key-input');
    if (!input) return;
    const val = input.value.trim();
    if (val.length < 20) {
      if (typeof showToast === 'function') showToast('❌ Invalid key format. Must be at least 20 characters', 'error');
      return;
    }
    localStorage.setItem('kisanai_gemini_key', val);
    input.value = '';
    const banner = document.getElementById('aichat-key-banner');
    if (banner) banner.style.display = 'none';
    if (typeof showToast === 'function') showToast('✅ Gemini API key activated! KisanAI is live.', 'success');
    // Update status in header
    const statusEl = document.getElementById('aichat-mode-badge');
    if (statusEl) { statusEl.textContent = '✨ Gemini AI (Live)'; statusEl.style.color = '#4ADE80'; }
    const rmBtn = document.getElementById('aichat-rm-key-btn');
    if (rmBtn) rmBtn.style.display = 'flex';
  };

  window.aichatRemoveKey = function () {
    localStorage.setItem('kisanai_gemini_key', 'DISABLED');
    const banner = document.getElementById('aichat-key-banner');
    if (banner) banner.style.display = 'flex';
    const rmBtn = document.getElementById('aichat-rm-key-btn');
    if (rmBtn) rmBtn.style.display = 'none';
    const statusEl = document.getElementById('aichat-mode-badge');
    if (statusEl) { statusEl.textContent = '📚 Smart Offline'; statusEl.style.color = '#94A3B8'; }
    if (typeof showToast === 'function') showToast('Switched to Smart Offline mode.', 'info');
  };

  /* ══════════════════════════════════════════════════════════════
     INJECT PREMIUM CSS
  ══════════════════════════════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('aichat-styles')) return;
    const s = document.createElement('style');
    s.id = 'aichat-styles';
    s.textContent = `
/* ══ KISANAI SECTION ══ */
#sec-aichat { padding:0; animation:aichat-in 0.4s ease; }
@keyframes aichat-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }

.aichat-wrap {
  width: 100%;
  max-width: 100%;
  height: calc(100vh - 190px);
  min-height: 580px;
  display: flex;
  flex-direction: column;
}

/* ── Key Banner ── */
.aichat-key-banner {
  display:flex; align-items:flex-start; gap:.9rem;
  background:linear-gradient(135deg,#FFFBEB,#FEF3C7);
  border:1.5px solid #FCD34D; border-radius:16px;
  padding:1rem 1.2rem; margin-bottom:1.2rem;
}
.aichat-key-banner-icon{font-size:1.5rem;flex-shrink:0}
.aichat-key-banner-body{flex:1}
.aichat-key-banner-title{font-weight:800;font-size:.9rem;color:#92400E;margin-bottom:.25rem}
.aichat-key-banner-desc{font-size:.8rem;color:#B45309;line-height:1.5}
.aichat-key-banner-link{color:#2E7D32;font-weight:700;text-decoration:none}
.aichat-key-banner-link:hover{text-decoration:underline}
.aichat-key-row{display:flex;gap:.5rem;margin-top:.6rem}
.aichat-key-field{
  flex:1;padding:.45rem .8rem;border-radius:8px;
  border:1.5px solid #FCD34D;background:#fff;
  font-size:.82rem;font-family:monospace;color:#1E293B;outline:none;
}
.aichat-key-field:focus{border-color:#2E7D32}
.aichat-key-save{
  padding:.45rem 1rem;border-radius:8px;border:none;
  background:linear-gradient(135deg,#2E7D32,#1b5e20);
  color:#fff;font-size:.82rem;font-weight:700;
  cursor:pointer;font-family:inherit;transition:opacity .2s;
}
.aichat-key-save:hover{opacity:.88}
.aichat-offline-badge{
  display:inline-flex;align-items:center;gap:.35rem;
  background:rgba(46,125,50,.1);border:1px solid rgba(46,125,50,.25);
  border-radius:20px;padding:.35rem .8rem;
  font-size:.75rem;font-weight:700;color:#2E7D32;margin-top:.6rem;
}

/* ── Main Panel ── */
.aichat-panel{
  flex:1;width:100%;height:100%;
  display:flex;flex-direction:column;background:#fff;
  border-radius:22px;border:1.5px solid rgba(46,125,50,.14);
  box-shadow:0 8px 36px rgba(0,0,0,.07);overflow:hidden;
}

.aichat-header{
  padding:1rem 1.6rem;
  background:linear-gradient(135deg,#0D2015 0%,#1a3324 100%);
  display:flex;align-items:center;gap:1rem;flex-shrink:0;
  border-bottom:1.5px solid rgba(255,255,255,.08);
}
.aichat-h-avatar{
  width:44px;height:44px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 14px rgba(245,124,0,.35);flex-shrink:0;overflow:hidden;
}
.aichat-h-info{flex:1}
.aichat-h-name{font-weight:800;font-size:.98rem;color:#fff;letter-spacing:-.2px}
.aichat-h-sub{font-size:.74rem;color:#4ADE80;font-weight:600;display:flex;align-items:center;gap:.32rem;margin-top:.15rem}
.aichat-dot{width:7px;height:7px;border-radius:50%;background:#4ADE80;animation:aichat-blink 1.5s infinite}
@keyframes aichat-blink{0%,100%{opacity:1}50%{opacity:.25}}
.aichat-h-actions{display:flex;gap:.4rem}
.aichat-h-btn{
  width:34px;height:34px;border-radius:9px;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);
  color:#CBD5E1;cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .2s;font-size:1rem;
}
.aichat-h-btn:hover{background:rgba(46,125,50,.3);color:#fff;border-color:rgba(46,125,50,.5)}

.aichat-msgs{
  flex:1;overflow-y:auto;padding:1.4rem 1.8rem;
  display:flex;flex-direction:column;gap:.9rem;scroll-behavior:smooth;
}
.aichat-msgs::-webkit-scrollbar{width:5px}
.aichat-msgs::-webkit-scrollbar-track{background:#F1F5F9}
.aichat-msgs::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}

/* Welcome */
.aichat-welcome{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center;flex:1;padding:1.8rem;gap:.9rem;
}
.aichat-welcome-logo{animation:aichat-bounce 2.2s infinite}
@keyframes aichat-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.aichat-welcome-title{font-size:1.45rem;font-weight:800;color:#1E293B;letter-spacing:-.4px}
.aichat-welcome-sub{font-size:.9rem;color:#64748B;font-weight:500;max-width:480px;line-height:1.6}
.aichat-welcome-chips{display:flex;flex-wrap:wrap;gap:.55rem;justify-content:center;margin-top:.4rem;max-width:650px}
.aichat-chip{
  background:linear-gradient(135deg,#F0FDF4,#DCFCE7);
  border:1.5px solid #86EFAC;color:#14532D;
  font-size:.82rem;font-weight:700;padding:.4rem .9rem;
  border-radius:20px;cursor:pointer;transition:all .2s;font-family:inherit;
}
.aichat-chip:hover{background:linear-gradient(135deg,#2E7D32,#1b5e20);color:#fff;border-color:transparent;transform:scale(1.05)}

/* Messages */
.aichat-msg{display:flex;gap:.75rem;align-items:flex-start;animation:aichat-msg-pop .3s ease;max-width:100%}
@keyframes aichat-msg-pop{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.aichat-msg.user{flex-direction:row-reverse}
.aichat-msg-av{
  width:36px;height:36px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;margin-top:2px;overflow:hidden;
}
.aichat-msg.bot .aichat-msg-av{box-shadow:0 3px 10px rgba(245,124,0,.25)}
.aichat-msg.user .aichat-msg-av{
  border-radius:50%;
  background:linear-gradient(135deg,#2E7D32,#1b5e20);
  box-shadow:0 3px 10px rgba(46,125,50,.3);
  font-size:1.05rem;color:#fff;
}
.aichat-bubble{
  max-width:76%;padding:.9rem 1.15rem;border-radius:18px;
  font-size:.9rem;line-height:1.68;font-weight:500;
}
.aichat-msg.bot  .aichat-bubble{background:#F8FAFC;border:1.5px solid #E2E8F0;border-top-left-radius:4px;color:#1E293B}
.aichat-msg.user .aichat-bubble{
  background:linear-gradient(135deg,#2E7D32,#1b5e20);color:#fff;
  border-top-right-radius:4px;box-shadow:0 4px 14px rgba(46,125,50,.25);
}
.aichat-msg-time{font-size:.68rem;color:#94A3B8;font-weight:500;margin-top:.3rem;display:block}
.aichat-msg.bot .aichat-msg-time{text-align:left}
.aichat-msg.user .aichat-msg-time{text-align:right}
.aichat-bubble ul,.aichat-bubble ol{padding-left:1.1rem;margin:.35rem 0}
.aichat-bubble li{margin:.18rem 0}
.aichat-bubble strong{font-weight:700}
.aichat-bubble p{margin:.25rem 0}
.aichat-bubble table{width:100%;border-collapse:collapse;font-size:.82rem;margin:.5rem 0}
.aichat-bubble th{background:rgba(46,125,50,.12);padding:.35rem .6rem;text-align:left;font-weight:700;border:1px solid #E2E8F0}
.aichat-bubble td{padding:.3rem .6rem;border:1px solid #E2E8F0}
.aichat-bubble tr:nth-child(even) td{background:#F8FAFC}
.aichat-msg.err .aichat-bubble{background:linear-gradient(135deg,#FEF2F2,#FECACA);border-color:#FCA5A5;color:#991B1B}

/* Typing */
.aichat-typing{display:flex;gap:.65rem;align-items:flex-start;animation:aichat-msg-pop .3s ease}
.aichat-typing-dots{
  display:flex;gap:4px;align-items:center;
  background:#F8FAFC;border:1.5px solid #E2E8F0;
  border-radius:18px;border-top-left-radius:4px;padding:.85rem 1rem;
}
.aichat-tdot{width:7px;height:7px;border-radius:50%;background:#94A3B8;animation:aichat-tdot 1.4s infinite}
.aichat-tdot:nth-child(2){animation-delay:.2s}
.aichat-tdot:nth-child(3){animation-delay:.4s}
@keyframes aichat-tdot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-6px);opacity:1}}

/* Input */
.aichat-input-area{padding:.9rem 1.1rem;background:#F8FAFC;border-top:1.5px solid #E2E8F0;flex-shrink:0}
.aichat-input-row{display:flex;gap:.65rem;align-items:flex-end}
.aichat-ta-wrap{
  flex:1;position:relative;background:#fff;border-radius:13px;
  border:1.5px solid #CBD5E1;transition:border-color .2s,box-shadow .2s;overflow:hidden;
}
.aichat-ta-wrap:focus-within{border-color:#2E7D32;box-shadow:0 0 0 3px rgba(46,125,50,.1)}
.aichat-ta{
  width:100%;border:none;outline:none;background:transparent;
  padding:.75rem .95rem;font-size:.9rem;font-family:'Inter','Outfit',sans-serif;
  color:#1E293B;resize:none;min-height:44px;max-height:110px;line-height:1.5;display:block;
}
.aichat-ta::placeholder{color:#94A3B8}
.aichat-ta-hint{font-size:.7rem;color:#94A3B8;padding:0 .95rem .35rem;font-weight:500}
.aichat-send{
  width:44px;height:44px;border-radius:13px;
  background:linear-gradient(135deg,#2E7D32,#1b5e20);border:none;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:1.15rem;transition:all .2s;
  box-shadow:0 4px 12px rgba(46,125,50,.35);flex-shrink:0;align-self:flex-end;
}
.aichat-send:hover:not(:disabled){background:linear-gradient(135deg,#388E3C,#2E7D32);transform:scale(1.06);box-shadow:0 6px 18px rgba(46,125,50,.45)}
.aichat-send:disabled{opacity:.45;cursor:not-allowed;transform:none}
.aichat-footer{display:flex;justify-content:space-between;align-items:center;margin-top:.4rem}
.aichat-chars{font-size:.7rem;color:#94A3B8;font-weight:500}
.aichat-powered{font-size:.7rem;color:#94A3B8;font-weight:600;display:flex;align-items:center;gap:.22rem}
.aichat-powered b{color:#2E7D32}
`;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════
     QUICK QUESTION LISTS
  ══════════════════════════════════════════════════════════════ */
  const QQ_EN = [
    '🌾 Best crops for Kharif season?',
    '🐛 How to control pests organically?',
    '💊 What fertilizer for paddy crop?',
    '🌧️ How much water does tomato need?',
    '📋 How to apply for PM-KISAN?',
    '💰 How to get better market price?',
    '🌱 How to improve soil health?',
    '📦 How to store vegetables after harvest?'
  ];
  const QQ_TE = [
    '🌾 ఖరీఫ్ సీజన్‌లో ఏ పంటలు వేయాలి?',
    '🐛 సేంద్రియంగా పురుగులు ఎలా నిర్వహించాలి?',
    '💊 వరి పంటకు ఏ ఎరువు వాడాలి?',
    '🌧️ టమాటాకు ఎంత నీరు కావాలి?',
    '📋 PM-KISAN కు ఎలా apply చేయాలి?',
    '💰 పంటకు మంచి ధర ఎలా పొందాలి?',
    '🌱 నేల ఆరోగ్యం ఎలా మెరుగుపరచాలి?',
    '📦 కూరగాయలను కోత తర్వాత ఎలా నిల్వ చేయాలి?'
  ];

  /* ══════════════════════════════════════════════════════════════
     BUILD HTML
  ══════════════════════════════════════════════════════════════ */
  function buildSectionHTML() {
    return `
<div id="sec-aichat" class="nav-section" style="display:none;">

  <!-- API Key Banner -->
  <div class="aichat-key-banner" id="aichat-key-banner" style="display:${hasValidKey() ? 'none' : 'flex'}">
    <div class="aichat-key-banner-icon">🔑</div>
    <div class="aichat-key-banner-body">
      <div class="aichat-key-banner-title">Boost KisanAI with Real Gemini AI (Optional)</div>
      <div class="aichat-key-banner-desc">
        KisanAI already works offline with built-in farming knowledge.
        For even smarter answers, add your free Gemini key from
        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="aichat-key-banner-link">Google AI Studio →</a>
      </div>
      <div class="aichat-offline-badge">
        <span class="material-icons-round" style="font-size:.9rem">offline_bolt</span>
        Currently working in Smart Offline Mode — fully functional!
      </div>
      <div class="aichat-key-row">
        <input type="password" id="aichat-key-input" class="aichat-key-field" placeholder="Paste your AIza... key here" autocomplete="off" />
        <button class="aichat-key-save" onclick="aichatSaveKey()">Activate AI</button>
      </div>
    </div>
  </div>

  <div class="aichat-wrap">
    <!-- Main Chat Panel (Full Width) -->
    <div class="aichat-panel">
      <div class="aichat-header">
        <div class="aichat-h-avatar">${FARMIGO_LOGO_SVG}</div>
        <div class="aichat-h-info">
          <div class="aichat-h-name">Farmigo AI — Agricultural Assistant</div>
          <div class="aichat-h-sub">
            <div class="aichat-dot"></div>
            Online · ${hasValidKey() ? 'Gemini AI Live' : 'Smart Agricultural AI'}
          </div>
        </div>
        <div class="aichat-h-actions">
          <button class="aichat-h-btn" onclick="aichatClear()" title="Clear chat">
            <span class="material-icons-round" style="font-size:1.05rem">delete_sweep</span>
          </button>
          <button class="aichat-h-btn" onclick="aichatExport()" title="Export chat">
            <span class="material-icons-round" style="font-size:1.05rem">download</span>
          </button>
          <button class="aichat-h-btn" onclick="aichatRemoveKey()" title="Reset API key" id="aichat-rm-key-btn" style="display:${hasValidKey() ? 'flex' : 'none'}">
            <span class="material-icons-round" style="font-size:1.05rem">key_off</span>
          </button>
        </div>
      </div>

      <div class="aichat-msgs" id="aichat-msgs"></div>

      <div class="aichat-input-area">
        <div class="aichat-input-row">
          <div class="aichat-ta-wrap">
            <textarea id="aichat-ta" class="aichat-ta" rows="1" maxlength="1000"
              placeholder="Ask me anything about farming… e.g. best fertilizer for wheat?"
              onkeydown="aichatKey(event)" oninput="aichatResize(this);aichatCount()"></textarea>
            <div class="aichat-ta-hint">Enter to send · Shift+Enter for new line</div>
          </div>
          <button class="aichat-send" id="aichat-send" onclick="aichatSend()">
            <span class="material-icons-round">send</span>
          </button>
        </div>
        <div class="aichat-footer">
          <span class="aichat-chars" id="aichat-chars">0 / 1000</span>
          <span class="aichat-powered" style="display:flex;align-items:center;gap:0.35rem;">
            <span style="width:14px;height:14px;display:inline-block;vertical-align:middle;flex-shrink:0;">${FARMIGO_LOGO_SVG}</span>
            Powered by <b style="color:#F57C00;">Farmigo</b> AI
          </span>
        </div>
      </div>
    </div>
  </div>
</div>`;
  }

  function buildNavItem() {
    const te = isTeluguActive();
    return `
      <div class="fd-nav-item" onclick="switchNav('aichat')" id="nav-aichat">
        <div style="width:20px;height:20px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-right:0.6rem;flex-shrink:0;">
          ${FARMIGO_LOGO_SVG}
        </div>
        <span class="fd-nav-label" data-en-text="KisanAI Chat">${te ? 'KisanAI చాట్' : 'KisanAI Chat'}</span>
        <div class="fd-nav-active-bar"></div>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER HELPERS
  ══════════════════════════════════════════════════════════════ */
  function renderWelcome() {
    const area = document.getElementById('aichat-msgs');
    if (!area) return;
    const te = isTeluguActive();
    const chips = te ? QQ_TE : QQ_EN;
    area.innerHTML = `
      <div class="aichat-welcome">
        <div class="aichat-welcome-logo" style="width:68px;height:68px;border-radius:20px;box-shadow:0 8px 24px rgba(245,124,0,.35);margin:0 auto 0.4rem;overflow:hidden;">
          ${FARMIGO_LOGO_SVG}
        </div>
        <div class="aichat-welcome-title">${te ? 'నమస్కారం! నేను Farmigo AI' : "Namaste! I'm Farmigo AI"}</div>
        <div class="aichat-welcome-sub">${te
          ? 'మీ వ్యవసాయ సందేహాలకు సెకన్లలో సమాధానాలు ఇస్తాను. ఏ పంట, ఎరువులు, తెగుళ్లు లేదా ప్రభుత్వ పథకాల గురించైనా అడగండి!'
          : 'Your instant agricultural assistant — ask me anything about crops, soil, fertilizers, pests, government schemes, or market prices!'
        }</div>
        <div class="aichat-welcome-chips">
          ${chips.slice(0, 4).map(q =>
            `<button class="aichat-chip" onclick="aichatAsk(this.textContent.trim())">${q}</button>`
          ).join('')}
        </div>
      </div>`;
  }

  function renderQQ() {
    // Quick Questions sidebar card has been removed as requested
  }

  /* ══════════════════════════════════════════════════════════════
     MESSAGE RENDERING
  ══════════════════════════════════════════════════════════════ */
  function timeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function mdToHtml(t) {
    return t
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      .replace(/^#{1,3} (.+)$/gm, '<strong>$1</strong>')
      // Tables: | header | header |
      .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
        const ths = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
        const trs = rows.trim().split('\n').map(row => {
          const tds = row.split('|').filter(Boolean).map(d => `<td>${d.trim()}</td>`).join('');
          return `<tr>${tds}</tr>`;
        }).join('');
        return `<table><tr>${ths}</tr>${trs}</table>`;
      })
      .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function esc(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  function appendMsg(role, text, isErr = false) {
    const area = document.getElementById('aichat-msgs');
    if (!area) return;
    // remove welcome if present
    const w = area.querySelector('.aichat-welcome');
    if (w) w.remove();

    const div = document.createElement('div');
    div.className = `aichat-msg ${role}${isErr ? ' err' : ''}`;
    const avHtml = role === 'bot'
      ? `<div class="aichat-msg-av bot">${FARMIGO_LOGO_SVG}</div>`
      : `<div class="aichat-msg-av user">👨‍🌾</div>`;
    const html = role === 'bot' ? mdToHtml(text) : esc(text);
    div.innerHTML = `
      ${avHtml}
      <div>
        <div class="aichat-bubble">${html}</div>
        <span class="aichat-msg-time">${timeStr()}</span>
      </div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function showTyping() {
    const area = document.getElementById('aichat-msgs');
    if (!area) return;
    const d = document.createElement('div');
    d.className = 'aichat-typing'; d.id = 'aichat-typing';
    d.innerHTML = `
      <div class="aichat-msg-av bot" style="width:34px;height:34px;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(245,124,0,.25);flex-shrink:0;">
        ${FARMIGO_LOGO_SVG}
      </div>
      <div class="aichat-typing-dots">
        <div class="aichat-tdot"></div><div class="aichat-tdot"></div><div class="aichat-tdot"></div>
      </div>`;
    area.appendChild(d);
    area.scrollTop = area.scrollHeight;
  }
  function hideTyping() {
    const el = document.getElementById('aichat-typing');
    if (el) el.remove();
  }

  /* ══════════════════════════════════════════════════════════════
     PUBLIC WINDOW FUNCTIONS
  ══════════════════════════════════════════════════════════════ */
  window.aichatSend = async function () {
    if (isBotTyping) return;
    const ta = document.getElementById('aichat-ta');
    if (!ta) return;
    const text = ta.value.trim();
    if (!text) return;

    ta.value = ''; ta.style.height = 'auto';
    document.getElementById('aichat-chars').textContent = '0 / 1000';
    appendMsg('user', text);
    chatHistory.push({ role: 'user', text });

    isBotTyping = true;
    const btn = document.getElementById('aichat-send');
    if (btn) btn.disabled = true;
    showTyping();

    let reply;
    const key = getSavedKey();

    // Simulate slight delay for realism (300ms min)
    const startTime = Date.now();

    try {
      if (hasValidKey()) {
        // Use real Gemini API
        reply = await callGemini(text, key);
      } else {
        // Use smart offline knowledge base
        await new Promise(r => setTimeout(r, Math.max(0, 300 - (Date.now() - startTime))));
        reply = smartOfflineAnswer(text);
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg === 'INVALID_KEY') {
        localStorage.removeItem('kisanai_gemini_key');
        reply = '❌ Invalid API key. Falling back to offline mode.\n\n' + smartOfflineAnswer(text);
      } else if (errMsg === 'RATE_LIMIT') {
        reply = '⏳ Rate limit reached. Using offline answer:\n\n' + smartOfflineAnswer(text);
      } else {
        reply = '⚠️ AI service unavailable. Here\'s what I know:\n\n' + smartOfflineAnswer(text);
      }
    }

    // Ensure minimum typing display time (feels natural)
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));

    hideTyping();
    appendMsg('bot', reply);
    chatHistory.push({ role: 'bot', text: reply });

    isBotTyping = false;
    if (btn) btn.disabled = false;
    if (ta) ta.focus();
  };

  window.aichatAsk = function (q) {
    const ta = document.getElementById('aichat-ta');
    if (!ta || isBotTyping) return;
    ta.value = q;
    aichatResize(ta); aichatCount();
    window.aichatSend();
  };

  window.aichatKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.aichatSend(); }
  };

  window.aichatResize = function (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
  };

  window.aichatCount = function () {
    const ta = document.getElementById('aichat-ta');
    const ch = document.getElementById('aichat-chars');
    if (ta && ch) ch.textContent = `${ta.value.length} / 1000`;
  };

  window.aichatClear = function () {
    chatHistory = [];
    renderWelcome();
    renderQQ();
    if (typeof showToast === 'function') showToast('Conversation cleared', 'info');
  };

  window.aichatExport = function () {
    if (!chatHistory.length) {
      if (typeof showToast === 'function') showToast('No conversation to export yet', 'warning');
      return;
    }
    const lines = chatHistory.map(m =>
      `[${m.role === 'user' ? 'You' : 'KisanAI'}]\n${m.text}`
    ).join('\n\n---\n\n');
    const blob = new Blob([`KisanAI Conversation\n${new Date().toLocaleString()}\n\n` + lines], {type:'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `KisanAI_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast('Chat exported!', 'success');
  };

  window.aichatRemoveKey = function () {
    localStorage.removeItem('kisanai_gemini_key');
    const banner = document.getElementById('aichat-key-banner');
    if (banner) banner.style.display = 'flex';
    const rmBtn = document.getElementById('aichat-rm-key-btn');
    if (rmBtn) rmBtn.style.display = 'none';
    const badge = document.getElementById('aichat-mode-badge');
    if (badge) badge.textContent = '📚 Smart Offline';
    if (typeof showToast === 'function') showToast('API key removed. Using Smart Offline mode.', 'info');
  };

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */
  function init() {
    injectStyles();

    // Inject nav item after "Government Schemes"
    const schemesNav = document.getElementById('nav-schemes');
    if (schemesNav && !document.getElementById('nav-aichat')) {
      schemesNav.insertAdjacentHTML('afterend', buildNavItem());
    }

    // Inject section div into .fd-sections
    const sections = document.querySelector('.fd-sections');
    if (sections && !document.getElementById('sec-aichat')) {
      sections.insertAdjacentHTML('beforeend', buildSectionHTML());
    }

    function syncLanguage(lang) {
      const isTe = lang === 'te' || isTeluguActive();
      const navLabel = document.querySelector('#nav-aichat .fd-nav-label');
      if (navLabel) navLabel.textContent = isTe ? 'KisanAI చాట్' : 'KisanAI Chat';

      const secEl = document.getElementById('sec-aichat');
      const isSecActive = secEl && (secEl.style.display !== 'none' || document.querySelector('#nav-aichat.active'));
      if (isSecActive) {
        const titleEl = document.getElementById('pageTitle');
        const subEl   = document.getElementById('pageSubtitle');
        if (titleEl) {
          titleEl.textContent = isTe ? 'KisanAI చాట్' : 'KisanAI Chat';
          titleEl.dataset.enText = 'KisanAI Chat';
        }
        if (subEl) {
          subEl.textContent = isTe
            ? 'వ్యవసాయ సందేహాలకు సెకన్లలో సమాధానాలు'
            : 'Get instant expert answers to all your farming questions';
          subEl.dataset.enText = 'Get instant expert answers to all your farming questions';
        }
      }

      const ta = document.getElementById('aichat-ta');
      if (ta) {
        ta.placeholder = isTe
          ? 'వ్యవసాయం గురించి ఏదైనా అడగండి… ఉదా: వరి పంటకు ఏ ఎరువు వాడాలి?'
          : 'Ask me anything about farming… e.g. best fertilizer for wheat?';
      }

      renderQQ();
      if (!chatHistory.length) {
        renderWelcome();
      }
    }

    renderQQ();
    renderWelcome();

    // Patch applyDashboardLanguage
    const origApplyLang = window.applyDashboardLanguage;
    if (typeof origApplyLang === 'function') {
      window.applyDashboardLanguage = function (lang, options) {
        origApplyLang(lang, options);
        syncLanguage(lang);
      };
    }

    // Patch updateNavPageTitles
    const origUpdateTitles = window.updateNavPageTitles;
    if (typeof origUpdateTitles === 'function') {
      window.updateNavPageTitles = function (sec) {
        if (sec === 'aichat') {
          syncLanguage(isTeluguActive() ? 'te' : 'en');
          return;
        }
        origUpdateTitles(sec);
      };
    }

    // Patch switchNav
    const origSwitch = window.switchNav;
    if (typeof origSwitch === 'function') {
      window.switchNav = function (sec) {
        origSwitch(sec);
        if (sec === 'aichat') {
          syncLanguage(isTeluguActive() ? 'te' : 'en');
        }
      };
    }

    // Initial sync
    syncLanguage(isTeluguActive() ? 'te' : 'en');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
