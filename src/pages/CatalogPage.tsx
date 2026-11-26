import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import type { Category, PagedResult, Product } from '../types/store';
import { formatARS } from '../utils/formatters';
import { getOptimizedImageUrl } from '../utils/cloudinary';

export function CatalogPage() {
  const navigate = useNavigate();
  const { items, addToCart, updateQuantity, removeFromCart, totalItems, subtotal } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>('/api/categories')
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      onlyActive: 'true',
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (selectedCategory !== null) params.append('categoryId', selectedCategory.toString());
    if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

    apiFetch<PagedResult<Product>>(`/api/products?${params.toString()}`)
      .then((res) => {
        setProducts(res.items);
        setTotalCount(res.totalCount);
      })
      .catch((err) => setError(err.message || 'Error al cargar los productos.'))
      .finally(() => setLoading(false));
  }, [selectedCategory, debouncedSearch, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Sticky */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Mi Tienda</h1>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
          >
            <span>🛒 Carrito</span>
            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline font-semibold">{formatARS(subtotal)}</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Buscador y Filtros */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative w-full md:w-80">
            <input
              type="search"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-xs"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Mensajes de Estado */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="aspect-square bg-slate-200 rounded-xl mb-4" />
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-base">No se encontraron productos con esos filtros.</p>
          </div>
        )}

        {/* Grilla de Productos */}
        {!loading && !error && products.length > 0 && (
          <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const inCartQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
              const outOfStock = product.stock <= 0;
              const maxReached = inCartQty >= product.stock;

              return (
                <article
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-4">
                    <div className="relative aspect-square w-full bg-white rounded-xl border border-slate-100 overflow-hidden mb-4">
                      <img
                        src={getOptimizedImageUrl(product.imageUrl)}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {outOfStock && (
                        <span className="absolute top-2.5 right-2.5 bg-slate-900/85 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                          Agotado
                        </span>
                      )}
                      {!outOfStock && product.stock <= 3 && (
                        <span className="absolute top-2.5 right-2.5 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-lg">
                          ¡Últimas {product.stock}!
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      {product.categoryName}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 mt-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-10">
                      {product.description}
                    </p>
                  </div>

                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <p className="text-xl font-bold text-slate-900 mb-3">
                      {formatARS(product.price)}
                    </p>
                    <button
                      disabled={outOfStock || maxReached}
                      onClick={() => handleAdd(product)}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
                        outOfStock || maxReached
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white cursor-pointer shadow-xs'
                      }`}
                    >
                         {outOfStock
                        ? 'Sin stock'
                        : maxReached
                        ? `Máximo en carrito (${product.stock})`
                        : 'Agregar al carrito'}
                    </button>
                  </div>
                </article>
              );
            })}
          </main>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="text-sm text-slate-600 font-medium">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Drawer Lateral del Carrito */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
          >
            {/* Header Drawer */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Tu Carrito ({totalItems})</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Lista de Ítems */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-500">Tu carrito está vacío.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map(({ product, quantity }) => (
                    <li key={product.id} className="py-4 flex gap-4">
                      <img
                        src={getOptimizedImageUrl(product.imageUrl, 160, 160)}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg border border-slate-200 object-contain bg-white shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatARS(product.price)} c/u
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center border border-slate-200 rounded-lg">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 text-sm font-medium">{quantity}</span>
                            <button
                              disabled={quantity >= product.stock}
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-r-lg disabled:opacity-40 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatARS(product.price * quantity)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer Drawer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between text-base mb-4">
                  <span className="text-slate-600 font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-slate-900">{formatARS(subtotal)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Iniciar Compra
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}