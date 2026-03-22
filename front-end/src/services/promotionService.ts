import { Promotion } from '../types';
import { API_CONFIG } from '../constants';
import apiClient from './apiClient';

/**
 * Promotion Service
 * Handles promotion-related API operations
 */
class PromotionService {
  private mapPromotion(data: any): Promotion {
    return {
      id: String(data.id || ''),
      title: data.title || '',
      description: data.description || '',
      imageUrl: data.image_url || '',
      productId: data.product ? String(data.product) : undefined,
      productName: data.product_name || '',
      discountPercentage: data.discount_percentage ? Number(data.discount_percentage) : undefined,
      startDate: data.start_date || '',
      endDate: data.end_date || '',
      isActive: Boolean(data.is_active),
      isCurrentlyActive: Boolean(data.is_currently_active),
    };
  }

  /**
   * Get promotions.
   * Returns active promotions for users, and all promotions for admins.
   */
  async getActivePromotions(): Promise<Promotion[]> {
    try {
      const response = await apiClient.get<any>('/promotions/');
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((p: any) => this.mapPromotion(p));
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      return [];
    }
  }

  /**
   * Add a new promotion (Admin only)
   */
  async addPromotion(promotion: Partial<Promotion>): Promise<Promotion> {
    const payload = {
      title: promotion.title,
      description: promotion.description,
      image_url: promotion.imageUrl,
      product: promotion.productId,
      discount_percentage: promotion.discountPercentage,
      start_date: promotion.startDate,
      end_date: promotion.endDate,
      is_active: promotion.isActive,
    };

    const response = await apiClient.post<any>('/promotions/', payload);
    return this.mapPromotion(response);
  }

  /**
   * Update an existing promotion (Admin only)
   */
  async updatePromotion(promotionId: string, promotion: Partial<Promotion>): Promise<Promotion> {
    const payload = {
      title: promotion.title,
      description: promotion.description,
      image_url: promotion.imageUrl,
      product: promotion.productId,
      discount_percentage: promotion.discountPercentage,
      start_date: promotion.startDate,
      end_date: promotion.endDate,
      is_active: promotion.isActive,
    };

    const response = await apiClient.patch<any>(`/promotions/${promotionId}/`, payload);
    return this.mapPromotion(response);
  }

  /**
   * Delete a promotion (Admin only)
   */
  async deletePromotion(promotionId: string): Promise<void> {
    await apiClient.delete(`/promotions/${promotionId}/`);
  }
}

export default new PromotionService();
