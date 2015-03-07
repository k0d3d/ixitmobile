(function () {

var app = angular.module('controllers', []);

app.controller('FilesCtrl', function($scope, $ionicModal, $timeout, userRootCabinet, cordovaServices) {
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

app.controller('UploaderCtrl', ['$scope', 'cordovaServices', function ($scope, cordovaServices) {

  $scope.open_chooser = function () {
    if (fileChooser) {
      fileChooser.open(function(uri) {

        cordovaServices.returnFilePathName(uri, function (fileMeta) {
          cordovaServices.getFileObject(uri, fileMeta, function (fileObject) {
            $scope.$flow.addFile(fileObject);
          });
        });

      }, function (err) {
        console.log(err);
      });
    } else {

    }
  };
}]);

app.controller('AccountCtrl', [
  '$scope',
  '$ionicPopup',
  'AuthenticationService',
  '$cordovaToast',
  function ($scope, $ionicPopup, AuthenticationService, $cordovaToast) {
  $scope.accountPopup = function () {
    // An elaborate, custom popup
    var accountPopup = $ionicPopup.show({
      templateUrl: 'templates/inc/account-edit.html',
      title: 'Edit Profile',
      // subTitle: 'Adds',
      scope: $scope,
      cssClass: 'account-popup animated bounceIn',
      buttons: [
        {
          text: 'Cancel',
          type: 'button-clear',
          onTap: function(e) {

          }
        },
        {
          text: '<b>Save</b>',
          type: 'button-dark yellow-font',
          onTap: function(e) {

          }
        }
      ]
    });

    $scope.$on('$destroy', function () {
      accountPopup.remove();
    });
  };


  $scope.saveUserProfile = function saveUserProfile (form) {
    AuthenticationService.putUserInfo(form)
    .then(function () {
      //toast for profile updated successfully
      if ($cordovaToast) {
        $cordovaToast.showShortBottom('Profile has been updated.');
      }
    }, function () {
        $cordovaToast.showShortBottom('Profile update failed.');
    });
  };
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
app.filter('fileicon', [function () {
  return function (str) {
    return './img/filetype/' + str.split('/').pop() + '.png';
  };
}])
;

})();