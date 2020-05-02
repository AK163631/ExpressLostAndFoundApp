const fs = require("fs")

function replaceTags(tagDict, templateFile) { // {"{{error}" : "user not found"}
    let buffer = fs.readFileSync(templateFile, 'utf8').toString();
    for (let key in tagDict) {
        buffer = buffer.replace(key, tagDict[key])
    }
    return buffer
}

//let ret = replaceTags({"{{error}}": "test error"}, "error.html")

module.exports = replaceTags

