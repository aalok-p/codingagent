import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/Toast';
import { placeOrder } from '../../api/orders';

export default function CartDrawer({ open, onClose }) {
  const { items, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const toast = useToast();
  const [placing, setPlacing] = useState(false);

  async function handlePlaceOrder() {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));
      await placeOrder(orderItems);
      clearCart();
      onClose();
      toast('Order placed successfully!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place order';
      toast(msg, 'error');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <>
      {open && <div className="cart-overlay" onClick={onClose}></div>}
      <div className={`cart-drawer ${open ? 'cart-drawer-open' : ''}`}>
        <div className="cart-drawer-header">
          <h3>Shopping Cart</h3>
          <button className="cart-drawer-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer-empty">
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {items.map((i) => (
                <div key={i.product.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{i.product.name}</div>
                    <div className="cart-item-price">${Number(i.product.price).toFixed(2)} each</div>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(i.product.id, i.quantity - 1)}
                    >−</button>
                    <span className="cart-qty-value">{i.quantity}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(i.product.id, i.quantity + 1)}
                    >+</button>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(i.product.id)}
                      title="Remove"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                  <div className="cart-item-subtotal">
                    ${Number(i.product.price * i.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer-footer">
              <div className="cart-drawer-total">
                <span>Total</span>
                <span>${Number(cartTotal).toFixed(2)}</span>
              </div>
              <button
                className="btn-primary"
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
