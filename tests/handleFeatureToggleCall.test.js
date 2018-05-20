const j = require('jscodeshift');
const FT = require('../handleFeatureToggleCalls');

const featureNameToRemove = 'TERM_ACCOUNT_DEPOSIT';

describe('Variable declarator', () => {
    test('variable evaluated to true', () => {
        const data = `const x = FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT);`;
        const expected = 'const x = true;';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable evaluated to expression', () => {
        const data = `const x = FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && someExp;`;
        const expected = 'const x = someExp';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with a unary operator, will evaluated to false', () => {
        const data = `const x = !FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)`;
        const expected = 'const x = false';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with two unary operator, will evaluated to true', () => {
        const data = `const x = !!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT)`;
        const expected = 'const x = true';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with two unary operator , and AND logical expression, will evaluated to expression', () => {
        const data = `const x = !!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) && someExp`;
        const expected = 'const x = someExp';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
    test('variable with two unary operator and OR logail expression, will evaluated to true', () => {
        const data = `const x = !!FeatureToggle.isFeatureEnabled(FeatureToggle.TERM_ACCOUNT_DEPOSIT) || someExp`;
        const expected = 'const x = true';
        const transformed = FT.handleFeatureToggleCalls(featureNameToRemove, j(data));
        expect(transformed).toMatch(expected);
    });
});