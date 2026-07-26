module.exports = (bot, users) => {
    bot.onText(/\/coin/, (msg) => {
        const result = Math.random() < 0.5 ? "🦁 شیر" : "🪙 خط";
        bot.sendMessage(
            msg.chat.id,
            `🪙 نتیجه: ${result}`
        );
    });
};