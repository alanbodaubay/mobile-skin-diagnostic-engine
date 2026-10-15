/**
 * Local IndexedDB Storage for Skin Scan History & Progress Tracking
 * Fulfills Week 7 Milestone: "Local skin progress tracking and history view"
 * 100% On-Device, zero cloud dependencies, privacy-first.
 */

const DB_NAME = 'ForeoSkinDiagnosticsDB';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a completed scan record to local IndexedDB.
 */
export async function saveScanRecord(scanData) {
  const db = await openDatabase();
  const id = `scan_${Date.now()}`;
  const record = {
    id,
    timestamp: Date.now(),
    dateString: new Date().toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }),
    metrics: scanData.metrics,
    skinType: scanData.skinType,
    primaryDevice: scanData.recommendation?.primaryDevice?.name || 'FOREO Device',
    rois: scanData.rois || {},
    concerns: scanData.detectedConcerns || [],
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all saved scan records ordered from newest to oldest.
 */
export async function getAllScans() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const results = req.result || [];
      // Sort newest first
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes a specific scan record by ID.
 */
export async function deleteScanRecord(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears all scan history.
 */
export async function clearAllScans() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Extracts chronological trend metrics for longitudinal charting.
 */
export async function getScanTrends() {
  const scans = await getAllScans();
  // Oldest first for trend timeline
  const chronological = [...scans].reverse();
  return chronological.map((scan, index) => ({
    scanNumber: index + 1,
    date: scan.dateString,
    timestamp: scan.timestamp,
    redness: scan.metrics?.Redness ?? 0,
    oiliness: scan.metrics?.Oiliness ?? 0,
    texture: scan.metrics?.Texture ?? 0,
    healthScore: scan.metrics?.HealthScore ?? 0,
    primaryDevice: scan.primaryDevice,
  }));
}
