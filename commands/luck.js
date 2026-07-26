module.exports = (bot, users) => {
    bot.onText(/\/luck/, (msg) => {
        const luck = Math.floor(Math.random() * 100) + 1;
        const message = luck > 70 ? "🌟 شانس عالی!" :
                       luck > 40 ? "👍 شانس معمولی" :
                       "😅 امروز شانس زیادی نداری!";
        
        bot.sendMessage(
            msg.chat.id,
            `🍀 شانس شما امروز: ${luck}%\n${message}`
        );
    });
};