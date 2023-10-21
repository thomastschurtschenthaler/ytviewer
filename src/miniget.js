Miniget.MinigetError = class MinigetError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
};
Miniget.defaultOptions = {
    maxRedirects: 10,
    maxRetries: 2,
    maxReconnects: 0,
    backoff: { inc: 100, max: 10000 },
};
function Miniget(url, options = {}) {
    const resp = fetch(url, {method:"GET"});
    let cberror=null; let cbdata=null; let cbend=null;
    let textfun = async () => {
        try {
            let restxt = await (await resp).text();
            if (url.indexOf("m.youtube.com/watch")>=0) {
                console.log("Miniget watch mobile");
                let i1 = restxt.indexOf("ytInitialData = ")+17;
                let i2 = restxt.indexOf("'", i1);
                let jsonStr = eval("'"+restxt.substring(i1, i2)+"'");
                //console.log("Miniget watch mobile jsonStr=", jsonStr);
                restxt+="<script>var ytInitialData = "+jsonStr+"</script>";
            }
            return restxt;
        } catch (e) {
            throw "miniget fetch fail url:"+url+"; e="+e;
        }
    }
    return {
        text: textfun,
        setEncoding: ()=>{},
        on:async (e, cb)=>{
            console.log("Miniget on", e);
            if (e=="error") {
                cberror=cb;
            } else if (e=="data") {
                cbdata=cb;
            } else if (e=="end") {
                cbend=cb;
                setTimeout(async ()=>{
                    try {
                        let text = await textfun();
                        cbdata(text);
                        cbend();
                    } catch (ex) {
                        console.log("Miniget on textfun error", ex);
                        cberror(ex);
                    }
                }, 1);
            }
        }
    };
}
module.exports = Miniget;