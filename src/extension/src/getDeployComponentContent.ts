export async function getDeployComponentContent(componentData: any) {
    return `<!DOCTYPE html>
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
            <label for="instanceUrl">Sitecore XM Cloud Instance Url</label>
            <input required type="text" id="instanceUrl" required placeholder="Enter your sitecore instance url" value="https://xmcloudcm.localhost">
        </div>
        <div class="form-group">
            <label for="accessToken">Sitecore XM Cloud Access Token</label>
            <input required type="password" id="accessToken" required placeholder="Enter your access token">
        </div>

        <div class="section-title">Component Details</div>
        <div class="form-group">
            <label for="templateName">Template Name</label>
            <input required type="text" id="templateName" value="${componentData.componentName.trim()}" required>
        </div>

        ${
            componentData.componentType === "withDatasourceCheck"
                ? `
        <div class="section-title">Paths Configuration</div>
        <div class="form-group">
            <label for="templateParent">Template Parent ID</label>
            <input required type="text" id="templateParent" value="{110D559F-DEA5-42EA-9C1C-8A5DF7E70EF9}" required>
            <div class="help-text">Example: /sitecore/templates/Project/YourFolder</div>
        </div>
        `
                : ""
        }

        <div class="section-title">Rendering Configuration</div>
        <div class="form-group">
            <label for="renderingParent">Rendering Parent ID</label>
            <input required type="text" id="renderingParent" value="{110D559F-DEA5-42EA-9C1C-8A5DF7E70EF9}" required>
            <div class="help-text">Example: /sitecore/layout/Renderings/Project/YourFolder</div>
        </div>

        ${
            componentData.hasPlaceholders === "yes" &&
            componentData.placeholders &&
            componentData.placeholders.length > 0
                ? `
        <div class="section-title">Placeholder Configuration</div>
        <div class="form-group">
            <label for="placeholderParent">Placeholder Parent ID</label>
            <input required type="text" id="placeholderParent" value="{110D559F-DEA5-42EA-9C1C-8A5DF7E70EF9}" required>
            <div class="help-text">Example: /sitecore/layout/Placeholder Settings/Project/YourFolder</div>
        </div>
        `
                : ""
        }

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
            const instanceUrl = document.getElementById('instanceUrl').value;
            const accessToken = document.getElementById('accessToken').value;
            const templateName = document.getElementById('templateName').value;
            const templateParent = document.getElementById('templateParent')?.value;
            const renderingParent = document.getElementById('renderingParent').value;
            const placeholderParent = document.getElementById('placeholderParent')?.value;
            
            if (!instanceUrl || !accessToken || !templateName || !renderingParent || ${
                componentData.hasPlaceholders === "yes" &&
                componentData.placeholders &&
                componentData.placeholders.length > 0
                    ? "!placeholderParent"
                    : "false"
            }) {
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
                    instanceUrl,
                    accessToken,
                    templateName,
                    templateParent,
                    renderingParent,
                    placeholderParent
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
}
