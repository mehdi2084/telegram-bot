// بازی حدس عدد
const guessGames = {};

module.exports = (bot, users) => {
    bot.onText(/\/guess/, (msg) => {
        const chatId = msg.chat.id;
        const target = Math.floor(Math.random() * 100) + 1;
        guessGames[chatId] = {
            target,
            attempts: 0,
            maxAttempts: 10
        };
        
        bot.sendMessage(
            chatId,
            `🎯 بازی حدس عدد!\nیک عدد بین 1 تا 100 حدس بزنید.\nشما 10 شانس دارید.\n\nعدد خود را با /guess [عدد] ارسال کنید.`
        );
    });

    bot.onText(/\/guess (\d+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const game = guessGames[chatId];
        
        if (!game) {
            bot.sendMessage(chatId, "❌ بازی فعالی وجود ندارد. با /guess شروع کنید.");
            return;
        }
        
        const guess = parseInt(match[1]);
        game.attempts++;
        
        if (guess === game.target) {
            bot.sendMessage(
                chatId,
                `🎉 برنده شدید!\nعدد ${game.target} بود.\nتعداد تلاش: ${game.attempts}`
            );
            delete guessGames[chatId];
            return;
        }
        
        if (game.attempts >= game.maxAttempts) {
            bot.sendMessage(
                chatId,
                `❌ باختی!\nعدد مورد نظر ${game.target} بود.`
            );
            delete guessGames[chatId];
            return;
        }
        
        const hint = guess < game.target ? "بزرگ‌تر" : "کوچک‌تر";
        bot.sendMessage(
            chatId,
            `❌ عدد ${hint} است.\nتلاش‌های باقی‌مانده: ${game.maxAttempts - game.attempts}`
        );
    });
};