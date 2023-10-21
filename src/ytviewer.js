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
        let video=null; let buttons=null; let pvideoid=null;
        let closeVideo = ()=>{
            if (video!=null) {
                player.removeChild(video);
                player.removeChild(buttons);
                player.style.width="auto";
                player.style.height="auto";
                info.style.display="inline";
                video=null; buttons=null;pvideoid=null;
            }
        };
        return {
            isplaying(videoid) {
                return (videoid==pvideoid);
            },
            play:async (videoid, videourl, videoinfos)=>{
                closeVideo();
                if (videourl==null) {
                    let ytinfo = null;
                    try {
                        ytinfo = await ytdl.getInfo(videoid, {});
                    } catch (e) {
                        player.innerHTML="Error:"+e;
                        return;
                    }
                    console.log("videoInfo", ytinfo);
                    let qualities = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p", "4320p"];
                    let qualitiessort = (f1, f2)=>{
                        let q1 = qualities.indexOf(f1.qualityLabel);
                        let q2 = qualities.indexOf(f2.qualityLabel);
                        return q2-q1;
                    };
                    let formatvideo=ytinfo.formats.filter((f)=>{return (f.hasAudio && f.hasVideo)}).sort(qualitiessort);
                    console.log("formatvideo", formatvideo);
                    videourl = formatvideo[0].url;
                    videoinfos={"ytinfo":ytinfo, "formats":ytinfo.formats.filter((f)=>{return (!f.isHLS);}).sort(qualitiessort)};
                }

                pvideoid=videoid;
                player.style.width="100%";
                player.style.height="100%";
                info.style.display="none";
                video = document.createElement("video");
                video.setAttribute("controls", "true");
                video.setAttribute("width", "80%");
                video.setAttribute("height", "80%");
                video.style.marginLeft="10%";
                video.style.marginTop="5%";
                let videosrc = document.createElement("source");
                videosrc.setAttribute("src", videourl);
                videosrc.setAttribute("type", "video/mp4");
                video.appendChild(videosrc);
                player.appendChild(video);
                video.load();
                video.play();
        
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
                    dl.style.left="6rem";
                    dl.style.width="2.4rem";
                    dl.style.height="1.8rem";
                    dl.style.fontSize="1.5rem";
                    dl.style.backgroundColor="#8822aa";
                    dl.style.color="#eeeeee";
                    dl.style.cursor="pointer";
                    dl.style.borderRadius="1rem";
                    dl.setAttribute("title", "Download");
                    dl.innerHTML="<div style='position:relative; left:0.8rem; top:-0.1rem'>↧</div>";
                    dl.addEventListener("click", (e)=>{
                        let formats = [];
                        let videoaudio = videoinfos.formats.filter((f)=>{return (f.hasAudio && f.hasVideo)});
                        let video = videoinfos.formats.filter((f)=>{return (!f.hasAudio && f.hasVideo)});
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
            }
        }
    }
    if (window.location.host.indexOf("youtube.com")<0) {
        alert("Use YTViewer on Youtube pages www.youtube.com or m.youtube.com.");
        return;
    }
    if (window._ytviewer==null) {
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