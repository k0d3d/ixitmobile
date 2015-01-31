var exec = require('cordova/exec');

exports.getFileName = function(arg0, success, error) {
    exec(success, error, "IXITFileNameQuery", "getFileName", [arg0]);
};
