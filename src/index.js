window.ytdl = require("ytdl-core");
window.Hls = require("hls.js");

window.process = {
    env: {
        YTDL_NO_UPDATE:true
    }
};
