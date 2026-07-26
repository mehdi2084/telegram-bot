module.exports = (bot, users) => {
    bot.onText(/\/dice/, (msg) => {
        const n = Math.floor(Math.random() * 6) + 1;
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        bot.sendMessage(
            msg.chat.id,
            `🎲 ${diceEmojis[n-1]} ${n}`
        );
    });
};