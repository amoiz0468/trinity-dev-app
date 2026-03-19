import apiClient from './apiClient';
import { PaymentResponse, ApiResponse } from '../types';

/**
 * Payment Service
 * Handles payment processing with PayPal integration
 */
class PaymentService {
  /**
   * Initialize PayPal payment
   */
  async initiatePayment(params: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<{ id: string; status: string; links: any[] }> {
    try {
      const response = await apiClient.post<any>(
        `/invoices/${params.orderId}/create_paypal_order/`
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate payment');
    }
  }

  /**
   * Execute PayPal payment after approval
   */
  async executePayment(orderId: string, paypalOrderId: string): Promise<any> {
    try {
      const response = await apiClient.post<any>(
        `/invoices/${orderId}/capture_paypal_order/`,
        { order_id: paypalOrderId }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Payment execution failed');
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ verified: boolean }>>(
        `/payments/verify/${transactionId}`
      );

      return response.success && response.data?.verified === true;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/payments/${paymentId}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Payment not found');
    } catch (error: any) {
      throw new Error(error.message || 'Payment not found');
    }
  }

  /**
   * Process direct payment (for future payment methods)
   */
  async processDirectPayment(
    orderId: string,
    paymentMethod: string,
    paymentDetails: any
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PaymentResponse>>(
        '/payments/process',
        {
          orderId,
          paymentMethod,
          paymentDetails,
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Payment processing failed');
    } catch (error: any) {
      throw new Error(error.message || 'Payment processing failed');
    }
  }

  /**
   * Request refund
   */
  async requestRefund(
    transactionId: string,
    amount: number,
    reason: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
        '/payments/refund',
        {
          transactionId,
          amount,
          reason,
        }
      );

      return response.success && response.data?.success === true;
    } catch (error: any) {
      console.error('Refund request error:', error);
      return false;
    }
  }
}

export default new PaymentService();
