/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-inner-declarations */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'advanced',
  	title: 'Update your advanced settings',
	description: 'Update your advanced settings. These options are somewhat random, but are usually options that a normal user will not have to use.',
  	usage: `\`/advanced [toggle/current] <setting>\``,
  	database: true,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 5,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, row) { //Add new types into choices
    let readData = funcImports.readOwnerSettings();
	let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let advancedEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    let validAdvancedSettings = ["LOGINTIME","DM_OPT_OUT"]

    if (interaction.options.getSubcommand() === 'toggle') {
        if (!validAdvancedSettings.includes(interaction.options.getString('setting').toUpperCase())) {
            advancedEmbed.setTitle(`Invalid Setting!`);
            advancedEmbed.setColor('#FF5555');
            advancedEmbed.setDescription(`The setting specified, "${interaction.options.getString('setting').toUpperCase()}", is not valid. Please contact the owner of the bot if you believe this is an error.`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Advanced Setting`);
            return await interaction.reply({ embeds: [advancedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        checkAdvanced();
    } else currentVersion();

    async function checkAdvanced() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});

            let userAdvanced = response.advanced ? response.advanced.split(" ") : []

            switch (interaction.options.getString('setting').toUpperCase()) {
                case 'LOGINTIME':
                  logintime();
                  break;
                case 'DM_OPT_OUT':
                  dmOptOut();
                  break;
            }
    
            function logintime() {
              if (userAdvanced.includes("LOGINTIME")) {
                let findAndRemove = userAdvanced.indexOf(interaction.options.getString('setting').toUpperCase());
                userAdvanced.splice(findAndRemove, 1);
                advancedEmbed.setDescription(`The advanced setting, "${interaction.options.getString('setting').toUpperCase()}", was toggled! You will no longer recieve continious pings on unusual login times.`)
              } else {
                userAdvanced.push("LOGINTIME");
                advancedEmbed.setDescription(`The advanced setting, "${interaction.options.getString('setting').toUpperCase()}", was toggled! You will recieve continious pings on unusual login times.`);
              }
            }
    
            function dmOptOut() {
              if (userAdvanced.includes("DM_OPT_OUT")) {
                let findAndRemove = userAdvanced.indexOf(interaction.options.getString('setting').toUpperCase());
                userAdvanced.splice(findAndRemove, 1);
                advancedEmbed.setDescription(`The advanced setting, "${interaction.options.getString('setting').toUpperCase()}", was toggled! You will will recieve notifications on this service. This includes subjects like this service shutting down, downtimes, or etc.`);
              } else {
                userAdvanced.push("DM_OPT_OUT");
                advancedEmbed.setDescription(`The advanced setting, "${interaction.options.getString('setting').toUpperCase()}", was toggled! You will no longer recieve any sort of notifications on this service. This includes subjects like this service shutting down, downtimes, or etc.`);
              }
            }
          
            writeAdvanced(userAdvanced);
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function writeAdvanced(userAdvanced) {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET advanced = ? WHERE discordID = ?`, userAdvanced.join(" ").toUpperCase());
            
            advancedEmbed.setColor(`#7289DA`);
            advancedEmbed.setTitle(`Advanced Setting Toggled`);
            for (let i = 0; i < validAdvancedSettings.length; i++) {
                if (userAdvanced.includes(validAdvancedSettings[i])) {
                  advancedEmbed.addField(`${validAdvancedSettings[i]}`, `:green_square: - On`);
                } else {
                  advancedEmbed.addField(`${validAdvancedSettings[i]}`, `:red_square: - Off`);
                }
            }

            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Advanced`);
            return await interaction.reply({ embeds: [advancedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function currentVersion() { //wip
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});

            let userAdvanced = response.advanced ? response.advanced.split(" ") : []
      
            advancedEmbed.setTitle(`Your Advanced Settings`);
            advancedEmbed.setColor('#7289DA');

            for (let i = 0; i < validAdvancedSettings.length; i++) {
                if (userAdvanced.includes(validAdvancedSettings[i])) {
                  advancedEmbed.addField(`${validAdvancedSettings[i]}`, `:green_square: - On`);
                } else {
                  advancedEmbed.addField(`${validAdvancedSettings[i]}`, `:red_square: - Off`);
                }
            }
            
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Returned Current Advanced Settings`);
            return await interaction.reply({ embeds: [advancedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
  },
};