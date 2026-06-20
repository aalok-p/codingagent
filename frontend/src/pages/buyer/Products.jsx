import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/products';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import CartDrawer from './CartDrawer';

export default function BuyerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { addToCart, itemCount } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(Array.isArray(data) ? data : data.products || []);
    }).catch(() => {
      toast('Failed to load products', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, [toast]);

  const categories = useMemo(() => {
    const cats = new Set(
      products.map((p) => p.category).filter(Boolean)
    );
    return [...cats].sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    return result;
  }, [products, search, activeCategory]);

  function stockBadge(qty) {
    if (qty > 10) return 'stock-high';
    if (qty > 5) return 'stock-medium';
    return 'stock-low';
  }

  function handleAdd(product) {
    if (product.quantity <= 0) {
      toast('This product is out of stock', 'error');
      return;
    }
    addToCart(product, 1);
    toast(`${product.name} added to cart`);
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="buyer-layout">
      <header className="buyer-header">
        <h2>Products</h2>
        <div className="buyer-header-actions">
          <button className="btn-link" onClick={() => navigate('/buyer/orders')}>
            My Orders
          </button>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </button>
        </div>
      </header>

      <div className="search-bar">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="category-chips">
          <button
            className={`chip ${activeCategory === null ? 'chip-active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${activeCategory === cat ? 'chip-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search || activeCategory ? 'No products match your search' : 'No products available yet'}</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-card-header">
                <h3 className="product-card-name">{p.name}</h3>
                {p.category && <span className="product-card-category">{p.category}</span>}
              </div>
              <div className="product-card-price">${Number(p.price).toFixed(2)}</div>
              <div className="product-card-stock">
                <span className={`stock-badge ${stockBadge(p.quantity)}`}>
                  {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                </span>
              </div>
              <button
                className="btn-primary btn-small add-to-cart-btn"
                onClick={() => handleAdd(p)}
                disabled={p.quantity <= 0}
              >
                {p.quantity <= 0 ? 'Unavailable' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
