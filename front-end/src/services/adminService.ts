import { AdminStats, Customer, ReportData, Order, OrderStatus, Product, ApiResponse } from '../types';
import {
    mockAdminStats,
    mockCustomers,
    mockReportData,
    mockAllOrders,
    mockProducts,
} from '../utils/mockAdminData';
import { API_CONFIG } from '../constants';
import apiClient from './apiClient';

/**
 * Admin Service
 * Handles admin-specific API operations
 * Currently using mock data for demonstration
 */
class AdminService {
    /**
     * Get admin dashboard statistics
     */
    async getAdminStats(): Promise<AdminStats> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                return mockAdminStats;
            }

            const response = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
            if (response.success && response.data) return response.data;
            throw new Error(response.message || 'Failed to fetch admin statistics');
        } catch (error: any) {
            console.error('Error fetching admin stats:', error);
            throw new Error(error.message || 'Failed to fetch admin statistics');
        }
    }

    /**
     * Get all orders with optional filtering
     */
    async getAllOrders(
        status?: OrderStatus,
        limit: number = 50,
        offset: number = 0
    ): Promise<Order[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 600));
                let orders = mockAllOrders as Order[];

                // Filter by status if provided
                if (status) {
                    orders = orders.filter(order => order.status === status);
                }

                return orders;
            }

            const queryParams = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                ...(status && { status }),
            });
            const response = await apiClient.get<ApiResponse<Order[]>>(
                `/admin/orders?${queryParams}`
            );
            return response.data || [];
        } catch (error: any) {
            console.error('Error fetching all orders:', error);
            throw new Error(error.message || 'Failed to fetch orders');
        }
    }

    /**
     * Get all customers
     */
    async getAllCustomers(
        limit: number = 50,
        offset: number = 0
    ): Promise<Customer[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                return mockCustomers;
            }

            const response = await apiClient.get<ApiResponse<Customer[]>>(
                `/admin/customers?limit=${limit}&offset=${offset}`
            );
            return response.data || [];
        } catch (error: any) {
            console.error('Error fetching customers:', error);
            throw new Error(error.message || 'Failed to fetch customers');
        }
    }

    /**
     * Get report data for analytics
     */
    async getReportData(
        startDate?: string,
        endDate?: string
    ): Promise<ReportData> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 700));
                return mockReportData;
            }

            const queryParams = new URLSearchParams({
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });
            const response = await apiClient.get<ApiResponse<ReportData>>(
                `/admin/reports?${queryParams}`
            );
            if (response.success && response.data) return response.data;
            throw new Error(response.message || 'Failed to fetch report data');
        } catch (error: any) {
            console.error('Error fetching report data:', error);
            throw new Error(error.message || 'Failed to fetch report data');
        }
    }

    /**
     * Update order status (admin only)
     */
    async updateOrderStatus(
        orderId: string,
        status: OrderStatus
    ): Promise<Order> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 400));
                const order = mockAllOrders.find(o => o.id === orderId);
                if (order) {
                    order.status = status;
                    return order as Order;
                }
                throw new Error('Order not found');
            }

            const response = await apiClient.patch<ApiResponse<Order>>(
                `/admin/orders/${orderId}/status`,
                { status }
            );
            if (response.success && response.data) return response.data;
            throw new Error(response.message || 'Failed to update order status');
        } catch (error: any) {
            console.error('Error updating order status:', error);
            throw new Error(error.message || 'Failed to update order status');
        }
    }

    /**
     * Search orders by customer name or order ID
     */
    async searchOrders(query: string): Promise<Order[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 400));
                const lowerQuery = query.toLowerCase();
                return (mockAllOrders as Order[]).filter(order =>
                    order.id.toLowerCase().includes(lowerQuery) ||
                    order.billingInfo.firstName.toLowerCase().includes(lowerQuery) ||
                    order.billingInfo.lastName.toLowerCase().includes(lowerQuery) ||
                    order.billingInfo.email?.toLowerCase().includes(lowerQuery)
                );
            }

            const response = await apiClient.get<ApiResponse<Order[]>>(
                `/admin/orders/search?q=${encodeURIComponent(query)}`
            );
            return response.data || [];
        } catch (error: any) {
            console.error('Error searching orders:', error);
            throw new Error(error.message || 'Failed to search orders');
        }
    }

    /**
     * Search customers by name or email
     */
    async searchCustomers(query: string): Promise<Customer[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 400));
                const lowerQuery = query.toLowerCase();
                return mockCustomers.filter(customer =>
                    customer.firstName.toLowerCase().includes(lowerQuery) ||
                    customer.lastName.toLowerCase().includes(lowerQuery) ||
                    customer.email.toLowerCase().includes(lowerQuery)
                );
            }

            const response = await apiClient.get<ApiResponse<Customer[]>>(
                `/admin/customers/search?q=${encodeURIComponent(query)}`
            );
            return response.data || [];
        } catch (error: any) {
            console.error('Error searching customers:', error);
            throw new Error(error.message || 'Failed to search customers');
        }
    }

    /**
     * Get all products for inventory management
     */
    async getProducts(): Promise<Product[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 600));
                return [...mockProducts];
            }

            const response = await apiClient.get<ApiResponse<Product[]>>('/admin/products');
            return response.data || [];
        } catch (error: any) {
            console.error('Error fetching products:', error);
            throw new Error(error.message || 'Failed to fetch products');
        }
    }

    /**
     * Update an existing product
     */
    async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const index = mockProducts.findIndex(p => p.id === productId);
                if (index !== -1) {
                    mockProducts[index] = { ...mockProducts[index], ...data };
                    return mockProducts[index];
                }
                throw new Error('Product not found');
            }

            const response = await apiClient.put<ApiResponse<Product>>(
                `/admin/products/${productId}`,
                data
            );
            if (response.success && response.data) return response.data;
            throw new Error(response.message || 'Failed to update product');
        } catch (error: any) {
            console.error('Error updating product:', error);
            throw new Error(error.message || 'Failed to update product');
        }
    }

    /**
     * Delete a product from inventory
     */
    async deleteProduct(productId: string): Promise<boolean> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 400));
                const index = mockProducts.findIndex(p => p.id === productId);
                if (index !== -1) {
                    mockProducts.splice(index, 1);
                    return true;
                }
                return false;
            }

            const response = await apiClient.delete<ApiResponse<any>>(`/admin/products/${productId}`);
            return response.success;
        } catch (error: any) {
            console.error('Error deleting product:', error);
            throw new Error(error.message || 'Failed to delete product');
        }
    }

    /**
     * Search products by name, brand, or barcode
     */
    async searchProducts(query: string): Promise<Product[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 400));
                const lowerQuery = query.toLowerCase();
                return mockProducts.filter(p =>
                    p.name.toLowerCase().includes(lowerQuery) ||
                    p.brand.toLowerCase().includes(lowerQuery) ||
                    p.barcode.includes(lowerQuery)
                );
            }

            const response = await apiClient.get<ApiResponse<Product[]>>(
                `/admin/products/search?q=${encodeURIComponent(query)}`
            );
            return response.data || [];
        } catch (error: any) {
            console.error('Error searching products:', error);
            throw new Error(error.message || 'Failed to search products');
        }
    }

    /**
     * Add a new product to the inventory
     */
    async addProduct(product: Partial<Product>): Promise<Product> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));

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

            const response = await apiClient.post<ApiResponse<Product>>('/admin/products', product);
            if (response.success && response.data) return response.data;
            throw new Error(response.message || 'Failed to add product');
        } catch (error: any) {
            console.error('Error adding product:', error);
            throw new Error(error.message || 'Failed to add product to inventory');
        }
    }
}

export default new AdminService();
