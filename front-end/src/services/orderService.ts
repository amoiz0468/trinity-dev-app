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
    billingInfo: BillingInfo,
    paymentMethod: string = 'paypal'
  ): Promise<Order> {
    try {
      const orderData = {
        items: items.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        })),
        payment_method: paymentMethod,
        tax_rate: 20.00,
        billing_first_name: billingInfo.firstName,
        billing_last_name: billingInfo.lastName,
        billing_address: billingInfo.address,
        billing_zip_code: billingInfo.zipCode,
        billing_city: billingInfo.city,
        billing_country: 'Switzerland', // Default as not collected yet
        notes: '',
      };

      const response = await apiClient.post<Order>(
        '/invoices/',
        orderData
      );

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(
        `/invoices/${orderId}/`
      );
      return response;
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
      const response = await apiClient.get<any>(
        `/invoices/history/?limit=${limit}&offset=${offset}`
      );
      return response.results || (Array.isArray(response) ? response : []);
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
      const response = await apiClient.patch<Order>(
        `/invoices/${orderId}/status/`,
        { status }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.post<Order>(
        `/invoices/${orderId}/cancel/`
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel order');
    }
  }

  /**
   * Get order receipt/invoice
   */
  async getOrderReceipt(orderId: string): Promise<string> {
    try {
      const response = await apiClient.get<{ receiptUrl: string }>(
        `/invoices/${orderId}/receipt/`
      );

      if (response.receiptUrl) {
        return response.receiptUrl;
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
      await apiClient.post<void>(
        `/invoices/${orderId}/send-receipt/`,
        { email }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send receipt');
    }
  }
}

export default new OrderService();
