const Rules = require("./rules");

class Player {
    constructor(id, name, isBot = false) {
        this.id = id;
        this.name = name;
        this.isBot = isBot;

        // کارت‌های دست بازیکن
        this.hand = [];

        // تعداد دست‌های برده در راند جاری
        this.tricks = 0;

        // تیم (1 یا 2)
        this.team = null;

        // آیا حاکمِ راند جاری است؟
        this.isHakem = false;

        // آیا تا الان توانسته‌ایم برایش پیام خصوصی (PV) بفرستیم؟
        // اگر false شود یعنی باید اول با ربات /start بزند.
        this.canReceivePV = true;
    }

    // حذف یک کارت از دست بر اساس ایندکس
    removeCard(index) {
        if (index < 0 || index >= this.hand.length) return null;
        return this.hand.splice(index, 1)[0];
    }

    // حذف کارت بر اساس مقدار و خال (برای اعمال حرکتِ بازیکن)
    playCard(value, suit) {
        const index = this.hand.findIndex(
            (card) => card.value === value && card.suit === suit,
        );

        if (index === -1) return null;

        return this.hand.splice(index, 1)[0];
    }

    // آیا این خال را در دست دارد؟
    hasSuit(suit) {
        return this.hand.some((card) => card.suit === suit);
    }

    // لیست کارت‌های مجاز برای بازی‌کردن در وضعیت فعلی میز
    // (همین لیست مستقیماً برای ساخت کیبورد شیشه‌ای استفاده می‌شود)
    getPlayableCards(leadSuit) {
        return Rules.getPlayableCards(this.hand, leadSuit);
    }

    // مرتب کردن کارت‌ها برای نمایش خواناتر
    sortHand() {
        const suitOrder = { "♠": 0, "♥": 1, "♦": 2, "♣": 3 };

        const valueOrder = {
            2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8,
            9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14,
        };

        this.hand.sort((a, b) => {
            if (a.suit !== b.suit) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }

            return valueOrder[a.value] - valueOrder[b.value];
        });
    }

    // پاک کردن اطلاعات راند برای شروع راند جدید
    reset() {
        this.hand = [];
        this.tricks = 0;
        this.isHakem = false;
    }

    // نمایش کارت‌ها به‌صورت متن (fallback وقتی امکان ارسال کیبورد نیست)
    getHandText() {
        return this.hand.map((card) => `${card.value}${card.suit}`).join("   ");
    }
}

module.exports = Player;
