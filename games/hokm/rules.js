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
    "A": 14
};

class Rules {

    // آیا بازیکن اجازه دارد این کارت را بازی کند؟
    static canPlayCard(player, card, leadSuit) {

        // اولین نفر هر کارتی می‌تواند بازی کند
        if (!leadSuit)
            return true;

        // اگر همان خال را دارد باید همان را بازی کند
        const hasLeadSuit = player.hand.some(
            c => c.suit === leadSuit
        );

        if (!hasLeadSuit)
            return true;

        return card.suit === leadSuit;
    }

    // ارزش عددی کارت
    static getCardValue(card) {

        return CARD_VALUES[card.value];

    }

    // مقایسه دو کارت
    static compareCards(card1, card2, leadSuit, hokm) {

        // هر دو حکم
        if (card1.suit === hokm && card2.suit === hokm) {

            return this.getCardValue(card1) >
                this.getCardValue(card2);

        }

        // فقط کارت اول حکم است
        if (card1.suit === hokm)
            return true;

        // فقط کارت دوم حکم است
        if (card2.suit === hokm)
            return false;

        // هر دو از خال شروع
        if (
            card1.suit === leadSuit &&
            card2.suit === leadSuit
        ) {

            return this.getCardValue(card1) >
                this.getCardValue(card2);

        }

        // فقط اول از خال شروع
        if (card1.suit === leadSuit)
            return true;

        // فقط دوم از خال شروع
        if (card2.suit === leadSuit)
            return false;

        // در غیر این صورت اول برنده نیست
        return false;
    }

    // تعیین برنده دست
    static getWinner(tableCards, hokm) {

        if (tableCards.length === 0)
            return null;

        let winner = tableCards[0];

        const leadSuit = winner.card.suit;

        for (let i = 1; i < tableCards.length; i++) {

            if (
                this.compareCards(
                    tableCards[i].card,
                    winner.card,
                    leadSuit,
                    hokm
                )
            ) {

                winner = tableCards[i];

            }

        }

        return winner.player;

    }

    // شمارش دست‌های تیم‌ها
    static calculateScore(players) {

        let team1 = 0;
        let team2 = 0;

        players.forEach(player => {

            if (player.team === 1)
                team1 += player.tricks;

            else
                team2 += player.tricks;

        });

        return {
            team1,
            team2
        };

    }

    // آیا بازی تمام شده؟
    static isRoundFinished(players) {

        return players.every(
            player => player.hand.length === 0
        );

    }

}

module.exports = Rules;