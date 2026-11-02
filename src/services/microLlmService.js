/**
 * On-Device Skincare Consultation Engine
 * Built for Week 9: Edge Explanation Layer.
 * Clean, natural language prose with zero markdown asterisks.
 */

import { FOREO_PRODUCTS } from './foreoCatalog.js';

export async function detectOnDeviceLlmSupport() {
  try {
    if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
      const capabilities = await window.ai.languageModel.capabilities();
      return {
        available: capabilities.available !== 'no',
        type: 'Chrome Built-in Gemini Nano',
      };
    }
  } catch (err) {
    console.debug('Native LLM check:', err);
  }
  return {
    available: true,
    type: 'On-Device Consultation Engine',
  };
}

/**
 * Strips markdown asterisks and cleans up text formatting for natural reading.
 */
function cleanProse(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '•');
}

/**
 * Synthesizes a natural, conversational response 100% on-device.
 */
export async function queryOnDeviceConsultant({
  question,
  metrics,
  skinType,
  detectedConcerns = [],
  recommendation,
}) {
  const q = question.toLowerCase().trim();

  // 1. Chrome Built-in window.ai if available
  if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
    try {
      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        const session = await window.ai.languageModel.create({
          systemPrompt: `You are a friendly, warm, expert FOREO beauty consultant.
The client's skin profile is ${skinType}. Concerns: ${detectedConcerns.join(', ') || 'General care'}.
Primary recommended device: ${recommendation?.primaryDevice?.name || 'FOREO device'}.
RULES:
- Answer the user's question directly.
- DO NOT use markdown bold asterisks (no double asterisks anywhere in your response).
- Keep text clean, conversational, and helpful.`,
        });
        const stream = await session.prompt(question);
        return {
          answer: cleanProse(stream),
          engine: 'Chrome On-Device AI',
        };
      }
    } catch (e) {
      console.warn('window.ai fallback:', e);
    }
  }

  // 2. Intelligent On-Device Natural Language Synthesizer
  const primaryDev = recommendation?.primaryDevice || FOREO_PRODUCTS.LUNA_4;
  let rawAnswer = '';

  // Topic 1: Skipping the product / What if I don't use it / Alternatives / Budget
  if (
    q.includes("don't use") ||
    q.includes('dont use') ||
    q.includes('not use') ||
    q.includes('skip') ||
    q.includes('have to buy') ||
    q.includes('without it') ||
    q.includes('alternative') ||
    q.includes('cant afford') ||
    q.includes("can't afford") ||
    q.includes('expensive') ||
    q.includes('cost') ||
    q.includes('price') ||
    q.includes('necessary')
  ) {
    rawAnswer = `You definitely do not have to buy or use the recommended device! Skincare should always fit your comfort level and budget.

Here is what to expect if you stick to everyday skincare:
The reason we suggested ${primaryDev.name} is that it provides physical benefits—like non-abrasive silicone pulsations or calming blue light—that help clear pores and soothe redness faster than topical creams can alone.

What to do instead with everyday products:
• For cleansing: Use a gentle, sulfate-free foaming cleanser with lukewarm water. Wash with your fingertips for 60 seconds.
• For redness or blemishes: Look for topical serums with Centella Asiatica (Cica), Niacinamide (2% to 4%), or a gentle 2% Salicylic Acid spot serum.
• Drying: Always pat your face gently with a clean towel instead of rubbing.

A consistent, gentle topical routine will still do wonders for your skin without any device!`;

  // Topic 2: Hands vs Device
  } else if (q.includes('hand') || q.includes('fingers') || q.includes('washcloth') || q.includes('towel')) {
    rawAnswer = `Washing with your hands is completely fine and a great everyday baseline!

The main difference is hygiene and pore depth:
Hands and washcloths can hold onto bacteria, and hands only cleanse the surface of the skin. The silicone bristles and sonic vibrations in ${primaryDev.name} reach into pores to loosen trapped oil and sunscreen without scrubbing or stretching delicate skin.

If you prefer washing with your hands, just wash your hands thoroughly with soap first, use plenty of lukewarm water, and take a full minute to gently massage your cleanser in circles.`;

  // Topic 3: Retinol / Tretinoin / Differin
  } else if (q.includes('retinol') || q.includes('tretinoin') || q.includes('differin') || q.includes('vitamin a')) {
    rawAnswer = `Yes, you can use Retinol, but keep them on separate steps:

Cleanse your face with ${primaryDev.name} first using a gentle cleanser, rinse thoroughly, and wait until your skin is completely dry. Then apply your retinol serum or cream.

Never apply prescription retinol directly onto the device itself. Retinol speeds up skin renewal, so always use the device on its gentlest setting so you do not irritate your skin barrier.`;

  // Topic 4: Vitamin C / Niacinamide / Acids
  } else if (q.includes('vitamin c') || q.includes('niacinamide') || q.includes('salicylic') || q.includes('hyaluronic') || q.includes('acid') || q.includes('serum')) {
    rawAnswer = `For your ${skinType} profile, keeping active ingredients calming and barrier-friendly is best.

Great ingredients to pair:
• Niacinamide and Centella Asiatica (Cica): Excellent for soothing redness and keeping the moisture barrier strong.
• Hyaluronic acid: Perfect for lightweight hydration right after cleansing.

Ingredients to use with care:
Avoid harsh physical scrubs, high-percentage alcohol toners, or aggressive acid peels. When skin is prone to redness or excess oil, harsh exfoliants can strip your natural moisture barrier and make redness worse.`;

  // Topic 5: Pain, Discomfort, Stinging, Sensitive Skin
  } else if (q.includes('hurt') || q.includes('pain') || q.includes('sting') || q.includes('burn') || q.includes('safe') || q.includes('sensitive') || q.includes('side effect')) {
    rawAnswer = `No, treatments with ${primaryDev.name} are completely non-invasive and should never feel painful.

You should only feel gentle vibrations or comfortable warmth depending on the mode.

If you ever feel tingling or irritation:
1. Turn the intensity down to the lowest setting.
2. Make sure your skin is well-lubricated with cleanser or water—never glide a device across dry skin.
3. If your skin ever feels raw, pause all tools for a couple of days and stick to a soothing ceramide moisturizer.`;

  // Topic 6: How long to see results / Timeline
  } else if (q.includes('how long') || q.includes('when') || q.includes('result') || q.includes('timeline') || q.includes('fast') || q.includes('how many days')) {
    rawAnswer = `Here is a realistic timeline of what to expect:

• Day 1: Your skin will feel noticeably softer and cleaner, and your moisturizers will absorb much more smoothly.
• Week 1 to 2: Excess surface shine begins to balance out, and tight dry areas feel more supple.
• Week 3 to 4: As your skin completes its natural renewal cycle, redness is visibly calmer, pores look clearer, and texture feels smoother.

Consistency matters more than strength. Using it gently once a day works much better than pressing hard or overdoing it.`;

  // Topic 7: Why this product / Reasons
  } else if (q.includes('why') || q.includes('recommend') || q.includes('choose') || q.includes('for me')) {
    const focusReason = metrics?.Redness > 50 ? 'calming redness and soothing irritation' : metrics?.Oiliness > 50 ? 'balancing excess shine in the T-zone' : 'smoothing skin texture';
    rawAnswer = `We suggested ${primaryDev.name} because your check-in indicated a ${skinType} profile, with a focus on ${focusReason}.

The key reasons:
1. Targeted care: It is designed to cleanse and care for your skin without stripping natural protective oils.
2. Ultra-hygienic silicone: Unlike bristled brushes that can harbor bathroom bacteria and cause micro-tears, medical-grade silicone is easy to rinse clean.
3. Quick daily routine: It takes just 1 to 2 minutes during your normal wash routine.`;

  // Topic 8: Daily routine / Morning & Night steps
  } else if (q.includes('routine') || q.includes('morning') || q.includes('night') || q.includes('how to use') || q.includes('step') || q.includes('order')) {
    rawAnswer = `Here is a simple, effective routine for your skin:

Morning:
1. Wash your face with lukewarm water and a gentle cleanser.
2. Apply a soothing serum or lightweight moisturizer.
3. Finish with sunscreen (SPF 30 or higher).

Night:
1. Apply your cleanser and use ${primaryDev.name} for 60 seconds in gentle circular motions.
2. Rinse thoroughly with lukewarm water and pat dry with a soft towel.
3. Apply your favorite night moisturizer or facial oil to lock in hydration while you sleep.`;

  // Topic 9: Waterproof / Cleaning / Maintenance
  } else if (q.includes('water') || q.includes('shower') || q.includes('clean') || q.includes('wash the device') || q.includes('soap')) {
    rawAnswer = `Yes, FOREO devices are 100% waterproof! You can safely use them in the shower or bath.

To clean the device:
Wash the silicone surface with warm water and basic hand soap, then rinse thoroughly and pat dry with a lint-free cloth. Do not use alcohol, acetone, or abrasive cleaning products, as they can degrade the silicone.`;

  // Topic 10: Sharing the device
  } else if (q.includes('share') || q.includes('sister') || q.includes('friend') || q.includes('family') || q.includes('someone else')) {
    rawAnswer = `While the medical-grade silicone is non-porous and resistant to bacteria, we generally recommend that each person uses their own device for optimal hygiene and to prevent passing skin bacteria between different skin barriers.

If you do share it, always wash the device thoroughly with warm antibacterial soap before and after each person uses it.`;

  // Topic 11: General / Fallback with direct question acknowledgment
  } else {
    rawAnswer = `Regarding your question about "${question}":

For your ${skinType} profile, the most important guideline is to keep your skincare gentle and consistent. 

Whether you are using ${primaryDev.name} or your favorite everyday cleansers and serums, focus on supporting your skin barrier. Avoid harsh rubbing, use lukewarm rather than hot water, and stick with soothing ingredients like ceramides and niacinamide.

Feel free to ask about specific products in your bathroom, how to adjust for different seasons, or anything else you would like to know!`;
  }

  return {
    answer: cleanProse(rawAnswer),
    engine: 'On-Device Consultation Engine',
  };
}
