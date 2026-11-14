import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'ecopulse_super_secure_jwt_secret_key_2026_sustainability';
    const decoded = jwt.verify(token, secret);

    const orgId = decoded.orgId || decoded.id;
    if (!orgId) {
      return res.status(403).json({ success: false, error: 'Malformed token payload.' });
    }

    const org = await db.findOrgById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization no longer exists.' });
    }

    req.orgId = orgId;
    req.org = org;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
}
