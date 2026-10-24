'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ServiceItem } from '@/types';
import {
  deleteService,
  deleteServicesByCategory,
  getServices,
  getServicesSync,
  initializeStorage,
  saveService,
} from '@/lib/storage';
import { formatINR } from '@/lib/numberToWords';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import {
  Film,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Tag,
  FolderMinus,
  Sparkles,
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Wedding',
  'Cinematography',
  'Traditional',
  'Aerial',
  'Pre-Wedding',
  'Albums',
  'Studio',
  'Events',
  'Printing',
  'Add-ons',
];

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Search and Category Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Deletion Modal State
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wedding');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Day');
  const [price, setPrice] = useState<number>(25000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    setServices(getServicesSync());
    setLoading(false);
    getServices().then((data) => {
      if (data && data.length > 0) setServices(data);
    });
  }, []);

  // Compute available categories from both defaults and existing services
  const allCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    services.forEach((s) => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });
    return Array.from(set);
  }, [services]);

  // Categories currently in use with their counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach((s) => {
      const cat = s.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        srv.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        srv.name.toLowerCase().includes(q) ||
        srv.category.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, search]);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCategory(selectedCategory !== 'all' ? selectedCategory : 'Wedding');
    setCustomCategory('');
    setIsCustomCategory(false);
    setDescription('');
    setUnit('Day');
    setPrice(25000);
    setIsModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setName(srv.name);
    if (allCategories.includes(srv.category)) {
      setCategory(srv.category);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setCategory('__custom__');
      setIsCustomCategory(true);
      setCustomCategory(srv.category);
    }
    setDescription(srv.description);
    setUnit(srv.unit);
    setPrice(srv.default_price);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Service Name is required.');
      return;
    }

    const finalCategory = isCustomCategory
      ? customCategory.trim() || 'General'
      : category;

    try {
      setIsSubmitting(true);
      const saved = await saveService({
        id: editingService?.id,
        name: name.trim(),
        category: finalCategory,
        description: description.trim(),
        unit: unit.trim() || 'Day',
        default_price: Number(price) || 0,
      });

      // Update state immediately
      setServices((prev) => {
        const idx = prev.findIndex((s) => s.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving service:', err);
      alert('Error saving service item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm single service deletion
  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      setIsDeleting(true);
      await deleteService(serviceToDelete.id);
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      setServiceToDelete(null);
      if (isModalOpen) setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirm entire category deletion
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      await deleteServicesByCategory(categoryToDelete);
      setServices((prev) =>
        prev.filter((s) => s.category.toLowerCase() !== categoryToDelete.toLowerCase())
      );
      if (selectedCategory.toLowerCase() === categoryToDelete.toLowerCase()) {
        setSelectedCategory('all');
      }
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Failed to delete service category:', err);
      alert('Failed to delete service category. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-500 font-mono">Loading services catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border border-zinc-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-950">
            Photography Services Catalogue
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Configure reusable photography packages, cinematic deliverables, photobooks, and hourly rates
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition shadow-xs cursor-pointer min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          Add Service Package
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 sm:top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search services, deliverables, packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suppressHydrationWarning
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div className="text-xs text-zinc-500 font-medium">
            Showing <span className="font-bold text-zinc-900">{filteredServices.length}</span> of {services.length} items
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 border-t border-zinc-100 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white font-bold'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Packages ({services.length})
          </button>

          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-zinc-900 text-white font-bold'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Active Category Actions Bar */}
        {selectedCategory !== 'all' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-zinc-50 px-3 py-2.5 rounded-lg border border-zinc-200 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500">Filtered:</span>
              <span className="font-bold text-zinc-950 uppercase tracking-wide bg-zinc-200 px-2 py-0.5 rounded text-[11px]">
                {selectedCategory}
              </span>
              <span className="text-zinc-400">
                ({categoryCounts[selectedCategory] || 0} packages)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-zinc-500 hover:text-zinc-800 underline text-xs cursor-pointer px-1 py-1"
              >
                Clear filter
              </button>
              <button
                onClick={() => setCategoryToDelete(selectedCategory)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition cursor-pointer"
                title={`Delete entire ${selectedCategory} category`}
              >
                <FolderMinus className="w-3.5 h-3.5" />
                Delete Category
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs">
          <Film className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800">No photography packages found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Try modifying your search or clearing the category filter.'
              : 'Add your first service package using the button above.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 mb-1">
                      {srv.category}
                    </span>
                    <h3 className="font-bold text-sm text-zinc-950 font-serif leading-snug">
                      {srv.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(srv)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setServiceToDelete(srv)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Service Package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 my-3 leading-relaxed min-h-[48px]">
                  {srv.description}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">Billed per {srv.unit}</span>
                <span className="text-base font-bold font-mono text-zinc-950">
                  {formatINR(srv.default_price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 max-h-[90dvh] flex flex-col">
            <div className="bg-zinc-900 text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm sm:text-base font-serif">
                {editingService ? 'Edit Service Package' : 'New Photography Service Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Service / Deliverable Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Candid Wedding Photography, 4K Drone Aerials"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-700">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                    >
                      {isCustomCategory ? 'Pick Standard' : '+ Custom'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maternity, Corporate"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__custom__">+ Add Custom Category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Billing Unit</label>
                  <input
                    type="text"
                    placeholder="Day, Event, Hour, Book, Session"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Default Base Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 font-mono text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 italic">
                  Note: You can always adjust the rate per quotation or invoice.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Deliverable Description & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail equipment, team size, video length, or paper quality..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                {editingService ? (
                  <button
                    type="button"
                    onClick={() => {
                      setServiceToDelete(editingService);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Package
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : editingService
                      ? 'Update Service'
                      : 'Add to Catalogue'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Service Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(serviceToDelete)}
        title="Delete Service Package"
        message="Are you sure you want to remove this service from your standard catalogue? Quotations or invoices already referencing it will not be affected."
        clientName={serviceToDelete?.name}
        docNumber={`Category: ${serviceToDelete?.category}`}
        amount={serviceToDelete?.default_price}
        docType="document"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteService}
        onClose={() => setServiceToDelete(null)}
      />

      {/* Delete Entire Category Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Service Category"
        message={`Are you sure you want to delete the "${categoryToDelete}" category and remove all ${
          categoryToDelete ? categoryCounts[categoryToDelete] || 0 : 0
        } service packages under it?`}
        clientName={`Category: ${categoryToDelete}`}
        docNumber={`${categoryToDelete ? categoryCounts[categoryToDelete] || 0 : 0} Service Items`}
        docType="document"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
