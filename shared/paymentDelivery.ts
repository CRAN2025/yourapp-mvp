// shared/paymentDelivery.ts - New canonical schema for payment and delivery data

export type PaymentMethodType =
  | 'cash' 
  | 'card' 
  | 'paypal' 
  | 'stripe' 
  | 'applePay' 
  | 'bankTransfer'
  | 'mobileMoney';

export type DeliveryOptionType =
  | 'pickup' 
  | 'localDelivery' 
  | 'shipping'
  | 'courier'
  | 'nationwide'
  | 'international';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  enabled: boolean;
  // private/sensitive fields here (e.g., last4, merchant ids) – NEVER mirrored publicly
}

export interface DeliveryOption {
  id: string;
  type: DeliveryOptionType;
  label: string;
  enabled: boolean;
  fee?: number;
  minOrder?: number;
  zones?: string[];
  carrier?: 'ups' | 'usps' | 'dhl' | 'fedex';
  instructions?: string;
}

// Public types - safe for storefront display
export type PublicPaymentMethod = Pick<PaymentMethod, 'id' | 'type' | 'label' | 'enabled'>;
export type PublicDeliveryOption = Pick<DeliveryOption, 'id' | 'type' | 'label' | 'enabled' | 'fee' | 'minOrder'>;

// Helper function to convert private data to public
export function toPublicPayments(payments: Record<string, PaymentMethod>): Record<string, PublicPaymentMethod> {
  return Object.fromEntries(
    Object.values(payments)
      .filter(x => x.enabled)
      .map(x => [x.id, { 
        id: x.id, 
        type: x.type, 
        label: x.label, 
        enabled: x.enabled 
      }])
  );
}

export function toPublicDelivery(delivery: Record<string, DeliveryOption>): Record<string, PublicDeliveryOption> {
  return Object.fromEntries(
    Object.values(delivery)
      .filter(x => x.enabled)
      .map(x => [x.id, { 
        id: x.id, 
        type: x.type, 
        label: x.label, 
        enabled: x.enabled, 
        fee: x.fee ?? 0, 
        minOrder: x.minOrder ?? 0 
      }])
  );
}

// Migration helper for legacy array format
export function normalizeArrayToMap<T extends { id?: string }>(arr: T[]): Record<string, T & { id: string }> {
  const generateId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  
  return Object.fromEntries(
    arr.map(x => {
      const id = x.id ?? generateId();
      return [id, { ...x, id }];
    })
  );
}