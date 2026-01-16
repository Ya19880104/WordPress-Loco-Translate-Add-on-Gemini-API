/**
 * YS Loco AI Gemini - Editor Script
 * Version: 2.0.0 (Complete Rewrite)
 */
jQuery(document).ready(function ($) {

    // ===========================================
    // BUTTON INJECTION
    // ===========================================
    function injectButton() {
        var $autoBtn = $('button[data-loco="auto"]');
        var $targetContainer = $('#loco-actions');

        // Prevent duplicates
        if ($('.ys-ai-tool-trigger').length > 0) return;

        var $fieldset = $('<fieldset class="ys-gemini-fieldset"></fieldset>');

        // AI Translate Button (triggers native auto-translate)
        var $btnTranslate = $('<button type="button" class="button has-icon ys-ai-translate-trigger" title="AI Auto Translate"><i class="dashicons dashicons-translation"></i> AI Translate</button>');
        $btnTranslate.on('click', function (e) {
            e.preventDefault();
            if ($autoBtn.length) {
                $autoBtn.click();
            } else {
                alert("Native Auto Translate function not found.");
            }
        });

        // Tools Button (opens modal)
        var $btnTools = $('<button type="button" class="button has-icon ys-ai-tool-trigger" title="Import/Export JSON"><i class="dashicons dashicons-superhero"></i> Tools</button>');
        $btnTools.on('click', function (e) {
            e.preventDefault();
            openModal();
        });

        $fieldset.append($btnTranslate);
        $fieldset.append($btnTools);

        if ($autoBtn.length) {
            $autoBtn.closest('fieldset').after($fieldset);
            console.log("[YS Loco AI] Custom buttons injected.");
        } else if ($targetContainer.length) {
            $targetContainer.append($fieldset);
            console.log("[YS Loco AI] Custom buttons injected at end of toolbar.");
        } else {
            $('.loco-loading').before($fieldset);
        }
    }

    // Run injection with retries
    injectButton();
    setTimeout(injectButton, 500);
    setTimeout(injectButton, 2000);

    // ===========================================
    // MODAL HTML
    // ===========================================
    var modalHtml = `
    <div class="ys-gemini-modal-overlay" id="ysGeminiModal">
        <div class="ys-gemini-modal">
            <div class="ys-gemini-modal-header">
                <h2>YS AI Translation Tools</h2>
                <button class="ys-gemini-close-btn">&times;</button>
            </div>
            <div class="ys-gemini-tabs">
                <div class="ys-gemini-tab active" data-tab="export">Export JSON</div>
                <div class="ys-gemini-tab" data-tab="import">Import JSON</div>
            </div>
            <div class="ys-gemini-modal-body">
                <!-- Export Tab -->
                <div class="ys-gemini-tab-content active" id="ys-tab-export">
                    <div class="ys-gemini-flex-row">
                        <label class="ys-gemini-label">
                            <input type="checkbox" id="ysExportUntranslatedOnly"> 
                            Export Untranslated Strings Only
                        </label>
                    </div>
                    <p style="color:#666; font-size:0.9em; margin-bottom:15px;">
                        Downloads a JSON file suitable for AI translation. <br>
                        Format: <code>{"Source String": "Translation"}</code> (plural forms can be arrays)
                    </p>
                    <button class="ys-gemini-btn" id="ysBtnDownload">
                        Download JSON
                    </button>
                </div>

                <!-- Import Tab -->
                <div id="ys-tab-import" class="ys-gemini-tab-content">
                    <!-- Import Method Toggle -->
                    <div style="display:flex; gap:10px; margin-bottom:15px;">
                        <button type="button" id="ysImportModeFile" class="ys-import-mode-btn active" style="flex:1; padding:8px; border:1px solid #8b5cf6; background:#8b5cf6; color:#fff; border-radius:6px; cursor:pointer;">
                            <i class="dashicons dashicons-upload"></i> Upload File
                        </button>
                        <button type="button" id="ysImportModePaste" class="ys-import-mode-btn" style="flex:1; padding:8px; border:1px solid #e5e7eb; background:#fff; color:#374151; border-radius:6px; cursor:pointer;">
                            <i class="dashicons dashicons-clipboard"></i> Paste JSON
                        </button>
                    </div>
                    
                    <!-- File Upload Area -->
                    <div id="ysImportFileArea" style="margin-bottom:15px;">
                        <label class="ys-file-upload-zone" for="ysImportFile">
                            <i class="dashicons dashicons-upload" style="font-size:32px; width:32px; height:32px; color:#8b5cf6;"></i>
                            <span style="font-size:16px; margin-top:10px; display:block;">Click to upload or drag JSON file here</span>
                            <input type="file" id="ysImportFile" accept=".json" style="display:none;">
                            <span id="ysFileName" style="display:block; margin-top:5px; color:#6b7280; font-size:13px;"></span>
                        </label>
                    </div>
                    
                    <!-- Paste JSON Area (hidden by default) -->
                    <div id="ysImportPasteArea" style="margin-bottom:15px; display:none;">
                        <textarea id="ysImportPasteText" placeholder="Paste your JSON here..." style="width:100%; height:150px; border:1px dashed #8b5cf6; border-radius:8px; padding:12px; font-family:monospace; font-size:12px; resize:vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="ysImportOverwrite"> 
                            <span>Overwrite existing translations</span>
                        </label>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                            <input type="checkbox" id="ysImportFuzzy"> 
                            <span>Fuzzy match (ignore case/whitespace differences)</span>
                        </label>
                    </div>
                    <button type="button" id="ysBtnImport" class="ys-gemini-btn" style="width:100%">
                        <i class="dashicons dashicons-download"></i> Start Import
                    </button>
                    <div id="ysImportStatus" style="margin-top:10px; text-align:center; font-size:13px; color:#6b7280;"></div>
                </div>
            </div>
        </div>
    </div>
    `;

    $('body').append(modalHtml);

    // ===========================================
    // MODAL CONTROLS
    // ===========================================
    function openModal() {
        $('#ysGeminiModal').addClass('active');
    }

    function closeModal() {
        $('#ysGeminiModal').removeClass('active');
        $('#ysImportStatus').text('');
    }

    // Tab switching
    $('.ys-gemini-tab').on('click', function () {
        $('.ys-gemini-tab').removeClass('active');
        $(this).addClass('active');
        $('.ys-gemini-tab-content').removeClass('active');
        $('#ys-tab-' + $(this).data('tab')).addClass('active');
    });

    // Close button
    $('.ys-gemini-close-btn').on('click', closeModal);

    // Click outside to close
    $('#ysGeminiModal').on('click', function (e) {
        if (e.target === this) closeModal();
    });

    // File input change
    $('#ysImportFile').on('change', function () {
        var file = this.files[0];
        if (file) {
            $('#ysFileName').text("Selected: " + file.name);
            $('.ys-file-upload-zone').addClass('has-file');
        } else {
            $('#ysFileName').text("");
            $('.ys-file-upload-zone').removeClass('has-file');
        }
    });

    // Import mode toggle
    $('#ysImportModeFile').on('click', function () {
        $('#ysImportModeFile').css({ background: '#8b5cf6', color: '#fff', borderColor: '#8b5cf6' });
        $('#ysImportModePaste').css({ background: '#fff', color: '#374151', borderColor: '#e5e7eb' });
        $('#ysImportFileArea').show();
        $('#ysImportPasteArea').hide();
    });

    $('#ysImportModePaste').on('click', function () {
        $('#ysImportModePaste').css({ background: '#8b5cf6', color: '#fff', borderColor: '#8b5cf6' });
        $('#ysImportModeFile').css({ background: '#fff', color: '#374151', borderColor: '#e5e7eb' });
        $('#ysImportPasteArea').show();
        $('#ysImportFileArea').hide();
    });

    // ===========================================
    // DATA ACCESS HELPERS
    // ===========================================
    function getExportItems() {
        // Prefer editor data to avoid podata plural rows
        var editor = getEditorInstance();
        if (editor && editor.po) {
            return editor.po;
        }
        if (window.ysLocoConfig && window.ysLocoConfig.podata) {
            return window.ysLocoConfig.podata;
        }
        if (window.loco && window.loco.editor && window.loco.editor.po) {
            return window.loco.editor.po;
        }
        return null;
    }

    function getEditorInstance() {
        if (window.ysLocoEditorInstance) return window.ysLocoEditorInstance;
        if (window.loco && window.loco.editor) return window.loco.editor;
        if (window.locoScope && window.locoScope.editor) return window.locoScope.editor;
        return null;
    }

    function toItemArray(rawItems) {
        if (!rawItems) return [];
        if (Array.isArray(rawItems)) return rawItems;
        if (rawItems.rows) return toItemArray(rawItems.rows);
        if (rawItems.items) return toItemArray(rawItems.items);
        if (rawItems._items) return toItemArray(rawItems._items);

        var items = [];
        if (typeof rawItems.each === 'function') {
            rawItems.each(function (key, item) {
                if (item) items.push(item);
            });
            if (items.length) return items;
        }

        if (typeof rawItems.length === 'number') {
            for (var i = 0; i < rawItems.length; i++) {
                if (rawItems[i]) items.push(rawItems[i]);
            }
        }

        return items;
    }

    function getItemSource(item) {
        if (!item) return "";
        if (typeof item.source === 'function') return String(item.source() || "");
        if (item.src && typeof item.src[0] !== 'undefined') return String(item.src[0] || "");
        if (typeof item.source === 'string') return item.source;
        if (item.source && item.source[0]) return String(item.source[0]);
        if (item.msgid) return String(item.msgid);
        if (item.id) return String(item.id);
        return "";
    }

    function getItemContext(item) {
        if (!item) return "";
        if (typeof item.context === 'function') return String(item.context() || "");
        if (typeof item.context === 'string') return item.context;
        if (typeof item.ctx === 'string') return item.ctx;
        return "";
    }

    function getItemTranslation(item, index) {
        var idx = index || 0;
        if (!item) return "";
        if (typeof item.translation === 'function') return String(item.translation(idx) || "");
        if (item.msg && typeof item.msg[idx] !== 'undefined') return String(item.msg[idx] || "");
        if (Array.isArray(item.target) && typeof item.target[idx] !== 'undefined') return String(item.target[idx] || "");
        if (typeof item.target === 'string' && idx === 0) return item.target;
        return "";
    }

    function getItemTranslations(item) {
        if (!item) return "";
        var count = typeof item.count === 'function' ? item.count() : 0;
        if (count > 1) {
            var plurals = [];
            for (var i = 0; i < count; i++) {
                plurals.push(getItemTranslation(item, i));
            }
            return plurals;
        }

        if (item.msg && Array.isArray(item.msg)) {
            if (item.msg.length > 1) {
                return item.msg.map(function (val) {
                    return val == null ? "" : String(val);
                });
            }
            if (item.msg.length === 1) return String(item.msg[0] || "");
        }

        return getItemTranslation(item, 0);
    }

    function buildExportKey(source, context) {
        return context ? (context + "\u0004" + source) : source;
    }

    function splitContextKey(key) {
        if (key.indexOf("\u0004") !== -1) {
            var parts = key.split("\u0004");
            return {
                context: parts[0],
                source: parts.slice(1).join("\u0004")
            };
        }
        if (key.indexOf("\u0000") !== -1) {
            var nullParts = key.split("\u0000");
            return {
                source: nullParts[0],
                context: nullParts.slice(1).join("\u0000")
            };
        }
        return { source: key, context: "" };
    }

    function buildHashKey(source, context) {
        return context ? (source + "\u0000" + context) : source;
    }

    // ===========================================
    // EXPORT LOGIC
    // ===========================================
    $('#ysBtnDownload').on('click', function () {
        var rawItems = getExportItems();

        if (!rawItems) {
            alert("Could not access Loco Translate internal data. Please refresh the page and try again.");
            return;
        }

        var items = toItemArray(rawItems);
        if (!items.length) {
            console.log("[YS Loco AI] Unknown items structure:", rawItems);
            alert("Unknown data structure. Check console.");
            return;
        }

        var onlyUntranslated = $('#ysExportUntranslatedOnly').is(':checked');
        var translations = {};
        var count = 0;

        console.log("[YS Loco AI] Export: Total items in editor:", items.length);

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var source = getItemSource(item);
            var context = getItemContext(item);
            var target = getItemTranslations(item);
            var isTranslated = false;

            if (Array.isArray(target)) {
                isTranslated = target.some(function (val) {
                    return String(val || "").trim() !== "";
                });
            } else {
                isTranslated = String(target || "").trim() !== "";
            }

            if (onlyUntranslated && isTranslated) continue;

            if (source) {
                var exportKey = buildExportKey(source, context);
                translations[exportKey] = target;
                count++;
            }
        }

        console.log("[YS Loco AI] Export: Exported", count, "items");

        // Detect target language from page (multiple methods)
        var targetLanguage = "";
        var locale = "";
        var pageTitle = document.title || "";

        // Method 1: From page title - "Editing: plugin-name - Chinese (Taiwan) (zh_TW)"
        var langMatch = pageTitle.match(/-\s*([^(]+)\s*\(([^)]+)\)\s*$/);
        if (langMatch) {
            targetLanguage = langMatch[1].trim();
            locale = langMatch[2].trim();
        }

        // Method 2: From URL parameter
        if (!targetLanguage) {
            var urlParams = new URLSearchParams(window.location.search);
            locale = urlParams.get('locale') || urlParams.get('lang') || "";
            if (locale) {
                targetLanguage = locale;
            }
        }

        // Method 3: From Loco config if available
        if (!targetLanguage && window.ysLocoConfig && window.ysLocoConfig.locale) {
            locale = window.ysLocoConfig.locale.lang || window.ysLocoConfig.locale.code || "";
            targetLanguage = window.ysLocoConfig.locale.label || locale;
        }

        // Fallback
        if (!targetLanguage) {
            targetLanguage = "the target language";
        }

        // Get user's custom prompt if available
        var customPrompt = "";
        if (window.ysLocoSettings && window.ysLocoSettings.prompt) {
            customPrompt = window.ysLocoSettings.prompt;
        }

        // Build comprehensive AI instruction
        var instructionParts = [
            "=== AI Translation Instructions ==="
        ];

        // Add custom prompt if available
        if (customPrompt) {
            instructionParts.push("");
            instructionParts.push("=== Custom Instructions ===");
            instructionParts.push(customPrompt);
            instructionParts.push("");
        }

        instructionParts = instructionParts.concat([
            "",
            "Target Language: " + targetLanguage + (locale ? " (" + locale + ")" : ""),
            "",
            "JSON Format:",
            "- KEY (left side) = Original source text (DO NOT modify)",
            "- Keys with context use a \\u0004 separator. Keep it unchanged.",
            "- VALUE (right side) = Your translation (string or array for plural forms)",
            "",
            "Rules:",
            "1. Translate ONLY the VALUE (right side), keep the KEY unchanged",
            "2. If VALUE is an array, translate each element in order",
            "3. Preserve all placeholders like %s, %d, %1$s, {variable}, etc.",
            "4. Preserve HTML tags if present",
            "5. Keep the same JSON structure",
            "6. Return the complete JSON with translations filled in",
            "",
            "=== Translation Data Below ==="
        ]);

        var aiInstruction = instructionParts.join("\n");

        var exportObj = {
            "_instruction": aiInstruction,
            "data": translations
        };

        var jsonStr = JSON.stringify(exportObj, null, 2);
        var blob = new Blob([jsonStr], { type: "application/json" });
        var url = URL.createObjectURL(blob);

        // Generate filename with project name and date
        var projectName = "loco-export";
        // Try to get project name from page title or URL
        var pageTitle = document.title || "";
        // Loco page title format: "Editing: plugin-name - Language (locale)"
        var titleMatch = pageTitle.match(/Editing:\s*(.+?)\s*-/);
        if (titleMatch && titleMatch[1]) {
            projectName = titleMatch[1].trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
        } else {
            // Fallback: try to get from URL parameter
            var urlParams = new URLSearchParams(window.location.search);
            var domain = urlParams.get('domain') || urlParams.get('bundle');
            if (domain) {
                projectName = domain.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
            }
        }

        // Add date
        var now = new Date();
        var dateStr = now.getFullYear() +
            ('0' + (now.getMonth() + 1)).slice(-2) +
            ('0' + now.getDate()).slice(-2);

        var filename = projectName + "_" + dateStr + ".json";

        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("[YS Loco AI] Exported " + count + " strings.");
    });

    // ===========================================
    // IMPORT LOGIC
    // ===========================================
    $('#ysBtnImport').on('click', function () {
        var overwrite = $('#ysImportOverwrite').is(':checked');
        var fuzzyMatch = $('#ysImportFuzzy').is(':checked');

        // Check which mode is active
        var isPasteMode = $('#ysImportPasteArea').is(':visible');

        if (isPasteMode) {
            // Paste mode
            var jsonStr = $('#ysImportPasteText').val().trim();

            if (!jsonStr) {
                alert("Please paste JSON content first.");
                return;
            }

            var importPayload;
            try {
                importPayload = JSON.parse(jsonStr);
            } catch (err) {
                alert("Invalid JSON format. Please check your pasted content.");
                return;
            }

            // Handle enhanced format or legacy format
            var importData = {};
            if (importPayload.data && typeof importPayload.data === 'object') {
                importData = importPayload.data;
            } else {
                importData = importPayload;
            }

            processImport(importData, overwrite, fuzzyMatch);

        } else {
            // File mode
            var fileInput = $('#ysImportFile')[0];
            var file = fileInput.files[0];

            if (!file) {
                alert("Please select a JSON file first.");
                return;
            }

            var reader = new FileReader();

            reader.onload = function (e) {
                var jsonStr = e.target.result;
                var importPayload;

                try {
                    importPayload = JSON.parse(jsonStr);
                } catch (err) {
                    alert("Invalid JSON format in file.");
                    return;
                }

                // Handle enhanced format or legacy format
                var importData = {};
                if (importPayload.data && typeof importPayload.data === 'object') {
                    importData = importPayload.data;
                } else {
                    importData = importPayload;
                }

                processImport(importData, overwrite, fuzzyMatch);
            };

            reader.readAsText(file);
        }
    });

    function processImport(importData, overwrite, fuzzyMatch) {
        var editor = getEditorInstance();

        if (!editor) {
            alert("Error: Cannot access Loco Editor instance.\nPlease reload the page and try again.");
            return;
        }

        console.log("[YS Loco AI] Editor:", editor);
        console.log("[YS Loco AI] Fuzzy Match enabled:", fuzzyMatch);

        if (!importData || typeof importData !== 'object') {
            alert("Invalid JSON structure. Please check your import file.");
            return;
        }

        // Helper for normalizing strings for fuzzy matching
        // More aggressive: lowercase, strip extra whitespace, remove punctuation, strip invisible chars
        function normalizeForFuzzy(str) {
            if (!str) return "";
            return str.toLowerCase()
                .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width chars
                .replace(/[.,!?;:'"()\[\]{}]/g, '')  // Remove punctuation
                .replace(/\s+/g, ' ')  // Normalize multiple whitespace to single space
                .replace(/%\s+/g, '%')  // Normalize %s, %d patterns
                .trim();
        }

        function normalizeImportValue(value) {
            if (value === null || typeof value === 'undefined') return null;
            if (Array.isArray(value)) {
                return value.map(function (val) {
                    return val === null || typeof val === 'undefined' ? "" : String(val);
                });
            }
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
            }
            return null;
        }

        function buildItemIndex(items, useFuzzy) {
            var index = {
                byHash: {},
                bySource: {},
                fuzzyByHash: {},
                fuzzyBySource: {}
            };

            items.forEach(function (item) {
                var source = getItemSource(item);
                if (!source) return;
                var context = getItemContext(item);
                var hashKey = buildHashKey(source, context);

                if (!index.byHash[hashKey]) index.byHash[hashKey] = [];
                index.byHash[hashKey].push(item);

                if (!index.bySource[source]) index.bySource[source] = [];
                index.bySource[source].push(item);

                if (useFuzzy) {
                    var sourceNorm = normalizeForFuzzy(source);
                    if (sourceNorm) {
                        if (!index.fuzzyBySource[sourceNorm]) index.fuzzyBySource[sourceNorm] = [];
                        index.fuzzyBySource[sourceNorm].push(item);
                    }

                    if (context) {
                        var contextNorm = normalizeForFuzzy(context);
                        var fuzzyHash = sourceNorm + "\u0000" + contextNorm;
                        if (!index.fuzzyByHash[fuzzyHash]) index.fuzzyByHash[fuzzyHash] = [];
                        index.fuzzyByHash[fuzzyHash].push(item);
                    }
                }
            });

            return index;
        }

        function findMatches(parsedKey, index, useFuzzy) {
            var source = parsedKey.source || "";
            var context = parsedKey.context || "";
            var matches = [];

            if (context) {
                var hashKey = buildHashKey(source, context);
                if (index.byHash[hashKey]) matches = index.byHash[hashKey];
            }

            if (!matches.length && source && index.bySource[source]) {
                matches = index.bySource[source];
            }

            if (!matches.length && useFuzzy) {
                var sourceNorm = normalizeForFuzzy(source);
                if (context) {
                    var contextNorm = normalizeForFuzzy(context);
                    var fuzzyHashKey = sourceNorm + "\u0000" + contextNorm;
                    if (index.fuzzyByHash[fuzzyHashKey]) matches = index.fuzzyByHash[fuzzyHashKey];
                }
                if (!matches.length && sourceNorm && index.fuzzyBySource[sourceNorm]) {
                    matches = index.fuzzyBySource[sourceNorm];
                }
            }

            return matches || [];
        }

        function applyTranslation(item, value, allowOverwrite, markFuzzy) {
            if (!item || typeof item.translate !== 'function') return false;
            var updated = false;

            if (Array.isArray(value)) {
                var maxForms = typeof item.count === 'function' ? item.count() : value.length;
                for (var i = 0; i < value.length && i < maxForms; i++) {
                    var newText = value[i];
                    var currentText = getItemTranslation(item, i);
                    var shouldUpdate = allowOverwrite ?
                        (newText !== currentText) :
                        (currentText === "" && newText !== "");
                    if (shouldUpdate) {
                        item.translate(newText, i);
                        if (markFuzzy && typeof item.fuzzy === 'function') {
                            item.fuzzy(i, true);
                        }
                        updated = true;
                    }
                }
                return updated;
            }

            var current = getItemTranslation(item, 0);
            var shouldUpdateSingle = allowOverwrite ?
                (value !== current) :
                (current === "" && value !== "");
            if (shouldUpdateSingle) {
                item.translate(value, 0);
                if (markFuzzy && typeof item.fuzzy === 'function') {
                    item.fuzzy(0, true);
                }
                return true;
            }

            return false;
        }

        var items = toItemArray(editor && editor.po ? editor.po : null);
        if (!items.length && editor.listTable && editor.listTable.ds) {
            items = toItemArray(editor.listTable.ds);
        }

        if (!items.length) {
            console.error("[YS Loco AI] Could not extract items. Editor Object:", editor);
            alert("Error: Could not find translation items.\nCheck console for 'Editor Object' details.");
            return;
        }

        console.log("[YS Loco AI] Import: Total items in editor:", items.length);

        var itemIndex = buildItemIndex(items, fuzzyMatch);
        var updated = 0;
        var debugUnmatched = 0;

        Object.keys(importData).forEach(function (importKey) {
            if (!importKey || importKey.charAt(0) === '_') return;

            var translationValue = normalizeImportValue(importData[importKey]);
            if (translationValue === null) return;

            var parsedKey = splitContextKey(importKey);
            var matches = findMatches(parsedKey, itemIndex, fuzzyMatch);

            if (!matches.length) {
                if (debugUnmatched < 5) {
                    console.log("[YS Loco AI] NO MATCH for:", importKey.substring(0, 60));
                    debugUnmatched++;
                }
                return;
            }

            matches.forEach(function (item) {
                if (applyTranslation(item, translationValue, overwrite, fuzzyMatch)) {
                    updated++;
                    if (typeof editor.updateListCell === 'function') {
                        editor.updateListCell(item, 'target');
                    }
                    if (typeof editor.reCssRow === 'function') {
                        editor.reCssRow(item);
                    }
                }
            });
        });

        // Summary log
        var totalImportKeys = Object.keys(importData).filter(function (k) {
            return k && k.charAt(0) !== '_';
        }).length;
        console.log("[YS Loco AI] Import Summary:");
        console.log("[YS Loco AI]   Total items in Loco:", items.length);
        console.log("[YS Loco AI]   Total keys in JSON:", totalImportKeys);
        console.log("[YS Loco AI]   Successfully updated:", updated);
        console.log("[YS Loco AI]   No match found:", debugUnmatched);

        // Mark editor as dirty so SAVE button is enabled
        if (updated > 0) {
            if (typeof editor.dirty === 'number') {
                editor.dirty += updated;
                console.log("[YS Loco AI] editor.dirty increased to:", editor.dirty);
            } else if (typeof editor.dirty === 'function') {
                editor.dirty(true);
            }

            if (typeof editor.fire === 'function') {
                editor.fire('poUnsaved');
            }

            if (editor.po && typeof editor.po.dirty === 'number') {
                editor.po.dirty += updated;
            }
        }
        // Rebuild UI - keep it minimal to avoid list glitches
        console.log("[YS Loco AI] Attempting UI refresh...");

        var activeItem = null;
        if (typeof editor.current === 'function') {
            activeItem = editor.current();
        }

        if (typeof editor.redraw === 'function') {
            editor.redraw();
            console.log("[YS Loco AI] Called editor.redraw()");
        }

        if (activeItem && typeof editor.reloadMessage === 'function') {
            editor.reloadMessage(activeItem);
            console.log("[YS Loco AI] Reloaded active message");
        }

        if (typeof editor.fire === 'function') {
            editor.fire('poUpdate', [activeItem]);
            console.log("[YS Loco AI] Fired poUpdate");
        }

        $('#ysImportStatus').text("Imported " + updated + " translations. Don't forget to SAVE.");
        $('#ysImportStatus').css('color', '#10b981');

        console.log("[YS Loco AI] Import complete. Updated:", updated);

        // Auto-close modal after 2 seconds
        setTimeout(function () {
            closeModal();
        }, 2000);
    }

});
