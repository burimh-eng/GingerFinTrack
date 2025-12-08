# Transaction Import Guide

## Overview
The Import Data feature allows administrators to bulk import transactions from CSV or Excel files into the database.

## File Format Requirements

### Required Columns
Your CSV file must include the following columns (in any order):

| Column Name | Description | Example |
|------------|-------------|---------|
| `date` | Transaction date in YYYY-MM-DD format | 2024-01-15 |
| `name` | Person name (Burimi or Skenderi) | Burimi |
| `account` | Account name | Banka |
| `category` | Category name | Te Hyra |
| `subCategory` | Subcategory name | Qira |
| `amount` | Transaction amount (number) | 1500 |
| `notes` | Optional notes | Monthly rent |
| `description` | Optional description | Apartment rent payment |

### Sample CSV Format

```csv
date,name,account,category,subCategory,amount,notes,description
2024-01-15,Burimi,Banka,Te Hyra,Qira,1500,Monthly rent,Apartment rent payment
2024-01-16,Skenderi,Banka,Shpenzime,Ushqim,250,Groceries,Weekly shopping
2024-01-17,Burimi,Banka,Transfere,Transferim,500,Transfer to Skender,Monthly allowance
```

## How to Import

1. **Login as Admin** - Only users with ADMIN role (Burim) can access the import feature
2. **Navigate to Import Data** - Click on "Import Data" in the sidebar menu
3. **Download Template** - Click "Download Template" to get a sample CSV file
4. **Prepare Your Data** - Fill in your transaction data following the template format
5. **Upload File** - Click the upload area or drag and drop your CSV file
6. **Import** - Click "Import Transactions" button
7. **Review Results** - Check the success/failure count and any error messages

## Important Notes

- **Date Format**: Must be YYYY-MM-DD (e.g., 2024-01-15)
- **Amount**: Must be a valid number (e.g., 1500 or 1500.50)
- **Name**: Should match existing users (Burimi or Skenderi)
- **Categories**: Should match existing categories in the system
- **Duplicates**: The system will create new transactions for all rows (no duplicate checking)
- **Errors**: If a row fails to import, the error will be shown in the results

## Common Categories

### Income (Te Hyra)
- Qira (Rent)
- Paga (Salary)

### Expenses (Shpenzime)
- Ushqim (Food)
- Transport
- Utilities
- Healthcare

### Transfers (Transfere)
- Transferim (Transfer)

## Troubleshooting

### "Missing required fields" error
- Ensure all required columns are present in your CSV
- Check that column names match exactly (case-sensitive)

### "Invalid date format" error
- Use YYYY-MM-DD format (e.g., 2024-01-15)
- Don't use slashes or other date formats

### "Failed to import" error
- Check that categories and subcategories exist in the system
- Verify amount is a valid number
- Ensure name matches existing users

## Excel Files

While the system accepts .xlsx and .xls files, it's recommended to:
1. Create your data in Excel
2. Save as CSV format before importing
3. This ensures better compatibility and fewer formatting issues
