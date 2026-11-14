import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MIGRATION_SQL_FILE = path.resolve(__dirname, '../../../supabase/migrations/001_initial_schema.sql');

const { Pool } = pg;

let pool = null;
let supabaseAdmin = null;
let useFallback = false;
let fileStore = {
  organizations: [],
  inventory: [],
  waste_logs: [],
  ai_insights: [],
  surplus_listings: []
};

// Emission factors (kg CO2e per kg of food) by category
export const CATEGORY_EMISSION_FACTORS = {
  'Meat & Poultry': 12.5,
  'Dairy': 5.8,
  'Prepared Foods': 3.5,
  'Bakery': 1.8,
  'Produce': 1.2,
  'Dry Goods': 1.5,
  'Other': 2.0
};

// Seed demo data
export async function getDemoSeedData() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);
  const orgId = '7f9d8a30-1b2c-4e5f-9a0d-8e7c6b5a4f32';

  const today = new Date();
  const formatOffsetDate = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return {
    organizations: [
      {
        id: orgId,
        name: 'Annapurna Grand Kitchen & Urban Bistro, Bengaluru',
        email: 'demo@ecopulse.io',
        password_hash: passwordHash,
        business_type: 'Restaurant / Cloud Kitchen',
        created_at: new Date().toISOString()
      }
    ],
    inventory: [
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Fresh Malai Paneer',
        category: 'Dairy',
        quantity: 20.0,
        unit: 'kg',
        cost_per_unit: 380.00,
        expiration_date: formatOffsetDate(2),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Amul Taaza Toned Milk',
        category: 'Dairy',
        quantity: 35.0,
        unit: 'L',
        cost_per_unit: 56.00,
        expiration_date: formatOffsetDate(1),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Ratnagiri Alphonso Mangoes',
        category: 'Produce',
        quantity: 25.0,
        unit: 'kg',
        cost_per_unit: 180.00,
        expiration_date: formatOffsetDate(2),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Fresh Palak (Spinach) & Coriander',
        category: 'Produce',
        quantity: 14.0,
        unit: 'kg',
        cost_per_unit: 65.00,
        expiration_date: formatOffsetDate(1),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'India Gate Classic Basmati Rice',
        category: 'Dry Goods',
        quantity: 50.0,
        unit: 'kg',
        cost_per_unit: 115.00,
        expiration_date: formatOffsetDate(120),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Fresh Tandoori Chicken Cuts',
        category: 'Meat & Poultry',
        quantity: 16.0,
        unit: 'kg',
        cost_per_unit: 260.00,
        expiration_date: formatOffsetDate(3),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Whole Wheat Tandoori Roti & Parotta Batch',
        category: 'Bakery',
        quantity: 45.0,
        unit: 'units',
        cost_per_unit: 18.00,
        expiration_date: formatOffsetDate(1),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Dal Makhani & Paneer Butter Masala',
        category: 'Prepared Foods',
        quantity: 12.0,
        unit: 'portions',
        cost_per_unit: 240.00,
        expiration_date: formatOffsetDate(0), // Today!
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Fresh Dahi (Set Curd)',
        category: 'Dairy',
        quantity: 15.0,
        unit: 'kg',
        cost_per_unit: 75.00,
        expiration_date: formatOffsetDate(4),
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Nasik Red Onions & Roma Tomatoes',
        category: 'Produce',
        quantity: 30.0,
        unit: 'kg',
        cost_per_unit: 45.00,
        expiration_date: formatOffsetDate(3),
        created_at: new Date().toISOString()
      }
    ],
    waste_logs: [
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Steamed Basmati Rice Batch',
        quantity_wasted: 4.5,
        unit: 'kg',
        reason: 'Over-preparation',
        financial_loss: 517.50,
        carbon_impact: 6.75,
        log_date: formatOffsetDate(-6),
        created_at: new Date(Date.now() - 6 * 86400000).toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Fresh Palak & Methi Greens',
        quantity_wasted: 3.5,
        unit: 'kg',
        reason: 'Trimmings/Prep Waste',
        financial_loss: 227.50,
        carbon_impact: 4.20,
        log_date: formatOffsetDate(-5),
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Amul Toned Milk',
        quantity_wasted: 6.0,
        unit: 'L',
        reason: 'Spoilage/Expiration',
        financial_loss: 336.00,
        carbon_impact: 34.80,
        log_date: formatOffsetDate(-4),
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Awadhi Chicken Dum Biryani Prep',
        quantity_wasted: 2.5,
        unit: 'kg',
        reason: 'Over-preparation',
        financial_loss: 650.00,
        carbon_impact: 31.25,
        log_date: formatOffsetDate(-3),
        created_at: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Roma Tomatoes',
        quantity_wasted: 4.0,
        unit: 'kg',
        reason: 'Quality Failure',
        financial_loss: 180.00,
        carbon_impact: 4.80,
        log_date: formatOffsetDate(-2),
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Thali & Banquet Buffet Leftovers',
        quantity_wasted: 6.0,
        unit: 'kg',
        reason: 'Customer Leftovers',
        financial_loss: 1440.00,
        carbon_impact: 21.00,
        log_date: formatOffsetDate(-1),
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Garlic Naan & Kulcha Dough Batch',
        quantity_wasted: 3.0,
        unit: 'kg',
        reason: 'Over-preparation',
        financial_loss: 270.00,
        carbon_impact: 5.40,
        log_date: formatOffsetDate(0),
        created_at: new Date().toISOString()
      }
    ],
    ai_insights: [
      {
        id: uuidv4(),
        organization_id: orgId,
        insight_type: 'DEMAND_FORECAST',
        recommendations: {
          summary: "Forecast indicates over-purchasing in Dairy (Amul Taaza Toned Milk & Fresh Malai Paneer) leading to 41% of your weekly carbon footprint. Weekend evening rain forecast in Bengaluru will raise dine-in hot thali and chai/kulfi orders by 25%.",
          predictedDemandWarnings: [
            {
              item: "Amul Taaza Toned Milk",
              reason: "35 L on hand with a 1-day expiration horizon exceeds standard weekday beverage velocity.",
              recommendedAction: "Reduce next supplier indent by 30% from 35 L to 24 L; convert 10 L immediately into fresh paneer/chenna or masala chai batch."
            },
            {
              item: "Fresh Malai Paneer",
              reason: "20 kg approaching cold-room shelf-life threshold (2 days remaining at 4 °C).",
              recommendedAction: "Marinate 8 kg in tandoori tikka spices today to extend cold-chain usability by 72 hours."
            },
            {
              item: "Fresh Palak (Spinach) & Coriander",
              reason: "14 kg leafy produce loses moisture rapidly above 5 °C.",
              recommendedAction: "Blanch and puree 6 kg into Palak Paneer base gravy today to lock freshness for 4 days."
            }
          ],
          surplusRepurposingIdeas: [
            {
              ingredient: "Amul Taaza Toned Milk",
              recipeIdea: "Curdle into fresh artisanal chenna for high-margin Rasmalai, Paneer Bhurji, or slow-simmered Khoya."
            },
            {
              ingredient: "Whole Wheat Tandoori Roti & Parotta Batch",
              recipeIdea: "Crisp and season into spiced Masala Khakhra bites, Kothu Parotta specials, or Shahi Tukda dessert trays."
            },
            {
              ingredient: "Ratnagiri Alphonso Mangoes",
              recipeIdea: "Blend ripe pulp into Mango Lassi specials, Aamras thali add-ons, or freeze in 500 g vacuum pouches."
            }
          ],
          carbonReductionTip: "Redirecting your 35 L dairy and 20 kg paneer at-risk batches prevents 319.0 kg CO2e emissions—equivalent to avoiding 420 km of passenger car travel."
        },
        created_at: new Date(Date.now() - 12 * 3600000).toISOString()
      }
    ],
    surplus_listings: [
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Whole Wheat Tandoori Roti & Parotta (Fresh Surplus)',
        category: 'Bakery',
        quantity: 30.0,
        unit: 'units',
        expiration_date: formatOffsetDate(0),
        matched_partner: 'Robin Hood Army - Bengaluru Chapter',
        partner_type: 'Food Bank',
        status: 'MATCHED',
        pickup_window: 'Today 17:00 - 19:30 IST',
        carbon_saved: 27.0,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Dal Makhani & Steamed Rice Trays',
        category: 'Prepared Foods',
        quantity: 12.0,
        unit: 'portions',
        expiration_date: formatOffsetDate(0),
        matched_partner: 'Akshaya Patra Community Kitchen',
        partner_type: 'Soup Kitchen',
        status: 'AVAILABLE',
        pickup_window: 'Today 20:00 - 21:30 IST',
        carbon_saved: 42.0,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        organization_id: orgId,
        item_name: 'Vegetable Prep Trimmings & Filter Coffee Grounds',
        category: 'Produce',
        quantity: 25.0,
        unit: 'kg',
        expiration_date: formatOffsetDate(1),
        matched_partner: 'Hasiru Dala Bio-Compost & Biogas Hub',
        partner_type: 'Composting Partner',
        status: 'DISPATCHED',
        pickup_window: 'Today 15:00 IST',
        carbon_saved: 30.0,
        created_at: new Date().toISOString()
      }
    ]
  };
}

function loadFileStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      fileStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[DB] Warning loading file store:', err.message);
  }
}

function saveFileStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(fileStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error writing to file store:', err.message);
  }
}

export function normalizeSupabaseUrl(raw) {
  const val = raw?.trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val.replace(/\/+$/, '');
  }
  return `https://${val}.supabase.co`;
}

export async function initDatabase() {
  loadFileStore();

  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const connectionString = process.env.DATABASE_URL?.trim();

  // 1. Prefer Supabase Cloud Service Role Client when configured
  if (supabaseUrl && serviceRoleKey) {
    try {
      const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { error } = await client.from('organizations').select('id').limit(1);
      if (!error) {
        supabaseAdmin = client;
        useFallback = false;
        console.log('✅ [DB] Connected to Supabase Cloud via Service Role Key');
        return;
      }
      console.warn('⚠️ [DB] Supabase tables not ready yet:', error.message);
    } catch (err) {
      console.warn('⚠️ [DB] Supabase client check failed:', err.message);
    }
  }

  // 2. Try PostgreSQL / Supabase Session Pooler via DATABASE_URL
  if (connectionString && !connectionString.includes('localhost:5432/ecopulse_dummy')) {
    try {
      const needsSsl =
        connectionString.includes('supabase') || connectionString.includes('sslmode=require');
      pool = new Pool({
        connectionString,
        ssl: needsSsl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 4000
      });

      const res = await pool.query('SELECT NOW()');
      console.log('✅ [DB] Connected to PostgreSQL / Supabase at:', res.rows[0].now);

      const schemaPath = fs.existsSync(MIGRATION_SQL_FILE)
        ? MIGRATION_SQL_FILE
        : path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✅ [DB] Schema, RLS policies, and seed data synchronized');
      }

      useFallback = false;
      return;
    } catch (err) {
      console.warn('⚠️ [DB] PostgreSQL not reachable, activating resilient local data store:', err.message);
      useFallback = true;
    }
  } else {
    useFallback = true;
  }

  // 3. Fallback active: populate seed data if empty
  if (!fileStore.organizations || fileStore.organizations.length === 0) {
    console.log('🌱 [DB] Seeding initial EcoPulse demo establishment and logs...');
    const seed = await getDemoSeedData();
    fileStore = seed;
    saveFileStore();
  }
  console.log('✅ [DB] Local data store active with tables: organizations, inventory, waste_logs, ai_insights, surplus_listings');
}

// Unified repository methods that work seamlessly across Supabase Cloud, PostgreSQL, and local store
export const db = {
  isFallback: () => useFallback,

  // Direct SQL query wrapper (with RLS support for Postgres)
  async query(text, params = [], orgId = null) {
    if (!useFallback && pool) {
      const client = await pool.connect();
      try {
        if (orgId) {
          await client.query("SELECT set_config('request.jwt.claim.org_id', $1, true)", [orgId]);
        }
        return await client.query(text, params);
      } finally {
        client.release();
      }
    }
    throw new Error('Raw query not supported directly in current mode. Use repository functions.');
  },

  // Organizations
  async findOrgByEmail(email) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data || null;
    }
    if (!useFallback && pool) {
      const res = await pool.query('SELECT * FROM organizations WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
      return res.rows[0] || null;
    }
    return fileStore.organizations.find(o => o.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findOrgById(id) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .select('id, name, email, business_type, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data || null;
    }
    if (!useFallback && pool) {
      const res = await pool.query('SELECT id, name, email, business_type, created_at FROM organizations WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const o = fileStore.organizations.find(org => org.id === id);
    if (!o) return null;
    const { password_hash, ...safeOrg } = o;
    return safeOrg;
  },

  async createOrg({ name, email, passwordHash, businessType }) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('organizations')
        .insert({
          id,
          name,
          email,
          password_hash: passwordHash,
          business_type: businessType,
          created_at: createdAt
        })
        .select('id, name, email, business_type, created_at')
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    if (!useFallback && pool) {
      const res = await pool.query(
        'INSERT INTO organizations (id, name, email, password_hash, business_type, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, business_type, created_at',
        [id, name, email, passwordHash, businessType, createdAt]
      );
      return res.rows[0];
    }
    const newOrg = { id, name, email, password_hash: passwordHash, business_type: businessType, created_at: createdAt };
    fileStore.organizations.push(newOrg);
    saveFileStore();
    return { id, name, email, business_type: businessType, created_at: createdAt };
  },

  // Inventory
  async getInventory(orgId) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('organization_id', orgId)
        .order('expiration_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
    if (!useFallback && pool) {
      const res = await pool.query('SELECT * FROM inventory WHERE organization_id = $1 ORDER BY expiration_date ASC', [orgId]);
      return res.rows;
    }
    return (fileStore.inventory || [])
      .filter(item => item.organization_id === orgId)
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
  },

  async addInventory(orgId, { itemName, category, quantity, unit, costPerUnit, expirationDate }) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .insert({
          id,
          organization_id: orgId,
          item_name: itemName,
          category,
          quantity: Number(quantity),
          unit,
          cost_per_unit: Number(costPerUnit),
          expiration_date: expirationDate,
          created_at: createdAt
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    if (!useFallback && pool) {
      const res = await pool.query(
        'INSERT INTO inventory (id, organization_id, item_name, category, quantity, unit, cost_per_unit, expiration_date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [id, orgId, itemName, category, quantity, unit, costPerUnit, expirationDate, createdAt]
      );
      return res.rows[0];
    }
    const newItem = {
      id,
      organization_id: orgId,
      item_name: itemName,
      category,
      quantity: Number(quantity),
      unit,
      cost_per_unit: Number(costPerUnit),
      expiration_date: expirationDate,
      created_at: createdAt
    };
    if (!fileStore.inventory) fileStore.inventory = [];
    fileStore.inventory.push(newItem);
    saveFileStore();
    return newItem;
  },

  async updateInventory(orgId, id, fields) {
    if (!useFallback && supabaseAdmin) {
      const updates = {};
      if (fields.quantity !== undefined) updates.quantity = Number(fields.quantity);
      if (fields.costPerUnit !== undefined) updates.cost_per_unit = Number(fields.costPerUnit);
      if (fields.expirationDate !== undefined) updates.expiration_date = fields.expirationDate;
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data || null;
    }
    if (!useFallback && pool) {
      const updates = [];
      const values = [id, orgId];
      let counter = 3;
      if (fields.quantity !== undefined) {
        updates.push(`quantity = $${counter++}`);
        values.push(fields.quantity);
      }
      if (fields.costPerUnit !== undefined) {
        updates.push(`cost_per_unit = $${counter++}`);
        values.push(fields.costPerUnit);
      }
      if (fields.expirationDate !== undefined) {
        updates.push(`expiration_date = $${counter++}`);
        values.push(fields.expirationDate);
      }
      const query = `UPDATE inventory SET ${updates.join(', ')} WHERE id = $1 AND organization_id = $2 RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0] || null;
    }
    const idx = (fileStore.inventory || []).findIndex(i => i.id === id && i.organization_id === orgId);
    if (idx === -1) return null;
    fileStore.inventory[idx] = {
      ...fileStore.inventory[idx],
      ...(fields.quantity !== undefined && { quantity: Number(fields.quantity) }),
      ...(fields.costPerUnit !== undefined && { cost_per_unit: Number(fields.costPerUnit) }),
      ...(fields.expirationDate !== undefined && { expiration_date: fields.expirationDate })
    };
    saveFileStore();
    return fileStore.inventory[idx];
  },

  async deleteInventory(orgId, id) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('id');
      if (error) throw new Error(error.message);
      return (data || []).length > 0;
    }
    if (!useFallback && pool) {
      const res = await pool.query('DELETE FROM inventory WHERE id = $1 AND organization_id = $2 RETURNING id', [id, orgId]);
      return res.rowCount > 0;
    }
    const initialLen = (fileStore.inventory || []).length;
    fileStore.inventory = (fileStore.inventory || []).filter(item => !(item.id === id && item.organization_id === orgId));
    saveFileStore();
    return fileStore.inventory.length < initialLen;
  },

  // Waste Logs
  async getWasteLogs(orgId) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('waste_logs')
        .select('*')
        .eq('organization_id', orgId)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    if (!useFallback && pool) {
      const res = await pool.query('SELECT * FROM waste_logs WHERE organization_id = $1 ORDER BY log_date DESC, created_at DESC', [orgId]);
      return res.rows;
    }
    return (fileStore.waste_logs || [])
      .filter(w => w.organization_id === orgId)
      .sort((a, b) => new Date(b.log_date || b.created_at) - new Date(a.log_date || a.created_at));
  },

  async addWasteLog(orgId, { itemName, quantityWasted, unit, reason, financialLoss, carbonImpact, logDate }) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const date = logDate || new Date().toISOString().split('T')[0];

    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('waste_logs')
        .insert({
          id,
          organization_id: orgId,
          item_name: itemName,
          quantity_wasted: Number(quantityWasted),
          unit,
          reason,
          financial_loss: Number(financialLoss),
          carbon_impact: Number(carbonImpact),
          log_date: date,
          created_at: createdAt
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    if (!useFallback && pool) {
      const res = await pool.query(
        'INSERT INTO waste_logs (id, organization_id, item_name, quantity_wasted, unit, reason, financial_loss, carbon_impact, log_date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [id, orgId, itemName, quantityWasted, unit, reason, financialLoss, carbonImpact, date, createdAt]
      );
      return res.rows[0];
    }
    const newLog = {
      id,
      organization_id: orgId,
      item_name: itemName,
      quantity_wasted: Number(quantityWasted),
      unit,
      reason,
      financial_loss: Number(financialLoss),
      carbon_impact: Number(carbonImpact),
      log_date: date,
      created_at: createdAt
    };
    if (!fileStore.waste_logs) fileStore.waste_logs = [];
    fileStore.waste_logs.push(newLog);
    saveFileStore();
    return newLog;
  },

  async deleteWasteLog(orgId, id) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('waste_logs')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('id');
      if (error) throw new Error(error.message);
      return (data || []).length > 0;
    }
    if (!useFallback && pool) {
      const res = await pool.query('DELETE FROM waste_logs WHERE id = $1 AND organization_id = $2 RETURNING id', [id, orgId]);
      return res.rowCount > 0;
    }
    const initialLen = (fileStore.waste_logs || []).length;
    fileStore.waste_logs = (fileStore.waste_logs || []).filter(w => !(w.id === id && w.organization_id === orgId));
    saveFileStore();
    return fileStore.waste_logs.length < initialLen;
  },

  // AI Insights
  async saveAIInsight(orgId, insightType, recommendations) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('ai_insights')
        .insert({
          id,
          organization_id: orgId,
          insight_type: insightType,
          recommendations,
          created_at: createdAt
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    if (!useFallback && pool) {
      const res = await pool.query(
        'INSERT INTO ai_insights (id, organization_id, insight_type, recommendations, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, orgId, insightType, JSON.stringify(recommendations), createdAt]
      );
      return res.rows[0];
    }
    const insight = {
      id,
      organization_id: orgId,
      insight_type: insightType,
      recommendations,
      created_at: createdAt
    };
    if (!fileStore.ai_insights) fileStore.ai_insights = [];
    fileStore.ai_insights.unshift(insight);
    if (fileStore.ai_insights.length > 20) {
      fileStore.ai_insights = fileStore.ai_insights.slice(0, 20);
    }
    saveFileStore();
    return insight;
  },

  async getLatestAIInsights(orgId, limit = 5) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('ai_insights')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data || [];
    }
    if (!useFallback && pool) {
      const res = await pool.query(
        'SELECT * FROM ai_insights WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2',
        [orgId, limit]
      );
      return res.rows;
    }
    return (fileStore.ai_insights || [])
      .filter(i => i.organization_id === orgId)
      .slice(0, limit);
  },

  // Surplus Listings
  async getSurplusListings(orgId) {
    if (!useFallback && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('surplus_listings')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    if (!useFallback && pool) {
      const res = await pool.query('SELECT * FROM surplus_listings WHERE organization_id = $1 ORDER BY created_at DESC', [orgId]);
      return res.rows;
    }
    return (fileStore.surplus_listings || []).filter(s => s.organization_id === orgId);
  },

  async addSurplusListing(orgId, data) {
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const newListing = {
      id,
      organization_id: orgId,
      item_name: data.itemName,
      category: data.category || 'Produce',
      quantity: Number(data.quantity),
      unit: data.unit || 'kg',
      expiration_date: data.expirationDate,
      matched_partner: data.matchedPartner || null,
      partner_type: data.partnerType || null,
      status: data.status || 'AVAILABLE',
      pickup_window: data.pickupWindow || 'Today 17:00 - 20:00 IST',
      carbon_saved: Number(data.carbonSaved || (Number(data.quantity) * 2.2)),
      created_at: createdAt
    };

    if (!useFallback && supabaseAdmin) {
      const { data: inserted, error } = await supabaseAdmin
        .from('surplus_listings')
        .insert(newListing)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return inserted;
    }

    if (!useFallback && pool) {
      const res = await pool.query(
        'INSERT INTO surplus_listings (id, organization_id, item_name, category, quantity, unit, expiration_date, matched_partner, partner_type, status, pickup_window, carbon_saved, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
        [id, orgId, newListing.item_name, newListing.category, newListing.quantity, newListing.unit, newListing.expiration_date, newListing.matched_partner, newListing.partner_type, newListing.status, newListing.pickup_window, newListing.carbon_saved, createdAt]
      );
      return res.rows[0];
    }

    if (!fileStore.surplus_listings) fileStore.surplus_listings = [];
    fileStore.surplus_listings.unshift(newListing);
    saveFileStore();
    return newListing;
  },

  async updateSurplusStatus(orgId, id, status, partnerInfo = {}) {
    if (!useFallback && supabaseAdmin) {
      const updates = { status };
      if (partnerInfo.matchedPartner) updates.matched_partner = partnerInfo.matchedPartner;
      if (partnerInfo.partnerType) updates.partner_type = partnerInfo.partnerType;
      const { data, error } = await supabaseAdmin
        .from('surplus_listings')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data || null;
    }
    if (!useFallback && pool) {
      const res = await pool.query(
        'UPDATE surplus_listings SET status = $1, matched_partner = COALESCE($2, matched_partner), partner_type = COALESCE($3, partner_type) WHERE id = $4 AND organization_id = $5 RETURNING *',
        [status, partnerInfo.matchedPartner, partnerInfo.partnerType, id, orgId]
      );
      return res.rows[0];
    }
    const idx = (fileStore.surplus_listings || []).findIndex(s => s.id === id && s.organization_id === orgId);
    if (idx === -1) return null;
    fileStore.surplus_listings[idx] = {
      ...fileStore.surplus_listings[idx],
      status,
      ...(partnerInfo.matchedPartner && { matched_partner: partnerInfo.matchedPartner }),
      ...(partnerInfo.partnerType && { partner_type: partnerInfo.partnerType })
    };
    saveFileStore();
    return fileStore.surplus_listings[idx];
  }
};
