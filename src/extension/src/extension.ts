const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

// State manager for sharing data between commands
class ComponentStateManager {
    private static instance: ComponentStateManager;
    private componentData: {
        componentName?: string;
        componentType?: string;
        placeholderType?: string;
        fields?: Array<{
            label: string;
            value: string;
            isRequired: boolean;
        }>;
    } = {};

    private constructor() {}

    static getInstance(): ComponentStateManager {
        if (!ComponentStateManager.instance) {
            ComponentStateManager.instance = new ComponentStateManager();
        }
        return ComponentStateManager.instance;
    }

    setData(data: any) {
        this.componentData = { ...data };
        console.log("State updated:", this.componentData);
    }

    getData() {
        return this.componentData;
    }

    clearData() {
        this.componentData = {};
        console.log("State cleared");
    }
}

function activate(context: { subscriptions: any[] }) {
    const stateManager = ComponentStateManager.getInstance();

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
                async (message: {
                    command: string;
                    data: {
                        componentName: string;
                        componentType: string;
                        placeholderType: string;
                        fields: Array<{
                            label: string;
                            value: string;
                            isRequired: boolean;
                        }>;
                    };
                }) => {
                    if (message.command === "createSnippet") {
                        const {
                            componentName,
                            componentType,
                            placeholderType,
                            fields,
                        } = message.data;
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

                        fields.forEach((field: { value: any }) => {
                            switch (field.value) {
                                case "Field<string>":
                                    !fieldsTypesImports.includes("Field") &&
                                        fieldsTypesImports.push("Field");
                                    !fieldsImports.includes("Text") &&
                                        fieldsImports.push("Text");
                                    break;
                                case "ImageField":
                                    !fieldsTypesImports.includes(
                                        "ImageField"
                                    ) && fieldsTypesImports.push("ImageField");
                                    !fieldsImports.includes("Image") &&
                                        fieldsImports.push("Image");
                                    break;
                                case "LinkField":
                                    !fieldsTypesImports.includes("LinkField") &&
                                        fieldsTypesImports.push("LinkField");
                                    !fieldsImports.includes("Link") &&
                                        fieldsImports.push("Link");
                                    break;
                                default:
                                    fieldsTypesImports.push("");
                            }
                        });

                        switch (placeholderType) {
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

                        const interfaceFields = fields
                            .map(
                                (field: { label: any; value: any }) =>
                                    `${field.label}: ${field.value};`
                            )
                            .join("\n    ");

                        const fieldsMarkup = fields
                            .map(
                                (field: {
                                    value: any;
                                    isRequired: any;
                                    label: any;
                                }) => {
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
                                }
                            )
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
                        const document =
                            await vscode.workspace.openTextDocument(uri);
                        const editorInstance =
                            await vscode.window.showTextDocument(
                                document,
                                vscode.ViewColumn.One
                            );
                        editorInstance.insertSnippet(snippet);

                        // Store the data for later use in deploy
                        stateManager.setData(message.data);

                        // After successful creation, ask if they want to deploy
                        const deploy =
                            await vscode.window.showInformationMessage(
                                `Component ${componentName} created successfully. Would you like to deploy it to Sitecore?`,
                                "Yes",
                                "No"
                            );

                        if (deploy === "Yes") {
                            vscode.commands.executeCommand(
                                "sitecore-xm-cloud-components.deploySitecoreComponent"
                            );
                        }
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    );

    // New deploy command
    let deployCommand = vscode.commands.registerCommand(
        "sitecore-xm-cloud-components.deploySitecoreComponent",
        async function () {
            const componentData = stateManager.getData();
            if (!componentData || !componentData.fields) {
                vscode.window.showErrorMessage(
                    "No component data found. Please create the component first."
                );
                return;
            }

            const panel = vscode.window.createWebviewPanel(
                "deploySitecoreComponent",
                "Deploy to Sitecore",
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );

            panel.webview.html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Deploy to Sitecore</title>
                <style>
                    :root {
                        --primary-color: #0078D4;
                        --success-color: #107C10;
                        --error-color: #E81123;
                        --background-color: #1E1E1E;
                        --surface-color: #252526;
                        --text-color: #CCCCCC;
                        --border-color: #454545;
                    }

                    body { 
                        padding: 20px;
                        background-color: var(--background-color);
                        color: var(--text-color);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.5;
                        margin: 0;
                    }

                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }

                    h1 {
                        color: var(--text-color);
                        font-size: 24px;
                        margin-bottom: 24px;
                        text-align: center;
                    }

                    .form-group {
                        margin-bottom: 20px;
                        background-color: var(--surface-color);
                        padding: 16px;
                        border-radius: 6px;
                        border: 1px solid var(--border-color);
                        transition: border-color 0.3s ease;
                    }

                    .form-group:focus-within {
                        border-color: var(--primary-color);
                    }

                    label {
                        display: block;
                        margin-bottom: 8px;
                        color: var(--text-color);
                        font-weight: 500;
                    }

                    input {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid var(--border-color);
                        background-color: var(--background-color);
                        color: var(--text-color);
                        border-radius: 4px;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        box-sizing: border-box;
                    }

                    input:focus {
                        outline: none;
                        border-color: var(--primary-color);
                        box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
                    }

                    .help-text {
                        font-size: 12px;
                        color: #888888;
                        margin-top: 4px;
                    }

                    button {
                        width: 100%;
                        padding: 12px;
                        background-color: var(--primary-color);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-top: 16px;
                    }

                    button:hover {
                        background-color: #106EBE;
                    }

                    button:active {
                        background-color: #005A9E;
                        transform: translateY(1px);
                    }

                    .status {
                        padding: 12px;
                        margin-top: 16px;
                        border-radius: 4px;
                        display: none;
                        animation: fadeIn 0.3s ease;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    .success {
                        background-color: rgba(16, 124, 16, 0.1);
                        border: 1px solid var(--success-color);
                        color: #73C991;
                    }

                    .error {
                        background-color: rgba(232, 17, 35, 0.1);
                        border: 1px solid var(--error-color);
                        color: #F48771;
                    }

                    .section-title {
                        font-size: 18px;
                        color: var(--text-color);
                        margin: 24px 0 16px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid var(--border-color);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Deploy to Sitecore</h1>
                    
                    <div class="section-title">Authentication</div>
                    <div class="form-group">
                        <label for="accessToken">Sitecore XM Cloud Access Token</label>
                        <input type="password" id="accessToken" required placeholder="Enter your access token">
                    </div>

                    <div class="section-title">Component Details</div>
                    <div class="form-group">
                        <label for="templateName">Template Name</label>
                        <input type="text" id="templateName" value="${componentData.componentName}" required>
                    </div>

                    <div class="section-title">Paths Configuration</div>
                    <div class="form-group">
                        <label for="templateParent">Template Parent Path</label>
                        <input type="text" id="templateParent" value="/sitecore/templates/Project" required>
                        <div class="help-text">Example: /sitecore/templates/Project/YourFolder</div>
                    </div>

                    <div class="section-title">Rendering Configuration</div>
                    <div class="form-group">
                        <label for="renderingParent">Rendering Parent Path</label>
                        <input type="text" id="renderingParent" value="/sitecore/layout/Renderings/Project" required>
                        <div class="help-text">Example: /sitecore/layout/Renderings/Project/YourFolder</div>
                    </div>

                    <button onclick="deployTemplate()">Create Template & Rendering</button>
                    <div id="status" class="status"></div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function showStatus(message, isError = false) {
                        const status = document.getElementById('status');
                        status.textContent = message;
                        status.style.display = 'block';
                        status.className = 'status ' + (isError ? 'error' : 'success');
                    }
                    
                    function deployTemplate() {
                        const accessToken = document.getElementById('accessToken').value;
                        const templateName = document.getElementById('templateName').value;
                        const templateParent = document.getElementById('templateParent').value;
                        const renderingParent = document.getElementById('renderingParent').value;
                        
                        if (!accessToken || !templateName || !templateParent || !renderingParent) {
                            showStatus('Please fill in all required fields', true);
                            return;
                        }

                        const button = document.querySelector('button');
                        button.textContent = 'Creating...';
                        button.disabled = true;
                        showStatus('Creating template and rendering...');
                        
                        vscode.postMessage({
                            command: 'deployTemplate',
                            data: {
                                accessToken,
                                templateName,
                                templateParent,
                                renderingParent
                            }
                        });
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        const button = document.querySelector('button');
                        button.textContent = 'Create Template & Rendering';
                        button.disabled = false;

                        switch (message.command) {
                            case 'success':
                                showStatus(message.message);
                                break;
                            case 'error':
                                showStatus(message.message, true);
                                break;
                        }
                    });

                    // Add input animations
                    document.querySelectorAll('input').forEach(input => {
                        input.addEventListener('focus', () => {
                            input.parentElement.classList.add('focused');
                        });
                        input.addEventListener('blur', () => {
                            input.parentElement.classList.remove('focused');
                        });
                    });
                </script>
            </body>
            </html>`;

            panel.webview.onDidReceiveMessage(
                async (message: {
                    command: string;
                    data: {
                        accessToken: string;
                        templateName: string;
                        templateParent: string;
                        renderingParent: string;
                    };
                }) => {
                    if (message.command === "deployTemplate") {
                        try {
                            const {
                                accessToken,
                                templateName,
                                templateParent,
                                renderingParent,
                            } = message.data;

                            // We already checked for componentData.fields earlier
                            const fieldsJson = componentData.fields!.map(
                                (field) => ({
                                    name: field.label,
                                    type:
                                        field.value === "Field<string>"
                                            ? "Single-Line Text"
                                            : field.value === "ImageField"
                                            ? "Image"
                                            : "General Link",
                                })
                            );

                            console.log(
                                "Sending GraphQL request with fields:",
                                fieldsJson
                            );

                            const graphqlQuery = `
                                mutation {
                                    createItemTemplate(
                                        input: {
                                            name: "${templateName}",
                                            parent: "${templateParent}",
                                            sections: {
                                                name: "Data",
                                                fields: [
                                                    ${fieldsJson
                                                        .map(
                                                            (field) =>
                                                                `{ name: "${field.name}", type: "${field.type}" }`
                                                        )
                                                        .join(",\n")}
                                                ]
                                            }
                                        }
                                    ) {
                                        itemTemplate {
                                            name
                                        }
                                    }
                                }`;

                            console.log("GraphQL Query:", graphqlQuery);

                            const response = await fetch(
                                "https://xmcloudcm.localhost/sitecore/api/authoring/graphql/v1",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${accessToken}`,
                                        "X-GQL-Token": accessToken,
                                    },
                                    body: JSON.stringify({
                                        query: graphqlQuery,
                                    }),
                                }
                            );

                            const responseText = await response.text();
                            console.log("Raw response:", responseText);

                            const result = JSON.parse(responseText) as {
                                data?: {
                                    createItemTemplate?: {
                                        itemTemplate?: {
                                            name: string;
                                        };
                                    };
                                };
                                errors?: Array<{ message: string }>;
                            };

                            console.log("Parsed response:", result);

                            if (result.errors) {
                                throw new Error(result.errors[0].message);
                            }

                            if (
                                result.data?.createItemTemplate?.itemTemplate
                                    ?.name
                            ) {
                                // After template is created, create the rendering item
                                const renderingQuery = `
                                    mutation {
                                        createItem(
                                            input: {
                                                name: "${templateName}",
                                                templateId: "{04646A89-996F-4EE7-878A-FFDBF1F0EF0D}",
                                                parent: "${renderingParent}",
                                                language: "en",
                                                fields: [
                                                    { name: "componentName", value: "${templateName}" }
                                                ]
                                            }
                                        ) {
                                            item {
                                                itemId
                                                name
                                                path
                                                fields(ownFields: true, excludeStandardFields: true) {
                                                    nodes {
                                                        name
                                                        value
                                                    }
                                                }
                                            }
                                        }
                                    }`;

                                console.log("Rendering Query:", renderingQuery);

                                const renderingResponse = await fetch(
                                    "https://xmcloudcm.localhost/sitecore/api/authoring/graphql/v1",
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${accessToken}`,
                                            "X-GQL-Token": accessToken,
                                        },
                                        body: JSON.stringify({
                                            query: renderingQuery,
                                        }),
                                    }
                                );

                                const renderingResponseText =
                                    await renderingResponse.text();
                                console.log(
                                    "Raw rendering response:",
                                    renderingResponseText
                                );

                                const renderingResult = JSON.parse(
                                    renderingResponseText
                                ) as {
                                    data?: {
                                        createItem?: {
                                            item?: {
                                                itemId: string;
                                                name: string;
                                                path: string;
                                            };
                                        };
                                    };
                                    errors?: Array<{ message: string }>;
                                };

                                console.log(
                                    "Parsed rendering response:",
                                    renderingResult
                                );

                                if (renderingResult.errors) {
                                    throw new Error(
                                        renderingResult.errors[0].message
                                    );
                                }

                                if (
                                    renderingResult.data?.createItem?.item
                                        ?.itemId
                                ) {
                                    panel.webview.postMessage({
                                        command: "success",
                                        message:
                                            "Template and rendering created successfully!",
                                    });
                                } else {
                                    panel.webview.postMessage({
                                        command: "error",
                                        message:
                                            "Template created but failed to create rendering",
                                    });
                                }
                            } else {
                                panel.webview.postMessage({
                                    command: "error",
                                    message:
                                        "Failed to create template - no name returned",
                                });
                            }
                        } catch (error) {
                            panel.webview.postMessage({
                                command: "error",
                                message:
                                    error instanceof Error
                                        ? error.message
                                        : "An error occurred",
                            });
                        }
                    }
                },
                undefined,
                context.subscriptions
            );
        }
    );

    context.subscriptions.push(disposable);
    context.subscriptions.push(deployCommand);
}

async function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Create Sitecore Component</title>
        <style>
            :root {
                --primary-color: #0078D4;
                --success-color: #107C10;
                --error-color: #E81123;
                --background-color: #1E1E1E;
                --surface-color: #252526;
                --text-color: #CCCCCC;
                --border-color: #454545;
            }

            body { 
                padding: 20px;
                background-color: var(--background-color);
                color: var(--text-color);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.5;
                margin: 0;
            }

            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }

            h1 {
                color: var(--text-color);
                font-size: 24px;
                margin-bottom: 24px;
                text-align: center;
            }

            .form-group {
                margin-bottom: 20px;
                background-color: var(--surface-color);
                padding: 16px;
                border-radius: 6px;
                border: 1px solid var(--border-color);
                transition: border-color 0.3s ease;
            }

            .form-group:focus-within {
                border-color: var(--primary-color);
            }

            label {
                display: block;
                margin-bottom: 8px;
                color: var(--text-color);
                font-weight: 500;
            }

            input, select {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                background-color: var(--background-color);
                color: var(--text-color);
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            input:focus, select:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
            }

            select {
                appearance: none;
                background-image: url('data:image/svg+xml;charset=US-ASCII,<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z" fill="%23888"/></svg>');
                background-repeat: no-repeat;
                background-position: right 8px center;
                padding-right: 30px;
            }

            .fields-container {
                margin-top: 16px;
            }

            .field-row {
                display: grid;
                grid-template-columns: 2fr 2fr 80px 32px;
                gap: 12px;
                margin-bottom: 12px;
                align-items: center;
                animation: fadeIn 0.3s ease;
                background-color: var(--background-color);
                padding: 8px;
                border-radius: 4px;
            }

            .field-row button {
                padding: 8px;
                background-color: var(--error-color);
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .field-row button:hover {
                background-color: #D50F1E;
                transform: scale(1.05);
            }

            .checkbox-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                white-space: nowrap;
            }

            .checkbox-wrapper input[type="checkbox"] {
                width: 16px;
                height: 16px;
                margin: 0;
                cursor: pointer;
                position: relative;
                border: 1px solid var(--border-color);
                background-color: var(--background-color);
                border-radius: 3px;
                appearance: none;
                -webkit-appearance: none;
                transition: all 0.2s ease;
            }

            .checkbox-wrapper input[type="checkbox"]:checked {
                background-color: var(--primary-color);
                border-color: var(--primary-color);
            }

            .checkbox-wrapper input[type="checkbox"]:checked::after {
                content: '✓';
                position: absolute;
                color: white;
                font-size: 12px;
                left: 2px;
                top: -1px;
            }

            .checkbox-wrapper input[type="checkbox"]:hover {
                border-color: var(--primary-color);
            }

            .checkbox-wrapper label {
                margin: 0;
                font-weight: normal;
                font-size: 13px;
                cursor: pointer;
            }

            button.add-field {
                background-color: var(--success-color);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 8px;
                transition: all 0.3s ease;
            }

            button.add-field:hover {
                background-color: #0E6A0E;
            }

            button.create-component {
                width: 100%;
                padding: 12px;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 24px;
            }

            button.create-component:hover {
                background-color: #106EBE;
            }

            button.create-component:active {
                background-color: #005A9E;
                transform: translateY(1px);
            }

            button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .section-title {
                font-size: 18px;
                color: var(--text-color);
                margin: 24px 0 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--border-color);
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Create Sitecore Component</h1>

            <div class="section-title">Basic Information</div>
            <div class="form-group">
                <label for="componentName">Component Name</label>
                <input type="text" id="componentName" placeholder="Enter component name" required>
            </div>

            <div class="section-title">Component Configuration</div>
            <div class="form-group">
                <label for="componentType">Component Type</label>
                <select id="componentType">
                    <option value="none">None</option>
                    <option value="withDatasourceCheck">With Datasource Check</option>
                    <option value="withDatasourceRendering">With Datasource Rendering</option>
                </select>
            </div>

            <div class="form-group">
                <label for="placeholderType">Placeholder Type</label>
                <select id="placeholderType">
                    <option value="none">None</option>
                    <option value="placeholder">Static Placeholder</option>
                    <option value="dynamicPlaceholder">Dynamic Placeholder</option>
                </select>
            </div>

            <div class="section-title">Fields Configuration</div>
            <div class="form-group">
                <div id="fields" class="fields-container"></div>
                <button class="add-field" onclick="addField()">+ Add Field</button>
            </div>

            <button class="create-component" onclick="createComponent()">Create Component</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let fieldCount = 0;

            function addField() {
                const fieldsContainer = document.getElementById('fields');
                const fieldRow = document.createElement('div');
                fieldRow.className = 'field-row';
                fieldRow.innerHTML = \`
                    <input type="text" placeholder="Field name" required>
                    <select>
                        <option value="Field<string>">Text Field</option>
                        <option value="ImageField">Image Field</option>
                        <option value="LinkField">Link Field</option>
                    </select>
                    <div class="checkbox-wrapper">
                        <input type="checkbox" id="required-\${fieldCount}">
                        <label for="required-\${fieldCount}">Required</label>
                    </div>
                    <button onclick="this.parentElement.remove()" title="Remove field" type="button">×</button>
                \`;
                fieldsContainer.appendChild(fieldRow);
                
                // Focus the new field's name input
                const newInput = fieldRow.querySelector('input[type="text"]');
                if (newInput) {
                    newInput.focus();
                }
                
                fieldCount++;
            }

            function createComponent() {
                const componentName = document.getElementById('componentName').value;
                const componentType = document.getElementById('componentType').value;
                const placeholderType = document.getElementById('placeholderType').value;
                
                if (!componentName) {
                    alert('Please enter a component name');
                    return;
                }

                const fieldRows = document.querySelectorAll('.field-row');
                const fields = Array.from(fieldRows).map(row => ({
                    label: row.querySelector('input[type="text"]').value,
                    value: row.querySelector('select').value,
                    isRequired: row.querySelector('input[type="checkbox"]').checked
                }));

                if (fields.some(field => !field.label)) {
                    alert('Please fill in all field names');
                    return;
                }

                const button = document.querySelector('.create-component');
                button.textContent = 'Creating...';
                button.disabled = true;

                vscode.postMessage({
                    command: 'createSnippet',
                    data: {
                        componentName,
                        componentType,
                        placeholderType,
                        fields
                    }
                });
            }

            // Add initial field
            addField();

            // Add input animations
            document.addEventListener('focusin', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                    const formGroup = e.target.closest('.form-group');
                    if (formGroup) formGroup.classList.add('focused');
                }
            });

            document.addEventListener('focusout', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                    const formGroup = e.target.closest('.form-group');
                    if (formGroup) formGroup.classList.remove('focused');
                }
            });
        </script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
