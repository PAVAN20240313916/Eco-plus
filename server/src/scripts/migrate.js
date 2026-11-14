import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { getDemoSeedData, normalizeSupabaseUrl } from '../config/db.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_FILE = path.resolve(__dirname, '../../../supabase/migrations/001_initial_schema.sql');
const LOCAL_DB_FILE = path.resolve(__dirname, '../../data/db.json');

const SUPABASE_POOLER_REGIONS = [
  'ap-south-1',
  'ap-southeast-1',
  'us-east-1',
  'us-west-1',
  'eu-central-1'
];

function getSSLConfig(connectionString) {
  if (!connectionString) return false;
  if (
    connectionString.includes('supabase.co') ||
    connectionString.includes('supabase.com') ||
    connectionString.includes('sslmode=require')
  ) {
    return { rejectUnauthorized: false };
  }
  return false;
}

function extractProjectRef(supabaseUrl) {
  const match = supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : null;
}

function extractPasswordFromUrl(dbUrl) {
  if (!dbUrl) return null;
  try {
    const parsed = new URL(dbUrl);
    return parsed.password || null;
  } catch {
    return null;
  }
}

async function runPgMigration(connectionString, sql, label = 'DATABASE_URL') {
  console.log(`🔌 [Migrate] Testing PostgreSQL connection via ${label}...`);
  const pool = new Pool({
    connectionString,
    ssl: getSSLConfig(connectionString),
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query('SELECT NOW() AS server_time');
    console.log(`✅ [Migrate] Connected to PostgreSQL (${res.rows[0].server_time})`);
    console.log('🚀 [Migrate] Applying 001_initial_schema.sql (tables, RLS policies, indexes, and seed data)...');
    await pool.query(sql);
    console.log('✅ [Migrate] PostgreSQL migration & seed completed successfully.');
    return true;
  } finally {
    await pool.end().catch(() => {});
  }
}

async function trySupabasePoolerCandidates(supabaseUrl, databaseUrl, sql) {
  const ref = extractProjectRef(supabaseUrl);
  const encodedPassword = extractPasswordFromUrl(databaseUrl);
  if (!ref || !encodedPassword) return false;

  const candidates = [
    {
      label: `db.${ref}.supabase.co:5432`,
      uri: `postgresql://postgres:${encodedPassword}@db.${ref}.supabase.co:5432/postgres?sslmode=require`
    },
    ...SUPABASE_POOLER_REGIONS.map((region) => ({
      label: `aws-0-${region}.pooler.supabase.com:5432`,
      uri: `postgresql://postgres.${ref}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`
    }))
  ];

  for (const candidate of candidates) {
    try {
      const ok = await runPgMigration(candidate.uri, sql, candidate.label);
      if (ok) return true;
    } catch (err) {
      console.log(`ℹ️ [Migrate] ${candidate.label} failed: ${err.message}`);
    }
  }

  return false;
}

async function tryServiceRoleDDL(supabaseUrl, serviceRoleKey, supabase, sql) {
  // Attempt 1: Supabase RPC public.exec_sql (if installed in target DB)
  try {
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (!rpcError) {
      console.log('✅ [Migrate] Applied DDL via Supabase RPC public.exec_sql.');
      return true;
    }
    console.log(`ℹ️ [Migrate] RPC exec_sql unavailable (${rpcError.message}); checking Postgres Meta endpoint...`);
  } catch (err) {
    console.log(`ℹ️ [Migrate] RPC exec_sql skipped (${err.message})`);
  }

  // Attempt 2: Supabase Postgres Meta endpoint (/pg/query) with Service Role Key
  try {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const response = await fetch(`${cleanUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ [Migrate] Applied DDL via Supabase /pg/query endpoint.');
      return true;
    }
    const text = await response.text().catch(() => '');
    console.log(`ℹ️ [Migrate] /pg/query returned HTTP ${response.status}: ${text.slice(0, 120)}`);
  } catch (err) {
    console.log(`ℹ️ [Migrate] /pg/query skipped (${err.message})`);
  }

  return false;
}

async function seedViaSupabaseClient(supabase) {
  let payload = null;
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const localData = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
      if (localData?.organizations?.length > 0) {
        payload = localData;
        console.log('📦 [Migrate] Loaded local records from server/data/db.json for synchronization.');
      }
    } catch (err) {
      console.warn('⚠️ [Migrate] Could not parse local db.json, falling back to default seed data:', err.message);
    }
  }

  if (!payload) {
    payload = await getDemoSeedData();
  }

  // Check if demo org already has inventory rows seeded by SQL to avoid duplicating random-UUID local rows
  const demoOrgId = '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32';
  const { data: existingDemoInv } = await supabase
    .from('inventory')
    .select('id')
    .eq('organization_id', demoOrgId)
    .limit(1);

  const demoAlreadySeeded = (existingDemoInv || []).length > 0;
  const filterRows = (rows) =>
    demoAlreadySeeded ? (rows || []).filter((r) => r.organization_id !== demoOrgId) : (rows || []);

  const tables = [
    { name: 'organizations', rows: payload.organizations || [], conflict: 'id' },
    { name: 'inventory', rows: filterRows(payload.inventory), conflict: 'id' },
    { name: 'waste_logs', rows: filterRows(payload.waste_logs), conflict: 'id' },
    { name: 'ai_insights', rows: filterRows(payload.ai_insights), conflict: 'id' },
    { name: 'surplus_listings', rows: filterRows(payload.surplus_listings), conflict: 'id' }
  ];

  for (const table of tables) {
    if (table.rows.length === 0) {
      console.log(`ℹ️ [Migrate] public.${table.name} already populated (0 new rows to sync).`);
      continue;
    }
    const { error } = await supabase
      .from(table.name)
      .upsert(table.rows, { onConflict: table.conflict, ignoreDuplicates: true });

    if (error) {
      throw new Error(`Failed to upsert ${table.name}: ${error.message}`);
    }
    console.log(`✅ [Migrate] Synced ${table.rows.length} row(s) into public.${table.name}`);
  }
}

async function migrate() {
  console.log('==============================================================');
  console.log(' EcoPulse AI — Supabase Cloud Migration & Seed Runner');
  console.log('==============================================================');

  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ [Migrate] Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  console.log(`📄 [Migrate] Loaded migration: ${MIGRATION_FILE} (${sql.length} bytes)`);

  const databaseUrl = process.env.DATABASE_URL?.trim();
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let ddlApplied = false;

  // Step 1: Direct PostgreSQL / Supabase Session Pooler DDL execution
  if (databaseUrl && !databaseUrl.includes('ecopulse_dummy')) {
    try {
      ddlApplied = await runPgMigration(databaseUrl, sql, 'DATABASE_URL');
    } catch (err) {
      console.warn(`⚠️ [Migrate] DATABASE_URL connection failed (${err.message})`);
      if (databaseUrl.includes('localhost') && supabaseUrl) {
        console.log('🔎 [Migrate] Attempting Supabase direct/pooler hosts using extracted password...');
        ddlApplied = await trySupabasePoolerCandidates(supabaseUrl, databaseUrl, sql);
      }
    }
  } else {
    console.log('ℹ️ [Migrate] No valid DATABASE_URL configured; skipping direct pg.Pool DDL.');
  }

  // Step 2: Supabase Service Role Client DDL & Seed Synchronization
  if (supabaseUrl && serviceRoleKey) {
    console.log(`🔐 [Migrate] Initializing Supabase admin client for ${supabaseUrl}...`);
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (!ddlApplied) {
      ddlApplied = await tryServiceRoleDDL(supabaseUrl, serviceRoleKey, supabase, sql);
    }

    console.log('🔍 [Migrate] Verifying table readiness via Supabase Service Role...');
    const { error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (checkError) {
      console.warn(`⚠️ [Migrate] Tables are not yet provisioned in Supabase (${checkError.message}).`);
      console.log('👉 Paste supabase/migrations/001_initial_schema.sql into your Supabase SQL Editor once, then re-run `npm run migrate`.');
      process.exit(1);
    }

    console.log('🌱 [Migrate] Upserting seed & local data via Service Role Key...');
    await seedViaSupabaseClient(supabase);
    console.log('🎉 [Migrate] Supabase migration & seed synchronization complete!');
    return;
  }

  if (ddlApplied) {
    console.log('🎉 [Migrate] Migration complete via PostgreSQL connection.');
    return;
  }

  console.log('--------------------------------------------------------------');
  console.log('ℹ️ [Migrate] Supabase credentials are not yet configured in server/.env.');
  console.log('   To apply 001_initial_schema.sql to Supabase Cloud:');
  console.log('   1) Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env');
  console.log('   2) Set DATABASE_URL to your Supabase Session Pooler URI (for automatic DDL)');
  console.log('      or paste supabase/migrations/001_initial_schema.sql into Supabase SQL Editor.');
  console.log('   3) Run `npm run migrate` inside ecopulse-ai/server.');
  console.log('--------------------------------------------------------------');
}

migrate().catch((err) => {
  console.error('❌ [Migrate] Unhandled migration error:', err);
  process.exit(1);
});
