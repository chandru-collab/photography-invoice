'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Quotation } from '@/types';
import { getQuotationById, initializeStorage } from '@/lib/storage';
import { DocumentForm } from '@/components/DocumentForm';

function EditQuotationContent() {
  const params = useParams();
  const id = params?.id as string;
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    if (id) {
      getQuotationById(id).then((data) => {
        setQuotation(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!quotation) {
    return <div className="p-8 text-center text-zinc-500">Quotation not found.</div>;
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <DocumentForm type="quotation" initialData={quotation} isEditing={true} />
    </div>
  );
}

export default function EditQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <EditQuotationContent />
    </Suspense>
  );
}
