angular.module('ixitApp.cordovaUpload', [
  'ixitApp.cordovaUpload.provider',
  'ixitApp.cordovaUpload.init',
  'flow.events',
  'flow.transfers'
]);

angular.module('ixitApp.cordovaUpload.provider', [])
.provider('cordovaUploadFactory', function() {
  'use strict';
  /**
   * Define the default properties for flow.js
   * @name cordovaUploadFactoryProvider.defaults
   * @type {Object}
   */
  this.defaults = {};

  /**
   * Flow, MaybeFlow or NotFlow
   * @name cordovaUploadFactoryProvider.factory
   * @type {function}
   * @return {Flow}
   */
  this.factory = function (options) {
    return new Flow(options);
  };

  /**
   * Define the default events
   * @name cordovaUploadFactoryProvider.events
   * @type {Array}
   * @private
   */
  this.events = [];

  /**
   * Add default events
   * @name cordovaUploadFactoryProvider.on
   * @function
   * @param {string} event
   * @param {Function} callback
   */
  this.on = function (event, callback) {
    this.events.push([event, callback]);
  };

  this.$get = function() {
    var fn = this.factory;
    var defaults = this.defaults;
    var events = this.events;
    return {
      'create': function(opts) {
        // combine default options with global options and options
        var flow = fn(angular.extend({}, defaults, opts));
        angular.forEach(events, function (event) {
          flow.on(event[0], event[1]);
        });
        return flow;
      }
    };
  };
});
angular.module('ixitApp.cordovaUpload.init', ['ixitApp.cordovaUpload.provider'])
.controller('cordovaUploadCtrl', ['$scope', '$attrs', '$parse', 'cordovaUploadFactory',
  function ($scope, $attrs, $parse, cordovaUploadFactory) {

    //
    var options =   {
      query: {
        'x-Authr': window.localStorage.userId
      }
    };

    function __initFlowOptions (opts) {
        var flow = cordovaUploadFactory.create(opts);

        flow.on('catchAll', function (eventName) {
          var args = Array.prototype.slice.call(arguments);
          args.shift();
          var event = $scope.$broadcast.apply($scope, ['flow::' + eventName, flow].concat(args));
          if ({
            'progress':1, 'filesSubmitted':1, 'fileSuccess': 1, 'fileError': 1, 'complete': 1
          }[eventName]) {
            $scope.$apply();
          }
          if (event.defaultPrevented) {
            return false;
          }
        });

        $scope.$flow = flow;
        if ($attrs.hasOwnProperty('flowName')) {
          $parse($attrs.flowName).assign($scope, flow);
          $scope.$on('$destroy', function () {
            $parse($attrs.flowName).assign($scope);
          });
        }
    }

    // $scope.$watch('currentFolder', function (n) {
    //   if (n) {
    //     $scope.$flow.opts.query = {
    //       'folder': $scope.currentFolder,
    //       'x-Authr' : $scope.cuser
    //     };
    //     // return console.log($scope.$flow.opts);
    //   }
    // });

    __initFlowOptions(options);
}])
.directive('cordovaUploadInit', [function() {
  return {
    scope: true,
    controller: 'cordovaUploadCtrl'
  };
}]);