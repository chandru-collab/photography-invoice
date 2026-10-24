'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getShopProfile } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ShopProfile } from '@/types';
import {
  Camera,
  LayoutDashboard,
  FileText,
  ReceiptText,
  Film,
  Settings,
  Plus,
  Menu,
  X,
  Database,
  CloudCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getShopProfile().then(setShop);
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quotations', href: '/quotations', icon: FileText },
    { name: 'Invoices', href: '/invoices', icon: ReceiptText },
    { name: 'Services', href: '/services', icon: Film },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="no-print bg-zinc-950 text-white border-b border-zinc-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Studio Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-white text-zinc-950 flex items-center justify-center font-bold shadow-xs group-hover:bg-zinc-200 transition shrink-0">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm sm:text-base tracking-tight font-serif uppercase block leading-none truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">
                  {shop?.shop_name || 'Lumière Arts'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono tracking-wider block truncate">
                  STUDIO INVOICE & QUOTE PRO
                </span>
              </div>
            </Link>

            {/* Supabase Status Pill for Desktop */}
            <div className="hidden lg:flex items-center ml-3 shrink-0">
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Live
                </span>
              ) : (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition"
                  title="Running in local persistent offline mode. Click to configure Supabase."
                >
                  <Database className="w-3 h-3 text-zinc-400" />
                  Local Ready
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-zinc-400" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Quick Create CTA Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              New Quote
            </Link>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </Link>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 focus:outline-none transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900/98 backdrop-blur-md border-b border-zinc-800 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition ${
                    isActive
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Create CTAs in Mobile */}
          <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2">
            <Link
              href="/quotations/new"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center justify-center py-2 text-xs font-semibold bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition"
            >
              + New Quote
            </Link>
            <Link
              href="/invoices/new"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center justify-center py-2 text-xs font-bold bg-white text-zinc-950 rounded-lg hover:bg-zinc-200 transition"
            >
              + New Invoice
            </Link>
          </div>

          {/* Supabase Status Pill for Mobile */}
          <div className="pt-2 flex items-center justify-center">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Live Cloud Sync Active
              </span>
            ) : (
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700"
              >
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                Local Ready Mode • Configure Cloud
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
