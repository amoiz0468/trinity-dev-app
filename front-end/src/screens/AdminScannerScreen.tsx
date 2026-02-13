import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Vibration,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Product } from '../types';
import OpenFoodService from '../services/openFoodService';
import AdminService from '../services/adminService';
import Button from '../components/Button';
import Loading from '../components/Loading';
import {
    COLORS,
    SPACING,
    TYPOGRAPHY,
    ERROR_MESSAGES,
} from '../constants';

const AdminScannerScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [torch, setTorch] = useState(false);

    // Form State
    const [productData, setProductData] = useState<Partial<Product> | null>(null);
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);
        Vibration.vibrate(100);

        try {
            const fetchedProduct = await OpenFoodService.fetchProductByBarcode(data);
            setProductData(fetchedProduct);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not fetch product details');
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!productData || !price || !stock) {
            Alert.alert('Missing Info', 'Please enter price and stock');
            return;
        }

        try {
            setLoading(true);
            await AdminService.addProduct({
                ...productData,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
            });

            Alert.alert('Success', 'Product added to inventory', [
                {
                    text: 'OK',
                    onPress: () => {
                        setProductData(null);
                        setPrice('');
                        setStock('');
                        setScanned(false);
                    }
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (hasPermission === null) return <Loading message="Requesting camera permission..." />;
    if (hasPermission === false) return <View style={styles.container}><Text>No camera access</Text></View>;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {!productData ? (
                <CameraView
                    style={styles.camera}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    enableTorch={torch}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanHeader}>
                            <Text style={styles.scanTitle}>Scan Product QR/Barcode</Text>
                            <Text style={styles.scanSubtitle}>Add item to inventory</Text>
                        </View>

                        <View style={styles.scanFrameContainer}>
                            <View style={styles.scanFrame} />
                        </View>

                        <View style={styles.controls}>
                            <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
                                <Text style={{ fontSize: 24 }}>{torch ? '🔦' : '💡'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            ) : (
                <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                    <Text style={styles.formTitle}>Product Details</Text>

                    {productData.imageUrl && (
                        <Image source={{ uri: productData.imageUrl }} style={styles.productImage} />
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Product Name</Text>
                        <TextInput
                            style={styles.input}
                            value={productData.name}
                            onChangeText={(text) => setProductData({ ...productData, name: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Brand</Text>
                        <TextInput
                            style={styles.input}
                            value={productData.brand}
                            onChangeText={(text) => setProductData({ ...productData, brand: text })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Price ($)</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Initial Stock</Text>
                            <TextInput
                                style={styles.input}
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button title="Save to Inventory" onPress={handleSaveProduct} loading={loading} />
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                                setProductData(null);
                                setScanned(false);
                            }}
                        >
                            <Text style={styles.cancelText}>Cancel & Scan Again</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'space-between',
        padding: SPACING.xl,
    },
    scanHeader: {
        alignItems: 'center',
        marginTop: 60,
    },
    scanTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
    },
    scanSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        marginTop: 8,
    },
    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: COLORS.secondary,
        borderRadius: 20,
        borderStyle: 'dashed',
    },
    controls: {
        alignItems: 'center',
        marginBottom: 40,
    },
    torchBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        flex: 1,
    },
    formContent: {
        padding: SPACING.xl,
        paddingTop: 60,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: SPACING.xl,
    },
    productImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: SPACING.xl,
        backgroundColor: COLORS.glass,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.surface,
        color: '#FFF',
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    row: {
        flexDirection: 'row',
    },
    buttonContainer: {
        marginTop: SPACING.xl,
        gap: 16,
    },
    cancelBtn: {
        alignItems: 'center',
    },
    cancelText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    }
});

export default AdminScannerScreen;
