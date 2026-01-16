/**
 * YS Loco AI - Interceptor
 * Tries to capture Loco Translate internal objects before they are hidden.
 */
(function () {
    // Capture Config immediately (before editor.js deletes it)
    if (window.loco && window.loco.conf) {
        window.ysLocoConfig = JSON.parse(JSON.stringify(window.loco.conf));
        console.log("[YS Loco AI] Config captured.");
    }

    // Attempt to hook into editor initialization to capture the instance
    // We poll briefly in case loco.po.ed is defined shortly after this script runs
    var attempts = 0;
    var maxAttempts = 50; // 500ms

    var hookInterval = setInterval(function () {
        attempts++;
        if (window.loco && window.loco.po && window.loco.po.ed && window.loco.po.ed.init) {
            clearInterval(hookInterval);

            if (window.loco.po.ed.init._ysHooked) return; // Already hooked

            var originalInit = window.loco.po.ed.init;

            window.loco.po.ed.init = function () {
                var instance = originalInit.apply(this, arguments);
                window.ysLocoEditorInstance = instance;
                console.log("[YS Loco AI] Editor instance captured via hook!");
                return instance;
            };
            window.loco.po.ed.init._ysHooked = true;
            console.log("[YS Loco AI] Hook attached to loco.po.ed.init");
        }

        if (attempts >= maxAttempts) {
            clearInterval(hookInterval);
        }
    }, 10);

})();
