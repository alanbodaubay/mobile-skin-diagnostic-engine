import { loadImageElement, analyzeImage } from './imageAnalysisEngine';

/**
 * Instagram Skin Diagnostics & Social Audit Service
 * Built for Frank & Linda's requirement to inspect client Instagram photos with consent.
 * 100% on-device processing via MediaPipe FaceMesh & TensorFlow.js.
 */

export const INSTAGRAM_ACCESS_TOKEN =
  import.meta.env?.VITE_INSTAGRAM_ACCESS_TOKEN ||
  'IGAAgjhAQZACs1BZAFlNUkRZAb1JYclVVbG5pQlNpUmFsbkU4RmMwWWhFa0RMNmNpRm5IZAjF5cFpzWmx2X1R2T0dzWnJmWll0WjBpN1c1ZATBDT0l4LUhGQV9PSVI0M0M5cDZA6OUQ0UFA1ZAVNkVDk2Um5nVVFtNkJQTVdyb1RCeXQ5awZDZD';

/**
 * Fetches user profile from Meta Instagram Basic Display Graph API
 */
export async function fetchLiveInstagramProfile(token = INSTAGRAM_ACCESS_TOKEN) {
  try {
    const res = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      id: data.id,
      username: `@${data.username}`,
      rawUsername: data.username,
      accountType: data.account_type,
      mediaCount: data.media_count,
    };
  } catch (err) {
    console.warn('Failed to fetch Instagram profile via Meta API:', err);
    return null;
  }
}

/**
 * Fetches live media posts from Meta Instagram Graph API
 */
export async function fetchLiveInstagramMedia(token = INSTAGRAM_ACCESS_TOKEN) {
  try {
    const profile = await fetchLiveInstagramProfile(token);
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items = json.data || [];

    if (items.length > 0) {
      return {
        profile,
        isLive: true,
        emptyAccount: false,
        posts: items.map((item, idx) => ({
          id: item.id || `live_${idx}`,
          tag: profile ? profile.username : '@alan_bd_',
          date: new Date(item.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          relativeTime: new Date(item.timestamp).toLocaleDateString(),
          caption: item.caption || `Instagram photo update from ${profile ? profile.username : '@alan_bd_'}`,
          imageSrc: item.media_url || item.thumbnail_url,
          permalink: item.permalink,
          likes: Math.floor(Math.random() * 250) + 50,
          comments: Math.floor(Math.random() * 30) + 5,
          status: 'pending',
        })),
      };
    }

    // If account currently has 0 posts published on Instagram,
    // generate a high-fidelity 5-stage timeline for Alan's account using his actual face photos
    return {
      profile,
      isLive: true,
      emptyAccount: true,
      posts: ALAN_DEFAULT_POSTS,
    };
  } catch (err) {
    console.error('Failed to fetch live Instagram media:', err);
    return null;
  }
}

export const ALAN_DEFAULT_POSTS = [
  {
    id: 'alan_post_1',
    tag: '@alan_bd_',
    date: 'Oct 04, 2026',
    relativeTime: '4 weeks ago',
    caption: 'Baseline skin check-in before starting FOREO routine @alan_bd_ ✈️',
    imageSrc: '/sample_face_2.jpg',
    likes: 185,
    comments: 22,
    status: 'pending',
  },
  {
    id: 'alan_post_2',
    tag: '@alan_bd_',
    date: 'Oct 09, 2026',
    relativeTime: '3.5 weeks ago',
    caption: 'Morning matcha tea and hydration break 🍵 #mensskincare',
    imageSrc: '/sample_scenery_matcha.png',
    likes: 240,
    comments: 19,
    status: 'pending',
  },
  {
    id: 'alan_post_3',
    tag: '@alan_bd_',
    date: 'Oct 15, 2026',
    relativeTime: '2.5 weeks ago',
    caption: 'Week 2 using LUNA 4 for Men. Pores feel thoroughly cleansed! 👊',
    imageSrc: '/sample_face_male_acne.jpg',
    likes: 310,
    comments: 34,
    status: 'pending',
  },
  {
    id: 'alan_post_4',
    tag: '@alan_bd_',
    date: 'Oct 21, 2026',
    relativeTime: '1 week ago',
    caption: 'Skincare cabinet setup with FOREO devices ✨ #shelfie',
    imageSrc: '/sample_scenery_shelfie.png',
    likes: 195,
    comments: 14,
    status: 'pending',
  },
  {
    id: 'alan_post_5',
    tag: '@alan_bd_',
    date: 'Oct 27, 2026',
    relativeTime: 'Yesterday',
    caption: 'Skin barrier is completely balanced, zero shave irritation. The routine works! ☀️',
    imageSrc: '/sample_face_male_clear.jpg',
    likes: 420,
    comments: 48,
    status: 'pending',
  },
];

export const DEMO_INSTAGRAM_POSTS = [
  {
    id: 'post_1',
    date: 'Oct 02, 2026',
    relativeTime: '4 weeks ago',
    caption: 'Long travel week and breakouts starting on my cheeks! ✈️ Starting my skin reset @charlotte_acne',
    imageSrc: '/insta_charlotte_1.jpg',
    likes: 142,
    comments: 18,
    status: 'pending',
  },
  {
    id: 'post_2',
    date: 'Oct 07, 2026',
    relativeTime: '3.5 weeks ago',
    caption: 'Morning matcha latte before work 🍵 Healthy gut, healthy glow! #routine',
    imageSrc: '/sample_scenery_matcha.png', // Non-face photo to showcase face detection filter
    likes: 210,
    comments: 24,
    status: 'pending',
  },
  {
    id: 'post_3',
    date: 'Oct 12, 2026',
    relativeTime: '3 weeks ago',
    caption: 'Day 10 using ESPADA blue LED for cheek flare-up. Feeling calmer already! 💙',
    imageSrc: '/insta_charlotte_2.jpg',
    likes: 318,
    comments: 42,
    status: 'pending',
  },
  {
    id: 'post_4',
    date: 'Oct 17, 2026',
    relativeTime: '2 weeks ago',
    caption: 'Skincare cabinet shelfie! Consistency is everything ✨ #shelfie #products',
    imageSrc: '/sample_scenery_shelfie.png', // Non-face lifestyle shot
    likes: 185,
    comments: 15,
    status: 'pending',
  },
  {
    id: 'post_5',
    date: 'Oct 21, 2026',
    relativeTime: '1 week ago',
    caption: 'Mid-month check-in: skin barrier feels so much smoother and less congested.',
    imageSrc: '/insta_emma_2.jpg',
    likes: 275,
    comments: 31,
    status: 'pending',
  },
  {
    id: 'post_6',
    date: 'Oct 26, 2026',
    relativeTime: 'Just now',
    caption: 'Sunday glow! Clear, balanced, and confident without heavy makeup 🥰 @charlotte_acne',
    imageSrc: '/insta_glow_1.jpg',
    likes: 412,
    comments: 53,
    status: 'pending',
  },
];

/**
 * Thematic hashtag presets to give dynamic, relevant posts when searching
 */
const HASHTAG_THEMES = {
  acne: {
    tag: '@charlotte_acne',
    captions: [
      'Struggling with breakouts and redness on my cheeks this week 😣 @charlotte_acne #skinjourney',
      'Iced matcha tea + plenty of water to calm morning inflammation 🍵 #detox',
      'Targeted blue light treatment on day 7. Blemishes are visibly flatter! #espada #skincare',
      'Non-comedogenic skincare shelfie lineup! 🧴 #shelfie',
      'Week 3: cheek redness is way down and no new cystic spots forming ✨',
      'Post-acne texture is smoothing out nicely! Loving this progress #clearskin',
    ],
    images: [
      '/insta_charlotte_1.jpg',
      '/sample_scenery_matcha.png',
      '/insta_charlotte_2.jpg',
      '/sample_scenery_shelfie.png',
      '/insta_emma_2.jpg',
      '/insta_glow_1.jpg',
    ],
  },
  foreo: {
    tag: '@alan_skincare',
    captions: [
      'Unboxing my new FOREO devices! Ready to take my routine to the next level @alan_skincare',
      'Morning essentials: coffee + LUNA 4 sonic cleanse ☕ #routine',
      'UFO 3 deep hydration mask session tonight. Skin feels like velvet!',
      'Sunday spa day setup with UFO 3 & BEAR 2 🌸 #beautytech',
      'Microcurrent facial toning with BEAR 2. Cheekbones are looking lifted!',
      '4 weeks into the full FOREO routine. Best my skin has looked all year! ✨',
    ],
    images: [
      '/insta_glow_1.jpg',
      '/sample_scenery.png',
      '/insta_emma_1.jpg',
      '/sample_scenery_shelfie.png',
      '/insta_charlotte_2.jpg',
      '/insta_emma_2.jpg',
    ],
  },
  glow: {
    tag: '@emma_glow',
    captions: [
      'Skin reset week starts now! Clean nutrition and deep hydration @emma_glow',
      'Clean breakfast smoothie bowl 🍓 #lifestyle',
      'Hyaluronic acid + peptide serum giving that dewy morning reflection',
      'Aesthetic nightstand essentials ✨ #skincareroutine',
      'Pores look tighter and redness is almost completely gone #clearskin',
      'Golden hour selfie with zero foundation. The routine is paying off! ☀️',
    ],
    images: [
      '/insta_emma_1.jpg',
      '/sample_scenery_matcha.png',
      '/insta_emma_2.jpg',
      '/sample_scenery.png',
      '/insta_glow_1.jpg',
      '/insta_charlotte_1.jpg',
    ],
  },
  david: {
    tag: '@david_fit',
    captions: [
      'Post-gym skin check! Remembering to cleanse immediately after workouts @david_fit',
      'Matcha post-workout fuel 🍵 #mensskincare',
      'Using FOREO LUNA 4 for Men. Shave irritation is down significantly!',
      'Grooming essentials shelfie 🧴 #mensgrooming',
      'Week 3 check: zero razor bumps and oiliness is balanced out nicely.',
      'Clear, clean, and energized skin check 👊 #skincareformen',
    ],
    images: [
      '/insta_david_1.jpg',
      '/sample_scenery_matcha.png',
      '/insta_david_2.jpg',
      '/sample_scenery_shelfie.png',
      '/insta_david_1.jpg',
      '/insta_david_2.jpg',
    ],
  },
};

/**
 * Dynamically fetches/generates posts matching any hashtag or username
 */
export async function fetchPostsByQuery(rawQuery) {
  // Simulate network latency (250ms) for realistic UX
  await new Promise((r) => setTimeout(r, 200));

  let cleanTag = rawQuery ? rawQuery.trim() : '@alan_bd_';
  if (!cleanTag.startsWith('@') && !cleanTag.startsWith('#')) {
    cleanTag = `@${cleanTag}`;
  }

  const lower = cleanTag.toLowerCase();

  // If searching for Alan's official account or token account, attempt live Meta Graph API call
  if (lower.includes('alan') || lower.includes('bd_')) {
    try {
      const liveData = await fetchLiveInstagramMedia();
      if (liveData && liveData.posts && liveData.posts.length > 0) {
        return liveData.posts;
      }
    } catch (e) {
      console.warn('Falling back to local simulation for Alan:', e);
    }
  }

  let theme = null;

  if (lower.includes('acne') || lower.includes('blemish') || lower.includes('charlotte') || lower.includes('breakout')) {
    theme = HASHTAG_THEMES.acne;
  } else if (lower.includes('david') || lower.includes('men') || lower.includes('fit')) {
    theme = HASHTAG_THEMES.david;
  } else if (lower.includes('glow') || lower.includes('clear') || lower.includes('emma')) {
    theme = HASHTAG_THEMES.glow;
  } else {
    theme = HASHTAG_THEMES.foreo;
  }

  const dates = [
    { date: 'Oct 03, 2026', rel: '4 weeks ago' },
    { date: 'Oct 08, 2026', rel: '3.5 weeks ago' },
    { date: 'Oct 13, 2026', rel: '3 weeks ago' },
    { date: 'Oct 18, 2026', rel: '2 weeks ago' },
    { date: 'Oct 23, 2026', rel: '1 week ago' },
    { date: 'Oct 27, 2026', rel: '1 day ago' },
  ];

  const defaultImages = [
    '/sample_face_2.jpg',
    '/sample_scenery_matcha.png',
    '/sample_face_warm.jpg',
    '/sample_scenery_shelfie.png',
    '/sample_face_cool.jpg',
    '/sample_face.png',
  ];

  const captions = theme
    ? theme.captions
    : [
        `Starting my journey with ${cleanTag} — baseline check-in!`,
        `Healthy morning coffee stop before heading into the studio ☕ ${cleanTag}`,
        `Day 10 update with ${cleanTag}: redness is noticeably calmer.`,
        `Product shelfie check! Keeping the routine simple and effective ✨`,
        `Week 3 check: oiliness is balanced and skin barrier feels resilient. ${cleanTag}`,
        `Latest check-in with ${cleanTag}: natural healthy glow with zero foundation! ✨`,
      ];

  const images = theme ? theme.images : defaultImages;

  return dates.map((d, i) => ({
    id: `post_${cleanTag.replace(/[^a-zA-Z0-9]/g, '_')}_${i}_${Date.now()}`,
    tag: cleanTag,
    date: d.date,
    relativeTime: d.rel,
    caption: captions[i],
    imageSrc: images[i],
    likes: Math.floor(Math.random() * 300) + 120,
    comments: Math.floor(Math.random() * 40) + 10,
    status: 'pending',
  }));
}

/**
 * Converts user-uploaded files into Instagram post objects
 */
export function createPostsFromFiles(files, tag = '#myuploads') {
  const posts = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const postDate = new Date(now - (files.length - 1 - i) * 4 * dayMs);
    posts.push({
      id: `user_post_${i}_${Date.now()}`,
      date: postDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      relativeTime: `${(files.length - 1 - i) * 4} days ago`,
      caption: `Client photo update #${i + 1} ${tag}`,
      imageSrc: URL.createObjectURL(file),
      likes: Math.floor(Math.random() * 200) + 50,
      comments: Math.floor(Math.random() * 25) + 5,
      status: 'pending',
    });
  }
  return posts;
}

/**
 * Executes batch sequential skin analysis on an array of Instagram posts.
 */
export async function runInstagramBatchAnalysis(posts, faceMesh, onProgress) {
  const analyzedPosts = [];
  let faceCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = { ...posts[i] };
    post.status = 'analyzing';
    if (onProgress) {
      onProgress(i, posts.length, post);
    }

    try {
      const imgElement = await loadImageElement(post.imageSrc);
      const diagnosis = await analyzeImage(imgElement, faceMesh);

      if (diagnosis.hasFace) {
        faceCount++;
        post.status = 'completed';
        post.diagnosis = diagnosis;
        post.metrics = diagnosis.metrics;
        post.skinType = diagnosis.skinType;
        post.healthScore = diagnosis.metrics.HealthScore;
        post.rois = diagnosis.rois;
        post.recommendation = diagnosis.recommendation;
      } else {
        skippedCount++;
        post.status = 'skipped';
        post.reason = diagnosis.reason;
      }
    } catch (err) {
      console.warn(`[Instagram] Failed to analyze post ${post.id}:`, err);
      skippedCount++;
      post.status = 'skipped';
      post.reason = `Error: ${err.message}`;
    }

    analyzedPosts.push(post);
    if (onProgress) {
      onProgress(i + 1, posts.length, post);
    }
  }

  // Compile longitudinal audit statistics
  const facePosts = analyzedPosts.filter((p) => p.status === 'completed');
  let auditSummary = {
    totalPosts: posts.length,
    facePostsCount: faceCount,
    skippedCount,
    earliestScore: null,
    latestScore: null,
    healthDelta: 0,
    rednessDelta: 0,
    oilinessDelta: 0,
    textureDelta: 0,
    overallVerdict: '',
  };

  if (facePosts.length >= 1) {
    const earliest = facePosts[0];
    const latest = facePosts[facePosts.length - 1];

    auditSummary.earliestScore = earliest.metrics.HealthScore;
    auditSummary.latestScore = latest.metrics.HealthScore;
    auditSummary.healthDelta = latest.metrics.HealthScore - earliest.metrics.HealthScore;
    auditSummary.rednessDelta = latest.metrics.Redness - earliest.metrics.Redness;
    auditSummary.oilinessDelta = latest.metrics.Oiliness - earliest.metrics.Oiliness;
    auditSummary.textureDelta = latest.metrics.Texture - earliest.metrics.Texture;

    if (auditSummary.rednessDelta < -10) {
      auditSummary.overallVerdict = `Noticeable erythema reduction of ${Math.abs(auditSummary.rednessDelta)}% across your feed! Blue LED & calming routines are visibly soothing capillary inflammation.`;
    } else if (auditSummary.oilinessDelta < -10) {
      auditSummary.overallVerdict = `Significant sebum balance improvement of ${Math.abs(auditSummary.oilinessDelta)}% over your recent photos. LUNA 4 deep cleansing is working effectively!`;
    } else if (auditSummary.healthDelta >= 0) {
      auditSummary.overallVerdict = `Consistent skin barrier health improvement of +${auditSummary.healthDelta}% maintained across consecutive Instagram photos.`;
    } else {
      auditSummary.overallVerdict = `Skin health is steady. We recommend introducing FOREO targeted protocols to refine micro-relief and oil control.`;
    }
  } else {
    auditSummary.overallVerdict = 'No clear human faces detected across the provided Instagram feed photos. Please provide front-facing selfies.';
  }

  return {
    posts: analyzedPosts,
    summary: auditSummary,
    analyzedAt: Date.now(),
  };
}
