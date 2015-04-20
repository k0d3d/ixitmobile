(function () {

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'ixitApp' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('ixitApp', [
  'ionic',
  'ngCordova',
  'flow',
  'auth',
  'directives',
  'controllers',
  'services',
  'ixitApp.config'
  // 'ixitApp.cordovaUpload'
  ]);

app.run([
  '$ionicPlatform',
  '$rootScope',
  'appBootStrap',
  // '$document',
  // '$window',
  '$state',
  // '$stateParams',
  // function($ionicPlatform, $rootScope, appBootStrap, $document, $window, $state, $stateParams) {
  function($ionicPlatform, $rootScope, appBootStrap, $state) {

  function failedActivity (err) {
    console.log(err);
  }
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      window.StatusBar.styleDefault();
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

    window.plugins.webintent.getExtra(window.plugins.webintent.EXTRA_STREAM,
        function(url) {
          $state.go('app.tixi.intent_upload', {intentUri: url});
        }, failedActivity
    );
    // window.plugins.webintent.getExtra(window.plugins.webintent.EXTRA_TEXT,
    //     function(url) {
    //       console.log(url);
    //         // url is the value of EXTRA_TEXT
    //     }, failedActivity
    // );
    // window.plugins.webintent.getUri(function(url) {
    //   if(url !== '') {
    //     // url is the url the intent was launched with
    //     console.log(url);
    //   }
    // }, failedActivity);
    window.plugins.webintent.onNewIntent(function(url) {
      console.log(url);
        if(url !== '') {
          console.log(url);
            // url is the url that was passed to onNewIntent
        }
    }, failedActivity);


    $rootScope.$state = $state;
    function message(to, toP, from, fromP) {
      return from.name  + angular.toJson(fromP) + ' -> ' +     to.name + angular.toJson(toP);
    }

    $rootScope.$on('$stateChangeStart', function(evt, to, toP, from, fromP) {
      // console.log('Start:   ' + message(to, toP, from, fromP));
    });
    $rootScope.$on('$stateChangeSuccess', function(evt, to, toP, from, fromP) {
      // console.log('Success: ' + message(to, toP, from, fromP));
    });
    $rootScope.$on('$stateChangeError', function(evt, to, toP, from, fromP, err) {
      console.log('Error:   ' + message(to, toP, from, fromP), err);
      // return evt.preventDefault();
      $state.go(from.name, {} , {reload: true});
    });

    //load this device in
    appBootStrap.strapCordovaDevice();
  });
  // appBootStrap.strapCordovaDevice();

}]);

app.config(function($stateProvider, $urlRouterProvider, $httpProvider, flowFactoryProvider, api_config,$ionicConfigProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      controller: 'AppCtrl'
    })

    .state('app.tixi', {
      url: '/tixi',
      abstract: true,
      views: {
        'maincontent@' : {
          templateUrl: 'templates/app.html',
          controller: 'TixiCtrl'
        }
      }
    })

    .state('app.tixi.files', {
      url: '/files',
      views: {
        'cabinetContent@app.tixi' :{
          templateUrl: 'templates/files.html',
          controller: 'FilesCtrl',
          resolve: {
            userRootCabinet: function (appDBBridge) {
              return appDBBridge.selectOneDoc({}, 'Keeper.thisUserFiles');
              // return Keeper.thisUserFiles({});
            }
          }
        }
      }
    })
    .state('app.tixi.account', {
      url: '/account',
      views: {
        'accountContent@app.tixi' :{
          templateUrl: 'templates/account.html',
          controller: 'AccountCtrl',
          resolve: {
            userData: function (appDBBridge) {
              var id = window.localStorage.userId || '';
              return appDBBridge.selectOneDoc({id: id}, 'AuthenticationService.getThisUser');
            }
          }
        }
      }
    })
    .state('app.tixi.upload', {
      url: '/upload',
      views: {
        'uploadsContent@app.tixi' :{
          templateUrl: 'templates/upload.html',
          controller: 'UploaderCtrl',
          resolve: {
            queueData: function (appDBBridge) {
              return appDBBridge.selectOneDoc({}, 'Keeper.thisUserQueue');
            }
          }
        }
      }
    })
    .state('app.tixi.intent_upload', {
      url: '/upload/:intentUri',
      views: {
        'uploadsContent@app.tixi' :{
          templateUrl: 'templates/upload.html',
          controller: 'UploaderCtrl',
          resolve: {
            queueData: function (appDBBridge) {
              return appDBBridge.selectOneDoc({}, 'Keeper.thisUserQueue');
            }
          }
        }
      }
    })
    .state('app.fs', {
      url: '/fs',
      abstract: true,
      views: {
        'noheadercontent@' : {
          templateUrl: 'full-screen.html',

        }
      }
    })
    .state('app.fs.welcome', {
      url: '/welcome',
      views: {
        'fullContent@app.fs' :{
          templateUrl: 'templates/splash-first.html'
        }
      }
    });


    flowFactoryProvider.defaults = {
        target: api_config.FILEVAULT_API_URL + '/upload',
        chunkSize:1*1024*1024,
        simultaneousUploads:1,
        testChunks:true,
        // maxFiles: 10,
        // query: function queryParams (fileObj, chunkObj){
        //   return {
        //     fileType : fileObj.file.type.length > 0 ? fileObj.file.type : 'noMime',
        //     // throne: Keeper.currentUser
        //   };
        // },
        permanentErrors:[404, 500, 501],
        maxChunkRetries: 100,
        chunkRetryInterval: 5000,
    };

    flowFactoryProvider.on('catchAll', function () {
      // console.log(arguments);
    });


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/tixi/files');

  $httpProvider.interceptors.push('tokenInterceptor');
  $httpProvider.interceptors.push('connectionInterceptor');

  $httpProvider.interceptors.push(['$q', 'api_config', '$rootScope', function ($q, api_config, $rootScope) {
      return {
          'request': function (config) {
            $rootScope.$broadcast('app:is-requesting', true);
             if (config.url.indexOf('/api/') > -1 ) {
                config.url = api_config.CONSUMER_API_URL + '' + config.url;
                return config || $q.when(config);
              } else {
               return config || $q.when(config);
              }
          },
          'response': function (resp) {
              $rootScope.$broadcast('app-is-requesting', false);
              // appBootStrap.isRequesting = false;
               return resp || $q.when(resp);
          },
          // optional method
         'responseError': function(response) {
            // do something on error
            if (response.status === 403) {
              $rootScope.$broadcast('auth:auth-login-required');
            }
            $rootScope.$broadcast('app:is-requesting', false);
            return $q.reject(response);
          },
          // optional method
         'requestError': function(response) {
            // do something on error
            $rootScope.$broadcast('app:is-requesting', false);
            return $q.reject(response);
          }

      };
  }]);

  // if(!ionic.Platform.isIOS())$ionicConfigProvider.scrolling.jsScrolling(false);

});

app.controller('AppCtrl' , [
  '$scope',
  '$state',
  '$stateParams',
  '$window',
  'appBootStrap',
  function ($scope, $state, $stateParams, $window, appBootStrap) {
  $scope.mainCfg = {
    viewNoHeaderIsActive: appBootStrap.isBearerTokenPresent()
  };

  if (!$window.localStorage.authorizationToken) {
    return $state.transitionTo('app.fs.welcome', $stateParams, { inherit: true, notify: true });
  }


  $scope.$on('$stateChangeStart',
  // function(event, toState, toParams, fromState, fromParams){
  function(event, toState){
    //check for an authorizationToken in our localStorage
    //if we find one, we check if it is a Bearer type token,
    //we wanna redirect to our login page to get new auth tokens
    //
    if ($window.localStorage.authorizationToken) {
      //if we have an bearer type auth token and for some reason, we're being sent to any
      //app.auth state... it should freeze d transition.
      if (
        ($window.localStorage.authorizationToken && toState.name.indexOf('app.fs.auth') > -1 ) &&
        ($window.localStorage.authorizationToken.split(' ')[0] === 'Bearer' && toState.name.indexOf('app.fs.auth') > -1 )
      ) {
        console.log('shouldnt b here');
        return event.preventDefault();
      }
    }
  });
}]);

app.controller('TixiCtrl',
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
  '$cordovaToast',
  '$interpolate',
  'appDBBridge',
  function(
    $scope,
    $state,
    appBootStrap,
    $ionicLoading,
    $ionicActionSheet,
    $timeout,
    appServices,
    cordovaServices,
    $window,
    $cordovaToast,
    $interpolate,
    appDBBridge) {

  if (!appBootStrap.isBearerTokenPresent()) {
    return $state.transitionTo('app.fs.welcome', {}, { reload: true, inherit: true, notify: true });
  }

  var connection;
  $scope.isConnected = false;
  // $scope.loginModal = "";
  $scope.currentFolderView = null;
  $scope.currentDirEntries = {
    dir: [],
    files: []
  };

  $scope.start_uploading  = function (FLOW) {
    if (FLOW.files.length) {
      FLOW.upload();
    } else {
      $cordovaToast.showShortBottom('There are no files queued');
    }
  };


  $scope.onFilesTabSelected = function () {
    $scope.$flow.emptyCompletedFileList();
  };

  // $scope.loginModal = appBootStrap.loginModal;

  $scope.$on('app:connection-lost', function () {
    // window.location = "noresponse.html";
    $scope.isConnected = false;

    function keepChecking () {
      console.log('not connected');

      // appServices.ping()
      // .then(function (res) {
      //   console.log(res);
      //   if (res) {
      //     $scope.$emit('ds::connection-restored');
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
          $scope.$emit('app:connection-restored');
        }
      });
    }, 10000);

    connection.then(function () {
    });

  });

  $scope.$on('app:connection-restored', function () {
    $scope.isConnected = true;
  });

  $scope.$on('auth:auth-login-required', function() {
    if (!$state.is('app.fs.login')) {
      $state.go('app.fs.login');
    }
  });

  $scope.$on('auth:auth-logout-complete', function() {
    $state.go('app.fs.home', {}, {reload: true, inherit: false});
  });


  //checks if there is a bearer authorization token on
  //our localStorage
  if (appBootStrap.isBearerTokenPresent() === 2) {
    $scope.$emit('auth:auth-login-required');
  }


  //Be sure to cleanup the modal by removing it from the DOM
  $scope.$on('$destroy', function() {
    appBootStrap.activeModal.remove();
    $scope.fileBrowser.remove();
    $timeout.cancel(connection);
  });

  $scope.$flow.on('filesAdded', function (files, e, optsData) {
    // console.log($cordovaToast);
    if ($cordovaToast && appBootStrap.isBrowser() && !optsData.cached) {
      $cordovaToast.showShortBottom($interpolate('{{count}} file(s) successfully added to queue.')({count: files.length}));
    }
    // console.log($interpolate('{{count}} successfully added to queue.')({count: files.length}));

  });

  $scope.$flow.on('filesSubmitted', function () {

    $scope.$flow.upload();
  });
  $scope.$flow.on('fileSuccess', function (file, message) {
    file.ixid = JSON.parse(message).ixid;
  });
}]);
app.factory('connectionInterceptor', function($q, $rootScope) {
      return {
        responseError: function(rejection) {
            if(rejection.status === 0) {
              $rootScope.$broadcast('app:connection-lost');
              return;
            }

           return $q.reject(rejection);
        },
        request: function (config) {
          $rootScope.$broadcast('app:connection-restored');
          return config;
        }
      };
});
app.factory('tokenInterceptor', function ($window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.localStorage.authorizationToken) {
        config.headers.Authorization = $window.localStorage.authorizationToken;
      }
      return config;
    }
  };
});
app.factory('appServices', function ($http, api_config) {
  return {
    ping: function () {
      // return cb(new Error('fuck'));
      return $http.get('/api/v1/routetest')
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
app.factory('PouchDB', [function () {
  return new PouchDB('ixit');
}]);
// app.provider('ixitAppFactory', ['api_config', function (api_config) {
//   this.defaults = {};

//   this.api_config = api_config;
// }]);
})();