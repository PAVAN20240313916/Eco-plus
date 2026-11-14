import { GoogleGenAI } from "@google/genai";

let aiInstance = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_google_gemini_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const ECOPULSE_SYSTEM_INSTRUCTION = `You are EcoPulse AI, an expert Principal Sustainability Consultant and Supply Chain Optimization Engineer specialized in reducing commercial food waste and urban supply chain inefficiencies across India under the theme of AI for Sustainability. Always use strict SI units (kg, g, L, mL, km, °C, kg CO2e) and Indian Rupees (₹ / INR) for all financials, quantities, distances, and temperatures. Recommend practical Indian commercial kitchen repurposing recipes, FSSAI food-safety practices, Section 80G / CSR food donation compliance, and Indian food rescue partners. Always output valid JSON conforming strictly to the requested schema. Avoid generic advice; provide concrete quantities, repurposing recipes, and supply chain adjustments.`;

export function isRestaurantEligibleForWholesale(businessType = '') {
  const normalized = String(businessType || '').trim();
  if (!normalized) return true;
  if (/supermarket|hypermarket|kirana|grocery|mart|retail/i.test(normalized)) {
    return false;
  }
  return /restaurant|kitchen|bistro|darshini|hotel|banquet|catering|cafe|cafeteria|dining/i.test(
    normalized
  );
}

const CITY_WHOLESALE_DIRECTORY = {
  bengaluru: {
    cityLabel: 'Bengaluru, KA',
    meatWholesalers: [
      {
        name: 'Russell Market Halal Meat & Poultry Wholesale',
        marketArea: 'Shivajinagar / Russell Market',
        distanceKm: '2.8 km',
        specialties: 'Broiler Chicken, Curry-Cut Goat, Boneless Breast',
        wholesaleRate: '₹215–₹690/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled insulated crate 0–4 °C'
      },
      {
        name: 'Yeshwanthpur Fresh Hatcheries & Seafood Mart',
        marketArea: 'Yeshwanthpur Wholesale Yard',
        distanceKm: '5.4 km',
        specialties: 'Farm Poultry, Freshwater Rohu, Tiger Prawns',
        wholesaleRate: '₹205–₹540/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'Ice-slurry cold van 0–2 °C'
      },
      {
        name: 'KR Market Prime Cuts B2B Cold Hub',
        marketArea: 'Kalasipalyam / KR Market',
        distanceKm: '3.6 km',
        specialties: 'Mutton Keema, Chicken Wings, Drumsticks',
        wholesaleRate: '₹220–₹710/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'FSSAI certified chill 1–4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Yeshwanthpur APMC Grain & Pulse Traders',
        marketArea: 'APMC Yard, Yeshwanthpur',
        distanceKm: '5.8 km',
        specialties: 'Basmati Rice, Toor Dal, Besan, Mustard Oil',
        wholesaleRate: '₹58–₹135/kg',
        minOrderQty: '50 kg',
        deliveryWindow: 'Morning 05:30–08:30 IST'
      },
      {
        name: 'KR Market Onion, Potato & Spice Syndicate',
        marketArea: 'KR Market B2B Lane',
        distanceKm: '3.2 km',
        specialties: 'Red Onions, Potatoes, Guntur Chillies, Ginger',
        wholesaleRate: '₹26–₹210/kg',
        minOrderQty: '25 kg',
        deliveryWindow: 'Same-morning crate drop'
      },
      {
        name: 'Chickpet Annapurna B2B Oil & Kirana Depot',
        marketArea: 'Chickpet Wholesale Enclave',
        distanceKm: '3.9 km',
        specialties: 'Pure Ghee, Refined Oil Tins, Whole Spices',
        wholesaleRate: '₹118–₹560/L or kg',
        minOrderQty: '20 kg / L',
        deliveryWindow: 'Scheduled kitchen slot 07:00–11:00 IST'
      }
    ]
  },
  mumbai: {
    cityLabel: 'Mumbai, MH',
    meatWholesalers: [
      {
        name: 'Crawford Market Prime Poultry & Mutton Guild',
        marketArea: 'Crawford Market, Fort',
        distanceKm: '2.5 km',
        specialties: 'Chef-Cut Chicken, Tender Goat Cuts, Kheema',
        wholesaleRate: '₹225–₹740/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled van 0–4 °C'
      },
      {
        name: 'Sassoon Dock B2B Seafood & Fish Cold Chain',
        marketArea: 'Colaba / Sassoon Dock',
        distanceKm: '4.8 km',
        specialties: 'Surmai, Pomfret, Cleaned White Prawns',
        wholesaleRate: '₹340–₹890/kg',
        minOrderQty: '12 kg',
        coldChainNote: 'Flake-ice box 0–2 °C'
      },
      {
        name: 'Deonar Abattoir Certified Meat Co-op',
        marketArea: 'Govandi / Deonar',
        distanceKm: '7.2 km',
        specialties: 'Bulk Mutton Carcass, Lamb Chops, Bone-In',
        wholesaleRate: '₹580–₹720/kg',
        minOrderQty: '20 kg',
        coldChainNote: 'FSSAI refrigerated dispatch < 4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Vashi APMC Grain, Dal & Oil Wholesale Hub',
        marketArea: 'APMC Market, Vashi',
        distanceKm: '8.5 km',
        specialties: 'Kolam Rice, Toor Dal, Besan, Groundnut Oil',
        wholesaleRate: '₹56–₹155/kg',
        minOrderQty: '50 kg',
        deliveryWindow: 'Morning 05:00–09:00 IST'
      },
      {
        name: 'Masjid Bunder Spice & Dry-Fruit Bazaar',
        marketArea: 'Masjid Bunder',
        distanceKm: '3.1 km',
        specialties: 'Whole Garam Masala, Cashews, Cardamom, Tea',
        wholesaleRate: '₹210–₹920/kg',
        minOrderQty: '15 kg',
        deliveryWindow: 'Daily B2B dispatch 08:00–13:00 IST'
      },
      {
        name: 'Dadar Sabzi & Onion Wholesale Yard',
        marketArea: 'Dadar West Mandi',
        distanceKm: '3.8 km',
        specialties: 'Nashik Onions, Potatoes, Fresh Coriander & Mint',
        wholesaleRate: '₹28–₹95/kg',
        minOrderQty: '25 kg',
        deliveryWindow: 'Early dawn crate drop 04:30–07:30 IST'
      }
    ]
  },
  delhi: {
    cityLabel: 'Delhi NCR',
    meatWholesalers: [
      {
        name: 'Ghazipur Poultry & Fresh Meat Mandi',
        marketArea: 'Ghazipur Wholesale Market',
        distanceKm: '6.4 km',
        specialties: 'Broiler Whole Birds, Tangdi, Boneless Tikka Cut',
        wholesaleRate: '₹195–₹290/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'Chilled crate 0–4 °C'
      },
      {
        name: 'INA Market Chef-Cut Meats & Seafood',
        marketArea: 'INA Commercial Arcade',
        distanceKm: '3.4 km',
        specialties: 'Mutton Raan, Sole Fillet, Jumbo Prawns',
        wholesaleRate: '₹390–₹780/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Vacuum cold pack 1–3 °C'
      },
      {
        name: 'Jama Masjid Heritage Mutton & Kebab Cuts',
        marketArea: 'Matia Mahal Supply Hub',
        distanceKm: '4.2 km',
        specialties: 'Halal Goat Chops, Seekh Keema, Curry Cuts',
        wholesaleRate: '₹620–₹740/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Insulated box 0–4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Khari Baoli Whole Spice & Dry Pantry Exchange',
        marketArea: 'Khari Baoli, Old Delhi',
        distanceKm: '4.1 km',
        specialties: 'Cumin, Black Cardamom, Whole Chillies, Ghee',
        wholesaleRate: '₹180–₹850/kg',
        minOrderQty: '20 kg',
        deliveryWindow: 'Morning 06:00–10:30 IST'
      },
      {
        name: 'Azadpur APMC Produce & Root Mandi',
        marketArea: 'Azadpur Subzi Mandi',
        distanceKm: '7.5 km',
        specialties: 'Potatoes, Onions, Tomatoes, Fresh Ginger',
        wholesaleRate: '₹24–₹110/kg',
        minOrderQty: '30 kg',
        deliveryWindow: 'Dawn kitchen fleet 04:30–08:00 IST'
      },
      {
        name: 'Naya Bazar B2B Atta, Rice & Lentil Traders',
        marketArea: 'Naya Bazar',
        distanceKm: '4.6 km',
        specialties: 'Chakki Atta, 1121 Basmati Rice, Chana & Urad Dal',
        wholesaleRate: '₹38–₹125/kg',
        minOrderQty: '50 kg',
        deliveryWindow: 'Scheduled daytime slot'
      }
    ]
  },
  hyderabad: {
    cityLabel: 'Hyderabad, TS',
    meatWholesalers: [
      {
        name: 'Jiyaguda Certified Mutton & Poultry Mandi',
        marketArea: 'Jiyaguda Wholesale Yard',
        distanceKm: '4.3 km',
        specialties: 'Biryani-Cut Goat, Tender Broiler, Chicken Lollipop',
        wholesaleRate: '₹205–₹720/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled dispatch 0–4 °C'
      },
      {
        name: 'Ramnagar Fresh Fish & Prawns Cold Depot',
        marketArea: 'Ramnagar Fish Market',
        distanceKm: '3.7 km',
        specialties: 'Korameenu, Rohu, Coastal Prawns',
        wholesaleRate: '₹230–₹590/kg',
        minOrderQty: '12 kg',
        coldChainNote: 'Ice-layered box 0–2 °C'
      },
      {
        name: 'Begum Bazar Chef Poultry & Eggs Co-op',
        marketArea: 'Begum Bazar',
        distanceKm: '3.1 km',
        specialties: 'Boneless Thigh, Whole Chicken, Bulk Eggs',
        wholesaleRate: '₹215–₹310/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'Insulated van 1–4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Bowenpally APMC Vegetable & Spice Yard',
        marketArea: 'Bowenpally Market Yard',
        distanceKm: '5.9 km',
        specialties: 'Onions, Tomatoes, Green Chillies, Mint & Ginger',
        wholesaleRate: '₹25–₹105/kg',
        minOrderQty: '25 kg',
        deliveryWindow: 'Morning 05:00–08:30 IST'
      },
      {
        name: 'Begum Bazar Ghee, Cashew & Kirana Hub',
        marketArea: 'Begum Bazar Lane',
        distanceKm: '3.0 km',
        specialties: 'Biryani Spices, Saffron, Cow Ghee, Sunflower Oil',
        wholesaleRate: '₹120–₹780/kg',
        minOrderQty: '20 kg / L',
        deliveryWindow: 'Morning 07:30–11:30 IST'
      },
      {
        name: 'Malakpet Sona Masoori & Grain Wholesale',
        marketArea: 'Malakpet Gunj',
        distanceKm: '4.8 km',
        specialties: 'Aged Basmati, Sona Masoori Rice, Toor Dal',
        wholesaleRate: '₹52–₹128/kg',
        minOrderQty: '50 kg',
        deliveryWindow: 'Same-day bulk delivery'
      }
    ]
  },
  chennai: {
    cityLabel: 'Chennai, TN',
    meatWholesalers: [
      {
        name: 'Chintadripet Meat & Poultry Wholesale Market',
        marketArea: 'Chintadripet',
        distanceKm: '2.9 km',
        specialties: 'Curry-Cut Chicken, Tender Goat, Keema',
        wholesaleRate: '₹210–₹730/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled crate 0–4 °C'
      },
      {
        name: 'Kasimedu Fishing Harbour B2B Seafood Supply',
        marketArea: 'Royapuram / Kasimedu',
        distanceKm: '5.6 km',
        specialties: 'Seer Fish (Vanjaram), Crab, Tiger Prawns',
        wholesaleRate: '₹310–₹860/kg',
        minOrderQty: '12 kg',
        coldChainNote: 'Crushed-ice box 0–2 °C'
      },
      {
        name: 'Periamet Hygienic Poultry Cold Hub',
        marketArea: 'Periamet',
        distanceKm: '3.5 km',
        specialties: 'Boneless Fillet, Drumsticks, Wings',
        wholesaleRate: '₹225–₹315/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'Cold room dispatch < 4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Koyambedu Wholesale Produce & Vegetable Market',
        marketArea: 'Koyambedu Market Complex',
        distanceKm: '6.2 km',
        specialties: 'Small Shallots, Tomatoes, Ginger, Curry Leaves',
        wholesaleRate: '₹28–₹115/kg',
        minOrderQty: '25 kg',
        deliveryWindow: 'Morning 04:30–08:00 IST'
      },
      {
        name: 'Kothawal Chavadi Bulk Spice & Dal Traders',
        marketArea: 'George Town / Kothawal Chavadi',
        distanceKm: '3.3 km',
        specialties: 'Idli Rice, Urad Dal, Toor Dal, Tamarind',
        wholesaleRate: '₹48–₹142/kg',
        minOrderQty: '50 kg',
        deliveryWindow: 'Morning 06:30–10:00 IST'
      },
      {
        name: 'Parrys Corner Cooking Oil & Grain Syndicate',
        marketArea: 'Parrys Corner',
        distanceKm: '3.8 km',
        specialties: 'Gingelly Oil, Refined Oil, Ponni Rice, Ghee',
        wholesaleRate: '₹115–₹490/L or kg',
        minOrderQty: '20 L / kg',
        deliveryWindow: 'Same-day B2B slot'
      }
    ]
  },
  pune: {
    cityLabel: 'Pune, MH',
    meatWholesalers: [
      {
        name: 'Camp Shivaji Market Poultry & Mutton B2B',
        marketArea: 'MG Road / Camp',
        distanceKm: '2.7 km',
        specialties: 'Boneless Chicken, Curry-Cut Mutton, Keema',
        wholesaleRate: '₹215–₹720/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled carrier 0–4 °C'
      },
      {
        name: 'Ganesh Peth Wholesale Fish & Cold-Cut Hub',
        marketArea: 'Ganesh Peth',
        distanceKm: '3.4 km',
        specialties: 'Surmai, Rohu, Prawns, Marinated Cuts',
        wholesaleRate: '₹260–₹790/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Ice-slurry 0–2 °C'
      },
      {
        name: 'Kondhwa Hygienic Chicken & Kheema Depot',
        marketArea: 'Kondhwa Budruk',
        distanceKm: '5.1 km',
        specialties: 'Broiler Whole, Breast Fillet, Wings',
        wholesaleRate: '₹205–₹295/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'FSSAI chilled crate 1–4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Gultekdi Market Yard APMC Grain & Onion Hub',
        marketArea: 'Market Yard, Gultekdi',
        distanceKm: '4.5 km',
        specialties: 'Onions, Potatoes, Indrayani Rice, Tur Dal',
        wholesaleRate: '₹24–₹125/kg',
        minOrderQty: '30 kg',
        deliveryWindow: 'Morning 05:30–08:30 IST'
      },
      {
        name: 'Bhavani Peth Dry Goods & Oil Merchants',
        marketArea: 'Bhavani Peth',
        distanceKm: '3.2 km',
        specialties: 'Besan, Groundnut Oil, Poha, Sugar',
        wholesaleRate: '₹44–₹165/kg',
        minOrderQty: '25 kg',
        deliveryWindow: 'Morning 07:00–11:00 IST'
      },
      {
        name: 'Ravivar Peth Whole Masala & Pulse Traders',
        marketArea: 'Ravivar Peth',
        distanceKm: '2.8 km',
        specialties: 'Kanda-Lasun Masala Base, Whole Spices, Ghee',
        wholesaleRate: '₹190–₹540/kg',
        minOrderQty: '15 kg',
        deliveryWindow: 'Same-day afternoon drop'
      }
    ]
  },
  kolkata: {
    cityLabel: 'Kolkata, WB',
    meatWholesalers: [
      {
        name: 'New Market Hogg Meat & Poultry Arcade',
        marketArea: 'Esplanade / New Market',
        distanceKm: '2.4 km',
        specialties: 'Biryani Mutton, Country & Broiler Chicken Cuts',
        wholesaleRate: '₹210–₹740/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled container 0–4 °C'
      },
      {
        name: 'Howrah Paikari Fish & Prawn Wholesale Mandi',
        marketArea: 'Howrah Fish Market',
        distanceKm: '4.9 km',
        specialties: 'Bhetki Fillet, Rohu, Katla, Bagda Chingri',
        wholesaleRate: '₹230–₹760/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'Flake-ice insulated van 0–2 °C'
      },
      {
        name: 'Park Circus Prime Cuts Cold-Chain Supply',
        marketArea: 'Park Circus',
        distanceKm: '3.6 km',
        specialties: 'Halal Goat Chops, Reshmi Kabab Strips',
        wholesaleRate: '₹235–₹725/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Cold-chain dispatch 1–4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Posta Bazar Mustard Oil, Dal & Rice Exchange',
        marketArea: 'Posta Bazar',
        distanceKm: '4.1 km',
        specialties: 'Kachi Ghani Mustard Oil, Gobindobhog Rice, Dal',
        wholesaleRate: '₹62–₹168/kg or L',
        minOrderQty: '50 kg / L',
        deliveryWindow: 'Morning 06:00–10:00 IST'
      },
      {
        name: 'Koley Market Fresh Produce & Potato Yard',
        marketArea: 'Sealdah / Koley Market',
        distanceKm: '2.9 km',
        specialties: 'Chandramukhi Potatoes, Onions, Ginger & Chillies',
        wholesaleRate: '₹22–₹95/kg',
        minOrderQty: '30 kg',
        deliveryWindow: 'Early morning 04:30–07:30 IST'
      },
      {
        name: 'Burrabazar Bulk Spice & Besan Traders',
        marketArea: 'Burrabazar',
        distanceKm: '3.8 km',
        specialties: 'Panch Phoron, Besan, Whole Garam Masala, Ghee',
        wholesaleRate: '₹85–₹640/kg',
        minOrderQty: '20 kg',
        deliveryWindow: 'Same-day B2B delivery'
      }
    ]
  },
  kochi: {
    cityLabel: 'Kochi, KL',
    meatWholesalers: [
      {
        name: 'Ernakulam Broadway Poultry & Meat Cuts',
        marketArea: 'Broadway Market, Ernakulam',
        distanceKm: '2.6 km',
        specialties: 'Broiler Curry Cuts, Tender Goat, Beef Fry Cuts',
        wholesaleRate: '₹205–₹680/kg',
        minOrderQty: '10 kg',
        coldChainNote: 'Chilled dispatch 0–4 °C'
      },
      {
        name: 'Thoppumpady Harbour Fish & Seafood Co-op',
        marketArea: 'Thoppumpady Fishing Harbour',
        distanceKm: '5.3 km',
        specialties: 'Karimeen, Seer Fish, Malabar Prawns, Squid',
        wholesaleRate: '₹290–₹840/kg',
        minOrderQty: '12 kg',
        coldChainNote: 'Ice-slurry crate 0–2 °C'
      },
      {
        name: 'Kaloor Hygienic Cold-Cut Chicken Supply',
        marketArea: 'Kaloor',
        distanceKm: '3.4 km',
        specialties: 'Skinless Boneless Strips, Drumsticks, Wings',
        wholesaleRate: '₹220–₹305/kg',
        minOrderQty: '15 kg',
        coldChainNote: 'FSSAI refrigerated transport < 4 °C'
      }
    ],
    groceryWholesalers: [
      {
        name: 'Ernakulam Market Vegetable & Produce Hub',
        marketArea: 'Market Road, Ernakulam',
        distanceKm: '2.3 km',
        specialties: 'Shallots, Curry Leaves, Ginger, Banana Leaves',
        wholesaleRate: '₹30–₹120/kg',
        minOrderQty: '20 kg',
        deliveryWindow: 'Morning 05:00–08:30 IST'
      },
      {
        name: 'Mattancherry Pepper, Spice & Coconut Oil Hub',
        marketArea: 'Mattancherry Spice Street',
        distanceKm: '4.8 km',
        specialties: 'Tellicherry Black Pepper, Cold-Pressed Coconut Oil',
        wholesaleRate: '₹195–₹680/kg or L',
        minOrderQty: '15 kg / L',
        deliveryWindow: 'Morning 07:30–11:30 IST'
      },
      {
        name: 'Maradu APMC Rice & Lentil Wholesale Yard',
        marketArea: 'Maradu',
        distanceKm: '6.1 km',
        specialties: 'Matta Rice, Kaima Biryani Rice, Toor & Urad Dal',
        wholesaleRate: '₹49–₹132/kg',
        minOrderQty: '50 kg',
        deliveryWindow: 'Same-day B2B van'
      }
    ]
  }
};

function getCityWholesaleData(city = 'Bengaluru, KA') {
  const lower = String(city || '').toLowerCase();
  const matchedKey = Object.keys(CITY_WHOLESALE_DIRECTORY).find((k) => lower.includes(k));
  return CITY_WHOLESALE_DIRECTORY[matchedKey || 'bengaluru'];
}

/**
 * Execute Gemini analysis using official @google/genai SDK with gemini-2.5-flash
 */
export async function generateAIAnalysis(promptText, systemInstruction = ECOPULSE_SYSTEM_INSTRUCTION) {
  const ai = getAIClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });
      return response.text;
    } catch (err) {
      console.warn('⚠️ [Gemini] Live API call failed, using intelligent analytical fallback:', err.message);
    }
  }

  // Resilient contextual fallback synthesizer if API key is not configured or network blocked
  return null;
}

/**
 * Contextual fallback generator synthesizing insights directly from actual inventory, waste, and weather forecast
 */
export function generateSmartLocalForecast(
  inventory = [],
  wasteLogs = [],
  weatherInput = {},
  question = '',
  businessType = 'Restaurant / Cloud Kitchen / Darshini'
) {
  const now = new Date();
  const city = weatherInput?.city || 'Bengaluru, KA';
  const condition = weatherInput?.condition || 'Pleasant & Dry';
  const tempC = Number.isFinite(Number(weatherInput?.tempC)) ? Number(weatherInput.tempC) : 24;
  const humidity = Number.isFinite(Number(weatherInput?.humidity)) ? Number(weatherInput.humidity) : 58;

  const isMonsoon =
    /rain|monsoon|shower|storm|drizzle/i.test(condition) || (humidity >= 76 && tempC <= 29);
  const isHot =
    /heat|hot|summer|sunny|warm/i.test(condition) || tempC >= 32;
  const isHumid =
    !isMonsoon && (/humid|coastal|muggy|overcast/i.test(condition) || humidity >= 70);

  let weatherImpactSummary =
    'Cool, moderate dry air supports strong dine-in demand and stretches ambient root & grain storage life.';
  if (isMonsoon) {
    weatherImpactSummary =
      'High moisture & cool rain sharply raise fungal spoilage risks on open grains/spices while boosting demand for hot snacks, ginger chai, and comforting gravies.';
  } else if (isHot) {
    weatherImpactSummary =
      'Elevated ambient heat accelerates dairy and prep spoilage—enforce strict < 4 °C cold-chain discipline while stocking up on cooling curd, citrus, and hydration produce.';
  } else if (isHumid) {
    weatherImpactSummary =
      'Persistent coastal humidity increases clumping and mold risk in bakery & dry goods; seal dry bins airtight and lean into fresh chilled dairy and spiced coastal dishes.';
  }

  // Find expiring items (<= 3 days) vs long-shelf items
  const expiringSoon = inventory.filter((item) => {
    const diff = (new Date(item.expiration_date) - now) / (1000 * 60 * 60 * 24);
    return diff <= 3 && Number(item.quantity) > 0;
  });

  const longShelfCandidates = inventory.filter((item) => {
    const diffDays = (new Date(item.expiration_date) - now) / (1000 * 60 * 60 * 24);
    const name = (item.item_name || '').toLowerCase();
    const isPerishablePrepared = ['Prepared Foods', 'Meat & Poultry', 'Bakery'].includes(
      item.category
    );
    if (isPerishablePrepared || diffDays < 4 || Number(item.quantity) <= 0) {
      return false;
    }
    const isDurableName = /rice|dal|lentil|flour|atta|besan|ghee|oil|spice|sugar|tea|coffee|onion|potato|garlic|pumpkin|uht/.test(
      name
    );
    return item.category === 'Dry Goods' || diffDays >= 7 || isDurableName;
  });

  const longShelfLifeItems = longShelfCandidates.slice(0, 3).map((item) => {
    const isDry = item.category === 'Dry Goods';
    const isDairy = item.category === 'Dairy';
    const duration = isDry
      ? isMonsoon || isHumid
        ? '60–120 days (airtight)'
        : '120–180 days'
      : isDairy
      ? '14–30 days (sealed chill)'
      : '14–28 days';

    let storageAdvice = 'Keep in a dry, ventilated pantry below 24 °C away from stove steam.';
    if (isDry && (isMonsoon || isHumid)) {
      storageAdvice =
        'Transfer to food-grade airtight bins with desiccant packs below 55% RH to stop moisture clumping.';
    } else if (isDairy) {
      storageAdvice = `Maintain strict cold-chain at 1–4 °C (ambient is ${tempC} °C); keep vacuum-sealed until batch prep.`;
    } else if (!isDry) {
      storageAdvice =
        'Store in perforated dark crates off the floor at 15–18 °C, separated from moisture-sensitive greens.';
    }

    return {
      item: item.item_name,
      currentStock: `${item.quantity} ${item.unit}`,
      safeStorageDuration: duration,
      storageAdvice
    };
  });

  // Add weather-resilient pantry staples if inventory yielded fewer than 3 long-shelf items
  const fallbackLongKeepers = [
    {
      item: 'Aged Basmati Rice & Toor/Moong Dal',
      currentStock: 'Dry Pantry Staple',
      safeStorageDuration: isMonsoon || isHumid ? '90–150 days' : '180+ days',
      storageAdvice: `Seal in gasketed HDPE drums (< 55% RH, 18–24 °C) with bay leaves to protect from ${humidity}% ambient humidity.`
    },
    {
      item: 'Red Onions, Potatoes & Whole Garlic',
      currentStock: 'Root Vegetable Crate',
      safeStorageDuration: '21–35 days',
      storageAdvice:
        'Keep in breathable bamboo/wire mesh racks below 22 °C; never seal in plastic bags during humid spells.'
    },
    {
      item: 'Pure Ghee, UHT Milk & Whole Spices',
      currentStock: 'Ambient / Cold Reserve',
      safeStorageDuration: '60–180 days',
      storageAdvice:
        'Whole unground spices and clarified ghee resist seasonal swings when kept away from direct heat.'
    }
  ];

  for (const staple of fallbackLongKeepers) {
    if (longShelfLifeItems.length >= 4) break;
    const alreadyExists = longShelfLifeItems.some((entry) =>
      entry.item.toLowerCase().includes(staple.item.split(' ')[0].toLowerCase())
    );
    if (!alreadyExists) {
      longShelfLifeItems.push(staple);
    }
  }

  let recommendedBuyMoreProducts = [];
  if (isMonsoon) {
    recommendedBuyMoreProducts = [
      {
        product: 'Fresh Ginger (Adrak) & Lemongrass',
        suggestedOrderQty: '+8 kg',
        weatherReason: `Rain at ${tempC} °C drives a ~35% spike in masala chai, kadha, and hot broth orders.`,
        estimatedShelfLife: '18–25 days (dry mesh rack)'
      },
      {
        product: 'Besan (Gram Flour) & Dry Lentils',
        suggestedOrderQty: '+20 kg',
        weatherReason: 'Monsoon rush increases demand for hot pakoras, bhajiyas, and comforting dal khichdi.',
        estimatedShelfLife: '90–120 days (airtight bin)'
      },
      {
        product: 'Assam CTC Tea Leaves & Filter Coffee',
        suggestedOrderQty: '+5 kg',
        weatherReason: 'Evening rain lifts beverage attachment rate across dine-in and delivery combos.',
        estimatedShelfLife: '150–180 days (sealed tin)'
      }
    ];
  } else if (isHot) {
    recommendedBuyMoreProducts = [
      {
        product: 'Fresh Curd (Dahi) & Chaas Base',
        suggestedOrderQty: '+25 L',
        weatherReason: `${tempC} °C heatwave surges lunchtime orders for lassi, masala chaas, and raita bowls.`,
        estimatedShelfLife: '5–7 days (< 4 °C chiller)'
      },
      {
        product: 'Kagzi Lemons & Fresh Mint (Pudina)',
        suggestedOrderQty: '+10 kg',
        weatherReason: 'High heat increases cold shikanji, mint cooler, and fresh chutney turnover.',
        estimatedShelfLife: '10–14 days (crisper)'
      },
      {
        product: 'Watermelon, Muskmelon & Cucumber',
        suggestedOrderQty: '+30 kg',
        weatherReason: 'Hydration salads and chilled fresh juices become top high-margin afternoon sellers.',
        estimatedShelfLife: '7–12 days (whole uncut)'
      }
    ];
  } else if (isHumid) {
    recommendedBuyMoreProducts = [
      {
        product: 'Vacuum-Packed Long-Grain Rice',
        suggestedOrderQty: '+25 kg',
        weatherReason: `Safe bulk buffer against ${humidity}% coastal humidity while stabilizing biryani & bowl food costs.`,
        estimatedShelfLife: '120–180 days (sealed)'
      },
      {
        product: 'Kokum Concentrate, Lemons & Ginger',
        suggestedOrderQty: '+12 kg',
        weatherReason: 'Humid coastal weather raises demand for digestive kokum-jeera coolers and tangy curries.',
        estimatedShelfLife: '20–30 days'
      },
      {
        product: 'Vacuum-Chilled Paneer Blocks',
        suggestedOrderQty: '+12 kg',
        weatherReason: 'High-turnover vegetarian protein with reliable cold-chain stability at 1–3 °C.',
        estimatedShelfLife: '14–21 days (< 4 °C)'
      }
    ];
  } else {
    recommendedBuyMoreProducts = [
      {
        product: 'Fresh Malai Paneer & Dairy Cream',
        suggestedOrderQty: '+15 kg',
        weatherReason: `Pleasant ${tempC} °C weather sustains strong evening dine-in and rich curry prep volume.`,
        estimatedShelfLife: '10–18 days (< 4 °C)'
      },
      {
        product: 'Seasonal Leafy Greens (Palak & Methi)',
        suggestedOrderQty: '+12 kg',
        weatherReason: 'Mild temperatures preserve leaf crispness longer, lifting healthy thali and saag orders.',
        estimatedShelfLife: '4–6 days (chilled bin)'
      },
      {
        product: 'Artisanal Pav, Kulcha & Sourdough Loaves',
        suggestedOrderQty: '+18 packs',
        weatherReason: 'Cool evenings boost cafe, pav bhaji, and grilled sandwich attachment rates.',
        estimatedShelfLife: '4–7 days (cool pantry)'
      }
    ];
  }

  const questionPrefix = question?.trim()
    ? `Answering "${question.trim()}": `
    : '';
  const assistantAnswer = `${questionPrefix}For ${city} (${condition}, ${tempC} °C, ${humidity}% RH), keep ${longShelfLifeItems
    .slice(0, 2)
    .map((i) => i.item)
    .join(' and ')} stored long-term, and increase procurement of ${recommendedBuyMoreProducts
    .slice(0, 2)
    .map((p) => `${p.product} (${p.suggestedOrderQty})`)
    .join(' and ')} to match upcoming weather demand.`;

  const predictedDemandWarnings = [];
  if (expiringSoon.length > 0) {
    expiringSoon.slice(0, 3).forEach((item) => {
      predictedDemandWarnings.push({
        item: item.item_name,
        reason: `Expires in ${Math.max(0, Math.ceil((new Date(item.expiration_date) - now) / (1000 * 60 * 60 * 24)))} days with ${item.quantity} ${item.unit} remaining in storage.`,
        recommendedAction: `Reduce re-order quantity by 25% on next cycle. Prioritize utilization in today's daily special or package for surplus donation.`
      });
    });
  } else {
    predictedDemandWarnings.push({
      item: inventory[0]?.item_name || 'Daily Produce',
      reason: 'Historical weekend foot-traffic fluctuation creates prep variance.',
      recommendedAction: 'Apply 15% safety buffer deduction on Friday morning prep orders.'
    });
  }

  const surplusRepurposingIdeas = [];
  const repurposingMap = {
    Bakery: 'Crisp into spiced Masala Khakhra bites, Shahi Tukda dessert trays, or bread upma breakfast specials.',
    Dairy: 'Convert into fresh chenna for Rasmalai, Paneer Bhurji / Tikka wraps, Mango Lassi, or slow-simmered Khoya.',
    Produce: 'Simmer into Bhuna Masala base gravy, quick-pickle into seasonal Achaar, or puree for Palak/Tamatar soup.',
    'Meat & Poultry': 'Marinate in spiced curd for Tandoori Tikka skewers, Keema Pav specials, or slow-cooked stock.',
    'Prepared Foods': 'Portion into FSSAI-sealed takeaway combos or partner immediately with local rescue kitchens.'
  };

  const sampleItems = expiringSoon.length > 0 ? expiringSoon : inventory.slice(0, 3);
  sampleItems.slice(0, 3).forEach((item) => {
    const idea =
      repurposingMap[item.category] ||
      'Repurpose into spiced chutneys, base gravies, or seasonal thali specials.';
    surplusRepurposingIdeas.push({
      ingredient: item.item_name,
      recipeIdea: idea
    });
  });

  const wholesaleEligible = isRestaurantEligibleForWholesale(businessType);
  const cityWholesale = getCityWholesaleData(city);
  const nearbyWholesaleSuppliers = wholesaleEligible
    ? {
        eligible: true,
        businessType,
        city: cityWholesale.cityLabel,
        meatWholesalers: cityWholesale.meatWholesalers,
        groceryWholesalers: cityWholesale.groceryWholesalers
      }
    : {
        eligible: false,
        businessType,
        city: cityWholesale.cityLabel,
        meatWholesalers: [],
        groceryWholesalers: []
      };

  const totalExpiringQty = expiringSoon.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
  const carbonEstimate = (totalExpiringQty * 2.8).toFixed(1);

  return {
    summary: `EcoPulse AI analyzed ${inventory.length} active inventory items and ${wasteLogs.length} historical waste records under ${city} weather (${condition}, ${tempC} °C, ${humidity}% RH). Identified ${longShelfLifeItems.length} long-shelf items and ${recommendedBuyMoreProducts.length} weather-demand buys, while flagging ${expiringSoon.length} near-expiry batches to avoid ₹${(totalExpiringQty * 165).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in potential loss.`,
    assistantAnswer,
    weatherContext: {
      city,
      condition,
      temperatureC: tempC,
      humidityPercent: humidity,
      weatherImpactSummary
    },
    longShelfLifeItems,
    recommendedBuyMoreProducts,
    nearbyWholesaleSuppliers,
    predictedDemandWarnings,
    surplusRepurposingIdeas,
    carbonReductionTip: `Timely cold-chain adjustment (${isHot ? 'below 4 °C' : 'optimized dry storage'}) and batch diversion prevent ~${carbonEstimate} kg CO2e emissions, protecting margins by up to 18%.`
  };
}

/**
 * Intelligent Surplus Redistribution Matchmaker
 */
export function generateSmartSurplusMatches(surplusItems = []) {
  const localPartners = [
    {
      partnerName: "Robin Hood Army - Local City Chapter",
      partnerType: "Food Bank",
      distance: "2.4 km",
      acceptedCategories: ["Produce", "Bakery", "Dry Goods", "Prepared Foods"],
      intakeHours: "Pickup 17:00 - 21:30 IST",
      taxEligible: true
    },
    {
      partnerName: "Feeding India (Zomato NGO Partner)",
      partnerType: "Shelter Pantry",
      distance: "3.1 km",
      acceptedCategories: ["Prepared Foods", "Dairy", "Bakery"],
      intakeHours: "Open 24/7 for FSSAI-compliant drop-offs",
      taxEligible: true
    },
    {
      partnerName: "Hasiru Dala Bio-Compost & Biogas Hub",
      partnerType: "Composting Partner",
      distance: "4.5 km",
      acceptedCategories: ["Produce", "Bakery", "Dry Goods"],
      intakeHours: "Collection bins open daily 07:00 - 20:00 IST",
      taxEligible: false
    },
    {
      partnerName: "Akshaya Patra Community Meals Kitchen",
      partnerType: "Soup Kitchen",
      distance: "5.2 km",
      acceptedCategories: ["Meat & Poultry", "Dairy", "Produce", "Prepared Foods"],
      intakeHours: "Intake 14:00 - 18:00 IST",
      taxEligible: true
    }
  ];

  const matches = [];

  surplusItems.forEach(item => {
    const matchedPartner = localPartners.find(p => p.acceptedCategories.includes(item.category)) || localPartners[0];
    const qty = Number(item.quantity || 5);
    const carbonOffset = (qty * 2.4).toFixed(1);

    matches.push({
      item: item.item_name || item.itemName,
      quantity: `${qty} ${item.unit || 'kg'}`,
      category: item.category,
      partnerName: matchedPartner.partnerName,
      partnerType: matchedPartner.partnerType,
      distance: matchedPartner.distance,
      urgency: new Date(item.expiration_date || item.expirationDate) <= new Date(Date.now() + 86400000) ? "High" : "Medium",
      matchedItems: [item.item_name || item.itemName],
      estimatedCarbonOffset: `${carbonOffset} kg CO2e`,
      logisticsNote: `${matchedPartner.intakeHours}. Cold-chain transport below 5 °C recommended.`
    });
  });

  return {
    matches,
    refrigerationGuidance: "Maintain FSSAI Save Food Share Food compliance: keep chilled perishables below 5 °C and hot-held items above 60 °C prior to handover.",
    taxDeductionEstimate: `Estimated tax deduction eligibility: ₹${(surplusItems.length * 3850).toLocaleString('en-IN')} under Section 80G of the Indian Income Tax Act & CSR provisions.`
  };
}
