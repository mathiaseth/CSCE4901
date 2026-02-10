import React, { useState } from 'react';
import axios from 'axios';

export default function DashboardPage() {
  const [query, setQuery] = useState('');
  const [foodData, setFoodData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch food info from backend
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`http://localhost:4000/api/food/${encodeURIComponent(query)}`);
      setFoodData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch food data. Make sure your backend is running.');
      setFoodData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>NutriFit Dashboard</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter food name or barcode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '0.5rem', width: '250px', marginRight: '0.5rem' }}
        />
        <button onClick={handleSearch} style={{ padding: '0.5rem 1rem' }}>
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {foodData && (
        <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '1rem', maxWidth: '400px' }}>
          <h2>{foodData.product_name || foodData.name}</h2>
          <p><strong>Brand:</strong> {foodData.brands || 'N/A'}</p>
          <p><strong>Quantity:</strong> {foodData.quantity || 'N/A'}</p>
          <p><strong>Calories:</strong> {foodData.nutriments?.energy_kcal || 'N/A'} kcal</p>
          <p><strong>Protein:</strong> {foodData.nutriments?.proteins || 'N/A'} g</p>
          <p><strong>Carbs:</strong> {foodData.nutriments?.carbohydrates || 'N/A'} g</p>
          <p><strong>Fat:</strong> {foodData.nutriments?.fat || 'N/A'} g</p>
        </div>
      )}
    </div>
  );
}
