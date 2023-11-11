(async function() {
    window.YTViewer_Player = function() {
        let player = document.createElement("div");
        player.style.position="fixed";
        player.style.top="0px";
        player.style.left="0px";
        player.style.width="auto";
        player.style.height="auto";
        player.style.zIndex="10000";
        player.style.backgroundColor="rgba(0, 0, 0, 0.3)";
        let info = document.createElement("div");
        info.style.position="absolute";
        info.style.top="10px";
        info.style.left="10px";
        info.style.width="8rem";
        info.style.height="1.8rem";
        info.style.fontSize="1.5rem";
        info.style.backgroundColor="#33aa33";
        info.style.color="#eeeeee";
        info.style.paddingLeft="1rem";
        info.style.cursor="pointer";
        info.style.borderRadius="1rem";
        info.innerHTML="YTViewer";
        info.addEventListener("click", (e)=>{
            if (window.location.href.indexOf("?")>=0) {
                let urlParams = new URLSearchParams(window.location.href.substring(window.location.href.lastIndexOf("?")+1));
                let videoid = urlParams.get("v");
                if (videoid!=null) {
                    window._ytviewer.play(videoid);
                    return;
                }
            }
            alert("YTViewer - click on a youtube thumbnail to play the video.\n\nAuthor: Thomas Tschurtschenthaler");
        });
        player.appendChild(info);
        document.body.appendChild(player); 
        let video=null; let buttons=null; let pvideoid=null; let ytplayer = null;
        let closeVideo = ()=>{
            if (video!=null) {
                player.removeChild(video);
                player.removeChild(buttons);
                player.style.width="auto";
                player.style.height="auto";
                info.style.display="inline";
                ytplayer.destroy();
                video=null; buttons=null;pvideoid=null; ytplayer=null;
            }
        };
        return {
            isplaying(videoid) {
                return (videoid==pvideoid);
            },
            play:async (videoid, videoinfos)=>{
                closeVideo();

                let getVideoInfos = async ()=> {
                    let ytinfo = null;
                    try {
                        ytinfo = await ytdl.getInfo(videoid, {});
                    } catch (e) {
                        player.innerHTML="Error:"+e;
                        return;
                    }
                    let getQuality = (qualityLabel)=>{
                        let r = "";
                        if (qualityLabel==null) qualityLabel="144p";
                        for (let i=0; i<qualityLabel.length; i++) {
                            let d = qualityLabel.substring(i, i+1);
                            if (d>="0" && d<="9") {
                                r+=d;
                            } else {
                                return r*1;
                            }
                        }
                    }
                    let qualitiessort = (f1, f2)=>{
                        return getQuality(f2.qualityLabel)-getQuality(f1.qualityLabel);
                    };
                    ytinfo.formats=ytinfo.formats.sort(qualitiessort);
                    console.log("formats", ytinfo.formats);
                    let audio = ytinfo.formats.filter((f)=>{return (!f.isHLS && f.hasAudio && !f.hasVideo);});
                    let audiovideos = ytinfo.formats.filter((f)=>{return (f.hasAudio && f.hasVideo)});
                    let audiovideo = audiovideos.length>0?audiovideos[0]:null;
                    let vqualities = [];
                    let video = ytinfo.formats.filter((f)=>{return (f.hasVideo && (window.MediaSource || f.hasAudio));})
                        .filter((v)=>{if (vqualities.indexOf(v.qualityLabel)<0 && (audiovideo==null || v==audiovideo || v.qualityLabel!=audiovideo.qualityLabel)){vqualities.push(v.qualityLabel); return true;}; return false});
                    let _videoinfos={"ytinfo":ytinfo, 
                                "formats":ytinfo.formats.filter((f)=>{return (!f.isHLS);}),
                                "audio":audio.length>0?audio[0]:null,
                                "video":video,
                                "quality":0,
                                "audiovideo":audiovideo
                                };
                    console.log("_videoinfos", _videoinfos);
                    return _videoinfos;
                }
                if (videoinfos==null) {
                    let retrycnt=0;
                    let retry = async (resolve, err) => {
                        retrycnt++;
                        console.log("probe fetch error", err, retrycnt);
                        if (retrycnt>=5) {
                            console.log("probe fetch max retries reached");
                            videoinfos.video[0]=videoinfos.audiovideo;
                            resolve(videoinfos);
                        } else {
                            console.log("probe fetch retry #"+retrycnt);
                            videoinfos = await getAndProbeVideoInfos();
                            resolve(videoinfos);
                        }
                    };
                    let getAndProbeVideoInfos = async () => {
                        videoinfos = await getVideoInfos();
                        if (!videoinfos.video[0].hasAudio && videoinfos.audio!=null) {
                            return new Promise(resolve => {
                                fetch(videoinfos.video[0].url+"&range=0-1000").then((r)=>{r.arrayBuffer().then((b)=>{
                                    console.log("video probe success");
                                    fetch(videoinfos.audio.url+"&range=0-1000").then((r)=>{r.arrayBuffer().then((b)=>{
                                        console.log("audio probe success");
                                        resolve(videoinfos);
                                    }).catch(retry);}).catch((e)=>{retry(resolve, e);});
                                }).catch(retry);}).catch((e)=>{retry(resolve, e);});
                            
                            });
                        }
                        return videoinfos;
                    }
                    videoinfos = await getAndProbeVideoInfos();
                }

                pvideoid=videoid;
                player.style.width="100%";
                player.style.height="100%";
                info.style.display="none";

                video = document.createElement("video");
                video.setAttribute("controls", "true");
                video.setAttribute("tabindex", "0");
                video.setAttribute("width", "80%");
                video.setAttribute("height", "80%");
                video.style.marginLeft="10%";
                video.style.marginTop="5%";
                player.appendChild(video);
                video.addEventListener("keydown", (e)=>{
                    e.stopPropagation();
                    if (e.key=="Escape") {
                        e.preventDefault();
                        closeVideo();
                    } else if (e.key==" ") {
                        e.preventDefault();
                        if (video.paused) {
                            video.play();
                        } else {
                            video.pause();
                        }
                    }
                }, true);
                video.focus();
                ytplayer = new YTMSEPlayer(video);
                ytplayer.play(videoinfos);

                buttons = document.createElement("div");
                buttons.style.position="absolute";
                buttons.style.top="10px";
                buttons.style.left="10px";
                buttons.style.width="10rem";
                buttons.style.height="1.8rem";
                player.appendChild(buttons);

                let close = document.createElement("div");
                close.style.position="absolute";
                close.style.top="0px";
                close.style.left="0px";
                close.style.width="2.4rem";
                close.style.height="1.8rem";
                close.style.fontSize="1.5rem";
                close.style.backgroundColor="#aa3333";
                close.style.color="#eeeeee";
                close.style.cursor="pointer";
                close.style.borderRadius="1rem";
                close.innerHTML="<div style='position:relative; left:0.8rem; top:-0.1rem'>x</div>";
                close.setAttribute("title", "Close");
                close.addEventListener("click", (e)=>{
                    closeVideo();
                });
                buttons.appendChild(close);
        
                let mini = document.createElement("div");
                mini.style.position="absolute";
                mini.style.top="0px";
                mini.style.left="3rem";
                mini.style.width="2.4rem";
                mini.style.height="1.8rem";
                mini.style.fontSize="1.5rem";
                mini.style.backgroundColor="#aa8822";
                mini.style.color="#eeeeee";
                mini.style.cursor="pointer";
                mini.style.borderRadius="1rem";
                mini.setAttribute("title", "Minimize");
                let minispan = "<div style='position:relative; left:0.6rem'>—</div>";
                mini.innerHTML=minispan;
                let minmized=false;
                mini.addEventListener("click", (e)=>{
                    if (minmized) {
                        mini.innerHTML=minispan;
                        player.style.width="100%";
                        player.style.height="100%";
                        video.style.display="inline";
                    } else {
                        mini.innerHTML="<div style='position:relative; left:0.4rem; top:-0.2rem;'>＋</div>";
                        player.style.width="auto";
                        player.style.height="auto";
                        video.style.display="none";
                    }
                    minmized=!minmized;
                });
                buttons.appendChild(mini);

                if (videoinfos!=null && videoinfos.formats.length>0) {
                    let dl = document.createElement("div");
                    dl.style.position="absolute";
                    dl.style.top="0px";
                    dl.style.left="19rem";
                    dl.style.width="2.4rem";
                    dl.style.height="1.8rem";
                    dl.style.fontSize="1.4rem";
                    dl.style.backgroundColor="#8822aa";
                    dl.style.color="#eeeeee";
                    dl.style.cursor="pointer";
                    dl.style.borderRadius="1rem";
                    dl.setAttribute("title", "Download");
                    dl.innerHTML="<div style='position:relative; left:0.8rem; top:-0.1rem'>↧</div>";
                    dl.addEventListener("click", (e)=>{
                        let formats = [];
                        let videoaudio = videoinfos.formats.filter((f)=>{return (f.hasAudio && f.hasVideo)});
                        let video = videoinfos.formats.filter((f)=>{return (f.hasVideo)});
                        let audio = videoinfos.formats.filter((f)=>{return (f.hasAudio && !f.hasVideo)});
                        if (videoaudio.length>0) {videoaudio[0]._dltitle="_Video_and_Audio"; formats.push(videoaudio[0])};
                        if (video.length>0) {video[0]._dltitle="_Video"; formats.push(video[0])};
                        if (audio.length>0) {audio[0]._dltitle="_Audio"; formats.push(audio[0])};
                        dl.innerHTML="";
                        formats.forEach(f=>{
                            let dllink = document.createElement('a');
                            dllink.innerHTML=videoinfos.ytinfo.videoDetails.title+f._dltitle+".mp4";
                            dllink.href = f.url;
                            dllink.style.display="block";
                            dllink.download = videoinfos.ytinfo.videoDetails.title+f._dltitle+".mp4";
                            dllink.style.color="#eeeeee";
                            dllink.style.fontSize="1rem";
                            dllink.style.marginBottom="0.4rem";
                            dllink.style.marginTop="0.4rem";
                            dllink.style.marginLeft="0.4rem";
                            dllink.style.marginRight="0.4rem";
                            dl.appendChild(dllink);
                            dl.style.width="auto";
                            dl.style.height="auto";
                            buttons.style.width="100rem";
                        });
                    });
                    buttons.appendChild(dl);
                }

                let quality = document.createElement("select");
                quality.style.position="absolute";
                quality.style.top="0px";
                quality.style.left="8rem";
                quality.style.width="9rem";
                quality.style.height="1.8rem";
                quality.style.fontSize="1.3rem";
                quality.style.backgroundColor="#2288aa";
                quality.style.color="#eeeeee";
                quality.style.cursor="pointer";
                quality.style.borderRadius="1rem";
                quality.style.border="0";
                
                for (let i=0;i<videoinfos.video.length;i++) {
                    let vidsrc = videoinfos.video[i];
                    let qo = document.createElement("option");
                    qo.setAttribute("value", i+"");
                    qo.innerText=vidsrc.qualityLabel;
                    quality.appendChild(qo);
                }
                quality.addEventListener("change", (e)=>{
                    videoinfos.quality = quality.value*1;
                    let currentTime = video.currentTime;
                    ytplayer.destroy();
                    ytplayer.play(videoinfos, currentTime);
                    video.focus();
                });
                buttons.appendChild(quality);
            }
        }
    }
    if (window.location.host.indexOf("youtube.com")<0) {
        alert("Use YTViewer on Youtube pages www.youtube.com or m.youtube.com.");
        return;
    }
    if (window._ytviewer==null) {
        let style=document.createElement('style');
        style.innerText='video:focus, select:focus {outline: none;}';
        document.body.appendChild(style);
        if (document.body!=null) {
            document.body.addEventListener("click", async (e)=>{
                if (e.target.closest('a[href^="/watch?"]') || e.target.closest("ytd-thumbnail")) {
                    
                    let videoLink = e.target.closest('a[href^="/watch?"]').href;
                    console.log("videoLink", videoLink);
                    let urlParams = new URLSearchParams(videoLink.substring(videoLink.lastIndexOf("?")+1));
                    let videoid = urlParams.get("v");
                    console.log("videoid", videoid);
                    if (window._ytviewer.isplaying(videoid)) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();        
                    window._ytviewer.play(videoid);
                    
                }
            }, true);
        }
        window._ytviewer = window.YTViewer_Player();
        console.log("ytviewer started");
    }
    if (window.location.href.indexOf("?")>=0) {
        let urlParams = new URLSearchParams(window.location.href.substring(window.location.href.lastIndexOf("?")+1));
        let videoid = urlParams.get("v");
        if (videoid!=null) {
            window._ytviewer.play(videoid);
        }
    }
})();