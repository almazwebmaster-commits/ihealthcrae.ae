import type { ProductOption, ProductTag, QuantityTier } from "@/lib/catalog-types";
import type { L } from "@/lib/i18n-utils";

export type ProductSeed = {
  slug: string;
  name: L;
  brand: string;
  sub: string;
  price: number;
  was?: number;
  rating: number;
  reviews: number;
  stock?: number;
  tags?: ProductTag[];
  desc: L;
  options?: ProductOption[];
  /** True for the client's real catalogue; prices are placeholders until confirmed. */
  real?: boolean;
};

type Seed = ProductSeed;

// Mock catalogue — replaced by the database in Phase 2.
const seeds: Seed[] = [
  // Health & medicine
  { slug: "panadol-extra-24", brand: "panadol", sub: "pain-fever", price: 14.5, rating: 4.8, reviews: 2140, tags: ["bestseller", "express"],
    name: { en: "Panadol Extra Tablets, 24 Pack", ar: "بانادول إكسترا أقراص، 24 قرص" },
    desc: { en: "Fast, effective relief from headaches, migraines and fever.", ar: "تخفيف سريع وفعّال للصداع والصداع النصفي والحمى." } },
  { slug: "strepsils-honey-lemon-24", brand: "strepsils", sub: "cold-flu", price: 18.75, was: 22, rating: 4.7, reviews: 980, tags: ["deal", "express"],
    name: { en: "Strepsils Honey & Lemon Lozenges, 24", ar: "ستربسلز بالعسل والليمون، 24 قرص استحلاب" },
    desc: { en: "Soothing lozenges for sore throat relief.", ar: "أقراص استحلاب مهدئة لتخفيف التهاب الحلق." } },
  { slug: "vicks-vaporub-100", brand: "vicks", sub: "cold-flu", price: 27, rating: 4.8, reviews: 1520, tags: ["bestseller"],
    name: { en: "Vicks VapoRub, 100 g", ar: "فيكس فابوروب، 100 غرام" },
    desc: { en: "Medicated chest rub for relief of cough and congestion.", ar: "مرهم طبي للصدر لتخفيف السعال والاحتقان." } },
  { slug: "gaviscon-advance-mint-300", brand: "gaviscon", sub: "digestive", price: 42, was: 49, rating: 4.6, reviews: 610, tags: ["deal"],
    name: { en: "Gaviscon Advance Peppermint Liquid, 300 ml", ar: "جافيسكون أدفانس سائل بالنعناع، 300 مل" },
    desc: { en: "Long-lasting relief from heartburn and indigestion.", ar: "تخفيف طويل الأمد من حرقة المعدة وعسر الهضم." } },
  { slug: "dettol-antiseptic-500", brand: "dettol", sub: "first-aid", price: 24.5, rating: 4.9, reviews: 3010, tags: ["bestseller", "express"],
    name: { en: "Dettol Antiseptic Liquid, 500 ml", ar: "ديتول سائل مطهر، 500 مل" },
    desc: { en: "Trusted protection against germs for cuts, grazes and household hygiene.", ar: "حماية موثوقة من الجراثيم للجروح والخدوش ونظافة المنزل." } },
  { slug: "dettol-first-aid-kit", brand: "dettol", sub: "first-aid", price: 69, was: 85, rating: 4.5, reviews: 220, tags: ["new", "deal"],
    name: { en: "Dettol First Aid Kit, 40 Pieces", ar: "حقيبة إسعافات أولية من ديتول، 40 قطعة" },
    desc: { en: "Compact kit with essentials for home, car and travel.", ar: "حقيبة صغيرة تضم الأساسيات للمنزل والسيارة والسفر." } },

  // Vitamins & supplements
  { slug: "centrum-advance-multivitamin", brand: "centrum", sub: "multivitamins", price: 59, was: 72, rating: 4.8, reviews: 1840, tags: ["bestseller", "deal"],
    name: { en: "Centrum Advance Multivitamin Tablets", ar: "سنتروم أدفانس فيتامينات متعددة أقراص" },
    desc: { en: "Complete multivitamin with 24 essential nutrients for daily wellbeing.", ar: "فيتامينات متعددة متكاملة تحتوي على 24 عنصراً غذائياً أساسياً للعافية اليومية." },
    options: [
      { label: { en: "30 tablets", ar: "30 قرص" }, price: 59 },
      { label: { en: "60 tablets", ar: "60 قرص" }, price: 99 },
      { label: { en: "100 tablets", ar: "100 قرص" }, price: 149 },
    ] },
  { slug: "solgar-vitamin-d3-1000", brand: "solgar", sub: "vitamin-d", price: 64, rating: 4.7, reviews: 760, tags: ["express"],
    name: { en: "Solgar Vitamin D3 1000 IU, 100 Softgels", ar: "سولجار فيتامين د3 1000 وحدة دولية، 100 كبسولة" },
    desc: { en: "Supports healthy bones, teeth and immune function.", ar: "يدعم صحة العظام والأسنان ووظائف المناعة." } },
  { slug: "natures-bounty-fish-oil-1200", brand: "natures-bounty", sub: "omega-3", price: 89, was: 110, rating: 4.6, reviews: 540, tags: ["deal"],
    name: { en: "Nature's Bounty Fish Oil 1200 mg, 120 Softgels", ar: "نيتشرز باونتي زيت السمك 1200 ملغ، 120 كبسولة" },
    desc: { en: "Omega-3 fatty acids to support heart health.", ar: "أحماض أوميغا 3 الدهنية لدعم صحة القلب." } },
  { slug: "jamieson-vitamin-c-1000", brand: "jamieson", sub: "immunity", price: 72, rating: 4.7, reviews: 430, tags: ["new"],
    name: { en: "Jamieson Vitamin C 1000 mg Chewable, 120 Tablets", ar: "جاميسون فيتامين سي 1000 ملغ قابل للمضغ، 120 قرص" },
    desc: { en: "Antioxidant support for a healthy immune system.", ar: "دعم مضاد للأكسدة لجهاز مناعة صحي." } },
  { slug: "solgar-zinc-picolinate", brand: "solgar", sub: "immunity", price: 55, rating: 4.6, reviews: 210,
    name: { en: "Solgar Zinc Picolinate 22 mg, 100 Tablets", ar: "سولجار زنك بيكولينات 22 ملغ، 100 قرص" },
    desc: { en: "Highly absorbable zinc for immune and skin health.", ar: "زنك سهل الامتصاص لصحة المناعة والبشرة." } },
  { slug: "jamieson-omega-3-kids", brand: "jamieson", sub: "omega-3", price: 49, was: 58, rating: 4.5, reviews: 160, stock: 4, tags: ["new", "deal"],
    name: { en: "Jamieson Omega-3 Kids Gummies, 60", ar: "جاميسون أوميغا 3 حلوى للأطفال، 60 قطعة" },
    desc: { en: "Tasty gummies supporting brain and eye development.", ar: "حلوى لذيذة تدعم نمو الدماغ والعينين." } },

  // Beauty & skincare
  { slug: "cetaphil-gentle-cleanser-473", brand: "cetaphil", sub: "cleansers", price: 79, was: 95, rating: 4.8, reviews: 2650, tags: ["bestseller", "deal", "express"],
    name: { en: "Cetaphil Gentle Skin Cleanser, 473 ml", ar: "سيتافيل غسول البشرة اللطيف، 473 مل" },
    desc: { en: "Soap-free, gentle cleanser for sensitive skin.", ar: "غسول لطيف خالٍ من الصابون للبشرة الحساسة." } },
  { slug: "cerave-moisturising-cream-454", brand: "cerave", sub: "moisturisers", price: 89, rating: 4.9, reviews: 3120, tags: ["bestseller"],
    name: { en: "CeraVe Moisturising Cream, 454 g", ar: "سيرافي كريم مرطب، 454 غرام" },
    desc: { en: "With three essential ceramides and hyaluronic acid for 24-hour hydration.", ar: "بثلاثة سيراميدات أساسية وحمض الهيالورونيك لترطيب يدوم 24 ساعة." } },
  { slug: "la-roche-posay-anthelios-spf50", brand: "la-roche-posay", sub: "sun-care", price: 115, was: 135, rating: 4.8, reviews: 890, tags: ["deal", "express"],
    name: { en: "La Roche-Posay Anthelios UVMune 400 SPF50+, 50 ml", ar: "لاروش بوزيه أنثيليوس UVMune 400 بعامل حماية 50+، 50 مل" },
    desc: { en: "Very high protection fluid with an invisible finish for all skin types.", ar: "سائل بحماية عالية جداً ولمسة غير مرئية لجميع أنواع البشرة." } },
  { slug: "bioderma-sensibio-h2o-500", brand: "bioderma", sub: "cleansers", price: 92, rating: 4.7, reviews: 1410,
    name: { en: "Bioderma Sensibio H2O Micellar Water, 500 ml", ar: "بيوديرما سينسيبيو H2O ماء ميسيلار، 500 مل" },
    desc: { en: "Cleanses and removes make-up while soothing sensitive skin.", ar: "ينظف ويزيل المكياج مع تهدئة البشرة الحساسة." } },
  { slug: "la-roche-posay-hyalu-b5-serum", brand: "la-roche-posay", sub: "serums", price: 189, rating: 4.7, reviews: 520, tags: ["new"],
    name: { en: "La Roche-Posay Hyalu B5 Serum, 30 ml", ar: "لاروش بوزيه سيروم هيالو B5، 30 مل" },
    desc: { en: "Hyaluronic acid serum that plumps and repairs skin.", ar: "سيروم بحمض الهيالورونيك يملأ البشرة ويصلحها." } },
  { slug: "neutrogena-hydro-boost-gel", brand: "neutrogena", sub: "moisturisers", price: 65, was: 82, rating: 4.6, reviews: 760, tags: ["deal"],
    name: { en: "Neutrogena Hydro Boost Water Gel, 50 ml", ar: "نيوتروجينا هيدرو بوست جل مائي، 50 مل" },
    desc: { en: "Oil-free gel moisturiser with hyaluronic acid.", ar: "جل مرطب خالٍ من الزيوت بحمض الهيالورونيك." } },

  // Personal care
  { slug: "sensodyne-repair-protect-75", brand: "sensodyne", sub: "oral-care", price: 19.5, rating: 4.8, reviews: 1980, tags: ["bestseller", "express"],
    name: { en: "Sensodyne Repair & Protect Toothpaste, 75 ml", ar: "سنسوداين معجون أسنان للإصلاح والحماية، 75 مل" },
    desc: { en: "Daily protection and relief for sensitive teeth.", ar: "حماية يومية وراحة للأسنان الحساسة." } },
  { slug: "oral-b-io-series-5", brand: "oral-b", sub: "oral-care", price: 549, was: 699, rating: 4.7, reviews: 340, tags: ["deal", "new"],
    name: { en: "Oral-B iO Series 5 Electric Toothbrush", ar: "فرشاة أسنان كهربائية أورال-بي iO سلسلة 5" },
    desc: { en: "Magnetic technology with a smart pressure sensor for a professional clean.", ar: "تقنية مغناطيسية مع مستشعر ضغط ذكي لتنظيف احترافي." } },
  { slug: "nivea-creme-400", brand: "nivea", sub: "bath-body", price: 32, rating: 4.8, reviews: 2210, tags: ["bestseller"],
    name: { en: "NIVEA Creme Tin, 400 ml", ar: "كريم نيفيا علبة، 400 مل" },
    desc: { en: "The original all-purpose moisturising cream for the whole family.", ar: "الكريم المرطب الأصلي متعدد الاستخدامات لكل العائلة." } },
  { slug: "nivea-men-deodorant-150", brand: "nivea", sub: "deodorants", price: 16, was: 19, rating: 4.6, reviews: 870, tags: ["deal"],
    name: { en: "NIVEA Men Black & White Deodorant Spray, 150 ml", ar: "مزيل عرق نيفيا للرجال بلاك آند وايت بخاخ، 150 مل" },
    desc: { en: "48-hour protection without white marks or yellow stains.", ar: "حماية لمدة 48 ساعة بدون بقع بيضاء أو صفراء." } },
  { slug: "gillette-fusion5-razor", brand: "gillette", sub: "shaving", price: 45, rating: 4.7, reviews: 650, tags: ["express"],
    name: { en: "Gillette Fusion5 Razor + 2 Blades", ar: "شفرة جيليت فيوجن5 مع شفرتين" },
    desc: { en: "Five anti-friction blades for a close, comfortable shave.", ar: "خمس شفرات مضادة للاحتكاك لحلاقة ناعمة ومريحة." } },
  { slug: "dettol-hand-wash-250", brand: "dettol", sub: "bath-body", price: 12.5, rating: 4.8, reviews: 1430,
    name: { en: "Dettol Original Hand Wash, 250 ml", ar: "ديتول غسول اليدين الأصلي، 250 مل" },
    desc: { en: "Antibacterial hand wash for everyday protection.", ar: "غسول يدين مضاد للبكتيريا لحماية يومية." } },

  // Mother & baby
  { slug: "pampers-premium-care", brand: "pampers", sub: "diapers", price: 89, was: 109, rating: 4.9, reviews: 2780, tags: ["bestseller", "deal", "express"],
    name: { en: "Pampers Premium Care Diapers", ar: "حفاضات بامبرز بريميوم كير" },
    desc: { en: "Softest comfort and up to 12 hours of dryness.", ar: "راحة فائقة النعومة وجفاف يدوم حتى 12 ساعة." },
    options: [
      { label: { en: "Size 3 · 52 pcs", ar: "مقاس 3 · 52 قطعة" }, price: 89 },
      { label: { en: "Size 4 · 46 pcs", ar: "مقاس 4 · 46 قطعة" }, price: 89 },
      { label: { en: "Size 5 · 40 pcs", ar: "مقاس 5 · 40 قطعة" }, price: 92 },
    ] },
  { slug: "cerelac-wheat-dates-400", brand: "cerelac", sub: "baby-food", price: 24, rating: 4.7, reviews: 640,
    name: { en: "Nestlé Cerelac Wheat & Dates, 400 g", ar: "سيريلاك نستله بالقمح والتمر، 400 غرام" },
    desc: { en: "Infant cereal with iron, from 8 months.", ar: "حبوب للرضع غنية بالحديد، من عمر 8 أشهر." } },
  { slug: "mustela-hydra-bebe-300", brand: "mustela", sub: "baby-skincare", price: 75, rating: 4.8, reviews: 410, tags: ["new"],
    name: { en: "Mustela Hydra Bébé Body Lotion, 300 ml", ar: "موستيلا هيدرا بيبي لوشن للجسم، 300 مل" },
    desc: { en: "Daily moisturising lotion for baby's normal skin.", ar: "لوشن ترطيب يومي لبشرة الطفل العادية." } },
  { slug: "philips-avent-natural-bottle", brand: "philips-avent", sub: "feeding", price: 99, was: 120, rating: 4.7, reviews: 380, tags: ["deal"],
    name: { en: "Philips Avent Natural Response Bottle, 260 ml, 2 Pack", ar: "رضاعة فيليبس أفنت ناتشورال ريسبونس، 260 مل، عبوتان" },
    desc: { en: "Natural latch with a nipple that releases milk only when baby drinks.", ar: "التقام طبيعي مع حلمة لا تُطلق الحليب إلا عند رضاعة الطفل." } },
  { slug: "mustela-stelatopia-cream", brand: "mustela", sub: "baby-skincare", price: 98, rating: 4.6, reviews: 190, stock: 0,
    name: { en: "Mustela Stelatopia Emollient Cream, 200 ml", ar: "موستيلا ستيلاتوبيا كريم مطري، 200 مل" },
    desc: { en: "Soothes and nourishes very dry to eczema-prone skin.", ar: "يهدئ ويغذي البشرة شديدة الجفاف والمعرضة للإكزيما." } },
  { slug: "pampers-sensitive-wipes", brand: "pampers", sub: "diapers", price: 39, was: 46, rating: 4.8, reviews: 1650, tags: ["bestseller", "deal"],
    name: { en: "Pampers Sensitive Baby Wipes, 4 × 52", ar: "مناديل بامبرز سينسيتف للأطفال، 4 × 52" },
    desc: { en: "Fragrance-free wipes, gentle on sensitive skin.", ar: "مناديل خالية من العطور ولطيفة على البشرة الحساسة." } },

  // Medical devices
  { slug: "omron-m3-comfort", brand: "omron", sub: "blood-pressure", price: 249, was: 299, rating: 4.8, reviews: 720, tags: ["bestseller", "deal"],
    name: { en: "Omron M3 Comfort Blood Pressure Monitor", ar: "جهاز أومرون M3 كومفورت لقياس ضغط الدم" },
    desc: { en: "Clinically validated upper-arm monitor with Intelli Wrap cuff.", ar: "جهاز معتمد سريرياً للذراع مع كُم Intelli Wrap." } },
  { slug: "braun-thermoscan-7", brand: "braun", sub: "thermometers", price: 229, rating: 4.8, reviews: 860, tags: ["express"],
    name: { en: "Braun ThermoScan 7 Ear Thermometer", ar: "ميزان حرارة للأذن براون ثيرموسكان 7" },
    desc: { en: "Age Precision technology for accurate readings at every age.", ar: "تقنية Age Precision لقراءات دقيقة في كل الأعمار." } },
  { slug: "accu-chek-instant-kit", brand: "accu-chek", sub: "glucose", price: 129, was: 149, rating: 4.6, reviews: 330, tags: ["deal"],
    name: { en: "Accu-Chek Instant Blood Glucose Meter Kit", ar: "جهاز أكيو-تشيك إنستانت لقياس سكر الدم" },
    desc: { en: "Simple glucose testing with an intuitive target range indicator.", ar: "فحص سكر بسيط مع مؤشر نطاق مستهدف سهل الفهم." } },
  { slug: "omron-nebulizer-c28p", brand: "omron", sub: "nebulizers", price: 289, rating: 4.5, reviews: 140,
    name: { en: "Omron C28P Compressor Nebulizer", ar: "جهاز البخار أومرون C28P بالضاغط" },
    desc: { en: "Effective, easy-to-use nebulizer for the whole family.", ar: "جهاز بخار فعّال وسهل الاستخدام لكل العائلة." } },
  { slug: "braun-no-touch-forehead", brand: "braun", sub: "thermometers", price: 179, rating: 4.6, reviews: 410, tags: ["new"],
    name: { en: "Braun No Touch + Forehead Thermometer", ar: "ميزان حرارة للجبهة براون بدون لمس" },
    desc: { en: "2-in-1 contact and no-touch forehead thermometer.", ar: "ميزان حرارة للجبهة 2 في 1 باللمس وبدون لمس." } },
  { slug: "accu-chek-guide-strips-50", brand: "accu-chek", sub: "glucose", price: 95, rating: 4.7, reviews: 290, tags: ["express"],
    name: { en: "Accu-Chek Guide Test Strips, 50", ar: "شرائط فحص أكيو-تشيك جايد، 50 شريط" },
    desc: { en: "Spill-resistant vial for easy strip handling.", ar: "عبوة مقاومة للانسكاب لسهولة التعامل مع الشرائط." } },

  // Sports nutrition
  { slug: "on-gold-standard-whey", brand: "optimum-nutrition", sub: "protein", price: 249, was: 299, rating: 4.8, reviews: 1920, tags: ["bestseller", "deal"],
    name: { en: "Optimum Nutrition Gold Standard 100% Whey", ar: "أوبتيموم نيوترشن جولد ستاندرد 100% واي" },
    desc: { en: "24 g of protein per serving to support muscle recovery.", ar: "24 غرام بروتين في الحصة الواحدة لدعم تعافي العضلات." },
    options: [
      { label: { en: "2 lb · Double chocolate", ar: "2 رطل · شوكولاتة مزدوجة" }, price: 249 },
      { label: { en: "5 lb · Double chocolate", ar: "5 رطل · شوكولاتة مزدوجة" }, price: 449 },
      { label: { en: "5 lb · Vanilla ice cream", ar: "5 رطل · آيس كريم الفانيليا" }, price: 449 },
    ] },
  { slug: "myprotein-impact-whey-1kg", brand: "myprotein", sub: "protein", price: 179, rating: 4.6, reviews: 870, tags: ["new"],
    name: { en: "Myprotein Impact Whey Protein, 1 kg", ar: "ماي بروتين إمباكت واي بروتين، 1 كغ" },
    desc: { en: "High-quality whey with 21 g protein per serving.", ar: "واي عالي الجودة يحتوي 21 غرام بروتين في الحصة." } },
  { slug: "on-amino-energy", brand: "optimum-nutrition", sub: "pre-workout", price: 139, was: 159, rating: 4.7, reviews: 540, tags: ["deal"],
    name: { en: "Optimum Nutrition Amino Energy, 30 Servings", ar: "أوبتيموم نيوترشن أمينو إنرجي، 30 حصة" },
    desc: { en: "Amino acids with natural caffeine for energy and focus.", ar: "أحماض أمينية مع كافيين طبيعي للطاقة والتركيز." } },
  { slug: "quest-protein-bar-12", brand: "quest", sub: "bars", price: 149, rating: 4.7, reviews: 690, tags: ["express"],
    name: { en: "Quest Protein Bar Cookies & Cream, 12 Pack", ar: "لوح بروتين كويست بالكوكيز والكريمة، 12 قطعة" },
    desc: { en: "21 g protein and 1 g sugar per bar.", ar: "21 غرام بروتين و1 غرام سكر في كل لوح." } },
  { slug: "myprotein-electrolyte-tablets", brand: "myprotein", sub: "hydration", price: 35, rating: 4.4, reviews: 120, tags: ["new"],
    name: { en: "Myprotein Electrolyte Tablets, 20 Tablets", ar: "أقراص إلكترولايت ماي بروتين، 20 قرص" },
    desc: { en: "Effervescent tablets to replace salts lost through sweat.", ar: "أقراص فوارة لتعويض الأملاح المفقودة مع العرق." } },
  { slug: "on-micronised-creatine-300", brand: "optimum-nutrition", sub: "pre-workout", price: 119, rating: 4.8, reviews: 780, tags: ["bestseller"],
    name: { en: "Optimum Nutrition Micronised Creatine, 300 g", ar: "أوبتيموم نيوترشن كرياتين ميكروني، 300 غرام" },
    desc: { en: "Pure creatine monohydrate to support strength and power.", ar: "كرياتين مونوهيدرات نقي لدعم القوة والأداء." } },

  // ── Real catalogue (photos in design/products). PRICES ARE PLACEHOLDERS — confirm before launch.
  { real: true, slug: "sinocare-safe-aq-max-i-meter", brand: "sinocare", sub: "glucose", price: 79, rating: 4.6, reviews: 120, tags: ["new", "express"],
    name: { en: "Sinocare Safe AQ Max I Blood Glucose Meter", ar: "جهاز سينوكير سيف AQ ماكس I لقياس سكر الدم" },
    desc: { en: "No-coding glucose meter with a large display, results in mmol/L and colour range indicator.", ar: "جهاز لقياس السكر بدون ترميز مع شاشة كبيرة ونتائج بوحدة mmol/L ومؤشر ألوان للنطاق." } },
  { real: true, slug: "sinocare-safe-aq-max-i-strips-50", brand: "sinocare", sub: "glucose", price: 65, rating: 4.6, reviews: 95, tags: ["new"],
    name: { en: "Sinocare Safe AQ Max I Blood Glucose Test Strips, 50", ar: "شرائط فحص سكر الدم سينوكير سيف AQ ماكس I، 50 شريط" },
    desc: { en: "Test strips for the Safe AQ Max I meter. No coding, ISO 15197:2015 accuracy.", ar: "شرائط فحص لجهاز سيف AQ ماكس I. بدون ترميز، بدقة ISO 15197:2015." } },
  { real: true, slug: "sinocare-ican-i6-cgm", brand: "sinocare", sub: "glucose", price: 299, rating: 4.5, reviews: 60, tags: ["new"],
    name: { en: "Sinocare iCan i6 Continuous Glucose Monitor (CGM), 15-Day Sensor", ar: "جهاز سينوكير iCan i6 للمراقبة المستمرة للسكر، مستشعر 15 يوماً" },
    desc: { en: "Continuous glucose monitoring for 15 days per sensor, with an easy one-press applicator.", ar: "مراقبة مستمرة للسكر لمدة 15 يوماً لكل مستشعر، مع أداة تركيب سهلة بضغطة واحدة." } },
  { real: true, slug: "vms-wrist-blood-pressure-monitor", brand: "vms", sub: "blood-pressure", price: 129, rating: 4.4, reviews: 80, tags: ["new", "express"],
    name: { en: "VMS Wrist Blood Pressure Monitor", ar: "جهاز VMS لقياس ضغط الدم من المعصم" },
    desc: { en: "Compact wrist monitor with a large backlit display, colour-coded classification and memory.", ar: "جهاز معصم صغير بشاشة كبيرة مضيئة وتصنيف ملوّن للقراءات وذاكرة." } },
  { real: true, slug: "bambo-nature-diapers-size-1", brand: "bambo-nature", sub: "diapers", price: 49, rating: 4.8, reviews: 210, tags: ["new"],
    name: { en: "Bambo Nature Eco Diapers, Size 1 XS (2–4 kg), 22 Pieces", ar: "حفاضات بامبو نيتشر الصديقة للبيئة، مقاس 1 XS (2–4 كغ)، 22 قطعة" },
    desc: { en: "Eco-labelled diapers with 0% parabens, perfume, lotions and chlorine bleaching.", ar: "حفاضات حاصلة على العلامة البيئية، خالية من البارابين والعطور واللوشن والتبييض بالكلور." } },
  { real: true, slug: "bambo-nature-baby-wet-wipes-80", brand: "bambo-nature", sub: "diapers", price: 22, rating: 4.8, reviews: 180, tags: ["new"],
    name: { en: "Bambo Nature Baby Wet Wipes, 80 Pieces", ar: "مناديل مبللة للأطفال بامبو نيتشر، 80 منديل" },
    desc: { en: "Gentle wipes for sensitive skin with 0% perfume and colour. Dermatologically tested.", ar: "مناديل لطيفة للبشرة الحساسة خالية من العطور والألوان. مختبرة من أطباء الجلد." } },
  { real: true, slug: "bambo-nature-swim-pants-medium", brand: "bambo-nature", sub: "diapers", price: 59, rating: 4.7, reviews: 70, tags: ["new"],
    name: { en: "Bambo Nature Swim Pants, Medium (12+ kg), 12 Pieces", ar: "سراويل سباحة بامبو نيتشر، مقاس متوسط (12+ كغ)، 12 قطعة" },
    desc: { en: "Disposable swim pants suitable for sensitive skin, for boys and girls.", ar: "سراويل سباحة للاستعمال مرة واحدة مناسبة للبشرة الحساسة، للأولاد والبنات." } },
];

// Replenishable subcategories eligible for Subscribe & save, with their discount.
const SUBSCRIBE_PCT: Record<string, number> = {
  multivitamins: 10, "vitamin-d": 10, "omega-3": 10, immunity: 10,
  cleansers: 10, moisturisers: 10,
  "oral-care": 10, "bath-body": 10, deodorants: 10, shaving: 10,
  diapers: 15, "baby-food": 10,
  glucose: 10,
  protein: 15, "pre-workout": 10, hydration: 10, bars: 10,
};
const MULTIBUY_SUBS = new Set([
  "pain-fever", "cold-flu", "first-aid",
  "multivitamins", "vitamin-d", "omega-3", "immunity",
  "cleansers", "moisturisers", "sun-care",
  "oral-care", "bath-body", "deodorants",
  "diapers", "baby-food", "bars", "hydration",
]);
// Durable goods inside otherwise-eligible subcategories.
const NO_SUBSCRIBE = new Set([
  "oral-b-io-series-5", "accu-chek-instant-kit", "gillette-fusion5-razor", "sinocare-safe-aq-max-i-meter",
]);
const NO_MULTIBUY = new Set(["oral-b-io-series-5"]);
const DEFAULT_TIERS: QuantityTier[] = [
  { qty: 2, pct: 5 },
  { qty: 3, pct: 10 },
];

export const productSeeds = seeds;

export function subscribePctFor(s: ProductSeed) {
  return NO_SUBSCRIBE.has(s.slug) ? undefined : SUBSCRIBE_PCT[s.sub];
}

export function tiersFor(s: ProductSeed) {
  return MULTIBUY_SUBS.has(s.sub) && !NO_MULTIBUY.has(s.slug) ? DEFAULT_TIERS : [];
}
