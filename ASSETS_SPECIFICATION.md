# 🎨 OKAR Homepage - Spécification des Assets Visuels

## 📁 Structure des Dossiers

```
/public/
├── hero-car.jpg              # Image hero background
├── hero-car.mp4              # Vidéo hero (optionnel)
├── circuit-pattern.svg       # Motif circuit imprimé
├── fonts/
│   └── ClashDisplay-Variable.woff2
├── logos/
│   ├── total.svg
│   ├── oryx.svg
│   ├── axa.svg
│   ├── saham.svg
│   ├── autoplus.svg
│   └── moderne.svg
├── illustrations/
│   ├── buyer-illustration.svg
│   ├── owner-illustration.svg
│   └── mechanic-illustration.svg
└── icons/
    ├── orange-money.svg
    ├── wave.svg
    ├── cinetpay.svg
    └── free-money.svg
```

---

## 🖼️ Détail des Assets

### 1. HERO SECTION

#### `hero-car.jpg` / `hero-car.mp4`
- **Description** : Voiture de luxe (SUV type Toyota Land Cruiser ou Range Rover) traversant Dakar au coucher du soleil
- **Style** : Lumière dorée, couleurs chaudes (orange/doré), silhouette urbaine sénégalaise en arrière-plan
- **Dimensions** : Minimum 1920x1080px (4K recommandé)
- **Format** : JPG (optimisé Web) ou MP4 (h.264, loop 10-15 sec)
- **Effets à appliquer** :
  - Flou cinétique subtil sur l'arrière-plan
  - Exposition légèrement sous-exposée pour contraste avec le texte
  - Grade colorimétrique orange/térracota

#### Animations QR Code Hero
- **Effet** : QR Code flottant avec effet glassmorphism
- **Animation** : Pulsation lumineuse, ligne de scan qui traverse
- **Taille** : 320x320px (64x64 pour mobile)

---

### 2. SECTION "CONFIANCE EN MOUVEMENT"

#### Icônes 3D des cartes
- **Format** : SVG ou PNG avec transparence
- **Style** : 3D minimaliste, rendu metallic/doré
- **Dimensions** : 128x128px

| Icône | Description | Couleur |
|-------|-------------|---------|
| `icon-shield.svg` | Cadenas doré + document | Dégradé or/ambre |
| `icon-wrench.svg` | Outils brillants (clé + tournevis) | Dégradé fuchsia/violet |
| `icon-handshake.svg` | Poignée de main holographique | Dégradé cyan/bleu |

---

### 3. SECTION DÉMO INTERACTIVE

#### `phone-mockup.png`
- **Description** : Mockup iPhone moderne (sans encoche, style iPhone 14 Pro)
- **Dimensions** : 800x1600px (haute résolution)
- **Style** : Fond transparent, bords arrondis réalistes

#### `circuit-pattern.svg`
- **Description** : Motif de circuit imprimé abstrait
- **Style** : Lignes fines, géométrique, tech
- **Couleurs** : Blanc/gris sur fond transparent
- **Dimensions** : Pattern répétitif 100x100px

---

### 4. SEGMENTATION "POUR QUI ?"

#### Illustrations vectorielles
- **Format** : SVG (vectoriel pour animations)
- **Style** : Illustration 3D isométrique, personnages stylisés
- **Dimensions** : 800x600px

| Fichier | Description |
|---------|-------------|
| `buyer-illustration.svg` | Personnage regardant un véhicule avec tablette, expression soulagée, vert/rappel |
| `owner-illustration.svg` | Propriétaire fier devant sa voiture brillante, avec documents OKAR |
| `mechanic-illustration.svg` | Mécanicien avec tablette OKAR dans un garage moderne |

---

### 5. PARTENAIRES

#### Logos partenaires
- **Format** : SVG (vectoriel)
- **Style** : Monochrome (blanc sur fond transparent)
- **Dimensions** : Variable (max 200px de large)

| Logo | Notes |
|------|-------|
| `total.svg` | Logo TotalEnergies simplifié |
| `oryx.svg` | Logo Oryx Energy |
| `axa.svg` | Logo AXA Assurances |
| `saham.svg` | Logo SAHAM Assurances |
| `autoplus.svg` | Logo garage partenaire fictif |
| `moderne.svg` | Logo garage partenaire fictif |

---

### 6. ÉLÉMENTS UI

#### Icônes de paiement
- **Format** : SVG
- **Dimensions** : 48x48px
- **Couleurs** : Couleurs de marque des providers

| Fichier | Couleur principale |
|---------|-------------------|
| `orange-money.svg` | #FF6600 (Orange) |
| `wave.svg` | #1DC8F2 (Cyan) |
| `cinetpay.svg` | #00A651 (Vert) |
| `free-money.svg` | #CD1E25 (Rouge) |

---

## 🎬 Animations à Produire

### Framer Motion Presets

```typescript
// Hero animations
const heroVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
  }
};

// Card tilt effect
const cardVariants = {
  hover: {
    rotateX: 5,
    rotateY: -5,
    y: -10,
    transition: { duration: 0.3 }
  }
};

// Scroll reveal
const revealVariants = {
  offscreen: { opacity: 0, y: 60 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3, duration: 0.8 }
  }
};
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Largeur max | Adaptations |
|------------|-------------|-------------|
| Mobile | < 640px | Animations simplifiées, 3D désactivé |
| Tablet | 640px - 1024px | Animations standard, parallax réduit |
| Desktop | > 1024px | Full animations, parallax complet |
| 4K | > 2560px | Assets haute résolution |

---

## 🎨 Palette de Couleurs Exacte

```css
/* Couleurs principales */
--okar-orange: #FF6600;
--okar-orange-light: #FF8533;
--okar-orange-dark: #CC5200;

--okar-fuchsia: #FF007F;
--okar-fuchsia-light: #FF3399;
--okar-fuchsia-dark: #CC0066;

/* Dégradés */
--gradient-primary: linear-gradient(135deg, #FF6600 0%, #FF007F 100%);
--gradient-hero: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%);

/* Fonds */
--bg-dark-primary: #0a0a0a;
--bg-dark-secondary: #111111;
--bg-dark-tertiary: #1a1a1a;

/* Texte */
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-muted: rgba(255, 255, 255, 0.5);

/* Accents */
--accent-yellow: #FFD700;
--accent-green: #00FF88;
--accent-cyan: #00D4FF;
```

---

## ⚡ Performance Guidelines

### Images
- Utiliser WebP avec fallback JPG
- Lazy loading pour images sous le fold
- Sizes responsive: `srcset` avec 320w, 640w, 1024w, 1920w

### Vidéos
- MP4 h.264, CRF 28-32
- WebM VP9 alternative
- Poster image obligatoire
- Maximum 10MB pour hero video

### Animations
- GPU-accelerated uniquement (transform, opacity)
- `will-change` pour éléments animés
- `contain: layout` pour éviter reflows

---

## 🔗 Ressources Externes

### Fonts
- [Clash Display](https://www.fontshare.com/fonts/clash-display) - Gratuit
- [Syne](https://fonts.google.com/specimen/Syne) - Google Fonts
- [Inter](https://fonts.google.com/specimen/Inter) - Google Fonts

### Outils
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Heroicons](https://heroicons.com/) - Icônes
- [Lucide](https://lucide.dev/) - Icônes alternatives

### Inspiration
- [Awwwards](https://www.awwwards.com/) - Références
- [Dribbble Automotive](https://dribbble.com/search/automotive) - Inspiration design

---

## 📋 Checklist Production

- [ ] Hero image/video produit
- [ ] QR Code stylisé généré
- [ ] Icônes 3D des cartes créées
- [ ] Mockup téléphone préparé
- [ ] Pattern circuit généré
- [ ] Illustrations segmentation finalisées
- [ ] Logos partenaires collectés/convertis
- [ ] Icônes paiement exportées
- [ ] Fonts téléchargés et intégrés
- [ ] Assets optimisés (compression)
- [ ] Tests responsive effectués
- [ ] Performance audit (Lighthouse)

---

*Cette spécification a été créée pour guider la production des assets visuels de la homepage OKAR. Respecter scrupuleusement les dimensions, formats et styles pour maintenir la cohérence du design "Tech-Luxe Africain".*
