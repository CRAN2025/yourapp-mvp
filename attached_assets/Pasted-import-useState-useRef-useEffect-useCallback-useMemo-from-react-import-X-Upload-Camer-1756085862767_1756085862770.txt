import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Upload, Camera, Link, Check, AlertCircle, Loader, Plus } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { storage, db } from './firebase';
import { 
  createEnhancedProduct, 
  validateProductData,
  getProductImageUrl,
  formatPrice
} from './sharedUtils';

const AddProductModal = ({
  isOpen,
  onClose,
  user,
  userProfile,
  onProductAdded,
  editProduct = null
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
  const [uploadMethod, setUploadMethod] = useState('file');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');

  const fileInputRef = useRef(null);
  const initialFormState = useRef({});
  const isEditMode = !!editProduct;

  const categories = [
    '👗 Fashion & Clothing', '📱 Electronics', '🍔 Food & Beverages', '💄 Beauty & Cosmetics',
    '🏠 Home & Garden', '📚 Books & Education', '🎮 Sports & Gaming', '👶 Baby & Kids',
    '🚗 Automotive', '🎨 Arts & Crafts', '💊 Health & Wellness', '🔧 Tools & Hardware',
    '🎁 Gifts & Souvenirs', '💍 Jewelry & Accessories', '📦 Other'
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Used'];

  // Validate required props
  const isValidSetup = useMemo(() => {
    return user?.uid && userProfile && typeof onClose === 'function';
  }, [user?.uid, userProfile, onClose]);

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEditMode && editProduct && isValidSetup) {
      const editData = {
        name: editProduct.name || '',
        price: editProduct.price?.toString() || '',
        quantity: editProduct.quantity?.toString() || '',
        category: editProduct.category || '',
        subcategory: editProduct.subcategory || '',
        description: typeof editProduct.description === 'string'
          ? editProduct.description
          : editProduct.description?.full || '',
        specifications: {
          dimensions: '',
          weight: '',
          materials: '',
          care: '',
          condition: 'New',
          origin: '',
          ...editProduct.specifications
        },
        features: Array.isArray(editProduct.features) ? editProduct.features : [],
        tags: Array.isArray(editProduct.tags) ? editProduct.tags : [],
        images: {
          primary: editProduct.images?.primary || '',
          gallery: Array.isArray(editProduct.images?.gallery) ? editProduct.images.gallery : []
        }
      };

      setFormData(editData);
      initialFormState.current = JSON.parse(JSON.stringify(editData));

      // Set image previews - only from images.primary and gallery
      const allImages = [
        editProduct.images?.primary,
        ...(Array.isArray(editProduct.images?.gallery) ? editProduct.images.gallery : [])
      ].filter(Boolean);

      setImagePreviews(allImages);
      setIsDirty(false);
    }
  }, [isEditMode, editProduct, isValidSetup]);

  // Track changes for unsaved warning (edit mode only)
  useEffect(() => {
    if (!isEditMode || !isValidSetup) return;

    const currentFormString = JSON.stringify(formData);
    const initialFormString = JSON.stringify(initialFormState.current);
    const hasActualChanges = currentFormString !== initialFormString;
    
    setIsDirty(hasActualChanges);
  }, [formData, isEditMode, isValidSetup]);

  // Auto-save draft (add mode only)
  useEffect(() => {
    if (!isEditMode && isOpen && !isSubmitting && formData.name && isValidSetup) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(`productDraft_${user.uid}`, JSON.stringify(formData));
        } catch (error) {
          console.warn('Failed to save draft:', error);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isEditMode, isOpen, isSubmitting, user?.uid, isValidSetup]);

  // Load draft on mount (add mode only)
  useEffect(() => {
    if (!isEditMode && isOpen && isValidSetup) {
      try {
        const draft = localStorage.getItem(`productDraft_${user.uid}`);
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          setFormData(parsedDraft);
        }
      } catch (error) {
        console.warn('Failed to load draft:', error);
        localStorage.removeItem(`productDraft_${user.uid}`);
      }
    }
  }, [isOpen, isEditMode, user?.uid, isValidSetup]);

  // Prevent browser navigation warning (edit mode with changes only)
  useEffect(() => {
    if (!isEditMode || !isDirty || isSubmitting) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return 'You have unsaved changes. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditMode, isDirty, isSubmitting]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { 
      if (e.key === 'Escape') handleClose(); 
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Safe input change handler
  const handleInputChange = useCallback((field, value) => {
    if (field.includes('.')) {
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

    // Clear errors
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
  }, [errors]);

  // Memoized price formatting
  const formatPriceDisplay = useCallback((value) => {
    if (!value) return '';
    const currency = userProfile?.currency || 'GHS';
    const numValue = Number(value);
    if (isNaN(numValue)) return value;
    return formatPrice(numValue, currency);
  }, [userProfile?.currency]);

  // SIMPLIFIED: Process images directly - no complex validation
  const processImages = useCallback(async () => {
    if (!imagePreviews || imagePreviews.length === 0) {
      return [];
    }

    const processedUrls = [];

    for (let i = 0; i < imagePreviews.length; i++) {
      const preview = imagePreviews[i];
      const file = imageFiles[i];

      // If it's a file (blob/data URL), upload to Firebase
      if (file && file instanceof File) {
        try {
          const imageRef = ref(storage, `stores/${user.uid}/${Date.now()}_${i}_${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          processedUrls.push(url);
          console.log(`✅ Uploaded file ${i + 1}: ${url}`);
        } catch (error) {
          console.error(`❌ Failed to upload file ${i + 1}:`, error);
          throw new Error(`Failed to upload image: ${file.name}`);
        }
      }
      // If it's already a URL (user pasted a link), use it directly
      else if (typeof preview === 'string' && (preview.startsWith('http') || preview.startsWith('data:'))) {
        processedUrls.push(preview);
        console.log(`✅ Using URL ${i + 1}: ${preview}`);
      }
    }

    return processedUrls;
  }, [imagePreviews, imageFiles, user?.uid]);

  // Image upload handler - simplified
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;

    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
      return;
    }

    if (imagePreviews.length >= 5) {
      setErrors(prev => ({ ...prev, image: 'Maximum 5 images allowed' }));
      return;
    }

    try {
      setImageFiles(prev => [...prev, file]);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
        setErrors(prev => ({ ...prev, image: null }));
      };
      reader.onerror = () => {
        setErrors(prev => ({ ...prev, image: 'Failed to read image file' }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({ ...prev, image: 'Failed to process image' }));
    }
  }, [imagePreviews.length]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => handleImageUpload(file));
  }, [handleImageUpload]);

  const handleUrlInput = useCallback((url) => {
    try {
      const u = new URL(url);
      const protocolOK = /^https?:$/.test(u.protocol);
      
      if (!protocolOK) {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      setErrors(prev => ({ ...prev, image: 'Enter a valid image URL' }));
      return;
    }

    if (imagePreviews.length >= 5) {
      setErrors(prev => ({ ...prev, image: 'Maximum 5 images allowed' }));
      return;
    }

    setImagePreviews(prev => [...prev, url]);
    setErrors(prev => ({ ...prev, image: null }));
  }, [imagePreviews.length]);

  const removeImage = useCallback((index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addFeature = useCallback(() => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  }, [newFeature]);

  const removeFeature = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  }, []);

  const addTag = useCallback(() => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  }, [newTag]);

  const removeTag = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  }, []);

  // Enhanced validation
  const validateForm = useCallback(() => {
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
  }, [formData, imagePreviews]);

  // SIMPLIFIED: Enhanced submit handler with direct image processing
  const handleSubmit = useCallback(async () => {
    if (!isValidSetup) {
      setErrors({ general: 'Invalid setup. Please refresh and try again.' });
      return;
    }

    if (!validateForm()) return;

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

    // Check for images - must have at least one
    if (!imagePreviews || imagePreviews.length === 0) {
      setErrors(p => ({ ...p, image: 'At least one image is required' }));
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    setIsDirty(false); // Clear dirty state immediately

    try {
      // Process all images (upload files, keep URLs as-is)
      const allImageUrls = await processImages();
      const status = qtyNum > 0 ? 'active' : 'out-of-stock';

      // Create product with SIMPLIFIED structure - only images.primary matters
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
          primary: allImageUrls[0] || '', // ONLY save primary - this is what getProductImageUrl() checks
          gallery: allImageUrls.slice(1) || []
        },
        status,
        source: 'manual',
        lastUpdated: Date.now(),
        ...(isEditMode ? {} : { createdAt: Date.now() })
      });

      console.log('Saving product with images:', enhancedProductData.images);

      if (isEditMode) {
        const productRef = dbRef(db, `users/${user.uid}/products/${editProduct.productId}`);
        await set(productRef, { ...enhancedProductData, productId: editProduct.productId });
      } else {
        const productsRef = dbRef(db, `users/${user.uid}/products`);
        const newRef = push(productsRef);
        const productId = newRef.key;
        await set(newRef, { ...enhancedProductData, productId });

        // Clear draft on successful save
        localStorage.removeItem(`productDraft_${user.uid}`);
      }

      if (onProductAdded) onProductAdded(enhancedProductData);
      handleClose();

    } catch (error) {
      console.error('Error saving product:', error);
      
      // Restore dirty state only for edit mode on error
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
  }, [
    isValidSetup, validateForm, formData, imagePreviews, processImages,
    isEditMode, editProduct, user, onProductAdded
  ]);

  // Enhanced close handler
  const handleClose = useCallback(() => {
    if (loading || isSubmitting) return;

    // Only show confirmation for edit mode with actual unsaved changes
    if (isEditMode && isDirty && !isSubmitting) {
      const confirmClose = window.confirm('You have unsaved changes. Close anyway?');
      if (!confirmClose) return;
    }

    resetForm();
    onClose();
  }, [loading, isSubmitting, isEditMode, isDirty, onClose]);

  const resetForm = useCallback(() => {
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
  }, []);

  const nextStep = useCallback(() => {
    if (step === 1) {
      const basicErrors = {};
      if (!formData.name.trim()) basicErrors.name = 'Product name is required';
      if (!formData.price || Number(formData.price) <= 0) basicErrors.price = 'Price must be greater than 0';

      if (Object.keys(basicErrors).length > 0) {
        setErrors(basicErrors);
        return;
      }
    }
    setStep(step + 1);
  }, [step, formData.name, formData.price]);

  const prevStep = useCallback(() => setStep(step - 1), [step]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Early return for invalid setup
  if (!isValidSetup) {
    console.warn('AddProductModal: Invalid setup - missing required props');
    return null;
  }

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

          {/* Progress Steps (add mode only) */}
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

            {/* Step 1: Basic Info OR Edit Mode All Content */}
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
                        {formatPriceDisplay(formData.price)}
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

                {/* Category and Condition */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    <label htmlFor="productCategory" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                      Category {!isEditMode && '*'}
                    </label>
                    <select
                      id="productCategory"
                      className="modal-input"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      disabled={loading || isSubmitting}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
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
                      {conditions.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
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

                {/* Images Section */}
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

                {/* Features and Tags */}
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

                {/* Specifications */}
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
              </div>
            )}

            {/* Step 2: Images & Details (add mode only) */}
            {!isEditMode && step === 2 && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Images & Additional Details</h3>
                
                {/* Category */}
                <div>
                  <label htmlFor="productCategory" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                    Category *
                  </label>
                  <select
                    id="productCategory"
                    className="modal-input"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={loading || isSubmitting}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="productDescription" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                    Description
                  </label>
                  <textarea
                    id="productDescription"
                    className="modal-input"
                    placeholder="Describe your product..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={loading || isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review (add mode only) */}
            {!isEditMode && step === 3 && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Review Your Product</h3>
                
                {/* Product Preview */}
                <div style={{ 
                  background: 'rgba(90,107,255,0.05)', 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: '1px solid rgba(90,107,255,0.1)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* Product Image Preview */}
                    <div>
                      {imagePreviews[0] ? (
                        <img
                          src={imagePreviews[0]}
                          alt="Product preview"
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '150px',
                          background: '#f8fafc',
                          border: '2px dashed #e2e8f0',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b'
                        }}>
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>
                        {formData.name || 'Product Name'}
                      </h4>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#059669' }}>
                        {formatPriceDisplay(formData.price) || 'Price'}
                      </p>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', opacity: 0.7 }}>
                        Quantity: {formData.quantity || 0} • Category: {formData.category || 'None'}
                      </p>
                      {formData.description && (
                        <p style={{ margin: '8px 0 0', fontSize: '14px', lineHeight: 1.5 }}>
                          {formData.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(formData.features.length > 0 || formData.tags.length > 0) && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      {formData.features.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <strong style={{ fontSize: '14px' }}>Features:</strong>
                          <div style={{ marginTop: '4px' }}>
                            {formData.features.map((feature, index) => (
                              <span key={index} style={{ 
                                display: 'inline-block',
                                background: 'rgba(34,197,94,0.1)',
                                color: '#059669',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                margin: '2px 4px 2px 0'
                              }}>
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.tags.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '14px' }}>Tags:</strong>
                          <div style={{ marginTop: '4px' }}>
                            {formData.tags.map((tag, index) => (
                              <span key={index} className="tag-chip">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Validation Summary */}
                <div style={{ 
                  background: 'rgba(34,197,94,0.05)', 
                  padding: '16px', 
                  borderRadius: '12px',
                  border: '1px solid rgba(34,197,94,0.2)'
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: '#059669' }}>
                    ✅ Ready to Publish
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                    <li>Product name and pricing set</li>
                    <li>Images uploaded ({imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''})</li>
                    <li>Category selected</li>
                    <li>Stock quantity defined</li>
                  </ul>
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