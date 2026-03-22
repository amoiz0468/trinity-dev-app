import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Platform,
    Alert,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Svg, { Path, Rect, Circle, G, Line, LinearGradient, Stop, Defs, Text as SvgText } from 'react-native-svg';
import { SPACING, TYPOGRAPHY } from '../constants';
import { AdminStats, Customer, ReportData, Order, OrderStatus, Product as ProductType, RootStackParamList, MainTabParamList } from '../types';
import AdminService from '../services/adminService';
import StatCard from '../components/StatCard';
import OrderListItem from '../components/OrderListItem';
import CustomerListItem from '../components/CustomerListItem';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/format';
import { useTheme } from '../contexts/ThemeContext';
import AdminProductListItem from '../components/AdminProductListItem';
import ProductModal from '../components/ProductModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'orders' | 'reports' | 'customers' | 'products';

const ORDER_STATUS_CONFIG: Record<string, { label: string; order: number }> = {
    pending: { label: 'Pending', order: 0 },
    processing: { label: 'Processing', order: 1 },
    paid: { label: 'Paid', order: 2 },
    cancelled: { label: 'Cancelled', order: 3 },
    refunded: { label: 'Refunded', order: 4 },
};

const getOrderStatusOrder = (status: string): number => {
    const key = status?.toLowerCase?.() || '';
    return ORDER_STATUS_CONFIG[key]?.order ?? 99;
};

const formatShortDate = (value: string): string => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// --- Custom SVG Chart Components ---

const RevenueAreaChart: React.FC<{ data: { amount: number }[] }> = ({ data }) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const chartHeight = 150;
    const chartWidth = SCREEN_WIDTH - (SPACING.xl * 4); // Adjusted for margin + padding
    const safeData = data.filter((d) => Number.isFinite(d.amount));

    if (safeData.length === 0) {
        return (
            <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Revenue Trend (7 Days)</Text>
                <Text style={styles.emptyChartText}>No revenue data available</Text>
            </View>
        );
    }

    const maxBase = Math.max(...safeData.map(d => d.amount), 1);
    const maxVal = maxBase * 1.2;
    const denominator = safeData.length > 1 ? safeData.length - 1 : 1;
    const points = safeData.map((d, i) => ({
        x: (i / denominator) * chartWidth,
        y: chartHeight - (d.amount / maxVal) * chartHeight
    }));
    const validPoints = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

    if (validPoints.length === 0) {
        return (
            <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Revenue Trend (7 Days)</Text>
                <Text style={styles.emptyChartText}>No revenue data available</Text>
            </View>
        );
    }

    const pathData = `M 0 ${chartHeight} ` + validPoints.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${chartWidth} ${chartHeight} Z`;
    const lineData = validPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Revenue Trend (7 Days)</Text>
            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.primary} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={theme.primary} stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                <Path d={pathData} fill="url(#grad)" />
                <Path d={lineData} fill="none" stroke={theme.primary} strokeWidth="3" />
                {validPoints.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="4" fill={theme.primary} />
                ))}
            </Svg>
        </View>
    );
};

const OrderBarChart: React.FC<{ data: { count: number; status: string }[] }> = ({ data }) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const chartHeight = 120;
    const chartWidth = SCREEN_WIDTH - (SPACING.xl * 4);
    const safeData = data
        .filter((d) => Number.isFinite(d.count))
        .sort((a, b) => getOrderStatusOrder(a.status) - getOrderStatusOrder(b.status));

    if (safeData.length === 0) {
        return (
            <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Orders by Status</Text>
                <Text style={styles.emptyChartText}>No order status data available</Text>
            </View>
        );
    }

    const getOrderStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            pending: theme.warning,
            processing: theme.secondary,
            paid: theme.success,
            cancelled: theme.error,
            refunded: theme.textSecondary,
        };
        return colors[status.toLowerCase()] || theme.primary;
    };

    const maxVal = Math.max(...safeData.map(d => d.count), 1) * 1.2;
    const barWidth = Math.min(52, Math.max(28, chartWidth / Math.max(safeData.length * 1.8, 1)));
    const gap = safeData.length > 1
        ? Math.max(8, (chartWidth - (safeData.length * barWidth)) / (safeData.length - 1))
        : 0;

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Orders by Status</Text>
            <Svg height={chartHeight + 34} width={chartWidth}>
                {safeData.map((d, i) => {
                    const h = (d.count / maxVal) * chartHeight;
                    const x = i * (barWidth + gap);
                    if (!Number.isFinite(h) || !Number.isFinite(x)) {
                        return null;
                    }
                    return (
                        <G key={i}>
                            <Rect
                                x={x}
                                y={chartHeight - h}
                                width={barWidth}
                                height={h}
                                fill={getOrderStatusColor(d.status)}
                                rx="6"
                            />
                            <SvgText
                                x={x + barWidth / 2}
                                y={Math.max(12, chartHeight - h - 6)}
                                fill={theme.text}
                                fontSize="11"
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {String(d.count)}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
            <View style={styles.chartLegendContainer}>
                {safeData.map((d, i) => (
                    <View key={`${d.status}-${i}`} style={styles.chartLegendItem}>
                        <View style={[styles.chartLegendDot, { backgroundColor: getOrderStatusColor(d.status) }]} />
                        <Text style={styles.chartLegendText}>
                            {d.status.charAt(0).toUpperCase() + d.status.slice(1).toLowerCase()}: {d.count}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const CustomerLineChart: React.FC<{ data: { date: string; count: number }[] }> = ({ data }) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const chartHeight = 100;
    const chartWidth = SCREEN_WIDTH - (SPACING.xl * 4);
    const safeData = data
        .filter((d) => Number.isFinite(d.count) && !!d.date)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (safeData.length === 0) {
        return (
            <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Customer Growth</Text>
                <Text style={styles.emptyChartText}>No customer growth data available</Text>
            </View>
        );
    }

    const maxVal = Math.max(...safeData.map(d => d.count), 1) * 1.1;
    const minVal = Math.min(...safeData.map(d => d.count), 0) * 0.9;
    const range = maxVal - minVal > 0 ? maxVal - minVal : 1;
    const denominator = safeData.length > 1 ? safeData.length - 1 : 1;

    const points = safeData.map((d, i) => ({
        x: (i / denominator) * chartWidth,
        y: chartHeight - ((d.count - minVal) / range) * chartHeight
    }));
    const validPoints = points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

    if (validPoints.length === 0) {
        return (
            <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Customer Growth</Text>
                <Text style={styles.emptyChartText}>No customer growth data available</Text>
            </View>
        );
    }

    const lineData = validPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const firstPoint = safeData[0];
    const lastPoint = safeData[safeData.length - 1];
    const growth = lastPoint.count - firstPoint.count;
    const middlePoint = safeData[Math.floor((safeData.length - 1) / 2)];

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Customer Growth</Text>
            <View style={styles.customerSummaryRow}>
                <Text style={styles.customerSummaryText}>Start: {firstPoint.count}</Text>
                <Text style={styles.customerSummaryText}>Now: {lastPoint.count}</Text>
                <Text style={[styles.customerSummaryText, growth >= 0 ? styles.growthPositive : styles.growthNegative]}>
                    {growth >= 0 ? '+' : ''}{growth}
                </Text>
            </View>
            <Svg height={chartHeight} width={chartWidth}>
                <Line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeWidth="1" />
                <Line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeWidth="1" />
                <Line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} strokeWidth="1" />
                <Path d={lineData} fill="none" stroke={theme.secondary} strokeWidth="3" />
                {validPoints.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="3" fill={theme.secondary} />
                ))}
            </Svg>
            <View style={styles.chartAxisLabels}>
                <Text style={styles.axisLabel}>{formatShortDate(firstPoint.date)}</Text>
                <Text style={styles.axisLabel}>{formatShortDate(middlePoint.date)}</Text>
                <Text style={styles.axisLabel}>{formatShortDate(lastPoint.date)}</Text>
            </View>
        </View>
    );
};

const CategoryDistributionChart: React.FC<{ data: { categoryName: string; revenue: number; quantity: number }[] }> = ({ data }) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const safeData = data
        .filter((item) => Number.isFinite(item.revenue) && item.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);

    const totalRevenue = safeData.reduce((sum, item) => sum + item.revenue, 0);

    if (safeData.length === 0 || totalRevenue <= 0) {
        return (
            <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Category Performance</Text>
                <Text style={styles.emptyChartText}>No category performance data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Category Performance</Text>
            {safeData.map((item, i) => {
                const percent = Math.round((item.revenue / totalRevenue) * 100);
                const barColor = i % 2 === 0 ? theme.accent : theme.primary;
                return (
                <View key={i} style={styles.categoryItem}>
                    <View style={styles.categoryHeaderRow}>
                        <Text style={styles.categoryName}>{item.categoryName}</Text>
                        <Text style={styles.categoryMeta}>{formatCurrency(item.revenue)} | {item.quantity} sold</Text>
                    </View>
                    <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${Math.max(percent, 3)}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={styles.categoryPercent}>{percent}% of revenue</Text>
                </View>
                );
            })}
        </View>
    );
};

// --- Main Screen Component ---

const AdminDashboardScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user, logout } = useAuth();
    const { clearCart } = useCart();
    const { theme, isDark, toggleTheme } = useTheme();

    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={toggleTheme}
                    style={{ marginRight: SPACING.md, padding: 8 }}
                    accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                    <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, isDark, toggleTheme]);
    const [activeTab, setActiveTab] = useState<TabType>('reports');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderFilter, setOrderFilter] = useState<OrderStatus | 'ALL'>('ALL');
    const [orderSearch, setOrderSearch] = useState('');

    // Reports state
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    // Customers state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');

    // Products state
    const [products, setProducts] = useState<ProductType[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
    const [showAddOptions, setShowAddOptions] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab, orderFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'orders') await loadOrders();
            else if (activeTab === 'reports') await loadReports();
            else if (activeTab === 'customers') await loadCustomers();
            else if (activeTab === 'products') await loadProducts();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async () => {
        const status = orderFilter === 'ALL' ? undefined : orderFilter;
        const ordersData = await AdminService.getAllOrders(status);
        setOrders(ordersData);
    };

    const loadReports = async () => {
        const [statsData, reportsData] = await Promise.all([
            AdminService.getAdminStats(),
            AdminService.getReportData(),
        ]);
        setStats(statsData);
        setReportData(reportsData);
    };

    const loadCustomers = async () => {
        const customersData = await AdminService.getAllCustomers();
        setCustomers(customersData);
    };

    const loadProducts = async () => {
        const productsData = await AdminService.getProducts();
        setProducts(productsData);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
        await AdminService.updateOrderStatus(orderId, status);
        await loadOrders();
    };

    const handleOrderSearch = async (query: string) => {
        setOrderSearch(query);
        if (query.trim() === '') await loadOrders();
        else {
            const results = await AdminService.searchOrders(query);
            setOrders(results);
        }
    };

    const handleCustomerSearch = async (query: string) => {
        setCustomerSearch(query);
        if (query.trim() === '') await loadCustomers();
        else {
            const results = await AdminService.searchCustomers(query);
            setCustomers(results);
        }
    };

    const handleProductSearch = async (query: string) => {
        setProductSearch(query);
        if (query.trim() === '') await loadProducts();
        else {
            const results = await AdminService.searchProducts(query);
            setProducts(results);
        }
    };

    const handleEditProduct = (product: ProductType) => {
        setEditingProduct(product);
        setIsProductModalVisible(true);
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsProductModalVisible(true);
    };

    const handleDeleteProduct = async (productId: string) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await AdminService.deleteProduct(productId);
                        await loadProducts();
                    }
                }
            ]
        );
    };

    const handleSaveProduct = async (productData: Partial<ProductType>) => {
        if (editingProduct) {
            await AdminService.updateProduct(editingProduct.id, productData);
        } else {
            await AdminService.addProduct(productData);
        }
        await loadProducts();
    };

    const handleDeleteCustomer = async (customerId: string) => {
        Alert.alert(
            'Delete User',
            'Are you sure you want to completely delete this user? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await AdminService.deleteCustomer(customerId);
                            await loadCustomers();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete user');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            await clearCart();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    const renderTabButton = (tab: TabType, label: string, icon: string) => (
        <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderOrdersTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChangeText={handleOrderSearch}
                    placeholderTextColor={theme.textSecondary}
                />
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContent}
                >
                    {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterChip, orderFilter === status && styles.filterChipActive]}
                            onPress={() => {
                                setOrderFilter(status as OrderStatus | 'ALL');
                                setOrderSearch('');
                            }}
                        >
                            <Text style={[styles.filterChipText, orderFilter === status && styles.filterChipTextActive]}>
                                {status === 'ALL' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.listWrapper}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
                ) : orders.length > 0 ? (
                    <FlatList
                        data={orders}
                        renderItem={({ item }) => (
                            <OrderListItem order={item} showActions onStatusChange={handleOrderStatusChange} />
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    />
                ) : (
                    <EmptyState icon="📦" title="No Orders" message="No matching orders found" />
                )}
            </View>
        </View>
    );

    const renderReportsTab = () => {
        if (loading) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={theme.primary} /></View>;
        if (!stats || !reportData) return <EmptyState icon="📊" title="No Data" message="Unable to load report data" />;

        return (
            <ScrollView
                style={styles.tabContent}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                <Text style={styles.sectionTitle}>Business Overview</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCardHalf}>
                        <StatCard icon="💰" title="Revenue" value={formatCurrency(stats.totalRevenue)} trend={stats.revenueGrowth} />
                    </View>
                    <View style={styles.statCardHalf}>
                        <StatCard icon="📦" title="Orders" value={stats.totalOrders} trend={stats.orderGrowth} />
                    </View>
                </View>

                <RevenueAreaChart data={reportData.dailyRevenue} />
                <View style={styles.sideBySideCharts}>
                    <OrderBarChart data={reportData.orderStatusDistribution} />
                </View>
                <CustomerLineChart data={reportData.customerGrowth} />
                <CategoryDistributionChart data={reportData.categoryPerformance} />

                <Text style={styles.sectionTitle}>Top Sellers</Text>
                {reportData.topProducts.map((product, index) => (
                    <View key={product.productId} style={styles.productItem}>
                        <View style={styles.productRank}>
                            <Text style={styles.productRankText}>#{index + 1}</Text>
                        </View>
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productSales}>{product.sales} sales</Text>
                        </View>
                        <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderCustomersTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChangeText={handleCustomerSearch}
                    placeholderTextColor={theme.textSecondary}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
            ) : customers.length > 0 ? (
                <FlatList
                    data={customers}
                    renderItem={({ item }) => (
                        <CustomerListItem
                            customer={item}
                            onDelete={handleDeleteCustomer}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            ) : (
                <EmptyState icon="👥" title="No Customers" message="No matching customers found" />
            )}
        </View>
    );

    const renderProductsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={productSearch}
                    onChangeText={handleProductSearch}
                    placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddOptions(!showAddOptions)}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {showAddOptions && (
                <View style={styles.addOptions}>
                    <TouchableOpacity
                        style={styles.addOptionItem}
                        onPress={() => {
                            setShowAddOptions(false);
                            handleAddProduct();
                        }}
                    >
                        <Text style={styles.addOptionIcon}>➕</Text>
                        <Text style={styles.addOptionLabel}>Add Manually</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addOptionItem}
                        onPress={() => {
                            setShowAddOptions(false);
                            (navigation as any).navigate('AdminScan');
                        }}
                    >
                        <Text style={styles.addOptionIcon}>📸</Text>
                        <Text style={styles.addOptionLabel}>Scan Barcode</Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
            ) : products.length > 0 ? (
                <FlatList
                    data={products}
                    renderItem={({ item }) => (
                        <AdminProductListItem
                            product={item}
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            ) : (
                <EmptyState icon="🍎" title="No Products" message="No matching products found" />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.headerTitleContainer}>
                        <Image
                            source={require('../../assets/trinity_logo.png')}
                            style={styles.logo}
                        />
                        <View>
                            <Text style={styles.headerTitle}>Admin Panel</Text>
                            <Text style={styles.headerSubtitle}>Manage your store</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.tabBar}>
                {renderTabButton('reports', 'Reports', '📊')}
                {renderTabButton('orders', 'Orders', '📦')}
                {renderTabButton('products', 'Products', '🍎')}
                {renderTabButton('customers', 'Users', '👥')}
            </View>

            <View style={styles.contentWrapper}>
                {activeTab === 'orders' && renderOrdersTab()}
                {activeTab === 'reports' && renderReportsTab()}
                {activeTab === 'customers' && renderCustomersTab()}
                {activeTab === 'products' && renderProductsTab()}
            </View>

            <ProductModal
                visible={isProductModalVisible}
                product={editingProduct}
                onClose={() => setIsProductModalVisible(false)}
                onSave={handleSaveProduct}
            />
        </SafeAreaView>
    );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        backgroundColor: theme.surface,
        padding: SPACING.xl,
        paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: SPACING.md,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    tabIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    tabLabelActive: {
        color: theme.primary,
        fontWeight: '800',
    },
    contentWrapper: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    filterWrapper: {
        marginBottom: SPACING.lg,
    },
    listWrapper: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        marginHorizontal: SPACING.xl,
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    searchInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: 16,
        color: theme.text,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: SPACING.sm,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginTop: -2,
    },
    addOptions: {
        backgroundColor: theme.surface,
        marginHorizontal: SPACING.xl,
        marginBottom: SPACING.md,
        borderRadius: 16,
        padding: SPACING.sm,
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: theme.border,
    },
    addOptionItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        padding: SPACING.md,
        borderRadius: 12,
        justifyContent: 'center',
    },
    addOptionIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    addOptionLabel: {
        color: theme.text,
        fontSize: 13,
        fontWeight: '700',
    },
    filterContainer: {
        marginBottom: SPACING.lg,
    },
    filterChip: {
        paddingHorizontal: 20,
        height: 38,
        borderRadius: 19,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    filterChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: 40,
    },
    filterContent: {
        paddingLeft: SPACING.xl,
        paddingRight: SPACING.xl,
    },
    loader: {
        marginTop: SPACING.xl,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.text,
        marginHorizontal: SPACING.xl,
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.xl,
        gap: SPACING.lg,
    },
    statCardHalf: {
        flex: 1,
    },
    chartWrapper: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 1)',
        marginHorizontal: SPACING.xl,
        marginBottom: SPACING.lg,
        padding: SPACING.xl,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 10,
        elevation: isDark ? 0 : 2,
    },
    chartTitle: {
        color: theme.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: SPACING.lg,
    },
    sideBySideCharts: {
        flexDirection: 'row',
    },
    chartLegendContainer: {
        marginTop: SPACING.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chartLegendItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    chartLegendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    chartLegendText: {
        color: theme.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    customerSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    customerSummaryText: {
        color: theme.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    growthPositive: {
        color: theme.success,
        fontWeight: '700',
    },
    growthNegative: {
        color: theme.error,
        fontWeight: '700',
    },
    chartAxisLabels: {
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    axisLabel: {
        color: theme.textSecondary,
        fontSize: 11,
        fontWeight: '500',
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    barRowLabel: {
        width: 70,
        color: theme.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    barBg: {
        flex: 1,
        height: 10,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderRadius: 5,
        marginHorizontal: SPACING.md,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    barVal: {
        width: 35,
        color: theme.text,
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'right',
    },
    categoryItem: {
        marginBottom: SPACING.md,
    },
    categoryHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    categoryName: {
        flex: 1,
        color: theme.text,
        fontSize: 13,
        fontWeight: '700',
    },
    categoryMeta: {
        color: theme.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        flexShrink: 1,
        textAlign: 'right',
    },
    categoryPercent: {
        color: theme.textSecondary,
        fontSize: 11,
        marginTop: 4,
        textAlign: 'right',
    },
    emptyChartText: {
        color: theme.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 1)',
        marginHorizontal: SPACING.xl,
        marginBottom: 10,
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0 : 0.03,
        shadowRadius: 5,
        elevation: isDark ? 0 : 1,
    },
    productRank: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    productRankText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.primary,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },
    productSales: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
    },
    productRevenue: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.primary,
    },
});

export default AdminDashboardScreen;
