const TelegramBot = require('node-telegram-bot-api').default;

const token = '8638869017:AAGMZ_zdtxzNVW_bchTpHiVZt4gEkh4BunI';

const bot = new TelegramBot(token, {
  polling: true
});

console.log('Bot is running...');

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'سلام! ربات با موفقیت اجرا شد 🚀');
});