import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface MenuItem {
  _id: string;
  name: string;
  image: string;
  categories: string[]; // Array of category IDs
}

interface Category {
  _id: string;
  name: string;
}

const CreateOffer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    offerType: 'single_day',
    discountType: 'fixed',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountCap: '',
    applicableTo: 'all',
    applicableItems: [] as string[],
    applicableCategories: [] as string[],
    teaserEnabled: false,
    teaserStartDate: '',
    teaserMessage: '',
    status: 'draft'
  });

  useEffect(() => {
    console.log('🚀 CreateOffer component mounted, fetching data... v2');
    fetchMenuItems();
    fetchCategories();
    if (isEditMode) {
      fetchOfferDetails();
    }
  }, [id]);

  useEffect(() => {
    console.log('📋 MenuItems state updated:', menuItems.length, 'items');
  }, [menuItems]);

  useEffect(() => {
    console.log('🎯 ApplicableTo changed:', formData.applicableTo);
  }, [formData.applicableTo]);

  const fetchOfferDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/offers/admin/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const offer = data.data;
        
        // Format dates for input fields
        const formatDateForInput = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
        };

        setFormData({
          name: offer.name,
          description: offer.description,
          startDate: formatDateForInput(offer.startDate),
          endDate: formatDateForInput(offer.endDate),
          offerType: offer.offerType,
          discountType: offer.discountType,
          discountValue: offer.discountValue.toString(),
          minOrderAmount: offer.minOrderAmount?.toString() || '',
          maxDiscountCap: offer.maxDiscountCap?.toString() || '',
          applicableTo: offer.applicableTo,
          applicableItems: offer.applicableItems?.map((item: any) => item._id) || [],
          applicableCategories: offer.applicableCategories?.map((cat: any) => cat._id) || [],
          teaserEnabled: offer.teaserEnabled,
          teaserStartDate: offer.teaserStartDate ? formatDateForInput(offer.teaserStartDate) : '',
          teaserMessage: offer.teaserMessage || '',
          status: offer.status
        });

        setSelectedItems(offer.applicableItems?.map((item: any) => item._id) || []);
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      console.log('🍽️ Fetching menu items...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/menu?limit=100`);
      console.log('📡 Menu API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Menu data received:', data);
        console.log('🍴 Menu items array:', data.data?.menuItems);
        console.log('📊 Menu items count:', data.data?.menuItems?.length || 0);
        if (data.data?.menuItems?.length > 0) {
          console.log('🔍 First menu item structure:', data.data.menuItems[0]);
        }
        setMenuItems(data.data?.menuItems || []);
      } else {
        console.error('❌ Menu API failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching menu items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Categories API response:', data);
        console.log('📋 Categories data structure:', data.data);
        // Check if categories are nested in data.data.categories or just data.data
        const categoriesArray = data.data?.categories || data.data || [];
        console.log('✅ Setting categories array:', categoriesArray);
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, createAndActivate = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : 0,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxDiscountCap: formData.maxDiscountCap ? parseFloat(formData.maxDiscountCap) : null,
        applicableItems: formData.applicableTo === 'items' ? formData.applicableItems : [],
        applicableCategories: formData.applicableTo === 'categories' ? formData.applicableCategories : [],
        status: createAndActivate ? 'scheduled' : formData.status
      };

      const url = isEditMode 
        ? `${import.meta.env.VITE_API_URL}/offers/admin/${id}`
        : `${import.meta.env.VITE_API_URL}/offers/admin`;
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        navigate('/admin/offers');
      } else {
        const error = await response.json();
        alert(`Failed to ${isEditMode ? 'update' : 'create'} offer: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId: string) => {
    const newSelected = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    
    setSelectedItems(newSelected);
    setFormData({ ...formData, applicableItems: newSelected });
  };

  const handleCategoryToggle = (categoryId: string) => {
    console.log('🎯 Toggling category ID:', categoryId);
    
    // Find category name from ID
    const categoriesArray = Array.isArray(categories) ? categories : (categories as any)?.categories || [];
    const category = categoriesArray.find((cat: Category) => cat._id === categoryId);
    const categoryName = category?.name;
    
    if (!categoryName) {
      console.error('❌ Category not found for ID:', categoryId);
      return;
    }
    
    console.log('✅ Category name:', categoryName);
    
    // Filter items that have this category NAME in their categories array
    const itemsInCategory = menuItems.filter(item => 
      item.categories && item.categories.includes(categoryName)
    ).map(item => item._id);
    
    console.log('📦 Items in category:', itemsInCategory.length);
    
    const allSelected = itemsInCategory.every(id => selectedItems.includes(id));
    
    if (allSelected) {
      // Deselect all items in category
      const newSelected = selectedItems.filter(id => !itemsInCategory.includes(id));
      setSelectedItems(newSelected);
      setFormData({ ...formData, applicableItems: newSelected });
      console.log('✅ Deselected all items in category');
    } else {
      // Select all items in category
      const newSelected = [...new Set([...selectedItems, ...itemsInCategory])];
      setSelectedItems(newSelected);
      setFormData({ ...formData, applicableItems: newSelected });
      console.log('✅ Selected all items in category');
    }
  };

  const getItemsByCategory = () => {
    const grouped: { [key: string]: { categoryName: string; items: MenuItem[] } } = {};
    
    console.log('📂 Grouping items by category... v3');
    console.log('📚 Available categories:', categories);
    console.log('📊 Categories type:', typeof categories, Array.isArray(categories));
    
    // Handle both array and object with categories property
    const categoriesArray = Array.isArray(categories) ? categories : (categories as any)?.categories || [];
    console.log('✅ Categories array extracted:', categoriesArray);
    
    menuItems.forEach(item => {
      // Get first category (items can have multiple categories)
      // NOTE: item.categories contains category NAMES, not IDs!
      const catName = item.categories && item.categories.length > 0 ? item.categories[0] : 'uncategorized';
      
      // Find category object by NAME to get the _id
      const category = categoriesArray.find((cat: Category) => cat.name === catName);
      const catId = category?._id || 'uncategorized';
      const displayName = category?.name || 'Uncategorized';
      
      console.log(`📝 Item "${item.name}" -> Category Name: ${catName}, Category ID: ${catId}, Display: ${displayName}`);
      
      if (!grouped[catId]) {
        grouped[catId] = { categoryName: displayName, items: [] };
      }
      grouped[catId].items.push(item);
    });
    
    console.log('✅ Grouped items:', grouped);
    return grouped;
  };

  return (
    <>
      <PageMeta 
        title={`${isEditMode ? 'Edit' : 'Create'} Offer - The Tip Top`} 
        description={`${isEditMode ? 'Edit' : 'Create'} special offers and promotional items`}
      />
      
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Offer" : "Create New Offer"} />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit' : 'Create New'} Offer</h1>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Basic Details */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Basic Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Holi Special 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Celebrate Holi with delicious mutton dishes!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">When?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate.split('T')[0]}
                  onChange={(e) => {
                    const time = formData.startDate.split('T')[1] || '06:00';
                    setFormData({ ...formData, startDate: `${e.target.value}T${time}` });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startDate.split('T')[1] || '06:00'}
                  onChange={(e) => {
                    const date = formData.startDate.split('T')[0];
                    setFormData({ ...formData, startDate: `${date}T${e.target.value}` });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate.split('T')[0]}
                  onChange={(e) => {
                    const time = formData.endDate.split('T')[1] || '23:59';
                    setFormData({ ...formData, endDate: `${e.target.value}T${time}` });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.endDate.split('T')[1] || '23:59'}
                  onChange={(e) => {
                    const date = formData.endDate.split('T')[0];
                    setFormData({ ...formData, endDate: `${date}T${e.target.value}` });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.startDate.split('T')[1] === '00:00' && formData.endDate.split('T')[1] === '23:59'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const startDate = formData.startDate.split('T')[0];
                        const endDate = formData.endDate.split('T')[0];
                        setFormData({ 
                          ...formData, 
                          startDate: `${startDate}T00:00`,
                          endDate: `${endDate}T23:59`
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  Set as All Day (12:00 AM - 11:59 PM)
                </label>
              </div>
            </div>
          </div>

          {/* Discount Details (Optional) */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Discount Details (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">Leave discount at 0 if you're just launching new special items without discount</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="fixed"
                      checked={formData.discountType === 'fixed'}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'fixed' | 'percentage' })}
                      className="mr-2"
                    />
                    Fixed Amount (₹)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="percentage"
                      checked={formData.discountType === 'percentage'}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'fixed' | 'percentage' })}
                      className="mr-2"
                    />
                    Percentage (%)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value (0 = No Discount)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {formData.discountType === 'fixed' ? '₹' : '%'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="0 for special item launch, or enter discount amount"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="200"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Discount Cap (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscountCap}
                      onChange={(e) => setFormData({ ...formData, maxDiscountCap: e.target.value })}
                      placeholder="200"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Applicable Items */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Apply To</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={formData.applicableTo === 'all'}
                    onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                    className="mr-2"
                  />
                  All Menu Items
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="items"
                    checked={formData.applicableTo === 'items'}
                    onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                    className="mr-2"
                  />
                  Specific Items
                </label>
              </div>

              {formData.applicableTo === 'items' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Items ({selectedItems.length} selected)
                  </label>
                  <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-4">
                    {menuItems && menuItems.length > 0 ? (
                      Object.entries(getItemsByCategory()).map(([categoryId, { categoryName, items }]) => {
                        const itemsInCategory = items.map(item => item._id);
                        const allSelected = itemsInCategory.every(id => selectedItems.includes(id));
                        const someSelected = itemsInCategory.some(id => selectedItems.includes(id));
                        
                        return (
                          <div key={categoryId} className="mb-4 last:mb-0">
                            <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg mb-2">
                              <h3 className="font-semibold text-gray-700">{categoryName} ({items.length})</h3>
                              <button
                                type="button"
                                onClick={() => handleCategoryToggle(categoryId)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                              {items.map((item) => (
                                <label key={item._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item._id)}
                                    onChange={() => handleItemToggle(item._id)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">{item.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Loading menu items...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Teaser Settings */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Teaser/Announcement (Optional)</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.teaserEnabled}
                  onChange={(e) => setFormData({ ...formData, teaserEnabled: e.target.checked })}
                  className="mr-2"
                />
                Show teaser before offer starts
              </label>

              {formData.teaserEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teaser Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.teaserStartDate.split('T')[0] || ''}
                        onChange={(e) => {
                          const time = formData.teaserStartDate.split('T')[1] || '00:00';
                          setFormData({ ...formData, teaserStartDate: `${e.target.value}T${time}` });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teaser Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.teaserStartDate.split('T')[1] || '00:00'}
                        onChange={(e) => {
                          const date = formData.teaserStartDate.split('T')[0] || new Date().toISOString().split('T')[0];
                          setFormData({ ...formData, teaserStartDate: `${date}T${e.target.value}` });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaser Message
                    </label>
                    <textarea
                      rows={2}
                      value={formData.teaserMessage}
                      onChange={(e) => setFormData({ ...formData, teaserMessage: e.target.value })}
                      placeholder="Coming Soon! Special Holi offer on March 14th!"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/offers')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Save as Draft')}
            </button>
            {!isEditMode && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create & Activate'}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateOffer;
