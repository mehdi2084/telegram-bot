module.exports = (bot, users, registerUser) => {
    bot.onText(/\/start/, (msg) => {
        registerUser(msg.from.id, msg.from.first_name);
        
        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['🎮 بازی‌ها', '😂 سرگرمی'],
                    ['👤 پروفایل', '📊 رتبه‌بندی']
                ],
                resize_keyboard: true
            }
        };

        bot.sendMessage(
            msg.chat.id,
            `سلام ${msg.from.first_name} 👋\n\nبه چیکو خوش آمدی 🤖\n\n🎮 بازی‌ها:\n/hokm\n\n😂 سرگرمی:\n/dice\n/coin\n/joke\n/fact\n/luck\n/rps\n/guess\n\n👤 پروفایل:\n/profile\n/top`,
            keyboard
        );
    });

    // هندلر برای دکمه‌های کیبورد
    bot.on('message', (msg) => {
        const text = msg.text;
        if (text === '🎮 بازی‌ها') {
            bot.sendMessage(
                msg.chat.id,
                `🎮 بازی‌های موجود:\n\n/hokm - بازی حکم\n/rps - سنگ کاغذ قیچی\n/guess - حدس عدد`
            );
        } else if (text === '😂 سرگرمی') {
            bot.sendMessage(
                msg.chat.id,
                `😂 سرگرمی‌ها:\n\n/dice - تاس\n/coin - سکه\n/joke - جوک\n/fact - حقیقت جالب\n/luck - شانس امروز`
            );
        } else if (text === '👤 پروفایل') {
            bot.sendMessage(msg.chat.id, `/profile`);
        } else if (text === '📊 رتبه‌بندی') {
            bot.sendMessage(msg.chat.id, `/top`);
        }
    });
};