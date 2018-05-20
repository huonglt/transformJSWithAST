/*
 * Add feature to remoteFeatureConfig file
 */ 
const add = (fileInfo, api, {featureName, localFeatureName, enableValue}) => {
    console.log(`Add feature to remoteFeatureConfig file: ${featureName}, ${localFeatureName}, ${enableValue}`);
    return api.jscodeshift(fileInfo.source).toSource();
};

/*
 * Remove feature from localFeatureConfig file
 */ 
const remove = (fileInfo, api) => {
    console.log('Remove feature to remoteFeatureConfig file');
    return api.jscodeshift(fileInfo.source).toSource();
};

/*
 * Toggle feature
 * Need to find way to pass in feature name and enable value
 */
const toggle = (fileInfo, api, featureName, enableValue) => {
    console.log('Toggle feature to remoteFeatureConfig file ' + featureName + ', enableValue = ' + enableValue);
    return api.jscodeshift(fileInfo.source).toSource();
}; 

module.exports = {
    add,
    remove,
    toggle
};