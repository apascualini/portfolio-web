import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Category, PagedResult, Product } from '../types/store';
import { formatARS } from '../utils/formatters';
import { AdminOrdersTab } from '../components/AdminOrdersTab';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<'orders' | 'products' | 'categories'>('orders');

  // Estados de Categorías y Productos
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    isActive: true,
    categoryId: 0,
  });

  // 1. Verificar cookie de sesión al entrar
  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(() => {
        setAuthorized(true);
        loadCatalogData();
      })
      .catch(() => navigate('/admin/login'));
  }, []);

  const loadCatalogData = async () => {
    const [cats, prods] = await Promise.all([
      apiFetch<Category[]>('/api/categories'),
      apiFetch<PagedResult<Product>>('/api/products?onlyActive=false&pageSize=100'),
    ]);
    setCategories(cats);
    setProducts(prods.items);
    if (cats.length > 0 && prodForm.categoryId === 0) {
      setProdForm((prev) => ({ ...prev, categoryId: cats[0].id }));
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    navigate('/admin/login');
  };

  // CRUD Categorías
  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: catName, slug: catSlug }),
    });
    setCatName('');
    setCatSlug('');
    loadCatalogData();
  };

  // CRUD Productos (Crear o Actualizar)
  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/products/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(prodForm),
      });
    } else {
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(prodForm),
      });
    }
    setEditingId(null);
    setProdForm({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      isActive: true,
      categoryId: categories[0]?.id || 0,
    });
    loadCatalogData();
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setProdForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl || '',
      isActive: p.isActive,
      categoryId: p.categoryId,
    });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('¿Eliminar o desactivar este producto?')) return;
    await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    loadCatalogData();
  };

  if (!authorized) return <p style={{ padding: 24 }}>Verificando sesión...</p>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Administración de Tienda</h1>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </header>

      <nav style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button onClick={() => setTab('orders')} style={{ fontWeight: tab === 'orders' ? 'bold' : 'normal' }}>
          Pedidos y Despachos
        </button>
        <button onClick={() => setTab('products')} style={{ fontWeight: tab === 'products' ? 'bold' : 'normal' }}>
          Productos ({products.length})
        </button>
        <button onClick={() => setTab('categories')} style={{ fontWeight: tab === 'categories' ? 'bold' : 'normal' }}>
          Categorías ({categories.length})
        </button>
      </nav>

      {tab === 'orders' && <AdminOrdersTab />}

      {tab === 'categories' && (
        <div>
          <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              required
              placeholder="Nombre (ej: Zapatillas)"
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
            />
            <input
              required
              placeholder="Slug (ej: zapatillas)"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
            />
            <button type="submit">Agregar Categoría</button>
          </form>

          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                {c.name} (<code>{c.slug}</code>)
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'products' && (
        <div>
          <form
            onSubmit={handleSaveProduct}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 24, padding: 16, border: '1px solid #ddd' }}
          >
            <input
              required
              placeholder="Nombre del producto"
              value={prodForm.name}
              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
            />
            <select
              value={prodForm.categoryId}
              onChange={(e) => setProdForm({ ...prodForm, categoryId: Number(e.target.value) })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              required
              type="number"
              step="0.01"
              placeholder="Precio ARS"
              value={prodForm.price || ''}
              onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
            />
            <input
              required
              type="number"
              placeholder="Stock"
              value={prodForm.stock}
              onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
            />
            <input
              placeholder="URL de Imagen (Cloudinary)"
              value={prodForm.imageUrl}
              onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
            />
            <input
              placeholder="Descripción breve"
              value={prodForm.description}
              onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={prodForm.isActive}
                onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
              />
              Activo en tienda
            </label>
            <button type="submit">{editingId ? 'Guardar Cambios' : 'Crear Producto'}</button>
          </form>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{p.name}</td>
                  <td>{p.categoryName}</td>
                  <td>{formatARS(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>{p.isActive ? 'Visible' : 'Oculto'}</td>
                  <td style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
                    <button onClick={() => startEdit(p)}>Editar</button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ color: 'crimson' }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
