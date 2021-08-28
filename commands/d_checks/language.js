const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'language',
  	title: 'Set a new whitelisted language for Hypixel',
	description: 'Set a new whitelisted language for Hypixel. If your account is detected using a different language, the bot will alert you.',
  	usage: `\`/language [set/current] <language>\``,
  	database: true,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 5,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, client, row) {
    let readData = funcImports.readOwnerSettings();
	let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let assets = funcImports.readAssets();
    let languages = assets.languages;

    let languageEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if (interaction.options.getSubcommand() == 'set') {
        if (!languages.includes(interaction.options.getString('language').toUpperCase())) {
            languageEmbed.setTitle(`Invalid Language!`);
            languageEmbed.setColor('#FF5555');
            languageEmbed.setDescription(`The language specified, "${interaction.options.getString('language').toUpperCase()}", is not valid. Please choose one fo the foolowing: ${languages.join(", ")}!`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Language`);
            return await interaction.reply({ embeds: [languageEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        checkLanguage();
    } else currentLanguage();

    async function checkLanguage() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
          
            if (interaction.options.getString('language').toUpperCase() === response.language) {
                languageEmbed.setTitle(`Already Set!`);
                languageEmbed.setColor('#FF5555');
                languageEmbed.setDescription(`The language specified, "${interaction.options.getString('language').toUpperCase()}", was already set as your whitelisted language.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Already Set`);
                return await interaction.reply({ embeds: [languageEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
          
            writeNewLanguage();
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    };
          
    async function writeNewLanguage() {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET language = ? WHERE discordID = ?`, interaction.options.getString('language').toUpperCase());
            languageEmbed.setTitle(`Language Updated!`);
            languageEmbed.setColor('#7289DA');
            languageEmbed.setDescription(`${interaction.options.getString('language').toUpperCase()} is now set as your whitelisted language!`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Language Set`);
            return await interaction.reply({ embeds: [languageEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    };
          
    async function currentLanguage() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
      
            languageEmbed.setTitle(`Your Language!`);
            languageEmbed.setColor('#7289DA');
            languageEmbed.setDescription(`${response.language} is currently set as your whitelisted language!`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Returned Current Language`);
            return await interaction.reply({ embeds: [languageEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    };
  },
};