const fs = require('fs');
const database = require('./database.js');
const events = require('./events.js');

function readAssets(){
    let data = fs.readFileSync('./assets.json');
    try {
      let savedData = JSON.parse(data);
      let languages = savedData.languages,
      gametypes = savedData.gametypes,
      versions = savedData.versions,
      setupTZ = savedData.setupTZ,
      setupLogout = savedData.setupLogout,
      setupLogin = savedData.setupLogin,
      commandMenu = savedData.commandMenu,
      globalCommands = savedData.globalCommands,
      localCommands = savedData.localCommands;
          return {
        languages,
        gametypes,
        versions,
        setupTZ,
        setupLogout,
        setupLogin,
        commandMenu,
        globalCommands,
        localCommands
    };
    }
    catch (err) {
      console.log(`There was an error parsing the JSON. Error: ${err}`)
}}

function saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode) {
  let constants = {
  api: api,
  userLimit: userLimit,
  blockedUsers: blockedUsers,
  dst: dst,
  devMode: devMode,
    };

let data = JSON.stringify(constants);

// eslint-disable-next-line no-undef
fs.writeFile(__dirname + '/ownerSettings.json', data, function (err) {
if (err) {
  console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | There was an error saving the data. Error: ${err}`);
}
});
}

function readOwnerSettings(){
  let data = fs.readFileSync('./ownerSettings.json');
  try {
    let savedData = JSON.parse(data);
    let api = savedData.api,
    userLimit = savedData.userLimit,
    blockedUsers = savedData.blockedUsers,
    dst = savedData.dst,
    devMode = savedData.devMode;
        return {
      api,
      userLimit,
      blockedUsers,
      dst,
      devMode
  };
  }
  catch (err) {
    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | There was an error parsing the JSON. Error: ${err}`)
}}

function deleteUserData(dbUserData, client, userNumber, deletionReason) { //Used by the log function to remove old profiles
  requestGuild();
  async function requestGuild() {
      await deleteData();
      let guild = await client.guilds.cache.get(`${dbUserData.guildID}`);
      if (guild) await deleteLogs(guild) + await deleteAlerts(guild) + await deleteCategory(guild);
      return console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${dbUserData.discordID} | ${dbUserData.discordUsername} was deleted via the log delete function for the reason "${deletionReason}".`);
  }

  async function deleteLogs(guild) {
    let logs = await guild.channels.cache.get(dbUserData.logID);
    if (!logs) return;
    let logPermissions = await logs.permissionsFor(logs.guild.me).toArray();
      if (logs && logPermissions.includes("MANAGE_CHANNELS")) await logs.delete(deletionReason).catch((err) => {return events.logErrorMsg(client, userNumber, err, 'Failed to delete log channel', true, true, false)});
  }

  async function deleteAlerts(guild) {
    let alerts = await guild.channels.cache.get(dbUserData.alertID);
    if (!alerts) return;
    let alertPermissions = await alerts.permissionsFor(alerts.guild.me).toArray();
    if (alerts && alertPermissions.includes("MANAGE_CHANNELS")) await alerts.delete(deletionReason).catch((err) => {return events.logErrorMsg(client, userNumber, err, 'Failed to delete alert channel', true, true, false)});
  }

  async function deleteCategory(guild) {
      let category = await guild.channels.cache.find(c => c.name == "log" && c.type == "GUILD_CATEGORY");
      if (!category) return;
      let channelPermissions = await category.permissionsFor(category.guild.me).toArray();
      if (category.children.size == 0 && channelPermissions.includes("MANAGE_CHANNELS")) await category.delete('Empty category channel').catch((err) => {return events.logErrorMsg(client, userNumber, err, 'Failed to delete category channel', true, true, false)});
  }

  async function deleteData() {
      await database.deleteData(dbUserData.discordID, `DELETE FROM users WHERE discordID=(?)`);
  }
}

async function checkPermsOfBot(channel, requiredChannelPermissions, requiredGuildPermissions, bot) { //Prevents crashing and makes it cleaner
    let channelPermissions = await channel.permissionsFor(bot).toArray()
    let missingChannelPermissions = []
    requiredChannelPermissions.forEach(permission => {if (!channelPermissions.includes(permission)) missingChannelPermissions.push(permission)})

    let guildPermissions = await bot.permissions.toArray();
    let missingGuildPermissions = []
    requiredGuildPermissions.forEach(permission => {if (!guildPermissions.includes(permission)) missingGuildPermissions.push(permission)})

    if (missingChannelPermissions.length === 0 && missingGuildPermissions.length === 0) return;

    return [missingChannelPermissions, missingGuildPermissions];
}

async function checkPermsOfUser(interaction, userRequiredPermissions) { //Prevents crashing and makes it cleaner
  let userPermissions = await interaction.member.permissions.toArray();
  let missingUserPermissions = []
  userRequiredPermissions.forEach(permission => {if (!userPermissions.includes(permission)) missingUserPermissions.push(permission)})

  if (missingUserPermissions.length === 0) return;

  return [missingUserPermissions];
}

async function checkPermsOfBotLogFunction(channel, bot) {
    let channelPermissions = await channel.permissionsFor(bot).toArray()
    let missingLogPermissions = []
    let requiredLogPermissions = ["VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS"]
    requiredLogPermissions.forEach(permission => {if (!channelPermissions.includes(permission)) missingLogPermissions.push(permission)})

    if (missingLogPermissions.length == 0) return;
    else if (missingLogPermissions.includes('SEND_MESSAGES')) {
      let missingPermError = new Error([missingLogPermissions]);
      missingPermError.name = "MissingPermission";
      throw missingPermError;
    }
    else return [missingLogPermissions];
}

function epochToCleanDate(epoch) {
  let date = epoch.getDate();
  let month = new Intl.DateTimeFormat('en-US', {month: 'short'}).format(epoch);
  let year = epoch.getFullYear();
  return month + " " + date + ", " + year
}

function decimalsToUTC(decimal) {
  if (/\./.test(decimal)) {
      let decimalArray = decimal.toString().split(".")
      let hour = decimalArray[0] * 1
      let minutes = Math.round((`0.${(decimalArray[1])}`) * 60)
      if (hour < 0) return hour + ":" + (minutes * 1).toFixed(2).slice(0, -3)
      return "+" + hour + ":" + (minutes * 1).toFixed(2).slice(0, -3)
  } else {
      if (decimal < 0) return decimal
      return "±" + decimal
  }
}

module.exports = { readAssets, saveOwnerSettings, readOwnerSettings, deleteUserData, checkPermsOfBot, checkPermsOfUser, checkPermsOfBotLogFunction, epochToCleanDate, decimalsToUTC };