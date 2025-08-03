
import React, { useState, useEffect } from 'react';
import './App.css';
// Import Firebase dependencies
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  getDocs
} from 'firebase/firestore';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inventory fields
const FIELDS = [
  'productId', 'productName', 'size', 'color', 'quantity', 'lastUpdated',
  'price', 'category', 'supplier', 'brand'
];

function App() {
  // State for inventory and form
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({
    productId: '', productName: '', size: '', color: '', quantity: 0,
    lastUpdated: '', price: '', category: '', supplier: '', brand: ''
  });
  const [loading, setLoading] = useState(true);

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Handle form input changes
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Add new inventory item
  const handleAdd = async e => {
    e.preventDefault();
    if (!form.productId || !form.productName) return alert('Product ID and Name required');
    try {
      await addDoc(collection(db, 'inventory'), {
        ...form,
        quantity: Number(form.quantity),
        lastUpdated: new Date().toISOString()
      });
      setForm({
        productId: '', productName: '', size: '', color: '', quantity: 0,
        lastUpdated: '', price: '', category: '', supplier: '', brand: ''
      });
    } catch (err) {
      alert('Error adding item: ' + err.message);
    }
  };

  // Increment/decrement quantity
  const updateQuantity = async (id, currentQty, delta) => {
    const itemRef = doc(db, 'inventory', id);
    try {
      await updateDoc(itemRef, {
        quantity: currentQty + delta,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      alert('Error updating quantity: ' + err.message);
    }
  };

  // Download inventory as CSV
  const downloadCSV = async () => {
    // Get all docs (not just current page)
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    const rows = querySnapshot.docs.map(doc => doc.data());
    const csv = [FIELDS.join(',')].concat(
      rows.map(row => FIELDS.map(f => JSON.stringify(row[f] || '')).join(','))
    ).join('\n');
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Render inventory table
  return (
    <div className="App" style={{ padding: 24, maxWidth: 1200, margin: 'auto' }}>
      <h1>Inventory Management</h1>
      {/* Add Item Form */}
      <form onSubmit={handleAdd} style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {FIELDS.filter(f => f !== 'lastUpdated').map(field => (
          <input
            key={field}
            name={field}
            value={form[field]}
            onChange={handleChange}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            type={field === 'quantity' || field === 'price' ? 'number' : 'text'}
            style={{ flex: '1 0 120px', padding: 8 }}
            required={['productId', 'productName'].includes(field)}
          />
        ))}
        <button type="submit" style={{ padding: '8px 16px' }}>Add Item</button>
      </form>

      {/* Download CSV Button */}
      <button onClick={downloadCSV} style={{ marginBottom: 16, padding: '8px 16px' }}>Download CSV</button>

      {/* Inventory Table */}
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {FIELDS.map(f => <th key={f} style={{ border: '1px solid #ccc', padding: 8 }}>{f}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                {FIELDS.map(f => <td key={f} style={{ border: '1px solid #eee', padding: 8 }}>{item[f]}</td>)}
                <td>
                  <button onClick={() => updateQuantity(item.id, item.quantity, 1)} style={{ marginRight: 4 }}>+</button>
                  <button onClick={() => updateQuantity(item.id, item.quantity, -1)} disabled={item.quantity <= 0}>-</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Setup Instructions for Developers */}
      <div style={{ marginTop: 32, background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
        <h2>Setup Instructions</h2>
        <ol>
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a> and create a new project.</li>
          <li>Enable Firestore Database in your Firebase project.</li>
          <li>Copy your Firebase config and replace the <code>firebaseConfig</code> object above.</li>
          <li>Run <code>npm install firebase</code> in your project directory.</li>
          <li>Start the app with <code>npm start</code> in VS Code terminal.</li>
        </ol>
        <p>All inventory data is stored in the <b>inventory</b> collection in Firestore. The app supports real-time updates and CSV export for easy reporting.</p>
      </div>
    </div>
  );
}

export default App;
