const hokmManager = require("../games/hokm/manager");



module.exports = function(bot) {



    //--------------------------------
    // ساخت روم
    //--------------------------------

    bot.onText(
        /\/hokm/,
        (msg)=>{


            const chatId = msg.chat.id;

            const userId = msg.from.id;

            const name =
                msg.from.first_name || "Player";



            const room =
                hokmManager.createRoom(
                    chatId,
                    userId
                );



            if(!room){

                bot.sendMessage(
                    chatId,
                    "❌ یک بازی در این گروه وجود دارد."
                );

                return;
            }



            hokmManager.joinRoom(
                chatId,
                userId,
                name
            );



            bot.sendMessage(
                chatId,
                `🎮 بازی حکم ساخته شد!\n\n👤 ${name} وارد بازی شد.\n\nبازیکنان دیگر با دستور /join وارد شوند.`
            );


        }
    );






    //--------------------------------
    // ورود به بازی
    //--------------------------------


    bot.onText(
        /\/join/,
        (msg)=>{


            const chatId =
                msg.chat.id;


            const userId =
                msg.from.id;


            const name =
                msg.from.first_name || "Player";



            const result =
                hokmManager.joinRoom(
                    chatId,
                    userId,
                    name
                );



            if(!result.success){


                bot.sendMessage(
                    chatId,
                    "❌ ورود امکان‌پذیر نیست."
                );


                return;

            }



            bot.sendMessage(
                chatId,
                `✅ ${name} وارد بازی شد.\n\n👥 تعداد بازیکنان: ${result.room.playerCount()}/4`
            );



        }
    );






    //--------------------------------
    // نمایش بازیکنان
    //--------------------------------


    bot.onText(
        /\/players/,
        (msg)=>{


            const room =
                hokmManager.getRoom(
                    msg.chat.id
                );



            if(!room){

                bot.sendMessage(
                    msg.chat.id,
                    "❌ بازی وجود ندارد."
                );

                return;
            }



            bot.sendMessage(
                msg.chat.id,
                "👥 بازیکنان:\n\n" +
                room.getInfo()
            );


        }
    );






    //--------------------------------
    // اضافه کردن بات
    //--------------------------------


    bot.onText(
        /\/bots (.+)/,
        (msg,match)=>{


            const count =
                Number(match[1]);



            const result =
                hokmManager.addBots(
                    msg.chat.id,
                    count
                );



            if(result){

                bot.sendMessage(
                    msg.chat.id,
                    `🤖 ${count} بات اضافه شد.`
                );

            }


        }
    );






    //--------------------------------
    // شروع بازی
    //--------------------------------


    bot.onText(
        /\/startgame/,
        (msg)=>{


            const game =
                hokmManager.startGame(
                    msg.chat.id
                );



            if(!game){


                bot.sendMessage(
                    msg.chat.id,
                    "❌ بازی قابل شروع نیست.\nباید ۴ بازیکن وجود داشته باشد."
                );


                return;

            }



            bot.sendMessage(
                msg.chat.id,
                "🚀 بازی شروع شد!"
            );



        }
    );







    //--------------------------------
    // وضعیت بازی
    //--------------------------------


    bot.onText(
        /\/status/,
        (msg)=>{


            const state =
                hokmManager.getState(
                    msg.chat.id
                );



            if(!state){

                bot.sendMessage(
                    msg.chat.id,
                    "❌ بازی فعال نیست."
                );

                return;

            }



            bot.sendMessage(
                msg.chat.id,

                `
🎮 وضعیت بازی

🃏 حکم:
${state.hokm || "انتخاب نشده"}

👑 حاکم:
${state.hakem?.name || "-"}

🎯 نوبت:
${state.currentPlayer?.name || "-"}

🏆 امتیاز:
تیم ۱ : ${state.scores.team1}
تیم ۲ : ${state.scores.team2}
`
            );

        }
    );






    //--------------------------------
    // بازی کارت
    //--------------------------------
    // مثال:
    // /play A ♠
    //--------------------------------


    bot.onText(
        /\/play (.+) (.+)/,
        (msg,match)=>{


            const value =
                match[1];


            const suit =
                match[2];



            const result =
                hokmManager.playCard(
                    msg.chat.id,
                    msg.from.id,
                    suit,
                    value
                );



            if(result){


                bot.sendMessage(
                    msg.chat.id,
                    `🃏 کارت ${value}${suit} بازی شد.`
                );


            }
            else{


                bot.sendMessage(
                    msg.chat.id,
                    "❌ حرکت غیرمجاز است."
                );


            }



        }
    );






    //--------------------------------
    // خروج
    //--------------------------------


    bot.onText(
        /\/leave/,
        (msg)=>{


            hokmManager.leaveRoom(
                msg.chat.id,
                msg.from.id
            );


            bot.sendMessage(
                msg.chat.id,
                "👋 از بازی خارج شدید."
            );


        }
    );



};