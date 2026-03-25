import { NextRequest, NextResponse } from 'next/server';

// Default settings (in-memory)
let appSettings: Record<string, string> = {
  // Company Info
  company_name: 'OKAR',
  company_address: 'Dakar, Sénégal',
  company_phone: '+221 77 000 00 00',
  company_email: 'contact@okar.sn',
  company_logo: '',
  // SEO
  seo_title: 'OKAR - Protection intelligente des véhicules',
  seo_description: 'Gérez vos véhicules avec un système QR intelligent.',
  seo_keywords: 'QR, véhicule, garage, maintenance, sénégal',
  seo_image: '',
  // Localization
  languages: 'fr,en',
  default_language: 'fr',
  currency: 'XOF',
};

// GET - Get all settings
export async function GET() {
  return NextResponse.json({ settings: appSettings });
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    // Update settings in memory
    for (const [key, value] of Object.entries(settings)) {
      appSettings[key] = String(value);
    }

    return NextResponse.json({ success: true, settings: appSettings });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
