const Player = require("./player");

// بازیکنِ بات — فقط یک Player با isBot=true است.
// (منطق تصمیم‌گیری بات، برای جلوگیری از تکرار کد، فقط داخل ai.js نوشته شده
//  و مستقیماً توسط game.js صدا زده می‌شود)
class BotPlayer extends Player {
    constructor(id, name = "🤖 ربات") {
        super(id, name, true);

        // بات‌ها نیازی به پیام خصوصی ندارند
        this.canReceivePV = false;
    }
}

module.exports = BotPlayer;
