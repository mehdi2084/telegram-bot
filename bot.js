const TelegramBot = require('node-telegram-bot-api').default;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: true
});

console.log('Bot is running...');

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'سلام! ربات با موفقیت اجرا شد 🚀');
});