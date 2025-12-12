import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { PlusCircle, Save } from 'lucide-react';
import { useAuth } from '../index';
import { useTranslation } from 'react-i18next';
import { useOptionLists } from '../OptionContext';

interface Props {
  onAdd: (t: Transaction) => void;
}

const TransactionForm: React.FC<Props> = ({ onAdd }) => {
  const { role } = useAuth();
  const { t } = useTranslation();
  const { options } = useOptionLists();
  const accounts = useMemo(() => options.accounts, [options.accounts]);
  const categories = useMemo(() => options.categories, [options.categories]);
  const subCategories = useMemo(() => options.subCategories, [options.subCategories]);
  const names = useMemo(() => options.names, [options.names]);

  if (role !== 'ADMIN') {
    return null; // Hide form for non-admin users
  }

  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    account: accounts[0],
    category: categories[0],
    subCategory: subCategories[0],
    notes: '',
    amount: 0,
    name: names[0],
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date!,
      account: formData.account!,
      category: formData.category as TransactionType,
      subCategory: formData.subCategory!,
      notes: formData.notes || '',
      amount: Number(formData.amount),
      name: formData.name!,
      description: formData.description || ''
    };

    onAdd(newTransaction);
    // Reset fields except date/name which might be repetitive
    setFormData(prev => ({
      ...prev,
      amount: 0,
      notes: '',
      description: ''
    }));
  };

  const handleChange = (field: keyof Transaction, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      // If category is set to 'Transfere', clear subCategory by default
      if (field === 'category' && value === 'Transfere') {
        next.subCategory = '';
      }

      return next;
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <PlusCircle className="w-5 h-5" />
        {t('newEntry')}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Date */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('date')}</label>
          <input 
            type="date" 
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        {/* Account */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('account')}</label>
          <select 
            className="border border-gray-300 rounded px-3 py-2 bg-white"
            value={formData.account}
            onChange={(e) => handleChange('account', e.target.value)}
          >
            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('category')}</label>
          <select 
            className="border border-gray-300 rounded px-3 py-2 bg-white"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Sub Category */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('subCategory')}</label>
          <select 
            className="border border-gray-300 rounded px-3 py-2 bg-white"
            value={formData.subCategory}
            onChange={(e) => handleChange('subCategory', e.target.value)}
          >
            {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

         {/* Name */}
         <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('name')}</label>
          <select 
            className="border border-gray-300 rounded px-3 py-2 bg-white"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          >
            {names.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Amount */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('amountEuro')}</label>
          <input 
            type="number" 
            step="0.01"
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('notes')}</label>
          <input 
            type="text" 
            className="border border-gray-300 rounded px-3 py-2"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={t('shortNotePlaceholder')}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('description')}</label>
          <input 
            type="text" 
            className="border border-gray-300 rounded px-3 py-2"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('detailedDescriptionPlaceholder')}
          />
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-2">
            <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
                <Save className="w-5 h-5" />
                {t('addRecord')}
            </button>
        </div>

      </form>
    </div>
  );
};

export default TransactionForm;