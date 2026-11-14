import { db } from '../config/db.js';
import {
  generateAIAnalysis,
  generateSmartLocalForecast,
  generateSmartSurplusMatches,
  isRestaurantEligibleForWholesale
} from '../config/gemini.js';

export async function getForecast(req, res) {
  try {
    const inventory = await db.getInventory(req.orgId);
    const wasteLogs = await db.getWasteLogs(req.orgId);
    const org = req.org || (await db.findOrgById(req.orgId));

    const { weather = {}, question = '', businessType: requestedBusinessType } = req.body || {};
    const effectiveBusinessType =
      requestedBusinessType ||
      org?.business_type ||
      org?.businessType ||
      'Restaurant / Cloud Kitchen / Darshini';
    const wholesaleEligible = isRestaurantEligibleForWholesale(effectiveBusinessType);

    const weatherContextInput = {
      city: weather?.city || 'Bengaluru, KA',
      condition: weather?.condition || 'Pleasant & Dry',
      tempC: Number.isFinite(Number(weather?.tempC)) ? Number(weather.tempC) : 24,
      humidity: Number.isFinite(Number(weather?.humidity)) ? Number(weather.humidity) : 58
    };

    const wholesalePromptInstructions = wholesaleEligible
      ? `The user is a Restaurant Owner (${effectiveBusinessType}). Also include nearby wholesale meat sellers and wholesale grocery sellers in "nearbyWholesaleSuppliers" using real local B2B markets around ${weatherContextInput.city}.`
      : `The user is a Supermarket/Retail owner (${effectiveBusinessType}). Do NOT suggest nearby meat or grocery wholesale sellers; return "nearbyWholesaleSuppliers": {"eligible": false, "businessType": "${effectiveBusinessType}", "city": "${weatherContextInput.city}", "meatWholesalers": [], "groceryWholesalers": []}.`;

    // Contextual summary for Gemini prompt
    const prompt = `
Analyze the following Indian commercial food operation data, business role, and weather forecast for sustainability, long-term storage longevity, and smart purchasing optimization:
Business Type: ${effectiveBusinessType}
Weather Forecast: ${JSON.stringify(weatherContextInput)}
User Assistant Question: ${JSON.stringify(question || 'Which inventory items can be kept for a long time in this weather and which products should we buy more of?')}
Inventory: ${JSON.stringify(inventory.map(i => ({
      item: i.item_name,
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      expirationDate: i.expiration_date
    })))}
Recent Waste Logs: ${JSON.stringify(wasteLogs.slice(0, 15).map(w => ({
      item: w.item_name,
      quantityWasted: w.quantity_wasted,
      unit: w.unit,
      reason: w.reason,
      financialLoss: w.financial_loss,
      carbonImpact: w.carbon_impact,
      date: w.log_date
    })))}

${wholesalePromptInstructions}
Provide demand forecasting, weather-resilient long-term storage items (from existing stock and dry pantry staples), products we should buy MORE of based on the upcoming weather forecast, and waste reduction strategies tailored for an Indian commercial food operation. Use strict SI units (kg, g, L, mL, km, °C, kg CO2e) and Indian Rupees (₹ / INR) throughout.
Return a JSON object matching this schema:
{
  "summary": "string",
  "assistantAnswer": "string",
  "weatherContext": {
    "city": "string",
    "condition": "string",
    "temperatureC": 0,
    "humidityPercent": 0,
    "weatherImpactSummary": "string"
  },
  "longShelfLifeItems": [{"item": "string", "currentStock": "string", "safeStorageDuration": "string", "storageAdvice": "string"}],
  "recommendedBuyMoreProducts": [{"product": "string", "suggestedOrderQty": "string", "weatherReason": "string", "estimatedShelfLife": "string"}],
  "nearbyWholesaleSuppliers": {
    "eligible": true,
    "businessType": "string",
    "city": "string",
    "meatWholesalers": [{"name": "string", "marketArea": "string", "distanceKm": "string", "specialties": "string", "wholesaleRate": "string", "minOrderQty": "string", "coldChainNote": "string"}],
    "groceryWholesalers": [{"name": "string", "marketArea": "string", "distanceKm": "string", "specialties": "string", "wholesaleRate": "string", "minOrderQty": "string", "deliveryWindow": "string"}]
  },
  "predictedDemandWarnings": [{"item": "string", "reason": "string", "recommendedAction": "string"}],
  "surplusRepurposingIdeas": [{"ingredient": "string", "recipeIdea": "string"}],
  "carbonReductionTip": "string"
}
`;

    let recommendations = null;

    try {
      const rawResponse = await generateAIAnalysis(prompt);
      if (rawResponse) {
        // Strip markdown backticks if any
        const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        recommendations = JSON.parse(cleaned);
      }
    } catch (aiErr) {
      console.warn('[AI Controller] Error parsing Gemini response, falling back to smart local engine:', aiErr.message);
    }

    const fallback = generateSmartLocalForecast(
      inventory,
      wasteLogs,
      weatherContextInput,
      question,
      effectiveBusinessType
    );

    const usedGemini = Boolean(recommendations && recommendations.summary);

    // If Gemini was unreachable, or key omitted, use intelligent local heuristic synthesis; otherwise fill any missing weather/wholesale fields
    if (!usedGemini) {
      recommendations = fallback;
    } else {
      recommendations = {
        ...fallback,
        ...recommendations,
        weatherContext: recommendations.weatherContext || fallback.weatherContext,
        longShelfLifeItems:
          Array.isArray(recommendations.longShelfLifeItems) && recommendations.longShelfLifeItems.length > 0
            ? recommendations.longShelfLifeItems
            : fallback.longShelfLifeItems,
        recommendedBuyMoreProducts:
          Array.isArray(recommendations.recommendedBuyMoreProducts) &&
          recommendations.recommendedBuyMoreProducts.length > 0
            ? recommendations.recommendedBuyMoreProducts
            : fallback.recommendedBuyMoreProducts,
        nearbyWholesaleSuppliers: wholesaleEligible
          ? recommendations.nearbyWholesaleSuppliers?.meatWholesalers?.length
            ? { ...recommendations.nearbyWholesaleSuppliers, eligible: true, businessType: effectiveBusinessType }
            : fallback.nearbyWholesaleSuppliers
          : {
              eligible: false,
              businessType: effectiveBusinessType,
              city: weatherContextInput.city,
              meatWholesalers: [],
              groceryWholesalers: []
            }
      };
    }

    // Strict guard: never return meat/grocery wholesale sellers for non-restaurant (e.g. supermarket) owners
    if (!wholesaleEligible) {
      recommendations.nearbyWholesaleSuppliers = {
        eligible: false,
        businessType: effectiveBusinessType,
        city: weatherContextInput.city,
        meatWholesalers: [],
        groceryWholesalers: []
      };
    }

    // Persist to database cache
    const savedInsight = await db.saveAIInsight(req.orgId, 'DEMAND_FORECAST', recommendations);

    return res.json({
      success: true,
      source: usedGemini ? 'gemini-2.5-flash' : 'ecopulse-local-engine',
      data: recommendations,
      cachedAt: savedInsight.created_at
    });
  } catch (err) {
    console.error('[AI] Forecast error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate sustainability forecast.' });
  }
}

export async function matchSurplus(req, res) {
  try {
    let surplusItems = req.body.items;

    // If no explicit items provided, auto-select items expiring within 3 days
    if (!surplusItems || surplusItems.length === 0) {
      const inventory = await db.getInventory(req.orgId);
      const now = new Date();
      surplusItems = inventory.filter(item => {
        const diff = (new Date(item.expiration_date) - now) / (1000 * 60 * 60 * 24);
        return diff <= 3 && item.quantity > 0;
      });
      if (surplusItems.length === 0) {
        surplusItems = inventory.slice(0, 3);
      }
    }

    const prompt = `
Match the following Indian commercial kitchen surplus inventory batches with local Indian food rescue NGOs, shelters, and composting hubs (e.g., Robin Hood Army, Feeding India, Akshaya Patra, Hasiru Dala). Use strict SI units (kg, g, L, mL, km, °C, kg CO2e) and Indian Rupees (₹ / INR) for tax benefits under Section 80G / FSSAI Save Food Share Food guidelines:
Surplus Items: ${JSON.stringify(surplusItems)}

Recommend best-fit donation destinations, cold-chain compliance guidance in °C, and potential carbon offset.
Return a JSON object matching this schema:
{
  "matches": [
    {
      "item": "string",
      "quantity": "string",
      "category": "string",
      "partnerName": "string",
      "partnerType": "Food Bank | Shelter Pantry | Soup Kitchen | Composting Partner",
      "distance": "string",
      "urgency": "High | Medium | Low",
      "matchedItems": ["string"],
      "estimatedCarbonOffset": "string",
      "logisticsNote": "string"
    }
  ],
  "refrigerationGuidance": "string",
  "taxDeductionEstimate": "string"
}
`;

    let matchResult = null;

    try {
      const rawResponse = await generateAIAnalysis(prompt);
      if (rawResponse) {
        const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        matchResult = JSON.parse(cleaned);
      }
    } catch (aiErr) {
      console.warn('[AI Controller] Error parsing surplus match Gemini response:', aiErr.message);
    }

    if (!matchResult || !matchResult.matches) {
      matchResult = generateSmartSurplusMatches(surplusItems);
    }

    await db.saveAIInsight(req.orgId, 'SURPLUS_MATCH', matchResult);

    return res.json({
      success: true,
      source: process.env.GEMINI_API_KEY ? 'gemini-2.5-flash' : 'ecopulse-local-engine',
      data: matchResult
    });
  } catch (err) {
    console.error('[AI] Surplus match error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate surplus matching.' });
  }
}

export async function getAIHistory(req, res) {
  try {
    const history = await db.getLatestAIInsights(req.orgId, 10);
    return res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('[AI] History error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve AI history.' });
  }
}
