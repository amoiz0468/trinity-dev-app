import pytest
from django.utils import timezone


@pytest.mark.django_db
class TestInvoiceHistoryAndActionsAPI:
    def test_history_endpoint_returns_results(self, authenticated_client, invoice):
        response = authenticated_client.get('/api/invoices/history/?limit=20&offset=0')
        assert response.status_code == 200
        assert 'results' in response.data
        assert isinstance(response.data['results'], list)
        assert response.data['count'] >= 1

    def test_update_status_endpoint_maps_completed_to_paid(self, authenticated_client, invoice):
        response = authenticated_client.patch(
            f'/api/invoices/{invoice.id}/status/',
            {'status': 'COMPLETED'},
            format='json',
        )
        assert response.status_code == 200

        invoice.refresh_from_db()
        assert invoice.status == 'paid'
        assert invoice.paid_at is not None
        assert response.data['status'] == 'COMPLETED'

    def test_update_status_endpoint_maps_processing_to_processing(self, authenticated_client, invoice):
        response = authenticated_client.patch(
            f'/api/invoices/{invoice.id}/status/',
            {'status': 'PROCESSING'},
            format='json',
        )
        assert response.status_code == 200

        invoice.refresh_from_db()
        assert invoice.status == 'processing'
        assert invoice.paid_at is None
        assert response.data['status'] == 'PROCESSING'

    def test_cancel_endpoint_sets_cancelled_for_pending_invoice(self, authenticated_client, invoice):
        response = authenticated_client.post(f'/api/invoices/{invoice.id}/cancel/')
        assert response.status_code == 200

        invoice.refresh_from_db()
        assert invoice.status == 'cancelled'
        assert response.data['status'] == 'CANCELLED'

    def test_cancel_endpoint_sets_cancelled_for_processing_invoice(self, authenticated_client, invoice):
        invoice.status = 'processing'
        invoice.save(update_fields=['status'])

        response = authenticated_client.post(f'/api/invoices/{invoice.id}/cancel/')
        assert response.status_code == 200

        invoice.refresh_from_db()
        assert invoice.status == 'cancelled'
        assert response.data['status'] == 'CANCELLED'

    def test_cancel_endpoint_sets_refunded_for_paid_invoice(self, authenticated_client, invoice):
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=['status', 'paid_at'])

        response = authenticated_client.post(f'/api/invoices/{invoice.id}/cancel/')
        assert response.status_code == 200

        invoice.refresh_from_db()
        assert invoice.status == 'refunded'
        assert response.data['status'] == 'CANCELLED'

    def test_receipt_endpoint_returns_receipt_url(self, authenticated_client, invoice):
        response = authenticated_client.get(f'/api/invoices/{invoice.id}/receipt/')
        assert response.status_code == 200
        assert 'receiptUrl' in response.data
        assert str(invoice.id) in response.data['receiptUrl']

    def test_send_receipt_endpoint_accepts_email(self, authenticated_client, invoice):
        response = authenticated_client.post(
            f'/api/invoices/{invoice.id}/send-receipt/',
            {'email': 'buyer@example.com'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['success'] is True


@pytest.mark.django_db
class TestPaymentAPI:
    def test_verify_payment_endpoint_returns_verified_true_for_paid_invoice(self, authenticated_client, invoice):
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.paypal_transaction_id = 'TXN-VERIFY-1'
        invoice.save(update_fields=['status', 'paid_at', 'paypal_transaction_id'])

        response = authenticated_client.get('/api/payments/verify/TXN-VERIFY-1')
        assert response.status_code == 200
        assert response.data['success'] is True
        assert response.data['data']['verified'] is True

    def test_verify_payment_endpoint_returns_404_for_missing_transaction(self, authenticated_client):
        response = authenticated_client.get('/api/payments/verify/DOES-NOT-EXIST')
        assert response.status_code == 404
        assert response.data['success'] is False

    def test_process_payment_marks_invoice_paid(self, authenticated_client, invoice):
        response = authenticated_client.post(
            '/api/payments/process',
            {
                'orderId': str(invoice.id),
                'paymentMethod': 'card',
                'paymentDetails': {'transactionId': 'TXN-PROCESS-1'},
            },
            format='json',
        )

        assert response.status_code == 200
        assert response.data['success'] is True
        assert response.data['data']['success'] is True

        invoice.refresh_from_db()
        assert invoice.status == 'paid'
        assert invoice.payment_method == 'card'
        assert invoice.paypal_transaction_id == 'TXN-PROCESS-1'
        assert invoice.paid_at is not None

    def test_refund_payment_marks_invoice_refunded(self, authenticated_client, invoice):
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.paypal_transaction_id = 'TXN-REFUND-1'
        invoice.save(update_fields=['status', 'paid_at', 'paypal_transaction_id'])

        response = authenticated_client.post(
            '/api/payments/refund',
            {
                'transactionId': 'TXN-REFUND-1',
                'amount': 12.5,
                'reason': 'Customer request',
            },
            format='json',
        )

        assert response.status_code == 200
        assert response.data['success'] is True
        assert response.data['data']['success'] is True

        invoice.refresh_from_db()
        assert invoice.status == 'refunded'
