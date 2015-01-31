    var fileChooser = {};
    function successCallback (params) {
        console.log(params);
    }

    function failureCallback (err) {
        console.log(err);
    }


    fileChooser.exampleConfiguration = { "publicKey": "", "cooldownPeriod": -1, "enableOnFirstRun": true, "enableBackgroundModeWarning": true };
    fileChooser.init = function(configuration, successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "initPlot", [configuration]);
    };
    fileChooser.enable = function(successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "enable", []);
    };
    fileChooser.disable = function(successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "disable", []);
    };
    fileChooser.isEnabled = function(successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "isEnabled", []);
    };
    fileChooser.setCooldownPeriod = function(cooldownSeconds, successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "setCooldownPeriod", [cooldownSeconds]);
    };
    fileChooser.setEnableBackgroundModeWarning = function(enableWarning, successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "setEnableBackgroundModeWarning", [enableWarning]);
    };
    fileChooser.getVersion = function(successCallback, failureCallback) {
         cordova.exec(successCallback, failureCallback, "FileChooserExampleActivity", "getVersion", []);
    };
    module.exports = fileChooser;
