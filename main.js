const path = require('path');
const { exec, fork } = require('child_process');

const jscodeShiftPath = path.resolve(__dirname, './node_modules/jscodeshift/bin/jscodeshift.sh');
const addFeatureTransformerPath = path.resolve(__dirname, './transformer/addFeatureTransformer.js');
const toggleFeatureTransformerPath = path.resolve(__dirname, './transformer/toggleFeatureTransformer.js');
const ignoreFilePath = path.resolve(__dirname, 'ft.ignore');
/*
 * Command to run
 * node_modules/jscodeshift/bin/jscodeshift.sh -t main.js . --ignore-pattern node_modules 
 * node_modules/jscodeshift/bin/jscodeshift.sh -t main.js . --ignore-config ft.ignore
 */

 const execJSCodeShift = (script) => {
    exec(script, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
 };
/*
 * Capture application input from command line arguments
 * handle the app behaviour
 * node main (or a better name etc FT) add public_feature_name feature_name
 */
const run = () => {
    const action = process.argv[2];
    if(action && action.toUpperCase() === 'ADD') {
        const [,,, featureName, localFeatureName, enableValue = true] = process.argv;
        if(!featureName ||  !localFeatureName) {
            console.log('Need to enter feature name or local feature name');
            return;
        }
        const optionStr =  `--featureName=${featureName} --localFeatureName=${localFeatureName} --enableValue=${enableValue}`;
        // have all data required
        console.log('add a new feature:');
        console.log(`public feature name = ${featureName}, local feature name = ${localFeatureName}`);
        
        const scriptStr = jscodeShiftPath + ' -t ' + addFeatureTransformerPath + ' . ' + '--ignore-config ' + ignoreFilePath + ' ' + optionStr;
        
        execJSCodeShift(scriptStr);
    } else if(action && action.toUpperCase() === 'TOGGLE') {
        const [,,, featureName, enableValue] = process.argv;
        if(!featureName || enableValue === null || enableValue === undefined) {
            console.log('Need to provide name of the feature to toggle or enable value');
            return;
        }
        const options = {featureName, enableValue};
        // have all data required
        console.log('toggle feature: ' + JSON.stringify(options));
        const optionStr =  `--featureName=${featureName} --enableValue=${enableValue}`;
        
        const scriptStr = jscodeShiftPath + ' -t ' + toggleFeatureTransformerPath + ' . ' + '--ignore-config ' + ignoreFilePath + ' ' + optionStr;
        
        execJSCodeShift(scriptStr);
    } else if(action && action.toUpperCase() === 'REMOVE') {
        const [,,, featureName] = process.argv;
        if(!featureName) {
            console.log('Need to provide name of the feature to remove');
            return;
        }
        const optionStr =  `--featureName=${featureName}`;
        //const scriptStr = jscodeShiftPath + ' -t ' + toggleFeatureTransformerPath + ' . ' + '--ignore-config ' + ignoreFilePath + ' ' + optionStr;
        
        //execJSCodeShift(scriptStr);
        console.log(`removing feature ${featureName}`);
    }   

};



/*
 * Running jscodeshift on 3 files
 * Different tranformer function for each file
 */
/*   
const toggleFeature = (fileInfo, api) => {
    if(fileInfo.path === FEATURE_CONFIG_FILES.localFile) {
        return localTransformer.toggle(fileInfo, api);
    } else if(fileInfo.path === FEATURE_CONFIG_FILES.remoteFile) {
        return remoteTransformer.toggle(fileInfo, api);
    } else if(fileInfo.path === FEATURE_CONFIG_FILES.mockFile) {
        return mockTransformer.toggle(fileInfo, api);
    } else {
        return;
    }
    
}*/
run();
//module.exports = addFeature;

