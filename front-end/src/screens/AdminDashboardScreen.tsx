import React, { useState, useEffect } from 'react';
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
    SafeAreaView,
    Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, G, Line, LinearGradient, Stop, Defs, Text as SvgText } from 'react-native-svg';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { AdminStats, Customer, ReportData, Order, OrderStatus } from '../types';
import AdminService from '../services/adminService';
import StatCard from '../components/StatCard';
import OrderListItem from '../components/OrderListItem';
import CustomerListItem from '../components/CustomerListItem';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'orders' | 'reports' | 'customers';

// --- Custom SVG Chart Components ---

const RevenueAreaChart: React.FC<{ data: { amount: number }[] }> = ({ data }) => {
    const chartHeight = 150;
    const chartWidth = SCREEN_WIDTH - (SPACING.xl * 4); // Adjusted for margin + padding
    const maxVal = Math.max(...data.map(d => d.amount)) * 1.2;
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * chartWidth,
        y: chartHeight - (d.amount / maxVal) * chartHeight
    }));

    const pathData = `M 0 ${chartHeight} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${chartWidth} ${chartHeight} Z`;
    const lineData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Revenue Trend (7 Days)</Text>
            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={COLORS.primary} stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                <Path d={pathData} fill="url(#grad)" />
                <Path d={lineData} fill="none" stroke={COLORS.primary} strokeWidth="3" />
                {points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="4" fill={COLORS.primary} />
                ))}
            </Svg>
        </View>
    );
};

const OrderBarChart: React.FC<{ data: { count: number; status: string }[] }> = ({ data }) => {
    const chartHeight = 120;
    const chartWidth = SCREEN_WIDTH - (SPACING.xl * 4);
    const maxVal = Math.max(...data.map(d => d.count)) * 1.2;
    const barWidth = 40;
    const gap = (chartWidth - (data.length * barWidth)) / (data.length - 1);

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Orders by Status</Text>
            <Svg height={chartHeight + 30} width={chartWidth}>
                {data.map((d, i) => {
                    const h = (d.count / maxVal) * chartHeight;
                    const x = i * (barWidth + gap);
                    return (
                        <G key={i}>
                            <Rect
                                x={x}
                                y={chartHeight - h}
                                width={barWidth}
                                height={h}
                                fill={i % 2 === 0 ? COLORS.primary : COLORS.secondary}
                                rx="6"
                            />
                            <SvgText
                                x={x + barWidth / 2}
                                y={chartHeight + 20}
                                fill={COLORS.textSecondary}
                                fontSize="10"
                                fontWeight="600"
                                textAnchor="middle"
                            >
                                {d.status.substring(0, 3)}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

const CustomerLineChart: React.FC<{ data: { count: number }[] }> = ({ data }) => {
    const chartHeight = 100;
    const chartWidth = SCREEN_WIDTH - (SPACING.xl * 4);
    const maxVal = Math.max(...data.map(d => d.count)) * 1.1;
    const minVal = Math.min(...data.map(d => d.count)) * 0.9;

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * chartWidth,
        y: chartHeight - ((d.count - minVal) / (maxVal - minVal)) * chartHeight
    }));

    const lineData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Customer Growth</Text>
            <Svg height={chartHeight} width={chartWidth}>
                <Path d={lineData} fill="none" stroke={COLORS.secondary} strokeWidth="3" />
                {points.map((p, i) => (
                    <Circle key={i} cx={p.x} cy={p.y} r="3" fill={COLORS.secondary} />
                ))}
            </Svg>
        </View>
    );
};

const CategoryDistributionChart: React.FC = () => {
    const data = [
        { name: 'Produce', val: 85 },
        { name: 'Dairy', val: 65 },
        { name: 'Bakery', val: 45 },
        { name: 'Meat', val: 30 }
    ];

    return (
        <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>Category Performance</Text>
            {data.map((item, i) => (
                <View key={i} style={styles.barRow}>
                    <Text style={styles.barRowLabel}>{item.name}</Text>
                    <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${item.val}%`, backgroundColor: COLORS.accent }]} />
                    </View>
                    <Text style={styles.barVal}>{item.val}%</Text>
                </View>
            ))}
        </View>
    );
};

// --- Main Screen Component ---

const AdminDashboardScreen: React.FC = () => {
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

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'orders') await loadOrders();
            else if (activeTab === 'reports') await loadReports();
            else if (activeTab === 'customers') await loadCustomers();
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

    const renderTabButton = (tab: TabType, label: string, icon: string) => (
        <TouchableOpacity
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
                    placeholderTextColor={COLORS.textSecondary}
                />
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
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
                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
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
        if (loading) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
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

                {/* --- ANALYTICS GRAPHS --- */}
                <RevenueAreaChart data={reportData.dailyRevenue} />

                <View style={styles.sideBySideCharts}>
                    <OrderBarChart data={reportData.orderStatusDistribution} />
                </View>

                <CustomerLineChart data={reportData.customerGrowth} />

                <CategoryDistributionChart />

                {/* Top Products */}
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
                    placeholderTextColor={COLORS.textSecondary}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : customers.length > 0 ? (
                <FlatList
                    data={customers}
                    renderItem={({ item }) => <CustomerListItem customer={item} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                />
            ) : (
                <EmptyState icon="👥" title="No Customers" message="No matching customers found" />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <Text style={styles.headerSubtitle}>Real-time performance analytics</Text>
            </View>

            <View style={styles.tabBar}>
                {renderTabButton('reports', 'Reports', '📈')}
                {renderTabButton('orders', 'Orders', '📦')}
                {renderTabButton('customers', 'Customers', '👥')}
            </View>

            <View style={styles.contentWrapper}>
                {activeTab === 'orders' && renderOrdersTab()}
                {activeTab === 'reports' && renderReportsTab()}
                {activeTab === 'customers' && renderCustomersTab()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.surface,
        padding: SPACING.xl,
        paddingTop: Platform.OS === 'ios' ? SPACING.md : SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomWidth: 0,
    },
    tabIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    tabLabelActive: {
        color: COLORS.primary,
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
        paddingBottom: 100, // Extra padding for bottom tabs
    },
    filterWrapper: {
        height: 60,
    },
    listWrapper: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: SPACING.xl,
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    // Charts Styles
    chartWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginHorizontal: SPACING.xl,
        marginBottom: SPACING.lg,
        padding: SPACING.xl,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    chartTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: SPACING.lg,
    },
    sideBySideCharts: {
        flexDirection: 'row',
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    barRowLabel: {
        width: 70,
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    barBg: {
        flex: 1,
        height: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'right',
    },
    // Rest of styles
    searchInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: 16,
        color: COLORS.text,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: SPACING.sm,
    },
    filterContainer: {
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING.lg,
    },
    filterChip: {
        paddingHorizontal: 20,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: '#FFFFFF',
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
    loader: {
        marginTop: SPACING.xl,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
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
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginHorizontal: SPACING.xl,
        marginBottom: 10,
        padding: SPACING.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    productRank: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    productRankText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    productSales: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    productRevenue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
    },
});

export default AdminDashboardScreen;
