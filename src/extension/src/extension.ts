import { getCreateComponentContent } from "./getCreateComponentContent";
import { getDeployComponentContent } from "./getDeployComponentContent";
import OpenAI from "openai";

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

// State manager for sharing data between commands
class ComponentStateManager {
    private static instance: ComponentStateManager;
    private componentData: {
        componentName?: string;
        componentType?: string;
        hasPlaceholders?: string;
        fields?: Array<{
            label: string;
            value: string;
            isRequired: boolean;
        }>;
        placeholders?: Array<{
            name: string;
            key: string;
            type: string;
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

type TemplateResponse = {
    data?: {
        createItemTemplate?: {
            itemTemplate?: {
                templateId: string;
                name: string;
                ownFields: {
                    nodes: Array<{
                        name: string;
                        type: string;
                    }>;
                };
            };
        };
    };
    errors?: Array<{ message: string }>;
};

async function createTemplate(
    instanceUrl: string,
    accessToken: string,
    templateName: string,
    templateParent: string,
    fields: Array<{ label: string; value: string; isRequired: boolean }>
): Promise<TemplateResponse> {
    const templateQuery = `
        mutation {
            createItemTemplate(
                input: {
                    name: "${templateName}",
                    parent: "${templateParent}",
                    createStandardValuesItem: true,
                    sections: {
                        name: "Content",
                        fields: [
                            ${fields
                                .map(
                                    (field) => `{
                                name: "${field.label}",
                                type: "${(() => {
                                    switch (field.value) {
                                        case "RichText":
                                            return "Rich Text";
                                        case "SingleLineText":
                                            return "Single-Line Text";
                                        case "MultilineText":
                                            return "Multi-Line Text";
                                        case "ImageField":
                                            return "Image";
                                        case "LinkField":
                                            return "General Link";
                                        case "Checkbox":
                                            return "Checkbox";
                                        default:
                                            return field.value;
                                    }
                                })()}"
                            }`
                                )
                                .join(",\n")}
                        ]
                    }
                }
            ) {
                itemTemplate {
                    templateId
                    name
                    ownFields {
                        nodes {
                            name
                            type
                        }
                    }
                }
            }
        }`;

    const response = await fetch(
        `${instanceUrl}/sitecore/api/authoring/graphql/v1`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "X-GQL-Token": accessToken,
            },
            body: JSON.stringify({ query: templateQuery }),
        }
    );

    return (await response.json()) as TemplateResponse;
}

function formatComponentName(name: string, toPascalCase: boolean): string {
    if (toPascalCase) {
        return name
            .split(/[\s-]/)
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join("");
    }
    return name;
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

            panel.webview.html = await getCreateComponentContent();

            panel.webview.onDidReceiveMessage(
                async (message: {
                    command: string;
                    data: {
                        componentName: string;
                        componentType: string;
                        hasPlaceholders: string;
                        fields: Array<{
                            label: string;
                            value: string;
                            isRequired: boolean;
                        }>;
                        placeholders?: Array<{
                            name: string;
                            key: string;
                            type: string;
                        }>;
                        chatGptApiKey: string;
                        chatGptOrganizationId: string;
                    };
                }) => {
                    if (message.command === "createSnippet") {
                        const {
                            componentName,
                            componentType,
                            hasPlaceholders,
                            fields,
                            placeholders,
                            chatGptApiKey,
                            chatGptOrganizationId,
                        } = message.data;

                        const codeName = formatComponentName(
                            componentName,
                            true
                        );
                        const propsTypeName = `${codeName}Props`;

                        let returnSnippet;
                        let fieldsTypesImports: string[] = [];
                        let fieldsImports: string[] = [];

                        switch (componentType) {
                            case "withDatasourceCheck":
                                returnSnippet = `export default withDatasourceCheck()<${propsTypeName}>(${codeName});`;
                                break;
                            case "withDatasourceRendering":
                                returnSnippet = `export default withDatasourceRendering()<${propsTypeName}>(${codeName});`;
                                break;
                            default:
                                returnSnippet = `export default ${codeName};`;
                        }

                        fields.forEach((field: { value: any }) => {
                            switch (field.value) {
                                case "SingleLineText":
                                case "MultilineText":
                                    !fieldsTypesImports.includes("Field") &&
                                        fieldsTypesImports.push("Field");
                                    !fieldsImports.includes("Text") &&
                                        fieldsImports.push("Text");
                                    break;
                                case "RichText":
                                    !fieldsTypesImports.includes("Field") &&
                                        fieldsTypesImports.push("Field");
                                    !fieldsImports.includes("RichText") &&
                                        fieldsImports.push("RichText");
                                    break;
                                case "ImageField":
                                    !fieldsTypesImports.includes(
                                        "ImageField"
                                    ) && fieldsTypesImports.push("ImageField");
                                    !fieldsImports.includes("NextImage") &&
                                        fieldsImports.push("NextImage");
                                    break;
                                case "LinkField":
                                    !fieldsTypesImports.includes("LinkField") &&
                                        fieldsTypesImports.push("LinkField");
                                    !fieldsImports.includes("Link") &&
                                        fieldsImports.push("Link");
                                    break;
                                case "Checkbox":
                                    !fieldsTypesImports.includes("Field") &&
                                        fieldsTypesImports.push("Field");
                                    break;
                                default:
                                    fieldsTypesImports.push("");
                            }
                        });

                        if (hasPlaceholders === "yes") {
                            !fieldsTypesImports.includes("Placeholder") &&
                                fieldsTypesImports.push("Placeholder");
                        }

                        const typesImports = fieldsTypesImports.join(", ");
                        const fieldImports = fieldsImports.join(", ");

                        const interfaceFields = fields
                            .map((field: { label: any; value: any }) => {
                                let fieldType;
                                switch (field.value) {
                                    case "SingleLineText":
                                    case "MultilineText":
                                    case "RichText":
                                        fieldType = "Field<string>";
                                        break;
                                    case "Checkbox":
                                        fieldType = "Field<boolean>";
                                        break;
                                    default:
                                        fieldType = field.value;
                                }
                                return `${field.label}: ${fieldType};`;
                            })
                            .join("\n    ");

                        const fieldsMarkup = fields
                            .map(
                                (field: {
                                    value: any;
                                    isRequired: any;
                                    label: any;
                                }) => {
                                    const fieldCheck = field.isRequired
                                        ? ""
                                        : `fields.${field.label} && `;
                                    switch (field.value) {
                                        case "SingleLineText":
                                        case "MultilineText":
                                            return field.isRequired
                                                ? `<Text field={fields.${field.label}} />`
                                                : `{${fieldCheck}fields.${field.label}.value && (<Text field={fields.${field.label}}/>)}`;
                                        case "RichText":
                                            return field.isRequired
                                                ? `<RichText field={fields.${field.label}} />`
                                                : `{${fieldCheck}fields.${field.label}.value && (<RichText field={fields.${field.label}}/>)}`;
                                        case "ImageField":
                                            return field.isRequired
                                                ? `<NextImage field={fields.${field.label}} />`
                                                : `{${fieldCheck}fields.${field.label}.src && (<NextImage field={fields.${field.label}}/>)}`;
                                        case "LinkField":
                                            return field.isRequired
                                                ? `<Link field={fields.${field.label}} />`
                                                : `{${fieldCheck}fields.${field.label}.href && (<Link field={fields.${field.label}}/>)}`;
                                        case "Checkbox":
                                            return field.isRequired
                                                ? `{fields.${field.label}.value}`
                                                : `{${fieldCheck}fields.${field.label}.value}`;
                                        default:
                                            return "";
                                    }
                                }
                            )
                            .join("\n            ");

                        let placeholderMarkup = "";
                        if (
                            hasPlaceholders === "yes" &&
                            placeholders &&
                            placeholders.length > 0
                        ) {
                            placeholderMarkup = placeholders
                                .map(
                                    (p: {
                                        type: string;
                                        name: string;
                                        key: string;
                                    }) => {
                                        const placeholderKey =
                                            p.type === "dynamic"
                                                ? p.key
                                                : p.key.replace("-{*}", "");
                                        return `<Placeholder name="${placeholderKey}" ${
                                            p.type === "dynamic"
                                                ? "rendering={rendering}"
                                                : ""
                                        } />`;
                                    }
                                )
                                .join("\n            ");
                        }

                        let tsxCode = `import { ${typesImports}, ${fieldImports} } from '@sitecore-jss/sitecore-jss-nextjs';
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

const ${codeName} = ({ fields, params, ${
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
${returnSnippet}`;

                        if (
                            !(
                                chatGptApiKey === undefined ||
                                chatGptApiKey === null ||
                                chatGptApiKey === ""
                            )
                        ) {
                            try {
                                const openai = new OpenAI({
                                    apiKey: chatGptApiKey,
                                    organization: chatGptOrganizationId,
                                });

                                const prompt = `
                                Add styled-jsx styling to the following NextJS tsx component. Return only code with no explanation and
                                if a placeholder html element is present, do not modify it.
                                ${tsxCode}
                                `;

                                const completion =
                                    await openai.chat.completions.create({
                                        model: "o3-mini",
                                        reasoning_effort: "medium",
                                        messages: [
                                            {
                                                role: "user",
                                                content: prompt,
                                            },
                                        ],
                                        store: false,
                                    });

                                tsxCode =
                                    completion.choices[0].message.content ?? "";
                            } catch (error) {
                                panel.webview.postMessage({
                                    command: "error",
                                    message:
                                        "Failed to call chatgpt with issue: " +
                                        error,
                                });
                                return;
                            }
                        }

                        const snippet = new vscode.SnippetString(tsxCode);
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
                                `Component ${codeName} created successfully. Would you like to deploy it to Sitecore?`,
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

            panel.webview.html = await getDeployComponentContent(componentData);

            panel.webview.onDidReceiveMessage(
                async (message: {
                    command: string;
                    data: {
                        instanceUrl: string;
                        accessToken: string;
                        templateName: string;
                        templateParent: string;
                        renderingParent: string;
                        placeholderParent?: string;
                    };
                }) => {
                    if (message.command === "deployTemplate") {
                        try {
                            const {
                                instanceUrl,
                                accessToken,
                                templateName,
                                templateParent,
                                renderingParent,
                                placeholderParent,
                            } = message.data;

                            let placeholderIds: string[] = [];
                            const codeName = formatComponentName(
                                templateName,
                                true
                            );
                            const sitecoreName = formatComponentName(
                                templateName,
                                false
                            );

                            // Create placeholders if they exist
                            if (
                                componentData.hasPlaceholders === "yes" &&
                                componentData.placeholders &&
                                componentData.placeholders.length > 0 &&
                                placeholderParent
                            ) {
                                console.log(
                                    "Creating placeholders:",
                                    componentData.placeholders
                                );

                                for (const placeholder of componentData.placeholders) {
                                    const placeholderQuery = `
                                        mutation {
                                            createItem(
                                                input: {
                                                    name: "${placeholder.name}",
                                                    templateId: "{5C547D4E-7111-4995-95B0-6B561751BF2E}",
                                                    parent: "${placeholderParent}",
                                                    language: "en",
                                                    fields: [
                                                        { name: "Placeholder Key", value: "${placeholder.key}" }
                                                    ]
                                                }
                                            ) {
                                                item {
                                                    itemId
                                                    name
                                                    path
                                                }
                                            }
                                        }`;

                                    try {
                                        const placeholderResponse = await fetch(
                                            `${instanceUrl}/sitecore/api/authoring/graphql/v1`,
                                            {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                    Authorization: `Bearer ${accessToken}`,
                                                    "X-GQL-Token": accessToken,
                                                },
                                                body: JSON.stringify({
                                                    query: placeholderQuery,
                                                }),
                                            }
                                        );

                                        const placeholderResult =
                                            (await placeholderResponse.json()) as {
                                                data?: {
                                                    createItem?: {
                                                        item?: {
                                                            itemId: string;
                                                            name: string;
                                                            path: string;
                                                        };
                                                    };
                                                };
                                                errors?: Array<{
                                                    message: string;
                                                }>;
                                            };

                                        if (
                                            placeholderResult.data?.createItem
                                                ?.item?.itemId
                                        ) {
                                            placeholderIds.push(
                                                placeholderResult.data
                                                    .createItem.item.itemId
                                            );
                                        }
                                    } catch (error) {
                                        console.error(
                                            `Error creating placeholder ${placeholder.name}:`,
                                            error
                                        );
                                    }
                                }
                            }

                            // Only create template if component type is withDatasourceCheck
                            let templateId = undefined;
                            if (
                                componentData.componentType ===
                                "withDatasourceCheck"
                            ) {
                                const templateResult = await createTemplate(
                                    instanceUrl,
                                    accessToken,
                                    sitecoreName,
                                    templateParent,
                                    componentData.fields!
                                );
                                if (templateResult.errors) {
                                    throw new Error(
                                        templateResult.errors[0].message
                                    );
                                }
                                templateId =
                                    templateResult.data?.createItemTemplate
                                        ?.itemTemplate?.templateId;
                            }

                            // Create rendering
                            const renderingQuery = `
                                mutation {
                                    createItem(
                                        input: {
                                            name: "${sitecoreName}",
                                            templateId: "{04646A89-996F-4EE7-878A-FFDBF1F0EF0D}",
                                            parent: "${renderingParent}",
                                            language: "en",
                                            fields: [
                                                { name: "componentName", value: "${codeName}" }
                                                ${
                                                    placeholderIds.length > 0
                                                        ? `, { name: "Placeholders", value: "${placeholderIds.join(
                                                              "|"
                                                          )}" }`
                                                        : ""
                                                }
                                            ]
                                        }
                                    ) {
                                        item {
                                            itemId
                                            name
                                            path
                                        }
                                    }
                                }`;

                            console.log("Rendering Query:", renderingQuery);

                            const renderingResponse = await fetch(
                                `${instanceUrl}/sitecore/api/authoring/graphql/v1`,
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

                            if (renderingResult.errors) {
                                throw new Error(
                                    renderingResult.errors[0].message
                                );
                            }

                            if (
                                renderingResult.data?.createItem?.item?.itemId
                            ) {
                                panel.webview.postMessage({
                                    command: "success",
                                    message: `${
                                        placeholderIds.length > 0
                                            ? "Placeholders and "
                                            : ""
                                    } Rendering created successfully!`,
                                });
                            } else {
                                panel.webview.postMessage({
                                    command: "error",
                                    message: "Failed to create rendering",
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

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
