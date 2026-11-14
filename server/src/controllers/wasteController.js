import { db, CATEGORY_EMISSION_FACTORS } from '../config/db.js';

export async function getWasteLogs(req, res) {
  try {
    const logs = await db.getWasteLogs(req.orgId);

    const totalWeightKg = logs.reduce((sum, item) => sum + Number(item.quantity_wasted || 0), 0);
    const totalFinancialLoss = logs.reduce((sum, item) => sum + Number(item.financial_loss || 0), 0);
    const totalCarbonImpact = logs.reduce((sum, item) => sum + Number(item.carbon_impact || 0), 0);

    return res.json({
      success: true,
      count: logs.length,
      metrics: {
        totalWeightKg: Number(totalWeightKg.toFixed(2)),
        totalFinancialLoss: Number(totalFinancialLoss.toFixed(2)),
        totalCarbonImpact: Number(totalCarbonImpact.toFixed(2))
      },
      data: logs
    });
  } catch (err) {
    console.error('[Waste] Fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve waste logs.' });
  }
}

export async function addWasteLog(req, res) {
  try {
    const { itemName, quantityWasted, unit, reason, financialLoss, carbonImpact, logDate } = req.body;

    const newLog = await db.addWasteLog(req.orgId, {
      itemName,
      quantityWasted,
      unit,
      reason,
      financialLoss,
      carbonImpact,
      logDate: logDate || new Date().toISOString().split('T')[0]
    });

    return res.status(201).json({
      success: true,
      message: 'Waste event logged successfully.',
      data: newLog
    });
  } catch (err) {
    console.error('[Waste] Create error:', err);
    return res.status(500).json({ success: false, error: 'Failed to log waste event.' });
  }
}

export async function deleteWasteLog(req, res) {
  try {
    const { id } = req.params;
    const deleted = await db.deleteWasteLog(req.orgId, id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Waste log not found or already deleted.' });
    }
    return res.json({
      success: true,
      message: 'Waste log deleted successfully.'
    });
  } catch (err) {
    console.error('[Waste] Delete error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete waste log.' });
  }
}
