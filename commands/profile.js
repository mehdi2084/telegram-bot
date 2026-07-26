module.exports = (bot, users) => {
    bot.onText(/\/profile/, (msg) => {
        const userId = msg.from.id;
        const user = users[userId];
        
        if (!user) {
            bot.sendMessage(
                msg.chat.id,
                "❌ ابتدا با /start ثبت نام کنید."
            );
            return;
        }

        bot.sendMessage(
            msg.chat.id,
            `👤 ${user.name}\n\n⭐ XP : ${user.xp}\n🪙 Coins : ${user.coins}`
        );
    });

    // نمایش پروفایل دیگران
    bot.onText(/\/profile (@\w+)/, (msg, match) => {
        const username = match[1];
        // پیدا کردن کاربر با یوزرنیم (این بخش نیاز به پیاده‌سازی دارد)
        bot.sendMessage(
            msg.chat.id,
            `🔍 کاربر ${username} یافت نشد.`
        );
    });
};