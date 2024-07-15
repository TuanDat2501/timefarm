const fs = require('fs');

function getData(pathFile){
    try {
        var result;  
        var data = fs.readFileSync(pathFile, 'utf8').toString();
        result = data.split('\r\n');
        return result
    } catch(e) {
        console.log('Error:');
    }
}
module.exports = { getData }