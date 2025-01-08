// == Route Class 선언 ==
class Route {
    constructor(id) {
        this.id = id;
        this.express = require('express');
        this.app = this.express();
        this.bodyParser = require("body-parser");
        this.serviceInfo = require("../config/service");

    }
    daemonReady() {
        const cors = require("cors");
        // == use ==
        this.app.use(cors());
        this.app.use(this.bodyParser.json());
        this.app.use(this.bodyParser.urlencoded({ extended: true }));
        // == listen ==
        this.app.listen(this.serviceInfo.port, () => {
            console.log(this.serviceInfo.server + " is ready");
        })
    }
    runRoute() {

        // === 기본 진입 라우팅 지정 ===
        this.app.get("/", (req, res) => {
            res.send("Welcome Yujin MusicPlayer");
        });

        // === 뮤직리스트 전체 : SELECT ===
        this.app.get("/musicList/", (req, res) => {
            const musicListDB = require("../doIt/musicListDB");
            musicListDB(req, res);
        });

        // === 좋아요 UPDATE ===
        this.app.post("/likeStatus/", (req, res) => {
            const likeStatus = require("../doIt/likeStatus");
            likeStatus(req, res);
        });

        // === 좋아요 리스트 : SELECT ===
        this.app.get("/MyMusicList/", (req, res) => {
            const myMusicList = require("../doIt/myMusicList");
            myMusicList(req, res);
        })
    }
    run() {
        this.daemonReady();
        this.runRoute();
    }
}// END_Route

const daemon = new Route("service");
module.exports = daemon;