'use client';

import React, { useState, useEffect } from 'react';
import { ShopProfile } from '@/types';
import {
  getShopProfile,
  initializeStorage,
  resetToDefaults,
  saveShopProfile,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Settings,
  Building,
  CreditCard,
  FileText,
  Save,
  Check,
  RefreshCw,
  Database,
  CloudCheck,
  AlertTriangle,
  Upload,
} from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    initializeStorage();
    getShopProfile().then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  const handleChange = (field: keyof ShopProfile, value: string | number) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setSavedSuccess(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleChange('logo_url', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleChange('signature_url', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setIsSaving(true);
      await saveShopProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving shop profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to restore initial demo data? All quotations, invoices, customers, and services will be reloaded.'
      )
    ) {
      resetToDefaults();
      window.location.reload();
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8 pb-24 sm:pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">Photography Studio Settings</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure your studio brand, GSTIN, bank accounts, UPI ID, and default payment terms
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-0 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] rounded-lg transition shadow-xs disabled:opacity-50"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Settings Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Studio Profile'}
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
        {/* SECTION 1: STUDIO BRANDING & OWNER */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-500" /> Studio Branding & Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Studio / Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.shop_name}
                onChange={(e) => handleChange('shop_name', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-serif font-bold text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Tagline</label>
              <input
                type="text"
                placeholder="e.g. Fine Art Wedding Photography & Cinematic Stories"
                value={profile.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Lead Photographer / Owner Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.owner_name}
                onChange={(e) => handleChange('owner_name', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Studio Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Studio Email</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Studio Website</label>
              <input
                type="text"
                placeholder="https://lumierearts.in"
                value={profile.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Studio Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">State</label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Pincode</label>
              <input
                type="text"
                value={profile.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900"
              />
            </div>
          </div>

          {/* Logo & Signature Image Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Studio Logo Image
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {profile.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded border border-zinc-300 bg-white"
                  />
                )}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-zinc-100 rounded border border-zinc-300 transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-zinc-600" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {profile.logo_url && (
                  <button
                    type="button"
                    onClick={() => handleChange('logo_url', '')}
                    className="text-xs text-rose-600 hover:underline px-1 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="bg-zinc-50/70 p-3 rounded-lg border border-zinc-200">
              <label className="block text-xs font-semibold text-zinc-700 mb-2">
                Authorized Signatory Signature Image
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {profile.signature_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.signature_url}
                    alt="Signature"
                    className="h-10 w-auto object-contain border border-zinc-300 rounded p-1 bg-white"
                  />
                )}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-zinc-100 rounded border border-zinc-300 transition shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-zinc-600" />
                  Upload Signature
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>
                {profile.signature_url && (
                  <button
                    type="button"
                    onClick={() => handleChange('signature_url', '')}
                    className="text-xs text-rose-600 hover:underline px-1 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: GSTIN & TAX CONFIGURATION */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" /> GST & Tax Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Studio GSTIN (15 Digits)
              </label>
              <input
                type="text"
                placeholder="27AABCU9603R1ZM"
                value={profile.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Home State Code (e.g. 27 for Maharashtra)
              </label>
              <input
                type="text"
                placeholder="27"
                value={profile.state_code}
                onChange={(e) => handleChange('state_code', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BANK DETAILS & UPI PAYMENT */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-500" /> Bank Account & Instant UPI Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Account Holder Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.account_holder}
                onChange={(e) => handleChange('account_holder', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.ifsc_code}
                onChange={(e) => handleChange('ifsc_code', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono uppercase text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Branch Location
              </label>
              <input
                type="text"
                value={profile.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              UPI ID (for Live QR Code Generation) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. yourname@okhdfcbank or studioupi@paytm"
              value={profile.upi_id}
              onChange={(e) => handleChange('upi_id', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="text-[11px] text-zinc-500 mt-1 italic">
              Every quotation and invoice will render a scannable UPI QR code linking directly to this ID.
            </p>
          </div>
        </div>

        {/* SECTION 4: DEFAULT PAYMENT TERMS */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" /> Default Payment Terms & Conditions
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Standard Studio Terms (Auto-populates on every Quotation and Invoice)
            </label>
            <textarea
              rows={5}
              value={profile.default_terms}
              onChange={(e) => handleChange('default_terms', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Default Quotation Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={profile.default_validity_days}
                onChange={(e) => handleChange('default_validity_days', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Default Invoice Payment Due (Days)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={profile.default_due_days}
                onChange={(e) => handleChange('default_due_days', Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: SUPABASE INTEGRATION STATUS */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 pb-3 gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-500" /> Supabase Database Connectivity
            </h2>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-300">
                Local Storage Mode
              </span>
            )}
          </div>

          <div className="text-xs text-zinc-600 leading-relaxed space-y-2">
            <p>
              This application has a dual-engine architecture: it works out of the box with zero setup using browser persistent storage, and can synchronize directly with Supabase PostgreSQL cloud database anytime!
            </p>
            <div className="bg-zinc-50 p-3 sm:p-3.5 rounded border border-zinc-200 font-mono text-[11px] text-zinc-700 overflow-x-auto">
              <p className="font-bold text-zinc-900 mb-1">To connect live Supabase Cloud:</p>
              <p>1. Create a Supabase project at supabase.com</p>
              <p>2. Run migration SQL from <span className="font-semibold text-zinc-900 break-all">supabase/migrations/20260221_init.sql</span></p>
              <p>3. Add your credentials into <span className="font-semibold text-zinc-900">.env.local</span>:</p>
              <div className="mt-1.5 bg-zinc-900 text-emerald-400 p-2 sm:p-2.5 rounded overflow-x-auto">
                <code className="whitespace-pre sm:whitespace-normal">NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</code><br />
                <code className="whitespace-pre sm:whitespace-normal">NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here</code>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: DATA MANAGEMENT & RESET */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Demo Data & System Reset
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Restore the studio sample catalogue, customers, quotations, and invoices
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-0 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restore Sample Studio Data
          </button>
        </div>
      </form>
    </div>
  );
}
