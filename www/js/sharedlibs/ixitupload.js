angular.module('ixitApp.cordovaUpload', [
  'ixitApp.cordovaUpload.provider',
  'ixitApp.cordovaUpload.init',
  'flow.events',
  'flow.transfers'
]);

function CordovaUpload(opts) {
    /**
     * Supported by browser?
     * @type {boolean}
     */
    this.support = (
        typeof File !== 'undefined' &&
        typeof Blob !== 'undefined' &&
        typeof FileList !== 'undefined' &&
        (
          !!Blob.prototype.slice || !!Blob.prototype.webkitSlice || !!Blob.prototype.mozSlice ||
          false
        ) // slicing files support
    );

    if (!this.support) {
      return ;
    }

    /**
     * Check if directory upload is supported
     * @type {boolean}
     */
    this.supportDirectory = /WebKit/.test(window.navigator.userAgent);

    /**
     * List of FlowFile objects
     * @type {Array.<FlowFile>}
     */
    this.files = [];

    /**
     * Default options for flow.js
     * @type {Object}
     */
    this.defaults = {
      chunkSize: 1024 * 1024,
      forceChunkSize: false,
      simultaneousUploads: 3,
      singleFile: false,
      fileParameterName: 'file',
      progressCallbacksInterval: 500,
      speedSmoothingFactor: 0.1,
      query: {},
      headers: {},
      withCredentials: false,
      preprocess: null,
      method: 'multipart',
      prioritizeFirstAndLastChunk: false,
      target: '/',
      testChunks: true,
      generateUniqueIdentifier: null,
      maxChunkRetries: 0,
      chunkRetryInterval: null,
      permanentErrors: [404, 415, 500, 501],
      onDropStopPropagation: false
    };

    /**
     * Current options
     * @type {Object}
     */
    this.opts = {};

    /**
     * List of events:
     *  key stands for event name
     *  value array list of callbacks
     * @type {}
     */
    this.events = {};

    var $ = this;

    /**
     * On drop event
     * @function
     * @param {MouseEvent} event
     */
    this.onDrop = function (event) {
      if ($.opts.onDropStopPropagation) {
        event.stopPropagation();
      }
      event.preventDefault();
      var dataTransfer = event.dataTransfer;
      if (dataTransfer.items && dataTransfer.items[0] &&
        dataTransfer.items[0].webkitGetAsEntry) {
        $.webkitReadDataTransfer(event);
      } else {
        $.addFiles(dataTransfer.files, event);
      }
    };

    /**
     * Prevent default
     * @function
     * @param {MouseEvent} event
     */
    this.preventEvent = function (event) {
      event.preventDefault();
    };


    /**
     * Current options
     * @type {Object}
     */
    this.opts = Flow.extend({}, this.defaults, opts || {});
}

CordovaUpload.prototype = {
  /**
   * Set a callback for an event, possible events:
   * fileSuccess(file), fileProgress(file), fileAdded(file, event),
   * fileRetry(file), fileError(file, message), complete(),
   * progress(), error(message, file), pause()
   * @function
   * @param {string} event
   * @param {Function} callback
   */
  on: function (event, callback) {
    event = event.toLowerCase();
    if (!this.events.hasOwnProperty(event)) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },

  /**
   * Remove event callback
   * @function
   * @param {string} [event] removes all events if not specified
   * @param {Function} [fn] removes all callbacks of event if not specified
   */
  off: function (event, fn) {
    if (event !== undefined) {
      event = event.toLowerCase();
      if (fn !== undefined) {
        if (this.events.hasOwnProperty(event)) {
          arrayRemove(this.events[event], fn);
        }
      } else {
        delete this.events[event];
      }
    } else {
      this.events = {};
    }
  },

  /**
   * Fire an event
   * @function
   * @param {string} event event name
   * @param {...} args arguments of a callback
   * @return {bool} value is false if at least one of the event handlers which handled this event
   * returned false. Otherwise it returns true.
   */
  fire: function (event, args) {
    // `arguments` is an object, not array, in FF, so:
    args = Array.prototype.slice.call(arguments);
    event = event.toLowerCase();
    var preventDefault = false;
    if (this.events.hasOwnProperty(event)) {
      each(this.events[event], function (callback) {
        preventDefault = callback.apply(this, args.slice(1)) === false || preventDefault;
      });
    }
    if (event != 'catchall') {
      args.unshift('catchAll');
      preventDefault = this.fire.apply(this, args) === false || preventDefault;
    }
    return !preventDefault;
  },

  /**
   * Read webkit dataTransfer object
   * @param event
   */
  webkitReadDataTransfer: function (event) {
    var $ = this;
    var queue = event.dataTransfer.items.length;
    var files = [];
    each(event.dataTransfer.items, function (item) {
      var entry = item.webkitGetAsEntry();
      if (!entry) {
        decrement();
        return ;
      }
      if (entry.isFile) {
        // due to a bug in Chrome's File System API impl - #149735
        fileReadSuccess(item.getAsFile(), entry.fullPath);
      } else {
        entry.createReader().readEntries(readSuccess, readError);
      }
    });
    function readSuccess(entries) {
      queue += entries.length;
      each(entries, function(entry) {
        if (entry.isFile) {
          var fullPath = entry.fullPath;
          entry.file(function (file) {
            fileReadSuccess(file, fullPath);
          }, readError);
        } else if (entry.isDirectory) {
          entry.createReader().readEntries(readSuccess, readError);
        }
      });
      decrement();
    }
    function fileReadSuccess(file, fullPath) {
      // relative path should not start with "/"
      file.relativePath = fullPath.substring(1);
      files.push(file);
      decrement();
    }
    function readError(fileError) {
      throw fileError;
    }
    function decrement() {
      if (--queue == 0) {
        $.addFiles(files, event);
      }
    }
  },

  /**
   * Generate unique identifier for a file
   * @function
   * @param {FlowFile} file
   * @returns {string}
   */
  generateUniqueIdentifier: function (file) {
    var custom = this.opts.generateUniqueIdentifier;
    if (typeof custom === 'function') {
      return custom(file);
    }
    // Some confusion in different versions of Firefox
    var relativePath = file.relativePath || file.webkitRelativePath || file.fileName || file.name;
    return file.size + '-' + relativePath.replace(/[^0-9a-zA-Z_-]/img, '');
  },

  /**
   * Upload next chunk from the queue
   * @function
   * @returns {boolean}
   * @private
   */
  uploadNextChunk: function (preventEvents) {
    // In some cases (such as videos) it's really handy to upload the first
    // and last chunk of a file quickly; this let's the server check the file's
    // metadata and determine if there's even a point in continuing.
    var found = false;
    if (this.opts.prioritizeFirstAndLastChunk) {
      each(this.files, function (file) {
        if (!file.paused && file.chunks.length &&
          file.chunks[0].status() === 'pending' &&
          file.chunks[0].preprocessState === 0) {
          file.chunks[0].send();
          found = true;
          return false;
        }
        if (!file.paused && file.chunks.length > 1 &&
          file.chunks[file.chunks.length - 1].status() === 'pending' &&
          file.chunks[0].preprocessState === 0) {
          file.chunks[file.chunks.length - 1].send();
          found = true;
          return false;
        }
      });
      if (found) {
        return found;
      }
    }

    // Now, simply look for the next, best thing to upload
    each(this.files, function (file) {
      if (!file.paused) {
        each(file.chunks, function (chunk) {
          if (chunk.status() === 'pending' && chunk.preprocessState === 0) {
            chunk.send();
            found = true;
            return false;
          }
        });
      }
      if (found) {
        return false;
      }
    });
    if (found) {
      return true;
    }

    // The are no more outstanding chunks to upload, check is everything is done
    var outstanding = false;
    each(this.files, function (file) {
      if (!file.isComplete()) {
        outstanding = true;
        return false;
      }
    });
    if (!outstanding && !preventEvents) {
      // All chunks have been uploaded, complete
      async(function () {
        this.fire('complete');
      }, this);
    }
    return false;
  },


  /**
   * Assign a browse action to one or more DOM nodes.
   * @function
   * @param {Element|Array.<Element>} domNodes
   * @param {boolean} isDirectory Pass in true to allow directories to
   * @param {boolean} singleFile prevent multi file upload
   * @param {Object} attributes set custom attributes:
   *  http://www.w3.org/TR/html-markup/input.file.html#input.file-attributes
   *  eg: accept: 'image/*'
   * be selected (Chrome only).
   */
  assignBrowse: function (domNodes, isDirectory, singleFile, attributes) {
    if (typeof domNodes.length === 'undefined') {
      domNodes = [domNodes];
    }

    each(domNodes, function (domNode) {
      var input;
      if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
        input = domNode;
      } else {
        input = document.createElement('input');
        input.setAttribute('type', 'file');
        // display:none - not working in opera 12
        extend(input.style, {
          visibility: 'hidden',
          position: 'absolute'
        });
        // for opera 12 browser, input must be assigned to a document
        domNode.appendChild(input);
        // https://developer.mozilla.org/en/using_files_from_web_applications)
        // event listener is executed two times
        // first one - original mouse click event
        // second - input.click(), input is inside domNode
        domNode.addEventListener('click', function() {
          input.click();
        }, false);
      }
      if (!this.opts.singleFile && !singleFile) {
        input.setAttribute('multiple', 'multiple');
      }
      if (isDirectory) {
        input.setAttribute('webkitdirectory', 'webkitdirectory');
      }
      each(attributes, function (value, key) {
        input.setAttribute(key, value);
      });
      // When new files are added, simply append them to the overall list
      var $ = this;
      input.addEventListener('change', function (e) {
        $.addFiles(e.target.files, e);
        e.target.value = '';
      }, false);
    }, this);
  },

  /**
   * Assign one or more DOM nodes as a drop target.
   * @function
   * @param {Element|Array.<Element>} domNodes
   */
  assignDrop: function (domNodes) {
    if (typeof domNodes.length === 'undefined') {
      domNodes = [domNodes];
    }
    each(domNodes, function (domNode) {
      domNode.addEventListener('dragover', this.preventEvent, false);
      domNode.addEventListener('dragenter', this.preventEvent, false);
      domNode.addEventListener('drop', this.onDrop, false);
    }, this);
  },

  /**
   * Un-assign drop event from DOM nodes
   * @function
   * @param domNodes
   */
  unAssignDrop: function (domNodes) {
    if (typeof domNodes.length === 'undefined') {
      domNodes = [domNodes];
    }
    each(domNodes, function (domNode) {
      domNode.removeEventListener('dragover', this.preventEvent);
      domNode.removeEventListener('dragenter', this.preventEvent);
      domNode.removeEventListener('drop', this.onDrop);
    }, this);
  },

  /**
   * Returns a boolean indicating whether or not the instance is currently
   * uploading anything.
   * @function
   * @returns {boolean}
   */
  isUploading: function () {
    var uploading = false;
    each(this.files, function (file) {
      if (file.isUploading()) {
        uploading = true;
        return false;
      }
    });
    return uploading;
  },

  /**
   * Start or resume uploading.
   * @function
   */
  upload: function () {
    // Make sure we don't start too many uploads at once
    if (this.isUploading()) {
      return;
    }
    // Kick off the queue
    this.fire('uploadStart');
    var started = false;
    for (var num = 1; num <= this.opts.simultaneousUploads; num++) {
      started = this.uploadNextChunk(true) || started;
    }
    if (!started) {
      async(function () {
        this.fire('complete');
      }, this);
    }
  },

  /**
   * Resume uploading.
   * @function
   */
  resume: function () {
    each(this.files, function (file) {
      file.resume();
    });
  },

  /**
   * Pause uploading.
   * @function
   */
  pause: function () {
    each(this.files, function (file) {
      file.pause();
    });
  },

  /**
   * Cancel upload of all FlowFile objects and remove them from the list.
   * @function
   */
  cancel: function () {
    for (var i = this.files.length - 1; i >= 0; i--) {
      this.files[i].cancel();
    }
  },

  /**
   * Returns a number between 0 and 1 indicating the current upload progress
   * of all files.
   * @function
   * @returns {number}
   */
  progress: function () {
    var totalDone = 0;
    var totalSize = 0;
    // Resume all chunks currently being uploaded
    each(this.files, function (file) {
      totalDone += file.progress() * file.size;
      totalSize += file.size;
    });
    return totalSize > 0 ? totalDone / totalSize : 0;
  },

  // modified @addFiles

  /**
   * Add a HTML5 File object to the list of files.
   * @function
   * @param {File} file
   * @param {Event} [event] event is optional
   * @param {Object} [optData] optional data to be passed to the event handler
   */
  addFile: function (file, event, optData) {
    this.addFiles([file], event, optData);
  },

  /**
   * Add a HTML5 File object to the list of files.
   * @function
   * @param {FileList|Array} fileList
   * @param {Event} [event] event is optional
   */
  addFiles: function (fileList, event, optData) {
    var files = [];
    each(fileList, function (file) {
      // Directories have size `0` and name `.`
      // Ignore already added files
      if (!(file.size % 4096 === 0 && (file.name === '.' || file.fileName === '.')) &&
        !this.getFromUniqueIdentifier(this.generateUniqueIdentifier(file))) {
        var f = new FlowFile(this, file);
        if (this.fire('fileAdded', f, event, optData)) {
          files.push(f);
        }
      }
    }, this);
    if (this.fire('filesAdded', files, event, optData)) {
      each(files, function (file) {
        if (this.opts.singleFile && this.files.length > 0) {
          this.removeFile(this.files[0]);
        }
        this.files.push(file);
      }, this);
    }
    this.fire('filesSubmitted', files, event);
  },


  /**
   * Cancel upload of a specific FlowFile object from the list.
   * @function
   * @param {FlowFile} file
   */
  removeFile: function (file) {
    for (var i = this.files.length - 1; i >= 0; i--) {
      if (this.files[i] === file) {
        this.files.splice(i, 1);
        file.abort();
      }
    }
  },

  /**
   * Look up a FlowFile object by its unique identifier.
   * @function
   * @param {string} uniqueIdentifier
   * @returns {boolean|FlowFile} false if file was not found
   */
  getFromUniqueIdentifier: function (uniqueIdentifier) {
    var ret = false;
    each(this.files, function (file) {
      if (file.uniqueIdentifier === uniqueIdentifier) {
        ret = file;
      }
    });
    return ret;
  },

  /**
   * Returns the total size of all files in bytes.
   * @function
   * @returns {number}
   */
  getSize: function () {
    var totalSize = 0;
    each(this.files, function (file) {
      totalSize += file.size;
    });
    return totalSize;
  },

  /**
   * Returns the total size uploaded of all files in bytes.
   * @function
   * @returns {number}
   */
  sizeUploaded: function () {
    var size = 0;
    each(this.files, function (file) {
      size += file.sizeUploaded();
    });
    return size;
  },

  /**
   * Returns remaining time to upload all files in seconds. Accuracy is based on average speed.
   * If speed is zero, time remaining will be equal to positive infinity `Number.POSITIVE_INFINITY`
   * @function
   * @returns {number}
   */
  timeRemaining: function () {
    var sizeDelta = 0;
    var averageSpeed = 0;
    each(this.files, function (file) {
      if (!file.paused && !file.error) {
        sizeDelta += file.size - file.sizeUploaded();
        averageSpeed += file.averageSpeed;
      }
    });
    if (sizeDelta && !averageSpeed) {
      return Number.POSITIVE_INFINITY;
    }
    if (!sizeDelta && !averageSpeed) {
      return 0;
    }
    return Math.floor(sizeDelta / averageSpeed);
  }
};

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
    return new CordovaUpload(options);
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
        var cordovaupload = fn(angular.extend({}, defaults, opts));
        angular.forEach(events, function (event) {
          cordovaupload.on(event[0], event[1]);
        });
        return cordovaupload;
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
        var cordovaupload = cordovaUploadFactory.create(opts);

        cordovaupload.on('catchAll', function (eventName) {
          var args = Array.prototype.slice.call(arguments);
          args.shift();
          var event = $scope.$broadcast.apply($scope, ['cordovaupload::' + eventName, cordovaupload].concat(args));
          if ({
            'progress':1, 'filesSubmitted':1, 'fileSuccess': 1, 'fileError': 1, 'complete': 1
          }[eventName]) {
            $scope.$apply();
          }
          if (event.defaultPrevented) {
            return false;
          }
        });

        $scope.$cordovaupload = cordovaupload;
        if ($attrs.hasOwnProperty('cordovauploadName')) {
          $parse($attrs.cordovauploadName).assign($scope, cordovaupload);
          $scope.$on('$destroy', function () {
            $parse($attrs.cordovauploadName).assign($scope);
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