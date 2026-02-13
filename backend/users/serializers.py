from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import Customer


class UserSerializer(serializers.ModelSerializer):
    """Serializer for Django User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id']


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    full_name = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'user', 'first_name', 'last_name', 'phone_number', 'email',
            'address', 'zip_code', 'city', 'country',
            'is_active', 'created_at', 'updated_at',
            'full_name', 'full_address'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return obj.full_name

    @extend_schema_field(serializers.CharField())
    def get_full_address(self, obj):
        return obj.full_address


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating customers"""
    class Meta:
        model = Customer
        fields = [
            'first_name', 'last_name', 'phone_number', 'email',
            'address', 'zip_code', 'city', 'country'
        ]


class CustomerPurchaseHistorySerializer(serializers.Serializer):
    """Serializer for customer purchase history"""
    total_purchases = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_purchase_date = serializers.DateTimeField()
    invoices = serializers.ListField()


class CustomerRegistrationSerializer(serializers.Serializer):
    """Serializer for customer self-registration"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=20)
    address = serializers.CharField()
    zip_code = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)

    def validate_email(self, value):
        if User.objects.filter(username=value).exists() or User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        if Customer.objects.filter(email=value).exists():
            raise serializers.ValidationError('A customer with this email already exists.')
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['email'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
            )
            customer = Customer.objects.create(
                user=user,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data['phone_number'],
                email=validated_data['email'],
                address=validated_data['address'],
                zip_code=validated_data['zip_code'],
                city=validated_data['city'],
                country=validated_data['country'],
            )
        return customer
