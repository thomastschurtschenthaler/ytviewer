window.ytdl = require("ytdl-core");
/*window.ytdl = {
    getInfo: require("../node_modules/ytdl-core/lib/info")
};*/
window.process = {
    env: {
        YTDL_NO_UPDATE:true
    }
};
