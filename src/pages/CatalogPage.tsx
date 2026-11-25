import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import type { Category, PagedResult, Product } from '../types/store';
import { formatARS } from '../utils/formatters';

export function CatalogPage() {
  const navigate = useNavigate();
  const { items, addToCart, updateQuantity, removeFromCart, totalItems, subtotal } = useCart();

  // Estado del catálogo y filtros
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

  // 1. Cargar categorías una sola vez al montar
  useEffect(() => {
    apiFetch<Category[]>('/api/categories')
      .then(setCategories)
      .catch(() => {});
  }, []);

  // 2. Debounce de 400ms en el buscador para evitar llamadas innecesarias a la API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 3. Consultar productos paginados según categoría y búsqueda
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      onlyActive: 'true',
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (selectedCategory !== null) {
      params.append('categoryId', selectedCategory.toString());
    }
    if (debouncedSearch.trim()) {
      params.append('search', debouncedSearch.trim());
    }

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
    setIsCartOpen(true); // Abre el carrito automáticamente al agregar un producto
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}>
      {/* Barra superior */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Mi Tienda</h1>
        <button
          onClick={() => setIsCartOpen(true)}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Carrito ({totalItems}) — {formatARS(subtotal)}
        </button>
      </header>

      {/* Buscador y Filtros por Categoría */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <input
          type="search"
          placeholder="Buscar productos..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: '1 1 260px', padding: '8px 12px' }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setPage(1);
            }}
            style={{
              padding: '8px 14px',
              fontWeight: selectedCategory === null ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
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
              style={{
                padding: '8px 14px',
                fontWeight: selectedCategory === cat.id ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Estados de carga / error */}
      {loading && <p>Cargando productos...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>No se encontraron productos con esos filtros.</p>
      )}

      {/* Grilla de Productos */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {products.map((product) => {
          const inCartQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
          const outOfStock = product.stock <= 0;
          const maxReached = inCartQty >= product.stock;

          return (
            <article
              key={product.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <img
                  src={product.imageUrl || 'https://placehold.co'}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 6,
                    marginBottom: 12,
                  }}
                />
                <small style={{ color: '#666' }}>{product.categoryName}</small>
                <h3 style={{ margin: '4px 0 8px' }}>{product.name}</h3>
                <p style={{ fontSize: 14, color: '#444', margin: '0 0 12px' }}>
                  {product.description}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 18, fontWeight: 'bold', margin: '0 0 8px' }}>
                  {formatARS(product.price)}
                </p>
                <button
                  disabled={outOfStock || maxReached}
                  onClick={() => handleAdd(product)}
                  style={{ width: '100%', padding: '10px', cursor: outOfStock ? 'not-allowed' : 'pointer' }}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </button>
        </div>
      )}

      {/* Drawer Lateral del Carrito */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 50,
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#fff',
              height: '100%',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Tu Carrito</h2>
                <button onClick={() => setIsCartOpen(false)}>✕</button>
              </div>

            {items.length === 0 ? (
                <p style={{ marginTop: 24 }}>El carrito está vacío.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
                  {items.map(({ product, quantity }) => (
                    <li
                      key={product.id}
                      style={{
                        borderBottom: '1px solid #eee',
                        padding: '12px 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div>
                        <strong>{product.name}</strong>
                        <p style={{ margin: '4px 0', fontSize: 14 }}>
                          {formatARS(product.price)} c/u
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => updateQuantity(product.id, quantity - 1)}>
                            -
                          </button>
                          <span>{quantity}</span>
                          <button
                            disabled={quantity >= product.stock}
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            style={{ marginLeft: 8, color: 'crimson' }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                      <strong>{formatARS(product.price * quantity)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div style={{ borderTop: '1px solid #ddd', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span>Subtotal:</span>
                  <strong>{formatARS(subtotal)}</strong>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  style={{ width: '100%', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}
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