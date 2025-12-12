import React, { useState, useEffect, useCallback } from 'react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import ComplexReport from './components/ComplexReport';
import VisualDashboard from './components/VisualDashboard';
// import AiInsights from './components/AiInsights'; // Removed from dashboard
import ImportData from './components/ImportData';
import FilterDashboard from './components/FilterDashboard';
import ActivityMonitor from './components/ActivityMonitor';
import OptionManager from './components/OptionManager';
import PasswordManager from './components/PasswordManager';
import { Transaction } from './types';
import { fetchTransactions, createTransaction, removeTransaction, updateTransaction } from './services/dataService';
import { LayoutDashboard, FileSpreadsheet, List, PieChart, Table as TableIcon, LogOut, User, Upload, Filter, Activity, Globe, Key } from 'lucide-react';
import { useAuth } from './index';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { username, role, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'entry' | 'transactions' | 'report' | 'dashboard' | 'import' | 'filter' | 'activity' | 'lists' | 'password'>('entry');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchTransactions();
      console.log('Fetched transactions:', data);
      console.log('Number of transactions:', data.length);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleAdd = async (t: Transaction) => {
    try {
      await createTransaction({
        date: t.date,
        account: t.account,
        category: t.category,
        subCategory: t.subCategory,
        notes: t.notes,
        amount: t.amount,
        name: t.name,
        description: t.description,
        projectName: 'Ginger HQ',
      });
      await loadTransactions();
    } catch (error) {
      console.error('Failed to create transaction', error);
    }
  };

  const handleDelete = async (id: string) => {
      // Only Burim can delete records
      if (username !== 'Burim') {
        alert('Only Burim can delete records.');
        return;
      }
      if(window.confirm('Are you sure you want to delete this record?')) {
        try {
          await removeTransaction(id);
          await loadTransactions();
        } catch (error) {
          console.error('Failed to delete transaction', error);
        }
      }
  };

  const handleUpdate = async (id: string, data: Partial<Transaction>) => {
    try {
      await updateTransaction(id, {
        date: data.date!,
        account: data.account!,
        category: data.category!,
        subCategory: data.subCategory!,
        notes: data.notes || '',
        amount: data.amount!,
        name: data.name!,
        description: data.description || '',
      });
      await loadTransactions();
    } catch (error) {
      console.error('Failed to update transaction', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold tracking-wider text-green-400 flex items-center gap-2">
                FinTrack<span className="text-white">Pro</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">{t('personalFinanceManager')}</p>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">{username}</p>
                  <p className="text-xs text-gray-400">{role === 'ADMIN' ? t('fullAccess') : t('readOnly')}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto">
            <button 
                onClick={() => setActiveTab('entry')}
                className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'entry' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
            >
                <List className="w-5 h-5" />
                <span className="font-medium">{t('dataEntry')}</span>
            </button>
            <button 
                onClick={() => setActiveTab('transactions')}
                className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'transactions' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
            >
                <TableIcon className="w-5 h-5" />
                <span className="font-medium">{t('allTransactions')}</span>
            </button>
            <button 
                onClick={() => setActiveTab('report')}
                className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'report' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
            >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="font-medium">{t('yearlyMatrix')}</span>
            </button>
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'dashboard' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
            >
                <PieChart className="w-5 h-5" />
                <span className="font-medium">{t('dashboardAI')}</span>
            </button>
            <button 
                onClick={() => setActiveTab('filter')}
                className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'filter' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
            >
                <Filter className="w-5 h-5" />
                <span className="font-medium">{t('filterDashboard')}</span>
            </button>
            {/* Activity Monitor - only for Burim (ADMIN) */}
            {username === 'Burim' && (
              <button 
                  onClick={() => setActiveTab('activity')}
                  className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'activity' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
              >
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">{t('activityMonitor')}</span>
              </button>
            )}
            {/* Import, Lists - for ADMIN users (Burim and Skender) */}
            {role === 'ADMIN' && (
              <>
                <button 
                    onClick={() => setActiveTab('import')}
                    className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'import' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
                >
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">{t('importData')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('lists')}
                    className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'lists' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
                >
                    <List className="w-5 h-5" />
                    <span className="font-medium">{t('optionManagerTab')}</span>
                </button>
              </>
            )}
            {/* Password Settings - available to all users */}
            <button
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-800 transition-all border-l-4 ${activeTab === 'password' ? 'bg-gray-800 border-green-500 text-green-400' : 'border-transparent text-gray-300'}`}
            >
                <Key className="w-5 h-5" />
                <span className="font-medium">{t('passwordSettings')}</span>
            </button>
        </nav>
        <div className="p-6 text-xs text-gray-500 border-t border-gray-800">
            v1.0.1
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50 overflow-y-auto h-screen p-4 md:p-8 relative">
        
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
             <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {activeTab === 'entry' && t('newTransaction')}
                    {activeTab === 'transactions' && t('transactionHistory')}
                    {activeTab === 'report' && t('financialReports')}
                    {activeTab === 'dashboard' && t('analyticsInsights')}
                    {activeTab === 'filter' && t('filterDashboard')}
                    {activeTab === 'activity' && t('activityMonitor')}
                    {activeTab === 'import' && t('importTransactions')}
                    {activeTab === 'lists' && t('optionManagerTab')}
                    {activeTab === 'password' && t('passwordSettings')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'entry' && t('addTransactionDesc')}
                    {activeTab === 'transactions' && t('viewTransactionsDesc')}
                    {activeTab === 'report' && t('breakdownDesc')}
                    {activeTab === 'dashboard' && t('overviewDesc')}
                    {activeTab === 'filter' && t('filterDesc')}
                    {activeTab === 'activity' && t('monitorDesc')}
                    {activeTab === 'import' && t('bulkImportDesc')}
                    {activeTab === 'lists' && t('manageListsNavDescription')}
                    {activeTab === 'password' && t('passwordSettingsDesc')}
                </p>
             </div>
             
             <div className="flex items-center gap-4">
               <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                   <span className="text-gray-500 mr-2">{t('totalRecords')}:</span>
                   <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{transactions.length}</span>
               </div>
               <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                 <Globe className="w-4 h-4 text-gray-500" />
                 <button onClick={() => changeLanguage('al')} className={`px-2 py-0.5 text-xs rounded ${i18n.language === 'al' ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-500'}`}>Shqip</button>
                 <button onClick={() => changeLanguage('en')} className={`px-2 py-0.5 text-xs rounded ${i18n.language === 'en' ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-500'}`}>English</button>
               </div>
             </div>
        </header>

        {activeTab === 'entry' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
                <TransactionForm onAdd={handleAdd} />
                <div className="mt-8">
                    <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-3">Recently Added</h3>
                    {/* Only show the last 5 items here to keep the entry page clean */}
                    <TransactionList transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} limit={5} showSearch={false} />
                </div>
            </div>
        )}

        {activeTab === 'transactions' && (
            <div className="animate-fade-in h-[calc(100vh-140px)]">
                <TransactionList transactions={transactions} onDelete={handleDelete} onUpdate={handleUpdate} />
            </div>
        )}

        {activeTab === 'report' && (
            <div className="animate-fade-in">
                 <ComplexReport transactions={transactions} />
            </div>
        )}

        {activeTab === 'dashboard' && (
            <div className="animate-fade-in pb-10 max-w-6xl mx-auto">
                <VisualDashboard transactions={transactions} />
            </div>
        )}

        {activeTab === 'filter' && (
            <div className="animate-fade-in">
                <FilterDashboard transactions={transactions} />
            </div>
        )}

        {activeTab === 'activity' && role === 'ADMIN' && (
            <div className="animate-fade-in">
                <ActivityMonitor />
            </div>
        )}

        {activeTab === 'import' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
                <ImportData />
            </div>
        )}

        {activeTab === 'lists' && role === 'ADMIN' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
                <OptionManager transactions={transactions} />
            </div>
        )}

        {activeTab === 'password' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
                <PasswordManager currentUsername={username || ''} />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;