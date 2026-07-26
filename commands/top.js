module.exports = (bot, users) => {
    bot.onText(/\/top/, (msg) => {
        const userList = Object.entries(users)
            .map(([id, user]) => ({ id, ...user }))
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);

        if (userList.length === 0) {
            bot.sendMessage(msg.chat.id, "📊 هنوز کاربری ثبت نام نکرده است.");
            return;
        }

        let message = "🏆 رتبه‌بندی برترین‌ها:\n\n";
        const medals = ['🥇', '🥈', '🥉'];
        
        userList.forEach((user, index) => {
            const medal = index < 3 ? medals[index] : `${index + 1}.`;
            message += `${medal} ${user.name}\n⭐ ${user.xp} XP | 🪙 ${user.coins} Coins\n\n`;
        });

        bot.sendMessage(msg.chat.id, message);
    });
};