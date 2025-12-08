import React, { useMemo, useState } from 'react';
import { useOptionLists, OptionKey } from '../OptionContext';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';

const OPTION_LABELS: Record<OptionKey, { title: string; description: string }> = {
  accounts: { title: 'account', description: 'accountListDescription' },
  categories: { title: 'category', description: 'categoryListDescription' },
  subCategories: { title: 'subCategory', description: 'subCategoryListDescription' },
  names: { title: 'name', description: 'nameListDescription' }
};

interface OptionManagerProps {
  transactions: Transaction[];
}

const OptionManager: React.FC<OptionManagerProps> = ({ transactions }) => {
  const { options, baseOptions, addOption, removeOption } = useOptionLists();
  const { t } = useTranslation();
  const [inputs, setInputs] = useState<Record<OptionKey, string>>({
    accounts: '',
    categories: '',
    subCategories: '',
    names: ''
  });
  const [confirmRemove, setConfirmRemove] = useState<{ key: OptionKey; value: string } | null>(null);

  const handleAdd = (key: OptionKey) => {
    const value = inputs[key].trim();
    if (!value) return;
    addOption(key, value);
    setInputs(prev => ({ ...prev, [key]: '' }));
  };

  const sections = useMemo(() => (Object.keys(OPTION_LABELS) as OptionKey[]), []);

  const usedValues = useMemo(() => ({
    accounts: new Set(transactions.map(t => t.account)),
    categories: new Set(transactions.map(t => t.category)),
    subCategories: new Set(transactions.map(t => t.subCategory)),
    names: new Set(transactions.map(t => t.name)),
  }), [transactions]);

  const isDefaultValue = (key: OptionKey, value: string) => baseOptions[key].includes(value);
  const isValueInUse = (key: OptionKey, value: string) => usedValues[key].has(value);

  const handleRemove = (key: OptionKey, value: string) => {
    if (confirmRemove && confirmRemove.key === key && confirmRemove.value === value) {
      removeOption(key, value);
      setConfirmRemove(null);
    } else {
      setConfirmRemove({ key, value });
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{t('manageListsTitle')}</h3>
        <p className="text-sm text-gray-500">{t('manageListsDescription')}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((key) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{t(OPTION_LABELS[key].title)}</h4>
                <p className="text-xs text-gray-500">{t(OPTION_LABELS[key].description)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={inputs[key]}
                onChange={(e) => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={t('addNewValuePlaceholder')}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAdd(key)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-40"
                disabled={!inputs[key].trim()}
              >
                <Plus className="w-4 h-4" />
                {t('addButton')}
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto pr-1 space-y-2">
              {options[key].map(item => (
                <div key={item} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <div>
                    <span className="text-sm text-gray-800">{item}</span>
                    {isDefaultValue(key, item) && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{t('defaultValueBadge')}</span>
                    )}
                    {isValueInUse(key, item) && !isDefaultValue(key, item) && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{t('inUseValueBadge')}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(key, item)}
                    className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded ${isDefaultValue(key, item) || isValueInUse(key, item) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                    disabled={isDefaultValue(key, item) || isValueInUse(key, item)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmRemove && confirmRemove.key === key && confirmRemove.value === item ? t('confirmRemoveButton') : t('removeButton')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OptionManager;
