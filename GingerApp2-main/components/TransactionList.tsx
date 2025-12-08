import React, { useState } from 'react';
import { Transaction } from '../types';
import { Trash2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  limit?: number;
  showSearch?: boolean;
}

const TransactionList: React.FC<Props> = ({ transactions, onDelete, limit, showSearch = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  // Filter transactions based on search term
  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.amount.toString().includes(searchTerm)
  );

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
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-1.5 font-medium text-gray-900 whitespace-nowrap">{txn.date}</td>
                    <td className="px-3 py-1.5 text-gray-700">{txn.account}</td>
                    <td className="px-3 py-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-20 text-center ${
                            txn.category === 'Te Hyra' ? 'bg-green-100 text-green-800' :
                            txn.category === 'Shpenzime' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {txn.category}
                        </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-700">{txn.subCategory}</td>
                    <td className="px-3 py-1.5 text-gray-500 truncate max-w-[150px]" title={txn.notes}>{txn.notes}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-gray-900">{txn.amount.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-gray-700">{txn.name}</td>
                    <td className="px-3 py-1.5 text-gray-500 truncate max-w-[150px]" title={txn.description}>{txn.description}</td>
                    <td className="px-3 py-1.5 text-center">
                    <button 
                        onClick={() => onDelete(txn.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                        title={t('deleteTransaction')}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    </td>
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