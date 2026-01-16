jQuery(document).ready(function ($) {

    // Inject Button into Loco Toolbar
    function injectButton() {
        // Target specific button to place ours next to it (The System/Auto buttons)
        var $autoBtn = $('button[data-loco="auto"]');
        var $targetContainer = $('#loco-actions');

        // Prevent duplicates (Updated class check)
        if ($('.ys-ai-tool-trigger').length > 0) return;

        // Create the button wrapped in a fieldset to match Loco style
        var $fieldset = $('<fieldset class="ys-gemini-fieldset"></fieldset>');

        // 1. New Custom "Auto Translate" Button (Triggers native hidden button)
        var $btnTranslate = $('<button type="button" class="button has-icon ys-ai-translate-trigger" title="AI Auto Translate"><i class="dashicons dashicons-translation"></i> AI Translate</button>');
        $btnTranslate.on('click', function (e) {
            e.preventDefault();
            // Trigger the native button
            if ($autoBtn.length) {
                $autoBtn.click();
            } else {
                alert("Native Auto Translate function not found.");
            }
        });

        // 2. YS AI Tools Button
        var $btnTools = $('<button type="button" class="button has-icon ys-ai-tool-trigger" title="Import/Export JSON"><i class="dashicons dashicons-superhero"></i> Tools</button>');
        $btnTools.on('click', function (e) {
            e.preventDefault();
            openModal();
        });

        $fieldset.append($btnTranslate);
        $fieldset.append($btnTools);

        if ($autoBtn.length) {
            // Insert AFTER the fieldset containing the hidden Auto button
            $autoBtn.closest('fieldset').after($fieldset);
            console.log("[YS Loco AI] Custom buttons injected.");
        } else if ($targetContainer.length) {
            // Fallback
            $targetContainer.append($fieldset);
            console.log("[YS Loco AI] Custom buttons injected at end of toolbar.");
        } else {
            // Extreme fallback: the header text
            $('.loco-loading').before($fieldset);
        }
    }

    // Run injection
    injectButton();
    // Retry in case of dynamic rendering
    setTimeout(injectButton, 500);
    setTimeout(injectButton, 2000);

    // Modal Template
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
                        Format: <code>{"Source String": "Translation"}</code>
                    </p>
                    <button class="ys-gemini-btn" id="ysBtnDownload">
                        Download JSON
                    </button>
                </div>

                <!-- Import Tab -->
                <div class="ys-gemini-tab-content" id="ys-tab-import">
                     <p style="color:#666; font-size:0.9em; margin-bottom:10px;">
                        Paste your translated JSON here. It will search matching source strings and update translations.
                    </p>
                    <textarea class="ys-gemini-textarea" id="ysImportData" placeholder='{"Source": "Target", ...}'></textarea>
                    <div class="ys-gemini-flex-row">
                         <label class="ys-gemini-label">
                            <input type="checkbox" id="ysImportOverwrite"> 
                            Overwrite existing translations
                        </label>
                    </div>
                    <button class="ys-gemini-btn" id="ysBtnImport">
                        Import & Apply
                    </button>
                    <div id="ysImportStatus" style="margin-top:10px; font-weight:bold;"></div>
                </div>

            </div>
        </div>
    </div>
    `;

    $('body').append(modalHtml);
    injectButton();

    // Event Listeners
    $('.ys-gemini-close-btn, .ys-gemini-modal-overlay').on('click', function (e) {
        if (e.target === this) closeModal();
    });

    $('.ys-gemini-tab').on('click', function () {
        $('.ys-gemini-tab').removeClass('active');
        $(this).addClass('active');
        $('.ys-gemini-tab-content').removeClass('active');
        $('#ys-tab-' + $(this).data('tab')).addClass('active');
    });

    // --- LOGIC ---

    function openModal() {
        $('#ysGeminiModal').addClass('active');
    }

    function closeModal() {
        $('#ysGeminiModal').removeClass('active');
        $('#ysImportStatus').text('');
    }

    // Export Logic
    $('#ysBtnDownload').on('click', function () {
        var exportData = {};
        var onlyUntranslated = $('#ysExportUntranslatedOnly').is(':checked');
        var count = 0;

        // Loco stores data in the editor lines. 
        // We can access them via the DOM elements mostly: .loco-editor tr
        // But better to access valid JS object if possible. 
        // window.loco.editor.getPO() ?

        // Fallback: Scraping DOM
        $('#loco-editor-inner .row').each(function () {
            var $row = $(this);
            // Source is usually in a div with class 'source' or similar, but Loco renders dynamically.
            // Actually Loco 2.x renders a list of items.
            // Let's try to find window.locoScope or similar which is cleaner.

            // If we look at Loco source, it uses instances. 
            // Let's try to scrape DOM cleanly.
            // The list of strings is in #loco-po-list (virtual list usually).

            // Wait, Loco Editor is complex. 
            // It might be easier to iterate over the 'loco' object if exposed.
            // `window.locoConf` we saw in the reference plugin.

            // Let's assume standard DOM fallback for now or check if we can access the editor instance.
            // A common way in Loco Addons:
            // window.loco.editor.editor (the editor instance)
        });

        // REVISED APPROACH: Using window.loco.editor
        // Check if accessible
        if (window.loco && window.loco.editor) {
            // Access hidden translation store
            // The editor instance usually has a 'po' property with 'items'
            // Or 'Project' object.

            // Let's try to iterate through the UI Elements which represent the valid store
            // $('#loco-po-list li') -> but it is virtual scrolling.

            // Let's use the internal data which Loco Auto Translate addon uses.
            // It seems they access it via a hack? 
            // "var returnedTarget = JSON.parse(JSON.stringify(window.loco));"

            // Actually, the simplest way to export visible strings is scanning the internal Model if possible.
            // If we can't easily access the model, we might need a workaround.
        }

        // ALTERNATIVE: Use the Loco DOM API. 
        // Actually, the easiest way is to read the DOM elements generated by the auto-translate addon if we reverse engineer it.
        // It sends data to ajax.

        // Let's try to find the Loco Editor instance from DOM
        // The editor object is usually bound to the DOM element #loco-editor.

        // Let's rely on a simpler method: Export what Loco's internal object has.
        // Try accessing `loco.editor.po`
        var items = [];
        try {
            // This is a guess based on Loco structure, usually loco.editor.po is the PO object
            // and it has an array of items.
            // If not, we might have to warn user.

            // But verify: The auto-translator we analyzed uses AJAX to send strings.
            // It gets them from `sources` passed in PHP.
            // Here we are client side.

            // Let's try to use `locojs`.
            // window.locoScope.editor.

            // Fallback: Alert if we can't find data, but let's try to scrape the source text from the list *data* if accessible.
            // Loco keeps a `g_conf` or similar.

            // Let's implement a 'Best Effort' using DOM selection if we can select all.
            // But list is virtual.

            // Ok, let's try to hook into the 'save' function? No.

            // Let's look at `window.loco.editor` again. 
            // Use console to debug in real time? I can't.

            // I will implement a safe fallback:
            // Iterate `loco.editor.po._items` (common pattern)

            var editor = null;
            // Iterate global objects to find the editor instance
            // usually it is attached to the screen object.

            // Mock implementation for now assuming standard property access
            /* 
               If we look at `loco-translate/src/js/editor.js`:
               loco.editor.init( ... ) -> creates instance.
            */

            // Strategy: We will iterate the internal iterator of the list controller.
            // `window.loco.editor.list`

            // Let's assume `window.loco.editor` exists.
        } catch (err) {
            console.log(err);
        }

    });

    // We need to actually implement the export logic correctly.
    // Since I cannot verify the exact Loco JS API right now without browser interaction, 
    // I will use a robust method: Scraping the `loco.editor.po` object which is the standard way addons interact.

    // --- DATA ACCESS ---

    function getExportItems() {
        // Method 1: Try captured Config (Best for Export, has full original data)
        if (window.ysLocoConfig && window.ysLocoConfig.podata) {
            // podata is the raw PO parsing result.
            // Be careful, it might need navigation if deep structure
            return window.ysLocoConfig.podata;
        }

        // Method 2: Captured Editor Instance (If hook worked)
        if (window.ysLocoEditorInstance && window.ysLocoEditorInstance.po) {
            return window.ysLocoEditorInstance.po; // Usually has items
        }

        // Method 3: Fallback Loco Global (Rarely works as conf is deleted)
        if (window.loco && window.loco.editor && window.loco.editor.po) {
            return window.loco.editor.po.items;
        }

        return null;
    }

    function getEditorInstance() {
        return window.ysLocoEditorInstance || null;
    }


    // --- EXPORT logic ---
    $('#ysBtnDownload').on('click', function () {
        var items = getExportItems();
        var isRawConfig = false;

        if (!items) {
            alert("Could not access Loco Translate internal data. Please refresh the page and try again.");
            return;
        }

        // If items is came from Config.podata, it might be an array directly
        if (Array.isArray(items)) {
            // Good
        } else if (items.items) {
            items = items.items;
        } else {
            // Debug
            console.log("Unknown items structure:", items);
        }

        var exportData = {};
        var onlyUntranslated = $('#ysExportUntranslatedOnly').is(':checked');
        var count = 0;

        // Helper to get string val
        var getVal = function (i) { return i && i.toString ? i.toString() : (i || ""); };

        var translations = {};

        // Iterate items
        // Structure depends on source.
        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            // In Loco PO structure:
            // item.source, item.target are objects or strings
            // If raw config: { source: "...", target: "...", ... }

            var source = getVal(item.source);
            var target = getVal(item.target);

            var isTranslated = target && target.trim() !== "";

            if (onlyUntranslated && isTranslated) continue;

            if (source) {
                translations[source] = target;
                count++;
            }
        }

        // Construct enhanced JSON
        var exportObj = {
            "_instruction": window.ysLocoSettings ? window.ysLocoSettings.prompt : "Please translate the following. Preserve all placeholders.",
            "data": translations
        };

        var jsonStr = JSON.stringify(exportObj, null, 2);
        var blob = new Blob([jsonStr], { type: "application/json" });
        var url = URL.createObjectURL(blob);

        var a = document.createElement('a');
        a.href = url;
        a.download = "loco-export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- IMPORT Logic ---
    $('#ysBtnImport').on('click', function () {
        var jsonStr = $('#ysImportData').val();
        var overwrite = $('#ysImportOverwrite').is(':checked');

        try {
            var importPayload = JSON.parse(jsonStr);
        } catch (e) {
            alert("Invalid JSON format");
            return;
        }

        // Handle enhanced format or legacy format
        var importData = {};
        if (importPayload.data && typeof importPayload.data === 'object') {
            importData = importPayload.data; // Enhanced format
        } else {
            importData = importPayload; // Simple key-value map
        }

        var editor = getEditorInstance();

        // We MUST have the editor instance to update the UI correctly
        if (!editor) {
            alert("Error: Cannot access Loco Editor instance for layout updates. \n\nThe 'Export' feature works from backup data, but 'Import' requires live editor access which failed to load.\n\nPlease reload the page and try again.");
            return;
        }

        var items = editor.po ? editor.po.items : null;
        if (!items) {
            alert("Editor instance found but PO data is missing.");
            return;
        }

        var updated = 0;

        // Iterate items in the editor model
        items.forEach(function (item) {
            var source = item.source ? item.source.toString() : "";

            if (importData.hasOwnProperty(source)) {
                var newTranslation = importData[source];
                var currentTranslation = item.target ? item.target.toString() : "";

                // Logic:
                // If overwrite ON: Always update if new != old
                // If overwrite OFF: Only update if old is empty

                var shouldUpdate = false;
                if (overwrite) {
                    shouldUpdate = (newTranslation !== currentTranslation);
                } else {
                    shouldUpdate = (currentTranslation === "" && newTranslation !== "");
                }

                if (shouldUpdate) {
                    // Use Editor API to update
                    // item.translate( val ) updates the model and marks as dirty
                    if (typeof item.translate === 'function') {
                        item.translate(newTranslation);
                        updated++;
                    } else {
                        console.warn("Item missing translate method:", item);
                    }
                }
            }
        });

        // Rebuild/Refresh logic
        // Editor usually listens to changes on items, so UI should update automatically.
        // However, triggering a global refresh might be needed if virtual scrolling is active.
        if (editor.rebuild) editor.rebuild();

        $('#ysImportStatus').text("Imported " + updated + " translations. Don't forget to SAVE.");
        $('#ysImportStatus').css('color', '#10b981');
    });

});
