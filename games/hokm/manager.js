const Room = require("./room");
const Game = require("./game");
const Player = require("./player");


class HokmManager {


    constructor(){

        this.rooms = new Map();

    }



    //--------------------------------
    // ساخت اتاق
    //--------------------------------

    createRoom(user){


        const chatId = user.id;


        const room = new Room(
            chatId,
            user.id
        );



        const player = new Player(
            user.id,
            user.username || user.first_name
        );



        room.addPlayer(player);



        this.rooms.set(
            chatId.toString(),
            room
        );



        return room;

    }




    //--------------------------------
    // گرفتن اتاق
    //--------------------------------

    getRoom(roomId){


        return this.rooms.get(
            roomId.toString()
        );


    }





    //--------------------------------
    // ورود بازیکن
    //--------------------------------

    joinRoom(roomId,user){


        const room = this.getRoom(roomId);



        if(!room){

            return {
                success:false,
                message:"اتاق پیدا نشد"
            };

        }



        const player = new Player(
            user.id,
            user.username || user.first_name
        );



        const added = room.addPlayer(player);



        if(!added){

            return {
                success:false,
                message:"امکان ورود نیست"
            };

        }



        return {

            success:true,

            room,

            player

        };


    }





    //--------------------------------
    // اضافه کردن بات
    //--------------------------------

    addBots(roomId,count){


        const room=this.getRoom(roomId);


        if(!room)
            return false;



        room.addBots(count);


        return true;

    }





    //--------------------------------
    // شروع بازی
    //--------------------------------

    startGame(roomId){


        const room=this.getRoom(roomId);



        if(!room)
            return null;



        if(room.players.length !== 4)
            return null;



        if(room.game)
            return room.game;




        room.createTeams();



        const game = new Game(room);



        room.game = game;



        this.bindEvents(game,room);



        game.begin();



        return game;


    }





    //--------------------------------
    // اتصال Event های Game
    //--------------------------------

    bindEvents(game,room){



        game.on(
            "chooseHokm",
            (player)=>{


                console.log(
                    "انتخاب حکم توسط:",
                    player.name
                );


            }
        );




        game.on(
            "roundStarted",
            (data)=>{


                console.log(
                    "شروع راند",
                    data.hokm
                );


            }
        );




        game.on(
            "playerTurn",
            (data)=>{


                console.log(
                    "نوبت:",
                    data.player.name
                );


            }
        );





        game.on(
            "cardPlayed",
            (data)=>{


                console.log(
                    data.player.name,
                    data.card
                );


            }
        );





        game.on(
            "trickFinished",
            (data)=>{


                console.log(
                    "برنده دست:",
                    data.winner.name
                );


            }
        );





        game.on(
            "roundFinished",
            (data)=>{


                console.log(
                    "پایان راند",
                    data.score
                );


            }
        );





        game.on(
            "matchFinished",
            (data)=>{


                console.log(
                    "پایان مسابقه",
                    data.score
                );



                room.started=false;


            }
        );





    }





    //--------------------------------
    // بازی کارت
    //--------------------------------

    playCard(
        roomId,
        playerId,
        suit,
        value
    ){


        const room=this.getRoom(roomId);



        if(!room || !room.game)
            return false;



        return room.game.play(
            playerId,
            suit,
            value
        );


    }





    //--------------------------------
    // گرفتن بازی
    //--------------------------------

    getGame(roomId){


        const room=this.getRoom(roomId);



        if(!room)
            return null;



        return room.game;


    }





    //--------------------------------
    // حذف بازیکن
    //--------------------------------

    leaveRoom(roomId,playerId){


        const room=this.getRoom(roomId);



        if(!room)
            return false;



        room.removePlayer(playerId);



        if(room.players.length===0){

            this.deleteRoom(roomId);

        }



        return true;


    }





    //--------------------------------
    // حذف اتاق
    //--------------------------------

    deleteRoom(roomId){


        const room=this.getRoom(roomId);



        if(!room)
            return false;



        if(room.game){

            room.game.destroy();

        }



        this.rooms.delete(
            roomId.toString()
        );



        return true;


    }





    //--------------------------------
    // تعداد اتاق
    //--------------------------------

    count(){


        return this.rooms.size;


    }





    //--------------------------------
    // لیست اتاق‌ها
    //--------------------------------

    getAllRooms(){


        return [
            ...this.rooms.values()
        ];


    }


}



module.exports = new HokmManager();