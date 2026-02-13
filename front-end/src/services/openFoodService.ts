import { Product, NutritionalInfo } from '../types';

/**
 * OpenFoodFacts API Service
 * Fetches product information from the global OpenFoodFacts database
 */
class OpenFoodService {
    private readonly BASE_URL = 'https://world.openfoodfacts.org/api/v0';

    /**
     * Fetch product details by barcode
     * @param barcode EAN-13, UPC-A, etc.
     */
    async fetchProductByBarcode(barcode: string): Promise<Partial<Product>> {
        try {
            const response = await fetch(`${this.BASE_URL}/product/${barcode}.json`);
            const data = await response.json();

            if (data.status !== 1 || !data.product) {
                throw new Error('Product not found in OpenFoodFacts database');
            }

            const offProduct = data.product;

            // Extract nutritional info if available
            const nutritionalInfo: NutritionalInfo = {
                calories: offProduct.nutriments?.['energy-kcal_100g'] || 0,
                protein: offProduct.nutriments?.proteins_100g || 0,
                carbohydrates: offProduct.nutriments?.carbohydrates_100g || 0,
                fat: offProduct.nutriments?.fat_100g || 0,
                fiber: offProduct.nutriments?.fiber_100g,
                sodium: offProduct.nutriments?.sodium_100g,
                sugar: offProduct.nutriments?.sugars_100g,
                servingSize: offProduct.serving_size || '100g',
            };

            // Map to our Product type
            return {
                name: offProduct.product_name || 'Unknown Product',
                barcode: barcode,
                brand: offProduct.brands || 'Unknown Brand',
                category: (offProduct.categories_tags?.[0] || 'Uncategorized').replace('en:', ''),
                imageUrl: offProduct.image_url || '',
                description: offProduct.generic_name || offProduct.ingredients_text || '',
                nutritionalInfo,
            };
        } catch (error: any) {
            console.error('Error fetching from OpenFoodFacts:', error);
            throw new Error(error.message || 'Failed to fetch product data');
        }
    }
}

export default new OpenFoodService();
