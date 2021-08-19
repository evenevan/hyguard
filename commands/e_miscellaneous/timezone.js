const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'timezone',
  	title: 'Set your new timezone for the bot\'s time services',
	description: 'Update your current timezone/UTC offset. This command will give you the option to set your UTC offfset and also if you use Daylight Savings.',
  	usage: `\`/timezone [set/current]\``,
  	database: true,
  	guildOnly: true,
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

    let timezoneEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    let noResponseEmbed = new MessageEmbed()
        .setTimestamp()
        .setColor('#FF5555')
        .setTitle(`No Response!`)
        .setDescription('Setup has been canceled as you did not respond.')
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if (interaction.options.getSubcommand() == 'set') inputTimezone();
    else currentTimezone();

    async function inputTimezone() {
        let setupTZ = assets.setupTZ; //Move the text below to a JSON
        let tzMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('tzselect')
					.setPlaceholder('Select a Timezone')
					.addOptions(setupTZ),
			);
            timezoneEmbed.setColor('#7289DA');
            timezoneEmbed.setTitle(`Timezone!`);
            timezoneEmbed.setDescription('Please select your timezone in the drop down below or select \`Other\` if your timezone is not listed.');
        let tzSelectMenu = await interaction.reply({ embeds: [timezoneEmbed], components: [tzMenu] }).catch((err) => {return events.errorMsg(interaction, err)});

        let filter = i => {
            i.deferUpdate();
            return i.customId === 'tzselect' && i.user.id === interaction.user.id;
        };

        function UTCOffsetToDecimals(utc) {
            if (!utc.includes(":")) {
              return `${utc * 1}`;
            } else if (utc.slice(0, 1) !== "+" && utc.slice(0, 1) !== "-") {
              let minutesToDecimal = (utc.slice(-2) / 60);
              let hours = utc.slice(0, -3) * 1;
              let result = (hours + minutesToDecimal);
              return result;
            }
            let minutesToDecimal = (utc.slice(-2) / 60);
            let hours = utc.slice(1, -3) * 1;
            let result = `${utc.slice(0, 1) == '+' ? `${hours + minutesToDecimal}` : `${utc.slice(0, 1) + (hours + minutesToDecimal)}`}`;
            return result;
          };

        let customTZfilter = i => i.user.id === interaction.user.id;
        
        let awaitedReply = await interaction.fetchReply();
        awaitedReply.awaitMessageComponent({ filter, componentType: 'SELECT_MENU', time: 300000 }) //create a collector on the channel!
            .then(async selectInteraction => {
                if (selectInteraction.values[0] !== 'custom') {
                    return daylightSavings(selectInteraction.values[0] * 1);
                }
                timezoneEmbed.setColor('#7289DA');
                timezoneEmbed.setTitle(`Custom UTC Offset!`);
                timezoneEmbed.setDescription('Please type your UTC offset in the format \`-/+0\` or \`-/+0:00\`, eg: \`-7\`, \`+12:45\`. You have 5 minutes, so please take your time. You have 5 chances before setup automatically cancels. List of common UTC Offsets & their locations: [link](https://en.wikipedia.org/wiki/List_of_UTC_time_offsets)');
                await interaction.editReply({ embeds: [timezoneEmbed], components: [], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)})
	                .then(() => {
		                let collector = interaction.channel.createMessageCollector({ customTZfilter, max: 5, time: 300000 })
                        let responses = []
                            collector.on('collect', async collected => {
                                responses.push(collected.content.toLowerCase())
                                if (!/^([+-](?:2[0-3]|1[0-9]|[0-9]|0[0-9])(:?[0-5]\d)?)$/g.test(collected.content.toLowerCase()) && responses.length < 5) {
                                    timezoneEmbed.setColor('#FF5555');
                                    timezoneEmbed.setTitle(`Invalid Format!`);
                                    timezoneEmbed.setDescription(`Please try again. You have ${5 - responses.length} chances left. Enter your UTC offset in the format \`-/+0\` or \`-/+0:00\`, eg: \`-7\`, \`+12:45\`. You have 5 minutes, so please take your time. You have 5 total chances before setup automatically cancels. List of UTC Offsets: [link](https://en.wikipedia.org/wiki/List_of_UTC_time_offsets)`);
                                    await interaction.editReply({ embeds: [timezoneEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                                } else {
                                    collector.stop()
                                }
                            })
                            collector.on('end', async collected => {
                                if (responses.length === 0) return await interaction.editReply({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                                if (/^([+-](?:2[0-3]|1[0-9]|[0-9]|0[0-9])(:?[0-5]\d)?)$/g.test(collected.last().content.toLowerCase())) {
                                    return daylightSavings(UTCOffsetToDecimals(collected.last().content.toLowerCase()));
                                }
                                timezoneEmbed.setColor('#FF5555');
                                timezoneEmbed.setTitle(`Invalid Format!`);
                                timezoneEmbed.setDescription('Setup has been canceled as you either did not provide an offset.');
				                return await interaction.editReply({ embeds: [timezoneEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                            });
	                });
            })
            .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedtzSelectMenu = new MessageActionRow()
			            .addComponents(
				            new MessageSelectMenu()
					            .setCustomId('updatedtzSelectMenu')
					            .setPlaceholder('Select a Timezone')
                                .setDisabled(true)
                                .addOptions([{label: 'wtf', description: 'lmao hi', value: 'notavalue'}]),
			            );
                    await interaction.followUp({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await interaction.editReply({ embeds: [timezoneEmbed], components: [updatedtzSelectMenu] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }

    async function daylightSavings(timezone) {
        timezoneEmbed.setColor('#7289DA');
        timezoneEmbed.setTitle(`Daylight Savings!`);
        timezoneEmbed.setDescription(`Timezone has been verified. Do you use DST (Daylight Saving Time)?${dst === true ? ` If you do, your current time and date should be ${new Date(Date.now() + (timezone * 1 + 1) * 3600000).toLocaleTimeString('en-IN', { hour12: true })}, ${funcImports.epochToCleanDate(new Date(Date.now() + (timezone * 1 + 1) * 3600000))}.` : ``}`);
        let dstButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('true')
					.setLabel('Yes')
					.setStyle('SUCCESS'),
                new MessageButton()
					.setCustomId('false')
					.setLabel('No')
					.setStyle('DANGER'),
			);
        let dstButtonMsg = await interaction.editReply({ embeds: [timezoneEmbed], components: [dstButton] }).catch((err) => {return events.errorMsg(interaction, err)});
        let filter = i => {
            i.deferUpdate();
            return (i.customId === 'true' || i.customId === 'false') && i.user.id === interaction.user.id;
        };
        let awaitedReply = await interaction.fetchReply();
        awaitedReply.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 120000 })
	        .then(async i => {
                if (i.customId === 'true') return writeNewTimezone(timezone, true);
                else return writeNewTimezone(timezone, false);
            })
	        .catch(async err => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedDSTButton = new MessageActionRow()
			        .addComponents(
				        new MessageButton()
					        .setCustomId('true')
					        .setLabel('Yes')
					        .setStyle('SUCCESS')
                            .setDisabled(true),
                        new MessageButton()
					        .setCustomId('false')
					        .setLabel('No')
					        .setStyle('DANGER')
                            .setDisabled(true),
			        );
                    await interaction.followUp({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await interaction.editReply({ embeds: [timezoneEmbed], components: [updatedDSTButton] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }
          
    async function writeNewTimezone(timezone, dstBoolean) {
        try {
          await database.changeData(interaction.user.id, `UPDATE users SET timezone = ? WHERE discordID = ?`, timezone);
          await database.changeData(interaction.user.id, `UPDATE users SET daylightSavings = ? WHERE discordID = ?`, dstBoolean);
          timezoneEmbed.setColor('#7289DA');
          timezoneEmbed.setTitle(`Timezone Updated!`);
          timezoneEmbed.setDescription(`Timezone updated! Your timezone is set to ${funcImports.decimalsToUTC(timezone)}, and you ${dstBoolean === false ? `do not ` : ``}use Daylight Savings. Your current local time should be ${new Date(Date.now() + (dstBoolean == true && dst == true ? timezone * 1 + 1: timezone) * 3600000).toLocaleTimeString('en-IN', { hour12: true, timeStyle: 'short' })}.`);
          return await interaction.editReply({ embeds: [timezoneEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            events.errorMsg(interaction, err);
        }
    };

    async function currentTimezone() {
        try {
          let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`);

          let dstBoolean = response.daylightSavings;
          let timezone = response.timezone * 1;
  
          timezoneEmbed.setColor('#7289DA');
          timezoneEmbed.setTitle(`Your Timezone!`);
          timezoneEmbed.setDescription(`Your timezone is set to ${funcImports.decimalsToUTC(timezone)}, and you ${dstBoolean === false ? `do not ` : ``}use Daylight Savings. Your current local time should be ${new Date(Date.now() + (dstBoolean == true && dst == true ? timezone * 1 + 1: timezone) * 3600000).toLocaleTimeString('en-IN', { hour12: true, timeStyle: 'short' })}.`);
          return await interaction.reply({ embeds: [timezoneEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
      };
  },
};