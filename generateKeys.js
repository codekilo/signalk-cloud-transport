const crypto = require('crypto');
module.exports = function(password, salt, encryptLength, HMACLength) {
	var keys = crypto.scryptSync(password, salt, encryptLength + HMACLength);
	return {
		"encryption": keys.slice(0, encryptLength),
		"hmac": keys.slice(encryptLength)
	};
};
