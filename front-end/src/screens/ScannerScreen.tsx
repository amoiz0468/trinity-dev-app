import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, Product } from '../types';
import { useCart } from '../contexts/CartContext';
import ProductService from '../services/productService';
import Button from '../components/Button';
import Loading from '../components/Loading';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  APP_CONSTANTS,
} from '../constants';

type ScannerScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Scan'>;

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<ScannerScreenNavigationProp>();
  const { addToCart } = useCart();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        ERROR_MESSAGES.CAMERA_PERMISSION_DENIED,
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Settings', onPress: () => {/* Open settings */} },
        ]
      );
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    Vibration.vibrate(100);

    try {
      // Fetch product by barcode
      const product = await ProductService.getProductByBarcode(data);
      
      // Add to cart
      addToCart(product, 1);
      
      Alert.alert(
        'Product Found!',
        `${product.name} has been added to your cart.`,
        [
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart' as never),
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setTimeout(() => setScanned(false), APP_CONSTANTS.BARCODE_SCAN_DELAY);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Product Not Found',
        error.message || ERROR_MESSAGES.BARCODE_NOT_FOUND,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setTimeout(() => setScanned(false), APP_CONSTANTS.BARCODE_SCAN_DELAY);
            },
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <Loading message="Requesting camera permission..." />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan products
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestCameraPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
          ],
        }}
        enableTorch={torch}
      >
        <View style={styles.overlay}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <Text style={styles.instructionText}>
              Position barcode within the frame
            </Text>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanningArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
            
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setTorch(!torch)}
              >
                <Text style={styles.controlIcon}>{torch ? '🔦' : '💡'}</Text>
                <Text style={styles.controlText}>Flash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.controlIcon}>✕</Text>
                <Text style={styles.controlText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  instructionText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.surface,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanningArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.surface,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: SPACING.xl,
  },
  controlButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  controlIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  controlText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.surface,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    textAlign: 'center',
    padding: SPACING.xl,
  },
  permissionButton: {
    marginHorizontal: SPACING.xl,
  },
});

export default ScannerScreen;
