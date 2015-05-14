function PopupHandler() {

	this.popupRememberNote = function(note, icon) {
		chrome.notifications.create(null, {
			type: 'basic',
			title: 'Remember?',
			message: note.title,
			iconUrl: icon,
			buttons: [
				{
					'title': 'View page'
				}
			]
		}, function(notifId) {
			chrome.notifications.onButtonClicked.addListener(function(clickedId) {
				if (clickedId == notifId)
					openInNewTab(note.url); // TODO: Figure out how to delete this listener... bec it will live forever if we dont delete
			});
		});
	};

	/* Popup to notify user about authentication of provider 
	 * @param isAuth true if action is to authenticate, false if is to delete
	 */
	this.popupNotifyAuth = function(isAuth, wasSuccess, providerName) {
		var readableName = _providers[providerName].readableName;
		var message;
		if (isAuth && wasSuccess) message = "Will now include "+readableName+" content tagged as \"remember\"";
		else if (isAuth && !wasSuccess) message = "Sorry, but we were not able to authenticate with " +readableName;
		else if (!isAuth && wasSuccess) message = "Will no longer get content from " +readableName;
		else if (!isAuth && !wasSuccess) message = "Unexpected error deauthenticating with "+readableName+". Contact us for support.";
		chrome.notifications.create(null, {
			type: 'basic',
			title: (isAuth ? "Authentication " : "Deauthentication ") + (wasSuccess ? "successful" : "failed"),
			message: message,
			iconUrl: _providers[providerName].icon
		});
	};
}

var _popupHandler = new PopupHandler();