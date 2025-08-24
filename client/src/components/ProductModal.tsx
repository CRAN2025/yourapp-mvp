import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Trash2 } from 'lucide-react';
import { ref, push, update, serverTimestamp } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { database, storage } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { insertProductSchema, categories, type Product, type InsertProduct } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSuccess?: () => void;
}

export default function ProductModal({ open, onClose, product, onSuccess }: ProductModalProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      quantity: product?.quantity || 0,
      category: product?.category || '',
      subcategory: product?.subcategory || '',
      images: product?.images || [],
      isActive: product?.isActive ?? true,
    },
  });

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return existingImages;

    const uploadPromises = imageFiles.map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const imageRef = storageRef(storage, `products/${user!.uid}/${fileName}`);
      
      await uploadBytes(imageRef, file);
      return getDownloadURL(imageRef);
    });

    const newImageUrls = await Promise.all(uploadPromises);
    return [...existingImages, ...newImageUrls];
  };

  const onSubmit = async (data: InsertProduct) => {
    if (!user) return;

    try {
      setLoading(true);

      const imageUrls = await uploadImages();
      const productData = {
        ...data,
        images: imageUrls,
      };

      if (product) {
        // Update existing product
        const productRef = ref(database, `users/${user.uid}/products/${product.id}`);
        await update(productRef, {
          ...productData,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Product updated',
          description: 'Your product has been successfully updated.',
        });
      } else {
        // Create new product
        const productsRef = ref(database, `users/${user.uid}/products`);
        await push(productsRef, {
          ...productData,
          sellerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Product created',
          description: 'Your product has been successfully created.',
        });
      }

      onSuccess?.();
      onClose();
      form.reset();
      setImageFiles([]);
      setExistingImages([]);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = async (imageUrl: string, index: number) => {
    try {
      // Remove from Firebase Storage
      const imageRef = storageRef(storage, imageUrl);
      await deleteObject(imageRef);
      
      // Remove from local state
      const newImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newImages);
      
      toast({
        title: 'Image removed',
        description: 'Image has been deleted.',
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Product Images *</label>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveExistingImage(imageUrl, index)}
                        data-testid={`remove-image-${index}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <ImageUpload
                files={imageFiles}
                onChange={setImageFiles}
                maxFiles={5 - existingImages.length}
                maxSize={1024 * 1024} // 1MB
              />
            </div>

            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Premium Wireless Headphones"
                      {...field}
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price and Quantity */}
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (CAD) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-product-price"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity in Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-product-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category and Subcategory */}
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Wireless Audio"
                        {...field}
                        data-testid="input-product-subcategory"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe your product features, benefits, and what makes it special..."
                      className="resize-none"
                      {...field}
                      data-testid="textarea-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="sm:w-auto"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="sm:flex-1"
                data-testid="button-save-product"
              >
                {loading ? 'Saving...' : product ? 'Update Product' : 'Save Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
