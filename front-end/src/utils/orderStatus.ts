import { OrderStatus } from '../types';

type BackendInvoiceStatus = 'pending' | 'processing' | 'paid' | 'cancelled' | 'refunded';

const FRONTEND_STATUS_MAP: Record<string, OrderStatus> = {
  pending: OrderStatus.PENDING,
  processing: OrderStatus.PROCESSING,
  paid: OrderStatus.COMPLETED,
  completed: OrderStatus.COMPLETED,
  cancelled: OrderStatus.CANCELLED,
  refunded: OrderStatus.CANCELLED,
  PENDING: OrderStatus.PENDING,
  PROCESSING: OrderStatus.PROCESSING,
  COMPLETED: OrderStatus.COMPLETED,
  CANCELLED: OrderStatus.CANCELLED,
};

const BACKEND_STATUS_MAP: Record<string, BackendInvoiceStatus> = {
  pending: 'pending',
  processing: 'processing',
  paid: 'paid',
  completed: 'paid',
  cancelled: 'cancelled',
  refunded: 'refunded',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'paid',
  CANCELLED: 'cancelled',
};

export const toFrontendOrderStatus = (status: unknown): OrderStatus => {
  const key = String(status || '').trim();
  return FRONTEND_STATUS_MAP[key] || FRONTEND_STATUS_MAP[key.toLowerCase()] || OrderStatus.PENDING;
};

export const toBackendInvoiceStatus = (
  status: unknown
): BackendInvoiceStatus | undefined => {
  const key = String(status || '').trim();
  return BACKEND_STATUS_MAP[key] || BACKEND_STATUS_MAP[key.toLowerCase()];
};

