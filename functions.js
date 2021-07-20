const fs = require('fs');

function saveConstants(language, gametypes) {
    var constants = {
    languages: language,
    gametypes: gametypes
      };

var data = JSON.stringify(constants);

fs.writeFile(__dirname + '/constants.json', data, function (err) {
  if (err) {
    console.log(`There was an error saving the data. Error: ${err}`);
  }
});
};

function readConstants(){
    var data = fs.readFileSync('./constants.json');
    try {
      savedData = JSON.parse(data);
      var languages = savedData.languages,
      gametypes = savedData.gametypes,
      versions = savedData.versions;
          return {
        languages,
        gametypes,
        versions
    };
    }
    catch (err) {
      console.log(`There was an error parsing the JSON. Error: ${err}`)
}};

function saveOwnerSettings(api, userLimit, blockedUsers, dst) {
  var constants = {
  api: api,
  userLimit: userLimit,
  blockedUsers: blockedUsers,
  dst: dst
    };

var data = JSON.stringify(constants);

fs.writeFile(__dirname + '/ownerSettings.json', data, function (err) {
if (err) {
  console.log(`There was an error saving the data. Error: ${err}`);
}
});
};

function readOwnerSettings(){
  var data = fs.readFileSync('./ownerSettings.json');
  try {
    savedData = JSON.parse(data);
    var api = savedData.api,
    userLimit = savedData.userLimit,
    blockedUsers = savedData.blockedUsers,
    dst = savedData.dst;
        return {
      api,
      userLimit,
      blockedUsers,
      dst
  };
  }
  catch (err) {
    console.log(`There was an error parsing the JSON. Error: ${err}`)
}};

function pauseToHMS(pauseTime, amount, type) { //old function for a pause command
      var pauseseconds = pauseTime / 1000 
			var pureDays = Math.floor((pauseseconds / (3600 * 24)));
			var pauseDays = pureDays > 0 ? pureDays + (pureDays == 1 ? ' day ' : ' days ') : '';
      var hmspause = new Date(pauseseconds * 1000).toISOString().substr(11, 8)
			return `${pauseDays}${hmspause}, or ${amount} ${type}!`;
};

function unitType(unit) { // old thing for pause command
    if (unit == 'h') {var multiple = 3600000, type = 'hour(s)'
    } else if (unit == 'm') {var multiple = 60000, type = 'minute(s)'
    } else if (unit == 's') {var multiple = 1000, type = 'second(s)'
    } else {var multiple = 1000, type = 'second(s) because you did not specify a valid unit'}
    return {multiple, type};
};

async function checkPermsOfBot(channel, bot, requiredPermissions) {
	let perm = await channel.permissionsFor(bot).toArray()
  let missingPermissions = []
  requiredPermissions.forEach(permission => {if (!perm.includes(permission)) missingPermissions.push(permission)})

  if (missingPermissions == []) return;
  else if (missingPermissions.includes("SEND_MESSAGES")) {throw missingPermissions}
  else return missingPermissions.join(", ")
};

function epochToCleanDate(epoch) {
  let date = epoch.getDate();
  let month = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(epoch);
  let year = epoch.getFullYear();
  return month + " " + date + ", " + year
}

module.exports = { saveConstants, readConstants, pauseToHMS, unitType, saveOwnerSettings, readOwnerSettings, checkPermsOfBot, epochToCleanDate };