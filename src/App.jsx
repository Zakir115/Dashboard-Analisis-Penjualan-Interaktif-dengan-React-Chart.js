import React, { useState, useMemo } from 'react';
import data from './data.json';

// Charts
import { Bar, Pie, Line } from 'react-chartjs-2';
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

// Small reusable Stat Card component
const StatCard = ({ title, value, subtitle }) => (
  <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-gray-100">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-800">{value}</div>
    {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
  </div>
);

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  // unique categories
  const categories = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.category)))], []);

  // filtered data by category and search
  const filtered = useMemo(() => {
    return data.filter(item => {
      const byCat = selectedCategory === 'All' ? true : item.category === selectedCategory;
      const bySearch = [item.product, item.country, item.category].join(' ').toLowerCase().includes(search.trim().toLowerCase());
      return byCat && bySearch;
    });
  }, [selectedCategory, search]);

  // KPIs and aggregations
  const { totalSales, totalUnits, avgPrice, topCategory, salesByCategory, salesByCountry, salesByMonth, topProducts } = useMemo(() => {
    let totalSalesLocal = 0;
    let totalUnitsLocal = 0;
    const salesByCategoryLocal = {};
    const salesByCountryLocal = {};
    const salesByMonthLocal = {};
    const productUnits = {};

    filtered.forEach(item => {
      const revenue = item.price * item.quantity;
      totalSalesLocal += revenue;
      totalUnitsLocal += item.quantity;

      salesByCategoryLocal[item.category] = (salesByCategoryLocal[item.category] || 0) + revenue;
      salesByCountryLocal[item.country] = (salesByCountryLocal[item.country] || 0) + revenue;

      const month = item.date.substring(0, 7); // YYYY-MM
      salesByMonthLocal[month] = (salesByMonthLocal[month] || 0) + revenue;

      productUnits[item.product] = (productUnits[item.product] || 0) + item.quantity;
    });

    const avgPriceLocal = totalUnitsLocal ? Math.round(totalSalesLocal / totalUnitsLocal) : 0;

    // top category
    const topCategoryLocal = Object.entries(salesByCategoryLocal).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // top products (by units)
    const topProductsLocal = Object.entries(productUnits).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalSales: totalSalesLocal,
      totalUnits: totalUnitsLocal,
      avgPrice: avgPriceLocal,
      topCategory: topCategoryLocal,
      salesByCategory: salesByCategoryLocal,
      salesByCountry: salesByCountryLocal,
      salesByMonth: salesByMonthLocal,
      topProducts: topProductsLocal,
    };
  }, [filtered]);

  // Chart datasets
  const barChartData = {
    labels: Object.keys(salesByCategory),
    datasets: [
      {
        label: 'Penjualan (Rp)',
        data: Object.values(salesByCategory),
        backgroundColor: 'rgba(99,102,241,0.85)',
        borderRadius: 8,
        barThickness: 32,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(salesByCountry),
    datasets: [
      {
        data: Object.values(salesByCountry),
        backgroundColor: ['rgba(99,102,241,0.85)', 'rgba(37,99,235,0.8)', 'rgba(34,197,94,0.85)', 'rgba(249,115,22,0.85)'],
        hoverOffset: 6,
      },
    ],
  };

  const lineChartData = {
    labels: Object.keys(salesByMonth).sort(),
    datasets: [
      {
        label: 'Penjualan Bulanan (Rp)',
        data: Object.keys(salesByMonth).sort().map(k => salesByMonth[k]),
        fill: true,
        tension: 0.3,
        backgroundColor: 'rgba(99,102,241,0.12)',
        borderColor: 'rgba(99,102,241,0.95)',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { grid: { color: 'rgba(15,23,42,0.06)' }, ticks: { callback: val => new Intl.NumberFormat('id-ID').format(val) } },
    },
  };

  // helper format
  const formatIDR = (v) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(v));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard Analisis Penjualan</h1>
            <p className="text-gray-500 mt-1">Ringkasan penjualan & tren — modern minimalist layout untuk portfolio.</p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, negara, kategori..."
              className="px-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="text-sm text-gray-500">Data: {filtered.length} baris</div>
          </div>
        </header>

        {/* Controls + KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Kategori</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button className="px-3 py-2 bg-white border rounded-md text-sm shadow-sm">Export CSV</button>
                <button className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm shadow hover:opacity-95">Download</button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Penjualan" value={formatIDR(totalSales)} />
              <StatCard title="Total Unit Terjual" value={totalUnits.toLocaleString()} />
              <StatCard title="Rata-rata Harga" value={formatIDR(avgPrice)} />
              <StatCard title="Kategori Teratas" value={topCategory} />
            </div>
          </div>

          {/* Small summary card */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500">Ringkasan Cepat</h3>
            <div className="mt-3 text-sm text-gray-700 space-y-2">
              <div>Total Revenue: <strong>{formatIDR(totalSales)}</strong></div>
              <div>Unit Terjual: <strong>{totalUnits}</strong></div>
              <div>Baris ditampilkan: <strong>{filtered.length}</strong></div>
            </div>
          </div>
        </div>

        {/* Charts area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-96">
            <h4 className="text-lg font-semibold mb-3">Tren Penjualan Bulanan</h4>
            <div className="h-72">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-56">
              <h4 className="text-lg font-semibold mb-3">Penjualan per Kategori</h4>
              <div className="h-36">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-56">
              <h4 className="text-lg font-semibold mb-3">Distribusi per Negara</h4>
              <div className="h-36 flex items-center justify-center">
                <Pie data={pieChartData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Transaksi Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3">Kategori</th>
                  <th className="py-2 px-3">Qty</th>
                  <th className="py-2 px-3">Price</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Country</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice().reverse().map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-600">{row.id}</td>
                    <td className="py-3 px-3 font-medium">{row.product}</td>
                    <td className="py-3 px-3">{row.category}</td>
                    <td className="py-3 px-3">{row.quantity}</td>
                    <td className="py-3 px-3">{formatIDR(row.price)}</td>
                    <td className="py-3 px-3">{row.date}</td>
                    <td className="py-3 px-3">{row.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-400 text-sm">Designed by Muzakir • Simple modern minimalist dashboard</footer>
      </div>
    </div>
  );
}
