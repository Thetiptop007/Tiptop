import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import {
  getMenuItems,
  getCategories,
  updateAvailability,
  updateMenuItem,
  deleteMenuItem,
  type MenuItem,
} from "../../services/menu-management.service";

interface EditFormData {
  name: string;
  description: string;
  image: string;
  priceVariants: Array<{ quantity: string; price: number }>;
  categories: string[];
  isAvailable: boolean;
  isActive: boolean;
}

export default function MenuManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageSourceType, setImageSourceType] = useState<'url' | 'upload'>('url');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const searchDebounceRef = useRef<number | null>(null);
  
  // Get params from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const selectedCategory = searchParams.get('category') || 'all';
  const searchTerm = searchParams.get('search') || '';
  
  // Pagination state from API response
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Initialize local search term from URL
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  // Fetch menu items when filters change
  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      const response = await getMenuItems(
        currentPage,
        itemsPerPage,
        selectedCategory,
        searchTerm
      );
      
      if (response) {
        setMenuItems(response.items);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.totalItems);
      }
      setLoading(false);
    };

    fetchMenuItems();
  }, [currentPage, selectedCategory, searchTerm]);

  const openDetails = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const closeDetails = () => {
    setSelectedItem(null);
  };

  // Debounced search with fuzzy matching
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchTerm(value);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Only trigger search after user stops typing for 500ms
    searchDebounceRef.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', '1'); // Reset to page 1
      if (value && value.trim().length >= 2) { // Only search if 2+ characters
        newParams.set('search', value.trim());
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams);
    }, 500);
  }, [searchParams, setSearchParams]);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Update category filter with URL params
  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1'); // Reset to page 1
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
    setShowCategoryFilter(false);
  };

  // Update page with URL params
  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    setSelectedItem(null);
  };

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    const newAvailability = !item.isAvailable;
    const success = await updateAvailability(item.id, newAvailability);
    
    if (success) {
      // Refresh data
      const response = await getMenuItems(
        currentPage,
        itemsPerPage,
        selectedCategory,
        searchTerm
      );
      if (response) {
        setMenuItems(response.items);
        // Update selected item if it's the same
        if (selectedItem?.id === item.id) {
          const updated = response.items.find(i => i.id === item.id);
          if (updated) setSelectedItem(updated);
        }
      }
    }
  };

  // Delete item
  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    const success = await deleteMenuItem(item.id);
    
    if (success) {
      setSelectedItem(null);
      // Refresh data
      const response = await getMenuItems(
        currentPage,
        itemsPerPage,
        selectedCategory,
        searchTerm
      );
      if (response) {
        setMenuItems(response.items);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.totalItems);
      }
    }
  };

  // Open edit modal
  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      description: item.description,
      image: item.image,
      priceVariants: item.priceVariants.map(v => ({ ...v })),
      categories: item.categories.filter(c => c !== 'All'),
      isAvailable: item.isAvailable,
      isActive: item.isActive
    });
    setImageSourceType(item.image.startsWith('data:') ? 'upload' : 'url');
    setShowEditModal(true);
    setSelectedItem(null);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditFormData(null);
  };

  // Handle edit form input change
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (!editFormData) return;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditFormData(prev => prev ? { ...prev, [name]: checked } : null);
    } else {
      setEditFormData(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  // Handle edit price variant change
  const handleEditPriceVariantChange = (index: number, field: 'quantity' | 'price', value: string | number) => {
    if (!editFormData) return;
    const newVariants = [...editFormData.priceVariants];
    if (field === 'quantity') {
      newVariants[index].quantity = value as string;
    } else {
      newVariants[index].price = parseFloat(value as string) || 0;
    }
    setEditFormData(prev => prev ? { ...prev, priceVariants: newVariants } : null);
  };

  // Handle category change for edit
  const handleEditCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editFormData) return;
    const selectedCategory = e.target.value;
    setEditFormData(prev => prev ? {
      ...prev,
      categories: selectedCategory ? [selectedCategory] : []
    } : null);
  };

  // Handle image URL change for edit
  const handleEditImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editFormData) return;
    const url = e.target.value;
    setEditFormData(prev => prev ? { ...prev, image: url } : null);
  };

  // Handle image file change for edit
  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editFormData) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditFormData(prev => prev ? { ...prev, image: result } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add edit price variant
  const addEditPriceVariant = () => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? {
      ...prev,
      priceVariants: [...prev.priceVariants, { quantity: "Half", price: 0 }]
    } : null);
  };

  // Remove edit price variant
  const removeEditPriceVariant = (index: number) => {
    if (!editFormData || editFormData.priceVariants.length <= 1) return;
    setEditFormData(prev => prev ? {
      ...prev,
      priceVariants: prev.priceVariants.filter((_, i) => i !== index)
    } : null);
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editFormData) return;

    // Validate category
    if (!editFormData.categories || editFormData.categories.length === 0) {
      alert('Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        image: editFormData.image,
        priceVariants: editFormData.priceVariants,
        category: editFormData.categories[0], // Send as 'category' (singular) - backend expects single value
        isAvailable: editFormData.isAvailable,
        isActive: editFormData.isActive
      };

      const result = await updateMenuItem(editingItem.id, updateData);
      
      if (result.success) {
        alert('Menu item updated successfully!');
        closeEditModal();
        // Refresh data
        const response = await getMenuItems(
          currentPage,
          itemsPerPage,
          selectedCategory,
          searchTerm
        );
        if (response) {
          setMenuItems(response.items);
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      } else {
        alert(result.message || 'Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('An error occurred while updating the menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <>
      <PageMeta
        title="Menu Management | Admin Dashboard"
        description="View and manage all menu items"
      />
      <PageBreadcrumb pageTitle="Menu Management" />
      
      {/* Search Section */}
      <div className="mb-6">
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search menu items (min 2 chars)..."
              value={localSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 pr-10 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {localSearchTerm && localSearchTerm !== searchTerm && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Category Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              <svg
                className={`h-4 w-4 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Category Dropdown */}
            {showCategoryFilter && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="max-h-64 overflow-y-auto p-1">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                        selectedCategory === category
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} items
        {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
      
      {/* Grid Layout */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : menuItems.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-12 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium">No menu items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-indigo-500 hover:shadow-md transition-all dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-indigo-500"
            >
              {/* Image Section */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                {/* Availability Badge */}
                <div className="absolute top-2 right-2">
                  <Badge
                    size="sm"
                    color={item.availability === "Available" ? "success" : "error"}
                  >
                    {item.availability}
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-3">
                {/* Name */}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 mb-1 break-words">
                  {item.name}
                </h3>
                
                {/* Category */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {item.category}
                </p>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.priceVariants.length} variants
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openDetails(item)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleToggleAvailability(item)}
                    className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.isAvailable ? "M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}
                      />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(item)}
                    className="rounded-lg border border-red-300 bg-white p-1.5 text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && menuItems.length > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Page Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                const showEllipsis =
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return (
                    <span
                      key={page}
                      className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600"
                    >
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white dark:bg-indigo-500"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Detail Slide-in Panel */}
      {selectedItem && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[999999] transition-opacity"
            onClick={closeDetails}
          />
          
          {/* Slide-in Panel */}
          <div className="fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl z-[9999999] overflow-y-auto transform transition-transform">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
                Item Details
              </h2>
              <button
                onClick={closeDetails}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="h-full w-full object-cover"
                />
                {/* Availability Badge */}
                <div className="absolute top-2 right-2">
                  <Badge
                    size="sm"
                    color={selectedItem.availability === "Available" ? "success" : "error"}
                  >
                    {selectedItem.availability}
                  </Badge>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {selectedItem.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white/90 mb-2">
                  {selectedItem.name}
                </h3>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="text-xs">{selectedItem.rating.toFixed(1)} ({selectedItem.reviews} reviews)</span>
                  </div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    From {formatPrice(selectedItem.price)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedItem.description || 'No description available'}
                </p>
              </div>

              {/* Price Variants */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Price Variants
                </h4>
                <div className="space-y-2">
                  {selectedItem.priceVariants.map((variant, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-2"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {variant.quantity}
                      </span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(variant.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Total Orders
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {selectedItem.totalOrders || 0}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                    Revenue
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {formatPrice(selectedItem.totalRevenue || 0)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => handleToggleAvailability(selectedItem)}
                  className="w-full rounded-lg border border-indigo-300 bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:border-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {selectedItem.availability === "Available" ? "Mark Out of Stock" : "Mark Available"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => openEditModal(selectedItem)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    Edit Item
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedItem)}
                    className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && editingItem && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-[9999998] transition-opacity"
            onClick={closeEditModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
            <div className="no-scrollbar relative w-full max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-11">
              {/* Header */}
              <div className="mb-5 pr-14 lg:mb-6">
                <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
                  Edit Menu Item
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update item details to keep your menu up-to-date.
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={closeEditModal}
                className="absolute right-5 top-5 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="space-y-5">
                {/* Item Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFormData.categories[0] || ''}
                    onChange={handleEditCategoryChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  >
                    <option value="">Select a category</option>
                    {categories.filter(c => c !== 'all').map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>

                {/* Price Variants */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Price Variants <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {editFormData.priceVariants.map((variant, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-1">
                          <select
                            value={variant.quantity}
                            onChange={(e) => handleEditPriceVariantChange(index, 'quantity', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          >
                            <option value="Quarter">Quarter</option>
                            <option value="Half">Half</option>
                            <option value="Full">Full</option>
                            <option value="2PCS">2 PCS</option>
                            <option value="4PCS">4 PCS</option>
                            <option value="6PCS">6 PCS</option>
                            <option value="8PCS">8 PCS</option>
                            <option value="10PCS">10 PCS</option>
                            <option value="12PCS">12 PCS</option>
                            <option value="14PCS">14 PCS</option>
                            <option value="16PCS">16 PCS</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleEditPriceVariantChange(index, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="Price (₹)"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </div>
                        {editFormData.priceVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditPriceVariant(index)}
                            className="rounded-lg border border-red-300 bg-white px-3 py-2.5 text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEditPriceVariant}
                      className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                    >
                      + Add Price Variant
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Item Image
                  </label>
                  
                  {/* Image Source Type Toggle */}
                  <div className="mb-3 flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="imageSourceType"
                        value="url"
                        checked={imageSourceType === 'url'}
                        onChange={() => setImageSourceType('url')}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-400">Image URL</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="imageSourceType"
                        value="upload"
                        checked={imageSourceType === 'upload'}
                        onChange={() => setImageSourceType('upload')}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-400">Upload File</span>
                    </label>
                  </div>

                  {/* URL Input */}
                  {imageSourceType === 'url' && (
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={editFormData.image}
                      onChange={handleEditImageUrlChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                    />
                  )}

                  {/* File Upload */}
                  {imageSourceType === 'upload' && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageFileChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:file:bg-indigo-500/10 dark:file:text-indigo-400"
                    />
                  )}

                  {/* Image Preview */}
                  {editFormData.image && (
                    <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      <img
                        src={editFormData.image}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isAvailable"
                      name="isAvailable"
                      checked={editFormData.isAvailable}
                      onChange={handleEditInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <label htmlFor="edit-isAvailable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Available for Orders
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isActive"
                      name="isActive"
                      checked={editFormData.isActive}
                      onChange={handleEditInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    <label htmlFor="edit-isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active (Visible in menu)
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={submitting}
                    className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {submitting ? 'Updating...' : 'Update Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}