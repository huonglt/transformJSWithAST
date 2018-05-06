const j = require('jscodeshift');
const rawSource = `
    console.log('anything before');
    const localFeatureConfigs = {
        FEATURE_A: {
            name: 'featureA',
            enable: false
        },
        FEATURE_B: {
            name: 'featureB',
            enable: true
        }
    };
    console.log('anything after');
`;
const rootAST = j(rawSource);
const printOptions = { quote: 'single' };
const FEATURE_CONFIG_NAME = 'localFeatureConfigs';

const removeEmptyLine = (str) => str.replace(/(},\n*)/g, '},\n');
const getFeatureConfigNode = (rootAST) => rootAST.find(j.VariableDeclarator, {id: {name: FEATURE_CONFIG_NAME}});
const removeEmptyLineFromTransformedSource = (transformedSrc) => {
    const regExp = new RegExp(FEATURE_CONFIG_NAME + '\\s*=\\s*({)((\\s*.)*)(};)');
    const featureConfigStr = transformedSrc.match(regExp)[2];
    return transformedSrc.replace(featureConfigStr, removeEmptyLine(featureConfigStr));
};

const addFeature = (rootAST, publicFeatureName, localFeatureName, enableValue) => {
    const featureConfigNode = getFeatureConfigNode(rootAST);
    let featureNode = featureConfigNode.find(j.Property, {key: {name: publicFeatureName}});
    // feature key exist
    if(featureNode.__paths[0]) {
        const nameNode = featureNode.find(j.Property, {key: {name: 'name'}, value: {value: localFeatureName}}).__paths[0];
        if(nameNode) {
            let enableNode = featureNode.find(j.Property, {key: {name: 'enable'}}).__paths[0];
            // set enable value here
            if(enableNode) {
                enableNode.value.value = j.literal(enableValue);
            } else {
                // if enable node is not found, something wrong. Should create it here
                enableNode = j.objectProperty(j.identifier('enable'), j.literal(enableValue));
                featureNode.__paths[0].value.value.properties.push(enableNode);
            }
        } else {
            console.log('Something wrong here. Public Feature key match, but local feature key does not match. Check again');
        }
    } else {
        // create new feature node
        featureNode = j.objectProperty(j.identifier(publicFeatureName), j.objectExpression([
                j.objectProperty(j.identifier('name'), j.literal(localFeatureName)),
                j.objectProperty(j.identifier('enable'), j.literal(enableValue))]));
        
        featureConfigNode.__paths[0].value.init.properties.push(featureNode);
        
        // recast adds an extra empty line after each property inside localFeatureConfigs. need to remove it
        return removeEmptyLineFromTransformedSource(rootAST.toSource(printOptions));
    }
    return rootAST.toSource(printOptions);
};

const removeFeature = (rootAST, publicFeatureName) => {
    return getFeatureConfigNode(rootAST)
    .find(j.Property, {key: {name: publicFeatureName}})
    .forEach(p => j(p).remove()).toSource(printOptions);
};

const toggleFeature = (rootAST, publicFeatureName, enableValue) => {
    return getFeatureConfigNode(rootAST)
    .find(j.Property, {key: {name: publicFeatureName}})
    .find(j.Property, {key: {name: 'enable'}})
    .forEach(p => p.value.value.value = enableValue).toSource(printOptions);
};
let tranformed = addFeature(rootAST, 'FEATURE_C', 'featureC', true);
//tranformed = toggleFeature(rootAST, 'FEATURE_A', false);
//tranformed = removeFeature(rootAST, 'FEATURE_B');

console.log(tranformed);
