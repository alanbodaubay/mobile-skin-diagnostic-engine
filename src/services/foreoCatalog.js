/**
 * FOREO Offline Recommendation Engine & Routine Generator
 * Fulfills Week 6 Milestone: "Functioning offline recommendation module returning FOREO product shortlists"
 * Evaluates edge-AI diagnostic metrics against an expert-validated beauty-tech decision matrix.
 */

export const FOREO_PRODUCTS = {
  ESPADA: {
    id: 'espada',
    name: 'FOREO ESPADA™',
    tagline: 'Blue LED Acne Clearing & Blemish Reducer',
    color: '#0072CE',
    category: 'Targeted Treatment',
    features: [
      '415nm Blue LED Light Therapy targets acne-causing P. acnes bacteria',
      'T-Sonic™ Pulsations stimulate blood micro-circulation to accelerate blemish healing',
      'Targeting Light Precision Crosshair for concentrated treatment',
      'Ultra-hygienic medical-grade antibacterial silicone',
    ],
    protocol: {
      mode: 'Blue LED + T-Sonic™ Pulse',
      duration: '30 seconds per blemish spot',
      frequency: 'Twice daily (AM & PM)',
      targetZones: ['Cheeks', 'Chin', 'Blemish Clusters'],
    },
    topicalPairing: 'FOREO ESPADA BHA+PHA Blemish Solution or Salicylic Acid 2%',
  },

  LUNA_4: {
    id: 'luna_4',
    name: 'FOREO LUNA™ 4',
    tagline: '2-in-1 Smart Facial Cleansing & Firming',
    color: '#E91E63',
    category: 'Deep Cleansing & Sebum Control',
    features: [
      '16 adjustable T-Sonic™ pulsation intensities for custom cleansing',
      'Clinically proven to remove 99.5% of dirt, oil, and makeup residue',
      'Gentle silicone touchpoints 35x more hygienic than nylon bristles',
      'Low-frequency firming massage modes for lymphatic drainage',
    ],
    protocol: {
      mode: 'Deep Cleansing Mode (Intensity 8-10 for T-Zone, 6 for U-Zone)',
      duration: '60 seconds full face',
      frequency: 'Daily (Morning & Evening)',
      targetZones: ['Forehead (T-Zone)', 'Nose & Chin', 'Cheeks'],
    },
    topicalPairing: 'Gentle foaming cleanser with Niacinamide or Zinc PCA',
  },

  UFO_3: {
    id: 'ufo_3',
    name: 'FOREO UFO™ 3',
    tagline: '5-in-1 Deep Hydration & Mask Infusion Device',
    color: '#FF69B4',
    category: 'Deep Hydration & Texture Smoothing',
    features: [
      'Thermotherapy softens skin and infuses active ingredients deep into the dermis',
      'Cryotherapy visibly depuffs and locks active nutrients into pores',
      'Full-spectrum LED Light (Red, Green, Blue, Cyan, Orange, Purple, Yellow, White)',
      'T-Sonic™ massage enhances microvascular circulation and cellular oxygenation',
    ],
    protocol: {
      mode: 'Thermo-Infusion + Green/Cyan LED (Smoothing & Calming)',
      duration: '90 - 120 seconds',
      frequency: '3 to 4 times per week (PM routine)',
      targetZones: ['Full Face & Neck'],
    },
    topicalPairing: 'FOREO Activated Sheet Masks or Squalane/Hyaluronic Acid Essence',
  },

  BEAR_2: {
    id: 'bear_2',
    name: 'FOREO BEAR™ 2',
    tagline: 'Microcurrent Facial Toning & Contour Lifting',
    color: '#9C27B0',
    category: 'Facial Toning & Preventive Care',
    features: [
      'Advanced Microcurrent stimulates ATP production in facial muscles',
      'Anti-Shock System™ adjusts current to skin resistance in real time',
      'Sculpts jawline, lifts cheekbones, and stimulates collagen synthesis',
      'Enhances natural radiance and preserves healthy skin barrier',
    ],
    protocol: {
      mode: 'Pro Microcurrent Lifting (Level 3-5)',
      duration: '2 minutes full face',
      frequency: 'Daily or 5 times per week',
      targetZones: ['Jawline', 'Cheekbones', 'Forehead'],
    },
    topicalPairing: 'FOREO SUPERCHARGED™ Serum 2.0 (Conductive Electrolyte Gel)',
  },
};

/**
 * Evaluates AI metrics and returns a customized FOREO hardware prescription,
 * step-by-step beauty-tech routines, and clinical rationale.
 */
export function getForeoRecommendation(metrics, skinType, detectedConcerns = []) {
  const { Redness, Oiliness, Texture } = metrics;

  let primaryProduct;
  let secondaryProduct;
  let priorityRationale = '';
  let activeIngredients = [];
  let ingredientsToAvoid = [];

  // Decision Matrix based on prioritized dermatological need:
  // 1. Inflammatory erythema / acne takes first priority (calm the inflammation)
  // 2. Excess sebum takes second priority (unclog pores and balance lipid mantle)
  // 3. Texture roughness takes third priority (repair stratum corneum and hydrate)
  // 4. Healthy / balanced skin receives firming & maintenance care

  if (Redness >= 55) {
    primaryProduct = FOREO_PRODUCTS.ESPADA;
    secondaryProduct = Oiliness > 45 ? FOREO_PRODUCTS.LUNA_4 : FOREO_PRODUCTS.UFO_3;
    priorityRationale = `Erythema and localized capillary inflammation are elevated (${Redness}%). Primary focus must be calming irritation and eliminating bacterial proliferation before aggressive exfoliation. ESPADA's 415nm Blue LED provides non-thermal, targeted anti-inflammatory action.`;
    activeIngredients = ['Centella Asiatica (Cica)', 'Niacinamide (2-4%)', 'Azelaic Acid', 'Bisabolol', 'Panthenol (Pro-Vitamin B5)'];
    ingredientsToAvoid = ['High-strength Glycolic Acid (AHA)', 'Physical abrasive scrubs', 'Fragrances & Essential oils', 'Denatured Alcohol'];
  } else if (Oiliness >= 50) {
    primaryProduct = FOREO_PRODUCTS.LUNA_4;
    secondaryProduct = Texture > 45 ? FOREO_PRODUCTS.UFO_3 : FOREO_PRODUCTS.BEAR_2;
    priorityRationale = `Specular reflectance analysis indicates hyperactive sebaceous gland output (${Oiliness}%). Excess sebum traps oxidized debris in follicular infundibula. LUNA 4's T-Sonic™ pulses loosen lipophilic plugs without disrupting skin pH.`;
    activeIngredients = ['Salicylic Acid (BHA 1-2%)', 'Zinc PCA', 'Green Tea Extract (EGCG)', 'Hyaluronic Acid (Oil-Free)'];
    ingredientsToAvoid = ['Heavy mineral oils', 'Coconut oil (comedogenic)', 'Silicones (Dimethicone heavy bases)', 'Over-drying alcohol toners'];
  } else if (Texture >= 45) {
    primaryProduct = FOREO_PRODUCTS.UFO_3;
    secondaryProduct = FOREO_PRODUCTS.LUNA_4;
    priorityRationale = `Micro-relief spatial variance detected uneven surface topography and pore dilation (${Texture}%). UFO 3's Thermotherapy opens pores while Cryotherapy shrinks micro-relief, rapidly rehydrating dehydrated stratum corneum cells.`;
    activeIngredients = ['Polyhydroxy Acids (PHA)', 'Ceramides (NP, AP, EOP)', 'Low-Molecular Hyaluronic Acid', 'Peptides (Copper Tripeptide-1)'];
    ingredientsToAvoid = ['Harsh physical exfoliants', 'Sulfates (SLS/SLES)', 'Synthetic dyes'];
  } else {
    primaryProduct = FOREO_PRODUCTS.BEAR_2;
    secondaryProduct = FOREO_PRODUCTS.UFO_3;
    priorityRationale = `Skin metrics indicate healthy, balanced epidermal barrier function! Primary goal is long-term preventative care, ATP cellular stimulation, and micro-circulation toning with BEAR 2's microcurrent technology.`;
    activeIngredients = ['Vitamin C (L-Ascorbic Acid or THD Ascorbate)', 'Squalane', 'Peptide Complexes', 'Broad-Spectrum SPF 50+'];
    ingredientsToAvoid = ['Skipping broad-spectrum sun protection', 'Over-exfoliation'];
  }

  // Construct customized AM / PM regimen
  const routines = {
    morning: [
      { step: 1, title: 'Cleanse', action: `Gentle wash with water or mild cleanser${primaryProduct.id === 'luna_4' ? ' using LUNA 4 on gentle mode' : ''}.` },
      { step: 2, title: 'Treat', action: `Apply antioxidant serum (${activeIngredients[0] || 'Vitamin C'}).` },
      { step: 3, title: 'Target', action: primaryProduct.id === 'espada' ? `Use ${primaryProduct.name} for 30s on red/inflamed spots.` : `Use ${primaryProduct.name} as directed.` },
      { step: 4, title: 'Protect', action: 'Finish with a non-comedogenic SPF 30+ sunscreen.' },
    ],
    evening: [
      { step: 1, title: 'Double Cleanse', action: `Remove pollutants using ${FOREO_PRODUCTS.LUNA_4.name} with warm water and cleanser.` },
      { step: 2, title: 'Deep Infusion', action: primaryProduct.id === 'ufo_3' ? `Attach serum mask and activate ${primaryProduct.name} 90s treatment.` : `Apply calming active essence (${activeIngredients[1] || 'Centella'}).` },
      { step: 3, title: 'Barrier Repair', action: 'Lock in moisture with a barrier-repair ceramide cream.' },
    ],
  };

  return {
    primaryDevice: primaryProduct,
    secondaryDevice: secondaryProduct,
    priorityRationale,
    activeIngredients,
    ingredientsToAvoid,
    routines,
    skinType,
    concerns: detectedConcerns,
  };
}
