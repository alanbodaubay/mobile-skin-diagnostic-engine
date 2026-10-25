import { runSkinDiagnostics } from './aiModelService';
import { getForeoRecommendation } from './foreoCatalog';

/**
 * Universal Image Analysis Engine
 * Takes any image (HTMLImageElement, File, or DataURL) and runs the full
 * MediaPipe FaceMesh + ROI Extraction + Gray World Normalizer + TensorFlow.js Edge-AI pipeline.
 * Designed to process single photos as well as sequential Instagram batches.
 */

/**
 * Helper to load an image source (URL or base64) into an HTMLImageElement
 */
export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image from source: ${err}`));
    img.src = src;
  });
}

/**
 * Analyzes a single image element using MediaPipe FaceMesh and on-device TensorFlow.js.
 * @param {HTMLImageElement} img - The loaded image
 * @param {Object} faceMesh - The initialized MediaPipe FaceMesh instance
 * @returns {Promise<Object>} The diagnostic result
 */
export async function analyzeImage(img, faceMesh) {
  if (!faceMesh) {
    throw new Error('MediaPipe FaceMesh is not initialized.');
  }

  // Promise that resolves when MediaPipe fires onResults for this specific image
  return new Promise((resolve) => {
    const resultsHandler = async (results) => {
      // Restore default or clean up handler
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        resolve({
          hasFace: false,
          reason: 'No human face detected (lifestyle photo, scenery, or obscured angles).',
        });
        return;
      }

      try {
        const landmarks = results.multiFaceLandmarks[0];
        const nw = img.naturalWidth || img.width || 640;
        const nh = img.naturalHeight || img.height || 480;
        const boxSize = Math.max(32, Math.floor(Math.min(nw, nh) * 0.15));

        const cropPoint = (pointIndex) => {
          const pt = landmarks[pointIndex];
          const cx = pt.x * nw;
          const cy = pt.y * nh;

          const size = Math.min(boxSize, nw, nh);
          const sx = Math.max(0, Math.min(Math.floor(cx - size / 2), nw - size));
          const sy = Math.max(0, Math.min(Math.floor(cy - size / 2), nh - size));

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = size;
          tempCanvas.height = size;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

          const imageData = ctx.getImageData(0, 0, size, size);
          return {
            src: tempCanvas.toDataURL('image/jpeg'),
            pixels: imageData.data,
            width: size,
            height: size,
          };
        };

        const rawRois = {
          Forehead: cropPoint(151),
          LeftCheek: cropPoint(205),
          RightCheek: cropPoint(425),
          Chin: cropPoint(152),
        };

        // Gray World Auto White-Balance Normalization
        const normalizeRegion = (region) => {
          let totalR = 0, totalG = 0, totalB = 0, count = 0;
          const px = region.pixels;
          for (let i = 0; i < px.length; i += 4) {
            totalR += px[i];
            totalG += px[i + 1];
            totalB += px[i + 2];
            count++;
          }
          const avgR = totalR / (count || 1);
          const avgG = totalG / (count || 1);
          const avgB = totalB / (count || 1);
          const avgGray = (avgR + avgG + avgB) / 3;

          const scaleR = avgGray / (avgR || 1);
          const scaleG = avgGray / (avgG || 1);
          const scaleB = avgGray / (avgB || 1);

          const newPixels = new Uint8ClampedArray(px.length);
          for (let i = 0; i < px.length; i += 4) {
            newPixels[i] = Math.min(255, px[i] * scaleR);
            newPixels[i + 1] = Math.min(255, px[i + 1] * scaleG);
            newPixels[i + 2] = Math.min(255, px[i + 2] * scaleB);
            newPixels[i + 3] = px[i + 3];
          }
          return { ...region, pixels: newPixels };
        };

        const normalizedRois = {
          Forehead: normalizeRegion(rawRois.Forehead),
          LeftCheek: normalizeRegion(rawRois.LeftCheek),
          RightCheek: normalizeRegion(rawRois.RightCheek),
          Chin: normalizeRegion(rawRois.Chin),
        };

        // Run On-Device TensorFlow.js ML Diagnostics
        const diagnostics = await runSkinDiagnostics(normalizedRois);

        // Run Offline FOREO Recommendation Engine
        const recommendation = getForeoRecommendation(
          diagnostics.metrics,
          diagnostics.skinType,
          diagnostics.detectedConcerns
        );

        resolve({
          hasFace: true,
          landmarks,
          rois: {
            Forehead: rawRois.Forehead.src,
            LeftCheek: rawRois.LeftCheek.src,
            RightCheek: rawRois.RightCheek.src,
            Chin: rawRois.Chin.src,
          },
          metrics: diagnostics.metrics,
          skinType: diagnostics.skinType,
          detectedConcerns: diagnostics.detectedConcerns,
          recommendation,
          confidence: diagnostics.confidence,
        });
      } catch (err) {
        console.error('[Engine] Error diagnosing face image:', err);
        resolve({
          hasFace: false,
          reason: `Processing error: ${err.message}`,
        });
      }
    };

    faceMesh.onResults(resultsHandler);
    faceMesh.send({ image: img }).catch((err) => {
      resolve({
        hasFace: false,
        reason: `MediaPipe send error: ${err.message}`,
      });
    });
  });
}
