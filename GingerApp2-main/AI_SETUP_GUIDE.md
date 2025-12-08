# 🤖 AI Financial Assistant Setup Guide

## ✅ Google Gemini API (100% FREE)

### Step 1: Get Your Free API Key

1. Visit: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Select **"Create API key in new project"** (or use existing project)
5. Copy your API key (starts with `AIzaSy...`)

### Step 2: Configure Your App

1. Open the `.env` file in the root of your project
2. Replace `YOUR_API_KEY_HERE` with your actual API key:

```
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Save the file

### Step 3: Restart Your Development Server

**IMPORTANT:** You must restart the dev server for environment variables to load!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test the AI Assistant

1. Go to your app in the browser
2. Navigate to the **AI Insights** section
3. Click **"Analyze Data"**
4. You should see AI-powered financial insights!

---

## 📊 What the AI Does

The AI Financial Assistant analyzes your transaction data and provides:

- ✅ **3 Key Insights** about your spending habits
- ⚠️ **Warnings** about alarming trends
- 💡 **1 Money-Saving Suggestion**

---

## 🆓 Free Tier Limits

**Google Gemini Free Tier:**
- ✅ **60 requests per minute**
- ✅ **1,500 requests per day**
- ✅ **1 million tokens per month**
- ✅ **Completely FREE** for moderate use

This is more than enough for personal finance tracking!

---

## 🔒 Security Best Practices

1. **Never commit `.env` to Git** (it's already in `.gitignore`)
2. **Don't share your API key** publicly
3. **Regenerate your key** if it's ever exposed
4. For production deployment, use environment variables on your hosting platform

---

## 🐛 Troubleshooting

### Error: "API Key not configured"
- Make sure you added the key to `.env` file
- Restart your dev server (`npm run dev`)
- Check that the key starts with `AIzaSy`

### Error: "Failed to generate insights"
- Check your internet connection
- Verify your API key is valid at https://aistudio.google.com/app/apikey
- Check browser console (F12) for detailed error messages

### No response from AI
- Make sure you have transaction data in your app
- Try clicking "Analyze Data" again
- Check if you've exceeded free tier limits (unlikely)

---

## 🎉 You're All Set!

Your AI Financial Assistant is now configured and ready to provide intelligent insights about your spending patterns!

**Need help?** Check the browser console (F12) for error messages.
