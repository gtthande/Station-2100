import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        if (!line || line.trim().startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (!(key in process.env)) process.env[key] = value;
      }
      break;
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchAll(table, columns) {
  const pageSize = 1000;
  let from = 0;
  const out = [];
  for (;;) {
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from(table)
      .select(columns, { count: 'exact' })
      .range(from, to);
    if (error) throw error;
    if (data && data.length) out.push(...data);
    from += pageSize;
    if (!data || data.length < pageSize) break;
    if (count != null && out.length >= count) break;
  }
  return out;
}

function summarizeDuplicatesByKey(rows, keyGetter) {
  const map = new Map();
  for (const row of rows) {
    const key = keyGetter(row);
    if (!map.has(key)) map.set(key, 0);
    map.set(key, map.get(key) + 1);
  }
  return [...map.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
}

(async () => {
  try {
    // Load minimal product data for orphan check
    const products = await fetchAll('inventory_products', 'id');
    const productIds = new Set(products.map(p => p.id));

    // Load batches
    const batches = await fetchAll('inventory_batches', 'id, product_id, batch_number');

    // Duplicates across entire system by batch_number
    const dupByBatchNumber = summarizeDuplicatesByKey(batches, r => r.batch_number ?? '');

    // Duplicates per product + batch_number
    const dupByProductBatch = summarizeDuplicatesByKey(
      batches,
      r => `${r.product_id ?? 'NULL'}|${r.batch_number ?? ''}`
    );

    // Orphans (no parent product)
    const orphans = batches.filter(b => !b.product_id || !productIds.has(b.product_id));

    const result = {
      totals: {
        products: products.length,
        batches: batches.length
      },
      duplicates: {
        by_batch_number: dupByBatchNumber.map(([k, c]) => ({ batch_number: k, count: c })),
        by_product_and_batch: dupByProductBatch.map(([k, c]) => {
          const [product_id, batch_number] = k.split('|');
          return { product_id: product_id === 'NULL' ? null : product_id, batch_number, count: c };
        })
      },
      orphans: orphans.slice(0, 200), // cap output
      orphans_count: orphans.length
    };

    // Pretty print concise summary
    console.log('=== Batch Integrity Check ===');
    console.log(`Products: ${result.totals.products}`);
    console.log(`Batches: ${result.totals.batches}`);

    console.log(`Duplicate batch_numbers: ${result.duplicates.by_batch_number.length}`);
    if (result.duplicates.by_batch_number.length) {
      for (const row of result.duplicates.by_batch_number.slice(0, 50)) {
        console.log(`  batch_number='${row.batch_number}' -> ${row.count}`);
      }
      if (result.duplicates.by_batch_number.length > 50) console.log('  ...');
    }

    console.log(`Duplicate per product+batch: ${result.duplicates.by_product_and_batch.length}`);
    if (result.duplicates.by_product_and_batch.length) {
      for (const row of result.duplicates.by_product_and_batch.slice(0, 50)) {
        console.log(`  product_id=${row.product_id ?? 'NULL'}, batch_number='${row.batch_number}' -> ${row.count}`);
      }
      if (result.duplicates.by_product_and_batch.length > 50) console.log('  ...');
    }

    console.log(`Orphan batches (no parent product): ${result.orphans_count}`);
    if (result.orphans_count) {
      for (const b of result.orphans.slice(0, 50)) {
        console.log(`  batch id=${b.id}, product_id=${b.product_id ?? 'NULL'}, batch_number='${b.batch_number ?? ''}'`);
      }
      if (result.orphans_count > 50) console.log('  ...');
    }

    // Exit non-zero if problems found
    if (result.duplicates.by_batch_number.length || result.duplicates.by_product_and_batch.length || result.orphans_count) {
      process.exitCode = 2;
    } else {
      console.log('No duplicates or orphan batches found.');
    }
  } catch (e) {
    console.error('Check failed:', e.message || e);
    process.exit(1);
  }
})();

