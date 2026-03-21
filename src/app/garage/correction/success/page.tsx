'use client';

import Link from 'next/link';
import { CheckCircle, Clock, MessageCircle } from 'lucide-react';

export default function CorrectionSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
          Demande mise à jour !
        </h1>

        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Votre demande corrigée a été envoyée avec succès. Notre équipe va l'examiner dans les plus brefs délais.
        </p>

        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Délai de traitement
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Vous serez notifié par SMS/WhatsApp sous 24-48h ouvrées.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-blue-800 dark:text-blue-300">
                Contact WhatsApp
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Pour toute question, contactez-nous au : <strong>+221 78 123 45 67</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-colors"
          >
            Retour à l'accueil
          </Link>

          <Link
            href="/garage/connexion"
            className="block w-full px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
