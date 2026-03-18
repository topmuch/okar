import { Suspense } from 'react';
import NouvelleInterventionContent from './content';

export default function NouvelleInterventionPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    }>
      <NouvelleInterventionContent />
    </Suspense>
  );
}
