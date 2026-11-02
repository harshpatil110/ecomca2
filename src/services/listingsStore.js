// Unified Property Registry Store for Blockchain-Based Digital Property Registry
// Maintains separate website property registry IDs and sequential on-chain blockchainPropertyIds.
// Blockchain registration is mandatory. Off-chain records are flagged as "Unregistered — Blockchain Registration Required".

const STORAGE_KEY = 'lumina_realty_listings';
const EVENT_NAME = 'lumina:listings_updated';

export const UNREGISTERED_STATUS = 'Unregistered — Blockchain Registration Required';

const DEFAULT_LISTINGS = [
  {
    id: '1',
    blockchainPropertyId: '1',
    blockchainTxHash: '0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5',
    name: 'The Lumina Heights',
    city: 'Hyderabad',
    location: 'Plot 12, Financial District, Hyderabad',
    surveyNumber: 'SY-12/A',
    type: 'villa',
    area: '2,100 sq ft',
    bedrooms: 4,
    bathrooms: 3.5,
    yearBuilt: '2023',
    description: 'An architectural landmark featuring brutalist volumes, seamless spatial transitions, and high-specification natural stone finishes overlooking the Hyderabad skyline.',
    src: '/brutalist_exterior.png',
    status: 'Registered',
    registryStatus: 'Registered',
    propertyRef: 'MUM-001',
    initialOwner: '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793',
    ownerName: 'Registry Admin',
    ownerWallet: '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793',
    documentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    publishedAt: '2026-03-01T10:00:00.000Z',
    badge: 'Blockchain Registered',
    ownershipHistory: [
      { owner: '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793', date: '2026-03-01T10:00:00.000Z', type: 'Initial Registration' },
    ],
  },
  {
    id: '2',
    blockchainPropertyId: null,
    blockchainTxHash: null,
    name: 'The Obsidian Pavilion',
    city: 'Pune',
    location: 'Survey No. 45, Baner Road, Pune',
    surveyNumber: 'SY-45/B',
    type: 'estate',
    area: '3,800 sq ft',
    bedrooms: 4,
    bathrooms: 4,
    yearBuilt: '2021',
    description: 'A dark monolithic pavilion with panoramic mountain vistas framed by minimalist glass curtains and raw concrete volumes.',
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
    status: 'Unregistered',
    registryStatus: UNREGISTERED_STATUS,
    propertyRef: 'PUN-101',
    ownerName: 'Rajesh Kumar',
    ownerWallet: null,
    initialOwner: null,
    documentHash: null,
    publishedAt: '2026-03-05T12:00:00.000Z',
    badge: 'Unregistered',
    ownershipHistory: [
      { owner: 'Rajesh Kumar', date: '2026-03-05T12:00:00.000Z', type: 'Draft Record' },
    ],
  },
  {
    id: '3',
    blockchainPropertyId: null,
    blockchainTxHash: null,
    name: 'The Glass Pavilion',
    city: 'Bengaluru',
    location: 'Whitefield Layout, Bengaluru',
    surveyNumber: 'SY-204/C',
    type: 'villa',
    area: '2,400 sq ft',
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: '2022',
    description: 'Seamless glass architecture integrated with the landscape, crafted with raw concrete columns and custom timber joinery.',
    src: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
    status: 'Unregistered',
    registryStatus: UNREGISTERED_STATUS,
    propertyRef: 'BLR-204',
    ownerName: 'Priya Sharma',
    ownerWallet: null,
    initialOwner: null,
    documentHash: null,
    publishedAt: '2026-03-08T09:30:00.000Z',
    badge: 'Unregistered',
    ownershipHistory: [
      { owner: 'Priya Sharma', date: '2026-03-08T09:30:00.000Z', type: 'Draft Record' },
    ],
  },
  {
    id: '4',
    blockchainPropertyId: null,
    blockchainTxHash: null,
    name: '88 Brutalist Row',
    city: 'Mumbai',
    location: '88 Brutalist Row, Bandra West, Mumbai',
    surveyNumber: 'SY-088/D',
    type: 'estate',
    area: '5,200 sq ft',
    bedrooms: 5,
    bathrooms: 5.5,
    yearBuilt: '2020',
    description: 'High-specification luxury residence cast in bush-hammered concrete, textured black granite, and European white oak.',
    src: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    status: 'Unregistered',
    registryStatus: UNREGISTERED_STATUS,
    propertyRef: 'MUM-088',
    ownerName: 'Arjun Patel',
    ownerWallet: null,
    initialOwner: null,
    documentHash: null,
    publishedAt: '2026-03-10T14:15:00.000Z',
    badge: 'Unregistered',
    ownershipHistory: [
      { owner: 'Arjun Patel', date: '2026-03-10T14:15:00.000Z', type: 'Draft Record' },
    ],
  },
];

function notifySubscribers() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

// Clean and sanitize any record loaded from storage
function sanitizeRecord(item) {
  const isChain = Boolean(item.blockchainPropertyId);
  const pendingTransferRequest = item.pendingTransferRequest || null;
  if (!isChain) {
    return {
      ...item,
      status: 'Unregistered',
      registryStatus: UNREGISTERED_STATUS,
      badge: 'Unregistered',
      blockchainPropertyId: null,
      blockchainTxHash: null,
      pendingTransferRequest,
    };
  }
  return {
    ...item,
    status: item.status || 'Registered',
    registryStatus: item.registryStatus || item.status || 'Registered',
    badge: 'Blockchain Registered',
    pendingTransferRequest,
  };
}

export function getListings() {
  const storage = getStorage();
  if (!storage) return DEFAULT_LISTINGS.map(sanitizeRecord);
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      const sanitized = DEFAULT_LISTINGS.map(sanitizeRecord);
      storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return sanitized;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const sanitized = DEFAULT_LISTINGS.map(sanitizeRecord);
      storage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      return sanitized;
    }
    // Sanitize records to ensure off-chain records are clearly marked unregistered
    return parsed.map(sanitizeRecord);
  } catch (err) {
    console.error('[listingsStore] Error reading from localStorage:', err);
    return DEFAULT_LISTINGS.map(sanitizeRecord);
  }
}

export function getListingById(id) {
  const all = getListings();
  const searchStr = String(id || '').trim().toLowerCase();
  // 1. Primary check: match exact website listing ID
  const matchByWebsiteId = all.find((item) => String(item.id).toLowerCase() === searchStr);
  if (matchByWebsiteId) return matchByWebsiteId;

  // 2. Secondary fallback: check on-chain blockchainPropertyId
  return all.find(
    (item) => item.blockchainPropertyId && String(item.blockchainPropertyId).toLowerCase() === searchStr
  ) || null;
}

export const getRecordById = getListingById;

export function saveListing(listingData) {
  const storage = getStorage();
  const current = getListings();
  const newId = listingData.id || `REG-${Date.now().toString().slice(-6)}`;
  
  const isChain = Boolean(listingData.blockchainPropertyId);

  const newRecord = {
    ...listingData,
    id: newId,
    publishedAt: listingData.publishedAt || new Date().toISOString(),
    status: isChain ? (listingData.status || 'Registered') : 'Unregistered',
    registryStatus: isChain ? (listingData.registryStatus || 'Registered') : UNREGISTERED_STATUS,
    badge: isChain ? 'Blockchain Registered' : 'Unregistered',
  };

  const updated = [newRecord, ...current.filter((item) => String(item.id) !== String(newId))];
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  console.log('[listingsStore] Saved registry record:', newRecord);
  return newRecord;
}

export const saveRecord = saveListing;

export function updateListing(id, updates) {
  const storage = getStorage();
  const current = getListings();
  const updated = current.map((item) => {
    if (String(item.id) === String(id)) {
      return sanitizeRecord({ ...item, ...updates });
    }
    return item;
  });
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id) === String(id));
}

export const updateRecord = updateListing;

// Links a previously unregistered website record to its confirmed on-chain blockchainPropertyId
export function linkBlockchainRegistration(id, blockchainPropertyId, txHash, additionalUpdates = {}) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;

  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      return {
        ...item,
        ...additionalUpdates,
        blockchainPropertyId: String(blockchainPropertyId),
        blockchainTxHash: txHash || item.blockchainTxHash,
        status: 'Registered',
        registryStatus: 'Registered',
        badge: 'Blockchain Registered',
        registeredAt: new Date().toISOString(),
      };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Registry record with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
}

export function updateRegistryStatus(id, newStatus, reason) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;
  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      return {
        ...item,
        status: newStatus,
        registryStatus: newStatus,
        statusReason: reason || '',
        statusUpdatedAt: new Date().toISOString(),
      };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Registry record with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
}

export function transferOwnership(id, newOwnerName, newOwnerWallet, txHash = null) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;
  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      const history = Array.isArray(item.ownershipHistory) ? [...item.ownershipHistory] : [];
      history.push({
        owner: newOwnerName || newOwnerWallet || 'Transferred Owner',
        wallet: newOwnerWallet || null,
        txHash: txHash || null,
        date: new Date().toISOString(),
        type: txHash ? 'Blockchain Ownership Transfer' : 'Ownership Transferred',
      });
      return {
        ...item,
        ownerName: newOwnerName || item.ownerName,
        ownerWallet: newOwnerWallet || item.ownerWallet,
        ownershipHistory: history,
        lastTransferAt: new Date().toISOString(),
        lastTransferTxHash: txHash || item.lastTransferTxHash,
        pendingTransferRequest: null,
      };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Registry record with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
}

export function createTransferRequest(id, { proposedOwnerName, proposedOwnerWallet, notes = '', initiatedBy = 'Administrator' }) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;

  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      const req = {
        requestId: `REQ-${Date.now().toString(36).toUpperCase()}`,
        propertyId: String(item.id),
        blockchainPropertyId: item.blockchainPropertyId ? String(item.blockchainPropertyId) : null,
        currentOwnerName: item.ownerName || 'Current Owner',
        currentOwnerWallet: item.ownerWallet || null,
        proposedOwnerName: proposedOwnerName.trim(),
        proposedOwnerWallet: proposedOwnerWallet.trim(),
        notes: notes ? notes.trim() : '',
        initiatedBy,
        initiatedAt: new Date().toISOString(),
        status: 'PENDING_OWNER_AUTHORIZATION',
      };
      return {
        ...item,
        pendingTransferRequest: req,
      };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Registry record with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
}

export function cancelTransferRequest(id) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;

  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      return {
        ...item,
        pendingTransferRequest: null,
      };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Registry record with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
}

export function getPendingTransferRequests() {
  return getListings().filter(
    (item) => item.pendingTransferRequest && item.pendingTransferRequest.status === 'PENDING_OWNER_AUTHORIZATION'
  );
}

export function importDemoProperties(properties, { dryRun = false } = {}) {
  const storage = getStorage();
  const current = getListings();
  const existingIds = new Set(current.map((p) => String(p.id).toLowerCase()));
  const existingRefs = new Set(
    current.filter((p) => p.propertyRef).map((p) => String(p.propertyRef).toLowerCase())
  );

  const toAdd = [];
  let duplicateCount = 0;

  for (const prop of properties) {
    const idKey = String(prop.id).toLowerCase();
    const refKey = prop.propertyRef ? String(prop.propertyRef).toLowerCase() : null;

    if (existingIds.has(idKey) || (refKey && existingRefs.has(refKey))) {
      duplicateCount++;
    } else {
      toAdd.push(sanitizeRecord({
        ...prop,
        isDemo: true,
        blockchainPropertyId: prop.blockchainPropertyId || null,
      }));
    }
  }

  const report = {
    totalCandidate: properties.length,
    willCreate: toAdd.length,
    duplicatesSkipped: duplicateCount,
    currentTotal: current.length,
    projectedTotal: current.length + toAdd.length,
    dryRun,
  };

  if (!dryRun && toAdd.length > 0 && storage) {
    const updated = [...current, ...toAdd];
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(updated));
      notifySubscribers();
    } catch (err) {
      console.error('[listingsStore] Failed saving imported demo listings to localStorage:', err);
      throw new Error(`Storage quota exceeded or storage unavailable: ${err.message}`);
    }
  }

  return report;
}

export function clearDemoProperties() {
  const storage = getStorage();
  const current = getListings();
  const preserved = current.filter((p) => !p.isDemo && p.id !== 'DEMO-' && !String(p.id).startsWith('DEMO-'));
  const final = preserved.length > 0 ? preserved : DEFAULT_LISTINGS.map(sanitizeRecord);
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(final));
  }
  notifySubscribers();
  return { removed: current.length - preserved.length, remaining: final.length };
}

export function subscribeToListings(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getListings());
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
