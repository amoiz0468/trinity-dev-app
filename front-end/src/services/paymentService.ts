import { PAYPAL_CONFIG } from '../constants';
import apiClient from './apiClient';
import { PaymentRequest, PaymentResponse, ApiResponse } from '../types';

/**
 * Payment Service
 * Handles payment processing with PayPal integration
 */
class PaymentService {
  /**
   * Initialize PayPal payment
   */
  async initiatePayment(paymentRequest: PaymentRequest): Promise<{ approvalUrl: string; paymentId: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ approvalUrl: string; paymentId: string }>>(
        '/payments/paypal/create',
        {
          ...paymentRequest,
          currency: PAYPAL_CONFIG.CURRENCY,
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to initiate payment');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate payment');
    }
  }

  /**
   * Execute PayPal payment after approval
   */
  async executePayment(
    paymentId: string,
    payerId: string
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PaymentResponse>>(
        '/payments/paypal/execute',
        {
          paymentId,
          payerId,
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Payment execution failed');
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
