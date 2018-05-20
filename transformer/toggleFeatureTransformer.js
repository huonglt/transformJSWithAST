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
  const toggleFeature = (fileInfo, api, {featureName, enableValue}) => {
      if(fileInfo.path === FEATURE_CONFIG_FILES.localFile) {
          return localTransformer.toggle(fileInfo, api, featureName, enableValue);
      } else if(fileInfo.path === FEATURE_CONFIG_FILES.remoteFile) {
          return remoteTransformer.toggle(fileInfo, api, featureName, enableValue);
      } else if(fileInfo.path === FEATURE_CONFIG_FILES.mockFile) {
          return mockTransformer.toggle(fileInfo, api, featureName, enableValue);
      } else {
          return;
      }
      
  }
  module.exports = toggleFeature;