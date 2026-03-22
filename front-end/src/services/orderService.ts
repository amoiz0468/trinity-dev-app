import apiClient from './apiClient';
import { Order, BillingInfo, CartItem, OrderStatus } from '../types';
import { toBackendInvoiceStatus, toFrontendOrderStatus } from '../utils/orderStatus';

/**
 * Order Service
 * Handles order-related API operations
 */
class OrderService {
  private mapInvoiceToOrder(invoice: any): Order {
    return {
      id: String(invoice.id || ''),
      userId: String(invoice.customer || invoice.userId || ''),
      items: (invoice.items || []).map((item: any) => ({
        product: item.product || item.product_details || {
          id: String(item.product || ''),
          name: item.product_name || 'Unknown',
          brand: item.product_brand || '',
          price: Number(item.unit_price || 0),
          stock: 0,
          imageUrl: '',
          barcode: '',
          category: '',
        },
        quantity: Number(item.quantity || 0),
      })),
      totalAmount: Number(invoice.totalAmount || invoice.total_amount || 0),
      billingInfo: invoice.billingInfo || {
        firstName: invoice.billing_first_name || '',
        lastName: invoice.billing_last_name || '',
        address: invoice.billing_address || '',
        zipCode: invoice.billing_zip_code || '',
        city: invoice.billing_city || '',
        email: invoice.paypal_payer_email || '',
      },
      paymentMethod: invoice.paymentMethod || invoice.payment_method || 'other',
      status: toFrontendOrderStatus(invoice.status),
      createdAt: invoice.createdAt || invoice.created_at || new Date().toISOString(),
    };
  }

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
          unit_price: item.unitPrice ?? item.product.currentPrice ?? item.product.price,
        })),
        payment_method: paymentMethod,
        tax_rate: 20.0,
        billing_first_name: billingInfo.firstName,
        billing_last_name: billingInfo.lastName,
        billing_address: billingInfo.address,
        billing_zip_code: billingInfo.zipCode,
        billing_city: billingInfo.city,
        billing_country: 'Switzerland',
      };

      const response = await apiClient.post<any>(
        '/invoices/',
        orderData
      );

      const mapped = this.mapInvoiceToOrder(response);
      if (!mapped.id) {
        throw new Error('Order created but missing id in response');
      }
      return mapped;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      if (!orderId || !String(orderId).trim()) {
        throw new Error('Invalid order id');
      }
      const response = await apiClient.get<any>(
        `/invoices/${orderId}/`
      );
      return this.mapInvoiceToOrder(response);
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
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((invoice: any) => this.mapInvoiceToOrder(invoice));
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
      const backendStatus = toBackendInvoiceStatus(status) || status;
      const response = await apiClient.patch<any>(
        `/invoices/${orderId}/status/`,
        { status: backendStatus }
      );
      return this.mapInvoiceToOrder(response);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.post<any>(
        `/invoices/${orderId}/cancel/`
      );
      return this.mapInvoiceToOrder(response);
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
      await apiClient.post(
        `/invoices/${orderId}/send-receipt/`,
        { email }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send receipt');
    }
  }
}

export default new OrderService();
