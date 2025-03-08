![Hackathon Logo](docs/images/hackathon.png?raw=true "Hackathon Logo")

# Sitecore Hackathon 2025

-   MUST READ: **[Submission requirements](SUBMISSION_REQUIREMENTS.md)**
-   [Entry form template](ENTRYFORM.md)

## Team name

**404 Bugs Not Found**

[<img src="docs/images/404-no-bugs-found-sitecore-hackathon-2025.png" width="250"/>](docs/images/404-no-bugs-found-sitecore-hackathon-2025.png)

## Category

-   Use of the Sitecore Authoring and/or Management API
-   AI
-   Enhancement to a Community Module

## Description

### Sitecore XM Cloud Components VS Code Extension

##### Module Purpose

The **Sitecore XM Cloud Components** VS Code Extension aims to simplify and automate the creation and management of Sitecore XM Cloud components within Visual Studio Code. By providing a user-friendly interface, this extension enables developers to dynamically generate component snippets, ensuring consistency and improving development efficiency.

#### Problem Solved

Manually creating Sitecore XM Cloud components can be repetitive and prone to errors. Developers need to follow specific patterns and incorporate various fields and placeholders, which can lead to mistakes and inconsistencies if done manually. Additionally, managing state and data between different commands can be challenging without a centralized approach.

#### Solution

This VS Code extension addresses these issues by offering the following key features:

##### Dynamic Component Creation

-   Allows developers to create Sitecore XM Cloud components dynamically via a webview interface.
-   Users can specify the component name, type, placeholder type, and add custom fields as needed.

##### State Management

-   A built-in `ComponentStateManager` class handles the state and data between different commands, ensuring consistent data sharing and updates throughout the extension.

##### User-Friendly Interface

-   The webview interface presents an intuitive form where users can input component names, select component and placeholder types, and dynamically add custom fields.
-   This reduces the risk of human error and ensures components are created with the correct structure.

##### Code Generation

-   Based on user input, the extension generates the required TypeScript code, including imports, interface definitions, and JSX markup.
-   The generated code is automatically inserted into the active editor, saving developers time and effort.

##### Deployment to Sitecore

-   Includes a feature for deploying components to Sitecore XM Cloud.
-   Users can provide authentication and configuration details through the webview, allowing the extension to handle the deployment process seamlessly.

By automating the component creation process and providing centralized state management, this extension enhances productivity and minimizes errors in Sitecore XM Cloud component development.

## Video link

[Video Demo](https://youtu.be/sktlpb_f_Lc)

## Pre-requisites and Dependencies

### Dependencies

-   **VS Code API (`vscode`)**:
    -   Used to interact with the Visual Studio Code environment.
    -   Install: `npm install vscode`
-   **File System (`fs`)**:
    -   Used for file system interactions.
    -   Install: `npm install fs`
-   **Path (`path`)**:
    -   Used for handling and transforming file paths.
    -   Install: `npm install path`
-   **OpenAI (`openai`)**:
    -   Used to interact with the OpenAI API for generating code completions.
    -   Install: `npm install openai`

### Services

This extension integrates with the following services:

#### Sitecore XM Cloud

-   **Access Token**:
    -   A valid Sitecore XM Cloud access token is required for authentication during component deployment.
    -   The token must have sufficient permissions to create templates and renderings.
-   **GraphQL Endpoint**:
    -   The extension relies on the Sitecore XM Cloud GraphQL endpoint to create templates and renderings.
    -   Ensure the endpoint is enabled and accessible within your XM Cloud instance.

#### OpenAI (Optional)

-   **API Key**:
    -   An OpenAI API key is required to utilize OpenAI's code completion capabilities.
    -   You may include this key when creating components.
-   **Organization Id**:
    -   An Organization id may be required to utilize OpenAI's code completion capabilities.
    -   You may include this id when creating components if your subscription requires it.

#### Custom Modules

This extension utilizes the following custom modules to manage WebView content:

-   **`getCreateComponentContent`**:

    -   Provides the HTML content for the WebView used to create new components.
    -   Import: `import { getCreateComponentContent } from "./getCreateComponentContent";`

-   **`getDeployComponentContent`**:
    -   Provides the HTML content for the WebView used to deploy components to Sitecore XM Cloud.
    -   Import: `import { getDeployComponentContent } from "./getDeployComponentContent";`

### Configuration

The following configurations are required for the extension to function correctly:

1.  **Access Token**:
    -   A Sitecore XM Cloud access token is required for authentication.
    -   Ensure the access token is configured and available.
2.  **Paths Configuration**:
    -   The extension requires paths for template and rendering parent paths within Sitecore.
    -   Configure these paths correctly within the extension's WebView.

## Installation instructions

### Prerequisites

Before installing this extension, ensure you have the following installed:

1.  **Visual Studio Code**:
    -   Download from: [https://code.visualstudio.com/](https://code.visualstudio.com/)
2.  **Node.js and npm**:
    -   Download from: [https://nodejs.org/](https://nodejs.org/)
3.  **Sitecore XM Cloud**:
    -   Access to a Sitecore XM Cloud instance with permissions to create templates and renderings.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Build the Extension**:
    ```bash
    npm run build
    ```
4.  **Install the Extension**:
    ```bash
    code --install-extension <path-to-vsix-file>
    ```

### Running the Extension

1.  **Open the Extension View**:
    -   In VS Code, click the Extensions icon in the Activity Bar.
2.  **Activate the Extension**:
    -   Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P).
    -   Run the command: `Create Sitecore Component`.
3.  **Create a Component**:
    -   Follow the prompts in the WebView.
    -   Enter the component name, type, placeholder type, and add custom fields as needed.
4.  **Deploy the Component**:
    -   When prompted, provide authentication and configuration details to deploy to Sitecore XM Cloud.

### Sitecore Configuration

1.  **GraphQL Endpoint**:
    -   Ensure the GraphQL endpoint is enabled and accessible in your Sitecore XM Cloud instance.
    -   The extension uses GraphQL to create templates and renderings.
2.  **Access Token**:
    -   Obtain a Sitecore XM Cloud access token with permissions to create templates and renderings.
    -   Provide this token during deployment.
3.  **Template and Rendering Paths**:
    -   Configure the template and rendering parent paths in the extension's WebView.
    -   These paths must point to the correct locations in your Sitecore XM Cloud instance.

### Configuration

-   Template Parent Path: `/sitecore/templates/Project/YourFolder`
-   Rendering Parent Path: `/sitecore/layout/Renderings/Project/YourFolder`
-   Placeholder Parent Path: `/sitecore/layout/Placeholder Settings/Project/YourFolder`

## Usage instructions

### Create Sitecore Component

![Create Sitecore Component](docs/images/create-sitecore-component.gif?raw=true "Create Sitecore Component")

1.  **Open Visual Studio Code**: Launch VS Code.
2.  **Activate the Extension**:
    -   Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P).
    -   Type `Create Sitecore Component` and select the command.
3.  **Fill in Component Details**:
    -   **Component Name**: Enter the component's name.
    -   **Component Type**: Select the type from the dropdown:
        -   `None`
        -   `With Datasource Check`
        -   `With Datasource Rendering`
    -   **Include Placeholders**: Choose `Yes` or `No`.
4.  **Configure Placeholders (if applicable)**:
    -   If `Include Placeholders` is `Yes`, click `+ Add Placeholder`.
    -   For each placeholder:
        -   Enter the placeholder name.
        -   Enter the placeholder key.
        -   Select the placeholder type: `Static` or `Dynamic`.
    -   Repeat to add more placeholders.
5.  **Configure Fields**:
    -   Click `+ Add Field`.
    -   For each field:
        -   Enter the field name.
        -   Select the field type:
            -   `Single Line Text`
            -   `Rich Text Field`
            -   `Link Field`
            -   `Image Field`
            -   `Checkbox`
            -   `Multiline Text`
        -   Specify if the field is required.
    -   Repeat to add more fields.
6.  **Style Component with AI (optional)**:
    -   Obtain an API key and Organization Id from OpenAI to utilize their API.
    -   The extension generates component styling.
7.  **Create the Component**:
    -   Click `Create Component`.
    -   The extension generates TypeScript code and inserts it into the active editor.

### Deploying the Component to Sitecore

![Deploy to Sitecore](docs/images/deploy-to-sitecore.gif?raw=true "Deploy to Sitecore")

1.  **Prompt for Deployment**:
    -   After component creation, click `Yes` when prompted to deploy.
2.  **Fill in Deployment Details**:
    -   **Sitecore XM Cloud Access Token**: Enter your access token.
    -   **Template Name**: Pre-filled with the component name.
    -   **Template Parent Path**: Enter the path (e.g., `/sitecore/templates/Project/YourFolder`).
    -   **Rendering Parent Path**: Enter the path (e.g., `/sitecore/layout/Renderings/Project/YourFolder`).
    -   **Placeholder Parent Path**: (If applicable) Enter the path (e.g., `/sitecore/layout/Placeholder Settings/Project/YourFolder`).
3.  **Deploy the Component**:
    -   Click `Create Template & Rendering`.
    -   The extension uses GraphQL to create the template, rendering, and placeholders.
4.  **Deployment Status**:
    -   The deployment status is displayed in the WebView.
    -   A success or error message will be shown.

### Validation of created items in Sitecore

![Validation of created items in Sitecore](docs/images/validation-of-created-items.gif?raw=true "Validation of created items in Sitecore")

## Comments
