import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products';
import { useToast } from '../../components/Toast';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', price: '', quantity: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(Array.isArray(data) ? data : data.products || []);
    }).catch(() => {
      toast('Failed to load products', 'error');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', sku: '', price: '', quantity: '' });
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setFormErrors({});
    setShowModal(true);
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.sku.trim()) errors.sku = 'SKU is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errors.price = 'Valid price is required';
    if (!form.quantity || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0)
      errors.quantity = 'Valid quantity is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
      };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast('Product updated successfully');
      } else {
        await createProduct(payload);
        toast('Product created successfully');
      }
      setShowModal(false);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save product';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteProduct(id);
      toast('Product deleted successfully');
      setDeleting(null);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch {
      toast('Failed to delete product', 'error');
    }
  }

  function stockBadge(qty) {
    if (qty > 10) return 'stock-high';
    if (qty > 5) return 'stock-medium';
    return 'stock-low';
  }

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="seller-products">
      <div className="seller-products-header">
        <h2>My Products</h2>
        <button className="btn-primary btn-small" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products yet. Click "Add Product" to get started.</p>
        </div>
      ) : (
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>SUI Number</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="product-name-cell">{p.name}</td>
                  <td><code>{p.sku}</code></td>
                  <td><code>{p.sui_number}</code></td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`stock-badge ${stockBadge(p.quantity)}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => setDeleting(p)} title="Delete">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={formErrors.name ? 'input-error' : ''}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={formErrors.sku ? 'input-error' : ''}
                />
                {formErrors.sku && <span className="field-error">{formErrors.sku}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={formErrors.price ? 'input-error' : ''}
                  />
                  {formErrors.price && <span className="field-error">{formErrors.price}</span>}
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className={formErrors.quantity ? 'input-error' : ''}
                  />
                  {formErrors.quantity && <span className="field-error">{formErrors.quantity}</span>}
                </div>
              </div>
              {editing && (
                <div className="form-group sui-display">
                  <label>SUI Number (auto-generated, read-only)</label>
                  <input value={editing.sui_number} disabled />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-small" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete <strong>{deleting.name}</strong>?</p>
            <p className="confirm-sub">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDelete(deleting.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
