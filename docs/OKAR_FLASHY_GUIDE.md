# 🎨 OKAR FLASHY - Guide d'Assets & Animations

## ═══════════════════════════════════════════════════════════════════
## 📦 LIBRAIRIES RECOMMANDÉES
## ═══════════════════════════════════════════════════════════════════

### 1. Animations
| Librairie | Usage | Installation |
|-----------|-------|--------------|
| **Framer Motion** | Animations fluides, geste, transitions | `npm install framer-motion` |
| **Lottie** | Animations vectorielles (confettis, succès) | `npm install lottie-react` |
| **GSAP** | Animations complexes, timeline | `npm install gsap` |

### 2. Icônes 3D
| Source | Type | Recommandation |
|--------|------|----------------|
| **Iconoir** | Gratuit | Icônes modernes SVG |
| **Phosphor Icons** | Gratuit | Style flexible, coloriable |
| **Iconscout** | Payant | Icônes 3D premium |
| **3dicons** | Gratuit | Pack d'icônes 3D colorées |

---

## ═══════════════════════════════════════════════════════════════════
## 🎉 ANIMATIONS LOTTIE RECOMMANDÉES
## ═══════════════════════════════════════════════════════════════════

### Sources Gratuites
- **Confetti Burst**: https://lottiefiles.com/animations/confetti-burst-1E5wD4
- **Success Checkmark**: https://lottiefiles.com/animations/success-checkmark
- **Party Popper**: https://lottiefiles.com/animations/party-popper

---

## ═══════════════════════════════════════════════════════════════════
## 🎨 COULEURS HEX RÉFÉRENCE
## ═══════════════════════════════════════════════════════════════════

### Dégradés Principaux
```css
/* Primary - Orange → Rose */
--gradient-primary: linear-gradient(135deg, #FF6B00 0%, #FF3D7F 50%, #FF0080 100%);

/* Success - Vert → Turquoise */
--gradient-success: linear-gradient(135deg, #00E676 0%, #00D68F 50%, #00BFA5 100%);

/* Warning - Jaune → Orange */
--gradient-warning: linear-gradient(135deg, #FFD600 0%, #FF9100 50%, #FF3D00 100%);

/* Gold - Or → Bronze */
--gradient-gold: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #CD7F32 100%);
```

### Ombres Colorées
```css
/* Orange shadow */
--shadow-orange: 0 8px 24px rgba(255, 107, 0, 0.3);

/* Pink shadow */
--shadow-pink: 0 8px 24px rgba(255, 0, 128, 0.3);

/* Green shadow */
--shadow-green: 0 8px 24px rgba(0, 230, 118, 0.3);
```

---

## ═══════════════════════════════════════════════════════════════════
## 📱 HAPTIC FEEDBACK
## ═══════════════════════════════════════════════════════════════════

### Utility Function
```typescript
// src/lib/haptics.ts
export const Haptics = {
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 20, 50]);
    }
  },
  
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  },
  
  celebration: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 100, 30, 50]);
    }
  },
};
```

---

## ═══════════════════════════════════════════════════════════════════
## 🎯 PACK D'ICÔNES 3D POUR TIMELINE
## ═══════════════════════════════════════════════════════════════════

| Type | Icône | Couleur | Source |
|------|-------|---------|--------|
| Vidange | Goutte d'huile 3D | Orange #FF6B00 | 3dicons.co |
| Freins | Disque 3D | Rose #FF0080 | Custom |
| Distribution | Engrenage 3D | Vert #00E676 | Iconscout |
| Pneus | Roue 3D | Bleu #2196F3 | Custom |
| Batterie | Pile 3D | Jaune #FFD600 | 3dicons.co |
