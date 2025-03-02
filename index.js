import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const manish="helololo"
const app = express();
const port = process.env.PORT || 3000;
const TELEGRAM_KEY = process.env.TELEGRAM_KEY;
const CHAT_KEY = process.env.CHAT_KEY;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_KEY}`;

// Function to fetch a random Wikipedia article
async function getWikiArticle() {
  try {
    const response = await axios.get('https://en.wikipedia.org/api/rest_v1/page/random/summary');
    const { title, extract, content_urls } = response.data;
    return { title, extract, url: content_urls.desktop.page };
  } catch (error) {
    console.error('Error fetching Wikipedia article:', error);
    return null;
  }
}

// Function to send message to Telegram
async function sendTelegramMessage(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Function to handle Telegram messages
async function handleTelegramUpdate(update) {
  if (!update.message || !update.message.text) return;

  const chatId = update.message.chat.id;
  const messageText = update.message.text;

  if (messageText.startsWith('/wiki')) {
    const article = await getWikiArticle();
    if (!article) {
      sendTelegramMessage(chatId, "❌ Failed to fetch a Wikipedia article.");
      return;
    }

    // Format the message properly
    const titleEdit = article.title.replace(/([\*\_\[\]\(\)])/g, '\\$1');
    const summaryEdit = article.extract.replace(/([\*\_\[\]\(\)])/g, '\\$1');
    const message = `**${titleEdit}**\n\n${summaryEdit}\n\n[Read more](${article.url})`;

    await sendTelegramMessage(chatId, message);
  }
}

// Telegram Webhook Route
app.use(express.json()); // Middleware to parse JSON body
app.post(`/webhook/${TELEGRAM_KEY}`, async (req, res) => {
  await handleTelegramUpdate(req.body);
  res.sendStatus(200); // Respond to Telegram to acknowledge receipt
});

// Set Webhook (One-time setup)
async function setTelegramWebhook() {
  const webhookUrl = `https://your-server-domain.com/webhook/${TELEGRAM_KEY}`;
  try {
    const response = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: webhookUrl,
    });
    console.log("Webhook set successfully:", response.data);
  } catch (error) {
    console.error("Error setting webhook:", error);
  }
}

// Home route
app.get('/', (req, res) => {
  res.send('Telegram Wiki Bot is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  setTelegramWebhook(); // Set webhook on server start
});
