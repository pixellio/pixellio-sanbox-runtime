import { parse } from "@babel/parser";
import generate from "@babel/generator";
import  babel from "@babel/core";

// const a = "var a = 1;";
// const b = "var b = 2;";
// const astA = parse(a, { sourceFilename: "a.js" });
// const astB = parse(b, { sourceFilename: "b.js" });
// const ast = {
//   type: "Program",
//   body: [].concat(astA.program.body, astB.program.body),
// };

// const { code, map } = generate.default(
//   ast,
//   { sourceMaps: true },
//   {
//     "a.js": a,
//     "b.js": b,
//   }
// );

// console.log({ code, map, ast: JSON.stringify(ast) })

// function listJsFunctions(code) {
//   try {
//     const ast = babel.parse(code, {sourceType: "module"}); // Specify source type for modern syntax
//     // Extract function names using a visitor function
//     const functions = [];
//     const visitor = {
//       FunctionDeclaration(path) {
//         functions.push(path.node.id.name);
//       },
//       FunctionExpression(path) {
//         if (path.node.id) {
//           functions.push(path.node.id.name);
//         } else {
//           // Handle anonymous functions (optional)
//           // You can assign a name or use a different approach here
//         }
//       },
//     };

//     babel.traverse(ast, visitor);

//     return functions;
//   } catch (e) {
//     console.error("Error parsing code:", e);
//     return [];
//   }

  
// }

// console.log('--new section--')

// import  babel from "@babel/core";

// const codeStr = `
// this.count =23;
// const isWin = false;

// // onEvent(box1).click() {

// // }

// function queryClass(name){
//     return window.document.querySelector(\`.\${name}\`);
//   }
// `;

const updateParamNameVisitor = {
  Identifier(path) {
    if (path.node.name === this.from) {
      path.replaceWith(this.to);
    }
  }
};

// const visitor = {
//   Program(path){
//     path.traverse({
//       VariableDeclaration(path) {
//         const isGlobal = !path.parentPath.isFunction() && !path.parentPath.isBlockStatement();
//         if (isGlobal) {
//           console.log('Global variable:',JSON.stringify(path?.node), path?.node?.id?.name);
//         }
//       },
//     });
//     console.log('PATH>>', JSON.stringify(path.scope.globals))

//     if(path.scope.globals.document){
//       console.log('>', path.scope.globals.document)
//       const node = path.scope.generateUidIdentifier('no_document');
//       path.traverse(updateParamNameVisitor, { from: 'document', to: node })
//     }
//   }
// }

// const result = babel.transform(codeStr, {
//   plugins: [{visitor}]
// });

// console.log({ result: JSON.stringify(result) })


// // ---------------------
// const code3 = `
// function add(x, y) {
//   return x + y;
// }

// const multiply = function(x, y) {
//   return x * y;
// };
// `;

// const listedFunctions = listJsFunctions(code3);
// console.log("Listed functions:", listedFunctions);


// ------------------------------trandorm

const codeTransform = `
const gloablCount = 12;
const isComplete = false;
const isWin = false
box1.on('click', () => {
  // Your event handler code here
  console.log("hi")
  return 'ok'
});

box1.on('colission', () => {
  // Your event handler code here
  console.log("hi")
});
`;

const transpiledCode = babel.transformSync(codeTransform, {
  plugins: [
    {
      visitor: {
        Program(path){
          path.traverse({
            VariableDeclaration(path) {
              const isGlobal = !path.parentPath.isFunction() && !path.parentPath.isBlockStatement();
              if (isGlobal) {
                const name =  path?.node?.declarations[0].id.name
                const value= path.node.declarations[0].init.value
                console.log(`Global variable: const ${name} = ${value}`);
              }
            },
          });
          // console.log('PATH>>', JSON.stringify(path.scope))
      
          if(path.scope.globals.document){
            console.log('>', path.scope.globals.document)
            const node = path.scope.generateUidIdentifier('no_document');
            path.traverse(updateParamNameVisitor, { from: 'document', to: node })
          }
        },
        CallExpression(path) {
          const { node, state, contexts } = path;

          if (
            node.callee.type === "MemberExpression" &&
            node.callee.object.name === "box1" &&
            node.callee.property.name === "on"
          ) {
            const eventName = node.arguments[0].value;
            const handler = node.arguments[1];
            // Generate the function definition
            const functionDef = babel.types.functionDeclaration(
              babel.types.identifier(`_box1_on_${eventName}`),
              [],
              // babel.types.blockStatement([babel.types.expressionStatement(handler)])
              babel.types.blockStatement([babel.types.returnStatement(handler)])
            );
            // Replace the call expression with the function definition
           
            const tmpout = generate.default(functionDef)
            console.log(tmpout)
            path.replaceWith(functionDef);
          }
        },
      },
    },
  ],
 
});

console.log('ouput code',transpiledCode.code);