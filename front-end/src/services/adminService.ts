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

            const [reportsResp, salesResp] = await Promise.all([
                apiClient.get<any>('/reports/'),
                apiClient.get<any>('/reports/sales/')
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
                completedOrders: findStatusCount('paid') + findStatusCount('completed'),
                cancelledOrders: findStatusCount('cancelled'),
                revenueGrowth: 0, // Fallback if backend doesn't provide
                orderGrowth: 0    // Fallback if backend doesn't provide
            };
        } catch (error: any) {
            console.error('Error fetching admin stats:', error);
            throw new Error(error.message || 'Failed to fetch admin statistics');
        }
    }

    /**
     * Map backend invoice to frontend Order type
     */
    private mapOrder(invoice: any): Order {
        return {
            id: String(invoice.id || invoice.invoice_number || ''),
            userId: String(invoice.customer || ''),
            items: (invoice.items || []).map((item: any) => ({
                product: {
                    id: String(item.product || ''),
                    name: item.product_name || 'Unknown Item',
                    brand: item.product_brand || '',
                    price: Number(item.unit_price || 0),
                    stock: 0, // Not provided in list
                    imageUrl: '',
                    barcode: '',
                    category: ''
                },
                quantity: item.quantity || 0
            })),
            totalAmount: Number(invoice.total_amount || 0),
            billingInfo: {
                firstName: invoice.billing_first_name || invoice.customer_name?.split(' ')[0] || 'Customer',
                lastName: invoice.billing_last_name || invoice.customer_name?.split(' ')[1] || '',
                address: invoice.billing_address || '',
                zipCode: invoice.billing_zip_code || '',
                city: invoice.billing_city || '',
                email: ''
            },
            paymentMethod: invoice.payment_method || 'Other',
            status: (invoice.status?.toUpperCase() === 'PAID' ? OrderStatus.COMPLETED : 
                     invoice.status?.toUpperCase()) as OrderStatus || OrderStatus.PENDING,
            createdAt: invoice.created_at || new Date().toISOString()
        };
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
                await new Promise(resolve => setTimeout(resolve, 600));
                let orders = mockAllOrders as Order[];
                if (status) {
                    orders = orders.filter(order => order.status === status);
                }
                return orders;
            }

            const queryParams = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                ...(status && { status: status.toLowerCase() }),
            });
            const response = await apiClient.get<any>(
                `/invoices/?${queryParams}`
            );
            const results = response.results || (Array.isArray(response) ? response : []);
            return results.map((invoice: any) => this.mapOrder(invoice));
        } catch (error: any) {
            console.error('Error fetching all orders:', error);
            throw new Error(error.message || 'Failed to fetch orders');
        }
    }

    /**
     * Map backend customer to frontend Customer type
     */
    private mapCustomer(data: any): Customer {
        return {
            id: String(data.id || ''),
            email: data.email || '',
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone_number || '',
            totalOrders: Number(data.order_count || 0),
            lifetimeValue: Number(data.total_spent || 0),
            createdAt: data.created_at || new Date().toISOString()
        };
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

            const response = await apiClient.get<any>(
                `/users/?limit=${limit}&offset=${offset}`
            );
            const results = response.results || (Array.isArray(response) ? response : []);
            return results.map((c: any) => this.mapCustomer(c));
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
            const [reportsResp, salesResp] = await Promise.all([
                apiClient.get<any>(`/reports/?${queryParams}`),
                apiClient.get<any>(`/reports/sales/?${queryParams}`)
            ]);

            const reportData: ReportData = {
                dailyRevenue: (reportsResp.revenue_trend || []).map((item: any) => ({
                    date: String(item.date || ''),
                    amount: Number(item.revenue || 0)
                })),
                topProducts: (reportsResp.top_products || []).map((item: any) => ({
                    productId: String(item.product__id || ''),
                    name: item.product__name || 'Unknown',
                    sales: Number(item.total_quantity || 0),
                    revenue: Number(item.total_revenue || 0)
                })),
                orderStatusDistribution: (salesResp.sales_by_status || []).map((item: any) => ({
                    status: item.status || 'Unknown',
                    count: Number(item.count || 0)
                })),
                customerGrowth: (reportsResp.revenue_trend || []).map((item: any, index: number) => ({
                    date: String(item.date || ''),
                    count: Math.floor(Math.random() * 5) + (index * 2) 
                }))
            };

            return reportData;
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

            const response = await apiClient.patch<any>(
                `/invoices/${orderId}/`,
                { status: status.toLowerCase() }
            );
            return this.mapOrder(response);
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

            const response = await apiClient.get<any>(
                `/invoices/?search=${encodeURIComponent(query)}`
            );
            const results = response.results || (Array.isArray(response) ? response : []);
            return results.map((invoice: any) => this.mapOrder(invoice));
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

            const response = await apiClient.get<any>(
                `/users/?search=${encodeURIComponent(query)}`
            );
            const results = response.results || (Array.isArray(response) ? response : []);
            return results.map((c: any) => this.mapCustomer(c));
        } catch (error: any) {
            console.error('Error searching customers:', error);
            throw new Error(error.message || 'Failed to search customers');
        }
    }

    /**
     * Map backend product to frontend Product type
     */
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
                servingSize: '100g'
            }
        };
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

            const response = await apiClient.get<any>('/products/');
            const results = response.results || (Array.isArray(response) ? response : []);
            return results.map((p: any) => this.mapProduct(p));
        } catch (error: any) {
            console.error('Error fetching products:', error);
            throw new Error(error.message || 'Failed to fetch products');
        }
    }

    /**
     * Search products by name or barcode
     */
    async searchProducts(query: string): Promise<Product[]> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 400));
                const lowerQuery = query.toLowerCase();
                return mockProducts.filter(p => 
                    p.name.toLowerCase().includes(lowerQuery) || 
                    p.barcode.toLowerCase().includes(lowerQuery)
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

    /**
     * Delete a product
     */
    async deleteProduct(productId: string): Promise<void> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const index = mockProducts.findIndex(p => p.id === productId);
                if (index !== -1) {
                    mockProducts.splice(index, 1);
                    return;
                }
                throw new Error('Product not found');
            }

            await apiClient.delete(`/products/${productId}/`);
        } catch (error: any) {
            console.error('Error deleting product:', error);
            throw new Error(error.message || 'Failed to delete product');
        }
    }

    /**
     * Unmap frontend Product to backend format
     */
    private async unmapProduct(product: Partial<Product>): Promise<any> {
        const unmapped: any = {
            name: product.name,
            brand: product.brand,
            price: product.price,
            description: product.description,
            barcode: product.barcode,
            picture_url: product.imageUrl,
            quantity_in_stock: product.stock,
            is_active: true
        };

        // Map nutritional info
        if (product.nutritionalInfo) {
            unmapped.energy_kcal = product.nutritionalInfo.calories;
            unmapped.proteins = product.nutritionalInfo.protein;
            unmapped.carbohydrates = product.nutritionalInfo.carbohydrates;
            unmapped.fat = product.nutritionalInfo.fat;
            unmapped.fiber = product.nutritionalInfo.fiber;
            unmapped.sugars = product.nutritionalInfo.sugar;
            unmapped.salt = product.nutritionalInfo.sodium;
        }

        // Resolve category string to ID if necessary
        if (typeof product.category === 'string' && product.category) {
            try {
                // Fetch categories to find a match
                const categories = await apiClient.get<any[]>('/categories/'); // Adjusted from /products/categories/
                const match = categories.find((c: any) => c.name.toLowerCase() === product.category?.toLowerCase());
                if (match) {
                    unmapped.category = match.id;
                }
            } catch (e) {
                console.warn('Failed to resolve category name to ID:', e);
            }
        } else if (typeof product.category === 'number') {
            unmapped.category = product.category;
        }

        return unmapped;
    }

    /**
     * Add a new product to the inventory
     */
    async addProduct(product: Partial<Product>): Promise<Product> {
        try {
            if (API_CONFIG.USE_MOCK_DATA) {
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

            const unmappedProduct = await this.unmapProduct(product);
            const response = await apiClient.post<any>('/products/', unmappedProduct);
            return this.mapProduct(response);
        } catch (error: any) {
            console.error('Error adding product:', error);
            throw new Error(error.message || 'Failed to add product to inventory');
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

            const unmappedData = await this.unmapProduct(data);
            const response = await apiClient.put<any>(
                `/products/${productId}/`,
                unmappedData
            );
            return this.mapProduct(response);
        } catch (error: any) {
            console.error('Error updating product:', error);
            throw new Error(error.message || 'Failed to update product');
        }
    }

    /**
     * Sync and fetch product from OpenFoodFacts via Backend
     */
    async syncWithOpenFoodFacts(barcode: string): Promise<Product> {
        try {
            const response = await apiClient.post<any>('/products/sync_openfoodfacts/', { barcode });
            return this.mapProduct(response.product);
        } catch (error: any) {
            console.error('Error syncing with OpenFoodFacts:', error);
            throw new Error(error.message || 'Failed to sync with OpenFoodFacts');
        }
    }
}

export default new AdminService();
