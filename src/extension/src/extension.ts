const vscode = require("vscode");

function activate(context: { subscriptions: any[] }) {
  let disposable = vscode.commands.registerCommand(
    "sitecore-xm-cloud-components.createSnippet",
    async function () {
      const editor = vscode.window.activeTextEditor;
      const filename = editor.document.fileName.split(/[/\\]/).pop();
      const componentName = filename.replace(/\.[^/.]+$/, "");
      const propsTypeName = `${componentName}Props`;

      // Ask the first question about component type
      const componentType = await vscode.window.showQuickPick(
        [
          { label: "With Datasource Check", value: "withDatasourceCheck" },
          { label: "With Datasource Rendering", value: "withDatasourceRendering" },
          { label: "Default", value: "default" },
        ],
        { placeHolder: "Select the component return type", canPickMany: false }
      );
      if (!componentType) return; // User cancelled the input

      // Ask the second question about placeholder
      const placeholderType = await vscode.window.showQuickPick(
        [
          { label: "Placeholder", value: "placeholder" },
          { label: "Dynamic Placeholder", value: "dynamicPlaceholder" },
          { label: "None", value: "default" },
        ],
        { placeHolder: "Select the placeholder type", canPickMany: false }
      );
      if (!placeholderType) return; // User cancelled the input

      // Ask the user to input custom fields
      const fields: Array<{ label: string; value: string; isRequired: boolean }> = [];
      let addMoreFields = true;

      while (addMoreFields) {
        const fieldName = await vscode.window.showInputBox({
          placeHolder: "Enter the field name (e.g., heading, copy, image, link)",
        });
        if (!fieldName) break; // User cancelled the input

        const fieldType = await vscode.window.showQuickPick(
          [
            { label: "Text", value: "Field<string>" },
            { label: "Image", value: "ImageField" },
            { label: "Link", value: "LinkField" },
          ],
          { placeHolder: "Select the field type", canPickMany: false }
        );
        if (!fieldType) break; // User cancelled the input

        const isRequired = await vscode.window.showQuickPick(
          [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
          { placeHolder: `Is ${fieldName} required?`, canPickMany: false }
        );
        if (!isRequired) break; // User cancelled the input

        fields.push({ label: fieldName, value: fieldType.value, isRequired: isRequired.value });

        const addMore = await vscode.window.showQuickPick(
          [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
          { placeHolder: "Do you want to add more fields?", canPickMany: false }
        );
        if (!addMore || !addMore.value) addMoreFields = false;
      }

      // return value snippet
      let returnSnippet: string;

      // fields types import (e.g: Field, ImageField, LinkField)
      let fieldsTypesImports: Array<string> = [];

      // fields import (e.g: Text, RichText, Image, Link)
      let fieldsImports: Array<string> = [];

      switch (componentType.value) {
        case "withDatasourceCheck":
          returnSnippet = `export default withDatasourceCheck()<${propsTypeName}>(${componentName});`;
          break;

        case "withDatasourceRendering":
          returnSnippet = `export default withDatasourceRendering()<${propsTypeName}>(${componentName});`;
          break;

        default:
          returnSnippet = `export default ${componentName};`;
      }

      fields.forEach((field) => {
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

      switch (placeholderType.value) {
        case "placeholder":
        case "dynamicPlaceholder":
          !fieldsTypesImports.includes("Placeholder") && fieldsTypesImports.push("Placeholder");
          break;

        default:
          break;
      }

      const typesImports = fieldsTypesImports.join(", ");
      const fieldImports = fieldsImports.join(", ");

      const interfaceFields: string[] = [];

      fields.forEach((field) => {
        interfaceFields.push(`${field.label}: ${field.value};`);
      });

      const interfaceFieldsString = interfaceFields.join("\n    ");

      const fieldsMarkup = fields
        .map((field) => {
          switch (field.value) {
            case "Field<string>":
              if (!field.isRequired) {
                return `{fields.${field.label} && fields.${field.label}.value && (<Text field={fields.${field.label}}/>)}`;
              } else {
                return `<Text field={fields.${field.label}} />`;
              }

            case "ImageField":
              if (!field.isRequired) {
                return `{fields.${field.label} && fields.${field.label}.src && (<Image field={fields.${field.label}}/>)}`;
              } else {
                return `<Image field={fields.${field.label}} />`;
              }

            case "LinkField":
              if (!field.isRequired) {
                return `{fields.${field.label} && fields.${field.label}.href && (<Link field={fields.${field.label}}/>)}`;
              } else {
                return `<Link field={fields.${field.label}} />`;
              }

            default:
              return "";
          }
        })
        .join("\n            ");

      let placeholderMarkup = "";

      switch (placeholderType.value) {
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
  componentType.value === "withDatasourceRendering"
    ? "import { withDatasourceRendering } from '@constellation4sitecore/foundation-enhancers';"
    : ""
}

interface Fields {
    ${interfaceFieldsString}
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

      editor.insertSnippet(snippet);
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};