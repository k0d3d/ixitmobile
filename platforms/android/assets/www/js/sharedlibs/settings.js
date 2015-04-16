var config_module = angular.module('ixitApp.config', []);
var config_data = {
  'appData': {
    'app_name': 'IXIT Mobile',
    'filetypeIcons': [
      'accdb',
      'eml',
      'htm',
      'jsf',
      'no-img',
      'proj',
      'readme',
      'vsd',
      'xlsx_mac',
      'bmp',
      'eps',
      'ind',
      'midi',
      'pdf',
      'psd',
      'settings',
      'wav',
      'xlsx',
      'css',
      'fla',
      'ini',
      'mov',
      'png',
      'pst',
      'text',
      'wma',
      'doc',
      'gif',
      'jpeg',
      'mp3',
      'pptx_mac',
      'pub',
      'tiff',
      'wmv',
      'docx',
      'html',
      'jpg',
      'mpeg',
      'pptx_win',
      'rar',
      'url',
      'xls'
    ]
  },
  'api_config': {
    // 'url': 'http://192.168.1.3:3000'
    // 'CONSUMER_API_URL': 'http://192.168.42.18:3000',
    // 'FILEVAULT_API_URL': 'http://192.168.42.18:3001',
    'CONSUMER_API_URL': 'http://192.168.1.4:3000',
    'FILEVAULT_API_URL': 'http://192.168.1.4:3001'
    // 'CONSUMER_API_URL': 'http://thawing-wave-1121.herokuapp.com',
    // 'FILEVAULT_API_URL': 'http://dk33p.herokuapp.com'
    // 'CONSUMER_API_URL': 'http://127.0.0.1:3000',
    // 'FILEVAULT_API_URL': 'http://127.0.0.1:3001'
    // 'CONSUMER_API_URL': 'http://192.168.56.1:3000',
    // 'FILEVAULT_API_URL': 'http://192.168.56.1:3001'
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});