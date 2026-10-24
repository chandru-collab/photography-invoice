'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Quotation, ShopProfile } from '@/types';
import {
  getQuotationById,
  getQuotationByIdSync,
  getShopProfile,
  getShopProfileSync,
  initializeStorage,
} from '@/lib/storage';
import { ClassicDocumentTemplate } from '@/components/ClassicDocumentTemplate';
import { DocumentActions } from '@/components/DocumentActions';
import { CheckCircle2, ArrowRight } from 'lucide-react';

function QuotationViewContent() {
  const params = useParams();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeStorage();
    if (!id) return;
    // 1. Instant local-first render
    const localQ = getQuotationByIdSync(id);
    const localShop = getShopProfileSync();
    if (localQ) setQuotation(localQ);
    if (localShop) setShop(localShop);

    // 2. Background sync
    async function load() {
      const [qData, shopData] = await Promise.all([
        getQuotationById(id),
        getShopProfile(),
      ]);
      if (qData) setQuotation(qData);
      if (shopData) setShop(shopData);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!quotation || !shop) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-zinc-200 rounded-xl text-center">
        <h2 className="text-lg font-bold text-zinc-900">Quotation Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-4">
          The requested quotation could not be loaded or may have been deleted.
        </p>
        <Link
          href="/quotations"
          className="inline-block px-4 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg"
        >
          Back to Quotations List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4">
      {/* If already converted to an invoice, show indicator banner */}
      {quotation.converted_to_invoice_id && (
        <div className="no-print bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs flex items-center justify-between text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              This quotation has been successfully converted into an active invoice.
            </span>
          </div>
          <Link
            href={`/invoices/${quotation.converted_to_invoice_id}`}
            className="inline-flex items-center gap-1 font-bold text-emerald-950 hover:underline"
          >
            View Active Invoice <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Action Toolbar */}
      <DocumentActions
        document={quotation}
        shop={shop}
        type="quotation"
        onStatusChange={(newStatus) => {
          setQuotation({ ...quotation, status: newStatus as any });
        }}
      />

      {/* Classic Professional Document Template */}
      <div className="overflow-x-auto pb-8">
        <ClassicDocumentTemplate document={quotation} shop={shop} type="quotation" />
      </div>
    </div>
  );
}

export default function QuotationViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <QuotationViewContent />
    </Suspense>
  );
}
