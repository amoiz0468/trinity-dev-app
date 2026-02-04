import apiClient from './apiClient';
import { Order, BillingInfo, CartItem, ApiResponse, OrderStatus } from '../types';

/**
 * Order Service
 * Handles order-related API operations
 */
class OrderService {
  /**
   * Create a new order
   */
  async createOrder(
    items: CartItem[],
    billingInfo: BillingInfo
  ): Promise<Order> {
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        billingInfo,
      };

      const response = await apiClient.post<ApiResponse<Order>>(
        '/orders',
        orderData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to create order');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(
        `/orders/${orderId}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Order not found');
    } catch (error: any) {
      throw new Error(error.message || 'Order not found');
    }
  }

  /**
   * Get user's order history
   */
  async getOrderHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<Order[]> {
    try {
      const response = await apiClient.get<ApiResponse<Order[]>>(
        `/orders/history?limit=${limit}&offset=${offset}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching order history:', error);
      return [];
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    try {
      const response = await apiClient.patch<ApiResponse<Order>>(
        `/orders/${orderId}/status`,
        { status }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to update order status');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.post<ApiResponse<Order>>(
        `/orders/${orderId}/cancel`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to cancel order');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel order');
    }
  }

  /**
   * Get order receipt/invoice
   */
  async getOrderReceipt(orderId: string): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<{ receiptUrl: string }>>(
        `/orders/${orderId}/receipt`
      );

      if (response.success && response.data?.receiptUrl) {
        return response.data.receiptUrl;
      }

      throw new Error('Receipt not available');
    } catch (error: any) {
      throw new Error(error.message || 'Receipt not available');
    }
  }

  /**
   * Send order receipt via email
   */
  async sendReceiptEmail(orderId: string, email: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        `/orders/${orderId}/send-receipt`,
        { email }
      );

      if (!response.success) {
        throw new Error('Failed to send receipt');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send receipt');
    }
  }
}

export default new OrderService();
