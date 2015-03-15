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
});

app.controller('UploaderCtrl', [
  '$scope',
  'cordovaServices',
  'appDBBridge',
  'queueData',
  'PouchDB',
  function ($scope, cordovaServices, appDBBridge, queueData, PouchDB) {
  console.log(queueData);
  // PouchDB.remove(queueData);

  function pick_file_object (objval) {
    return _.pick(objval, ['name', 'size', 'uniqueIdentifier', 'relativePath', 'uri']);
  }
  function omit_pouch_reserved_keys (objval) {
    return  _.omit(objval, ['_id', '_rev']);
  }

  //check if null is returned, since the selectOneDoc method returns
  //null if no doc is found
  var queue;
  if (queueData) {
    queue = _.values(omit_pouch_reserved_keys(queueData));
    // add files on the queue to our flow file queue
    angular.forEach(queue, function (onefile) {
      cordovaServices.returnFilePathName(onefile.uri, function (fileMeta) {
        cordovaServices.getFileObject(onefile.uri, fileMeta, function (fileObject) {
          $scope.$flow.addFile(fileObject);
          // files.push(fileObject);
        });
      });
    });
  } else {
    queue = [];
  }

  $scope.open_chooser = function () {
    if (fileChooser) {
      fileChooser.open(function(uri) {

        cordovaServices.returnFilePathName(uri, function (fileMeta) {
          cordovaServices.getFileObject(uri, fileMeta, function (fileObject) {
            fileObject.uri = uri;
            $scope.$flow.addFile(fileObject);
          });
        });

      }, function (err) {
        console.log(err);
      });
    }
  };

  $scope.$flow.on('fileAdded', function (file) {
    var upsert = true;
    //
    if (queue.length) {
      upsert = false;
    }
    queue.push(pick_file_object(file));
    console.log(queue);
    //save to queue
    appDBBridge.updateDBCollection('Keeper.thisUserQueue', appDBBridge.prepArraytoObject(queue), upsert)
    .then(function (doc) {
      console.log(doc);
    }, function (err) {
      console.lod(err);
    })
    .catch(function (err) {
      console.log(err);
    });
  });
}]);

app.controller('AccountCtrl', [
  '$scope',
  '$ionicPopup',
  'AuthenticationService',
  '$cordovaToast',
  'userData',
  'appDBBridge',
  function ($scope, $ionicPopup, AuthenticationService, $cordovaToast, userData, appDBBridge) {
  $scope.uiElements = {};
  $scope.userData  = userData;
  $scope.accountPopup = function () {
    $scope.subTitle = '';
    // An elaborate, custom popup
    var accountPopup = $ionicPopup.show({
      templateUrl: 'templates/inc/account-edit.html',
      title: 'Edit Profile',
      subTitle: $scope.subTitle,
      scope: $scope,
      cssClass: 'account-popup animated bounceIn',
      buttons: [
        {
          text: 'Cancel',
          type: 'button-clear',
        },
        {
          text: '<b>Save</b>',
          type: 'button-clear button-dark yellow-font',
          onTap: function(e) {
            e.preventDefault();
            console.log($scope);
            // if (!$scope.userData.firstname.length || !$scope.userData.lastname.length ) {
            //   $scope.subTitle = 'Please enter a the required fields.';
            // }
            $scope.saveUserProfile($scope.userData);
          }
        }
      ]
    });

    $scope.uiElements.accountPopup = accountPopup;
  };


  $scope.saveUserProfile = function saveUserProfile (form) {
    AuthenticationService.putUserInfo(form)
    .then(function () {
      $scope.uiElements.accountPopup.close();
      //toast for profile updated successfully
      if ($cordovaToast) {
        $cordovaToast.showShortBottom('Profile has been updated.');
      }
    }, function () {
        $cordovaToast.showShortBottom('Profile update failed.');
    });
  };

  var userId = window.localStorage.userId || '';

  appDBBridge.fetchAndSyncDataToScope(userId, 'AuthenticationService.getThisUser', [])
  .then(function (updatedDoc) {
    window.localStorage.userId = updatedDoc._id;
    $scope.userData = updatedDoc;
  });
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
app.filter('fileicon', ['appData', function (appData) {
  function imageExists(str) {
    return _.indexOf(appData.filetypeIcons, str) > -1;
  }
  return function (str) {
    var imgUrl = './img/filetype/' + str.split('/').pop() + '.png';
    // imageExists(imgUrl, )
    if (imageExists(str)) {
      return imgUrl;
    } else {
      return './img/filetype/no-img.png';
    }
  };
}])
;

})();