import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

// POST /api/search
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const response = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 7,
      include_raw_content: true
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Tavily Search Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/scrape
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    // Load HTML directly from data
    let htmlData = response.data;
    if (typeof htmlData !== 'string') {
        htmlData = String(htmlData);
    }
    const $ = cheerio.load(htmlData);
    
    // Remove noise
    $('script, style, noscript, iframe, img, svg, nav, footer, header').remove();

    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });
    
    const paragraphs: string[] = [];
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) paragraphs.push(text);
    });

    let fullText = $('body').text().replace(/\s+/g, ' ').trim();
    if (fullText.length > 8000) {
      fullText = fullText.substring(0, 8000) + '... (truncated)';
    }

    res.json({ title, description, headings, paragraphs, fullText });
  } catch (error: any) {
    console.error(`Scrape Error for ${req.body.url}:`, error.message);
    res.status(500).json({ error: 'Scraping failed or blocked' });
  }
});

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  try {
    const { messages, model } = req.body;
    
    const attemptGenerate = async (targetModel: string) => {
      return await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: targetModel,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.72,
        max_tokens: 6000
      }, {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "ContextCraft",
          "Content-Type": "application/json"
        }
      });
    };

    const modelsToTry = [
      model || "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "mistralai/mistral-small-3.1-24b-instruct:free",
      "openrouter/free" // Ultimate fail-safe
    ];

    let lastError: any;
    for (const targetModel of modelsToTry) {
      try {
        const resp = await attemptGenerate(targetModel);
        return res.json(resp.data);
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        // If rate limited, not found, or bad gateway, try the next model
        if (status === 429 || status === 404 || status === 502) {
          console.warn(`[OpenRouter] ${targetModel} failed with status ${status}. Falling back...`);
          continue;
        }
        // For hard errors (like 401 Unauthorized or 400 Bad Request), don't retry
        break;
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error('Generate Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Generation failed', details: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
