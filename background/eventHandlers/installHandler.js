/* In charge of UI flow for on install/update events.
 * See https://developer.chrome.com/extensions/runtime#event-onInstalled for more details
 */

(function() {
	chrome.runtime.onInstalled.addListener(function(details) {
		/* For install reason types: 
		 * https://developer.chrome.com/extensions/runtime#type-OnInstalledReason
		 */
		switch (details.reason) {
			case "install":
				if (!_config.testMode) {
					console.log("INSTALLED!");
				}
				break;
			case "update":
				break;
			case "chrome_update":
			case "shared_module_update":
			default:
				return;
		}
	});
})();