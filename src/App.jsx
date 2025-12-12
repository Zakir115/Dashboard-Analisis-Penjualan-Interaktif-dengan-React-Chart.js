import React, { useState, useMemo, useEffect } from 'react';
import data from './data.json';

// Import komponen Chart dari react-chartjs-2
import { Bar, Pie, Line } from 'react-chartjs-2';
// Import fungsi yang diperlukan dari Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Daftarkan komponen Chart.js yang akan digunakan
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function App() {
  // State untuk menyimpan kategori yang dipilih di filter
  const [selectedCategory, setSelectedCategory] = useState('All');

  // useMemo untuk memproses data. Ini akan dihitung ulang hanya jika 'data' atau 'selectedCategory' berubah.
  const processedData = useMemo(() => {
    // Filter data berdasarkan kategori yang dipilih
    const filteredData = selectedCategory === 'All'
      ? data
      : data.filter(item => item.category === selectedCategory);

    // --- Hitung KPI (Key Performance Indicator) ---
    const totalSales = filteredData.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalOrders = new Set(filteredData.map(item => item.id)).size;

    // --- Siapkan data untuk Grafik Batang (Penjualan per Kategori) ---
    const salesByCategory = {};
    filteredData.forEach(item => {
      if (!salesByCategory[item.category]) {
        salesByCategory[item.category] = 0;
      }
      salesByCategory[item.category] += item.quantity * item.price;
    });

    // --- Siapkan data untuk Grafik Pie (Penjualan per Negara) ---
    const salesByCountry = {};
    filteredData.forEach(item => {
      if (!salesByCountry[item.country]) {
        salesByCountry[item.country] = 0;
      }
      salesByCountry[item.country] += item.quantity * item.price;
    });

    // --- Siapkan data untuk Grafik Garis (Tren Penjualan Bulanan) ---
    const salesByMonth = {};
    filteredData.forEach(item => {
      const month = item.date.substring(0, 7); // Ambil format YYYY-MM
      if (!salesByMonth[month]) {
        salesByMonth[month] = 0;
      }
      salesByMonth[month] += item.quantity * item.price;
    });

    return {
      totalSales,
      totalOrders,
      salesByCategory,
      salesByCountry,
      salesByMonth,
    };
  }, [data, selectedCategory]);

  // Ambil daftar kategori unik untuk dropdown filter
  const categories = useMemo(() => {
    const cats = new Set(data.map(item => item.category));
    return ['All', ...cats];
  }, [data]);

  // --- Konfigurasi untuk setiap grafik ---
  const barChartData = {
    labels: Object.keys(processedData.salesByCategory),
    datasets: [
      {
        label: 'Total Penjualan (Rp)',
        data: Object.values(processedData.salesByCategory),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(processedData.salesByCountry),
    datasets: [
      {
        label: 'Total Penjualan (Rp)',
        data: Object.values(processedData.salesByCountry),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: Object.keys(processedData.salesByMonth).sort(),
    datasets: [
      {
        label: 'Tren Penjualan Bulanan (Rp)',
        data: Object.values(processedData.salesByMonth),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  // Opsi umum untuk grafik
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Dashboard Analisis Penjualan</h1>
          <p className="text-gray-600">Visualisasi data penjualan interaktif</p>
        </header>

        {/* Filter */}
        <div className="mb-6">
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">Filter berdasarkan Kategori:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Penjualan</h3>
            <p className="text-3xl font-bold text-green-600">Rp {processedData.totalSales.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700">Total Pesanan</h3>
            <p className="text-3xl font-bold text-blue-600">{processedData.totalOrders}</p>
          </div>
        </div>

        {/* Grid untuk Grafik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Penjualan per Kategori</h2>
            <Bar data={barChartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Penjualan per Negara</h2>
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tren Penjualan Bulanan</h2>
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default App;