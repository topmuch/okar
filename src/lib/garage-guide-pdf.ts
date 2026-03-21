/**
 * ================================================
 * OKAR Garage Onboarding Guide Generator
 * ================================================
 * 
 * Génère un guide de démarrage HTML pour les nouveaux garages
 * Peut être imprimé ou converti en PDF
 */

export interface GarageGuideData {
  garageName: string;
  managerName: string;
  email: string;
  phone: string;
  address: string;
  loginUrl: string;
  generatedAt: Date;
}

/**
 * Génère le HTML du guide de démarrage
 */
export function generateGarageGuideHtml(data: GarageGuideData): string {
  const formattedDate = data.generatedAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide de Démarrage OKAR - ${data.garageName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .cover {
      text-align: center;
      padding: 60px 0;
      page-break-after: always;
    }
    
    .cover-header {
      background: linear-gradient(135deg, #ff6600, #ff8533);
      margin: -40px -40px 40px -40px;
      padding: 60px 40px;
      color: white;
    }
    
    .logo {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 10px;
    }
    
    .tagline {
      font-size: 16px;
      opacity: 0.9;
      letter-spacing: 1px;
    }
    
    .cover-title {
      font-size: 32px;
      font-weight: 700;
      margin: 40px 0 10px 0;
      color: #1e293b;
    }
    
    .cover-subtitle {
      font-size: 18px;
      color: #ff6600;
      font-weight: 600;
    }
    
    .garage-info {
      background: #f8fafc;
      border-radius: 12px;
      padding: 30px;
      margin: 40px auto;
      max-width: 400px;
      text-align: left;
    }
    
    .garage-info h3 {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    
    .garage-info p {
      margin-bottom: 8px;
    }
    
    .garage-info strong {
      color: #334155;
    }
    
    .generated-date {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 30px;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 22px;
      font-weight: 700;
      color: #ff6600;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ff6600;
    }
    
    .section-number {
      background: #ff6600;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    
    .credentials-box {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 2px solid #16a34a;
      border-radius: 12px;
      padding: 25px;
      margin: 20px 0;
    }
    
    .credentials-box h4 {
      color: #16a34a;
      font-size: 16px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .credential-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding: 10px 15px;
      background: white;
      border-radius: 8px;
    }
    
    .credential-label {
      font-weight: 600;
      color: #64748b;
      min-width: 120px;
    }
    
    .credential-value {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: #1e293b;
      background: #f1f5f9;
      padding: 5px 12px;
      border-radius: 6px;
      flex: 1;
    }
    
    .warning-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .warning-box h4 {
      color: #b45309;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .steps-list {
      list-style: none;
      counter-reset: step-counter;
    }
    
    .steps-list li {
      counter-increment: step-counter;
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 12px;
      border-left: 4px solid #ff6600;
    }
    
    .steps-list li::before {
      content: counter(step-counter);
      background: #ff6600;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .step-content h4 {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 5px;
    }
    
    .step-content p {
      color: #64748b;
      font-size: 14px;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .feature-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
    }
    
    .feature-card h4 {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .feature-card p {
      font-size: 13px;
      color: #64748b;
    }
    
    .advantages-list {
      list-style: none;
    }
    
    .advantages-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 15px;
      padding: 15px;
      background: #f0fdf4;
      border-radius: 10px;
    }
    
    .advantages-list .check {
      color: #16a34a;
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .contact-box {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
    }
    
    .contact-box h3 {
      color: #1d4ed8;
      margin-bottom: 20px;
    }
    
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin: 10px 20px;
      font-size: 16px;
    }
    
    .contact-item strong {
      color: #334155;
    }
    
    .footer {
      text-align: center;
      padding: 40px 0 0 0;
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-logo {
      font-size: 24px;
      font-weight: 800;
      color: #ff6600;
      letter-spacing: 2px;
    }
    
    .footer-text {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 10px;
    }
    
    @media print {
      body {
        background: white;
      }
      
      .page {
        box-shadow: none;
        padding: 0;
      }
      
      .cover-header {
        margin: -40px -40px 40px -40px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
    
    @media screen and (max-width: 768px) {
      .feature-grid {
        grid-template-columns: 1fr;
      }
      
      .page {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <!-- PAGE DE COUVERTURE -->
  <div class="page">
    <div class="cover">
      <div class="cover-header">
        <div class="logo">OKAR</div>
        <div class="tagline">Passeport Numérique Automobile</div>
      </div>
      
      <h1 class="cover-title">Guide de Démarrage</h1>
      <p class="cover-subtitle">Garage Certifié</p>
      
      <div class="garage-info">
        <h3>Informations du Garage</h3>
        <p><strong>Nom:</strong> ${data.garageName}</p>
        <p><strong>Gérant:</strong> ${data.managerName || 'Non spécifié'}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Téléphone:</strong> ${data.phone}</p>
        <p><strong>Adresse:</strong> ${data.address}</p>
      </div>
      
      <p class="generated-date">Document généré le ${formattedDate}</p>
    </div>
  </div>
  
  <!-- PAGE 2: IDENTIFIANTS -->
  <div class="page">
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">1</span>
        Vos Identifiants de Connexion
      </h2>
      
      <div class="credentials-box">
        <h4>🔐 Accédez à votre espace garage</h4>
        
        <div class="credential-item">
          <span class="credential-label">Lien de connexion</span>
          <span class="credential-value">${data.loginUrl}</span>
        </div>
        
        <div class="credential-item">
          <span class="credential-label">Email</span>
          <span class="credential-value">${data.email}</span>
        </div>
        
        <div class="credential-item">
          <span class="credential-label">Mot de passe</span>
          <span class="credential-value">[Envoyé par SMS/WhatsApp]</span>
        </div>
      </div>
      
      <div class="warning-box">
        <h4>⚠️ Sécurité</h4>
        <p>Pour votre sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion. Ne partagez jamais vos identifiants avec des tiers.</p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">2</span>
        Premières Étapes
      </h2>
      
      <ol class="steps-list">
        <li>
          <div class="step-content">
            <h4>Connectez-vous</h4>
            <p>Utilisez vos identifiants pour accéder à votre espace garage personnel.</p>
          </div>
        </li>
        <li>
          <div class="step-content">
            <h4>Complétez votre profil</h4>
            <p>Ajoutez votre logo, vos horaires d'ouverture, et vos services pour attirer plus de clients.</p>
          </div>
        </li>
        <li>
          <div class="step-content">
            <h4>Commandez vos QR codes</h4>
            <p>Commandez votre lot de QR codes OKAR pour commencer à activer les véhicules de vos clients.</p>
          </div>
        </li>
        <li>
          <div class="step-content">
            <h4>Enregistrez vos interventions</h4>
            <p>Documentez chaque réparation et entretien pour créer un historique certifié pour vos clients.</p>
          </div>
        </li>
      </ol>
    </div>
  </div>
  
  <!-- PAGE 3: FONCTIONNALITÉS -->
  <div class="page">
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">3</span>
        Vos Fonctionnalités
      </h2>
      
      <div class="feature-grid">
        <div class="feature-card">
          <h4>📊 Dashboard Garage</h4>
          <p>Visualisez vos statistiques, le nombre de véhicules actifs, les interventions en attente de validation, et vos revenus.</p>
        </div>
        
        <div class="feature-card">
          <h4>🚗 Gestion des Véhicules</h4>
          <p>Consultez l'historique complet des véhicules que vous avez servis, avec leurs fiches techniques et historiques d'entretien.</p>
        </div>
        
        <div class="feature-card">
          <h4>🔧 Enregistrement d'Interventions</h4>
          <p>Créez des rapports d'intervention détaillés avec photos, pièces utilisées, et coûts. Vos clients recevront une notification.</p>
        </div>
        
        <div class="feature-card">
          <h4>📱 Activation QR Code</h4>
          <p>Activez de nouveaux véhicules pour vos clients en leur attribuant un QR code OKAR unique.</p>
        </div>
        
        <div class="feature-card">
          <h4>👤 Inscription Conducteur</h4>
          <p>Inscrivez directement vos clients conducteurs et leurs véhicules depuis votre espace.</p>
        </div>
        
        <div class="feature-card">
          <h4>📦 Stock de QR Codes</h4>
          <p>Gérez votre inventaire de QR codes et suivez leur utilisation.</p>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">4</span>
        Avantages OKAR
      </h2>
      
      <ul class="advantages-list">
        <li>
          <span class="check">✅</span>
          <span>Visibilité accrue sur la carte OKAR et dans les recherches</span>
        </li>
        <li>
          <span class="check">✅</span>
          <span>Certification officielle renforçant la confiance des clients</span>
        </li>
        <li>
          <span class="check">✅</span>
          <span>Historique certifié des interventions pour vos clients</span>
        </li>
        <li>
          <span class="check">✅</span>
          <span>Notifications automatiques pour vos clients (rappels VT, assurance)</span>
        </li>
        <li>
          <span class="check">✅</span>
          <span>Gestion simplifiée de votre portefeuille clients</span>
        </li>
        <li>
          <span class="check">✅</span>
          <span>Support technique dédié</span>
        </li>
      </ul>
    </div>
  </div>
  
  <!-- PAGE 4: CONTACT -->
  <div class="page">
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">5</span>
        Besoin d'aide ?
      </h2>
      
      <div class="contact-box">
        <h3>Notre équipe est là pour vous accompagner</h3>
        
        <div class="contact-item">
          <strong>📱 WhatsApp / Téléphone:</strong>
          <span>+221 78 123 45 67</span>
        </div>
        
        <div class="contact-item">
          <strong>📧 Email:</strong>
          <span>support@okar.sn</span>
        </div>
        
        <div class="contact-item">
          <strong>🌐 Site Web:</strong>
          <span>www.okar.sn</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">OKAR</div>
      <p class="footer-text">Le passeport numérique automobile du Sénégal</p>
      <p style="color: #ff6600; font-weight: 600; margin-top: 20px; font-size: 18px;">
        Bienvenue dans le réseau OKAR !
      </p>
      <p style="color: #64748b; margin-top: 10px;">
        Ensemble, construisons l'avenir de l'automobile au Sénégal.
      </p>
    </div>
  </div>
  
  <script>
    // Auto-print option (uncomment if needed)
    // setTimeout(() => window.print(), 1000);
  </script>
</body>
</html>
  `;
}

/**
 * Ouvre le guide dans une nouvelle fenêtre pour impression
 */
export function printGarageGuide(data: GarageGuideData): Window | null {
  const html = generateGarageGuideHtml(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
  
  return printWindow;
}

/**
 * Génère le nom de fichier pour le guide
 */
export function getGuideFilename(garageName: string): string {
  const sanitizedName = garageName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `guide-demarrage-okar-${sanitizedName}.html`;
}

const garageGuideUtils = {
  generateGarageGuideHtml,
  printGarageGuide,
  getGuideFilename,
};

export default garageGuideUtils;
