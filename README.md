## Transform Javascript with AST to automate feature toggling tasks

This is a NodeJs app I wrote to automatically managing feature toggling. It will generate / transform Javascript code to create a new feature, toggle feature, and remove a feature

A feature is toggled on under development and testing environments, but toggled off under production environment.
When the team completes building a feature, could be 1 week or a few sprints, and ready to be shipped, it will be toggled on on all environments.

This tool is easy to use, and fast to run. Besides it helps my team to avoid tedious, repetitive, and error prone tasks.

By reading the syntax tree AST of the source files, I can make code changes precisely where it is required.

I am using jscodeshift as a codemod runner, and jest as a unit test runner

AST nodes that I am handling in this tool:
*  - IfStatement
* - BlockStatement
* - VariableDeclarator
* - LogicalExpression
* - ConditionalExpression
* - UnaryOperator
* - ObjectProperty
* - ObjectExpression


