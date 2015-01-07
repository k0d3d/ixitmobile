(function () {
  var app = angular.module('directives', []);

  // resizes the content area depending on the
  // orientation of the device. If the device is
  // say a tablet, it leaves the right menu, open
  // and adjust the content area width.
  app.directive('resizeContentDiv', ['$window', function ($window) {
    return {
      link: function (scope, ele, attrs) {
        $($window).on('orientationchange resize ready', function () {
          var screenWidth = $($window).width();
          if (screenWidth > 600) {
            $(ele).width(screenWidth - $('ion-side-menu').width());
          }
        });
      }
    };
  }]);

  app.directive('resizeSplashDiv', ['$window', '$ionicPlatform', function ($window, $ionicPlatform) {
    return {
      link: function (scope, ele, attrs) {
        function loadNReloadBG () {
          var screenWidth = $($window).width();
          var screenHeight = $($window).height();

          //is landscape
          if (screenWidth > screenHeight) {
            scope.splashImg = 'splash-doc-l';
            scope.splashImgIsP = false;
            scope.splashActionDiv = {'width': '306px', 'margin-left': '-153px'};
          } else if (screenHeight > screenWidth) {
            scope.splashImg = 'splash-doc-p';
            scope.splashImgIsP = true;
            scope.splashActionDiv = {'width': '154px', 'margin-left': '-77px'};
          }
          $(ele).width(screenWidth);
          $(ele).height(screenHeight);
          // scope.$apply();
        }
        // $document.addEventListener("deviceready", function () { console.log('in dire ready');}, false);
        // document.addEventListener('deviceready', loadNReloadBG);
        // document.addEventListener('resize', loadNReloadBG);
        loadNReloadBG();
      }
    };
  }]);

  // Highlights the current active menu
  // app.directive('activeHref', ['$window', '$location', function ($window, $location) {
    // return {
    //   compile: function (ele, attrs) {
    //     var win = ($location) ? '#' + $location.path() : window.location.hash;
    //     if (win === attrs.ngHref) {
    //       angular.element(ele).addClass('active');
    //     }
    //   },
    //   require: 'ngHref'
    // };

  // }]);

  // Caches any image in an img tag this directive is attached on
  app.directive('imgCache', ['$document', function ($document) {
    return {
      // require: 'ngSrc',
      link: function (scope, ele, attrs) {
        var target = $(ele);
        //waits for the event to be triggered,
        //before executing d call back
        scope.$on('ImgCacheReady', function () {
          //this checks if we have a cached copy.
          ImgCache.isCached(attrs.src, function(path, success){
            if(success){
              // already cached
              ImgCache.useCachedFile(target);
            } else {
              // not there, need to cache the image
              ImgCache.cacheFile(attrs.src, function(){
                ImgCache.useCachedFile(target);
              });
            }
          });
        }, false);
      }
    };
  }]);

  //file browser directive
  app.directive('fileBrowser', ['cordovaServices', function (cordovaServices) {
    return {
      link: function (scope, ele, attrs) {
        cordovaServices.filesystem(scope.currentFolderView, function (entries) {
          angular.forEach(entries, function (v) {
            if (v.isFile) {
              scope.currentDirEntries.files.push(v);
            }
            if (v.isDirectory) {
              scope.currentDirEntries.dir.push(v);
            }
          });
        });
      },
      scope: {
        currentFolderView: '=fileBrowser',
        currentDirEntries: '='
      },
      controller: function ($scope, $element, $attrs) {
        $scope.openDir = function (path) {
          console.log(path);
          cordovaServices.filesystem(path.fullPath, function (entries) {
            angular.forEach(entries, function (v) {
              if (v.isFile) {
                scope.currentDirEntries.files.push(v);
              }
              if (v.isDirectory) {
                scope.currentDirEntries.dir.push(v);
              }
              $scope.currentFolderView = path;
            });
          });


        };

        $scope.openFile = function (path) {

        };
      }
    };
  }]);
})();