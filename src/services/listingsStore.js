// Unified Listings Store for Lumina Realty
// Provides localStorage-based persistence for prototype property listings,
// maintaining separate website listing IDs and sequential on-chain blockchainPropertyIds.

const STORAGE_KEY = 'lumina_realty_listings';
const EVENT_NAME = 'lumina:listings_updated';

const DEFAULT_LISTINGS = [
  {
    id: '1',
    blockchainPropertyId: '1',
    blockchainTxHash: '0x569F33bcd31Aec0eC4c5335A6393E87B3E65b7E5',
    name: 'The Lumina Heights',
    price: '₹2,85,00,000',
    numericPrice: 28500000,
    city: 'Hyderabad',
    location: 'Plot 12, Financial District, Hyderabad',
    type: 'villa',
    bedrooms: 4,
    bathrooms: 3.5,
    sqft: '2,100',
    yearBuilt: '2023',
    description: 'An architectural landmark featuring brutalist volumes, seamless spatial transitions, and high-specification natural stone finishes overlooking the Hyderabad skyline.',
    src: '/brutalist_exterior.png',
    status: 'Exclusive',
    views: '18.4k',
    propertyRef: 'MUM-001',
    initialOwner: '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793',
    documentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    publishedAt: '2026-03-01T10:00:00.000Z',
    badge: 'Blockchain registered',
  },
  {
    id: '2',
    blockchainPropertyId: null,
    blockchainTxHash: null,
    name: 'The Obsidian Pavilion',
    price: '₹8,450,000',
    numericPrice: 8450000,
    city: 'Palm Springs',
    location: 'Desert Palisades, Palm Springs',
    type: 'estate',
    bedrooms: 4,
    bathrooms: 4,
    sqft: '3,800',
    yearBuilt: '2021',
    description: 'A dark monolithic pavilion nestled within desert boulders, framing panoramic mountain vistas with minimalist glass curtains.',
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
    status: 'Exclusive',
    views: '8.2k',
    propertyRef: 'PSP-101',
    publishedAt: '2026-03-05T12:00:00.000Z',
    badge: 'Off-chain',
  },
  {
    id: '3',
    blockchainPropertyId: null,
    blockchainTxHash: null,
    name: 'The Glass Pavilion',
    price: '₹2,890,000',
    numericPrice: 2890000,
    city: 'Joshua Tree',
    location: 'The Glass Pavilion, Joshua Tree',
    type: 'villa',
    bedrooms: 3,
    bathrooms: 2,
    sqft: '2,400',
    yearBuilt: '2022',
    description: 'Seamless glass architecture submerged in the Mojave wilderness, crafted with raw concrete columns and custom timber cabinetry.',
    src: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
    status: 'Exclusive',
    views: '11.1k',
    propertyRef: 'JTR-204',
    publishedAt: '2026-03-08T09:30:00.000Z',
    badge: 'Off-chain',
  },
  {
    id: '4',
    blockchainPropertyId: null,
    blockchainTxHash: null,
    name: '88 Brutalist Row',
    price: '₹6,100,000',
    numericPrice: 6100000,
    city: 'Greenwich',
    location: '88 Brutalist Row, Greenwich CT',
    type: 'estate',
    bedrooms: 5,
    bathrooms: 5.5,
    sqft: '5,200',
    yearBuilt: '2020',
    description: 'High-end luxury residence cast in bush-hammered concrete, textured black granite, and European white oak.',
    src: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    status: 'Sold',
    views: '14.2k',
    propertyRef: 'GRW-088',
    publishedAt: '2026-03-10T14:15:00.000Z',
    badge: 'Off-chain',
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

export function getListings() {
  const storage = getStorage();
  if (!storage) return DEFAULT_LISTINGS;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LISTINGS));
      return DEFAULT_LISTINGS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LISTINGS));
      return DEFAULT_LISTINGS;
    }
    return parsed;
  } catch (err) {
    console.error('[listingsStore] Error reading from localStorage:', err);
    return DEFAULT_LISTINGS;
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

export function saveListing(listingData) {
  const storage = getStorage();
  const current = getListings();
  const newId = listingData.id || `LUM-${Date.now().toString().slice(-4)}`;
  
  const newListing = {
    ...listingData,
    id: newId,
    publishedAt: listingData.publishedAt || new Date().toISOString(),
    views: listingData.views || '1',
    status: listingData.status || 'Exclusive',
  };

  const updated = [newListing, ...current.filter((item) => String(item.id) !== String(newId))];
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  console.log('[listingsStore] Saved listing:', newListing);
  return newListing;
}

export function updateListing(id, updates) {
  const storage = getStorage();
  const current = getListings();
  const updated = current.map((item) => {
    if (String(item.id) === String(id)) {
      return { ...item, ...updates };
    }
    return item;
  });
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id) === String(id));
}

export function markListingAsSold(id) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;
  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      return { ...item, status: 'Sold', soldAt: new Date().toISOString() };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Listing with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
}

export function relistListing(id) {
  const storage = getStorage();
  const current = getListings();
  const targetId = String(id).trim().toLowerCase();
  let found = false;
  const updated = current.map((item) => {
    if (String(item.id).toLowerCase() === targetId) {
      found = true;
      return { ...item, status: 'Exclusive', relistedAt: new Date().toISOString() };
    }
    return item;
  });

  if (!found) {
    throw new Error(`Listing with ID "${id}" was not found.`);
  }

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  notifySubscribers();
  return updated.find((item) => String(item.id).toLowerCase() === targetId);
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
      toAdd.push({
        ...prop,
        isDemo: true,
        badge: prop.blockchainPropertyId ? 'Blockchain registered' : 'Off-chain'
      });
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
  // Ensure we keep at least DEFAULT_LISTINGS if all were demo
  const final = preserved.length > 0 ? preserved : DEFAULT_LISTINGS;
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

