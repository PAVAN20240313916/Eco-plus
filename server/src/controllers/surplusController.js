import { db } from '../config/db.js';

export async function getSurplusListings(req, res) {
  try {
    const listings = await db.getSurplusListings(req.orgId);
    return res.json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (err) {
    console.error('[Surplus] Fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve surplus listings.' });
  }
}

export async function createSurplusListing(req, res) {
  try {
    const newListing = await db.addSurplusListing(req.orgId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Surplus donation listing published to network.',
      data: newListing
    });
  } catch (err) {
    console.error('[Surplus] Create error:', err);
    return res.status(500).json({ success: false, error: 'Failed to publish surplus listing.' });
  }
}

export async function updateSurplusStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, matchedPartner, partnerType } = req.body;
    const updated = await db.updateSurplusStatus(req.orgId, id, status, { matchedPartner, partnerType });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Surplus listing not found.' });
    }
    return res.json({
      success: true,
      message: `Surplus listing status updated to ${status}.`,
      data: updated
    });
  } catch (err) {
    console.error('[Surplus] Update error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update surplus listing status.' });
  }
}
