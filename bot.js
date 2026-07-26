const TelegramBot = require("node-telegram-bot-api").default;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
    polling: true
});

console.log("Chiko Bot Started 🚀");

// ذخیره امتیاز کاربران
const users = {};

// ذخیره بازی‌های حکم
const hokmGames = {};

// کارت‌های بازی
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, 
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// تابع ثبت کاربر
function registerUser(id, name) {
    if (!users[id]) {
        users[id] = {
            name,
            xp: 0,
            coins: 100
        };
    }
}

// ساخت دسته کارت
function createDeck() {
    const deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ suit, rank, value: RANK_VALUES[rank] });
        }
    }
    return shuffleDeck(deck);
}

// بر زدن کارت‌ها
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ایجاد بازی جدید
function createHokmGame(chatId, creatorId, creatorName) {
    const gameId = `hokm_${chatId}_${Date.now()}`;
    hokmGames[gameId] = {
        id: gameId,
        chatId: chatId,
        creator: creatorId,
        players: [{ id: creatorId, name: creatorName, cards: [], team: 0 }],
        status: 'waiting', // waiting, choosing_hokm, playing, finished
        deck: [],
        hokmSuit: null,
        hokmChooser: null,
        currentPlayer: 0,
        roundCards: [],
        scores: { team1: 0, team2: 0 },
        roundScores: { team1: 0, team2: 0 },
        maxRounds: 13,
        currentRound: 0
    };
    return gameId;
}

// استارت
bot.onText(/\/start/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    bot.sendMessage(
        msg.chat.id,
        `سلام ${msg.from.first_name} 👋

به چیکو خوش اومدی 🤖

🎮 بازی‌ها:
/dice
/coin
/guess
/rps
/hokm - بازی حکم چهار نفره

😂 سرگرمی:
/joke
/fact
/luck

👤 پروفایل:
/profile
/top`
    );
});

// پروفایل
bot.onText(/\/profile/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    const user = users[msg.from.id];

    bot.sendMessage(
        msg.chat.id,
        `👤 ${user.name}

⭐ XP: ${user.xp}
🪙 Coins: ${user.coins}`
    );
});

// جدول رتبه بندی
bot.onText(/\/top/, (msg) => {
    const ranking = Object.values(users)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10);

    let text = "🏆 برترین کاربران:\n\n";

    ranking.forEach((u, i) => {
        text += `${i + 1}. ${u.name} - ${u.xp} XP\n`;
    });

    bot.sendMessage(msg.chat.id, text);
});

// تاس
bot.onText(/\/dice/, (msg) => {
    const number = Math.floor(Math.random() * 6) + 1;

    bot.sendMessage(
        msg.chat.id,
        `🎲 عدد تاس: ${number}`
    );
});

// شیر یا خط
bot.onText(/\/coin/, (msg) => {
    const result =
        Math.random() < 0.5 ? "🦁 شیر" : "🪙 خط";

    bot.sendMessage(msg.chat.id, result);
});

// شانس امروز
bot.onText(/\/luck/, (msg) => {
    const luck = Math.floor(Math.random() * 101);

    bot.sendMessage(
        msg.chat.id,
        `🍀 شانس امروزت: ${luck}%`
    );
});

// جوک
const jokes = [
    "😂 معلم: چرا تکلیف ننوشتی؟ دانش‌آموز: اینترنت قطع بود!",
    "😂 کامپیوترم مریض شده، ویروس گرفته!",
    "😂 برنامه‌نویس‌ها خواب نمی‌بینن، دیباگ می‌کنن!"
];

bot.onText(/\/joke/, (msg) => {
    const joke =
        jokes[Math.floor(Math.random() * jokes.length)];

    bot.sendMessage(msg.chat.id, joke);
});

// دانستنی
const facts = [
    "🦒 زبان زرافه تا 50 سانتی‌متر طول دارد.",
    "🐙 اختاپوس سه قلب دارد.",
    "🦈 کوسه‌ها قبل از دایناسورها وجود داشتند."
];

bot.onText(/\/fact/, (msg) => {
    const fact =
        facts[Math.floor(Math.random() * facts.length)];

    bot.sendMessage(msg.chat.id, fact);
});

// حدس عدد
const games = {};

bot.onText(/\/guess/, (msg) => {
    games[msg.chat.id] =
        Math.floor(Math.random() * 10) + 1;

    bot.sendMessage(
        msg.chat.id,
        "🎯 یک عدد بین 1 تا 10 حدس بزن."
    );
});

// سنگ کاغذ قیچی
bot.onText(/\/rps (سنگ|کاغذ|قیچی)/, (msg, match) => {
    const player = match[1];

    const choices = [
        "سنگ",
        "کاغذ",
        "قیچی"
    ];

    const botChoice =
        choices[Math.floor(Math.random() * 3)];

    let result = "";

    if (player === botChoice)
        result = "🤝 مساوی";

    else if (
        (player === "سنگ" && botChoice === "قیچی") ||
        (player === "کاغذ" && botChoice === "سنگ") ||
        (player === "قیچی" && botChoice === "کاغذ")
    )
        result = "🎉 شما بردید";

    else
        result = "😢 شما باختید";

    bot.sendMessage(
        msg.chat.id,
        `شما: ${player}
ربات: ${botChoice}

${result}`
    );
});

// ============== سیستم بازی حکم ==============

// ساخت بازی جدید حکم
bot.onText(/\/hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;
    
    registerUser(userId, userName);
    
    // بررسی وجود بازی فعال
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status !== 'finished'
    );
    
    if (activeGame) {
        bot.sendMessage(chatId, 
            "⚠️ یک بازی حکم در این گروه در حال انجام است.\n" +
            "برای پیوستن از دستور /join_hokm استفاده کنید."
        );
        return;
    }
    
    const gameId = createHokmGame(chatId, userId, userName);
    
    bot.sendMessage(chatId, 
        `🃏 بازی حکم شروع شد!\n\n` +
        `سازنده بازی: ${userName}\n` +
        `برای پیوستن به بازی از دستور /join_hokm استفاده کنید.\n` +
        `حداقل ۴ بازیکن نیاز است.\n` +
        `برای خروج: /leave_hokm\n` +
        `برای لغو: /cancel_hokm`
    );
});

// پیوستن به بازی
bot.onText(/\/join_hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;
    
    registerUser(userId, userName);
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status === 'waiting'
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی برای پیوستن وجود ندارد.");
        return;
    }
    
    if (activeGame.players.find(p => p.id === userId)) {
        bot.sendMessage(chatId, "⚠️ شما قبلاً به بازی پیوسته‌اید.");
        return;
    }
    
    if (activeGame.players.length >= 4) {
        bot.sendMessage(chatId, "⚠️ بازی پر شده است.");
        return;
    }
    
    activeGame.players.push({ 
        id: userId, 
        name: userName, 
        cards: [], 
        team: activeGame.players.length % 2 
    });
    
    bot.sendMessage(chatId, 
        `✅ ${userName} به بازی پیوست.\n` +
        `تعداد بازیکنان: ${activeGame.players.length}/4`
    );
    
    if (activeGame.players.length === 4) {
        startHokmGame(activeGame);
    }
});

// خروج از بازی
bot.onText(/\/leave_hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status === 'waiting'
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی برای خروج وجود ندارد.");
        return;
    }
    
    const playerIndex = activeGame.players.findIndex(p => p.id === userId);
    if (playerIndex === -1) {
        bot.sendMessage(chatId, "❌ شما در این بازی نیستید.");
        return;
    }
    
    activeGame.players.splice(playerIndex, 1);
    bot.sendMessage(chatId, 
        `${msg.from.first_name} از بازی خارج شد.\n` +
        `تعداد بازیکنان: ${activeGame.players.length}/4`
    );
    
    if (activeGame.players.length === 0) {
        delete hokmGames[activeGame.id];
    }
});

// لغو بازی
bot.onText(/\/cancel_hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status !== 'finished'
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی برای لغو وجود ندارد.");
        return;
    }
    
    if (activeGame.creator !== userId) {
        bot.sendMessage(chatId, "❌ فقط سازنده بازی می‌تواند آن را لغو کند.");
        return;
    }
    
    delete hokmGames[activeGame.id];
    bot.sendMessage(chatId, "🃏 بازی حکم لغو شد.");
});

// شروع بازی حکم
function startHokmGame(game) {
    game.status = 'choosing_hokm';
    game.deck = createDeck();
    
    // تقسیم کارت‌ها
    for (let i = 0; i < 5; i++) {
        for (let player of game.players) {
            player.cards.push(game.deck.pop());
        }
    }
    
    // انتخاب تصادفی تعیین کننده حکم
    const randomPlayer = game.players[Math.floor(Math.random() * 4)];
    game.hokmChooser = randomPlayer.id;
    
    // ارسال کارت‌ها به صورت خصوصی
    game.players.forEach(player => {
        const cardsText = formatCards(player.cards);
        bot.sendMessage(player.id, 
            `🃏 کارت‌های شما:\n${cardsText}`
        ).catch(() => {
            bot.sendMessage(game.chatId, 
                `⚠️ ${player.name} لطفاً ربات را استارت کنید تا کارت‌هایتان ارسال شود.`
            );
        });
    });
    
    // اعلام بازیکن تعیین کننده حکم
    bot.sendMessage(game.chatId, 
        `🎯 ${game.players.find(p => p.id === game.hokmChooser).name} باید حکم را تعیین کند.\n` +
        `لطفاً یکی از خال‌ها را انتخاب کنید:\n` +
        `♠️ - /hokm_suit_spades\n` +
        `♥️ - /hokm_suit_hearts\n` +
        `♦️ - /hokm_suit_diamonds\n` +
        `♣️ - /hokm_suit_clubs`
    );
}

// فرمت کردن کارت‌ها برای نمایش
function formatCards(cards) {
    return cards.map((card, index) => 
        `${index + 1}. ${card.rank}${card.suit}`
    ).join('\n');
}

// انتخاب حکم
const suitCommands = {
    '/hokm_suit_spades': '♠',
    '/hokm_suit_hearts': '♥',
    '/hokm_suit_diamonds': '♦',
    '/hokm_suit_clubs': '♣'
};

Object.entries(suitCommands).forEach(([command, suit]) => {
    bot.onText(new RegExp(command), (msg) => {
        const userId = msg.from.id;
        
        const activeGame = Object.values(hokmGames).find(
            g => g.hokmChooser === userId && g.status === 'choosing_hokm'
        );
        
        if (!activeGame) {
            bot.sendMessage(msg.chat.id, "❌ شما اجازه انتخاب حکم را ندارید.");
            return;
        }
        
        activeGame.hokmSuit = suit;
        activeGame.status = 'playing';
        activeGame.currentPlayer = activeGame.players.findIndex(p => p.id === activeGame.hokmChooser);
        
        // توزیع بقیه کارت‌ها
        for (let i = 0; i < 8; i++) {
            for (let player of activeGame.players) {
                player.cards.push(activeGame.deck.pop());
            }
        }
        
        // ارسال کارت‌های جدید به بازیکنان
        activeGame.players.forEach(player => {
            const cardsText = formatCards(player.cards);
            bot.sendMessage(player.id, 
                `🃏 کارت‌های نهایی شما:\n${cardsText}`
            ).catch(() => {});
        });
        
        const suitNames = {
            '♠': 'پیک ♠️',
            '♥': 'دل ♥️',
            '♦': 'خشت ♦️',
            '♣': 'گشنیز ♣️'
        };
        
        bot.sendMessage(activeGame.chatId, 
            `🎯 حکم: ${suitNames[suit]}\n\n` +
            `بازی شروع شد! نوبت ${activeGame.players[activeGame.currentPlayer].name}\n` +
            `برای بازی کارت: /play [شماره کارت]\n` +
            `مثال: /play 1`
        );
    });
});

// بازی کارت
bot.onText(/\/play (\d+)/, (msg, match) => {
    const userId = msg.from.id;
    const cardIndex = parseInt(match[1]) - 1;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.status === 'playing' && 
        g.players[g.currentPlayer]?.id === userId
    );
    
    if (!activeGame) {
        bot.sendMessage(msg.chat.id, "❌ نوبت شما نیست یا بازی فعالی وجود ندارد.");
        return;
    }
    
    const player = activeGame.players[activeGame.currentPlayer];
    
    if (cardIndex < 0 || cardIndex >= player.cards.length) {
        bot.sendMessage(userId, "❌ شماره کارت نامعتبر است.");
        return;
    }
    
    // بررسی قوانین بازی (ساده شده)
    if (activeGame.roundCards.length > 0) {
        const firstSuit = activeGame.roundCards[0].card.suit;
        const hasSuit = player.cards.some(c => c.suit === firstSuit);
        
        if (hasSuit && player.cards[cardIndex].suit !== firstSuit) {
            bot.sendMessage(userId, `❌ باید از خال ${firstSuit} بازی کنید.`);
            return;
        }
    }
    
    // بازی کارت
    const playedCard = player.cards.splice(cardIndex, 1)[0];
    activeGame.roundCards.push({ playerId: userId, card: playedCard });
    
    bot.sendMessage(activeGame.chatId, 
        `${player.name} بازی کرد: ${playedCard.rank}${playedCard.suit}`
    );
    
    // بررسی پایان دور
    if (activeGame.roundCards.length === 4) {
        finishRound(activeGame);
    } else {
        // نوبت بعدی
        activeGame.currentPlayer = (activeGame.currentPlayer + 1) % 4;
        const nextPlayer = activeGame.players[activeGame.currentPlayer];
        
        bot.sendMessage(activeGame.chatId, 
            `نوبت ${nextPlayer.name}\n` +
            `کارت‌های بازی شده: ${activeGame.roundCards.map(c => c.card.rank + c.card.suit).join(' ')}`
        );
    }
});

// پایان دور
function finishRound(game) {
    // تعیین برنده دور
    const firstSuit = game.roundCards[0].card.suit;
    let winnerIndex = 0;
    let highestValue = game.roundCards[0].card.value;
    
    // کارت حکم بالاترین ارزش را دارد
    for (let i = 1; i < game.roundCards.length; i++) {
        const card = game.roundCards[i].card;
        
        if (card.suit === game.hokmSuit && game.roundCards[winnerIndex].card.suit !== game.hokmSuit) {
            winnerIndex = i;
            highestValue = card.value;
        } else if (card.suit === game.hokmSuit && game.roundCards[winnerIndex].card.suit === game.hokmSuit) {
            if (card.value > highestValue) {
                winnerIndex = i;
                highestValue = card.value;
            }
        } else if (card.suit === firstSuit && game.roundCards[winnerIndex].card.suit !== game.hokmSuit) {
            if (card.value > highestValue) {
                winnerIndex = i;
                highestValue = card.value;
            }
        }
    }
    
    const winner = game.players.find(p => p.id === game.roundCards[winnerIndex].playerId);
    const teamKey = winner.team === 0 ? 'team1' : 'team2';
    game.roundScores[teamKey]++;
    
    bot.sendMessage(game.chatId, 
        `🏆 ${winner.name} این دور را برد!\n` +
        `امتیاز تیم ۱: ${game.roundScores.team1} | تیم ۲: ${game.roundScores.team2}`
    );
    
    game.currentRound++;
    game.roundCards = [];
    
    // بررسی پایان بازی
    if (game.currentRound >= game.maxRounds || 
        game.players[0].cards.length === 0) {
        finishGame(game);
    } else {
        game.currentPlayer = game.players.findIndex(p => p.id === winner.id);
        const nextPlayer = game.players[game.currentPlayer];
        
        bot.sendMessage(game.chatId, 
            `دور ${game.currentRound + 1} - نوبت ${nextPlayer.name}`
        );
    }
}

// پایان بازی
function finishGame(game) {
    game.status = 'finished';
    
    const winner = game.roundScores.team1 > game.roundScores.team2 ? 'تیم ۱' : 'تیم ۲';
    
    let resultText = `🎮 بازی تمام شد!\n\n` +
        `امتیاز نهایی:\n` +
        `تیم ۱: ${game.roundScores.team1}\n` +
        `تیم ۲: ${game.roundScores.team2}\n\n` +
        `🏆 برنده: ${winner}\n\n`;
    
    // اهدای جوایز
    const winningTeam = game.roundScores.team1 > game.roundScores.team2 ? 0 : 1;
    game.players.forEach(player => {
        if (player.team === winningTeam) {
            users[player.id].xp += 50;
            users[player.id].coins += 100;
            resultText += `${player.name}: ⭐ +50 XP, 🪙 +100 Coins\n`;
        } else {
            users[player.id].xp += 10;
            users[player.id].coins += 20;
            resultText += `${player.name}: ⭐ +10 XP, 🪙 +20 Coins\n`;
        }
    });
    
    bot.sendMessage(game.chatId, resultText);
    
    // پاکسازی بازی
    setTimeout(() => {
        delete hokmGames[game.id];
    }, 5000);
}

// نمایش وضعیت بازی
bot.onText(/\/hokm_status/, (msg) => {
    const chatId = msg.chat.id;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status !== 'finished'
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی وجود ندارد.");
        return;
    }
    
    let status = `📊 وضعیت بازی حکم\n\n` +
        `وضعیت: ${activeGame.status}\n` +
        `بازیکنان: ${activeGame.players.length}/4\n`;
    
    if (activeGame.hokmSuit) {
        const suitNames = {
            '♠': 'پیک ♠️',
            '♥': 'دل ♥️',
            '♦': 'خشت ♦️',
            '♣': 'گشنیز ♣️'
        };
        status += `حکم: ${suitNames[activeGame.hokmSuit]}\n`;
        status += `دور: ${activeGame.currentRound + 1}/${activeGame.maxRounds}\n`;
        status += `امتیاز تیم ۱: ${activeGame.roundScores.team1}\n`;
        status += `امتیاز تیم ۲: ${activeGame.roundScores.team2}\n`;
    }
    
    status += `\nبازیکنان:\n`;
    activeGame.players.forEach((p, i) => {
        status += `${i + 1}. ${p.name} (تیم ${p.team + 1})\n`;
    });
    
    bot.sendMessage(chatId, status);
});

// دریافت پاسخ حدس عدد
bot.on("message", (msg) => {
    if (!msg.text) return;

    const game = games[msg.chat.id];

    if (game && /^[0-9]+$/.test(msg.text)) {
        const guess = parseInt(msg.text);

        registerUser(msg.from.id, msg.from.first_name);

        if (guess === game) {
            users[msg.from.id].xp += 10;
            users[msg.from.id].coins += 20;

            delete games[msg.chat.id];

            bot.sendMessage(
                msg.chat.id,
                "🎉 درست حدس زدی!\n⭐ +10 XP\n🪙 +20 Coins"
            );
        } else {
            bot.sendMessage(
                msg.chat.id,
                "❌ اشتباه بود. دوباره تلاش کن."
            );
        }
    }
});