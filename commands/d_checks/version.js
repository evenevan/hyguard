/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'version',
  	title: 'Set whitelisted version(s) for Hypixel',
	description: 'Set whitelisted version(s) for Hypixel. If your account is detected using a non=whitelisted version, the bot will alert you.',
  	usage: `\`/version [add/remove/current] <version>\``,
  	database: true,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 5,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, row) {
    let readData = funcImports.readOwnerSettings();
	let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let assets = funcImports.readAssets();
    let versions = assets.versions;

    let versionEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if (interaction.options.getSubcommand() === 'add' || interaction.options.getSubcommand() === 'remove') {
        if (!versions.includes(interaction.options.getString('version').toUpperCase())) {
            versionEmbed.setTitle(`Invalid Version!`);
            versionEmbed.setColor('#FF5555');
            versionEmbed.setDescription(`The version specified, "${interaction.options.getString('version').toUpperCase()}", is not valid. Please choose one of the following: ${versions.join(", ")}!`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Version`);
            return await interaction.reply({ embeds: [versionEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        checkVersion();
    } else currentVersion();

    async function checkVersion() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});

            let userVersion = response.version.split(" ")

            if (interaction.options.getSubcommand() == 'add') {
                if (userVersion.includes(interaction.options.getString('version'))) {
                    versionEmbed.setTitle(`Already Added!`);
                    versionEmbed.setColor('#FF5555');
                    versionEmbed.setDescription(`${interaction.options.getString('version')} was already added to your version whitelist!`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Already Added`);
                    return await interaction.reply({ embeds: [versionEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                userVersion.push(interaction.options.getString('version'))
            } else {
                if (!userVersion.includes(interaction.options.getString('version'))) {
                    versionEmbed.setTitle(`Not Added!`);
                    versionEmbed.setColor('#FF5555');
                    versionEmbed.setDescription(`${interaction.options.getString('version')} has not been added to your version whitelist yet! You cannot remove a version that you have not added!`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Not Added`);
                    return await interaction.reply({ embeds: [versionEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                if (userVersion.length === 1) {
                    versionEmbed.setTitle(`Cannot Remove!`);
                    versionEmbed.setColor('#FF5555');
                    versionEmbed.setDescription(`You must have atleast 1 version added! If you remove ${interaction.options.getString('version')}, you would have 0!`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Cannot Remove`);
                    return await interaction.reply({ embeds: [versionEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                let findIndex = userVersion.indexOf(interaction.options.getString('version'));
                userVersion.splice(findIndex, 1);
            }
          
            writeVersion(userVersion);
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function writeVersion(userVersion) {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET version = ? WHERE discordID = ?`, userVersion.join(" "));
            versionEmbed.setTitle(`Version(s) Whitelist Updated!`);
            versionEmbed.setColor('#7289DA');
            versionEmbed.setDescription(`${interaction.options.getString('version')} was ${interaction.options.getSubcommand() == 'add' ? `added to` : `removed from`} your whitelisted version(s)! Your whitelisted version(s) are ${userVersion.join(", ")}.`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Version Whitelist `);
            return await interaction.reply({ embeds: [versionEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function currentVersion() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
      
            versionEmbed.setTitle(`Your Whitelisted Version(s)!`);
            versionEmbed.setColor('#7289DA');
            versionEmbed.setDescription(`Your current whitelisted version(s) are ${response.version.split(" ").join(", ")}!`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Returned Current Whitelisted Version(s)`);
            return await interaction.reply({ embeds: [versionEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
  },
};