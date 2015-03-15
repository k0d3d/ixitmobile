var config_module = angular.module('ixitApp.config', []);
var config_data = {
  'appData': {
    'app_name': 'IXIT Mobile',
    'filetypeIcons': [
      'accdb.png',
      'eml.png',
      'htm.png',
      'jsf.png',
      'no-img.png',
      'proj.png',
      'readme.png',
      'vsd.png',
      'xlsx_mac.png',
      'bmp.png',
      'eps.png',
      'ind.png',
      'midi.png',
      'pdf.png',
      'psd.png',
      'settings.png',
      'wav.png',
      'xlsx.png',
      'css.png',
      'fla.png',
      'ini.png',
      'mov.png',
      'png.png',
      'pst.png',
      'text.png',
      'wma.png',
      'doc.png',
      'gif.png',
      'jpeg.png',
      'mp3.png',
      'pptx_mac.png',
      'pub.png',
      'tiff.png',
      'wmv.png',
      'docx.png',
      'html.png',
      'jpg.png',
      'mpeg.png',
      'pptx_win.png',
      'rar.png',
      'url.png',
      'xls.png'
    ]
  },
  'api_config': {
    // 'url': 'http://drugstoc.ng'
    // 'url': 'http://192.168.1.3:3000'
    // 'CONSUMER_API_URL': 'http://192.168.43.184:3000',
    // 'FILEVAULT_API_URL': 'http://192.168.43.184:3001',
    // 'CONSUMER_API_URL': 'http://192.168.1.5:3000',
    // 'FILEVAULT_API_URL': 'http://192.168.1.5:3001'
    'CONSUMER_API_URL': 'http://thawing-wave-1121.herokuapp.com',
    'FILEVAULT_API_URL': 'http://dk33p.herokuapp.com'
    // 'CONSUMER_API_URL': 'http://127.0.0.1:3000',
    // 'FILEVAULT_API_URL': 'http://127.0.0.1:3001'
    // 'CONSUMER_API_URL': 'http://192.168.56.1:3000',
    // 'FILEVAULT_API_URL': 'http://192.168.56.1:3001'
  }
};
angular.forEach(config_data,function(key,value) {
  config_module.constant(value,key);
});