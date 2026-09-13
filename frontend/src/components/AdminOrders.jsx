import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend එකෙන් සියලුම Orders (Guest + Registered) ලබා ගැනීම
  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders/admin/all');
      setOrders(res.data.orders || res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Status එක Confirm / Update කිරීම
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { 
        status: newStatus 
      });
      alert(`Order marked as ${newStatus}!`);
      fetchOrders(); // Table එක refresh කිරීම
    } catch (err) {
      alert('Status update failed');
      console.error(err);
    }
  };

  if (loading) return <p style={{ padding: '20px' }}>Loading orders...</p>;

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: 'auto' }}>
      <h2>Order Management (Admin Dashboard)</h2>
      
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Total</th>
            <th>Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center' }}>No orders found</td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-6)}</td>
                <td>{order.customerDetails?.name || 'N/A'}</td>
                <td>{order.customerDetails?.phone || 'N/A'}</td>
                <td>{order.customerDetails?.address || 'N/A'}</td>
                <td>Rs. {order.totalAmount}</td>
                <td>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '4px',
                    background: order.user ? '#e3f2fd' : '#fff3e0',
                    color: order.user ? '#0d47a1' : '#e65100',
                    fontSize: '12px'
                  }}>
                    {order.user ? 'Registered' : 'Guest'}
                  </span>
                </td>
                <td>
                  <strong style={{ 
                    color: order.status === 'Confirmed' ? 'green' : (order.status === 'Pending' ? 'orange' : '#333') 
                  }}>
                    {order.status}
                  </strong>
                </td>
                <td>
                  {order.status === 'Pending' ? (
                    <button 
                      onClick={() => handleStatusChange(order._id, 'Confirmed')}
                      style={{ padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Confirm
                    </button>
                  ) : (
                    <span style={{ color: '#666', fontSize: '13px' }}>Completed</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}