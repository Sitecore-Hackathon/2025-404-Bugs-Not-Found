const vscode = require("vscode");
const fs = require('fs');
const path = require('path');

function activate(context: { subscriptions: any[] }) {
  let disposable = vscode.commands.registerCommand(
    "sitecore-xm-cloud-components.createSnippet",
    async function () {
      const editor = vscode.window.activeTextEditor;
      const panel = vscode.window.createWebviewPanel(
        "createSnippet",
        "Create Snippet",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = await getWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (message: { command: string; data: { componentName: any; componentType: any; placeholderType: any; fields: any; }; }) => {
          if (message.command === "createSnippet") {
            const { componentName, componentType, placeholderType, fields } = message.data;
            const propsTypeName = `${componentName}Props`;

            let returnSnippet;
            let fieldsTypesImports: string[] = [];
            let fieldsImports: string[] = [];

            switch (componentType) {
              case "withDatasourceCheck":
                returnSnippet = `export default withDatasourceCheck()<${propsTypeName}>(${componentName});`;
                break;
              case "withDatasourceRendering":
                returnSnippet = `export default withDatasourceRendering()<${propsTypeName}>(${componentName});`;
                break;
              default:
                returnSnippet = `export default ${componentName};`;
            }

            fields.forEach((field: { value: any; }) => {
              switch (field.value) {
                case "Field<string>":
                  !fieldsTypesImports.includes("Field") && fieldsTypesImports.push("Field");
                  !fieldsImports.includes("Text") && fieldsImports.push("Text");
                  break;
                case "ImageField":
                  !fieldsTypesImports.includes("ImageField") && fieldsTypesImports.push("ImageField");
                  !fieldsImports.includes("Image") && fieldsImports.push("Image");
                  break;
                case "LinkField":
                  !fieldsTypesImports.includes("LinkField") && fieldsTypesImports.push("LinkField");
                  !fieldsImports.includes("Link") && fieldsImports.push("Link");
                  break;
                default:
                  fieldsTypesImports.push("");
              }
            });

            switch (placeholderType) {
              case "placeholder":
              case "dynamicPlaceholder":
                !fieldsTypesImports.includes("Placeholder") && fieldsTypesImports.push("Placeholder");
                break;
              default:
                break;
            }

            const typesImports = fieldsTypesImports.join(", ");
            const fieldImports = fieldsImports.join(", ");

            const interfaceFields = fields.map((field: { label: any; value: any; }) => `${field.label}: ${field.value};`).join("\n    ");

            const fieldsMarkup = fields
              .map((field: { value: any; isRequired: any; label: any; }) => {
                switch (field.value) {
                  case "Field<string>":
                    return field.isRequired
                      ? `<Text field={fields.${field.label}} />`
                      : `{fields.${field.label} && fields.${field.label}.value && (<Text field={fields.${field.label}}/>)}`;
                  case "ImageField":
                    return field.isRequired
                      ? `<Image field={fields.${field.label}} />`
                      : `{fields.${field.label} && fields.${field.label}.src && (<Image field={fields.${field.label}}/>)}`;
                  case "LinkField":
                    return field.isRequired
                      ? `<Link field={fields.${field.label}} />`
                      : `{fields.${field.label} && fields.${field.label}.href && (<Link field={fields.${field.label}}/>)}`;
                  default:
                    return "";
                }
              })
              .join("\n            ");

            let placeholderMarkup = "";
            switch (placeholderType) {
              case "placeholder":
                placeholderMarkup = `<Placeholder name="" />`;
                break;
              case "dynamicPlaceholder":
                placeholderMarkup = `<Placeholder name={\`-\${params.DynamicPlaceholderId}\`} rendering={rendering} />`;
                break;
              default:
                break;
            }

            const snippet = new vscode.SnippetString();
            snippet.appendText(`import { ${typesImports}, ${fieldImports} } from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
${
  componentType === "withDatasourceRendering"
    ? "import { withDatasourceRendering } from '@constellation4sitecore/foundation-enhancers';"
    : ""
}

interface Fields {
    ${interfaceFields}
}

type ${propsTypeName} = ComponentProps & {
    fields: Fields;
};

const ${componentName} = ({ fields, params, ${
              placeholderMarkup && `rendering`
            } }: ${propsTypeName}) => {
  ${placeholderMarkup && "const id = params.RenderingIdentifier;"}
    return (
        <section className={params.styles} ${
          placeholderMarkup && "id={id ? id : undefined}"
        }>
            ${fieldsMarkup}
            ${placeholderMarkup}
        </section>
    );
};
${returnSnippet}`);
            const uri = vscode.Uri.file(editor.document.fileName);
            const document = await vscode.workspace.openTextDocument(uri);
            const editorInstance = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            editorInstance.insertSnippet(snippet);
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function getWebviewContent() {
  const filePath = path.join(__dirname, 'webview.html'); 

  try {
    const html = await fs.promises.readFile(filePath, 'utf8');
    return `${html}`;
  } catch (error) {
    console.error('Error reading the HTML file:', error);
    return '';
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};