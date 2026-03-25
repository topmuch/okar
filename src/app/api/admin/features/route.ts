import { NextRequest, NextResponse } from 'next/server';

// Feature definitions inline
const FEATURE_DEFINITIONS = [
  {
    key: 'whatsapp_automated',
    label: 'Envoi WhatsApp automatisé',
    description: 'Envoie les messages via API (Green API) au lieu d\'ouvrir wa.me. Nécessite une configuration API.',
    category: 'communication',
    icon: 'MessageSquare',
    enabled: false,
  },
  {
    key: 'geolocation_advanced',
    label: 'Géolocalisation avancée',
    description: 'Convertit les coordonnées GPS en adresse lisible via Nominatim ou Google Maps API.',
    category: 'geolocation',
    icon: 'MapPin',
    enabled: false,
  },
  {
    key: 'pdf_stickers',
    label: 'PDF stickers professionnels',
    description: 'Génère des PDF avec logo, polices embeddées, QR centré pour impression professionnelle.',
    category: 'export',
    icon: 'FileText',
    enabled: false,
  },
  {
    key: 'push_notifications',
    label: 'Notifications push',
    description: 'Envoie des alertes SMS/WhatsApp aux chefs d\'agence quand un bagage est trouvé.',
    category: 'notifications',
    icon: 'Bell',
    enabled: false,
  },
  {
    key: 'multilingual',
    label: 'Multilingue dynamique',
    description: 'Affiche la page trouveur en français/anglais/arabe selon le pays du visiteur.',
    category: 'general',
    icon: 'Globe',
    enabled: true,
  },
  {
    key: 'analytics_dashboard',
    label: 'Dashboard analytiques',
    description: 'Statistiques avancées avec graphiques de scans par pays, période, et type de bagage.',
    category: 'general',
    icon: 'BarChart3',
    enabled: false,
  },
  {
    key: 'bulk_import',
    label: 'Import en masse CSV',
    description: 'Permet d\'importer des listes de voyageurs via fichier CSV pour générer les QR en lot.',
    category: 'general',
    icon: 'Upload',
    enabled: false,
  },
  {
    key: 'api_webhooks',
    label: 'Webhooks API',
    description: 'Envoie des notifications à des URLs externes quand des événements se produisent (scan, perte, etc.).',
    category: 'integration',
    icon: 'Webhook',
    enabled: false,
  },
  {
    key: 'ai_fraud_detection',
    label: 'Détection de fraude IA',
    description: '🤖 Détecte les scans suspects (multiples IPs, pays différents) et affiche des alertes.',
    category: 'ai',
    icon: 'Shield',
    enabled: false,
  },
  {
    key: 'ai_translation',
    label: 'Traduction automatique IA',
    description: '🤖 Traduit automatiquement les messages WhatsApp dans la langue du propriétaire.',
    category: 'ai',
    icon: 'Languages',
    enabled: false,
  },
];

// In-memory feature flags (simple solution without database)
let featureFlags = [...FEATURE_DEFINITIONS];

// GET - Fetch all feature flags
export async function GET() {
  const categories: Record<string, typeof featureFlags> = {};
  featureFlags.forEach((flag) => {
    if (!categories[flag.category]) {
      categories[flag.category] = [];
    }
    categories[flag.category].push(flag);
  });

  return NextResponse.json({
    flags: featureFlags,
    categories,
    categoryLabels: {
      general: 'Général',
      communication: 'Communication',
      geolocation: 'Géolocalisation',
      export: 'Export & Documents',
      notifications: 'Notifications',
      integration: 'Intégrations',
      ai: '🤖 Intelligence Artificielle',
    }
  });
}

// PUT - Toggle a feature flag
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, enabled } = body;

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Clé et valeur enabled requis' },
        { status: 400 }
      );
    }

    const flagIndex = featureFlags.findIndex(f => f.key === key);
    if (flagIndex >= 0) {
      featureFlags[flagIndex] = { ...featureFlags[flagIndex], enabled };
      return NextResponse.json({ success: true, flag: featureFlags[flagIndex] });
    }

    return NextResponse.json(
      { error: 'Fonctionnalité inconnue' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
