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
});

app.controller('UploaderCtrl', ['$scope', '$cordovaToast', function ($scope, $cordovaToast) {

  $scope.$flow.on('filesAdded', function (file, event) {
    if (window.cordova) {
      $cordovaToast.showShortBottom('Added '+ file.length + 'file(s) to upload queue' );
    }
  });
}]);

app.controller('SplashCtrl', ['$scope', function ($scope) {


}]);

app.filter('hideSystemFiles', function () {
  return function (obj) {
    return (obj.name.indexOf('.') === 0) ? false : true;
  };
})
.filter('formatFileSize', function(){
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
})
.filter('moment', function(){
  return function(time){
    var m = moment(time);
    return m.fromNow();
  };
})
.filter('fileicon', ['api_config', function (api_config) {
  return function (str) {
    return api_config.CONSUMER_API_URL + '/img/filetype/' + str.split('.').pop() + '.png';
  };
}])
;

})();