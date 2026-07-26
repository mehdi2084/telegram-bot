const CARD_VALUES = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14,
};

class Rules {
    // -----------------------------------------
    // آیا این کارت مجاز به بازی شدن است؟
    // (باید هم‌خالِ کارتِ اول باشد، مگر خودش را نداشته باشد)
    // -----------------------------------------
    static canPlayCard(hand, card, leadSuit) {
        // اولین کارتِ دست، هر کارتی می‌تواند باشد
        if (!leadSuit) return true;

        const hasLeadSuit = hand.some((c) => c.suit === leadSuit);

        // اگر خالِ درخواستی را ندارد، هر کارتی مجاز است
        if (!hasLeadSuit) return true;

        return card.suit === leadSuit;
    }

    // -----------------------------------------
    // لیست کارت‌های مجاز برای بازی — برای ساخت کیبورد و اعتبارسنجی
    // -----------------------------------------
    static getPlayableCards(hand, leadSuit) {
        if (!leadSuit) return [...hand];

        const sameSuit = hand.filter((c) => c.suit === leadSuit);

        return sameSuit.length > 0 ? sameSuit : [...hand];
    }

    // ارزش عددی کارت
    static getCardValue(card) {
        return CARD_VALUES[card.value];
    }

    // مقایسه دو کارت روی میز (کدام برنده است؟)
    static compareCards(card1, card2, leadSuit, hokm) {
        // هر دو حکم‌اند
        if (card1.suit === hokm && card2.suit === hokm) {
            return this.getCardValue(card1) > this.getCardValue(card2);
        }

        if (card1.suit === hokm) return true;
        if (card2.suit === hokm) return false;

        // هر دو هم‌خالِ کارت اول‌اند
        if (card1.suit === leadSuit && card2.suit === leadSuit) {
            return this.getCardValue(card1) > this.getCardValue(card2);
        }

        if (card1.suit === leadSuit) return true;
        if (card2.suit === leadSuit) return false;

        return false;
    }

    // تعیین برنده‌ی یک دست (۴ کارت روی میز)
    static getWinner(tableCards, hokm) {
        if (tableCards.length === 0) return null;

        let winner = tableCards[0];
        const leadSuit = winner.card.suit;

        for (let i = 1; i < tableCards.length; i++) {
            if (this.compareCards(tableCards[i].card, winner.card, leadSuit, hokm)) {
                winner = tableCards[i];
            }
        }

        return winner.player;
    }

    // شمارش امتیاز تیم‌ها بر اساس دست‌های برده‌شده
    static calculateScore(players) {
        let team1 = 0;
        let team2 = 0;

        players.forEach((player) => {
            if (player.team === 1) team1 += player.tricks;
            else team2 += player.tricks;
        });

        return { team1, team2 };
    }

    // آیا راند فعلی تمام شده (کارتی در دست کسی نمانده)؟
    static isRoundFinished(players) {
        return players.every((player) => player.hand.length === 0);
    }

    // -----------------------------------------
    // تعیین حاکمِ راند بعدی
    // قانون ساده‌شده: حاکم به‌صورت چرخشی به نفر بعدی می‌رسد
    // (اگر می‌خواهی قانون «حاکم بعدی از تیم برنده» را پیاده کنی،
    //  فقط همین متد را جایگزین کن — بقیه‌ی کد به آن وابسته نیست)
    // -----------------------------------------
    static getNextHakem(players, currentHakemId) {
        const index = players.findIndex((p) => p.id === currentHakemId);
        const nextIndex = (index + 1) % players.length;

        return players[nextIndex];
    }
}

module.exports = Rules;
module.exports.CARD_VALUES = CARD_VALUES;
