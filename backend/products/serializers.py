from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'product_count']
        read_only_fields = ['id', 'created_at']
    
    @extend_schema_field(serializers.IntegerField())
    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'price', 'category', 'category_name',
            'picture', 'picture_url', 'quantity_in_stock',
            'energy_kcal', 'fat', 'saturated_fat', 'carbohydrates',
            'sugars', 'proteins', 'salt', 'fiber',
            'description', 'barcode', 'openfoodfacts_id',
            'last_synced', 'is_active', 'created_at', 'updated_at',
            'stock_status', 'is_in_stock'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_synced']

    @extend_schema_field(serializers.CharField())
    def get_stock_status(self, obj):
        return obj.stock_status

    @extend_schema_field(serializers.BooleanField())
    def get_is_in_stock(self, obj):
        return obj.is_in_stock
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'price', 'category', 'category_name',
            'picture', 'picture_url', 'quantity_in_stock',
            'energy_kcal', 'fat', 'saturated_fat', 'carbohydrates',
            'sugars', 'proteins', 'salt', 'fiber',
            'description', 'barcode', 'openfoodfacts_id',
            'last_synced', 'is_active', 'created_at', 'updated_at',
            'stock_status', 'is_in_stock'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_synced']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.picture:
            request = self.context.get('request')
            url = instance.picture.url
            data['picture_url'] = request.build_absolute_uri(url) if request else url
        return data


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating products"""
    class Meta:
        model = Product
        fields = [
            'name', 'brand', 'price', 'category',
            'picture', 'picture_url', 'quantity_in_stock',
            'energy_kcal', 'fat', 'saturated_fat', 'carbohydrates',
            'sugars', 'proteins', 'salt', 'fiber',
            'description', 'barcode', 'is_active'
        ]

    def create(self, validated_data):
        instance = super().create(validated_data)
        if instance.picture and not instance.picture_url:
            instance.picture_url = instance.picture.url
            instance.save(update_fields=['picture_url'])
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        if instance.picture:
            # Keep DB url in sync with stored image
            if instance.picture_url != instance.picture.url:
                instance.picture_url = instance.picture.url
                instance.save(update_fields=['picture_url'])
        return instance


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'price', 'category_name',
            'picture_url', 'quantity_in_stock', 'stock_status', 'is_active'
        ]

    @extend_schema_field(serializers.CharField())
    def get_stock_status(self, obj):
        return obj.stock_status

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.picture:
            request = self.context.get('request')
            url = instance.picture.url
            data['picture_url'] = request.build_absolute_uri(url) if request else url
        return data
