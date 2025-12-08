import React from 'react';
import { Transaction } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Wallet, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  transactions: Transaction[];
}

const VisualDashboard: React.FC<Props> = ({ transactions }) => {
  const { t } = useTranslation();

  // Aggregate Data for Bar Chart (Monthly Income vs Expense)
  const barData = React.useMemo(() => {
    const map = new Map<string, {name: string, income: number, expense: number}>();
    
    transactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
        if (!map.has(key)) map.set(key, { name: key, income: 0, expense: 0 });
        
        const entry = map.get(key)!;
        if (t.category === 'Te Hyra') entry.income += t.amount;
        if (t.category === 'Shpenzime') entry.expense += t.amount;
    });

    return Array.from(map.values()).sort((a,b) => {
        // Simple sort by string comparison isn't great, ideally sort by date object, 
        // but for this simple dash, it's acceptable or we assume data is roughly chronological
        return 0; 
    });
  }, [transactions]);

  // Aggregate for Pie Chart (Expenses by SubCategory)
  const pieData = React.useMemo(() => {
      const map = new Map<string, number>();
      transactions.filter(t => t.category === 'Shpenzime').forEach(t => {
          map.set(t.subCategory, (map.get(t.subCategory) || 0) + t.amount);
      });
      // Sort by value in descending order (highest to lowest)
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // FEATURE 1: Key Metrics Cards
  const metrics = React.useMemo(() => {
    const totalIncome = transactions.filter(t => t.category === 'Te Hyra').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.category === 'Shpenzime').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;
    const avgTransaction = transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0;
    
    // Calculate trend (compare last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentIncome = transactions.filter(t => {
      const date = new Date(t.date);
      return t.category === 'Te Hyra' && date >= thirtyDaysAgo;
    }).reduce((sum, t) => sum + t.amount, 0);
    
    const previousIncome = transactions.filter(t => {
      const date = new Date(t.date);
      return t.category === 'Te Hyra' && date >= sixtyDaysAgo && date < thirtyDaysAgo;
    }).reduce((sum, t) => sum + t.amount, 0);
    
    const trend = previousIncome > 0 ? ((recentIncome - previousIncome) / previousIncome) * 100 : 0;
    
    return { totalIncome, totalExpense, netBalance, avgTransaction, trend };
  }, [transactions]);

  // FEATURE 2: Cash Flow Trend (Line Chart)
  const cashFlowData = React.useMemo(() => {
    const map = new Map<string, {date: string, balance: number}>();
    let runningBalance = 0;
    
    transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(t => {
        const date = new Date(t.date);
        const key = date.toISOString().split('T')[0];
        
        if (t.category === 'Te Hyra') runningBalance += t.amount;
        if (t.category === 'Shpenzime') runningBalance -= t.amount;
        
        map.set(key, { date: key, balance: runningBalance });
      });
    
    return Array.from(map.values());
  }, [transactions]);

  // FEATURE 3: Top Spending Categories
  const topCategories = React.useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.category === 'Shpenzime').forEach(t => {
      map.set(t.subCategory, (map.get(t.subCategory) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  // FEATURE 4: Monthly Comparison (Area Chart)
  const monthlyComparison = React.useMemo(() => {
    const map = new Map<string, {month: string, income: number, expense: number, net: number}>();
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!map.has(key)) map.set(key, { month: monthName, income: 0, expense: 0, net: 0 });
      
      const entry = map.get(key)!;
      if (t.category === 'Te Hyra') {
        entry.income += t.amount;
        entry.net += t.amount;
      }
      if (t.category === 'Shpenzime') {
        entry.expense += t.amount;
        entry.net -= t.amount;
      }
    });
    
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // FEATURE 5: Recent Activity Summary
  const recentActivity = React.useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // FEATURE 6: Individual Balance Sheets for Burim and Skender
  const individualBalances = React.useMemo(() => {
    const burimData = {
      name: 'Burimi',
      income: 0,
      expenses: 0,
      transfersOut: 0,
      transfersIn: 0,
      balance: 0,
      transactions: 0
    };
    
    const skenderData = {
      name: 'Skenderi',
      income: 0,
      expenses: 0,
      transfersOut: 0,
      transfersIn: 0,
      balance: 0,
      transactions: 0
    };

    transactions.forEach(t => {
      const isBurim = t.name === 'Burimi';
      const isSkender = t.name === 'Skenderi';
      
      if (isBurim) {
        burimData.transactions++;
        if (t.category === 'Te Hyra') {
          burimData.income += t.amount;
          burimData.balance += t.amount;
        } else if (t.category === 'Shpenzime') {
          burimData.expenses += t.amount;
          burimData.balance -= t.amount;
        } else if (t.category === 'Transfere') {
          burimData.transfersOut += t.amount;
          burimData.balance -= t.amount; // Money going OUT from Burimi
        }
      }
      
      if (isSkender) {
        skenderData.transactions++;
        if (t.category === 'Te Hyra') {
          skenderData.income += t.amount;
          skenderData.balance += t.amount;
        } else if (t.category === 'Shpenzime') {
          skenderData.expenses += t.amount;
          skenderData.balance -= t.amount;
        } else if (t.category === 'Transfere') {
          skenderData.transfersOut += t.amount;
          skenderData.balance -= t.amount; // Money going OUT from Skenderi
        }
      }
    });

    // Add transfers IN: Burimi receives Skenderi's transfers OUT
    burimData.transfersIn = skenderData.transfersOut;
    burimData.balance += skenderData.transfersOut;
    
    // Add transfers IN: Skenderi receives Burimi's transfers OUT
    skenderData.transfersIn = burimData.transfersOut;
    skenderData.balance += burimData.transfersOut;

    return { burim: burimData, skender: skenderData };
  }, [transactions]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6 mt-6">
      {/* FEATURE 1: Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <span className={`flex items-center text-sm ${metrics.trend >= 0 ? 'text-green-100' : 'text-red-100'}`}>
              {metrics.trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(metrics.trend).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm opacity-90">{t('totalIncomeLabel')}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.totalIncome)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90">{t('totalExpensesLabel')}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.totalExpense)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90">{t('currentBalance')}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.netBalance)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90">{t('avgTransactionLabel') || 'Avg Transaction'}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(metrics.avgTransaction)}</p>
        </div>
      </div>

      {/* FEATURE 6: Individual Balance Sheets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Burim's Balance Sheet */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <User className="w-6 h-6 mr-2" />
              {t('burimBalance')}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Balance Card */}
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-indigo-600">
              <p className="text-sm text-gray-600 mb-1">{t('currentBalance')}</p>
              <p className={`text-3xl font-bold ${individualBalances.burim.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(individualBalances.burim.balance)}
              </p>
            </div>

            {/* Income */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('totalIncomeLabel')}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(individualBalances.burim.income)}</p>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('totalExpensesLabel')}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(individualBalances.burim.expenses)}</p>
                </div>
              </div>
            </div>

            {/* Transfers */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('transfersOut')}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(individualBalances.burim.transfersOut)}</p>
                </div>
              </div>
            </div>

            {/* Transaction Count */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm font-medium text-gray-700">{t('totalTransactionsLabel')}</p>
              <p className="text-2xl font-bold text-indigo-600">{individualBalances.burim.transactions}</p>
            </div>
          </div>
        </div>

        {/* Skender's Balance Sheet */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <User className="w-6 h-6 mr-2" />
              {t('skenderBalance')}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Balance Card */}
            <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-purple-600">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className={`text-3xl font-bold ${individualBalances.skender.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(individualBalances.skender.balance)}
              </p>
            </div>

            {/* Income */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(individualBalances.skender.income)}</p>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(individualBalances.skender.expenses)}</p>
                </div>
              </div>
            </div>

            {/* Transfers */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transfers Out</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(individualBalances.skender.transfersOut)}</p>
                </div>
              </div>
            </div>

            {/* Transaction Count */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-gray-700">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{individualBalances.skender.transactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 2: Cash Flow Trend */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
          {t('cashFlowTrend')}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={12} stroke="#6b7280" />
              <YAxis fontSize={12} stroke="#6b7280" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FEATURE 4: Monthly Comparison Area Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">{t('monthlyIncomeVsExpense')}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyComparison}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} stroke="#6b7280" />
              <YAxis fontSize={12} stroke="#6b7280" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">{t('monthlyPerformance')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} stroke="#6b7280" />
                <YAxis fontSize={12} stroke="#6b7280" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Original Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col">
          <h3 className="text-xl font-bold mb-2 text-gray-800">{t('expenseBreakdown')}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="42%"
                  labelLine={false}
                  label={false}
                  outerRadius={95}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend 
                  verticalAlign="bottom" 
                  height={90}
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  formatter={(value, entry: any) => {
                    // Calculate total from all pie data entries
                    const total = pieData.reduce((sum, item) => sum + item.value, 0);
                    // Find the matching item by name to get correct value
                    const matchingItem = pieData.find(item => item.name === value);
                    const itemValue = matchingItem?.value || 0;
                    const percent = total > 0 ? ((itemValue / total) * 100).toFixed(0) : 0;
                    return `${value} (${percent}%)`;
                  }}
                  iconSize={8}
                  layout="horizontal"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FEATURE 3: Top Spending Categories & FEATURE 5: Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">{t('topSpendingCategories')}</h3>
          <div className="space-y-3">
            {topCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3" 
                       style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                    {idx + 1}
                  </div>
                  <span className="font-medium text-gray-700">{cat.name}</span>
                </div>
                <span className="font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">{t('recentActivity')}</h3>
          <div className="space-y-3">
            {recentActivity.map((txn, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{txn.name}</p>
                  <p className="text-xs text-gray-500">{txn.subCategory} • {new Date(txn.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold ${txn.category === 'Te Hyra' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.category === 'Te Hyra' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualDashboard;