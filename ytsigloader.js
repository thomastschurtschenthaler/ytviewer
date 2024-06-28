module.exports = function(source) {
    return source;
    //return source.replace("${utils.cutAfterJS(subBody)};${functionName}(ncode);", '${subBody.substring(0, subBody.indexOf("}", subBody.indexOf("join"))+1)};${functionName}(ncode);');
}