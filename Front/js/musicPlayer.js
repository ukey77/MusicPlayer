// == DoublyLinkedList ==
class DoublyLinkedList {
    constructor(id) {
        this._id = id;
        this._prev = null;
        this._next = null;
    }
    // prev
    set prev(pLink) { this._prev = pLink; }
    get prev() { return this._prev; }
    // next
    set next(nLink) { this._next = nLink; }
    get next() { return this._next; }
    get idx() { return Number(this._id) - 1; }
}//end_DoublyLinkedList

// == MusicNode ==
class MusicNode {
    constructor(id) {
        this.id = id;
        this.musicContents = null; //DB_Data
        this.musicLinks = [];
    }
    createLinks() {
        for (let i = 0; i < (this.musicContents.length); i++) {
            this.musicLinks.push(new DoublyLinkedList(`${i + 1}`));
        }
    }
    linkNodes() {
        /*
        ==========================================================
        HISTORY : 굳이 이렇게 가져올 필요가 없었던거 같다.
        ==========================================================
        for (let i = 0; i < (this.musicContents.length); i++) {
            if (i === 0) {
                this.musicLinks[i].prev = this.musicLinks[(this.musicContents.length) - 1]; //시작의 이전 > 마지막
                this.musicLinks[i].next = this.musicLinks[i + 1];
            } else if (i === ((this.musicContents.length) - 1)) {
                this.musicLinks[i].prev = this.musicLinks[i - 1];
                this.musicLinks[i].next = this.musicLinks[0]; //마지막 다음 > 시작점
            } else {
                this.musicLinks[i].prev = this.musicLinks[i - 1];
                this.musicLinks[i].next = this.musicLinks[i + 1];
            }
        }*/

        const musicLen = this.musicLinks.length;
        this.musicLinks.forEach((musicLink, i) => {
            // == 이전 노드 ==
            musicLink.prev = this.musicLinks[(i - 1 + musicLen) % musicLen];
            // == 다음 노드 ==
            musicLink.next = this.musicLinks[((i + 1) % musicLen)];
        });
    }
    getData() {
        const url = "http://kkms4001.iptime.org:45080";
        fetch(`${url}/musicList/`)
            .then((res) => { return res.json(); })
            .then((responseData) => {
                this.musicContents = responseData;
                // 메서드 호출
                this.createLinks();
                this.linkNodes();

                /* ====================================================
                = 비동기 흐름으로 인하여,,일단 여기서 musicPlayList Class 호출했다.
                = 여기서 클래스 호출하는게 적절한가 ? 
                ======================================================= */
                const musicPlayList = new MusicPlayList("musicPlayList", this.musicContents);
                musicPlayList.run(this.musicLinks);
            })
            .catch((err) => {
                console.log("Fetch ERROR: ", err);
            });
    }
    setNode() {
        this.getData(); //DB_Data
    }
}// End_MusicNode

// ^==MusicPlayList==
class MusicPlayList {
    constructor(id, DBData) {
        this.id = id;
        this.dbData = DBData;
        this.musicLinks = null;
        this.currentNode = null;
        this.currentMusicData = null;
        this.myMusicListData = null;
    }
    // ==NodeLink==
    setNodeLink(musicLinks) {
        this.currentNode = musicLinks[0]; // 초기 설정
        this.currentMusicData = this.dbData[this.currentNode.idx];
        this.musicLinks = musicLinks;
        this.updateDOM();
    }//
    prevNodeLink() {
        this.currentNode = this.currentNode.prev;
        this.currentMusicData = this.dbData[this.currentNode.idx];
        this.updateDOM();
        this.audioPlay(); // 넘기면 자동 재생
    }//
    nextNodeLink() {
        this.currentNode = this.currentNode.next;
        this.currentMusicData = this.dbData[this.currentNode.idx];
        this.updateDOM();
        this.audioPlay(); // 넘기면 자동 재생
    }//
    currentNodeLink() {
        this.currentNode = this.currentNode;
        this.currentMusicData = this.dbData[this.currentNode.idx];
        this.updateDOM();
        this.audioPlay(); // 넘기면 자동 재생
    }//
    moveToNextTrack() {
        /* 
        다음노드 이동시:
        - shuffleActiveBtn > 있다면 랜덤 재생
        - repeat-one > 있다면 해당 곡 repeat
        - 위가 해당 사항 없을 시 > 다음 노드 이동
        */
        const shuffleBtn = document.getElementById("shuffleBtn");
        const repeatBtn = document.getElementById("repeatBtn");

        if (shuffleBtn.classList.contains("shuffleActiveBtn")) {
            let randomNum = 0;
            for (let i = 0; i < this.musicLinks.length; i++) {
                randomNum = Math.floor(Math.random() * (this.musicLinks.length));
                if (randomNum !== this.currentNode.idx) {
                    break;
                }
            }
            this.currentNode = this.musicLinks[randomNum];
            this.currentMusicData = this.dbData[this.currentNode.idx];
            this.updateDOM();
            this.audioPlay();
        } else if (repeatBtn.classList.contains("xi-repeat-one")) {
            this.currentNodeLink();
        } else {
            this.nextNodeLink();
        }
    }//
    // ==eventListener==
    eventsListener(buttons) {
        const repeatBtn = document.getElementById("repeatBtn");
        const shuffleBtn = document.getElementById("shuffleBtn");
        const buttonObj = { ...buttons };
        // == forIn문으로 object순회 ==
        for (let button in buttonObj) {
            const eventType = buttonObj[button]; // 이벤트 타입
            // == 이벤트리스너 ==
            document.getElementById(button).addEventListener(eventType, (event) => {
                switch (event.target.id) {
                    // [좋아요]
                    case "heartBtn":
                        if (this.currentMusicData["isLiked"] == Boolean(false)) {
                            this.currentMusicData["isLiked"] = Boolean(true);
                            this.displayLiked(document.getElementById(event.target.id));
                        } else {
                            this.currentMusicData["isLiked"] = Boolean(false);
                            this.displayLiked(document.getElementById(event.target.id));
                        }
                        // === 서버로 보내는 값 ===
                        const [id, isLiked] = [
                            this.currentMusicData["id"],
                            this.currentMusicData["isLiked"]
                        ];

                        const url = "http://kkms4001.iptime.org:45080";
                        fetch(`${url}/likeStatus/`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                id: id,
                                isLiked: isLiked
                            })
                        })
                            .then((res) => { console.log(`[UPDATE DONE] id: ${id}, isLiked: ${isLiked}`) })
                            .catch((err) => {
                                console.log("Error_likeStatus: ", err);
                            });
                        break;

                    // [유튜브]
                    case "linkMovie":
                        window.open(`${this.currentMusicData["videoUrl"]}`);
                        break;

                    // [가사보기]
                    case "viewLyricsBtn":
                        document.getElementById("lyricsContWrap").style.display = "block";
                        document.getElementById("lyricsContTxt").innerText = this.currentMusicData["lyricsText"];
                        setTimeout(() => {
                            document.getElementById("lyricsContBox").style.top = "0";
                            document.getElementById("hidelyricsDownBtn").style.top = "0";
                            setTimeout(() => {
                                document.getElementById("lyricsBoxShadowAreaTop").style.display = "block";
                                document.getElementById("lyricsBoxShadowAreaBottom").style.display = "block";
                            }, 450);
                        }, 100);
                        break;
                    /* 
                // [가사닫기]
                case "hidelyricsBoxArea":
                    this.hidelyrics(100);
                    break;
                    */

                    // [가사닫기_BAR] (11/20)
                    case "hidelyricsDownBtn":
                        this.hidelyrics(100);
                        break;

                    // [playRange : input]
                    case "playRange":
                        document.getElementById("audioFile").currentTime = document.getElementById(event.target.id).value;
                        break;

                    // [재생버튼]
                    case "playBtn":
                        this.audioPlay();
                        break;

                    // [정지버튼]
                    case "stopBtn":
                        this.audioPause();
                        break;

                    // [audioFile : timeupdate]
                    case "audioFile":
                        // == DOM요소 ==
                        const [audioFile, playRange, playBtn] = [
                            document.getElementById("audioFile"),
                            document.getElementById("playRange"),
                            document.getElementById("playBtn")
                        ];

                        // == 시간계산 ==
                        const minutes = parseInt(audioFile.currentTime / 60);
                        const second = parseInt(audioFile.currentTime % 60);
                        const secondV = second < 10 ? ('0' + second) : second;
                        const currentPercent = (audioFile.currentTime / audioFile.duration) * 100;

                        playRange.value = audioFile.currentTime;
                        playRange.style.background = `linear-gradient(to right, #00c3ff ${currentPercent}%, #ddd ${currentPercent}%)`;

                        // == playListRange 표시 :: 그라디언트의 시작과 끝 지점이 동일 == 
                        document.getElementById("activePlayMusicRange").style.background = `linear-gradient(to right, #00c3ff ${currentPercent}%, #ddd ${currentPercent}%)`;
                        document.getElementById("startTime").textContent = `0${minutes}:${secondV}`;

                        // == 다음 곡 자동 재생  ==
                        if ((audioFile.currentTime === audioFile.duration) && (playBtn.style.display === "none")) {
                            this.moveToNextTrack();
                            audioFile.play();
                        }
                        break;

                    // [이전]
                    case "backwardBtn":
                        // 3초 이상 지났을 경우: 이전버튼 클릭시 현재곡이 다시 재생
                        if (document.getElementById("audioFile").currentTime > 2) {
                            this.currentNodeLink();
                        } else {
                            this.prevNodeLink();
                        }
                        break;

                    // [다음]
                    case "forwardBtn":
                        this.moveToNextTrack();
                        break;

                    // [반복: repeatBtn]
                    case "repeatBtn":
                        if (!repeatBtn.classList.contains("repeatActiveBtn")) {
                            repeatBtn.classList.add("repeatActiveBtn");
                        } else if (
                            repeatBtn.classList.contains("repeatActiveBtn") &&
                            !repeatBtn.classList.contains("xi-repeat-one")
                        ) {
                            repeatBtn.classList.add("xi-repeat-one");
                        } else if (
                            repeatBtn.classList.contains("xi-repeat-one") &&
                            repeatBtn.classList.contains("repeatActiveBtn")
                        ) {
                            repeatBtn.classList.remove("xi-repeat-one")
                            repeatBtn.classList.remove("repeatActiveBtn");
                        }
                        // shuffleBtn 버튼 중복방지
                        shuffleBtn.classList.remove("shuffleActiveBtn");
                        break;

                    // [랜덤: shuffleBtn] 
                    case "shuffleBtn":
                        shuffleBtn.classList.toggle("shuffleActiveBtn");
                        // repeatBtn 버튼 중복방지
                        if (shuffleBtn.classList.contains("shuffleActiveBtn")) {
                            repeatBtn.classList.remove("repeatOneActiveBtn");
                            repeatBtn.classList.remove("repeatActiveBtn");
                            repeatBtn.classList.remove("xi-repeat-one");
                        }
                        break;

                    // [equalizerBtn]
                    case "equalizerBtn":
                        const equalizerBtn = document.getElementById("equalizerBtn");
                        equalizerBtn.classList.toggle("equalizerActiveBtn");

                        if (equalizerBtn.classList.contains("equalizerActiveBtn")) {
                            document.getElementById("visualizerContent").style.display = "block";
                        } else {
                            document.getElementById("visualizerContent").style.display = "none";
                        }
                        break;

                    //========[리스트]==========
                    // [뮤직 리스트 보기_1 (Bottom)]
                    case "ListBtn":
                        this.showPlayList();
                        break;

                    // [뮤직 리스트 보기_2 (TOP)]
                    case "ListBtnTop":
                        this.showPlayList();
                        break;

                    // 1. [뮤직 리스트 닫기 >> icon: X]
                    case "playlistClose":
                        document.getElementById("playlistWrapBox").style.top = 100 + '%';
                        break;

                    // 2. [뮤직 리스트 닫기 >> 하단 img Click]
                    case "activePlayMusicImg":
                        document.getElementById("playlistWrapBox").style.top = 100 + '%';
                        break;

                    // [리스트_재생버튼]
                    case "playlistPlayBtn":
                        this.audioPlay();
                        break;

                    // [리스트_정지버튼]
                    case "playlistPauseBtn":
                        this.audioPause();
                        break;

                    // [리스트_이전버튼]
                    case "playlistBackwardBtn":
                        if (document.getElementById("audioFile").currentTime > 2) {
                            this.currentNodeLink();
                        } else {
                            this.prevNodeLink();
                        }
                        break;

                    // [리스트_다음버튼]
                    case "playlistForwardBtn":
                        this.moveToNextTrack();
                        break;

                    //========[My Music]==========
                    // [toggleInput]
                    case "toggleInput":
                        this.showPlayList();
                        break;


                }
            })
        }
    }//
    displayLiked(button) {
        if (this.currentMusicData["isLiked"] == Boolean(true)) {
            button.classList.remove('xi-heart-o');
            button.classList.add('xi-heart');
        } else {
            button.classList.add('xi-heart-o');
            button.classList.remove('xi-heart');
        }
    }//
    showPlayList() {
        const playlistWrapBox = document.getElementById("playlistWrapBox");
        playlistWrapBox.style.display = "block";
        playlistWrapBox.style.top = 0;
        // == 좋아요 토글 검사후 ==
        if (document.getElementById("toggleInput").checked) {
            this.toggleSetTimeOut(true);

            const url = "http://kkms4001.iptime.org:45080";
            fetch(`${url}/MyMusicList/`)
                .then((res) => { return res.json() })
                .then((responseData) => {
                    this.myMusicListData = responseData;
                    this.addMusicListItem(this.myMusicListData, true);
                })
                .catch((err) => {
                    console.log(`MyMusicList ERROR: ${err}`)
                })
        } else {
            this.addMusicListItem(this.dbData, false);
            this.toggleSetTimeOut(false);
        }
    }//
    toggleSetTimeOut(status) {
        const Text = status ? "ON" : "OFF";
        const leftStyle = status ? 38 : 64;
        setTimeout(() => {
            document.getElementById("toggleText").textContent = Text;
            document.getElementById("toggleText").style.left = leftStyle + "%";
        }, 80)
    }//
    audioPlay() {
        // ==재생==
        document.getElementById("playBtn").style.display = "none";
        document.getElementById("stopBtn").style.display = "block";

        document.getElementById("playlistPlayBtn").style.display = "none";
        document.getElementById("playlistPauseBtn").style.display = "block";

        document.getElementById("audioFile").play(); // 오디오재생

        // === visualizer ===
        if (!this.isVisualizerInitialized) {
            // visualizer가 아직 초기화되지 않은 경우에만 실행
            this.visualizer();
            this.isVisualizerInitialized = true; // 초기화 플래그 설정
        }

        // == 활성화 ==
        (this.musicLinks != null) && this.activePlayListMusicNode(this.musicLinks, false);
        (this.myMusicListData != null) && this.activePlayListMusicNode(this.myMusicListData, true);

        // == playListitem_scroll ==
        const playlistItemHeight = document.getElementById("playlistItem01").clientHeight; // 아이템 하나의 높이
        const playlistBoxHeight = document.getElementById("playlistBox").scrollHeight; // 스크롤 포함 전체 높이
        const topValue = (playlistItemHeight + ((playlistBoxHeight-(playlistItemHeight*12))/13)) * (Number(this.currentMusicData["id"]) - 1); // 1/n 되도록 (약간의 오차는 있음.)
        document.getElementById("playlistBox").scrollTo({ top: topValue, behavior: 'smooth' });
    }//
    audioPause() {
        // ==멈춤==
        document.getElementById("stopBtn").style.display = "none";
        document.getElementById("playBtn").style.display = "block";

        document.getElementById("playlistPlayBtn").style.display = "block";
        document.getElementById("playlistPauseBtn").style.display = "none";

        document.getElementById("audioFile").pause(); // 오디오멈춤
    }//
    loadAudioData(element) {
        element.addEventListener('loadedmetadata', () => {
            const minutes = parseInt((element.duration) / 60);
            const second = parseInt((element.duration) % 60);
            const secondV = second < 10 ? ('0' + second) : second;
            document.getElementById("playRange").max = element.duration;
            document.getElementById("endTime").innerText = `0${minutes}:${secondV}`;
        });
    }//
    hidelyrics(duration = 0) {
        document.getElementById("lyricsBoxShadowAreaTop").style.display = "none";
        document.getElementById("lyricsBoxShadowAreaBottom").style.display = "none";
        setTimeout(() => {
            document.getElementById("lyricsContBox").style.top = 100 + "%";
            document.getElementById("hidelyricsDownBtn").style.top = 100 + "%";
            setTimeout(() => {
                document.getElementById("lyricsContWrap").style.display = "none";
            }, (duration * 3))
        }, (duration));
    }//
    updateDOM() {
        const DomElement = {
            musicTitle: null, artistName: null,
            lyricsContTxt: null, photoArea: null,
            audioFile: null, bodyArea: null,
            wrap: null, activePlayMusicImg: null, activePlayMusicBox: null,
            lyricsContBox: null, lyricsBoxShadowAreaTop: null,
        }
        // ==DomID 할당==
        for (let key in DomElement) {
            if (document.getElementById(key)) {
                DomElement[key] = document.getElementById(key);
            }
        }
        // ==디스트럭처링==
        const {
            musicTitle, artistName,
            photoArea, audioFile, bodyArea, wrap,
            activePlayMusicImg, activePlayMusicBox, lyricsContBox,
        } = DomElement;
        // ==================================
        musicTitle.textContent = this.currentMusicData["title"];
        artistName.textContent = this.currentMusicData["artist"];
        // lyricsContTxt.textContent = this.currentMusicData["lyricsText"];
        photoArea.style.backgroundImage = `url(${this.currentMusicData["albumCover"]})`;

        // === bodyArea ===
        bodyArea.style.backgroundImage = `linear-gradient(rgba(255, 239, 233, 0.9),
          rgba(192, 186, 186, 0.85)), url(${this.currentMusicData["albumCover"]})`;

        // === audioFile ===
        audioFile.src = `${this.currentMusicData["audioFile"]}`;

        // === wrap - backgroundImage ===
        wrap.style.backgroundImage = `linear-gradient(rgba(24, 24, 24, 0.79),
          rgba(24, 24, 24, 0.82)), url(${this.currentMusicData["albumCover"]})`;

        // === playList - backgroundImage ===
        activePlayMusicImg.style.backgroundImage = `url(${this.currentMusicData["albumCover"]})`;
        activePlayMusicBox.style.backgroundImage = `linear-gradient(rgba(36, 36, 36, 0.78),
          rgba(24, 24, 24, 0.9)), url(${this.currentMusicData["albumCover"]})`;

        // === playRange ===
        playRange.value = 0;
        playRange.style.background = `linear-gradient(to right, #00c3ff 0%, #ddd 0%)`;

        // === lyricshBox - backgroundImage ===
        lyricsContBox.style.backgroundImage = `linear-gradient(to bottom,rgba(22, 22, 22, 0.9),
      rgba(22, 22, 22, 0.9)), url(${this.currentMusicData["albumCover"]})`;

        // == 가사영역 위치 초기화 ==
        document.getElementById("lyricsContWrap").scrollTo({ top: 0, behavior: 'smooth' });

        // === 곡이동시 ===
        // 가사 영역 감추기
        document.getElementById("lyricsBoxShadowAreaTop").style.display = "none";
        document.getElementById("lyricsBoxShadowAreaBottom").style.display = "none";
        // 비쥬얼라이즈 감추기
        document.getElementById("visualizerContent").style.display = "none";
        if (document.getElementById("equalizerBtn").classList.contains("equalizerActiveBtn")) {
            setTimeout(() => {
                document.getElementById("visualizerContent").style.display = "block";
            }, 380)
        }
        // #### 메서드 호출 ####
        // == 가사 안보이게 ==
        this.hidelyrics(0);
        // == 좋아요 업데이트 ==
        this.displayLiked(document.getElementById("heartBtn"));
    }//
    addMusicListItem(data = null, isUseId = Boolean) {
        document.getElementById("playlistBox").innerHTML = ""; // 초기화
        for (let i = 0; i < data.length; i++) {
            const itemNumber = isUseId ? data[i]["id"] : (i + 1);
            const isLikedDisplay = data[i]["isLiked"] ? `<i class="xi-heart listHeartBtn"></i>` : '';
            document.getElementById("playlistBox").innerHTML += `
           <article id="pItem${itemNumber}" class="playlistItem p${itemNumber}">
            <div id="pAlbum${itemNumber}" class="playlistAlbumImg"></div>
            <div class="playlistTxtBox pTxtBox${itemNumber}">
              <h2 id="playlistTitlemusic${itemNumber}" class="playlistTitle pTitle${i}">${data[i]["title"]}${isLikedDisplay}</h2>
              <p id="playlistArtistmusic${itemNumber}" class="playlistArtist pArtist${i}">${data[i]["artist"]}</p>
            </div>
            <i id="playListIconmusic${itemNumber}" class="xi-chart-bar iconSizeC"></i> 
            <span class="playlistDuration pTime${itemNumber}">${data[i]["audioDuration"].slice(0, 5)}</span>
            <div id="playlistItem0${itemNumber}" class="playlistItemCover"></div>
          </article> 
      `;
            document.getElementById(`pAlbum${itemNumber}`).style.backgroundImage = `url(${data[i]["albumCover"]})`;
        }//
        document.getElementById("playlistCount").textContent = data.length;
        this.activePlayListMusicNode(data, isUseId); // 활성화 아이템
    }
    activePlayListMusicNode(data = null, isUseId = Boolean) {
        for (let i = 0; i < data.length; i++) {
            const itemNumber = isUseId ? data[i]["id"] : (i + 1);
            if (document.getElementById(`playlistTitlemusic${itemNumber}`) &&
                document.getElementById(`playlistArtistmusic${itemNumber}`) &&
                document.getElementById(`playListIconmusic${itemNumber}`)
            ) {
                if (itemNumber === Number(this.currentMusicData["id"])) {
                    document.getElementById(`playlistTitlemusic${itemNumber}`).classList.add('pActive');
                    document.getElementById(`playlistArtistmusic${itemNumber}`).classList.add('pActive');
                    document.getElementById(`playListIconmusic${itemNumber}`).classList.add('pActiveIcon');
                } else {
                    document.getElementById(`playlistTitlemusic${itemNumber}`).classList.remove('pActive');
                    document.getElementById(`playlistArtistmusic${itemNumber}`).classList.remove('pActive');
                    document.getElementById(`playListIconmusic${itemNumber}`).classList.remove('pActiveIcon');
                }
            }
        }
    }//
    playListLink(element) {
        document.getElementById(element).addEventListener("click", (event) => {
            const targetId = event.target.id; // EX. playlistItem02
            if (targetId.match("playlistItem")) { // 리스트 아이템이 아닌 경우 무시
                const linkNum = Number(targetId.slice((targetId.length) - 2)) - 1;
                if (this.musicLinks[linkNum]) {
                    this.currentNode = this.musicLinks[linkNum];
                    this.currentMusicData = this.dbData[this.currentNode.idx];
                }
                // 뮤직재생화면도 바뀌어야함
                this.updateDOM();
                this.audioPlay();
            }
        });
    }//
    visualizer() {
        // ====주파수 실행 =====
        if (this.isVisualizerInitialized) return; // 중복 실행 방지
        const audio = document.getElementById("audioFile");
        const canvas = document.getElementById("canvas");
        this.context = new AudioContext();
        this.src = this.context.createMediaElementSource(audio);
        this.analyser = this.context.createAnalyser();
        const pen = canvas.getContext("2d");

        this.src.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        this.analyser.fftSize = 256;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        const barWidth = (WIDTH / bufferLength) * 4;

        const renderFrame = () => {
            requestAnimationFrame(renderFrame);
            this.analyser.getByteFrequencyData(dataArray);
            pen.clearRect(0, 0, WIDTH, HEIGHT); // 배경 클리어
            let x = 0; // 매 프레임마다 x 초기화

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                const r = 100 + (Math.sin(i * 0.1) * 100);
                const g = 150 + (Math.cos(i * 0.2) * 100);
                const b = 200 + (Math.sin(i * 0.3) * 50);

                // RGB 값이 0~255 범위를 넘지 않도록 방지
                pen.fillStyle = `rgb(${Math.min(Math.max(r, 0), 255)}, ${Math.min(Math.max(g, 0), 255)}, ${Math.min(Math.max(b, 0), 255)})`;
                pen.fillRect(x, HEIGHT - (barHeight / 5), barWidth, barHeight / 2);

                x += barWidth + 4; // 바 간격
            }
        };
        renderFrame();
        this.isVisualizerInitialized = true; // 초기화 상태 플래그 설정
    }//
    buttonObj() {
        const buttons = {
            heartBtn: "click", // 좋아요   
            linkMovie: "click", // 유튜브 
            viewLyricsBtn: "click", // 가사보기 
            // hidelyricsBoxArea: "click", // 가사닫기 
            hidelyricsDownBtn: "click", // 가사닫기_bar(11/20)
            playRange: "input", // range_bar 
            playBtn: "click", // 재생 
            stopBtn: "click", // 멈춤 
            backwardBtn: "click", // 이전 (<-) 
            forwardBtn: "click", // 다음 (->)
            repeatBtn: "click", // 반복 
            shuffleBtn: "click", // 셔플 
            equalizerBtn: "click", // 주파수
            audioFile: "timeupdate", // 

            // ====[리스트_Button]====
            ListBtn: "click", // 리스트보기 (BOTTOM)
            ListBtnTop: "click", // 리스트보기 (TOP) 
            playlistClose: "click", // 리스트닫기_1 (아이콘)
            activePlayMusicImg: "click", // 닫기_2 (이미지)
            playlistPlayBtn: "click", // 재생
            playlistPauseBtn: "click",// 멈춤 
            playlistBackwardBtn: "click",// 이전 (<-)
            playlistForwardBtn: "click", // 다음 (->)

            // ====[My Music]====
            toggleInput: "click",
        };
        return buttons;
    }//
    controlMusicListArea() {
        // 리스트영역 전용 Control
        this.addMusicListItem(this.dbData, false);
        this.playListLink("playlistBox"); // 리스트에서 선택
    }//
    run(musicLinks) {
        this.setNodeLink(musicLinks); // 뮤직 Node setting
        this.eventsListener(this.buttonObj()); // ALl_EventListener 
        this.loadAudioData(document.getElementById('audioFile')); // audio load_event
        this.controlMusicListArea(); // 리스트영역 전용 Control
    }//
}// End_MusicPlayList

window.onload = () => {
    // == 즉시 진입 지점 ==
    const main = (() => {
        const musicNode = new MusicNode("musicNode");
        musicNode.setNode();
    })();
} // 컨펌완료후 변경