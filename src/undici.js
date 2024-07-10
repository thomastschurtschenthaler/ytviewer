let request = async function(url, requestOptions) {
    console.log("request:",url);
    let resp = await fetch(url, {method:requestOptions!=null && requestOptions.method!=null?requestOptions.method:"GET"});
    let headers = {};
    for (const pair of resp.headers.entries()) {
        headers[pair[0]]=pair[1];
    }
    console.log("headers:",headers);
    return {
        statusCode: ""+resp.status,
        headers:headers,
        body: {
            text:()=>{
                console.log("request text()");
                return resp.text();
            },
            json:()=>{
                console.log("request json()");
                return resp.json();
            }
        }
    };
};
module.exports = {
    request: request
}