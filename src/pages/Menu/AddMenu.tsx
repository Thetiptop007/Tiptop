import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { createMenuItem, getCategories } from "../../services/menu-management.service";
import { logger } from "../../utils/logger";

interface PriceVariant {
  quantity: string;
  price: number;
}

interface MenuFormData {
  name: string;
  category: string;
  description: string;
  ingredients: string;
  priceVariants: PriceVariant[];
  isAvailable: boolean;
  image: string;
}

export default function AddMenu() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<MenuFormData>({
    name: "",
    category: "",
    description: "",
    ingredients: "",
    priceVariants: [{ quantity: "Full", price: 0 }],
    isAvailable: true,
    image: "",
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      setCategories(cats.filter(c => c !== 'All'));
    };
    fetchCategories();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
    setImagePreview(url);
  };

  const handlePriceVariantChange = (index: number, field: 'quantity' | 'price', value: string | number) => {
    const newVariants = [...formData.priceVariants];
    if (field === 'quantity') {
      newVariants[index].quantity = value as string;
    } else {
      newVariants[index].price = parseFloat(value as string) || 0;
    }
    setFormData(prev => ({ ...prev, priceVariants: newVariants }));
  };

  const addPriceVariant = () => {
    setFormData(prev => ({
      ...prev,
      priceVariants: [...prev.priceVariants, { quantity: "Half", price: 0 }]
    }));
  };

  const removePriceVariant = (index: number) => {
    if (formData.priceVariants.length > 1) {
      setFormData(prev => ({
        ...prev,
        priceVariants: prev.priceVariants.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    logger.business('MENU_FORM_SUBMITTED', 'Menu item creation form submitted', {
      hasName: !!formData.name.trim(),
      hasCategory: !!formData.category.trim(),
      variantCount: formData.priceVariants.length,
      isAvailable: formData.isAvailable,
    });
    
    try {
      // Validate category
      if (!formData.category || formData.category === 'All' || formData.category.trim() === '') {
        logger.warn('Menu item category validation failed', { category: formData.category });
        alert('Please select a valid category');
        setSubmitting(false);
        return;
      }
      
      // Prepare data for API
      const itemData = {
        name: formData.name,
        description: formData.description,
        image: formData.image || '/images/product/placeholder.jpg',
        priceVariants: formData.priceVariants,
        category: formData.category, // Send as 'category' (singular) not 'categories'
        isAvailable: formData.isAvailable,
      };
      logger.business('MENU_CREATE_REQUESTED', 'Sending menu item to API', {
        category: itemData.category,
        isAvailable: itemData.isAvailable,
        variantCount: itemData.priceVariants.length,
      });

      const result = await createMenuItem(itemData);
      
      if (result.success) {
        alert('Menu item created successfully!');
        navigate("/admin/menu");
      } else {
        alert(result.message || 'Failed to create menu item');
      }
    } catch (error) {
      logger.error('Error creating menu item', { errorMessage: error instanceof Error ? error.message : String(error) });
      alert('An error occurred while creating the menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/menu");
  };

  return (
    <>
      <PageMeta
        title="Add New Menu Item | Admin Dashboard"
        description="Add a new item to the menu"
      />
      <PageBreadcrumb pageTitle="Add New Menu Item" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Section - Left Side (2/3 width) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  Item Information
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the details of the new menu item
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Item Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="e.g., Butter Chicken"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Variants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Variants <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.priceVariants.map((variant, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-1">
                          <select
                            value={variant.quantity}
                            onChange={(e) => handlePriceVariantChange(index, 'quantity', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
                            onChange={(e) => handlePriceVariantChange(index, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="Price (₹)"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                          />
                        </div>
                        {formData.priceVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePriceVariant(index)}
                            className="rounded-lg border border-red-300 bg-white px-3 py-2.5 text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-900/20"
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
                      onClick={addPriceVariant}
                      className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                    >
                      + Add Price Variant
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="Describe the dish..."
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label
                    htmlFor="ingredients"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ingredients <span className="text-gray-500 text-xs">(comma separated)</span>
                  </label>
                  <textarea
                    id="ingredients"
                    name="ingredients"
                    rows={3}
                    value={formData.ingredients}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="e.g., Chicken, Tomatoes, Cream, Butter, Spices"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Item Image
                  </label>
                  
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image}
                    onChange={handleImageUrlChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                    />
                    <label
                      htmlFor="isAvailable"
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      Available for Orders
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-gray-200 p-6 dark:border-gray-800">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {submitting ? 'Creating...' : 'Add Menu Item'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Section - Right Side (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 p-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Preview
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                How it will appear
              </p>
            </div>

            <div className="p-4">
              {/* Preview Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Image Preview */}
                <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {!formData.isAvailable && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                {formData.category && (
                  <span className="mb-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {formData.category}
                  </span>
                )}

                {/* Item Name */}
                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {formData.name || "Item Name"}
                </h3>

                {/* Price Variants */}
                <div className="mb-3 space-y-2">
                  {/* Price Variants */}
                  {formData.priceVariants.length > 0 && (
                    <div className="space-y-1">
                      {formData.priceVariants.map((variant, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{variant.quantity}</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            ₹{variant.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                {formData.description && (
                  <p className="mb-3 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {formData.description}
                  </p>
                )}

                {/* Ingredients */}
                {formData.ingredients && (
                  <div className="flex flex-wrap gap-1">
                    {formData.ingredients.split(",").map((ingredient, index) => (
                      <span
                        key={index}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {ingredient.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
