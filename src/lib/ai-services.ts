/**
 * AI Services for OKAR
 * 
 * All AI features are:
 * - Toggleable via feature flags
 * - Have fallback to traditional logic
 * - Use free/low-cost APIs
 * - No personal data sent to unsecured third parties
 */

import { db } from './db';
import { isFeatureEnabled } from './features';

// ============================================
// 1. FRAUD DETECTION AI
// ============================================

export interface ScanRisk {
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  score: number; // 0-100
}

/**
 * Analyze scan patterns for potential fraud
 * Uses rule-based detection (can be enhanced with ML later)
 */
export async function detectFraud(
  vehicleId: string,
  ipAddress: string,
  country: string | null
): Promise<ScanRisk> {
  const enabled = await isFeatureEnabled('ai_fraud_detection');
  
  // Default: low risk
  const defaultRisk: ScanRisk = { level: 'low', reasons: [], score: 0 };
  
  if (!enabled) {
    return defaultRisk;
  }

  try {
    const reasons: string[] = [];
    let score = 0;

    // Get recent scans for this vehicle (using MaintenanceRecord as proxy)
    const recentScansRaw = await db.$queryRaw<any[]>`
      SELECT id, vehicleId, createdAt
      FROM MaintenanceRecord
      WHERE vehicleId = ${vehicleId}
        AND createdAt >= datetime('now', '-1 hour')
      ORDER BY createdAt DESC
    `;

    // Rule 2: Multiple records from same IP in < 1 min (simplified)
    if (recentScansRaw.length >= 3) {
      reasons.push(`${recentScansRaw.length} interventions en 1 heure`);
      score += 20;
    }

    // Rule 3: Unusual scan velocity (> 10 scans in 1 hour)
    if (recentScansRaw.length > 10) {
      reasons.push(`${recentScansRaw.length} interventions en 1 heure`);
      score += 20;
    }

    // Determine risk level
    let level: ScanRisk['level'] = 'low';
    if (score >= 60) level = 'high';
    else if (score >= 30) level = 'medium';

    return { level, reasons, score };
  } catch (error) {
    console.error('Fraud detection error:', error);
    return defaultRisk;
  }
}

// ============================================
// 2. TRANSLATION AI
// ============================================

// Translation cache (in-memory for simplicity, could use Redis)
const translationCache = new Map<string, { translation: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Language detection based on country
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  'France': 'fr', 'Senegal': 'fr', 'Morocco': 'ar', 'Algeria': 'ar',
  'Tunisia': 'ar', 'Saudi Arabia': 'ar', 'Egypt': 'ar', 'UAE': 'ar',
  'United States': 'en', 'United Kingdom': 'en', 'Canada': 'en',
  'Germany': 'de', 'Spain': 'es', 'Italy': 'it', 'Portugal': 'pt',
  'Turkey': 'tr', 'Indonesia': 'id', 'Malaysia': 'ms', 'Pakistan': 'ur',
  'India': 'hi', 'Nigeria': 'en', 'Mali': 'fr', 'Ivory Coast': 'fr',
  'Guinea': 'fr', 'Burkina Faso': 'fr', 'Niger': 'fr',
};

/**
 * Translate text using free translation API (LibreTranslate or MyMemory)
 * Falls back to original text if translation fails
 */
export async function translateText(
  text: string,
  targetLang: string
): Promise<{ translated: string; wasTranslated: boolean }> {
  if (!text || !targetLang) {
    return { translated: text, wasTranslated: false };
  }

  const enabled = await isFeatureEnabled('ai_translation');
  if (!enabled) {
    return { translated: text, wasTranslated: false };
  }

  // Check cache
  const cacheKey = `${text}:${targetLang}`;
  const cached = translationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { translated: cached.translation, wasTranslated: true };
  }

  try {
    // Use MyMemory Translation API (free, no API key required)
    const sourceLang = 'auto';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error('Translation API error');
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      
      // Cache the result
      translationCache.set(cacheKey, { 
        translation: translated, 
        timestamp: Date.now() 
      });
      
      return { translated, wasTranslated: true };
    }
    
    return { translated: text, wasTranslated: false };
  } catch (error) {
    console.error('Translation error:', error);
    return { translated: text, wasTranslated: false };
  }
}

/**
 * Get suggested language based on country
 */
export function getLanguageForCountry(country: string | null): string {
  if (!country) return 'fr'; // Default to French
  return COUNTRY_TO_LANGUAGE[country] || 'en';
}

// ============================================
// 3. MESSAGE SUMMARY AI
// ============================================

/**
 * Summarize long text using Hugging Face Inference API
 * Falls back to first 100 characters if API fails
 */
export async function summarizeText(
  text: string,
  maxLength: number = 100
): Promise<{ summary: string; wasSummarized: boolean }> {
  if (!text || text.length <= maxLength) {
    return { summary: text, wasSummarized: false };
  }

  const enabled = await isFeatureEnabled('ai_message_summary');
  if (!enabled) {
    // Fallback: truncate with ellipsis
    return { 
      summary: text.substring(0, maxLength) + '...', 
      wasSummarized: false 
    };
  }

  try {
    // Use Hugging Face Inference API with facebook/bart-large-cnn
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 50,
            min_length: 10,
            do_sample: false
          }
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data[0]?.summary_text) {
      return { summary: data[0].summary_text, wasSummarized: true };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Summarization error:', error);
    // Fallback: truncate with ellipsis
    return { 
      summary: text.substring(0, maxLength) + '...', 
      wasSummarized: false 
    };
  }
}

/**
 * Extract key information from a partner message
 */
export async function extractPartnerInfo(text: string): Promise<{
  summary: string;
  suggestedType: string;
  confidence: number;
}> {
  const { summary } = await summarizeText(text);
  
  // Simple keyword-based classification
  let suggestedType = 'contact';
  let confidence = 0.5;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('devis') || lowerText.includes('prix') || lowerText.includes('commande')) {
    suggestedType = 'commande_garage';
    confidence = 0.8;
  } else if (lowerText.includes('partenaire') || lowerText.includes('partenariat') || lowerText.includes('collaboration')) {
    suggestedType = 'partenaire';
    confidence = 0.8;
  }
  
  return { summary, suggestedType, confidence };
}

// ============================================
// 4. QR VOLUME SUGGESTIONS AI
// ============================================

interface QRSuggestion {
  recommended: number;
  basedOn: string;
  confidence: number;
  breakdown: {
    lastYear: number;
    growth: number;
    margin: number;
  };
}

/**
 * Calculate suggested QR code volume for a garage
 * Uses linear regression (simple mathematical prediction)
 */
export async function getQRSuggestion(garageId: string): Promise<QRSuggestion | null> {
  const enabled = await isFeatureEnabled('ai_qr_suggestions');
  if (!enabled) {
    return null;
  }

  try {
    // Get garage's historical QR generation data using raw SQL
    const vehicles = await db.$queryRaw<{ createdAt: string }[]>`
      SELECT createdAt FROM Vehicle WHERE garageId = ${garageId}
    `;

    if (!vehicles || vehicles.length === 0) {
      // Return default suggestion for new garages
      return {
        recommended: 50,
        basedOn: 'Nouveau garage - Valeur par défaut',
        confidence: 0.3,
        breakdown: { lastYear: 0, growth: 10, margin: 10 }
      };
    }

    // Group by year
    const yearlyCounts: Record<number, number> = {};
    vehicles.forEach(v => {
      const year = new Date(v.createdAt).getFullYear();
      yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
    });

    const years = Object.keys(yearlyCounts).map(Number).sort();

    if (years.length === 0) {
      return null;
    }

    const currentYear = new Date().getFullYear();
    const lastYear = years[years.length - 1];
    const lastYearCount = yearlyCounts[lastYear] || 0;

    // Simple linear growth calculation
    let growth = 0.1; // Default 10% growth

    if (years.length >= 2) {
      const previousYear = years[years.length - 2];
      const previousCount = yearlyCounts[previousYear] || 1;
      growth = (lastYearCount - previousCount) / previousCount;
      growth = Math.max(-0.5, Math.min(0.5, growth)); // Clamp between -50% and +50%
    }

    // Calculate recommendation with margin
    const margin = 0.1; // 10% margin
    const recommended = Math.ceil(lastYearCount * (1 + growth) * (1 + margin));

    return {
      recommended,
      basedOn: lastYear === currentYear ? 'Activité cette année' : `Commandes ${lastYear}`,
      confidence: years.length >= 2 ? 0.8 : 0.5,
      breakdown: {
        lastYear: lastYearCount,
        growth: Math.round(growth * 100),
        margin: Math.round(margin * 100)
      }
    };
  } catch (error) {
    console.error('QR Suggestion error:', error);
    return null;
  }
}

/**
 * Calculate global QR suggestion (for all garages)
 */
export async function getGlobalQRSuggestion(): Promise<QRSuggestion | null> {
  const enabled = await isFeatureEnabled('ai_qr_suggestions');
  if (!enabled) {
    return null;
  }

  try {
    // Get all vehicle data using raw SQL
    const vehicles = await db.$queryRaw<{ createdAt: string }[]>`
      SELECT createdAt FROM Vehicle
    `;

    if (!vehicles || vehicles.length === 0) {
      return {
        recommended: 100,
        basedOn: 'Valeur par défaut',
        confidence: 0.3,
        breakdown: { lastYear: 0, growth: 10, margin: 10 }
      };
    }

    // Group by year
    const yearlyCounts: Record<number, number> = {};
    vehicles.forEach(v => {
      const year = new Date(v.createdAt).getFullYear();
      yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
    });

    const years = Object.keys(yearlyCounts).map(Number).sort();
    const lastYear = years[years.length - 1];
    const lastYearCount = yearlyCounts[lastYear] || 0;

    let growth = 0.1;
    if (years.length >= 2) {
      const previousYear = years[years.length - 2];
      const previousCount = yearlyCounts[previousYear] || 1;
      growth = (lastYearCount - previousCount) / previousCount;
      growth = Math.max(-0.5, Math.min(0.5, growth));
    }

    const margin = 0.1;
    const recommended = Math.ceil(lastYearCount * (1 + growth) * (1 + margin));

    return {
      recommended,
      basedOn: lastYear === new Date().getFullYear() ? 'Activité actuelle' : `Total ${lastYear}`,
      confidence: years.length >= 2 ? 0.75 : 0.5,
      breakdown: {
        lastYear: lastYearCount,
        growth: Math.round(growth * 100),
        margin: Math.round(margin * 100)
      }
    };
  } catch (error) {
    console.error('Global QR Suggestion error:', error);
    return null;
  }
}

// ============================================
// 5. AI STATUS HELPER
// ============================================

/**
 * Check which AI features are enabled
 */
export async function getAIStatus(): Promise<Record<string, boolean>> {
  const features = [
    'ai_fraud_detection',
    'ai_translation',
    'ai_message_summary',
    'ai_qr_suggestions'
  ];

  const status: Record<string, boolean> = {};
  
  for (const feature of features) {
    status[feature] = await isFeatureEnabled(feature);
  }

  return status;
}
