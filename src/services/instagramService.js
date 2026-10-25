import { loadImageElement, analyzeImage } from './imageAnalysisEngine';

/**
 * Instagram Skin Diagnostics & Social Audit Service
 * Built specifically for Frank & Linda's requirement to inspect client Instagram photos with consent.
 * 100% on-device processing via MediaPipe FaceMesh & TensorFlow.js.
 */

/**
 * Curated Demo Instagram Feed
 * Contains authentic chronological posts with dates, captions, and images to demonstrate:
 * 1. Facial progress over time (baseline -> improvement).
 * 2. Intelligent filtering of non-face photos (scenery/coffee).
 */
export const DEMO_INSTAGRAM_POSTS = [
  {
    id: 'post_1',
    date: 'Oct 02, 2026',
    relativeTime: '4 weeks ago',
    caption: 'Long travel week and feeling dehydrated! ✈️ Need to reset my skincare routine.',
    imageSrc: '/sample_face.png',
    likes: 142,
    comments: 18,
    status: 'pending', // pending, analyzing, completed, skipped
  },
  {
    id: 'post_2',
    date: 'Oct 07, 2026',
    relativeTime: '3.5 weeks ago',
    caption: 'Morning matcha latte before work 🍵 Healthy gut, healthy glow!',
    imageSrc: '/sample_scenery.png', // Non-face photo to showcase face detection filter
    likes: 210,
    comments: 24,
    status: 'pending',
  },
  {
    id: 'post_3',
    date: 'Oct 12, 2026',
    relativeTime: '3 weeks ago',
    caption: 'Started the FOREO ESPADA blue LED treatment for cheek redness. Feeling calmer already! 💙',
    imageSrc: '/sample_face_2.jpg',
    likes: 318,
    comments: 42,
    status: 'pending',
  },
  {
    id: 'post_4',
    date: 'Oct 17, 2026',
    relativeTime: '2 weeks ago',
    caption: 'Skincare cabinet shelfie! Consistency is everything ✨',
    imageSrc: '/sample_scenery.png', // Non-face lifestyle shot
    likes: 185,
    comments: 15,
    status: 'pending',
  },
  {
    id: 'post_5',
    date: 'Oct 21, 2026',
    relativeTime: '1 week ago',
    caption: 'Mid-month check-in: skin barrier feels so much smoother and less congested.',
    imageSrc: '/sample_face.png',
    likes: 275,
    comments: 31,
    status: 'pending',
  },
  {
    id: 'post_6',
    date: 'Oct 25, 2026',
    relativeTime: 'Just now',
    caption: 'Sunday glow! Clear, balanced, and confident without heavy makeup 🥰',
    imageSrc: '/sample_face_2.jpg',
    likes: 412,
    comments: 53,
    status: 'pending',
  },
];

/**
 * Converts user-uploaded files into Instagram post objects
 */
export function createPostsFromFiles(files) {
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
      caption: `Client photo upload #${i + 1}`,
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
 * @param {Array} posts - Array of post objects
 * @param {Object} faceMesh - MediaPipe FaceMesh instance
 * @param {Function} onProgress - Progress callback (postIndex, total, currentResult)
 * @returns {Promise<Object>} The comprehensive social audit report
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
