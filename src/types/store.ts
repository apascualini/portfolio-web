export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CreateCheckoutRequest {
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  dniOrCuit: string;
  taxCondition: string;
  street: string;
  streetNumber: string;
  floorApartment?: string;
  postalCode: string;
  city: string;
  province: string;
  shippingCost: number;
  items: { productId: number; quantity: number }[];
}

export interface CheckoutResponse {
  orderId: number;
  mercadoPagoOrderId: string;
  checkoutUrl: string;
}

export interface OrderSummary {
  id: number;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  dniOrCuit: string;
  province: string;
  city: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderItemDetail {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetail extends OrderSummary {
  taxCondition: string;
  street: string;
  streetNumber: string;
  floorApartment?: string;
  postalCode: string;
  shippingCost: number;
  paymentMethod: string;
  mercadoPagoOrderId?: string;
  mercadoPagoPaymentId?: string;
  items: OrderItemDetail[];
}
