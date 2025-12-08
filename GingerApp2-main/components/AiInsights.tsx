import React, { useState } from 'react';
import { Transaction } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const AiInsights: React.FC<Props> = ({ transactions }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateInsight = async () => {
    if (transactions.length === 0) {
        setInsight("Please add some transaction data first.");
        return;
    }

    setLoading(true);
    setError('');
    try {
        // Get API key from environment variable (Vite uses VITE_ prefix)
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            setInsight("Error: API Key not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.");
            setLoading(false);
            return;
        }

        // Summarize data to save tokens (limit to last 50 transactions)
        const recentTransactions = transactions.slice(-50);
        const summary = recentTransactions.map(t => 
            `${t.date}: ${t.category} of €${t.amount} for ${t.subCategory} by ${t.name}`
        ).join('\n');

        const prompt = `Analyze this financial data and provide:
1. Three key insights about spending habits
2. One warning about any concerning trend
3. One practical suggestion for saving money

Keep it concise and professional. Format with clear sections.

Financial Data:
${summary}`;

        // Try a CORS proxy approach or direct request with error details
        try {
          // First attempt with v1beta API
          console.log('Attempting v1beta API...');
          const responseV1Beta = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: prompt
                  }]
                }],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 1024,
                }
              })
            }
          );
          
          if (responseV1Beta.ok) {
            console.log('v1beta API worked!');
            const data = await responseV1Beta.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
              setInsight(generatedText);
              return;
            }
          } else {
            const errorText = await responseV1Beta.text();
            console.error('v1beta API failed:', responseV1Beta.status, errorText);
          }
        } catch (fetchError: any) {
          console.error('Fetch error with v1beta:', fetchError.message);
        }

        // If first attempt fails, try v1 API
        try {
          console.log('Attempting v1 API...');
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: prompt
                  }]
                }],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 1024,
                }
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('v1 API failed:', response.status, errorText);
            
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            } catch {
              throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
            }
          }

          const data = await response.json();
          console.log('API Response:', data);
          
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (generatedText) {
            setInsight(generatedText);
          } else {
            throw new Error('No content generated from API. Response: ' + JSON.stringify(data).substring(0, 200));
          }
        } catch (e: any) {
          console.error('AI Insights Error:', e);
          setError(e.message || 'Unknown error');
          setInsight(`Failed to generate AI insights: ${e.message || 'Please check your API key and try again.'}`);
        } finally {
          setLoading(false);
        }
    } catch (e: any) {
        console.error('AI Insights Error:', e);
        setError(e.message || 'Unknown error');
        setInsight(`Failed to generate AI insights: ${e.message || 'Please check your API key and try again.'}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg shadow-md border border-indigo-100 mt-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="text-yellow-500" />
                AI Financial Assistant
            </h3>
            <button 
                onClick={generateInsight}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Analyze Data"}
            </button>
        </div>
        
        <div className="bg-white p-4 rounded border border-indigo-100 min-h-[100px] text-gray-700 whitespace-pre-wrap leading-relaxed">
            {insight ? insight : "Click 'Analyze Data' to get AI-powered insights about your financial health based on your records."}
        </div>
    </div>
  );
};

export default AiInsights;