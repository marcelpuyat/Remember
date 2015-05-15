// Struct to hold all fields needed for a popup notif
function Note(provider, id, title, url) {
	this.provider = provider;
	// Universal id is provider_id. (i.e. pocket_121, evernote_1251, etc.)
	this.id = provider + "_" + id;
	this.title = title;
	this.url = url;
}