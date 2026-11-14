import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ecopulse_super_secure_jwt_secret_key_2026_sustainability';

export async function register(req, res) {
  try {
    const { name, email, password, businessType } = req.body;

    const existing = await db.findOrgByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An organization with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newOrg = await db.createOrg({
      name,
      email,
      passwordHash,
      businessType
    });

    const token = jwt.sign(
      { orgId: newOrg.id, email: newOrg.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Organization registered successfully.',
      token,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        email: newOrg.email,
        businessType: newOrg.business_type
      }
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    return res.status(500).json({ success: false, error: 'Registration failed due to server error.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const org = await db.findOrgByEmail(email);
    if (!org) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, org.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email address or password.'
      });
    }

    const token = jwt.sign(
      { orgId: org.id, email: org.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      organization: {
        id: org.id,
        name: org.name,
        email: org.email,
        businessType: org.business_type
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ success: false, error: 'Authentication failed due to server error.' });
  }
}

export async function getMe(req, res) {
  return res.json({
    success: true,
    organization: req.org
  });
}
