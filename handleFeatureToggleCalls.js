const j = require('jscodeshift');
const assert = require("assert");

const rawSource = `
    const x = !FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) || 1;
    const x = FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && a || b;
    if(FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)) {
        console.log('feature on');
    } else {
        console.log('feature off');
    }
    if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && x) {
        console.log('feature on');
    } else {
        console.log('feature off');
    }
    if(x) {
        console.log(x);
    } else if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)) {
        console.log('feature on');
    }
    
    if(someExpression) {
        if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && x) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }
        if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && x) {
            console.log('feature on');
        } else if(y) {
            console.log('feature off');
        }
        if(y || !FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && x) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }
        if(x) {
            console.log(x);
        } else if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && x) {
            console.log('off');
        }
    }
    const y = FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) ? true : false;
    const y = (FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) || x) ? true : false;
    const y = (FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && x) ? x : y;
    console.log('end');
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

const handleIfStatement = (path) => {
    const expressionValue = path.value.test.value;
    if(expressionValue=== true) {
        // to avoid broken if when parentPath is another if
        if(path.parentPath.value.type !== 'IfStatement') {
           j(path).replaceWith(path.value.consequent.body);
        }
    } else if(expressionValue === false) {
        if(path.value.alternate) {
            if(path.value.alternate.type === 'IfStatement') {
                j(path).replaceWith(path.value.alternate);
            } else {
                j(path).replaceWith(path.value.alternate.body);
            }
        } else {
            j(path).remove();
        }
    }
};

const handleConditionalExpression = (path) => {
    const expressionValue = path.value.test.value;
    if(expressionValue === true) {
        j(path).replaceWith(path.value.consequent);
    } else if(expressionValue === false) {
        j(path).replaceWith(path.value.alternate);
    }
};

const handleLogicalExpression = (path, evalutedValue) => {
    let keepReplacing = true;
    
    while(path.value.type === 'LogicalExpression' && keepReplacing) { 
        let operator = path.value.operator;
        if(operator === '||') {
            if(evalutedValue) {
                j(path).replaceWith(j.literal(evalutedValue));
            } else {
                if(path.value.left.value === evalutedValue) {
                    evalutedValue = path.value.right;
                    j(path).replaceWith(path.value.right);
                    keepReplacing = false;
                } else {
                    evalutedValue = path.value.left;
                    j(path).replaceWith(path.value.left);
                    keepReplacing = false;
                }
            }
        } else if(operator === '&&') {
            if(evalutedValue) {
                if(path.value.left.value === evalutedValue) {
                    evalutedValue = path.value.right;
                    j(path).replaceWith(path.value.right);
                    keepReplacing = false;
                } else {
                    evalutedValue = path.value.left;
                    j(path).replaceWith(path.value.left);
                    keepReplacing = false;
                }
            } else {
                j(path).replaceWith(j.literal(evalutedValue));
            }
        }
        path = path.parentPath;
    }
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
        
        let evalutedValue = true;
        if(operatorStr.length > 0) {
            evalutedValue = eval(operatorStr + evalutedValue);
        }
        j(currentPath).replaceWith(j.literal(evalutedValue));
        if(parent.value.type === 'LogicalExpression') {
            handleLogicalExpression(parent, evalutedValue);
            if(parent.value.type === 'IfStatement') {
                handleIfStatement(parent);
            } else if(parent.value.type === 'ConditionalExpression') {
                handleConditionalExpression(parent);
            }
        } else if(parent.value.type === 'IfStatement') {
            handleIfStatement(parent);
        } else if(parent.value.type === 'ConditionalExpression') {
            handleConditionalExpression(parent);
        }
    });
    return astRoot.toSource();
};
const featureNameToRemove = 'TERM_ACCOUNT_DEPOSIT';

const transformed = handleFeatureToggleCalls(featureNameToRemove, astRoot);
console.log(transformed);
