(function() {
    function playNoMSE(video, videoinfos, startTime, vsource) {
        console.log("playNoMSE");
        video.removeAttribute("src");
        video.innerHTML="";
        let videosrc = document.createElement("source");
        videosrc.setAttribute("src", vsource!=null?vsource.url:videoinfos.audiovideo.url);
        videosrc.setAttribute("type", "video/mp4");
        video.appendChild(videosrc);
        video.load();
        if (startTime!=null) {
            video.currentTime=startTime;
        }
        video.play();
    }
    function startSourceBuffer(sbCB, mediaSource, url, mimeType, contentLength, chunkSize, chunkCnt, startTime) {
        try {
            let sourceBuffer = mediaSource.addSourceBuffer(mimeType);
            let updateendCb={finished:true, bussy:false}; let stopped=false;
            let loaded = {from:null, to:null, chunkSize:chunkSize, chunkCnt:chunkCnt, remStart:false, remEnd:false};
            sourceBuffer.addEventListener('updateend', function(e) {
                //console.log("updateend");
                if (stopped) return;
                try {
                    if (!updateendCb.finished) {
                        updateendCb.cb();
                    } else {
                        //console.log("sourceBuffer.buffered", sourceBuffer.buffered.length, sourceBuffer.buffered.start(0), sourceBuffer.buffered.end(0));
                        if (updateendCb.currentTime>20 && loaded.remStart && sourceBuffer.buffered.end(0)>updateendCb.currentTime+20) {
                            sourceBuffer.remove(0, updateendCb.currentTime-20);
                            loaded.remStart=false;
                            return;
                        }
                        if (loaded.remStart && sourceBuffer.buffered.end(0)<updateendCb.currentTime && (sourceBuffer.buffered.end(0)-sourceBuffer.buffered.start(0)>30)) {
                            sourceBuffer.remove(0, sourceBuffer.buffered.end(0)-20);
                            loaded.remStart=false;
                            return;
                        }
                        loadChunks(updateendCb.currentTime, true);
                    }
                } catch (e) {
                    console.log("sourceBuffer error", e);
                }
            });
            let loadChunks = (currentTime, cont) => {
                if (stopped) return;
                try {
                    if (!cont && updateendCb.bussy) {
                        console.log("startSourceBuffer already loading");
                        return;
                    }
                    if (sourceBuffer.updating) {
                        console.log("loadChunks - sourceBuffer.updating");
                        return;
                    }
                    let from=null; 
                    if (currentTime==null || loaded.from==null) {
                        from=0;
                    } else {
                        if (sourceBuffer.buffered.length>0 && currentTime>sourceBuffer.buffered.end(0)-20) {
                            //console.log("startSourceBuffer loading new chunks on to");
                            from = loaded.to;
                        } else if (sourceBuffer.buffered.length>0 && currentTime<sourceBuffer.buffered.start(0)) {
                            //console.log("startSourceBuffer rewind - reloading video");
                            stopped=true;
                            sbCB.reload();
                            return;
                        } else {
                            updateendCb.bussy=false;
                            return;
                        }
                    }
                    //console.log("startSourceBuffer loading chunks");
                    let ccnt=0;
                    updateendCb = {finished:false, bussy:true, currentTime:currentTime!=null?currentTime:0};
                    updateendCb.cb = (() => {
                        let f = from+loaded.chunkSize*ccnt;
                        if (f>=contentLength) {
                            console.log("stream end reached");
                            ccnt=0;
                            updateendCb.finished=true;
                            updateendCb.bussy=false;
                            updateendCb.cb=null;
                            return;
                        }
                        let t = f+loaded.chunkSize;
                        if (t>=contentLength) {
                            console.log("stream contentLength reached");
                            t=contentLength;
                        }
                        let furl = url+"&range="+f+"-"+(t-1);
                        let retry = (err)=>{
                            console.log("retry fetch", furl, err);
                            if (!stopped) setTimeout(doFetch, 1000);
                        }
                        let doFetch = ()=> {
                            fetch(furl).then((r)=>{
                                r.arrayBuffer().then((b)=>{
                                    //console.log("startSourceBuffer appendBuffer");
                                    try {
                                        if (!stopped) sourceBuffer.appendBuffer(b);
                                    } catch (e) {
                                        console.log("appendBuffer error", e);
                                    }
                                }).catch(retry);
                            }).catch(retry);
                        }
                        doFetch();
                        ccnt++;
                        if (ccnt>=loaded.chunkCnt) {
                            //console.log("chunks loaded ",ccnt, loaded.chunkCnt);
                            ccnt=0;
                            updateendCb.finished=true;
                            updateendCb.cb=null;
                        }
                    }).bind(updateendCb);
                    loaded.from=from;
                    loaded.to=from+loaded.chunkSize*loaded.chunkCnt;
                    loaded.remStart=true; loaded.remEnd=true;
                    updateendCb.cb();
                } catch (e) {
                    console.log("loadChunks error", e);
                }
            };
            loadChunks(startTime);
            return {
                currentTime:(currentTime) => {
                    loadChunks(currentTime);
                },
                stop:() => {
                    console.log("sourceBuffer stop");
                    stopped=true;
                }
            };
        } catch (e) {
            console.log("MSE startSourceBuffer error: ",e);
            throw e;
        }

    }
    let videoSb = null; let audioSb = null; let timeUpdate=null;
    function play(videoinfos, startTime) {
        if (videoinfos.video[videoinfos.quality].hasAudio || videoinfos.video[videoinfos.quality].audioQuality!=null || videoinfos.video[videoinfos.quality].isHLS) {
            console.log("audio and video");
            playNoMSE(this, videoinfos, startTime, videoinfos.video[videoinfos.quality]);
            return;
        }
        if (!window.MediaSource) {
            console.log("MediaSource not supported");
            playNoMSE(this, videoinfos, startTime, videoinfos.video[videoinfos.quality]);
            return;
        }
        
        let video = this; let reloading=false;
        let mediaSource = new MediaSource();
        video.src = URL.createObjectURL(mediaSource);
        let reload=()=>{
            if (!reloading) {
                reloading=true;
                console.log("reloading video", video.currentTime);
                if (timeUpdate!=null) clearInterval(timeUpdate);
                video.pause();
                play.bind(video)(videoinfos, video.currentTime);
            }
        };
        let eosA=false; let eosV=false;
        let endOfStream=()=>{
            if (eosA && eosV) {
                console.log("end of streams");
                mediaSource.endOfStream();
            }
        }
        let sbCBA = {
            "reload": reload,
            "endOfStream": ()=>{
                eosA=true; endOfStream();
            }
        }
        let sbCBV = {
            "reload": reload,
            "endOfStream": ()=>{
                eosV=true; endOfStream();
            }
        }
        mediaSource.addEventListener('sourceopen', (e)=>{
            try {
                URL.revokeObjectURL(video.src);
                let videosrc = videoinfos.video[videoinfos.quality];
                videoSb = startSourceBuffer(sbCBV, mediaSource, videosrc.url, videosrc.mimeType, videosrc.contentLength, 1000000, 14, startTime);
                audioSb = startSourceBuffer(sbCBA, mediaSource, videoinfos.audio.url, videoinfos.audio.mimeType, videoinfos.audio.contentLength, 100000, 14, startTime);
                running=true;

                timeUpdate = setInterval(()=>{
                    //console.log("current time", video.currentTime);
                    if (video.duration>0) {
                        videoSb.currentTime(video.currentTime);
                        audioSb.currentTime(video.currentTime);
                    }
                }, 1000);
                video.onerror = (event) => {
                    console.log("video error", event);
                };
                let _play=false;
                if (startTime!=null) {
                    video.currentTime=startTime;
                }
                let loadstate = ()=>{
                    if (video.readyState==4 && !_play) {
                        console.log("play");
                        _play=true;
                        video.play();
                    } else {
                        setTimeout(loadstate, 1000);
                    }
                };
                loadstate();
            } catch (ex) {
                console.log("MSE error: ",e);
                video.src=null; if (timeUpdate!=null) clearInterval(timeUpdate);
                playNoMSE(video, videoinfos, startTime);
            }
        });
    }
    window.YTMSEPlayer = function(video) {
        return {
            play:play.bind(video),
            destroy:()=>{
                video.src=null;
                if (videoSb!=null) videoSb.stop();
                if (audioSb!=null) audioSb.stop();
                if (timeUpdate!=null) clearInterval(timeUpdate);
            }
        };
    };
})();