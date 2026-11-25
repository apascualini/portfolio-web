import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../api/client';
import type { CheckoutResponse, CreateCheckoutRequest } from '../types/store';
import {
  ARGENTINA_PROVINCES,
  formatARS,
  isValidDniOrCuit,
  isValidPostalCodeAR,
} from '../utils/formatters';

export function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerFullName: '',
    customerEmail: '',
    customerPhone: '',
    dniOrCuit: '',
    taxCondition: 'Consumidor Final',
    street: '',
    streetNumber: '',
    floorApartment: '',
    postalCode: '',
    city: '',
    province: 'Ciudad Autónoma de Buenos Aires',
  });

  // Ejemplo simple de cálculo de envío por zona (ajustable a tus tarifas reales)
  const shippingCost =
    form.province === 'Ciudad Autónoma de Buenos Aires' ? 4500 : 8500;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    if (!isValidDniOrCuit(form.dniOrCuit)) {
      setError('Ingresá un DNI (7-8 dígitos) o CUIT/CUIL (11 dígitos) válido.');
      return;
    }

    if (!isValidPostalCodeAR(form.postalCode)) {
      setError('Ingresá un Código Postal argentino válido (ej: 1417 o C1417ABC).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateCheckoutRequest = {
        ...form,
        shippingCost,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      // Guardamos el email en sessionStorage para consultar el estado del pedido al volver
      sessionStorage.setItem('last_checkout_email', form.customerEmail);

      const res = await apiFetch<CheckoutResponse>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Redirección directa al Checkout Pro de Mercado Pago
      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar el pago con Mercado Pago.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', display: 'grid', gap: 12 }}>
      <h2>Finalizar Compra</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>1. Datos de Facturación y Contacto</h3>
      <input
        required
        placeholder="Nombre y Apellido"
        value={form.customerFullName}
        onChange={(e) => setForm({ ...form, customerFullName: e.target.value })}
      />
      <input
        required
        type="email"
        placeholder="Email (recibirás tu comprobante)"
        value={form.customerEmail}
        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
      />
      <input
        required
        placeholder="Teléfono / WhatsApp (ej: 11 5555-4444)"
        value={form.customerPhone}
        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
      />
      <input
        required
        placeholder="DNI o CUIT/CUIL (sin puntos)"
        value={form.dniOrCuit}
        onChange={(e) => setForm({ ...form, dniOrCuit: e.target.value })}
      />
      <select
        value={form.taxCondition}
        onChange={(e) => setForm({ ...form, taxCondition: e.target.value })}
      >
        <option value="Consumidor Final">Consumidor Final</option>
        <option value="Monotributista">Monotributista</option>
        <option value="Responsable Inscripto">Responsable Inscripto</option>
      </select>

      <h3>2. Dirección de Envío</h3>
      <select
        value={form.province}
        onChange={(e) => setForm({ ...form, province: e.target.value })}
      >
        {ARGENTINA_PROVINCES.map((prov) => (
          <option key={prov} value={prov}>
            {prov}
          </option>
        ))}
      </select>
      <input
        required
        placeholder="Localidad / Barrio"
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
      />
      <input
        required
        placeholder="Código Postal (ej: 1417)"
        value={form.postalCode}
        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          required
          style={{ flex: 2 }}
          placeholder="Calle"
          value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })}
        />
        <input
          required
          style={{ flex: 1 }}
          placeholder="Altura"
          value={form.streetNumber}
          onChange={(e) => setForm({ ...form, streetNumber: e.target.value })}
        />
        <input
          style={{ flex: 1 }}
          placeholder="Piso / Depto"
          value={form.floorApartment}
          onChange={(e) => setForm({ ...form, floorApartment: e.target.value })}
        />
      </div>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: 12 }}>
        <p>Subtotal: {formatARS(subtotal)}</p>
        <p>Envío ({form.province}): {formatARS(shippingCost)}</p>
        <p>
          <strong>Total: {formatARS(subtotal + shippingCost)}</strong>
        </p>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
      </button>
    </form>
  );
}
