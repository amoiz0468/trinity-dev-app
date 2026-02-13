import { AdminStats, Customer, ReportData, Order, OrderStatus, Product } from '../types';
import {
    mockAdminStats,
    mockCustomers,
    mockReportData,
    mockAllOrders,
} from '../utils/mockAdminData';

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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // TODO: Replace with actual API call
            // const response = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
            // return response.data;

            return mockAdminStats;
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 600));

            // TODO: Replace with actual API call
            // const queryParams = new URLSearchParams({
            //   limit: limit.toString(),
            //   offset: offset.toString(),
            //   ...(status && { status }),
            // });
            // const response = await apiClient.get<ApiResponse<Order[]>>(
            //   `/admin/orders?${queryParams}`
            // );
            // return response.data;

            let orders = mockAllOrders as Order[];

            // Filter by status if provided
            if (status) {
                orders = orders.filter(order => order.status === status);
            }

            return orders;
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // TODO: Replace with actual API call
            // const response = await apiClient.get<ApiResponse<Customer[]>>(
            //   `/admin/customers?limit=${limit}&offset=${offset}`
            // );
            // return response.data;

            return mockCustomers;
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 700));

            // TODO: Replace with actual API call
            // const queryParams = new URLSearchParams({
            //   ...(startDate && { startDate }),
            //   ...(endDate && { endDate }),
            // });
            // const response = await apiClient.get<ApiResponse<ReportData>>(
            //   `/admin/reports?${queryParams}`
            // );
            // return response.data;

            return mockReportData;
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 400));

            // TODO: Replace with actual API call
            // const response = await apiClient.patch<ApiResponse<Order>>(
            //   `/admin/orders/${orderId}/status`,
            //   { status }
            // );
            // return response.data;

            // Mock implementation
            const order = mockAllOrders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                return order as Order;
            }

            throw new Error('Order not found');
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 400));

            // TODO: Replace with actual API call
            // const response = await apiClient.get<ApiResponse<Order[]>>(
            //   `/admin/orders/search?q=${encodeURIComponent(query)}`
            // );
            // return response.data;

            // Mock search implementation
            const lowerQuery = query.toLowerCase();
            return (mockAllOrders as Order[]).filter(order =>
                order.id.toLowerCase().includes(lowerQuery) ||
                order.billingInfo.firstName.toLowerCase().includes(lowerQuery) ||
                order.billingInfo.lastName.toLowerCase().includes(lowerQuery) ||
                order.billingInfo.email?.toLowerCase().includes(lowerQuery)
            );
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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 400));

            // TODO: Replace with actual API call
            // const response = await apiClient.get<ApiResponse<Customer[]>>(
            //   `/admin/customers/search?q=${encodeURIComponent(query)}`
            // );
            // return response.data;

            // Mock search implementation
            const lowerQuery = query.toLowerCase();
            return mockCustomers.filter(customer =>
                customer.firstName.toLowerCase().includes(lowerQuery) ||
                customer.lastName.toLowerCase().includes(lowerQuery) ||
                customer.email.toLowerCase().includes(lowerQuery)
            );
        } catch (error: any) {
            console.error('Error searching customers:', error);
            throw new Error(error.message || 'Failed to search customers');
        }
    }

    /**
     * Add a new product to the inventory
     */
    async addProduct(product: Partial<Product>): Promise<Product> {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // In a real app, this would be a POST request to '/admin/products'
            // For now, we simulate success and return the created product
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

            return newProduct;
        } catch (error: any) {
            console.error('Error adding product:', error);
            throw new Error(error.message || 'Failed to add product to inventory');
        }
    }
}

export default new AdminService();
