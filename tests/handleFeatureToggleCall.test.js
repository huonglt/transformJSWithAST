const j = require('jscodeshift');
const FT = require('../handleFeatureToggleCalls');

const featureNameToRemove = 'TERM_ACCOUNT_DEPOSIT';

describe('Variable declarator', () => {
    test('variable evaluated to true', () => {
        const data = `const x = FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove});`;
        const expected = 'const x = true;';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable evaluated to expression', () => {
        const data = `const x = FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) && someExp;`;
        const expected = 'const x = someExp';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with a unary operator, will evaluated to false', () => {
        const data = `const x = !FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove})`;
        const expected = 'const x = false';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with two unary operator, will evaluated to true', () => {
        const data = `const x = !!FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove})`;
        const expected = 'const x = true';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with two unary operator , and AND logical expression, will evaluated to expression', () => {
        const data = `const x = !!FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) && someExp`;
        const expected = 'const x = someExp';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with two unary operator and OR logail expression, will evaluated to true', () => {
        const data = `const x = !!FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) || someExp`;
        const expected = 'const x = true';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
});

describe('If statement', () => {
    test('If block with no alternate statement. The if body block will be pushed to the level of the if block', () => {
        const data = `if(FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove})) {
            console.log('feature on');
        }`;
        const expected = `console.log('feature on');`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('if block with alternate statement', () => {
        const data = `if(FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove})) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }`;
        const expected = `console.log('feature on');`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('if block with the test expression valuated to expression', () => {
        const data = `if(FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) && x) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }`;
        const expected = `if(x) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });

    test('if block with the test expression valuated to false', () => {
        const data = `if(!FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) && x) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }`;
        const expected = `console.log('feature off');`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });

    test('The feature toggle call is in the else block', () => {
        const data = `if (x) {
            console.log(x);
        } else if(!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)) {
            console.log('feature on');
        }`;
        const expected = `if (x) {
            console.log(x);
        }`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });

    test('Complicated if statement', () => {
        const data = `if(y || !FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) && x) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }`;
        const expected = `if(y) {
            console.log('feature on');
        } else {
            console.log('feature off');
        }`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
});

describe('Conditional Expression', () => {
    it('Expression evaluted to true', () => {
        const data = `const y = FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) ? true : false;`;
        const expected = `const y = true;`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    it('Expression evaluted to true', () => {
        const data = `const y = (FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) || x) ? true : false;`;
        const expected = `const y = true;`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    it('Expression evaluated to another expression', () => {
        const data = `const y = (FeatureToggle.isFeatureEnabled(FeatureToggle.${featureNameToRemove}) && x) ? x : y;`;
        const expected = `const y = (x) ? x : y`;
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
});