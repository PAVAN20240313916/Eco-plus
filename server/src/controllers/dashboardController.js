import { db } from '../config/db.js';

export async function getDashboardStats(req, res) {
  try {
    const orgId = req.orgId;
    const inventory = await db.getInventory(orgId);
    const wasteLogs = await db.getWasteLogs(orgId);
    const surplusListings = await db.getSurplusListings(orgId);
    const latestInsights = await db.getLatestAIInsights(orgId, 1);

    const now = new Date();

    // Inventory metrics
    let totalInventoryValuation = 0;
    const expiringSoon = [];
    const expired = [];

    inventory.forEach(item => {
      const value = Number(item.quantity) * Number(item.cost_per_unit);
      totalInventoryValuation += isNaN(value) ? 0 : value;

      const expDate = new Date(item.expiration_date);
      const daysDiff = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        expired.push({ ...item, daysDiff });
      } else if (daysDiff <= 3) {
        expiringSoon.push({ ...item, daysDiff });
      }
    });

    // Waste metrics
    let totalWasteKg = 0;
    let totalFinancialLoss = 0;
    let totalCarbonImpact = 0;

    const wasteByReasonMap = {};
    const wasteByCategoryMap = {
      'Produce': 0,
      'Dairy': 0,
      'Meat & Poultry': 0,
      'Bakery': 0,
      'Prepared Foods': 0,
      'Dry Goods': 0
    };

    // 7-day trend
    const dateTrendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateTrendMap[key] = { date: key, wasteKg: 0, financialLoss: 0, carbonImpact: 0 };
    }

    wasteLogs.forEach(w => {
      const qty = Number(w.quantity_wasted) || 0;
      const loss = Number(w.financial_loss) || 0;
      const carbon = Number(w.carbon_impact) || 0;

      totalWasteKg += qty;
      totalFinancialLoss += loss;
      totalCarbonImpact += carbon;

      // Reason breakdown
      const reason = w.reason || 'Other';
      wasteByReasonMap[reason] = (wasteByReasonMap[reason] || 0) + qty;

      // Match item name to inventory category if possible, or infer
      const matchedInv = inventory.find(i => i.item_name.toLowerCase() === w.item_name.toLowerCase());
      const cat = matchedInv ? matchedInv.category : 'Produce';
      wasteByCategoryMap[cat] = (wasteByCategoryMap[cat] || 0) + qty;

      // Date trend
      const logDate = w.log_date || w.created_at.split('T')[0];
      if (dateTrendMap[logDate]) {
        dateTrendMap[logDate].wasteKg += qty;
        dateTrendMap[logDate].financialLoss += loss;
        dateTrendMap[logDate].carbonImpact += carbon;
      }
    });

    // Surplus diversion carbon savings
    const carbonSaved = surplusListings.reduce((sum, s) => {
      if (s.status === 'MATCHED' || s.status === 'DISPATCHED' || s.status === 'COMPLETED') {
        return sum + Number(s.carbon_saved || 0);
      }
      return sum;
    }, 0);

    const costSavedAvoided = Number((carbonSaved * 110 + totalWasteKg * 45).toFixed(2));

    const wasteByReason = Object.keys(wasteByReasonMap).map(name => ({
      name,
      value: Number(wasteByReasonMap[name].toFixed(2))
    }));

    const wasteByCategory = Object.keys(wasteByCategoryMap).map(category => ({
      category,
      wasteKg: Number(wasteByCategoryMap[category].toFixed(2))
    }));

    const weeklyTrend = Object.values(dateTrendMap).map(item => ({
      date: item.date.slice(5), // MM-DD
      wasteKg: Number(item.wasteKg.toFixed(2)),
      financialLoss: Number(item.financialLoss.toFixed(2)),
      carbonImpact: Number(item.carbonImpact.toFixed(2))
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          totalActiveItems: inventory.length,
          totalInventoryValue: Number(totalInventoryValuation.toFixed(2)),
          totalWasteKg: Number(totalWasteKg.toFixed(2)),
          totalFinancialLoss: Number(totalFinancialLoss.toFixed(2)),
          totalCarbonImpact: Number(totalCarbonImpact.toFixed(2)),
          carbonSavedKg: Number(carbonSaved.toFixed(2)),
          costSavedAvoided,
          expiringCount: expiringSoon.length,
          expiredCount: expired.length
        },
        expiringSoon: expiringSoon.slice(0, 5),
        weeklyTrend,
        wasteByReason,
        wasteByCategory,
        latestAIInsight: latestInsights[0] ? latestInsights[0].recommendations : null
      }
    });
  } catch (err) {
    console.error('[Dashboard] Stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to aggregate dashboard metrics.' });
  }
}
