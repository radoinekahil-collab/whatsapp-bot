const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;
let lastQR = '';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
  lastQR = qr;
  console.log('QR READY - افتح /qr');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('BOT READY ✅'));

client.on('message', async (msg) => {
  try {
    if (msg.from === 'status@broadcast') return;
    if (!msg.body) return;
    const text = msg.body.trim();
    if (text.toLowerCase() === 'ping') return msg.reply('pong ✅');
    const chat = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'انت مساعد واتساب مغربي، جاوب بالدارجة المغربية، مختصر و واضح.' },
        { role: 'user', content: text }
      ],
      max_tokens: 500
    });
    msg.reply(chat.choices[0].message.content);
  } catch(e) {
    console.log(e);
    msg.reply('وقع مشكل، عاود جرب');
  }
});

app.get('/', (req,res)=> res.send('Bot شغال ✅'));
app.get('/qr', (req,res)=> {
  if(!lastQR) return res.send('مازال ما وجد QR، تسنى شوية و عاود');
  res.send(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(lastQR)}" /><p>سكانيني فواتساب</p>`);
});

app.listen(PORT, ()=> console.log('Server on '+PORT));
client.initialize();
