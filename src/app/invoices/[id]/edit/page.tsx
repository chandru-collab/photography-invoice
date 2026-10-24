'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Invoice } from '@/types';
import { getInvoiceById, initializeStorage } from '@/lib/storage';
import { DocumentForm } from '@/components/DocumentForm';

function EditInvoiceContent() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    if (id) {
      getInvoiceById(id).then((data) => {
        setInvoice(data);
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

  if (!invoice) {
    return <div className="p-8 text-center text-zinc-500">Invoice not found.</div>;
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <DocumentForm type="invoice" initialData={invoice} isEditing={true} />
    </div>
  );
}

export default function EditInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <EditInvoiceContent />
    </Suspense>
  );
}
