function invert(obj) {

  var new_obj = {};

  for (var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      new_obj[obj[prop]] = prop;
    }
  }

  return new_obj;
};

function openInNewTab(url) {
  var win = window.open(url, '_blank');
  win.focus();
}

function diffInHours(dateA, dateB) {
	return Math.floor(Math.abs(dateA - dateB) / (60*60*1000));
}

function ajaxPost(url, data, contentType, isAsync, successCb, errorCb) {
  try {
  	var xhr = new XMLHttpRequest();
  	xhr.open('POST', url, isAsync);
  	xhr.setRequestHeader('content-type', contentType);
  	xhr.setRequestHeader('X-Accept','application/json');
  	if (successCb) {
  		// Only set onreadystate function if given a successCb
  		xhr.onreadystatechange = function() {
  			if (xhr.readyState == 4 && xhr.status == 200) {
  				successCb(xhr.responseText);
  			}
  		};
  	}
  	if (contentType.indexOf("x-www-form-urlencoded") !== -1) {
  		var dataString = '';
  		var delimiter = '';
  		var key;
  		for (key in data) {
  			dataString += delimiter;
  			dataString += key + '=' + data[key];
  			delimiter = '&';
  		}
  		xhr.send(dataString);
  	} else if (contentType.indexOf('json') !== -1) {
  		xhr.send(JSON.stringify(data));
  	}
  } catch (ex) {
    errorCb(ex);
  }
}