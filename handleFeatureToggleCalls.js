const j = require('jscodeshift');
const assert = require("assert");
const rawSource = `
    let x = 0;
    let y = 0;
    // let z = 3;
    
    const x = 1 || FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && 2;
    if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)) {
        console.log('will be removed');
    }
    if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && 1) {
        console.log('will be removed');
    }
    if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) || 1) {
        console.log('become 1');
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
        let parent = p.parentPath;
        let operatorStr = '';
        while(parent.value.type === 'UnaryExpression') {
            operatorStr += parent.value.operator;
            parent = parent.parentPath;
        }
        
        let result = true;
        if(operatorStr.length > 0) {
            result = eval(operatorStr + result);
        }
        if(parent.value.type === 'VariableDeclarator') {
            parent.value.init = j.literal(result);
        } else if(parent.value.type === 'LogicalExpression') {
            console.log('Logical Expressionn');
            
            const operator = parent.value.operator;
            if(parent.value.right.loc.end.line === p.value.loc.end.line && parent.value.right.loc.end.column === p.value.loc.end.column) {
                console.log('the call expression on the right of     the logical expression');
                if(operator === '||') {
                    if(!result) {
                        j(parent).replaceWith(parent.value.left);
                    } else {
                        if(parent.parentPath.value.type === 'IfStatement') {
                            const ifBody = parent.parentPath.value.consequent.body;
                            j(parent.parentPath).replaceWith(ifBody);
                        } else {
                            j(parent).replaceWith(j.literal(true));
                        }
                    }
                } else if(operator === '&&') {
                    if(result) {
                        j(parent).replaceWith(parent.value.left);
                    } else {
                        if(parent.parentPath.value.type === 'IfStatement') {
                            j(parent.parentPath).remove();
                        } else {
                            j(parent).replaceWith(j.literal(false));
                        }
                    }
                }
            } else if(parent.value.left.loc.end.line === p.value.loc.end.line && parent.value.left.loc.end.column === p.value.loc.end.column) {
                console.log('the call expression on the left of the logical expression');
                if(operator === '||') {
                    if(!result) {
                        j(parent).replaceWith(parent.value.right);
                    } else {
                        if(parent.parentPath.value.type === 'IfStatement') {
                            const ifBody = parent.parentPath.value.consequent.body;
                            j(parent.parentPath).replaceWith(ifBody);
                        } else {
                            j(parent).replaceWith(j.literal(true));
                        }
                    }
                } else if(operator === '&&') {
                    if(result) {
                        j(parent).replaceWith(parent.value.right);
                    } else {
                        if(parent.parentPath.value.type === 'IfStatement') {
                            j(parent.parentPath).remove();
                        } else {
                            j(parent).replaceWith(j.literal(false));
                        }
                    }
                }
            }
        } else if(parent.value.type === 'IfStatement') {
            console.log('IfStatement');
            if(result) {
                let ifBody = parent.value.consequent.body;
                const trailingComments = parent.value.trailingComments;
                const comments = parent.value.comments;
                
                // attach comments to the ifBody Node
                ifBody[0].comments = comments;
                ifBody[0].trailingComments = trailingComments;
                
                j(parent).replaceWith(ifBody);
            } else {
                j(parent).remove();
            }
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
//assert.equal(transformed, expectedSource, '');