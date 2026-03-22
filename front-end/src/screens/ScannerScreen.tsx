import React, { useState, useEffect, useMemo } from 'react';
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
import { MainTabParamList } from '../types';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import ProductService from '../services/productService';
import Button from '../components/Button';
import Loading from '../components/Loading';
import {
  SPACING,
  TYPOGRAPHY,
  ERROR_MESSAGES,
  APP_CONSTANTS,
} from '../constants';

type ScannerScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Scan'>;

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<ScannerScreenNavigationProp>();
  const { addToCart } = useCart();
  const { theme, isDark } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torch, setTorch] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
          { text: 'Settings', onPress: () => {/* Open settings */ } },
        ]
      );
    }
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    Vibration.vibrate(100);

    try {
      const product = await ProductService.getProductByBarcode(data);
      addToCart(product, 1);

      Alert.alert(
        'Product Found!',
        `${product.name} has been added to your cart.`,
        [
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart' as any),
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
          <View style={styles.topSection}>
            <Text style={styles.instructionText}>
              Position barcode within the frame
            </Text>
          </View>

          <View style={styles.scanningArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </View>

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
                accessibilityLabel={torch ? 'Torch on, tap to turn off' : 'Torch off, tap to turn on'}
                accessibilityRole="button"
              >
                <Text style={styles.controlIcon}>{torch ? '🔦' : '💡'}</Text>
                <Text style={styles.controlText}>Flash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Cancel scanning"
                accessibilityRole="button"
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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  instructionText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
    borderColor: theme.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.xxl * 1.5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: '#FFFFFF',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: SPACING.xl,
  },
  controlButton: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    minWidth: 90,
  },
  controlIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  controlText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  permissionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: theme.text,
    textAlign: 'center',
    padding: SPACING.xl,
    lineHeight: 24,
  },
  permissionButton: {
    marginHorizontal: SPACING.xl,
  },
});

export default ScannerScreen;
