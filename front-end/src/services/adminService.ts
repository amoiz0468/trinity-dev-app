import { AdminStats, Customer, ReportData, Order, OrderStatus, Product } from '../types';
import {
  mockAdminStats,
  mockCustomers,
  mockReportData,
  mockAllOrders,
  mockProducts,
} from '../utils/mockAdminData';
import { API_CONFIG } from '../constants';
import apiClient from './apiClient';
import { toBackendInvoiceStatus, toFrontendOrderStatus } from '../utils/orderStatus';

class AdminService {
  private toTwoDecimals(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const normalizedValue = typeof value === 'string' ? value.replace(',', '.').trim() : value;
    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue)) {
      return undefined;
    }

    return Math.round(parsedValue * 100) / 100;
  }

  private mapOrder(invoice: any): Order {
    return {
      id: String(invoice.id || invoice.invoice_number || ''),
      userId: String(invoice.customer || ''),
      items: (invoice.items || []).map((item: any) => ({
        product: {
          id: String(item.product || item.product_details?.id || ''),
          name: item.product_name || item.product_details?.name || 'Unknown Item',
          brand: item.product_brand || item.product_details?.brand || '',
          price: Number(item.unit_price || item.product_details?.price || 0),
          stock: Number(item.product_details?.quantity_in_stock || 0),
          imageUrl: item.product_details?.picture_url || '',
          barcode: item.product_details?.barcode || '',
          category: item.product_details?.category_name || '',
        },
        quantity: Number(item.quantity || 0),
      })),
      totalAmount: Number(invoice.total_amount || 0),
      billingInfo: {
        firstName: invoice.billing_first_name || invoice.customer_name?.split(' ')[0] || 'Customer',
        lastName: invoice.billing_last_name || invoice.customer_name?.split(' ')[1] || '',
        address: invoice.billing_address || '',
        zipCode: invoice.billing_zip_code || '',
        city: invoice.billing_city || '',
        email: invoice.paypal_payer_email || '',
      },
      paymentMethod: invoice.payment_method || 'other',
      status: toFrontendOrderStatus(invoice.status),
      createdAt: invoice.created_at || new Date().toISOString(),
    };
  }

  private mapCustomer(data: any): Customer {
    return {
      id: String(data.id || ''),
      email: data.email || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      phone: data.phone_number || '',
      totalOrders: Number(data.order_count || data.total_orders || 0),
      lifetimeValue: Number(data.total_spent || data.lifetime_value || 0),
      lastOrderDate: data.last_order_date || data.lastOrderDate || undefined,
      createdAt: data.created_at || new Date().toISOString(),
    };
  }

  private mapProduct(data: any): Product {
    return {
      id: String(data.id || ''),
      name: data.name || '',
      barcode: data.barcode || '',
      brand: data.brand || '',
      category: data.category_name || data.category?.name || String(data.category || ''),
      price: Number(data.price || 0),
      stock: Number(data.quantity_in_stock || 0),
      imageUrl: data.picture_url || data.picture || '',
      description: data.description || '',
      nutritionalInfo: {
        calories: Number(data.energy_kcal || 0),
        protein: Number(data.proteins || 0),
        carbohydrates: Number(data.carbohydrates || 0),
        fat: Number(data.fat || 0),
        fiber: Number(data.fiber || 0),
        sugar: Number(data.sugars || 0),
        sodium: Number(data.salt || 0),
        servingSize: '100g',
      },
    };
  }

  private async resolveCategoryIdByName(categoryName?: string): Promise<number | undefined> {
    if (!categoryName) return undefined;
    const response = await apiClient.get<any>('/categories/');
    const categories = response.results || (Array.isArray(response) ? response : []);
    const match = categories.find((c: any) => c.name?.toLowerCase() === categoryName.toLowerCase());
    return match?.id;
  }

  private async toBackendProductPayload(product: Partial<Product>): Promise<any> {
    const payload: any = {
      name: product.name,
      brand: product.brand,
      description: product.description,
      barcode: product.barcode,
      picture_url: product.imageUrl,
      quantity_in_stock: product.stock,
      is_active: true,
    };

    const setDecimalField = (key: string, value: unknown): void => {
      const roundedValue = this.toTwoDecimals(value);
      if (roundedValue !== undefined) {
        payload[key] = roundedValue;
      }
    };

    setDecimalField('price', product.price);

    if (product.nutritionalInfo) {
      setDecimalField('energy_kcal', product.nutritionalInfo.calories);
      setDecimalField('proteins', product.nutritionalInfo.protein);
      setDecimalField('carbohydrates', product.nutritionalInfo.carbohydrates);
      setDecimalField('fat', product.nutritionalInfo.fat);
      setDecimalField('fiber', product.nutritionalInfo.fiber);
      setDecimalField('sugars', product.nutritionalInfo.sugar);
      setDecimalField('salt', product.nutritionalInfo.sodium);
    }

    if (typeof product.category === 'string') {
      const categoryId = await this.resolveCategoryIdByName(product.category);
      if (categoryId) payload.category = categoryId;
    }

    return payload;
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockAdminStats;
      }

      const [reportsResp, salesResp] = await Promise.all([
        apiClient.get<any>('/reports/'),
        apiClient.get<any>('/reports/sales/'),
      ]);

      const kpis = reportsResp.kpis || {};
      const salesByStatus = salesResp.sales_by_status || [];
      const findStatusCount = (status: string) =>
        salesByStatus.find((item: any) => item.status?.toLowerCase() === status.toLowerCase())?.count || 0;

      return {
        totalRevenue: Number(kpis.total_revenue || 0),
        totalOrders: Number(kpis.total_orders || 0),
        activeCustomers: Number(kpis.total_customers || 0),
        averageOrderValue: Number(kpis.average_order_value || 0),
        pendingOrders: findStatusCount('pending'),
        completedOrders: findStatusCount('paid'),
        cancelledOrders: findStatusCount('cancelled') + findStatusCount('refunded'),
        revenueGrowth: 0,
        orderGrowth: 0,
      };
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      throw new Error(error.message || 'Failed to fetch admin statistics');
    }
  }

  async getAllOrders(status?: OrderStatus, limit: number = 50, offset: number = 0): Promise<Order[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        let orders = mockAllOrders as Order[];
        if (status) orders = orders.filter((order) => order.status === status);
        return orders;
      }

      const statusQuery = status ? toBackendInvoiceStatus(status) : undefined;

      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(statusQuery ? { status: statusQuery } : {}),
      });

      const response = await apiClient.get<any>(`/invoices/?${queryParams}`);
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((invoice: any) => this.mapOrder(invoice));
    } catch (error: any) {
      console.error('Error fetching all orders:', error);
      throw new Error(error.message || 'Failed to fetch orders');
    }
  }

  async getAllCustomers(limit: number = 50, offset: number = 0): Promise<Customer[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockCustomers;
      }

      const response = await apiClient.get<any>(`/users/?limit=${limit}&offset=${offset}`);
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((c: any) => this.mapCustomer(c));
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      throw new Error(error.message || 'Failed to fetch customers');
    }
  }

  async getReportData(startDate?: string, endDate?: string): Promise<ReportData> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        return mockReportData;
      }

      const queryParams = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const [reportsResp, salesResp] = await Promise.all([
        apiClient.get<any>(`/reports/?${queryParams}`),
        apiClient.get<any>(`/reports/sales/?${queryParams}`),
      ]);

      return {
        dailyRevenue: (reportsResp.revenue_trend || []).map((item: any) => ({
          date: String(item.date || ''),
          amount: Number(item.revenue || 0),
        })),
        topProducts: (reportsResp.top_products || []).map((item: any) => ({
          productId: String(item.product__id || ''),
          name: item.product__name || 'Unknown',
          sales: Number(item.total_quantity || 0),
          revenue: Number(item.total_revenue || 0),
        })),
        orderStatusDistribution: (salesResp.sales_by_status || []).map((item: any) => ({
          status: item.status || 'Unknown',
          count: Number(item.count || 0),
        })),
        customerGrowth: (reportsResp.customer_growth || []).map((item: any) => ({
          date: String(item.date || ''),
          count: Number(item.count || 0),
        })),
        categoryPerformance: (reportsResp.category_performance || []).map((item: any) => ({
          categoryName: item.category_name || item.product__category__name || 'Uncategorized',
          revenue: Number(item.total_revenue || 0),
          quantity: Number(item.total_quantity || 0),
        })),
      };
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      throw new Error(error.message || 'Failed to fetch report data');
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const order = mockAllOrders.find((o) => o.id === orderId);
        if (!order) throw new Error('Order not found');
        order.status = status;
        return order as Order;
      }

      const backendStatus = toBackendInvoiceStatus(status) || status;
      const response = await apiClient.patch<any>(`/invoices/${orderId}/status/`, { status: backendStatus });
      return this.mapOrder(response);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  async searchOrders(query: string): Promise<Order[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const lowerQuery = query.toLowerCase();
        return (mockAllOrders as Order[]).filter((order) =>
          order.id.toLowerCase().includes(lowerQuery) ||
          order.billingInfo.firstName.toLowerCase().includes(lowerQuery) ||
          order.billingInfo.lastName.toLowerCase().includes(lowerQuery) ||
          order.billingInfo.email?.toLowerCase().includes(lowerQuery)
        );
      }

      const response = await apiClient.get<any>(`/invoices/?search=${encodeURIComponent(query)}`);
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((invoice: any) => this.mapOrder(invoice));
    } catch (error: any) {
      console.error('Error searching orders:', error);
      throw new Error(error.message || 'Failed to search orders');
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const lowerQuery = query.toLowerCase();
        return mockCustomers.filter((customer) =>
          customer.firstName.toLowerCase().includes(lowerQuery) ||
          customer.lastName.toLowerCase().includes(lowerQuery) ||
          customer.email.toLowerCase().includes(lowerQuery)
        );
      }

      const response = await apiClient.get<any>(`/users/?search=${encodeURIComponent(query)}`);
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((c: any) => this.mapCustomer(c));
    } catch (error: any) {
      console.error('Error searching customers:', error);
      throw new Error(error.message || 'Failed to search customers');
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return [...mockProducts];
      }

      const response = await apiClient.get<any>('/products/');
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((p: any) => this.mapProduct(p));
    } catch (error: any) {
      console.error('Error fetching products:', error);
      throw new Error(error.message || 'Failed to fetch products');
    }
  }

  async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const index = mockProducts.findIndex((p) => p.id === productId);
        if (index === -1) throw new Error('Product not found');
        mockProducts[index] = { ...mockProducts[index], ...data };
        return mockProducts[index];
      }

      const payload = await this.toBackendProductPayload(data);
      const response = await apiClient.put<any>(`/products/${productId}/`, payload);
      return this.mapProduct(response);
    } catch (error: any) {
      console.error('Error updating product:', error);
      throw new Error(error.message || 'Failed to update product');
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const index = mockProducts.findIndex((p) => p.id === productId);
        if (index === -1) return false;
        mockProducts.splice(index, 1);
        return true;
      }

      await apiClient.delete(`/products/${productId}/`);
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const lowerQuery = query.toLowerCase();
        return mockProducts.filter((p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.brand.toLowerCase().includes(lowerQuery) ||
          p.barcode.includes(lowerQuery)
        );
      }

      const response = await apiClient.get<any>(`/products/?search=${encodeURIComponent(query)}`);
      const results = response.results || (Array.isArray(response) ? response : []);
      return results.map((p: any) => this.mapProduct(p));
    } catch (error: any) {
      console.error('Error searching products:', error);
      throw new Error(error.message || 'Failed to search products');
    }
  }

  async addProduct(product: Partial<Product>): Promise<Product> {
    try {
      if (API_CONFIG.USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const newProduct: Product = {
          id: Math.random().toString(36).substr(2, 9),
          name: product.name || 'New Product',
          barcode: product.barcode || '',
          brand: product.brand || '',
          category: product.category || 'General',
          price: product.price || 0,
          stock: product.stock || 0,
          imageUrl: product.imageUrl || '',
          description: product.description,
          nutritionalInfo: product.nutritionalInfo,
        };
        mockProducts.unshift(newProduct);
        return newProduct;
      }

      const payload = await this.toBackendProductPayload(product);
      const response = await apiClient.post<any>('/products/', payload);
      return this.mapProduct(response);
    } catch (error: any) {
      console.error('Error adding product:', error);
      throw new Error(error.message || 'Failed to add product to inventory');
    }
  }

  async syncWithOpenFoodFacts(barcode: string): Promise<Product> {
    try {
      const response = await apiClient.post<any>('/products/sync_openfoodfacts/', { barcode });
      return this.mapProduct(response.product || response);
    } catch (error: any) {
      console.error('Error syncing with OpenFoodFacts:', error);
      throw new Error(error.message || 'Failed to sync with OpenFoodFacts');
    }
  }
}

export default new AdminService();
