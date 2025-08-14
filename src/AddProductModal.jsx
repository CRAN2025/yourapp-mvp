import { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Link, Check, AlertCircle, Loader, Plus } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { storage, db } from './firebase';
import { createEnhancedProduct, validateProductData } from './productHelpers';

const AddProductModal = ({
  isOpen,
  onClose,
  user,
  userProfile,
  onProductAdded,
  editProduct = null // For edit mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    category: '',
    subcategory: '',
    description: '',
    specifications: {
      dimensions: '',
      weight: '',
      materials: '',
      care: '',
      condition: 'New',
      origin: ''
    },
    features: [],
    tags: [],
    images: {
      primary: '',
      gallery: []
    }
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file', 'camera', 'url'
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission state
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: basic info, 2: image & details, 3: review
  const [isDirty, setIsDirty] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');

  const fileInputRef = useRef(null);
  const initialFormState = useRef({});

  const isEditMode = !!editProduct;

  // Categories from your existing code
  const categories = [
    '👗 Fashion & Clothing', '📱 Electronics', '🍔 Food & Beverages', '💄 Beauty & Cosmetics',
    '🏠 Home & Garden', '📚 Books & Education', '🎮 Sports & Gaming', '👶 Baby & Kids',
    '🚗 Automotive', '🎨 Arts & Crafts', '💊 Health & Wellness', '🔧 Tools & Hardware',
    '🎁 Gifts & Souvenirs', '💍 Jewelry & Accessories', '📦 Other'
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Used'];

  // FIXED: Proper unsaved changes logic - only warn for edit mode with actual changes
  const shouldWarnUnsavedChanges = isEditMode && isDirty && !isSubmitting && !loading;

  // Prevent browser beforeunload warning - ONLY for edit mode with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (shouldWarnUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    if (isOpen && shouldWarnUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, shouldWarnUnsavedChanges]);

  // Close on ESC (respects the same guards)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Initialize form with edit data and track initial state
  useEffect(() => {
    if (isEditMode && editProduct) {
      const editData = {
        name: editProduct.name || '',
        price: editProduct.price?.toString() || '',
        quantity: editProduct.quantity?.toString() || '',
        category: editProduct.category || '',
        subcategory: editProduct.subcategory || '',
        description: typeof editProduct.description === 'string'
          ? editProduct.description
          : editProduct.description?.full || '',
        specifications: editProduct.specifications || {
          dimensions: '',
          weight: '',
          materials: '',
          care: '',
          condition: 'New',
          origin: ''
        },
        features: editProduct.features || [],
        tags: editProduct.tags || [],
        images: {
          primary: editProduct.images?.primary || editProduct.imageUrl || '',
          gallery: editProduct.images?.gallery || []
        }
      };

      setFormData(editData);
      initialFormState.current = JSON.parse(JSON.stringify(editData));

      // Set image previews
      const allImages = [
        editProduct.images?.primary || editProduct.imageUrl,
        ...(editProduct.images?.gallery || [])
      ].filter(Boolean);

      setImagePreviews(allImages);
      setIsDirty(false); // initial load in edit mode shouldn't count as dirty
    }
  }, [isEditMode, editProduct]);

  // FIXED: Track changes properly - compare with initial state for edit mode
  useEffect(() => {
    if (!isEditMode) {
      // For add mode, any form interaction counts as dirty for draft saving
      // but this won't trigger unsaved changes warnings
      return;
    }

    // For edit mode, check if current form differs from initial loaded state
    const currentFormString = JSON.stringify(formData);
    const initialFormString = JSON.stringify(initialFormState.current);
    const hasActualChanges = currentFormString !== initialFormString;
    
    setIsDirty(hasActualChanges);
  }, [formData, isEditMode]);
  // Auto-save draft to localStorage (add mode only, debounce, per-user key)
  useEffect(() => {
    if (!isEditMode && isOpen && !isSubmitting && formData.name) {
      const t = setTimeout(() => {
        localStorage.setItem(`productDraft_${user?.uid || 'anon'}`, JSON.stringify(formData));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [formData, isEditMode, isOpen, isSubmitting, user?.uid]);

  // Load draft on mount (only for add mode)
  useEffect(() => {
    if (!isEditMode && isOpen) {
      const draft = localStorage.getItem(`productDraft_${user?.uid || 'anon'}`);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
        } catch (e) {
          console.error('Failed to load draft:', e);
          localStorage.removeItem(`productDraft_${user?.uid || 'anon'}`);
        }
      }
    }
  }, [isOpen, isEditMode, user?.uid]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields like specifications.condition
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Real-time validation
    if (field === 'price' && value && isNaN(Number(value))) {
      setErrors(prev => ({ ...prev, price: 'Price must be a number' }));
    }
    if (field === 'quantity' && value && isNaN(Number(value))) {
      setErrors(prev => ({ ...prev, quantity: 'Quantity must be a number' }));
    }
  };

  const formatPrice = (value) => {
    if (!value) return '';
    const currency = userProfile?.currency || 'GHS';
    const numValue = Number(value);
    if (isNaN(numValue)) return value;

    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(numValue);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
      return;
    }

    // Check max images (5 total)
    if (imagePreviews.length >= 5) {
      setErrors(prev => ({ ...prev, image: 'Maximum 5 images allowed' }));
      return;
    }

    setImageFiles(prev => [...prev, file]);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews(prev => [...prev, e.target.result]);
      setErrors(prev => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => handleImageUpload(file));
  };

  const handleUrlInput = (url) => {
    // basic sanity checks
    try {
      const u = new URL(url);
      const protocolOK = /^https?:$/.test(u.protocol);
      const looksLikeImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u.pathname);
      if (!protocolOK || !looksLikeImage) throw new Error('bad');
    } catch {
      setErrors(prev => ({ ...prev, image: 'Enter a valid image URL (jpg, png, webp, gif)' }));
      return;
    }

    if (imagePreviews.length >= 5) {
      setErrors(prev => ({ ...prev, image: 'Maximum 5 images allowed' }));
      return;
    }

    setImagePreviews(prev => [...prev, url]);
    setErrors(prev => ({ ...prev, image: null }));
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const productToValidate = {
      name: formData.name,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      category: formData.category,
      images: {
        primary: imagePreviews[0] || '',
        gallery: imagePreviews.slice(1)
      }
    };

    const validation = validateProductData(productToValidate);

    if (!validation.isValid) {
      const newErrors = {};
      validation.errors.forEach(error => {
        if (error.includes('name')) newErrors.name = error;
        if (error.includes('price')) newErrors.price = error;
        if (error.includes('quantity')) newErrors.quantity = error;
        if (error.includes('category')) newErrors.category = error;
        if (error.includes('image')) newErrors.image = error;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const uploadImagesToFirebase = async () => {
    const uploadedUrls = [];

    // Upload new image files
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        const imageRef = ref(storage, `products/${user.uid}/${Date.now()}_${i}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Image upload error:', error);
        throw new Error('Failed to upload images. Please check your internet connection and try again.');
      }
    }

    // Combine uploaded URLs with existing HTTP URLs (ignore data URLs)
    const existingUrls = imagePreviews.filter(url => typeof url === 'string' && url.startsWith('http'));
    return [...uploadedUrls, ...existingUrls];
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Coerce & validate again at the gate
    const priceNum = Number(formData.price);
    const qtyNum = Number(formData.quantity);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setErrors(p => ({ ...p, price: 'Price must be greater than 0' }));
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      setErrors(p => ({ ...p, quantity: 'Quantity must be 0 or more' }));
      return;
    }
    if (!imagePreviews[0]) {
      setErrors(p => ({ ...p, image: 'At least one image is required' }));
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    
    // FIXED: Clear isDirty immediately when submitting to prevent warnings
    setIsDirty(false);

    try {
      // Upload images if needed
      const allImageUrls = await uploadImagesToFirebase();

      const status = qtyNum > 0 ? 'active' : 'out-of-stock';

      // Create enhanced product using your helper
      const enhancedProductData = createEnhancedProduct({
        name: formData.name.trim(),
        price: priceNum,
        quantity: qtyNum,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description?.trim() || '',
        specifications: formData.specifications,
        features: formData.features,
        tags: formData.tags,
        images: {
          primary: allImageUrls[0] || '',
          gallery: allImageUrls.slice(1) || []
        },
        imageUrl: allImageUrls[0] || '', // legacy compatibility
        status,
        source: 'manual',
        lastUpdated: Date.now(),
        ...(isEditMode ? {} : { createdAt: Date.now() })
      });

      if (isEditMode) {
        // Update existing product
        const productRef = dbRef(db, `users/${user.uid}/products/${editProduct.productId}`);
        await set(productRef, { ...enhancedProductData, productId: editProduct.productId });
      } else {
        // Create new product and persist productId
        const productsRef = dbRef(db, `users/${user.uid}/products`);
        const newRef = push(productsRef);
        const productId = newRef.key;
        await set(newRef, { ...enhancedProductData, productId });

        // Clear draft (successful save)
        localStorage.removeItem(`productDraft_${user?.uid || 'anon'}`);
      }

      // Parent callback
      if (onProductAdded) onProductAdded(enhancedProductData);

      // Close modal and reset
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);

      // FIXED: Only restore dirty state for edit mode if there was an error
      if (isEditMode) {
        const currentFormString = JSON.stringify(formData);
        const initialFormString = JSON.stringify(initialFormState.current);
        setIsDirty(currentFormString !== initialFormString);
      }

      let errorMessage = 'Failed to save product. Please try again.';
      if (String(error?.message || '').includes('storage')) {
        errorMessage = 'Failed to upload image. Please check your internet connection.';
      } else if (String(error?.message || '').includes('permission')) {
        errorMessage = 'Permission denied. Please contact support.';
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Don't allow close while saving/submitting
    if (loading || isSubmitting) return;

    // FIXED: Only show confirmation for edit mode with actual unsaved changes
    if (shouldWarnUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Close anyway?');
      if (!confirmClose) return;
    }

    // Reset all state
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      quantity: '',
      category: '',
      subcategory: '',
      description: '',
      specifications: {
        dimensions: '',
        weight: '',
        materials: '',
        care: '',
        condition: 'New',
        origin: ''
      },
      features: [],
      tags: [],
      images: { primary: '', gallery: [] }
    });
    setImageFiles([]);
    setImagePreviews([]);
    setErrors({});
    setStep(1);
    setIsDirty(false);
    setIsSubmitting(false);
    setUploadMethod('file');
    setNewFeature('');
    setNewTag('');
    initialFormState.current = {};
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate basic info before proceeding
      const basicErrors = {};
      if (!formData.name.trim()) basicErrors.name = 'Product name is required';
      if (!formData.price || Number(formData.price) <= 0) basicErrors.price = 'Price must be greater than 0';

      if (Object.keys(basicErrors).length > 0) {
        setErrors(basicErrors);
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            width: 'min(700px, 100vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`
            .modal-input {
              width: 100%;
              padding: 12px 16px;
              border: 1px solid rgba(0, 0, 0, 0.1);
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.8);
              font-size: 14px;
              outline: none;
              transition: all 0.3s ease;
            }
            .modal-input:focus {
              border-color: #5a6bff;
              box-shadow: 0 0 0 3px rgba(90, 107, 255, 0.1);
              background: rgba(255, 255, 255, 0.95);
            }
            .modal-input.error {
              border-color: #ef4444;
              background: rgba(239, 68, 68, 0.05);
            }
            .image-upload-area {
              border: 2px dashed #d1d5db;
              border-radius: 12px;
              padding: 40px 20px;
              text-align: center;
              transition: all 0.3s ease;
              cursor: pointer;
            }
            .image-upload-area:hover {
              border-color: #5a6bff;
              background: rgba(90, 107, 255, 0.05);
            }
            .step-indicator {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 24px;
            }
            .step-dot {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.3s ease;
            }
            .step-line {
              flex: 1;
              height: 2px;
              background: #e5e7eb;
              border-radius: 1px;
            }
            .btn-primary {
              background: linear-gradient(135deg, #5a6bff, #67d1ff);
              color: white;
              border: none;
              border-radius: 12px;
              padding: 12px 24px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .btn-primary:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 8px 24px rgba(90, 107, 255, 0.3);
            }
            .btn-primary:disabled {
              opacity: 0.7;
              cursor: not-allowed;
              transform: none;
            }
            .btn-secondary {
              background: rgba(0, 0, 0, 0.05);
              color: #374151;
              border: 1px solid rgba(0, 0, 0, 0.1);
              border-radius: 12px;
              padding: 12px 24px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .btn-secondary:hover {
              background: rgba(0, 0, 0, 0.1);
            }
            .tag-chip {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              background: rgba(90, 107, 255, 0.1);
              color: #5a6bff;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              margin: 2px;
            }
            .feature-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: rgba(0, 0, 0, 0.02);
              padding: 8px 12px;
              border-radius: 8px;
              margin: 4px 0;
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '24px 32px 16px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #5a6bff, #67d1ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {isEditMode ? '✏️ Edit Product' : '➕ Add New Product'}
              </h2>
              <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>
                {isEditMode ? 'Update your product details' : 'Add a product to your catalog'}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading || isSubmitting}
              style={{
                background: 'none',
                border: 'none',
                cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (loading || isSubmitting) ? 0.5 : 1
              }}
              type="button"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Steps (only for add mode) */}
          {!isEditMode && (
            <div style={{ padding: '16px 32px 0' }}>
              <div className="step-indicator">
                <div className="step-dot" style={{
                  background: step >= 1 ? 'linear-gradient(135deg, #5a6bff, #67d1ff)' : '#e5e7eb',
                  color: step >= 1 ? 'white' : '#9ca3af'
                }}>
                  {step > 1 ? <Check size={16} /> : '1'}
                </div>
                <div className="step-line" style={{ background: step > 1 ? 'linear-gradient(90deg, #5a6bff, #67d1ff)' : '#e5e7eb' }} />
                <div className="step-dot" style={{
                  background: step >= 2 ? 'linear-gradient(135deg, #5a6bff, #67d1ff)' : '#e5e7eb',
                  color: step >= 2 ? 'white' : '#9ca3af'
                }}>
                  {step > 2 ? <Check size={16} /> : '2'}
                </div>
                <div className="step-line" style={{ background: step > 2 ? 'linear-gradient(90deg, #5a6bff, #67d1ff)' : '#e5e7eb' }} />
                <div className="step-dot" style={{
                  background: step >= 3 ? 'linear-gradient(135deg, #5a6bff, #67d1ff)' : '#e5e7eb',
                  color: step >= 3 ? 'white' : '#9ca3af'
                }}>
                  3
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
                <span>Basic Info</span>
                <span>Images & Details</span>
                <span>Review</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '24px 32px' }}>
            {/* General Error */}
            {errors.general && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {errors.general}
              </div>
            )}

            {/* Step 1: Basic Info OR Edit Mode Full Form */}
            {(step === 1 || isEditMode) && (
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Product Name */}
                <div>
                  <label htmlFor="productName" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                    Product Name *
                  </label>
                  <input
                    id="productName"
                    type="text"
                    className={`modal-input ${errors.name ? 'error' : ''}`}
                    placeholder="e.g., African Print Dress"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={loading || isSubmitting}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} />
                      {errors.name}
                    </div>
                  )}
                </div>

                {/* Price and Quantity Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label htmlFor="productPrice" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Price * ({userProfile?.currency || 'GHS'})
                    </label>
                    <input
                      id="productPrice"
                      type="number"
                      className={`modal-input ${errors.price ? 'error' : ''}`}
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      min="0"
                      step="0.01"
                      disabled={loading || isSubmitting}
                      aria-invalid={Boolean(errors.price)}
                    />
                    {formData.price && !errors.price && (
                      <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                        {formatPrice(formData.price)}
                      </div>
                    )}
                    {errors.price && (
                      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} />
                        {errors.price}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="productQty" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Stock Quantity *
                    </label>
                    <input
                      id="productQty"
                      type="number"
                      className={`modal-input ${errors.quantity ? 'error' : ''}`}
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      min="0"
                      disabled={loading || isSubmitting}
                      aria-invalid={Boolean(errors.quantity)}
                    />
                    {errors.quantity && (
                      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} />
                        {errors.quantity}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category and Subcategory (if edit mode) */}
                {isEditMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label htmlFor="productCategory" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                        Category
                      </label>
                      <select
                        id="productCategory"
                        className="modal-input"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        disabled={loading || isSubmitting}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="productCondition" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                        Condition
                      </label>
                      <select
                        id="productCondition"
                        className="modal-input"
                        value={formData.specifications.condition}
                        onChange={(e) => handleInputChange('specifications.condition', e.target.value)}
                        disabled={loading || isSubmitting}
                      >
                        {conditions.map(condition => (
                          <option key={condition} value={condition}>{condition}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Description (if edit mode) */}
                {isEditMode && (
                  <div>
                    <label htmlFor="productDescription" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Description
                    </label>
                    <textarea
                      id="productDescription"
                      className="modal-input"
                      placeholder="Describe your product..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={loading || isSubmitting}
                    />
                  </div>
                )}

                {/* Images (if edit mode) */}
                {isEditMode && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Product Images * (Max 5)
                    </label>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        {imagePreviews.map((imageUrl, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: index === 0 ? '2px solid #5a6bff' : '1px solid rgba(0, 0, 0, 0.1)',
                                opacity: (loading || isSubmitting) ? 0.6 : 1
                              }}
                            />
                            {index === 0 && (
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                background: '#5a6bff',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                PRIMARY
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              disabled={loading || isSubmitting}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: (loading || isSubmitting) ? 0.5 : 1
                              }}
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Methods */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button
                        type="button"
                        className={uploadMethod === 'file' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setUploadMethod('file')}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '6px 12px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                      >
                        <Upload size={14} /> Upload
                      </button>
                      <button
                        type="button"
                        className={uploadMethod === 'camera' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setUploadMethod('camera')}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '6px 12px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                      >
                        <Camera size={14} /> Camera
                      </button>
                      <button
                        type="button"
                        className={uploadMethod === 'url' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setUploadMethod('url')}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '6px 12px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                      >
                        <Link size={14} /> URL
                      </button>
                    </div>

                    {/* Upload Interface */}
                    {uploadMethod === 'file' && imagePreviews.length < 5 && (
                      <div
                        className="image-upload-area"
                        onClick={() => !loading && !isSubmitting && fileInputRef.current?.click()}
                        style={{
                          opacity: (loading || isSubmitting) ? 0.5 : 1,
                          cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Upload size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
                          {(loading || isSubmitting) ? 'Processing...' : 'Click to upload or drag & drop'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.5 }}>
                          Max 5MB • JPG, PNG, WebP
                        </p>
                      </div>
                    )}

                    {uploadMethod === 'camera' && imagePreviews.length < 5 && (
                      <div>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => {
                            if (loading || isSubmitting) return;
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.capture = 'environment';
                            input.onchange = (e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            };
                            input.click();
                          }}
                          disabled={loading || isSubmitting}
                          style={{ width: '100%', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                        >
                          <Camera size={16} />
                          {(loading || isSubmitting) ? 'Processing...' : 'Take Photo'}
                        </button>
                      </div>
                    )}

                    {uploadMethod === 'url' && imagePreviews.length < 5 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="url"
                          className="modal-input"
                          placeholder="https://example.com/image.jpg"
                          disabled={loading || isSubmitting}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value && !loading && !isSubmitting) {
                              handleUrlInput(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={loading || isSubmitting}
                          onClick={(e) => {
                            if (loading || isSubmitting) return;
                            const input = e.currentTarget.parentElement.querySelector('input[type="url"]');
                            if (input && input.value) {
                              handleUrlInput(input.value);
                              input.value = '';
                            }
                          }}
                          style={{ opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                        >
                          Add
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                      disabled={loading || isSubmitting}
                    />

                    {errors.image && (
                      <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} />
                        {errors.image}
                      </div>
                    )}
                  </div>
                )}

                {/* Features and Tags (if edit mode) */}
                {isEditMode && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Features */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                        Key Features
                      </label>
                      <div style={{ marginBottom: '8px' }}>
                        {formData.features.map((feature, index) => (
                          <div key={index} className="feature-item">
                            <span style={{ fontSize: '14px' }}>{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              disabled={loading || isSubmitting}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                opacity: (loading || isSubmitting) ? 0.5 : 1
                              }}
                              aria-label={`Remove feature ${index + 1}`}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="modal-input"
                          placeholder="Add a feature..."
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !loading && !isSubmitting && addFeature()}
                          disabled={loading || isSubmitting}
                          style={{ fontSize: '12px', padding: '8px 12px' }}
                        />
                        <button
                          type="button"
                          onClick={addFeature}
                          disabled={loading || isSubmitting}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '8px 12px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                          aria-label="Add feature"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                        Tags
                      </label>
                      <div style={{ marginBottom: '8px', minHeight: '40px' }}>
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="tag-chip">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(index)}
                              disabled={loading || isSubmitting}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                                cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                                opacity: (loading || isSubmitting) ? 0.5 : 1
                              }}
                              aria-label={`Remove tag ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="modal-input"
                          placeholder="Add a tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !loading && !isSubmitting && addTag()}
                          disabled={loading || isSubmitting}
                          style={{ fontSize: '12px', padding: '8px 12px' }}
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          disabled={loading || isSubmitting}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '8px 12px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                          aria-label="Add tag"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specifications (if edit mode) */}
                {isEditMode && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Product Specifications (Optional)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Dimensions"
                        value={formData.specifications.dimensions}
                        onChange={(e) => handleInputChange('specifications.dimensions', e.target.value)}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Weight"
                        value={formData.specifications.weight}
                        onChange={(e) => handleInputChange('specifications.weight', e.target.value)}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Materials"
                        value={formData.specifications.materials}
                        onChange={(e) => handleInputChange('specifications.materials', e.target.value)}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Origin/Brand"
                        value={formData.specifications.origin}
                        onChange={(e) => handleInputChange('specifications.origin', e.target.value)}
                        disabled={loading || isSubmitting}
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Images & Details (Add mode only) */}
            {step === 2 && !isEditMode && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>
                    📸 Add Product Images
                  </h3>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {imagePreviews.map((imageUrl, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: index === 0 ? '3px solid #5a6bff' : '1px solid rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              opacity: (loading || isSubmitting) ? 0.6 : 1
                            }}
                          />
                          {index === 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              background: '#5a6bff',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              PRIMARY
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            disabled={loading || isSubmitting}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(239, 68, 68, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: (loading || isSubmitting) ? 0.5 : 1
                            }}
                            aria-label={`Remove image ${index + 1}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Methods */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className={uploadMethod === 'file' ? 'btn-primary' : 'btn-secondary'}
                      onClick={() => setUploadMethod('file')}
                      disabled={loading || isSubmitting}
                      style={{ fontSize: '12px', padding: '8px 16px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                    >
                      <Upload size={14} /> Upload Files
                    </button>
                    <button
                      type="button"
                      className={uploadMethod === 'camera' ? 'btn-primary' : 'btn-secondary'}
                      onClick={() => setUploadMethod('camera')}
                      disabled={loading || isSubmitting}
                      style={{ fontSize: '12px', padding: '8px 16px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                    >
                      <Camera size={14} /> Take Photos
                    </button>
                    <button
                      type="button"
                      className={uploadMethod === 'url' ? 'btn-primary' : 'btn-secondary'}
                      onClick={() => setUploadMethod('url')}
                      disabled={loading || isSubmitting}
                      style={{ fontSize: '12px', padding: '8px 16px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                    >
                      <Link size={14} /> Image URLs
                    </button>
                  </div>

                  {/* Upload Interface */}
                  {uploadMethod === 'file' && imagePreviews.length < 5 && (
                    <div
                      className="image-upload-area"
                      onClick={() => !loading && !isSubmitting && fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!loading && !isSubmitting) e.currentTarget.classList.add('dragover');
                      }}
                      onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('dragover');
                        if (!loading && !isSubmitting) {
                          const files = Array.from(e.dataTransfer.files);
                          files.forEach(file => handleImageUpload(file));
                        }
                      }}
                      style={{
                        opacity: (loading || isSubmitting) ? 0.5 : 1,
                        cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Upload size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                        {(loading || isSubmitting) ? 'Processing...' : 'Click to upload or drag & drop'}
                      </p>
                      <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.6 }}>
                        Max 5MB each • JPG, PNG, WebP • {5 - imagePreviews.length} remaining
                      </p>
                    </div>
                  )}

                  {uploadMethod === 'camera' && imagePreviews.length < 5 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <Camera size={48} style={{ opacity: 0.5 }} />
                        <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.7 }}>
                          Take photos of your product from different angles
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          if (loading || isSubmitting) return;
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment';
                          input.onchange = (e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          };
                          input.click();
                        }}
                        disabled={loading || isSubmitting}
                        style={{ width: '200px', opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                      >
                        <Camera size={16} />
                        {(loading || isSubmitting) ? 'Processing...' : 'Take Photo'}
                      </button>
                    </div>
                  )}

                  {uploadMethod === 'url' && imagePreviews.length < 5 && (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="url"
                          className="modal-input"
                          placeholder="https://example.com/image.jpg"
                          disabled={loading || isSubmitting}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value && !loading && !isSubmitting) {
                              handleUrlInput(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={loading || isSubmitting}
                          onClick={(e) => {
                            if (loading || isSubmitting) return;
                            const input = e.currentTarget.parentElement.querySelector('input');
                            if (input && input.value) {
                              handleUrlInput(input.value);
                              input.value = '';
                            }
                          }}
                          style={{ opacity: (loading || isSubmitting) ? 0.5 : 1 }}
                        >
                          Add
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>
                        Enter image URLs one at a time
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    disabled={loading || isSubmitting}
                  />

                  {errors.image && (
                    <div style={{ color: '#dc2626', fontSize: '14px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <AlertCircle size={16} />
                      {errors.image}
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label htmlFor="categorySelect" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                        Category
                      </label>
                      <select
                        id="categorySelect"
                        className="modal-input"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        disabled={loading || isSubmitting}
                      >
                        <option value="">Select category (optional)</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="conditionSelect" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                        Condition
                      </label>
                      <select
                        id="conditionSelect"
                        className="modal-input"
                        value={formData.specifications.condition}
                        onChange={(e) => handleInputChange('specifications.condition', e.target.value)}
                        disabled={loading || isSubmitting}
                      >
                        {conditions.map(condition => (
                          <option key={condition} value={condition}>{condition}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="descArea" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Description
                    </label>
                    <textarea
                      id="descArea"
                      className="modal-input"
                      placeholder="Describe your product, materials, size, etc..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={loading || isSubmitting}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.6 }}>
                      {formData.description?.length || 0}/500 characters
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review (Add mode only) */}
            {step === 3 && !isEditMode && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700 }}>
                  🔍 Review Your Product
                </h3>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Product Images */}
                    <div style={{ flexShrink: 0 }}>
                      {imagePreviews[0] ? (
                        <div>
                          <img
                            src={imagePreviews[0]}
                            alt={formData.name}
                            style={{
                              width: '120px',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: '1px solid rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          {imagePreviews.length > 1 && (
                            <p style={{ margin: '4px 0 0', fontSize: '10px', textAlign: 'center', opacity: 0.7 }}>
                              +{imagePreviews.length - 1} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          width: '120px',
                          height: '120px',
                          background: '#f3f4f6',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af'
                        }}>
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
                        {formData.name || 'Product Name'}
                      </h4>

                      <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>Price</span>
                          <span style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>
                            {formatPrice(formData.price)}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>Stock</span>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>
                            {formData.quantity} units
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', opacity: 0.7, display: 'block' }}>Condition</span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>
                            {formData.specifications.condition}
                          </span>
                        </div>
                      </div>

                      {formData.category && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', opacity: 0.7 }}>Category: </span>
                          <span style={{ fontSize: '14px' }}>{formData.category}</span>
                        </div>
                      )}

                      {formData.description && (
                        <div>
                          <span style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>Description</span>
                          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, opacity: 0.8 }}>
                            {formData.description.length > 100
                              ? formData.description.substring(0, 100) + '...'
                              : formData.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '14px', color: '#059669' }}>
                    Product ready to be added to your catalog
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 32px 32px',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ flex: 1 }}>
              {/* Draft indicator for add mode */}
              {!isEditMode && formData.name && (
                <span style={{ fontSize: '12px', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  💾 Draft saved locally
                </span>
              )}
              {/* Changes indicator for edit mode */}
              {isEditMode && isDirty && (
                <span style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚠️ Unsaved changes
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Navigation buttons for add mode */}
              {!isEditMode && (
                <>
                  {step > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={prevStep}
                      disabled={loading || isSubmitting}
                    >
                      ← Previous
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={nextStep}
                      disabled={loading || isSubmitting}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleSubmit}
                      disabled={loading || isSubmitting}
                    >
                      {loading || isSubmitting ? (
                        <>
                          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          Adding Product...
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Add to Catalog
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Save button for edit mode */}
              {isEditMode && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || isSubmitting}
                >
                  {loading || isSubmitting ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Update Product
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddProductModal;