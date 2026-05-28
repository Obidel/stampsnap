const https = require('https');
const http = require('http');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OR_API_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const STAMP_PROMPT = 'You are a stamp expert. Identify this postage stamp from the image. Be precise — value range must be narrow (±10% max). Respond with ONLY valid JSON (no markdown, no backticks): {"name":"","country":"","year":"","estimated_value_low":0,"estimated_value_high":0,"rarity_score":0,"condition":"","catalog_number":"","color":"","denomination":"","description":"","confidence":0.0}';

function parseJsonResponse(text) {
  try {
    const cleaned = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const stamp = JSON.parse(cleaned);
    return stamp.name && stamp.name !== 'Unknown' ? stamp : null;
  } catch { return null; }
}

async function identifyWithOpenRouter(imageBuffer) {
  if (!OR_API_KEY || OR_API_KEY === 'your_openrouter_key_here' || !imageBuffer) return null;
  return new Promise((resolve) => {
    const base64Image = imageBuffer.toString('base64');
    const body = JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: STAMP_PROMPT },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }],
      max_tokens: 1024,
      temperature: 0.2
    });
    const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OR_API_KEY}`,
        'HTTP-Referer': 'https://stampsnap.app',
        'X-Title': 'StampSnap'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          if (p.error) { resolve(null); return; }
          const text = p?.choices?.[0]?.message?.content;
          if (!text) { resolve(null); return; }
          const stamp = parseJsonResponse(text);
          resolve(stamp ? { provider: 'openrouter', stamp } : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function identifyWithGemini(imageBuffer) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here' || !imageBuffer) return null;
  return new Promise((resolve) => {
    const base64Image = imageBuffer.toString('base64');
    const body = JSON.stringify({
      contents: [{
        parts: [
          { text: STAMP_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
        ]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    });
    const req = https.request(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const p = JSON.parse(d);
            if (p.error) { resolve(null); return; }
            const text = p?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) { resolve(null); return; }
            const stamp = parseJsonResponse(text);
            resolve(stamp ? { provider: 'gemini', stamp } : null);
          } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function identifyWithOllama(imageBuffer) {
  if (!imageBuffer) return null;
  return new Promise((resolve) => {
    const base64Image = imageBuffer.toString('base64');
    const body = JSON.stringify({
      model: 'llava',
      prompt: STAMP_PROMPT,
      images: [base64Image],
      format: 'json',
      stream: false
    });
    const req = http.request(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          const text = p?.response;
          if (!text) { resolve(null); return; }
          const stamp = parseJsonResponse(text);
          resolve(stamp ? { provider: 'ollama', stamp } : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function identifyWithHuggingFace(imageBuffer) {
  if (!HF_API_KEY || HF_API_KEY === 'your_hf_api_key_here' || !imageBuffer) return null;
  return new Promise((resolve) => {
    const base64Image = imageBuffer.toString('base64');
    const body = JSON.stringify({
      model: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: STAMP_PROMPT },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }],
      max_tokens: 1024,
      temperature: 0.2
    });
    const req = https.request('https://router.huggingface.co/hf-inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_KEY}`
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          if (p.error) { resolve(null); return; }
          const text = p?.choices?.[0]?.message?.content;
          if (!text) { resolve(null); return; }
          const stamp = parseJsonResponse(text);
          resolve(stamp ? { provider: 'huggingface', stamp } : null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

module.exports = { identifyWithOpenRouter, identifyWithGemini, identifyWithOllama, identifyWithHuggingFace };
