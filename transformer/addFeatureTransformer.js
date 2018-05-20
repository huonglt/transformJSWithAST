const localTransformer = require('./localTransformer');
const remoteTransformer = require('./remoteTransformer');
const mockTransformer = require('./mockTransformer');

const FEATURE_CONFIG_FILES = {
    localFile: 'featureConfig/localFile.js',
    remoteFile: 'featureConfig/remoteFile.js',
    mockFile: 'featureConfig/mockFile.js'  
  };
  
  /*
   * Running jscodeshift on 3 files
   * Different tranformer function for each file
   */   
  const addFeature = (fileInfo, api, options) => {
      if(fileInfo.path === FEATURE_CONFIG_FILES.localFile) {
          return localTransformer.add(fileInfo, api, options);
      } else if(fileInfo.path === FEATURE_CONFIG_FILES.remoteFile) {
          return remoteTransformer.add(fileInfo, api, options);
      } else if(fileInfo.path === FEATURE_CONFIG_FILES.mockFile) {
          return mockTransformer.add(fileInfo, api, options);
      } else {
          return;
      }
      
  }
  module.exports = addFeature;