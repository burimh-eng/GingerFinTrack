import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../index';
import { useTranslation } from 'react-i18next';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const ImportData: React.FC = () => {
  const { role } = useAuth();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

  // Only admins can import data
  if (role !== 'ADMIN') {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError(t('selectCsvExcelError'));
        setFile(null);
      }
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line || line === ',,,,,,,') continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      // Skip rows that are all empty
      const hasData = values.some(v => v !== '');
      if (!hasData) continue;
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('selectFileFirstError'));
      return;
    }

    setIsUploading(true);
    setError('');
    setResult(null);

    try {
      // Use FileReader for better browser compatibility
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const rows = parseCSV(text);
      console.log('Parsed CSV rows:', rows.length);

      if (rows.length === 0) {
        throw new Error(t('noDataFoundError'));
      }

      // Validate and transform data
      const transactions = rows.map((row, index) => {
        // Expected columns: date, name, account, category, subCategory, amount, notes, description
        const missingFields: string[] = [];
        if (!row.date) missingFields.push('date');
        if (!row.name) missingFields.push('name');
        if (!row.account) missingFields.push('account');
        if (!row.category) missingFields.push('category');
        // subCategory is now optional - will use category as fallback
        if (!row.amount) missingFields.push('amount');
        
        if (missingFields.length > 0) {
          throw new Error(t('missingFieldsError', { row: index + 2, fields: missingFields.join(', ') }));
        }

        return {
          date: row.date,
          name: row.name,
          account: row.account,
          category: row.category,
          subCategory: row.subCategory || row.category, // Use category as fallback if subCategory is empty
          amount: parseFloat(row.amount),
          notes: row.note || row.notes || '', // Support both 'note' (shënime) and 'notes' column names
          description: row.description || '',
          projectName: 'Ginger HQ' // Default project
        };
      });

      // Send to backend
      // Get current username for audit logging
      const username = localStorage.getItem('username') || 'Unknown';
      
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions, importedBy: username }),
      });

      if (!response.ok) {
        let errorMessage = t('failedToImportError');
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const resultData = await response.json();
      setResult(resultData);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToImportError'));
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `date,name,account,category,subCategory,amount,notes,description
2024-01-15,Burimi,Banka,Te Hyra,Qira,1500,Monthly rent,Apartment rent payment
2024-01-16,Skenderi,Banka,Shpenzime,Ushqim,250,Groceries,Weekly shopping
2024-01-17,Burimi,Banka,Transfere,Transferim,500,Transfer to Skender,Monthly allowance`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">{t('importTransactions')}</h2>
        </div>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          {t('downloadTemplate')}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">{t('importInstructionsTitle')}</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>{t('csvHeadersInstruction')}</li>
          <li><strong>{t('requiredFieldsInstruction')}</strong></li>
          <li><strong>{t('optionalFieldsInstruction')}</strong></li>
          <li>{t('dateFormatInstruction')}</li>
          <li>{t('amountNumberInstruction')}</li>
          <li>{t('nameShouldBeInstruction')}</li>
          <li>{t('downloadTemplateInstruction')}</li>
        </ul>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-indigo-400 transition-colors">
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            {file ? file.name : t('clickSelectFile')}
          </p>
          <p className="text-sm text-gray-500">{t('dragAndDrop')}</p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className={`${result.failed > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-6`}>
          <div className="flex items-start mb-2">
            <CheckCircle className={`w-5 h-5 ${result.failed > 0 ? 'text-orange-600' : 'text-green-600'} mr-2 flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className={`${result.failed > 0 ? 'text-orange-800' : 'text-green-800'} font-semibold`}>{t('importComplete')}</p>
              <p className="text-green-700 text-sm mt-1">
                {t('importSuccessSummary', { count: result.success })}
              </p>
              {result.failed > 0 && (
                <p className="text-red-700 text-sm font-medium">
                  {t('importFailedSummary', { count: result.failed })}
                </p>
              )}
            </div>
          </div>
          
          {/* Detailed Error List */}
          {result.errors.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border border-red-200 overflow-hidden">
              <div className="bg-red-100 px-4 py-2 border-b border-red-200">
                <p className="text-sm font-semibold text-red-800">{t('importErrorsLabel')} ({result.errors.length})</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-red-100">
                    {result.errors.map((err, idx) => {
                      const rowMatch = err.match(/^Row (\d+): (.+)$/);
                      const rowNum = rowMatch ? rowMatch[1] : '-';
                      const errorMsg = rowMatch ? rowMatch[2] : err;
                      return (
                        <tr key={idx} className="hover:bg-red-50">
                          <td className="px-3 py-2 font-medium text-red-700 whitespace-nowrap w-16">Row {rowNum}</td>
                          <td className="px-3 py-2 text-red-600">{errorMsg}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {t('importingLabel')}
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            {t('importTransactionsButton')}
          </>
        )}
      </button>
    </div>
  );
};

export default ImportData;
