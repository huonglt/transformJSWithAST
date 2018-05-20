const j = require('jscodeshift');
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

const handleLogicalExpression = (path, computedValue) => {
    let keepReplacing = true;
    
    while(path.value.type === 'LogicalExpression' && keepReplacing) { 
        let operator = path.value.operator;
        if(operator === '||') {
            if(computedValue) {
                j(path).replaceWith(j.literal(computedValue));
            } else {
                if(path.value.left.value === computedValue) {
                    computedValue = path.value.right;
                    j(path).replaceWith(path.value.right);
                    keepReplacing = false;
                } else {
                    computedValue = path.value.left;
                    j(path).replaceWith(path.value.left);
                    keepReplacing = false;
                }
            }
        } else if(operator === '&&') {
            if(computedValue) {
                if(path.value.left.value === computedValue) {
                    computedValue = path.value.right;
                    j(path).replaceWith(path.value.right);
                    keepReplacing = false;
                } else {
                    computedValue = path.value.left;
                    j(path).replaceWith(path.value.left);
                    keepReplacing = false;
                }
            } else {
                j(path).replaceWith(j.literal(computedValue));
            }
        }
        path = path.parentPath;
    }
    return path;
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
        let computedValue = true;
        if(operatorStr.length > 0) {
            computedValue = eval(operatorStr + computedValue);
        }
        j(currentPath).replaceWith(j.literal(computedValue));
        
        if(parent.value.type === 'LogicalExpression') {
            parent = handleLogicalExpression(parent, computedValue);
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
exports.handleFeatureToggleCalls = handleFeatureToggleCalls;
