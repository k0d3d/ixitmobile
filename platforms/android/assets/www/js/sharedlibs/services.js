(function () {
  var app = angular.module('services', []);
  app.factory('Messaging', [
    '$http',
    'api_config',
    '$state',
    'appBootStrap',
    '$rootScope',
    function ($http) {
      return {
        setRegId: function (regId) {
          this.regid = regId;
          return true;
        },
        getRegId: function () {
          return this.regid;
        },
        ping: function (deviceId, cb) {
          var self = this;
          $http.post('/api/v1/messaging/' + deviceId, {
            rId: self.regid
          })
          .success(function (data) {
            cb(data);
          })
          .error(function (err) {
            cb(err);
          });
        },
        execAction: function execAction (actionName, params) {
        }
      };
  }]);
  app.factory('AuthenticationService', [
    '$rootScope',
    '$http',
    // 'authService',
    'api_config',
    '$window',
    'appBootStrap',
    function($rootScope, $http, api_config, $window, appBootStrap) {
      var service = {
        register: function (user, cb) {
          $http.post('/api/v2/users', {
            email: encodeURI(user.email),
            phoneNumber: user.phoneNumber,
            password: user.password
          })
          .success(function (data) {
            cb(data);
          })
          .error(function (data) {
            cb(new Error(data.message));
          });
        },
        login: function(user) {
          var authHeaderString = 'Basic ' + btoa(encodeURIComponent(user.email) + ':' + user.password);
          // console.log(atob(authHeaderString));
          $http.defaults.headers.common.Authorization =  authHeaderString;
          $http.post('/api/v2/users/auth', {
          // $http.post('/api/v1/users/auth', {
            // email: encodeURI(user.email),
            // password: user.password
            device: appBootStrap.thisDevice.uuid
            // device: 'eb0af84b7417e4e1'
          })
          .success(function (data, status) {
            $http.defaults.headers.common.Authorization = authHeaderString;  // Step 1

            // Need to inform the http-auth-interceptor that
            // the user has logged in successfully.  To do this, we pass in a function that
            // will configure the request headers with the authorization token so
            // previously failed requests(aka with status == 401) will be resent with the
            // authorization token placed in the header
            // config.headers.Authorization = 'Bearer ' + data.authorizationToken;
            $window.localStorage.authorizationToken = authHeaderString;


            appBootStrap.clientAuthenticationCheck()
            .then(function (isClient) {
              if (isClient.data) {
                // appBootStrap.mockOAuth(isClient.data.clientKey, isClient.data.clientSecret, user)
                appBootStrap.clientOAuth(isClient.data.clientKey, isClient.data.clientSecret, user)
                .then(function () {
                  $rootScope.$broadcast('auth:auth-login-confirmed', status);
                });
              } else {
                appBootStrap.clientAuthenticationCreate()
                .then (function (client) {
                  appBootStrap.clientOAuth(client.data.clientKey, client.data.clientSecret, user)
                  .then(function () {
                    $rootScope.$broadcast('auth:auth-login-confirmed', status);
                  });
                });
              }
            });


          })
          .error(function (data, status) {
            $rootScope.$broadcast('auth:auth-login-failed', status);
            delete $window.localStorage.authorizationToken;
          });
        },
        logout: function(user) {
          $http.delete('/api/v2/users/auth', {})
          .finally(function(data) {
            delete $http.defaults.headers.common.Authorization;
            delete $window.localStorage.authorizationToken;
            $rootScope.$broadcast('auth:auth-logout-complete');
          });
        },
        putUserInfo: function putUserInfo (form) {
          return $http.put('/api/v2/users', form);
        },
        getThisUser: function getThisUser () {
          return $http.get('/api/v2/users');
        }
      };
      return service;
  }]);
  app.factory('Keeper', ['$http', function($http){
      var a = {};

      a.currentFolder = '';

      // a.currentUser = $cookies.throne;

      a.path = [];

      // a.addToCrumb = function (ob) {
      //   a.path.push(ob);
      //   $rootScope.$broadcast('refresh_breadcrumb');
      // };


      /**
       * [thisUserFiles request for files belonging to this user]
       * @param  {[type]}   param
       * @param  {Function} callback
       * @return {[type]}
       */
      a.thisUserFiles = function(param){
        return $http.get('/api/v2/users/files', param)
                .then(function(data) {
                  return data;
                }, function (data, status) {
                  return status;
                });
      };

      /**
       * [thisUserQueue request for this users uncompleted queue]
       * @param  {[type]}   param
       * @param  {Function} callback
       * @return {[type]}
       */
      a.thisUserQueue = function(param, callback){
        $http.get('/api/v2/users/queue', param)
        .success(function(data){
            callback(data);
          })
        .error(function(data){
            console.log(data);
            callback(false);
          });
      };

      a.addToUserQueue = function addToUserQueue (params) {
        return $http.post('/api/v2/users/queue', params);
      };

      /**
       * [deleteThisFile deletes a file belonging to the user]
       * @param  {[type]}   ixid
       * @param  {Function} callback
       * @return {[type]}
       */
      a.deleteThisFile = function(ixid, callback){
        $http.delete('/api/v2/users/files/'+ixid)
        .success(function(data){
          callback(data);
        })
        .error(function(){

        });
      };
      /**
       * [deleteThisFolder deletes a folder belonging to the user]
       * @param  {[type]}   folderId
       * @param  {Function} callback
       * @return {[type]}
       */
      a.deleteThisFolder = function(folderId, callback){
        $http.delete('/api/v2/users/folder/' + folderId)
        .success(function(data){
          callback(data);
        });
        // .error(function(err){

        // });
      };

      /**
       * [removeFromQueue removes an upload from the queue]
       * @param  {[type]}   mid
       * @param  {Function} callback
       * @return {[type]}
       */
      a.removeFromQueue = function(mid){
        return $http.delete('/api/v2/users/queue/'+mid);
      };

      /**
       * [updateTags updates tags belonging ]
       * @param  {[type]}   tags
       * @param  {Function} cb
       * @return {[type]}
       */
      a.updateTags = function(tags, file_id){
        return $http.put('/api/v2/users/files/'+file_id+'/tags', {tags: tags});
      };

      a.search = function(query){
        return $http.get('/api/search/'+query);
      };

      return a;
    }]);
  app.factory('httpBuffer', ['$injector', function($injector) {
    /** Holds all the requests, so they can be re-requested in future. */
    var buffer = [];

    /** Service initialized later because of circular dependency problem. */
    var $http;

    function retryHttpRequest(config, deferred) {
      function successCallback(response) {
        deferred.resolve(response);
      }
      function errorCallback(response) {
        deferred.reject(response);
      }
      $http = $http || $injector.get('$http');
      $http(config).then(successCallback, errorCallback);
    }

    return {
      /**
       * Appends HTTP request configuration object with deferred response attached to buffer.
       */
      append: function(config, deferred) {
        buffer.push({
          config: config,
          deferred: deferred
        });
      },

      /**
       * Abandon or reject (if reason provided) all the buffered requests.
       */
      rejectAll: function(reason) {
        if (reason) {
          for (var i = 0; i < buffer.length; ++i) {
            buffer[i].deferred.reject(reason);
          }
        }
        buffer = [];
      },

      /**
       * Retries all the buffered requests clears the buffer.
       */
      retryAll: function(updater) {
        for (var i = 0; i < buffer.length; ++i) {
          retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
        }
        buffer = [];
      }
    };
  }]);
  app.factory('appDBBridge', [
    'appBootStrap',
    '$q',
    '$injector',
    'PouchDB',
    function (appBootStrap, Q, $injector, PouchDB) {
    return {
      /**
       * returns a document saved in the db
       * @param  {[type]} query          [description]
       * @param  {[type]} collectionName Usually a string which should be a dot-notation representation
       * of the serice/factory name and the method to call.
       * @return {[type]}                Promise
       */
      selectOneDoc: function selectOneDoc (query, collectionName) {
          collectionName = _.kebabCase(collectionName);
          var q = Q.defer(), docid = '';
          if (query.id || query._id) {
            docid = query.id || query._id;
          }

          //query
          PouchDB.get(collectionName + docid)
          .then(function (doc) {
            //return the first result.
            q.resolve(doc);

          }, function (err) {
            //if the document isnt found,
            //i use a resolve so the state
            //transitions successfully allowing the
            //controllers to initialize. we can call
            //for data from the server in our controller
            //which will update our db for subsequent
            //queries.
            if (err.status === 404) {
              q.resolve(null);
            } else {
              q.reject(err);
            }
          })
          .catch(function (err) {
            console.log(err);
            q.reject(err);
          });

          return q.promise;
      },
      /**
       * invokes a angularjs module service or factory method, using
       * the $injector service .get method and passing arguments with
       * .apply()
       * @param  {[type]} serviceMethod expects a string with dot-notation,
       * which is the name of the service / factory and the method it should
       * execute.
       * @param  {[type]} args          arguments to be passed to the factory
       * @return {[type]}               [description]
       */
      callServiceMethod: function callServiceMethod (serviceMethod, args) {
        var $_service;
        var service_name = serviceMethod.split('.')[0];
        var service_method = serviceMethod.split('.')[1];
        $_service = $_service || $injector.get(service_name);
        return $_service[service_method].apply(null, args);
      },
      fetchAndSyncDataToScope: function fetchAndSyncDataToScope (docId, serviceMethod, args) {
          // var q = Q.defer();
          var self = this;

          //check for data if docId is supplied
          //fetch data using the service and argument, callServiceMethod.
          //this expects a thennable promise is returned.
          return self.callServiceMethod(serviceMethod, args)
                .then(function(returnedDoc) {
                    var q = Q.defer();

                    //there's a chance our result is a $http promise object.
                    //which means the data we need is on the .data property
                    if (returnedDoc) {
                      var saveThisDoc = returnedDoc.data || returnedDoc;
                      // var service_name = serviceMethod.split('.')[0];
                      if (_.isArray(saveThisDoc)) {
                        saveThisDoc = self.prepArraytoObject(saveThisDoc);
                      }
                      return self.updateDBCollection(serviceMethod, saveThisDoc);
                    }
                    q.reject(new Error('no document fetched'));
                    return q.promise;
                });
                // .then(self.syncScope(), function (err) {
                //   return q.reject(err);
                // })
                // .catch(function (err) {
                //   return q.reject(err);
                // });


          // //might not come this far,
          // //fallback promise
          // return q.promise;
      },
      updateDBCollection: function updateDBCollection (collectionName, doc, upsert) {
          var q = Q.defer(),
              docid = '',
              self = this;
          collectionName = _.kebabCase(collectionName);
          if (doc.id || doc._id) {
            docid = doc.id || doc._id;
            doc.remoteid = docid;
          }

          function retryUntilWritten(doc) {

              return PouchDB.put(doc)
              .catch(function (err) {
                if (err.status === 409) {
                  return retryUntilWritten(doc);
                } else { // new doc
                  return PouchDB.put(doc);
                }
              });
          }

          //find the update
          self.selectOneDoc(doc, collectionName)
          .then(function (foundDoc) {
            //create a new entry
            if (upsert || !foundDoc) {
              doc._id = collectionName + docid;
            }
            if (foundDoc){
            //using lodash omit to remove the _id
              doc._id = foundDoc._id;
              doc._rev = foundDoc._rev;
            }

            // console.log(JSON.stringify(doc));
            // return PouchDB.put(doc);
            return retryUntilWritten(doc, foundDoc);
          })

          .then(function () {
            q.resolve(doc);
          }, function (err) {
            // i use a resolve here, its kind of a fail safe,
            // since pouchdb gets to throw errors
            // reject promise when there are document conflicts
            console.log(err);
            q.resolve(doc);
          })
          .catch(function (errFindnDoc) {
            console.log(errFindnDoc);
            q.resolve(doc);
          });

          return q.promise;
      },
      /**
       * converts an array to an object that can be saved
       * using PouchDB. each or
       * @param  {[type]} queueData array containing values to be saved.
       * @return {[type]}           [description]
       */
      prepArraytoObject:  function prepArraytoObject (queueData) {
        var endObject = {};
        for (var i = queueData.length - 1; i >= 0; i--) {
          endObject[i] = queueData[i];
        }
        return endObject;
      },
      prepObjectToArray: function prepObjectToArray (queueObject, iterator) {
        var endArray = [], values = _.values(queueObject);
        for (var i = values.length - 1; i >= 0; i--) {
          endArray.push(iterator(values[i]));
        }
        return endArray;
      }

    };
  }]);
  app.factory('cordovaServices', ['$window', '$ionicPlatform', function ($window, $ionicPlatform) {
    return {
      filesystem: function (dataPath, cb) {

        var _currentFileSystem = null;

        function fail (fileError) {
          console.log(fileError);
        }

        function directoryReaderSuccess(entries){
            // again, Eclipse doesn't allow object inspection, thus the stringify
            // console.log(JSON.stringify(entries));

            // alphabetically sort the entries based on the entry's name
            entries.sort(function(a,b){return (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);});

            return cb(entries);

            //  start constructing the view
            var list = '<ul>';
            var skip = null;
            for (var i=0;i<entries.length;i++){
              // should we hide "system" files and directories?
              if (true){
                  skip = entries[i].name.indexOf('.') == 0;
              }
              if (!skip){
                list += '<li><div class="rowTitle" data-action="' + (entries[i].isFile ? 'selectFile' : 'beginBrowseForFiles') + '" \
                     data-type="' + (entries[i].isFile ? 'file':'directory') + '" \
                     data-path="' + entries[i].fullPath + '">' + entries[i].name + '</div>\
                     <div class="alginIconInRow"><img src="images/' + (entries[i].isFile ? 'file':'folder') + '.png"></div>\
                     </li>';
              }
            }
          // insert the list into our container
          // document.getElementById('folderName').innerHTML = list + '</ul>';
        }

        // The requestFileSystemSuccess callback now takes the filesystem object
        // and uses it to create a reader which allows us to get all the entries
        // (files and folders) for the given location. On success we will pass
        // our entry array to a function that will sort them, construct an unordered
        // list and then insert them into the app.
        function requestFileSystemSuccess(fileSystem){
          // lets insert the current path into our UI
          // document.getElementById('folderName').innerHTML = fileSystem.root.fullPath;
          // save this location for future use
          _currentFileSystem = fileSystem;
          // create a directory reader
          var directoryReader = fileSystem.root.createReader();
          // Get a list of all the entries in the directory
          directoryReader.readEntries(directoryReaderSuccess,fail);
        }

        $ionicPlatform.ready(function () {
          // get local file system
          // Request File System
          // function beginBrowseForFiles(dataPath){
          if (!dataPath){
            // get the local file system and pass the result to the success callback
            $window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, requestFileSystemSuccess, null);
          } else {
            // this is used to get subdirectories
            // var path = e.target.attributes['data-path'].nodeValue;
            $window.resolveLocalFileSystemURI(
              dataPath,
              function(filesystem){
                // we must pass what the PhoneGap API doc examples call an "entry" to the reader
                // which appears to take the form constructed below.
                requestFileSystemSuccess({root:filesystem});
              },
              function(err){
                // Eclipse doesn't let you inspect objects like Chrome does, thus the stringify
                console.log('### ERR: filesystem.beginBrowseForFiles() -' + (JSON.stringify(err)));
              }
            );
          }
        });


        // }
        // beginBrowseForFiles(dataPath);
      },
      /**
       * returns the file path from
       * @param  {[type]}   uri [description]
       * @param  {Function} cb  [description]
       * @return {[type]}       [description]
       */
      returnFilePathName: function (uri, cb) {
        window.plugins.filenamequery.getFileName(uri, function (data) {
          var i = data.split('/');
          cb({
            fileName: i[i.length -1],
            fullPath: data
          });
        }, function (err) {
          cb(err);
        });
      },
      getFileObjectfromFS: function getFileObjectfromFS (fileMeta, cb) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {

          fs.root.getFile(fileMeta.fullPath, {create: false}, function (fileEntry) {
            fileEntry.file(function (fileObject) {
              //hack, should always return a file with its real filename and path
              fileObject.name = (ionic.Platform.version() <= 4.3) ? fileObject.name : fileMeta.fileName;
              cb(fileObject);
            }, function (err) {
              console.log(err);
            });
          }, function (err) {
            cb(err);
          });
        }, function (err) {
          console.log(err);
        });
      },
      getFileObjectfromResolve: function getFileObjectfromResolve (uri, fileMeta, cb) {

          window.resolveLocalFileSystemURL(uri,  function (fileEntry) {
            fileEntry.file(function (fileObject) {
              //hack, should always return a file with its real filename and path
              fileObject.name = (ionic.Platform.version() <= 4.3) ? fileObject.name : fileMeta.fileName;
              cb(fileObject);
            }, function (err) {
              console.log(err);
            });
          }, function (err) {
            cb(err);
          });

      }
    };
  }]);
  app.factory('appBootStrap', [
    '$ionicModal',
    '$cordovaDevice',
    '$http',
    'api_config',
    '$q',
    '$window',
    '$ionicPopover',
    '$timeout',
    function ($ionicModal, $cordovaDevice, $http, api_config, $q, $window, $ionicPopover, $timeout) {
    return {
      activeModal: null,
      pendingPrompt: null,
      thisDevice: null,
      isRequesting: false,
      isBrowser: function () {
        return ionic.Platform.platforms.indexOf("browser") === -1;
      },
      isBearerTokenPresent: function () {
        if ($window.localStorage.authorizationToken) {
          if ($window.localStorage.authorizationToken.split(' ')[0] === 'Bearer'){
            //returns 1, if there is a bearer token
            return 1;
          }
          //anything other than a bearer token
          return 2;
        }
        return false;
      },
      modals: {},
      openOnStateChangeSuccess: function openOnStateChangeSuccess (actionName) {
        console.log('should set');
        this.pendingPrompt = actionName;
        console.log(actionName, this.pendingPrompt);
      },
      clearPendingPrompts: function clearPendingPrompts () {
        this.pendingPrompt = null;
        console.log(this.pendingPrompt);
      },
      strapCordovaDevice: function () {
        var self = this;
        console.log('strapped');
        return $timeout(function () {
          self.thisDevice = $cordovaDevice.getDevice();
        });
      },
      tagPopOverinit: function (scope, cb) {
        // .fromTemplateUrl() method
        $ionicPopover.fromTemplateUrl('templates/inc/tag-popover.html', {
          scope: scope,
        }).then(function(popover) {
          cb(popover);
        });
      },
      clientAuthenticationCheck: function () {
        var
            deviceId = $cordovaDevice.getUUID();
        return $http.get('/api/v2/clients/' + deviceId + '?field_type=device');

      },
      clientAuthenticationCreate: function () {
        var
            deviceName = $cordovaDevice.getModel() || 'Unknown Device',
            deviceId = $cordovaDevice.getUUID();
            return $http.post('/api/v2/clients', {
              name: deviceName,
              deviceId: deviceId
            });

      },
      clientAuthenticationReset: function (cb) {
        var
            deviceId = $cordovaDevice.getUUID();
        $http.delete('/api/v2/clients/' + deviceId + '?field_type=id')
        .success(function (data) {
          cb (data);
        })
        .error(function (err) {
          console.log(err);
          console.log('device client reg failed');
        });
      },
      clientAuthenticationSave: function () {

      },
      clientOAuth: function clientOAuth (clientId, clientSecret, user) {
        var deferred = $q.defer();
        if(window.cordova) {
          // console.log('cordova');
            var cordovaMetadata = cordova.require("cordova/plugin_list").metadata;
            // console.log(cordovaMetadata);
            if(cordovaMetadata.hasOwnProperty("org.apache.cordova.inappbrowser") === true) {

                var browserRef = window.open(api_config.CONSUMER_API_URL + "/oauth/authorize?client_id=" + clientId + "&redirect_uri=http://localhost/callback&response_type=code&scope=read%20write&email=" +user.email+ "&password=" + user.password, "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
                browserRef.addEventListener("loadstart", function(event) {
                    if((event.url).indexOf("http://localhost/callback") === 0) {
                        var requestToken = (event.url).split("code=")[1];
                        $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
                        var authHeaderString = 'Basic ' + btoa(clientId + ':' + clientSecret);
                        delete $http.defaults.headers.common.Authorization;
                        $window.localStorage.authorizationToken  =  authHeaderString;
                        $http({
                          method: "post",
                          url: api_config.CONSUMER_API_URL + "/oauth/token",
                          data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=http://localhost/callback" + "&grant_type=authorization_code" + "&code=" + requestToken ,
                          // headers: {
                          //   "Authorization" : authHeaderString
                          // }
                        })
                            .success(function(data) {
                                $window.localStorage.authorizationToken = 'Bearer ' + data.access_token;
                                browserRef.close();
                                deferred.resolve(data);
                            })
                            .error(function(data, status) {
                                browserRef.close();
                                deferred.reject("Problem authenticating");
                            })
                            .finally(function() {
                              browserRef.close();

                            });
                    }
                });
                browserRef.addEventListener('exit', function(event) {
                    deferred.reject("The sign in flow was canceled");
                });
            } else {
                deferred.reject("Could not find InAppBrowser plugin");
            }
        } else {
            deferred.reject("Cannot authenticate via a web browser");
        }
        return deferred.promise;
      }
    };
  }]);

})();

