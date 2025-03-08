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
          {
            label: "With Datasource Rendering",
            value: "withDatasourceRendering",
          },
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

      // Ask the third question about fields
      const fields = await vscode.window.showQuickPick(
        [
          { label: "Heading", value: "heading", isRequired: false },
          { label: "Copy", value: "copy", isRequired: false },
          { label: "Image", value: "image", isRequired: false },
          { label: "Link", value: "link", isRequired: false },
        ],
        {
          placeHolder: "Select the fields for the component",
          canPickMany: true,
        }
      );
      if (!fields) return; // User cancelled the input

      for (const field of fields) {
        const isRequired = await vscode.window.showQuickPick(
          [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
          { placeHolder: `Is ${field.label} required?`, canPickMany: false }
        );
        if (!isRequired) return; // User cancelled the input
        field.isRequired = isRequired.value;
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

      fields.forEach((field: { label: string; value: string }) => {
        switch (field.value) {
          case "heading":
            !fieldsTypesImports.includes("Field") &&
              fieldsTypesImports.push("Field");
            !fieldsImports.includes("Text") && fieldsImports.push("Text");
            break;

          case "copy":
            !fieldsTypesImports.includes("Field") &&
              fieldsTypesImports.push("Field");
            !fieldsImports.includes("RichText") &&
              fieldsImports.push("RichText");
            break;

          case "image":
            !fieldsTypesImports.includes("ImageField") &&
              fieldsTypesImports.push("ImageField");
            !fieldsImports.includes("Image") && fieldsImports.push("Image");
            break;

          case "link":
            !fieldsTypesImports.includes("LinkField") &&
              fieldsTypesImports.push("LinkField");
            !fieldsImports.includes("Link") && fieldsImports.push("Link");
            break;

          default:
            fieldsTypesImports.push("");
        }
      });

      switch (placeholderType.value) {
        case "placeholder":
        case "dynamicPlaceholder":
          !fieldsTypesImports.includes("Placeholder") &&
            fieldsTypesImports.push("Placeholder");
          break;

        default:
          break;
      }

      const typesImports = fieldsTypesImports.join(", ");
      const fieldImports = fieldsImports.join(", ");

      const interfaceFields: string[] = [];

      fields.forEach((field: { label: string; value: string }) => {
        switch (field.value) {
          case "heading":
            interfaceFields.push("heading: Field<string>;");
            break;

          case "copy":
            interfaceFields.push("copy: Field<string>;");
            break;

          case "image":
            interfaceFields.push("image: ImageField;");
            break;

          case "link":
            interfaceFields.push("link: LinkField;");
            break;

          default:
            break;
        }
      });

      const interfaceFieldsString = interfaceFields.join("\n    ");

      const fieldsMarkup = fields
        .map((field: { label: string; value: string; isRequired: boolean }) => {
          switch (field.value) {
            case "heading":
              if (!field.isRequired) {
                return `{fields.heading && fields.heading.value && (<Text field={fields.heading}/>)}`;
              } else {
                return `<Text field={fields.heading} />`;
              }

            case "copy":
              if (!field.isRequired) {
                return `{fields.copy && fields.copy.value && (<RichText field={fields.copy}/>)}`;
              } else {
                return `<RichText field={fields.copy} />`;
              }

            case "image":
              if (!field.isRequired) {
                return `{fields.image && fields.image.src && (<Image field={fields.image}/>)}`;
              } else {
                return `<Image field={fields.image} />`;
              }

            case "link":
              if (!field.isRequired) {
                return `{fields.link && fields.link.href && (<Link field={fields.link}/>)}`;
              } else {
                return `<Link field={fields.link} />`;
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
