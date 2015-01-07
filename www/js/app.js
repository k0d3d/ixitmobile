(function () {
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'ixitApp' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'ixitApp.controllers' is found in controllers.js
var app = angular.module('ixitApp', [
  'ionic',
  'ngCordova',
  'flow',
  'auth',
  'directives',
  'controllers',
  'services',
  'ixitApp.config'
  ]);

app.run(['$ionicPlatform', '$rootScope', 'appBootStrap', '$document', function($ionicPlatform, $rootScope, appBootStrap, $document) {



  document.addEventListener("deviceready", function () { console.log('in run ready');}, false);

  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    //set up and init image caching
    // write log to console
    ImgCache.options.debug = false;

    // increase allocated space on Chrome to 50MB, default was 10MB
    ImgCache.options.chromeQuota = 50*1024*1024;
    ImgCache.init(function(){
      //small hack to dispatch an event when imgCache is
      //full initialized.
      $rootScope.$broadcast('ImgCacheReady');
    }, function(){
        alert('ImgCache init: error! Check the log for errors');
    });

    $ionicPlatform.onHardwareBackButton(function () {
        // if(angular.element('#login-modal')) { // your check here
        //     $ionicPopup.confirm({
        //       title: 'System warning',
        //       template: 'are you sure you want to exit?'
        //     }).then(function(res){
        //       if( res ){
        //         navigator.app.exitApp();
        //       }
        //     });
        // }
    });

    window.plugins.webintent.getExtra(window.plugins.webintent.EXTRA_STREAM,
        function(url) {
          console.log(url);
            // url is the value of EXTRA_TEXT
        }, function() {
            // There was no extra supplied.
            console.log('Nothing sent in');
        }
    );
    window.plugins.webintent.getUri(function(url) {
      if(url !== "") {
        // url is the url the intent was launched with
        console.log(url);
      }
    });
    window.plugins.webintent.onNewIntent(function(url) {
      console.log(url);
        if(url !== "") {
            // url is the url that was passed to onNewIntent
        }
    });


  });

}]);

app.config(function($stateProvider, $urlRouterProvider, $httpProvider, flowFactoryProvider) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      views: {
        'mainContent' : {
          templateUrl: "templates/app.html",
          controller: 'AppCtrl'
        }
      }
    })

    .state('app.files', {
      url: "/files",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/files.html",
          controller: 'FilesCtrl',
          resolve: {
            userRootCabinet: function (Keeper) {
              return Keeper.thisUserFiles({});
            }
          }
        }
      }
    })
    .state('app.upload', {
      url: "/upload",
      views: {
        'viewContent@app' :{
          templateUrl: "templates/upload.html",
          controller: 'UploaderCtrl'
        }
      }
    })
    .state('app.login', {
      url: "/auth/login",
      views: {
        'viewContent@app' :{
          controller: ['$ionicModal', function ($ionicModal) {
            $ionicModal.fromTemplateUrl('templates/auth/login.html',
              {
                // scope: $scope,
                animation: 'slide-in-up',
                focusFirstInput: true,
                backdropClickToClose: false,
                hardwareBackButtonClose: false
              }
            ).then(function (modal) {
              modal.show();
            });
            // appBootStrap.loginModal.show();
          }]
        }
      }
    })
    .state('app.account', {
      url: "/account",
      views: {
        'menuContent' :{
          templateUrl: "templates/account.html",
          // controller: 'PlaylistsCtrl'
        }
      }
    });

    flowFactoryProvider.defaults = {
        target:'http://localhost:3001/upload',
        chunkSize:1*1024*1024,
        simultaneousUploads:4,
        testChunks:true,
        maxFiles: 10,
        // query: function queryParams (fileObj, chunkObj){
        //   return {
        //     fileType : fileObj.file.type.length > 0 ? fileObj.file.type : 'noMime',
        //     // throne: Keeper.currentUser
        //   };
        // },
        permanentErrors:[404, 500, 501],
        maxChunkRetries: 1,
        chunkRetryInterval: 5000,
    };
    // You can also set default events:
    flowFactoryProvider.on('progress', function (event) {
      // ...
      // console.log('progress', arguments);
    });
    flowFactoryProvider.on('error', function () {
      // ...
      console.log(arguments);
    });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/upload');

  $httpProvider.interceptors.push('tokenInterceptor');
  $httpProvider.interceptors.push('connectionInterceptor');
  $httpProvider.interceptors.push(['$rootScope', '$q', function($rootScope, $q) {
    return {
      responseError: function(response) {
        if (response.status === 401) {
          $rootScope.$broadcast('auth-loginRequired');
        }
        // otherwise, default behaviour
        return $q.reject(response);
      }
    };
  }]);
});

app.controller('MainCtrl', ['$scope', function ($scope) {

}]);

app.controller('AppCtrl',
  [
  '$scope',
  '$state',
  'appBootStrap',
  '$ionicLoading',
  '$ionicActionSheet',
  '$timeout',
  'appServices',
  'cordovaServices',
  '$window',
  function($scope, $state, appBootStrap, $ionicLoading, $ionicActionSheet, $timeout, appServices, cordovaServices, $window) {

  var connection;
  $scope.isConnected = false;
  // $scope.loginModal = "";
  $scope.currentFolderView = null;
  $scope.currentDirEntries = {
    dir: [],
    files: []
  };

  // $scope.$watch('isConnected', function (n) {
  //   if (!n) {
  //     $ionicLoading.show({
  //       template: '<i class="ion-looping" data-pack="default" data-tags="refresh, animation" data-animation="true"></i>'
  //     });
  //   } else {
  //     $ionicLoading.hide();
  //   }
  // });
  //
  // $scope.doLogin =

  //load login modal
  // $ionicModal.fromTemplateUrl('templates/auth/login.html',
  //   {
  //     scope: $scope,
  //     animation: 'slide-in-up',
  //     focusFirstInput: true,
  //     backdropClickToClose: false,
  //     hardwareBackButtonClose: false
  //   }
  // ).then(function (modal) {
  //   $scope.loginModal = modal;
  // });

  //load file browser modal
  // $ionicModal.fromTemplateUrl('templates/inc/browse-files.html',
  //   {
  //     scope: $scope,
  //     animation: 'slide-in-up',
  //     focusFirstInput: true,
  //     backdropClickToClose: false,
  //     hardwareBackButtonClose: true
  //   }
  // ).then(function (modal) {
  //   $scope.fileBrowser = modal;
  // });

  // Opens an action panel so the user can choose what type
  // of upload they wish to make
  $scope.select_up_action = function () {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
       { text: 'Picture or Video' },
       { text: 'Other Files' },
       { text: 'A Folder' }
      ],
      titleText: 'What do you want to upload?',
      cancelText: 'Cancel',
      cancel: function() {
          // add cancel code..
        },
      buttonClicked: function(index) {
        $scope.fileBrowser.show();

        return true;
      }
    });
    // // For example's sake, hide the sheet after two seconds
    // $timeout(function() {
    //  hideSheet();
    // }, 2000);
  };

  $scope.start_uploading  = function (FLOW) {
    if (FLOW.files.length) {
      FLOW.upload();
    } else {
      $cordovaToast.showShortBottom('There are no files queued');
    }
  };

  // $scope.loginModal = appBootStrap.loginModal;

  //checks if there is an authorization token on
  //our localStorage
  if (!$window.localStorage.authorizationToken) {
    $state.go('splash.welcome');
  }

  $scope.$on('ds::connectionLost', function () {
    // window.location = "noresponse.html";
    $scope.isConnected = false;

    function keepChecking () {
      console.log('not connected');

      // appServices.ping()
      // .then(function (res) {
      //   console.log(res);
      //   if (res) {
      //     $scope.$emit('ds::connectionRestored');
      //     // setTimeout(keepChecking(), 10000);
      //   }
      // });

    }

    setInterval(keepChecking(), 10000);
    // keepChecking();
    connection = $timeout(function () {
      appServices.ping()
      .then(function (res) {
        console.log(res);
        if (res) {
          $scope.$emit('ds::connectionRestored');
        }
      });
    }, 10000);

    connection.then(function () {
    });

  });

  $scope.$on('ds::connectionRestored', function () {
    $scope.isConnected = true;
  });

  $scope.$on('auth-loginRequired', function(e, rejection) {
    if (!$state.is('app.login')) {
      $state.go('app.login');
    }
  });

  $scope.$on('event:auth-loginConfirmed', function() {
    $scope.loginModal.hide();
  });
  $scope.$on('event:auth-logout-complete', function() {
    $state.go('app.home', {}, {reload: true, inherit: false});
  });


  //Be sure to cleanup the modal by removing it from the DOM
  $scope.$on('$destroy', function() {
    appBootStrap.loginModal.remove();
    $scope.fileBrowser.remove();
    $timeout.cancel(connection);
  });
}]);
app.factory("connectionInterceptor", function($q, $rootScope) {
      return {
        responseError: function(rejection) {
            if(rejection.status == 0) {
              $rootScope.$broadcast('ds::connectionLost');
              return;
            }

           return $q.reject(rejection);
        },
        request: function (config) {
          $rootScope.$broadcast('ds::connectionRestored');
          return config;
        }
      };
});
app.factory('tokenInterceptor', function ($window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.localStorage.authorizationToken) {
        config.headers.Authorization = 'Bearer ' + $window.localStorage.authorizationToken;
      }
      return config;
    }
  };
});
app.factory('appServices', function ($http, api_config) {
  return {
    ping: function () {
      // return cb(new Error('fuck'));
      return $http.get(api_config.CONSUMER_API_URL + '/api/v1/routetest')
      .then(function (status) {
        if (status) {
          return true;
        }
      }, function (err) {
        return err;
      });
    }
  };
});
// app.provider('ixitAppFactory', ['api_config', function (api_config) {
//   this.defaults = {};

//   this.api_config = api_config;
// }]);
})();