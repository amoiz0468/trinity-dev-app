import { Product, ApiResponse } from '../types';
import { ERROR_MESSAGES, API_CONFIG } from '../constants';
import { mockProducts } from '../utils/mockAdminData';
import apiClient from './apiClient';

/**
 * Product Service
 * Handles product-related API operations
 */
class ProductService {
  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<Product> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const product = mockProducts.find(p => p.barcode === barcode);
        if (product) return product;
        throw new Error(ERROR_MESSAGES.BARCODE_NOT_FOUND);
      }

      const response = await apiClient.get<ApiResponse<Product>>(`/products/barcode/${barcode}`);
      if (response.success && response.data) return response.data;
      throw new Error(response.message || ERROR_MESSAGES.BARCODE_NOT_FOUND);
    } catch (error: any) {
      throw new Error(error.message || ERROR_MESSAGES.BARCODE_NOT_FOUND);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<Product> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const product = mockProducts.find(p => p.id === productId);
        if (product) return product;
        throw new Error('Product not found');
      }

      const response = await apiClient.get<ApiResponse<Product>>(`/products/${productId}`);
      if (response.success && response.data) return response.data;
      throw new Error(response.message || 'Product not found');
    } catch (error: any) {
      throw new Error(error.message || 'Product not found');
    }
  }

  /**
   * Get all products with optional filters
   */
  async getProducts(filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        let products = [...mockProducts];

        if (filters?.category) {
          products = products.filter(p => p.category === filters.category);
        }

        if (filters?.search) {
          const query = filters.search.toLowerCase();
          products = products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query)
          );
        }

        const offset = filters?.offset || 0;
        const limit = filters?.limit || products.length;

        return products.slice(offset, offset + limit);
      }

      const queryParams = new URLSearchParams({
        ...(filters?.category && { category: filters.category }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.limit && { limit: filters.limit.toString() }),
        ...(filters?.offset && { offset: filters.offset.toString() }),
      });

      const response = await apiClient.get<ApiResponse<Product[]>>(`/products?${queryParams}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Get featured/recommended products
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockProducts.slice(0, limit);
      }

      const response = await apiClient.get<ApiResponse<Product[]>>(`/products/featured?limit=${limit}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockProducts.filter(p => p.category === category);
      }

      const response = await apiClient.get<ApiResponse<Product[]>>(`/products/category/${category}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const lowercaseQuery = query.toLowerCase();
        return mockProducts.filter(p =>
          p.name.toLowerCase().includes(lowercaseQuery) ||
          p.brand.toLowerCase().includes(lowercaseQuery) ||
          p.category.toLowerCase().includes(lowercaseQuery)
        );
      }

      const response = await apiClient.get<ApiResponse<Product[]>>(`/products/search?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Check product stock availability
   */
  async checkStock(productId: string, quantity: number): Promise<boolean> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        const product = mockProducts.find(p => p.id === productId);
        return (product?.stock || 0) >= quantity;
      }

      const response = await apiClient.get<ApiResponse<{ available: boolean }>>(`/products/${productId}/stock?quantity=${quantity}`);
      return response.data?.available || false;
    } catch (error: any) {
      console.error('Error checking stock:', error);
      return false;
    }
  }
}

export default new ProductService();
