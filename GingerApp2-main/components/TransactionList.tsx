import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Trash2, Search, Pencil, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOptionLists } from '../OptionContext';
import { useAuth } from '../index';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate?: (id: string, data: Partial<Transaction>) => Promise<void>;
  limit?: number;
  showSearch?: boolean;
}

const TransactionList: React.FC<Props> = ({ transactions, onDelete, onUpdate, limit, showSearch = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();
  const { options } = useOptionLists();
  const { username, role } = useAuth();
  
  const accounts = useMemo(() => options.accounts, [options.accounts]);
  const categories = useMemo(() => options.categories, [options.categories]);
  const subCategories = useMemo(() => options.subCategories, [options.subCategories]);
  const names = useMemo(() => options.names, [options.names]);

  const startEdit = (txn: Transaction) => {
    setEditingId(txn.id);
    setEditData({
      date: txn.date,
      account: txn.account,
      category: txn.category,
      subCategory: txn.subCategory,
      notes: txn.notes,
      amount: txn.amount,
      name: txn.name,
      description: txn.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId || !onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(editingId, editData);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChange = (field: keyof Transaction, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Filter transactions based on search term
  const filtered = transactions.filter(t => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (t.description || '').toLowerCase().includes(search) ||
      (t.category || '').toLowerCase().includes(search) ||
      (t.subCategory || '').toLowerCase().includes(search) ||
      (t.name || '').toLowerCase().includes(search) ||
      (t.notes || '').toLowerCase().includes(search) ||
      (t.amount?.toString() || '').includes(searchTerm)
    );
  });

  // Apply limit if provided (e.g. for "Recent Transactions" view)
  const displayData = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                {limit ? t('recentTransactionsSection') : t('transactionHistory')}
                <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {t('recordsLabel', { count: filtered.length })}
                </span>
            </h3>
            
            {showSearch && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder={t('searchPlaceholder')}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}
        </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-1.5 font-semibold">{t('date')}</th>
              <th className="px-3 py-1.5 font-semibold">{t('account')}</th>
              <th className="px-3 py-1.5 font-semibold">{t('category')}</th>
              <th className="px-3 py-1.5 font-semibold">{t('subCategory')}</th>
              <th className="px-3 py-1.5 font-semibold">{t('notes')}</th>
              <th className="px-3 py-1.5 text-right font-semibold">{t('amountEuro')}</th>
              <th className="px-3 py-1.5 font-semibold">{t('name')}</th>
              <th className="px-3 py-1.5 font-semibold">{t('description')}</th>
              <th className="px-3 py-1.5 text-center font-semibold">{t('actionsLabel')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.length === 0 ? (
                <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-gray-500 text-xs">
                        {searchTerm ? t('noMatchingRecords') : t('noRecords')}
                    </td>
                </tr>
            ) : (
                displayData.map((txn) => (
                <tr key={txn.id} className={`hover:bg-gray-50 transition-colors ${editingId === txn.id ? 'bg-blue-50' : ''}`}>
                    {editingId === txn.id ? (
                      <>
                        <td className="px-2 py-1">
                          <input 
                            type="date" 
                            value={editData.date || ''} 
                            onChange={(e) => handleEditChange('date', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select 
                            value={editData.account || ''} 
                            onChange={(e) => handleEditChange('account', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          >
                            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select 
                            value={editData.category || ''} 
                            onChange={(e) => handleEditChange('category', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select 
                            value={editData.subCategory || ''} 
                            onChange={(e) => handleEditChange('subCategory', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          >
                            {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            value={editData.notes || ''} 
                            onChange={(e) => handleEditChange('notes', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editData.amount || ''} 
                            onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
                            className="w-20 px-1 py-0.5 text-xs border rounded text-right"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select 
                            value={editData.name || ''} 
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          >
                            {names.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            value={editData.description || ''} 
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border rounded"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={saveEdit}
                              disabled={isSaving}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded p-1 transition-colors disabled:opacity-50"
                              title={t('save') || 'Save'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded p-1 transition-colors"
                              title={t('cancel') || 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-1.5 font-medium text-gray-900 whitespace-nowrap">{txn.date || ''}</td>
                        <td className="px-3 py-1.5 text-gray-700">{txn.account || ''}</td>
                        <td className="px-3 py-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-20 text-center ${
                                txn.category === 'Te Hyra' ? 'bg-green-100 text-green-800' :
                                txn.category === 'Shpenzime' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                                {txn.category || ''}
                            </span>
                        </td>
                        <td className="px-3 py-1.5 text-gray-700">{txn.subCategory || ''}</td>
                        <td className="px-3 py-1.5 text-gray-500 truncate max-w-[150px]" title={txn.notes || ''}>{txn.notes || ''}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold text-gray-900">{(txn.amount ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-gray-700">{txn.name || ''}</td>
                        <td className="px-3 py-1.5 text-gray-500 truncate max-w-[150px]" title={txn.description || ''}>{txn.description || ''}</td>
                        <td className="px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(role === 'ADMIN' || username === 'Skender') && onUpdate && (
                              <button 
                                onClick={() => startEdit(txn)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded p-1 transition-colors"
                                title={t('editTransaction') || 'Edit'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {username === 'Burim' && (
                              <button 
                                onClick={() => onDelete(txn.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                                title={t('deleteTransaction')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      {limit && filtered.length > limit && (
          <div className="p-2 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
              {t('showingRecentTransactions', { limit, total: filtered.length })}
          </div>
      )}
    </div>
  );
};

export default TransactionList;