const j = require('jscodeshift');
const assert = require("assert");
const rawSource = `
    const x =  y || 2 || !FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && 3;
    if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && 1) {
        console.log(1);
    } else if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && 2) {
        console.log(2);
    } else {
        console.log(3);
    }
    
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

const leftOfLogicalExpression = (childNode, parentNode) => {
    if(childNode.value.loc.start.line === parentNode.value.loc.start.line && childNode.value.loc.start.column === parentNode.value.loc.start.column) {
        return true;
    }
    return false;
}
const handleLogicalExpression = (featureName, astRoot) => {
    const featureToggleCalls = astRoot.find(j.CallExpression, createFeatureToggleCallExpression(featureName));
    featureToggleCalls.forEach(p => {
        let parent = p.parentPath;
        let currentPath = p;
        let operatorStr = '';
        while(parent.value.type === 'UnaryExpression') {
            operatorStr += parent.value.operator;
            currentPath = parent;
            parent = parent.parentPath;
        }
        
        let result = true;
        
        if(operatorStr.length > 0) {
            result = eval(operatorStr + result);
        }
        //let isOnLeft = leftOfLogicalExpression(currentPath, parent);
        let lastResult = result;
        j(currentPath).replaceWith(j.literal(result));
        let canReplace = true;
        while(parent.value.type === 'LogicalExpression' && canReplace) { 
            let operator = parent.value.operator;
            if(operator === '||') {
                if(lastResult) {
                    j(parent).replaceWith(j.literal(lastResult));
                } else {
                    if(parent.value.left.value === lastResult) {
                        j(parent).replaceWith(parent.value.right);
                        canReplace = false;
                    } else {
                        j(parent).replaceWith(parent.value.left);
                        canReplace = false;
                    }
                }
            } else if(operator === '&&') {
                if(lastResult) {
                    if(parent.value.left.value === lastResult) {
                        j(parent).replaceWith(parent.value.right);
                        canReplace = false;
                    } else {
                        j(parent).replaceWith(parent.value.left);
                        canReplace = false;
                    }
                } else {
                    j(parent).replaceWith(j.literal(lastResult));
                }
            }
            parent = parent.parentPath;
           
        }
        
    })
    return astRoot.toSource();
};

const handleFeatureToggleCalls = (featureName, astRoot) => {
    const featureToggleCalls = astRoot.find(j.CallExpression, createFeatureToggleCallExpression(featureName));
    featureToggleCalls.forEach(p => {
        let parent = p.parentPath;
        let operatorStr = '';
        let currentPath = p;
        while(parent.value.type === 'UnaryExpression') {
            operatorStr += parent.value.operator;
            currentPath = parent;
            parent = parent.parentPath;
        }
        
        let result = true;
        if(operatorStr.length > 0) {
            result = eval(operatorStr + result);
        }

        if(parent.value.type === 'VariableDeclarator') {
            parent.value.init = j.literal(result);
        } else if(parent.value.type === 'LogicalExpression') {
            
            let lastResult = result;
            let canReplace = true;
            j(currentPath).replaceWith(j.literal(result));
            while(parent.value.type === 'LogicalExpression' && canReplace) { 
                let operator = parent.value.operator;
                if(operator === '||') {
                    if(lastResult) {
                        j(parent).replaceWith(j.literal(lastResult));
                    } else {
                        if(parent.value.left.value === lastResult) {
                            lastResult = parent.value.right;
                            j(parent).replaceWith(parent.value.right);
                            canReplace = false;
                        } else {
                            lastResult = parent.value.left;
                            j(parent).replaceWith(parent.value.left);
                            canReplace = false;
                        }
                    }
                } else if(operator === '&&') {
                    if(lastResult) {
                        if(parent.value.left.value === lastResult) {
                            lastResult = parent.value.right;
                            j(parent).replaceWith(parent.value.right);
                            canReplace = false;
                        } else {
                            lastResult = parent.value.left;
                            j(parent).replaceWith(parent.value.left);
                            canReplace = false;
                        }
                    } else {
                        j(parent).replaceWith(j.literal(lastResult));
                    }
                }
                parent = parent.parentPath;
            }
            
            while(parent.value.type === 'IfStatement') {
                
                if(lastResult === true) {
                    let ifBody = parent.value.consequent.body;
                    const trailingComments = parent.value.trailingComments;
                    const comments = parent.value.comments;
                    
                    // attach comments to the ifBody Node
                    ifBody[0].comments = comments;
                    ifBody[0].trailingComments = trailingComments;
                    
                    j(parent).replaceWith(ifBody);
                    
                } else if(lastResult === false){
                    if(parent.value.alternate) {
                        
                        j(parent).replaceWith(parent.value.alternate);
                        //console.log(parent);
                    } else {
                        
                        j(parent).remove();
                    }
                    
                }
                //parent = parent.parentPath;
            }
            if(parent.value.type === 'BlockStatement') {
                j(parent).replaceWith(parent.value.body);
            }
        } else if(parent.value.type === 'IfStatement') {
            
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
    })
    return astRoot.toSource();
};
const featureNameToRemove = 'TERM_ACCOUNT_DEPOSIT';

const transformed = handleFeatureToggleCalls(featureNameToRemove, astRoot);

console.log(transformed);
//assert.equal(transformed, expectedSource, '');