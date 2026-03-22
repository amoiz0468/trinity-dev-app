from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from decimal import Decimal
from django.utils import timezone
from .models import Category, Product, Promotion


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
            'stock_status', 'is_in_stock', 'active_promotion'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_synced']

    @extend_schema_field(serializers.CharField())
    def get_stock_status(self, obj):
        return obj.stock_status

    @extend_schema_field(serializers.BooleanField())
    def get_is_in_stock(self, obj):
        return obj.is_in_stock

    @extend_schema_field(PromotionSerializer(allow_null=True))
    def get_active_promotion(self, obj):
        now = timezone.now()
        promotion = obj.promotions.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).first()
        if promotion:
            return PromotionSerializer(promotion, context=self.context).data
        return None

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
            'picture_url', 'quantity_in_stock', 'stock_status', 
            'is_active', 'active_promotion'
        ]

    @extend_schema_field(serializers.CharField())
    def get_stock_status(self, obj):
        return obj.stock_status

    @extend_schema_field(PromotionSerializer(allow_null=True))
    def get_active_promotion(self, obj):
        now = timezone.now()
        promotion = obj.promotions.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).first()
        if promotion:
            return PromotionSerializer(promotion, context=self.context).data
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.picture:
            request = self.context.get('request')
            url = instance.picture.url
            data['picture_url'] = request.build_absolute_uri(url) if request else url
        return data


class PromotionSerializer(serializers.ModelSerializer):
    """Serializer for Promotion model"""
    product_name = serializers.ReadOnlyField(source='product.name')
    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Promotion
        fields = [
            'id', 'title', 'description', 'image_url', 'product', 
            'product_name', 'discount_percentage', 'start_date', 
            'end_date', 'is_active', 'is_currently_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
