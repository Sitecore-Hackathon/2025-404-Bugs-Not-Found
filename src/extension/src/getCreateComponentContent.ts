export async function getCreateComponentContent() {
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
                <input required type="text" id="componentName" placeholder="Enter component name" required>
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
                <label for="hasPlaceholders">Include Placeholders</label>
                <select id="hasPlaceholders">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                </select>
            </div>

            <div class="section-title">Fields Configuration</div>
            <div class="form-group">
                <div id="fields" class="fields-container"></div>
                <button class="add-field" onclick="addField()">+ Add Field</button>
            </div>

            <div id="placeholderSection" class="section-title" style="display: none;">Placeholder Configuration</div>
            <div id="placeholderConfig" class="form-group" style="display: none;">
                <div id="placeholders" class="fields-container"></div>
                <button class="add-field" onclick="addPlaceholder()">+ Add Placeholder</button>
            </div>

            <div class="section-title">Style Component with AI (optional)</div>
            <div class="form-group">
                <label for="chatGptApiKey">ChatGPT Api Key</label>
                <input type="text" id="chatGptApiKey" required placeholder="Enter your sitecore instance chatGPT api key">
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
                        <option value="SingleLineText">Single Line Text</option>
                        <option value="RichText">Rich Text Field</option>
                        <option value="LinkField">Link Field</option>
                        <option value="ImageField">Image Field</option>
                        <option value="Checkbox">Checkbox</option>
                        <option value="MultilineText">Multiline Text</option>
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

            function addPlaceholder() {
                const placeholdersContainer = document.getElementById('placeholders');
                const placeholderRow = document.createElement('div');
                placeholderRow.className = 'field-row placeholder-row';
                placeholderRow.innerHTML = \`
                    <input type="text" placeholder="Placeholder name" required>
                    <input type="text" placeholder="Placeholder key" required>
                    <select class="placeholder-type" onchange="updatePlaceholderKey(this)">
                        <option value="static">Static</option>
                        <option value="dynamic">Dynamic</option>
                    </select>
                    <button onclick="this.parentElement.remove()" title="Remove placeholder" type="button">×</button>
                \`;
                placeholdersContainer.appendChild(placeholderRow);
                
                // Focus the new placeholder's name input
                const newInput = placeholderRow.querySelector('input[type="text"]');
                if (newInput) {
                    newInput.focus();
                }
            }

            function updatePlaceholderKey(select) {
                const row = select.closest('.placeholder-row');
                const keyInput = row.querySelectorAll('input[type="text"]')[1];
                const currentKey = keyInput.value;
                
                if (select.value === 'dynamic') {
                    if (!currentKey.endsWith('-{*}')) {
                        keyInput.value = currentKey + '-{*}';
                    }
                } else {
                    if (currentKey.endsWith('-{*}')) {
                        keyInput.value = currentKey.slice(0, -4);
                    }
                }
            }

            // Add event listener for placeholder type change
            document.getElementById('hasPlaceholders').addEventListener('change', function() {
                const placeholderSection = document.getElementById('placeholderSection');
                const placeholderConfig = document.getElementById('placeholderConfig');
                if (this.value === 'yes') {
                    placeholderSection.style.display = 'block';
                    placeholderConfig.style.display = 'block';
                    if (!document.querySelector('.placeholder-row')) {
                        addPlaceholder();
                    }
                } else {
                    placeholderSection.style.display = 'none';
                    placeholderConfig.style.display = 'none';
                }
            });

            function createComponent() {
                const componentName = document.getElementById('componentName').value;
                const componentType = document.getElementById('componentType').value;
                const hasPlaceholders = document.getElementById('hasPlaceholders').value;
                const hasChatGptApiKey = document.getElementById('chatGptApiKey').value;
                
                if (!componentName) {
                    alert('Please enter a component name');
                    return;
                }

                const fieldRows = document.querySelectorAll('.field-row:not(.placeholder-row)');
                const fields = Array.from(fieldRows).map(row => ({
                    label: row.querySelector('input[type="text"]').value,
                    value: row.querySelector('select').value,
                    isRequired: row.querySelector('input[type="checkbox"]').checked
                }));

                const placeholders = hasPlaceholders === 'yes' 
                    ? Array.from(document.querySelectorAll('.placeholder-row')).map(row => ({
                        name: row.querySelectorAll('input[type="text"]')[0].value,
                        key: row.querySelectorAll('input[type="text"]')[1].value,
                        type: row.querySelector('select').value
                    }))
                    : [];

                if (fields.some(field => !field.label)) {
                    alert('Please fill in all field names');
                    return;
                }

                if (hasPlaceholders === 'yes' && placeholders.some(p => !p.name || !p.key)) {
                    alert('Please fill in all placeholder information');
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
                        hasPlaceholders,
                        fields,
                        placeholders,
                        hasChatGptApiKey
                    }
                });
            }

            // Add the placeholder section to the HTML
            document.querySelector('.form-group:has(#hasPlaceholders)').insertAdjacentHTML('afterend', \`
                <div id="placeholderSection" class="section-title" style="display: none;">Placeholder Configuration</div>
                <div id="placeholderConfig" class="form-group" style="display: none;">
                    <div id="placeholders" class="fields-container"></div>
                    <button class="add-field" onclick="addPlaceholder()">+ Add Placeholder</button>
                </div>
            \`);

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
