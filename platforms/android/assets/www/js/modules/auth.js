(function () {
  var app = angular.module('auth', []);


  app.config(function($stateProvider) {
    $stateProvider

    .state('app.fs.login', {
      url: '/auth',
      views: {
        'fullContent@app.fs' :{
          controller: 'RegisterLoginCtrl',
          templateUrl: 'templates/auth/login.html'
        }
      }
    });

  });

  app.controller('RegisterLoginCtrl',[
    '$scope',
    '$state',
    'AuthenticationService',
    '$ionicPopup',
    '$ionicModal',
    '$window',
    '$ionicPlatform',
    function($scope, $state, AuthenticationService, $ionicPopup, $ionicModal, $window, $ionicPlatform) {
    $ionicPlatform.onHardwareBackButton(function () {
      return false;
    });

    $scope.message = '';

    $scope.form = {
      username: null,
      password: null
    };

    // $ionicModal.fromTemplateUrl('templates/auth/login.html',
    //   {
    //     scope: $scope,
    //     animation: 'slide-in-up',
    //     focusFirstInput: true,
    //     backdropClickToClose: false,
    //     hardwareBackButtonClose: false
    //   }
    // ).then(function (modal) {
    //   appBootStrap.activeModal = modal;
    //   console.log(appBootStrap.isBearerTokenPresent());
    //   //checks if there is an authorization token on
    //   //our localStorage
    //   if (!appBootStrap.isBearerTokenPresent()) {
    //     console.log('hi');
    //     // appBootStrap.activeModal.show();
    //   }
    // });

    $scope.loginBtn = function(form) {
      AuthenticationService.login(form);
    };
    $scope.RegisterBtn = function(form) {
      AuthenticationService.register(form, function (res) {
        if (res instanceof Error) {
          // An alert dialog
          var alertPopup = $ionicPopup.alert({
           title: 'Oops!',
           template: res.message
          });
          alertPopup.then(function(res) {
            $scope.auth_message = res.message;
          });
        } else {
          $ionicPopup.show({
              template: '<p>We have registered your IXIT account successfully</p>',
              title: 'Welcome',
              buttons: [
                {
                  text: '<b>Login Now</b>',
                  type: 'button-positive',
                  onTap: function(e) {
                    $state.go('app.fs.login');
                  }
                }
              ]
            });
        }
      });
    };


    $scope.$on('auth:auth-login-confirmed', function() {
      $scope.mainCfg.viewNoHeaderIsActive = false;
      $scope.email = $scope.passport = null;
      $state.go('app.tixi.files', {}, {
        location: true,
        reload: true
      });

      // window.location.reload(true);
    });

    $scope.$on('auth:auth-login-failed', function(e, status) {
      var error = 'Login failed.';
      if (status == 401) {
        error = 'Invalid Username or Password.';
      }
      // An alert dialog
      var alertPopup = $ionicPopup.alert({
       title: 'Sorry!',
       template: error
      });
      alertPopup.then(function(res) {
        $scope.auth_message = error;
      });
    });

    // $scope.$on('auth:auth-login-confirmed', function() {

    // });

  }]);
  app.controller('LogoutCtrl', function($scope, AuthenticationService, $window) {
      AuthenticationService.logout();
      delete $window.sessionStorage.authorizationToken;
  });
})();