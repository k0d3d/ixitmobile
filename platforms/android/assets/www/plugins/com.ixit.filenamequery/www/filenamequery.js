cordova.define("com.ixit.filenamequery.IXITFileNameQuery", function(require, exports, module) { /**
 * cordova Web Intent plugin
 * Copyright (c) Boris Smus 2010
 *
 */
 (function(cordova){
    var IXITFileNameQuery = function() {

    };

    IXITFileNameQuery.prototype.getFileName = function(params, success, fail) {
        return cordova.exec(function(args) {
            success(args);
        }, function(args) {
            fail(args);
        }, 'IXITFileNameQuery', 'getFileName', [params]);
    };


    window.filenamequery = new IXITFileNameQuery();

    // backwards compatibility
    window.plugins = window.plugins || {};
    window.plugins.filenamequery = window.filenamequery;
})(window.PhoneGap || window.Cordova || window.cordova);

});
