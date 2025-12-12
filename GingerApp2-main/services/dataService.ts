import { Transaction, TransactionInput } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

type ApiTransaction = {
  id: string;
  txnDate: string;
  amount: number;
  notes: string | null;
  description: string | null;
  account: { name: string };
  subcategory: { name: string; category: { name: string } };
  user: { fullName: string };
};

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }
  return res.json();
};

const mapApiTransaction = (api: ApiTransaction): Transaction => ({
  id: api.id,
  date: api.txnDate?.split('T')[0] ?? '',
  account: api.account?.name ?? '',
  category: (api.subcategory?.category?.name ?? 'Shpenzime') as Transaction['category'],
  subCategory: api.subcategory?.name ?? '',
  notes: api.notes ?? '',
  amount: Number(api.amount) || 0,
  name: api.user?.fullName ?? '',
  description: api.description ?? '',
});

export interface CreateTransactionPayload extends TransactionInput {
  projectId?: string;
  projectName?: string;
  taskId?: string;
}

export const fetchTransactions = async (projectId?: string): Promise<Transaction[]> => {
  const url = new URL(`${API_BASE}/transactions`, window.location.origin);
  if (projectId) {
    url.searchParams.set('projectId', projectId);
  }
  const res = await fetch(url.toString());
  const data = await handleResponse<ApiTransaction[]>(res);
  return data.map(mapApiTransaction);
};

export const createTransaction = async (
  payload: CreateTransactionPayload,
): Promise<Transaction> => {
  // Get current username from localStorage for audit logging
  const username = localStorage.getItem('username') || 'Unknown';
  
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, username }),
  });
  const data = await handleResponse<ApiTransaction>(res);
  return mapApiTransaction(data);
};

export const removeTransaction = async (id: string): Promise<void> => {
  // Get current username from localStorage for audit logging
  const username = localStorage.getItem('username') || 'Unknown';
  
  const res = await fetch(`${API_BASE}/transactions/${id}`, { 
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Failed to delete transaction');
  }
};

export const updateTransaction = async (
  id: string,
  payload: Partial<TransactionInput>,
): Promise<Transaction> => {
  // Get current username from localStorage for audit logging
  const username = localStorage.getItem('username') || 'Unknown';
  
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, username }),
  });
  const data = await handleResponse<ApiTransaction>(res);
  return mapApiTransaction(data);
};