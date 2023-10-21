module.exports = function(source) {
    return source.replaceAll("www.youtube.com", "'+(window.location.host=='m.youtube.com'?'m.youtube.com':'www.youtube.com')+'");
}