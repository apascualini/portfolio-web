import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Category, PagedResult, Product } from '../types/store';
import { formatARS } from '../utils/formatters';
import { uploadImageToCloudinary, getOptimizedImageUrl } from '../utils/cloudinary';
import { AdminOrdersTab } from '../components/AdminOrdersTab';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<'orders' | 'products' | 'categories'>('orders');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    isActive: true,
    categoryId: 0,
  });

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadingImage(true);
    try {
      const secureUrl = await uploadImageToCloudinary(file);
      setProdForm((prev) => ({ ...prev, imageUrl: secureUrl }));
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

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
    resetProductForm();
    loadCatalogData();
  };

  const resetProductForm = () => {
    setEditingId(null);
    setUploadError(null);
    setProdForm({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      isActive: true,
      categoryId: 0,
    });
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setUploadError(null);
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

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Verificando sesión de administrador...
      </div>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Admin */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">Panel de Administración</h1>
            <Link to="/" className="text-xs font-medium text-indigo-600 hover:underline">
              Ver tienda →
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Pestañas */}
        <nav className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              tab === 'orders'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            📦 Pedidos y Despachos
          </button>
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              tab === 'products'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            🏷️ Productos ({products.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              tab === 'categories'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            📂 Categorías ({categories.length})
          </button>
        </nav>

        {tab === 'orders' && <AdminOrdersTab />}

        {tab === 'categories' && (
          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
              <input
                required
                className={inputClass}
                placeholder="Nombre (ej: Zapatillas)"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-'));
                }}
              />
              <input
                required
                className={inputClass}
                placeholder="Slug (ej: zapatillas)"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
              />
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl whitespace-nowrap cursor-pointer"
              >
                Agregar
              </button>
            </form>

            <ul className="divide-y divide-slate-100">
              {categories.map((c) => (
                <li key={c.id} className="py-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {c.slug}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-6">
            {/* Formulario Producto */}
            <form
              onSubmit={handleSaveProduct}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  {editingId ? `Editando Producto #${editingId}` : 'Nuevo Producto'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                  <input
                    required
                    className={inputClass}
                    placeholder="Nombre del producto"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    className={inputClass}
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: Number(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio (ARS)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className={inputClass}
                    placeholder="15000"
                    value={prodForm.price || ''}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock</label>
                  <input
                    required
                    type="number"
                    className={inputClass}
                    placeholder="10"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descripción
                  </label>
                  <input
                    className={inputClass}
                    placeholder="Detalles del producto..."
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Foto del producto (Cloudinary)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleImageUpload}
                      className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {uploadingImage && (
                      <span className="text-xs text-indigo-600 animate-pulse">Subiendo...</span>
                    )}
                    {prodForm.imageUrl && (
                      <img
                        src={getOptimizedImageUrl(prodForm.imageUrl, 120, 120)}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg border border-slate-200 object-contain bg-white"
                      />
                    )}
                  </div>
                  {uploadError && <p className="text-xs text-rose-600 mt-1">{uploadError}</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodForm.isActive}
                    onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  Visible en la tienda pública
                </label>

                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>

            {/* Tabla de Productos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                    <th className="py-3.5 px-4">Foto</th>
                    <th className="py-3.5 px-4">Producto</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Precio</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <img
                          src={getOptimizedImageUrl(p.imageUrl, 100, 100)}
                          alt={p.name}
                          className="w-11 h-11 rounded-lg border border-slate-200 object-contain bg-white"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.categoryName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatARS(p.price)}</td>
                      <td className="py-3 px-4 text-slate-700">{p.stock}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {p.isActive ? 'Activo' : 'Oculto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => startEdit(p)}
                          className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}