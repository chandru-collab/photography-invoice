'use client';

import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/numberToWords';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  docNumber?: string;
  docType?: 'quotation' | 'invoice' | 'document';
  clientName?: string;
  amount?: number;
  isDeleting?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title = 'Delete Document',
  message = 'Are you sure you want to delete this document? This action cannot be undone.',
  docNumber,
  docType,
  clientName,
  amount,
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900">{title}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Permanent Deletion Confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-4 sm:px-5 py-3 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-zinc-600 leading-relaxed">{message}</p>

          {/* Document Summary Card if metadata is present */}
          {(docNumber || clientName) && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1.5 text-xs">
              {docNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Document:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {docType && (
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase mr-1.5 ${
                          docType === 'invoice'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-200 text-zinc-800'
                        }`}
                      >
                        {docType === 'invoice' ? 'INV' : 'QUO'}
                      </span>
                    )}
                    {docNumber}
                  </span>
                </div>
              )}
              {clientName && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Client / Event:</span>
                  <span className="font-semibold text-zinc-800 truncate max-w-[200px]">
                    {clientName}
                  </span>
                </div>
              )}
              {amount !== undefined && (
                <div className="flex justify-between items-center pt-1 border-t border-zinc-200">
                  <span className="text-zinc-500 font-medium">Total Amount:</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {formatINR(amount)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-snug">
              Warning: Deleting this record will update dashboard analytics and remove all associated line items and transaction history.
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-zinc-50 px-4 sm:px-5 py-3 sm:py-3.5 border-t border-zinc-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-1.5 min-h-[40px] sm:min-h-0 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
