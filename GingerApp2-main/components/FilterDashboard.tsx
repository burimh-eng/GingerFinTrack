import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Filter, X, Download, RefreshCw } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const FilterDashboard: React.FC<Props> = ({ transactions }) => {
  // Filter states
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Get unique values for dropdowns
  const uniqueAccounts = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.account))).sort(),
    [transactions]
  );

  const uniqueCategories = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.category))).sort(),
    [transactions]
  );

  const uniqueSubCategories = useMemo(() => {
    const filtered = selectedCategory 
      ? transactions.filter(t => t.category === selectedCategory)
      : transactions;
    return Array.from(new Set(filtered.map(t => t.subCategory))).sort();
  }, [transactions, selectedCategory]);

  const uniqueNames = useMemo(() => 
    Array.from(new Set(transactions.map(t => t.name))).sort(),
    [transactions]
  );

  // Get unique months and years from transactions
  const uniqueYears = useMemo(() => {
    const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear())));
    return years.sort((a, b) => b - a); // Sort descending (newest first)
  }, [transactions]);

  const months = [
    { value: '1', label: 'Janar' },
    { value: '2', label: 'Shkurt' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Prill' },
    { value: '5', label: 'Maj' },
    { value: '6', label: 'Qershor' },
    { value: '7', label: 'Korrik' },
    { value: '8', label: 'Gusht' },
    { value: '9', label: 'Shtator' },
    { value: '10', label: 'Tetor' },
    { value: '11', label: 'Nëntor' },
    { value: '12', label: 'Dhjetor' }
  ];

  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedAccount && t.account !== selectedAccount) return false;
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedSubCategory && t.subCategory !== selectedSubCategory) return false;
      if (selectedName && t.name !== selectedName) return false;
      if (selectedAmount) {
        const amount = parseFloat(selectedAmount);
        if (t.amount !== amount) return false;
      }
      
      // Month and Year filter
      const tDate = new Date(t.date);
      if (selectedMonth) {
        const tMonth = tDate.getMonth() + 1; // getMonth() returns 0-11
        if (tMonth !== parseInt(selectedMonth)) return false;
      }
      if (selectedYear) {
        const tYear = tDate.getFullYear();
        if (tYear !== parseInt(selectedYear)) return false;
      }
      
      // Date range filter
      if (startDate) {
        const sDate = new Date(startDate);
        if (tDate < sDate) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (tDate > eDate) return false;
      }
      return true;
    });
  }, [transactions, selectedAccount, selectedCategory, selectedSubCategory, selectedName, selectedAmount, selectedMonth, selectedYear, startDate, endDate]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.category === 'Te Hyra').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.category === 'Shpenzime').reduce((sum, t) => sum + t.amount, 0);
    const transfers = filteredTransactions.filter(t => t.category === 'Transfere').reduce((sum, t) => sum + t.amount, 0);
    
    // Total Amount = Te Hyra - Shpenzime - Transfere
    const total = income - expenses - transfers;
    
    return { total, income, expenses, transfers, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const resetFilters = () => {
    setSelectedAccount('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedName('');
    setSelectedAmount('');
    setSelectedMonth('');
    setSelectedYear('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = selectedAccount || selectedCategory || selectedSubCategory || selectedName || selectedAmount || selectedMonth || selectedYear || startDate || endDate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Name', 'Account', 'Category', 'SubCategory', 'Amount', 'Notes', 'Description'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.name,
      t.account,
      t.category,
      t.subCategory,
      t.amount,
      t.notes || '',
      t.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            FILTRO të dhënat
          </h2>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Pastro Filtrin
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Account Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Akont</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Të gjitha</option>
              {uniqueAccounts.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kategoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory(''); // Reset subcategory when category changes
              }}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Të gjitha</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* SubCategory Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-Kategori</label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={!selectedCategory && uniqueSubCategories.length > 50}
            >
              <option value="">Të gjitha</option>
              {uniqueSubCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Name Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Emri</label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Të gjitha</option>
              {uniqueNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Muaji</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Të gjitha</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Viti</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Të gjitha</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Data nga</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Data deri</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Amount Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Shuma (€)</label>
            <input
              type="number"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(e.target.value)}
              placeholder="Shuma specifike"
              className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Info Banner */}
        {hasActiveFilters && (
          <div className="mt-3 bg-yellow-100 border border-yellow-400 rounded-lg p-2.5">
            <p className="text-center text-yellow-900 font-semibold text-xs">
              Për të gjeneruar raportet sipas kritereve të mësipërme, së pari zgjidhni muajt dhe vitet për të cilat kërkohët raporti.
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4">
          <p className="text-sm text-gray-600 mb-1">Te Hyra</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-4">
          <p className="text-sm text-gray-600 mb-1">Shpenzime</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border-l-4 border-purple-500 p-4">
          <p className="text-sm text-gray-600 mb-1">Transfere</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.transfers)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md border-l-4 border-indigo-500 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(summary.total)}</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Rezultatet ({filteredTransactions.length} transaksione)
          </h3>
          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Eksporto CSV
          </button>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100 sticky top-0 text-[10px]">
              <tr>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 uppercase">Data</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 uppercase">Emri</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 uppercase">Akont</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 uppercase">Kategoria</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 uppercase">Sub-Kategori</th>
                <th className="px-3 py-1.5 text-right font-semibold text-gray-700 uppercase">Shuma</th>
                <th className="px-3 py-1.5 text-left font-semibold text-gray-700 uppercase">Shënime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-xs">
                    Nuk ka të dhëna që përputhen me filtrat e zgjedhur
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-1.5 text-gray-900">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-900">{t.name}</td>
                    <td className="px-3 py-1.5 text-gray-700">{t.account}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-20 text-center ${
                        t.category === 'Te Hyra' ? 'bg-green-100 text-green-800' :
                        t.category === 'Shpenzime' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-700">{t.subCategory}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900">{formatCurrency(t.amount)}</td>
                    <td className="px-3 py-1.5 text-gray-600">{t.notes || t.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FilterDashboard;
