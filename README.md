<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ContextCraft

**ContextCraft** is a sophisticated, AI-powered cold outreach generator built with React and Vite. It heavily leverages **OpenRouter's free models** and advanced prompt engineering to gather live web context and craft hyper-personalized outreach strategies based on human psychology.

</div>

---

## ✨ Features

- **🧠 Deep Psychological Profiling**: Analyzes target mindset, core values, cognitive biases, and specific communication style.
- **🌐 Live Web Research**: Scrapes the web and custom URLs in real-time via proxy APIs—completely bypassing the need for paid search engine keys.
- **⚡ 100% Free LLM Pipeline**: Specifically built to utilize top-tier free open-source models (e.g. Llama 3.3, Mistral, Gemma, Qwen) via OpenRouter auto-routing.
- **🎯 Intelligent Drafting**: Automatically drafts personalized cold emails, LinkedIn DMs (under 300 chars), and multi-step follow-up sequences.
- **📊 Objective Scoring**: Evaluates its own outreach strategy and provides actionable insights based on persuasion principles.

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kunaalxoxo/contextcraft.git
   cd contextcraft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your free OpenRouter API key:
   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```
   *(You can generate a free key at [OpenRouter](https://openrouter.ai/keys))*

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🛠 Tech Stack

- **Frontend Builder**: [Vite](https://vitejs.dev/) & [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) Icons
- **Language Models**: [OpenRouter API](https://openrouter.ai/) 
- **Scraping**: Client-side parsing via standard DOMParser over HTTP CORS Proxies

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
