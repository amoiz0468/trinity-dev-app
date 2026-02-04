import apiClient from './apiClient';
import { Product, ApiResponse } from '../types';
import { ERROR_MESSAGES } from '../constants';

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
      const response = await apiClient.get<ApiResponse<Product>>(
        `/products/barcode/${barcode}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(ERROR_MESSAGES.BARCODE_NOT_FOUND);
    } catch (error: any) {
      throw new Error(error.message || ERROR_MESSAGES.BARCODE_NOT_FOUND);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(
        `/products/${productId}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Product not found');
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
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await apiClient.get<ApiResponse<Product[]>>(
        `/products?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
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
      const response = await apiClient.get<ApiResponse<Product[]>>(
        `/products/featured?limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
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
      const response = await apiClient.get<ApiResponse<Product[]>>(
        `/products/category/${category}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
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
      const response = await apiClient.get<ApiResponse<Product[]>>(
        `/products/search?q=${encodeURIComponent(query)}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
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
      const response = await apiClient.get<ApiResponse<{ available: boolean }>>(
        `/products/${productId}/stock?quantity=${quantity}`
      );

      return response.success && response.data?.available === true;
    } catch (error: any) {
      console.error('Error checking stock:', error);
      return false;
    }
  }
}

export default new ProductService();
