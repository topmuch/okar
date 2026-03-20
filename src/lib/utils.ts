import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction pour générer un slug à partir d'une chaîne
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Remplace les espaces par des tirets
    .replace(/[^\w\-]+/g, '')    // Supprime les caractères non alphanumériques
    .replace(/\-\-+/g, '-')      // Remplace les tirets multiples par un seul
    .replace(/^-+/, '')          // Supprime les tirets en début
    .replace(/-+$/, '');         // Supprime les tirets en fin
}
