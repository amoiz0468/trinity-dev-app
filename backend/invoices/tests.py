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

    def test_cancel_endpoint_sets_cancelled_for_pending_invoice(self, authenticated_client, invoice):
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

