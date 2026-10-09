import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini if key exists
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI chat / explanation endpoint
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { prompt, datasetSummary, history } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'NO_API_KEY',
          message: 'Gemini API key is not configured. Local rule-based analyzer is running.',
        });
      }

      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }

      const systemInstruction = `You are the lead AI Data Scientist and Data Quality Auditor for "AI Dataset Autopsy".
Your role is to explain computed statistics, diagnose dataset vulnerabilities, explain data science concepts in beginner-friendly yet technically precise language, and advise on best practices (feature engineering, ML leakage prevention, imputation, outlier handling, ethical considerations).

CRITICAL RULES:
1. ONLY reference and explain the verified metrics provided in the dataset summary below. NEVER invent, hallucinate, or alter numeric metrics (like row counts, missing percentages, correlation values, outlier counts).
2. If a specific metric or column was not computed or not provided in the summary, state clearly that it was not analyzed.
3. Distinguish confirmed data defects (e.g. missing values, exact duplicate rows, type corruption) from potential machine learning risks (e.g. high target correlation, class imbalance, time leakage).
4. Provide structured, actionable, and encouraging recommendations formatted in clear Markdown with bullet points.
5. Emphasize why data preparation decisions matter before training machine learning models.`;

      const contents: string[] = [];
      if (datasetSummary) {
        contents.push(`Verified Dataset Profile & Findings:\n${JSON.stringify(datasetSummary, null, 2)}`);
      }
      if (Array.isArray(history) && history.length > 0) {
        const recent = history.slice(-4).map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
        contents.push(`Recent Discussion:\n${recent}`);
      }
      contents.push(`User Question:\n${prompt}`);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents.join('\n\n'),
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({
        text: response.text || 'No response generated.',
      });
    } catch (err: any) {
      console.error('Gemini error:', err);
      res.status(500).json({
        error: 'API_ERROR',
        message: err?.message || 'Failed to generate response from Gemini API',
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Dataset Autopsy server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
