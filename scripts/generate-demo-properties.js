/**
 * scripts/generate-demo-properties.js
 *
 * Generates synthetic luxury demo properties with Indian cities/localities,
 * realistic architectural descriptions, pricing in INR, and deterministic references.
 *
 * Usage:
 *   node scripts/generate-demo-properties.js --dry-run
 *   node scripts/generate-demo-properties.js --count 1000
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { keccak256, toUtf8Bytes } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract admin address on Sepolia
export const DEFAULT_ADMIN_ADDRESS = '0x127d6da08f6617A7fdB3EEf6b8Aaa7f172D51793';

// Curated Indian locations with prestige architectural localities
const INDIAN_LOCALITIES = [
  { city: 'Mumbai', locality: 'Pali Hill, Bandra West, Mumbai', state: 'Maharashtra', prefix: 'MUM' },
  { city: 'Mumbai', locality: 'Altamount Road, South Mumbai', state: 'Maharashtra', prefix: 'MUM' },
  { city: 'Mumbai', locality: 'Worli Sea Face, Mumbai', state: 'Maharashtra', prefix: 'MUM' },
  { city: 'Mumbai', locality: 'Juhu Tara Road, Juhu, Mumbai', state: 'Maharashtra', prefix: 'MUM' },
  { city: 'Bengaluru', locality: 'Sadashivanagar, Bengaluru', state: 'Karnataka', prefix: 'BLR' },
  { city: 'Bengaluru', locality: 'Lavelle Road, Central Bengaluru', state: 'Karnataka', prefix: 'BLR' },
  { city: 'Bengaluru', locality: 'Indiranagar 100ft Road, Bengaluru', state: 'Karnataka', prefix: 'BLR' },
  { city: 'Bengaluru', locality: 'Koramangala 3rd Block, Bengaluru', state: 'Karnataka', prefix: 'BLR' },
  { city: 'New Delhi', locality: 'Golf Links, Central New Delhi', state: 'Delhi', prefix: 'DEL' },
  { city: 'New Delhi', locality: 'Jor Bagh, New Delhi', state: 'Delhi', prefix: 'DEL' },
  { city: 'New Delhi', locality: 'Sundar Nagar, New Delhi', state: 'Delhi', prefix: 'DEL' },
  { city: 'New Delhi', locality: 'Shanti Niketan, South Delhi', state: 'Delhi', prefix: 'DEL' },
  { city: 'Hyderabad', locality: 'Road No. 36, Jubilee Hills, Hyderabad', state: 'Telangana', prefix: 'HYD' },
  { city: 'Hyderabad', locality: 'Banjara Hills, Hyderabad', state: 'Telangana', prefix: 'HYD' },
  { city: 'Hyderabad', locality: 'Financial District, Nanakramguda, Hyderabad', state: 'Telangana', prefix: 'HYD' },
  { city: 'Goa', locality: 'Assagao, North Goa', state: 'Goa', prefix: 'GOA' },
  { city: 'Goa', locality: 'Aldona Riverside, North Goa', state: 'Goa', prefix: 'GOA' },
  { city: 'Goa', locality: 'Candolim Cliffside, Goa', state: 'Goa', prefix: 'GOA' },
  { city: 'Pune', locality: 'Boat Club Road, Pune', state: 'Maharashtra', prefix: 'PUN' },
  { city: 'Pune', locality: 'Koregaon Park, Lane 7, Pune', state: 'Maharashtra', prefix: 'PUN' },
  { city: 'Alibaug', locality: 'Awas Beach Road, Alibaug', state: 'Maharashtra', prefix: 'ABG' },
  { city: 'Alibaug', locality: 'Mandwa Jetty Enclave, Alibaug', state: 'Maharashtra', prefix: 'ABG' },
  { city: 'Jaipur', locality: 'Civil Lines, Jaipur', state: 'Rajasthan', prefix: 'JAI' },
  { city: 'Jaipur', locality: 'C-Scheme, Ashok Nagar, Jaipur', state: 'Rajasthan', prefix: 'JAI' },
  { city: 'Chennai', locality: 'Boat Club, RA Puram, Chennai', state: 'Tamil Nadu', prefix: 'MAA' },
  { city: 'Kolkata', locality: 'Ballygunge Circular Road, Kolkata', state: 'West Bengal', prefix: 'CCU' },
];

const ARCHITECTURAL_PREFIXES = [
  'The Monolithic', 'The Brutalist', 'The Obsidian', 'The Verandah', 'The Basalt',
  'The Cantilever', 'The Catenary', 'The Terracotta', 'The Courtyard', 'The Sundial',
  'The Travertine', 'The Ochre', 'The Horizon', 'The Linear', 'The Quadrant',
  'The Apex', 'The Atrium', 'The Lantern', 'The Pavilion', 'The Sanctuary'
];

const ARCHITECTURAL_SUFFIXES = [
  'Pavilion', 'Estate', 'Manor', 'Villa', 'Residence', 'House', 'Enclave',
  'Sanctuary', 'Domain', 'Gallery', 'Crest', 'Court', 'Haven', 'Heights'
];

const PROPERTY_TYPES = ['villa', 'estate', 'penthouse', 'residence'];

// Curated high-resolution architectural photography (unrestricted public Unsplash URLs)
const CURATED_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
];

const MATERIAL_HIGHLIGHTS = [
  'raw exposed bush-hammered concrete, textured slate, and native teak millwork',
  'fluted travertine stone, honed black basalt, and brass-framed glass curtain walls',
  'reclaimed burma teak beams, dry-stacked laterite masonry, and polished terrazzo floors',
  'board-formed reinforced architectural concrete, Italian statuario marble, and louvered oak screens',
  'hand-cut Kota stone slabs, Corten steel accents, and double-height frameless acoustic glazing'
];

/**
 * Format a number into standard Indian numbering format (e.g., 28500000 -> ₹2,85,00,000)
 */
export function formatINR(val) {
  const str = Math.round(val).toString();
  if (str.length <= 3) return `₹${str}`;
  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${formattedOther},${lastThree}`;
}

/**
 * Generate synthetic luxury property records.
 * @param {number} count Total number of records (default 1000)
 * @param {string} initialOwner Ethereum address assigned as default demo owner
 */
export function generateDemoProperties(count = 1000, initialOwner = DEFAULT_ADMIN_ADDRESS) {
  const properties = [];
  const startId = 1001; // Avoid colliding with existing IDs ('1', '2', '3', '4')

  for (let i = 0; i < count; i++) {
    const numId = startId + i;
    const websiteId = `DEMO-${String(numId).padStart(4, '0')}`;
    const seq = i + 1;
    const loc = INDIAN_LOCALITIES[i % INDIAN_LOCALITIES.length];
    const prefix = ARCHITECTURAL_PREFIXES[(i * 3 + 7) % ARCHITECTURAL_PREFIXES.length];
    const suffix = ARCHITECTURAL_SUFFIXES[(i * 5 + 11) % ARCHITECTURAL_SUFFIXES.length];
    const name = `${prefix} ${suffix} ${loc.city}`;

    // Price scaling: between ₹3.2 Cr (32,000,000) and ₹48.5 Cr (485,000,000)
    const baseMultiplier = 32000000 + ((i * 451973) % 453000000);
    const roundedPrice = Math.round(baseMultiplier / 500000) * 500000;
    const formattedPrice = formatINR(roundedPrice);

    const type = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
    const bedrooms = 3 + (i % 4); // 3, 4, 5, 6
    const bathrooms = bedrooms + (i % 2 === 0 ? 0 : 0.5);
    const sqftNumber = 2400 + ((i * 137) % 7200);
    const sqft = sqftNumber.toLocaleString('en-US');
    const yearBuilt = String(2020 + (i % 6));
    const views = `${(3.2 + ((i * 1.7) % 24.5)).toFixed(1)}k`;

    // Unique deterministic property reference
    const propertyRef = `LUM-DEMO-${String(seq).padStart(4, '0')}`;

    // Deterministic placeholder document hash (clearly marked as synthetic demo hash)
    const placeholderHash = keccak256(toUtf8Bytes(`DEMO_SYNTHETIC_DOCUMENT_PLACEHOLDER_${propertyRef}_V1`));

    const material = MATERIAL_HIGHLIGHTS[i % MATERIAL_HIGHLIGHTS.length];
    const description = `A masterwork of contemporary tropical brutalism situated in ${loc.locality}. Built with ${material}, offering seamless indoor-outdoor connectivity and curated privacy.`;

    const image = CURATED_IMAGE_URLS[i % CURATED_IMAGE_URLS.length];

    properties.push({
      id: websiteId,
      name,
      price: formattedPrice,
      numericPrice: roundedPrice,
      city: loc.city,
      location: loc.locality,
      type,
      bedrooms,
      bathrooms,
      sqft,
      yearBuilt,
      description,
      src: image,
      status: 'Exclusive',
      views,
      propertyRef,
      initialOwner,
      documentHash: placeholderHash,
      isDemo: true,
      isSyntheticDocument: true,
      badge: 'Off-chain',
      blockchainPropertyId: null,
      blockchainTxHash: null,
      publishedAt: new Date(Date.now() - (1000 - i) * 3600000).toISOString(),
    });
  }

  return properties;
}

// CLI Execution Handler
function runCli() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const countIndex = args.indexOf('--count');
  const count = countIndex !== -1 && args[countIndex + 1] ? parseInt(args[countIndex + 1], 10) : 1000;

  console.log(`\n======================================================`);
  console.log(`  Lumina Realty - Synthetic Demo Properties Generator`);
  console.log(`======================================================`);
  console.log(`Mode:            ${isDryRun ? 'DRY-RUN (Safe preview, no files written)' : 'PRODUCTION'}`);
  console.log(`Target Count:    ${count} demo properties`);
  console.log(`Admin Address:   ${DEFAULT_ADMIN_ADDRESS}`);

  const properties = generateDemoProperties(count);

  console.log(`\n[✓] Generated ${properties.length} synthetic records.`);
  console.log(`    - ID range:      ${properties[0].id} ... ${properties[properties.length - 1].id}`);
  console.log(`    - Ref range:     ${properties[0].propertyRef} ... ${properties[properties.length - 1].propertyRef}`);
  console.log(`    - Cities:        ${Array.from(new Set(properties.map(p => p.city))).join(', ')}`);
  console.log(`    - Price range:   ${properties[0].price} - ${properties[properties.length - 1].price}`);
  console.log(`    - Demo flag:     isDemo=true, isSyntheticDocument=true`);
  console.log(`    - Initial badge: Off-chain (unregistered)`);

  console.log(`\nSample Preview (Record #1):`);
  console.log(JSON.stringify(properties[0], null, 2));

  if (isDryRun) {
    console.log(`\n[INFO] Dry-run complete. 0 files modified.`);
    return;
  }

  // Write to src/data/demoProperties.json
  const dataDir = path.resolve(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const outputPath = path.join(dataDir, 'demoProperties.json');
  fs.writeFileSync(outputPath, JSON.stringify(properties, null, 2), 'utf-8');
  console.log(`\n[✓] Successfully saved ${properties.length} records to:`);
  console.log(`    ${outputPath}`);

  // Also write to public/demoProperties.json for on-demand fetch in browser
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, 'demoProperties.json');
  fs.writeFileSync(publicPath, JSON.stringify(properties, null, 2), 'utf-8');
  console.log(`[✓] Also mirrored to public directory:`);
  console.log(`    ${publicPath}`);
  console.log(`======================================================\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
