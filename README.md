# Mobile Skin Diagnostic Engine

An on-device computer vision application built with React, Vite, and Google MediaPipe Face Mesh for client-side facial analysis and skin metric evaluation.

All landmark tracking, region-of-interest (ROI) cropping, and quantitative scoring execute locally within the browser runtime without sending images or biometric data to external servers.

---

## Architecture

```mermaid
flowchart LR
    A[Image Input] --> B[MediaPipe FaceMesh\n468 Landmarks]
    B --> C[Geometric ROI Cropping\nForehead, Cheeks, Chin]
    C --> D[Gray World Color Normalization]
    D --> E[Feature Quantification\nErythema, Specular Highlights, Texture]
    E --> F[Diagnostic Scoring & Product Recommendations]
```

### Pipeline Overview
1. **Landmark Detection:** Google MediaPipe Face Mesh tracks 468 3D facial coordinates to establish face alignment.
2. **Geometric ROI Cropping:** Uses the HTML5 Canvas API to extract square patches from four key facial zones:
   - Forehead (`Index 151`)
   - Left Cheek (`Index 205`)
   - Right Cheek (`Index 425`)
   - Chin (`Index 152`)
3. **Color Normalization:** Computes ambient illuminant scaling factors to neutralize color temperature bias prior to chromatic scoring.
4. **Metric Extraction:** Computes redness ratios, specular reflection (sebum), and luminance variance (texture micro-roughness).
5. **Rule-Based Recommendations:** Evaluates scores against product and skincare hardware protocols.

---

## Metrics & Formulation

### 1. Illuminant Normalization (Gray World Assumption)
Ambient light tints the skin (e.g., warm incandescent light artificially inflates redness measurements). The Gray World algorithm assumes the average scene reflection is neutral gray:
$$\text{scale}_C = \frac{\text{avgGray}}{\text{avg}_C} \quad \text{where } C \in \{R, G, B\}$$
Corrected pixel values are scaled before scoring: $C_{\text{corrected}} = \min(255, C \times \text{scale}_C)$.

### 2. Erythema / Redness Ratio
Measures red-channel concentration relative to total chromatic intensity across cropped skin regions:
$$\text{Ratio}_R = \frac{\bar{R}}{\bar{R} + \bar{G} + \bar{B}}$$
Baseline healthy skin typically falls between $0.38 - 0.42$; elevated ratios indicate localized inflammation or erythema.

### 3. Texture Micro-Roughness
Smooth skin exhibits uniform local illumination, whereas pores, blemishes, and texture irregularities create high-contrast micro-shadows:
$$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (Y_i - \bar{Y})^2}$$
where luminance $Y = 0.299R + 0.587G + 0.114B$.

---

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation
```bash
git clone https://github.com/alanbodaubay/mobile-skin-diagnostic-engine.git
cd mobile-skin-diagnostic-engine
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## Project Structure

```
mobile-skin-diagnostic-engine/
├── index.html              # HTML entry point with MediaPipe CDN scripts
├── package.json            # Project manifest and scripts
├── vite.config.js          # Vite configuration
├── src/
│   ├── App.jsx             # Landmark pipeline, ROI cropping, scoring heuristics
│   ├── main.jsx            # React root mount
│   ├── index.css           # UI styles
│   └── assets/             # Product catalog images and icons
```

---

## License

MIT License.
