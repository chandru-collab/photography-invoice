'use client';

import React, { Suspense } from 'react';
import { DocumentForm } from '@/components/DocumentForm';

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <DocumentForm type="quotation" />
      </div>
    </Suspense>
  );
}
