(function () {

var app = angular.module('controllers', []);


app.config(function($stateProvider, $urlRouterProvider, $httpProvider, flowFactoryProvider) {
  $stateProvider

    .state('splash', {
      url: "/splash",
      abstract: true,
      views: {
        'noHeaderContent' : {
          templateUrl: "full-screen.html",
        }
      }
    })

    .state('splash.welcome', {
      url: "/welcome",
      views: {
        'fullContent@splash' :{
          templateUrl: "templates/splash-first.html",
          controller: 'SplashCtrl'
        }
      }
    });
});

app.controller('FilesCtrl', function($scope, $ionicModal, $timeout, userRootCabinet) {
  // userRootCabinet.then(function (res) {
  //   $scope.userRootCabinet = res;
  // });
  $scope.userRootCabinet = [];

  if (userRootCabinet) {
    $scope.userRootCabinet = userRootCabinet.data;
  }

  $scope.open_chooser = function () {
    fileChooser.open(function(uri) {
      window.resolveLocalFileSystemURL(uri, function (fileEntry) {
        fileEntry.file(function (fileObject) {
          console.log(fileObject);
          $scope.$flow.addFile(fileObject);
        });
      }, function (err) {
        console.log(err);
      });
    }, function (err) {
      console.log(err);
    });
  };
});

app.controller('UploaderCtrl', ['$scope', function ($scope) {
  $scope.open_chooser = function () {
    fileChooser.open(function(uri) {
      console.log(uri);
      window.plugins.filenamequery.getFileName(uri,
          function(url) {
            console.log(url);
              // url is the value of EXTRA_TEXT
          }, function() {
              // There was no extra supplied.
              // console.log('Nothing sent in');
          }
      );
      window.resolveLocalFileSystemURL(uri, function (fileEntry) {
        fileEntry.file(function (fileObject) {
          $scope.$flow.addFile(fileObject);
        });
      }, function (err) {
        console.log(err);
      });
    }, function (err) {
      console.log(err);
    });
  };

}]);

app.controller('SplashCtrl', ['$scope', function ($scope) {


}]);

app.filter('hideSystemFiles', function () {
  return function (obj) {
    return (obj.name.indexOf('.') === 0) ? false : true;
  };
});
app.filter('formatFileSize', function(){
  return function(bytes){
    if (typeof bytes !== 'number') {
      return '';
    }
    if (bytes >= 1000000000) {
      return (bytes / 1000000000).toFixed(2) + ' GB';
    }
    if (bytes >= 1000000) {
      return (bytes / 1000000).toFixed(2) + ' MB';
    }
    return (bytes / 1000).toFixed(2) + ' KB';
  };
});
app.filter('moment', function(){
  return function(time){
    if (time == 'Infinity') {
      return '--';
    } else {
      var m = moment(time);
      return m.fromNow();
    }
  };
});
app.filter('fileicon', ['api_config', function (api_config) {
  return function (str) {
    return './img/filetype/' + str.split('/').pop() + '.png';
  };
}])
;

})();