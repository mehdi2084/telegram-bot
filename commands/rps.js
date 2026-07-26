// سنگ کاغذ قیچی
const rpsGames = {};
const choices = ['🪨', '📄', '✂️'];
const emojiMap = {
    '🪨': 'سنگ',
    '📄': 'کاغذ',
    '✂️': 'قیچی'
};

module.exports = (bot, users) => {
    bot.onText(/\/rps/, (msg) => {
        const chatId = msg.chat.id;
        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['🪨', '📄', '✂️'],
                    ['❌ لغو']
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };
        
        rpsGames[chatId] = { active: true };
        bot.sendMessage(
            chatId,
            `🎮 سنگ، کاغذ، قیچی!\n\nیک گزینه انتخاب کنید:`,
            keyboard
        );
    });

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const game = rpsGames[chatId];
        
        if (!game || !game.active) return;
        
        const text = msg.text;
        if (text === '❌ لغو') {
            delete rpsGames[chatId];
            bot.sendMessage(chatId, '❌ بازی لغو شد.', { reply_markup: { remove_keyboard: true } });
            return;
        }
        
        if (!['🪨', '📄', '✂️'].includes(text)) return;
        
        const playerChoice = text;
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        
        let result;
        if (playerChoice === botChoice) {
            result = '🤝 مساوی!';
        } else if (
            (playerChoice === '🪨' && botChoice === '✂️') ||
            (playerChoice === '📄' && botChoice === '🪨') ||
            (playerChoice === '✂️' && botChoice === '📄')
        ) {
            result = '🎉 شما برنده شدید!';
        } else {
            result = '😢 بات برنده شد!';
        }
        
        bot.sendMessage(
            chatId,
            `شما: ${emojiMap[playerChoice]}\nبات: ${emojiMap[botChoice]}\n\n${result}`,
            { reply_markup: { remove_keyboard: true } }
        );
        
        delete rpsGames[chatId];
    });
};