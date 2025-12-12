import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { transactionSchema } from '../validators/transaction.schema.js';
import { authenticateToken, requireAdmin } from '../routes/auth.js';
import { createAuditLog } from '../utils/auditLogger.js';

const router = Router();

const transactionInclude = {
  project: true,
  task: true,
  account: true,
  subcategory: { include: { category: true } },
  user: true,
} as const;

const DEFAULT_PROJECT_NAME = process.env.DEFAULT_PROJECT_NAME ?? 'Ginger HQ';

const userEmailFromName = (name: string) => {
  const slug = name.trim().toLowerCase().replace(/\s+/g, '.');
  return `${slug || 'user'}@fintrack.local`;
};

const ensureUser = async (userId: string | undefined, name: string) => {
  if (userId) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) {
      return existing;
    }
  }
  return prisma.user.upsert({
    where: { email: userEmailFromName(name) },
    update: { fullName: name },
    create: { 
      email: userEmailFromName(name), 
      fullName: name,
      username: name.trim().toLowerCase().replace(/\s+/g, '.'),
      password: '$2b$10$placeholder', // Placeholder - these users can't login
    },
  });
};

const ensureProject = async (
  projectId: string | undefined,
  projectName: string | undefined,
  userId: string,
) => {
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) {
      return project;
    }
  }

  const name = projectName ?? DEFAULT_PROJECT_NAME;
  return prisma.project.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: {
      userId,
      name,
      description: `${name} project`,
    },
  });
};

const ensureAccount = (name: string) =>
  prisma.account.upsert({
    where: { name },
    update: {},
    create: { name },
  });

const ensureSubcategory = async (categoryName: string, subCategoryName: string) => {
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });

  return prisma.subcategory.upsert({
    where: { categoryId_name: { categoryId: category.id, name: subCategoryName } },
    update: {},
    create: { name: subCategoryName, categoryId: category.id },
  });
};

const mapPayloadToData = async (payload: ReturnType<typeof transactionSchema.parse>) => {
  const user = await ensureUser(payload.userId, payload.name);
  const project = await ensureProject(payload.projectId, payload.projectName, user.id);
  const account = await ensureAccount(payload.account);
  const subcategory = await ensureSubcategory(payload.category, payload.subCategory);

  return {
    projectId: project.id,
    taskId: payload.taskId ?? null,
    userId: user.id,
    accountId: account.id,
    subcategoryId: subcategory.id,
    txnDate: new Date(payload.date),
    notes: payload.notes,
    amount: payload.amount,
    counterparty: payload.name,
    description: payload.description,
  };
};

// GET route doesn't need authentication - anyone can view
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('GET /api/transactions - Fetching transactions...');
    const { projectId } = req.query;
    const transactions = await prisma.transaction.findMany({
      where: projectId ? { projectId: String(projectId) } : undefined,
      include: transactionInclude,
      orderBy: { txnDate: 'desc' },
    });
    console.log(`Found ${transactions.length} transactions`);

    // Filter out incoming transfers for display purposes
    const filteredTransactions = transactions.filter(txn => {
      if (txn.subcategory.category.name === 'Transfere' && Number(txn.amount) < 0) {
        return false; // Exclude incoming transfers (negative amounts)
      }
      return true;
    });
    console.log(`Returning ${filteredTransactions.length} transactions after filtering`);

    res.json(filteredTransactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    next(err);
  }
});

// POST route - admin check removed for client-side auth simplicity
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = transactionSchema.parse(req.body);
    const data = await mapPayloadToData(payload);
    
    // Add createdBy field
    const username = req.body.username || payload.name;
    const dataWithAudit = {
      ...data,
      createdBy: username,
    };
    
    const created = await prisma.transaction.create({
      data: dataWithAudit,
      include: transactionInclude,
    });

    // Log the CREATE action
    await createAuditLog({
      username,
      action: 'CREATE',
      entityType: 'TRANSACTION',
      entityId: created.id,
      details: {
        amount: payload.amount,
        category: payload.category,
        subCategory: payload.subCategory,
        date: payload.date,
      },
      req,
    });

    // Handle transfer logic
    if (payload.category === 'Transfere') {
      const otherPartyName = payload.name === 'Burimi' ? 'Skenderi' : 'Burimi';
      const otherPartyData = await mapPayloadToData({ ...payload, name: otherPartyName, amount: -payload.amount });
      await prisma.transaction.create({
        data: {
          ...otherPartyData,
          createdBy: username,
        },
        include: transactionInclude,
      });
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = transactionSchema.parse(req.body);
    
    // Get the original transaction BEFORE updating to track changes
    const original = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: transactionInclude,
    });

    if (!original) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const data = await mapPayloadToData(payload);
    
    // Add modifiedBy field
    const username = req.body.username || payload.name;
    const dataWithAudit = {
      ...data,
      modifiedBy: username,
    };
    
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: dataWithAudit,
      include: transactionInclude,
    });

    // Build detailed change log - track what changed from what to what
    const changes: { field: string; from: any; to: any }[] = [];
    
    // Compare date
    const originalDate = original.txnDate.toISOString().split('T')[0];
    if (originalDate !== payload.date) {
      changes.push({ field: 'date', from: originalDate, to: payload.date });
    }
    
    // Compare account
    if (original.account.name !== payload.account) {
      changes.push({ field: 'account', from: original.account.name, to: payload.account });
    }
    
    // Compare category
    if (original.subcategory.category.name !== payload.category) {
      changes.push({ field: 'category', from: original.subcategory.category.name, to: payload.category });
    }
    
    // Compare subCategory
    if (original.subcategory.name !== payload.subCategory) {
      changes.push({ field: 'subCategory', from: original.subcategory.name, to: payload.subCategory });
    }
    
    // Compare amount
    const originalAmount = Number(original.amount);
    if (originalAmount !== payload.amount) {
      changes.push({ field: 'amount', from: originalAmount, to: payload.amount });
    }
    
    // Compare name (user)
    if (original.user.fullName !== payload.name) {
      changes.push({ field: 'name', from: original.user.fullName, to: payload.name });
    }
    
    // Compare notes
    if ((original.notes || '') !== (payload.notes || '')) {
      changes.push({ field: 'notes', from: original.notes || '', to: payload.notes || '' });
    }
    
    // Compare description
    if ((original.description || '') !== (payload.description || '')) {
      changes.push({ field: 'description', from: original.description || '', to: payload.description || '' });
    }

    // Log the UPDATE action with detailed changes
    await createAuditLog({
      username,
      action: 'UPDATE',
      entityType: 'TRANSACTION',
      entityId: updated.id,
      details: {
        changes,
        changesCount: changes.length,
        originalValues: {
          date: originalDate,
          account: original.account.name,
          category: original.subcategory.category.name,
          subCategory: original.subcategory.name,
          amount: originalAmount,
          name: original.user.fullName,
          notes: original.notes || '',
          description: original.description || '',
        },
        newValues: {
          date: payload.date,
          account: payload.account,
          category: payload.category,
          subCategory: payload.subCategory,
          amount: payload.amount,
          name: payload.name,
          notes: payload.notes || '',
          description: payload.description || '',
        },
      },
      req,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get transaction details before deleting
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { user: true, subcategory: { include: { category: true } } },
    });

    await prisma.transaction.delete({ where: { id: req.params.id } });

    // Log the DELETE action
    if (transaction) {
      const username = req.body.username || transaction.user.fullName;
      await createAuditLog({
        username,
        action: 'DELETE',
        entityType: 'TRANSACTION',
        entityId: req.params.id,
        details: {
          amount: transaction.amount.toString(),
          category: transaction.subcategory.category.name,
          subCategory: transaction.subcategory.name,
          date: transaction.txnDate.toISOString(),
        },
        req,
      });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Bulk import endpoint
router.post('/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('POST /api/transactions/import - Starting bulk import...');
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Invalid data: transactions array is required' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < transactions.length; i++) {
      try {
        const txn = transactions[i];
        const rowNum = i + 2; // +2 because row 1 is header, and we're 0-indexed
        
        // Detailed validation with specific error messages
        const validationErrors: string[] = [];
        let normalizedDate: string | null = null;
        
        if (!txn.date) {
          validationErrors.push('date is missing');
        } else {
          // Validate date format: support YYYY-MM-DD and DD/MM/YYYY
          const isoPattern = /^\d{4}-\d{2}-\d{2}$/;      // 2025-04-16
          const euPattern = /^\d{2}\/\d{2}\/\d{4}$/;   // 16/04/2025

          if (isoPattern.test(txn.date)) {
            normalizedDate = txn.date;
          } else if (euPattern.test(txn.date)) {
            const [day, month, year] = txn.date.split('/');
            normalizedDate = `${year}-${month}-${day}`; // convert to ISO
          } else {
            validationErrors.push(`date "${txn.date}" is invalid (use YYYY-MM-DD or DD/MM/YYYY)`);
          }

          if (normalizedDate) {
            const parsedDate = new Date(normalizedDate);
            if (isNaN(parsedDate.getTime())) {
              validationErrors.push(`date "${txn.date}" could not be parsed`);
            }
          }
        }
        
        if (!txn.name) {
          validationErrors.push('name is missing');
        } else if (!['Burimi', 'Skenderi'].includes(txn.name)) {
          validationErrors.push(`name "${txn.name}" is invalid (must be "Burimi" or "Skenderi")`);
        }
        
        if (!txn.account) {
          validationErrors.push('account is missing');
        }
        
        if (!txn.category) {
          validationErrors.push('category is missing');
        } else if (!['Te Hyra', 'Shpenzime', 'Transfere'].includes(txn.category)) {
          validationErrors.push(`category "${txn.category}" is invalid (must be "Te Hyra", "Shpenzime", or "Transfere")`);
        }
        
        if (txn.amount === undefined || txn.amount === null || txn.amount === '') {
          validationErrors.push('amount is missing');
        } else {
          const parsedAmount = parseFloat(txn.amount);
          if (isNaN(parsedAmount)) {
            validationErrors.push(`amount "${txn.amount}" is not a valid number`);
          }
        }
        
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join('; '));
        }

        // Map the data using existing helper functions
        const payload = {
          // Use normalized ISO date so downstream mapping always receives a valid format
          date: normalizedDate || txn.date,
          name: txn.name,
          account: txn.account,
          category: txn.category,
          // subCategory is allowed to be empty; normalize missing to empty string
          subCategory: txn.subCategory || '',
          amount: parseFloat(txn.amount),
          notes: txn.notes || '',
          description: txn.description || '',
          projectName: txn.projectName || DEFAULT_PROJECT_NAME
        };

        const data = await mapPayloadToData(payload);
        const username = req.body.importedBy || 'System';
        await prisma.transaction.create({ 
          data: {
            ...data,
            createdBy: username,
          }, 
          include: transactionInclude 
        });
        
        results.success++;
      } catch (err) {
        results.failed++;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Row ${i + 2}: ${errorMsg}`);
        console.error(`Failed to import transaction row ${i + 2}:`, errorMsg);
      }
    }

    console.log(`Import complete: ${results.success} success, ${results.failed} failed`);
    
    // Log the IMPORT action
    const username = req.body.importedBy || 'System';
    await createAuditLog({
      username,
      action: 'IMPORT',
      entityType: 'TRANSACTION',
      details: {
        totalRecords: transactions.length,
        successful: results.success,
        failed: results.failed,
      },
      req,
    });
    
    res.json(results);
  } catch (err) {
    console.error('Error in bulk import:', err);
    next(err);
  }
});

export default router;
