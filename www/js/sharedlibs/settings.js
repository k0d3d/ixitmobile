var config_module = angular.module('ixitApp.config', []);
var config_data = {
  "app": {
    'app_name': 'IXIT Mobile'
  },
  'api_config': {
    // 'url': 'http://drugstoc.ng'
    // 'url': 'http://192.168.1.3:3000'
    'CONSUMER_API_URL': "http://192.168.1.3:3000",
    'FILEVAULT_API_URL': "http://192.168.1.3:3001"
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});