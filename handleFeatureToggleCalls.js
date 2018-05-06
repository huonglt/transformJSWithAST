const j = require('jscodeshift');
const assert = require("assert");
const rawSource = `
    let x = 0;
    let y = 0;
    // let z = 3;
    /*
     * the if block will be removed when feature is cleaned up
     */
    if(FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)) {
        x = 1;
        y = 2;
    }
      
    if(!!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) || y || 1) {
        x = 1;
    }
    console.log(x);
`;
const astRoot = j(rawSource);

const createFeatureToggleCallExpression = (featureName) => {
    return { 
        callee: { 
            object: {name: 'FeatureToggle'}, 
            property: {name: 'isFeatureEnabled'}
        },
        arguments: [{object: {name: 'FeatureToggle'}, property: {name: featureName}}]
    };
};


const handleFeatureToggleCalls = (featureName, astRoot) => {
    const featureToggleCalls = astRoot.find(j.CallExpression, createFeatureToggleCallExpression(featureName));
    featureToggleCalls.forEach(p => {
        if(p.parentPath.value.type === 'VariableDeclarator') {
            j(p).replaceWith(j.literal(true));
        } else if(p.parentPath.value.type === 'IfStatement'){
            let ifBody = p.parentPath.value.consequent.body;
            const trailingComments = p.parentPath.value.trailingComments;
            const comments = p.parentPath.value.comments;
            
            // attach comments to the ifBody Node
            ifBody[0].comments = comments;
            ifBody[0].trailingComments = trailingComments;
            
            j(p.parentPath).replaceWith(ifBody);
            
        } else if(p.parentPath.value.type === 'LogicalExpression') {
            const logicaExpression = p.parentPath;
            
            if(p.value.loc.start.line === p.parentPath.value.loc.start.line && p.value.loc.start.column === p.parentPath.value.loc.start.column) {
                const rightOperatorNode = p.parentPath.value.right;
                j(p.parentPath).replaceWith(rightOperatorNode);
            } else {
                const leftOperatorNode = p.parentPath.value.left;
                j(p.parentPath).replaceWith(leftOperatorNode);
            }
        } else if(p.parentPath.value.type === 'UnaryExpression') {
            j(p).replaceWith(j.literal(true));
        }
    });
    return astRoot.toSource();
};

const featureNameToRemove = 'TERM_ACCOUNT_DEPOSIT';

const transformed = handleFeatureToggleCalls(featureNameToRemove, astRoot);

const expectedSource = `
    let x = 0;
    let y = 0;
    // let z = 3;
    /*
     * the if block will be removed when feature is cleaned up
     */
    x = 1;
    y = 2;

    if(!!true || y || 1) {
        x = 1;
    }
    console.log(x);
`;
console.log(transformed);
assert.equal(transformed, expectedSource, '');