const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'offlinetime',
  	title: 'Update your offline time for Hypixel',
	description: 'Update your offline time for Hypixel. If your account is detected logging in during this time, the bot will alert you.',
  	usage: `\`/offlinetime [set/current]\``,
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

    let offlineEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
    
    let noResponseEmbed = new MessageEmbed()
        .setTimestamp()
        .setColor('#FF5555')
        .setTitle(`No Response!`)
        .setDescription('Setup has been canceled as you did not respond.')
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if (interaction.options.getSubcommand() == 'set') logoutTime();
    else currentOffline();

    async function logoutTime() {
        let setupLogout = assets.setupLogout
        let logoutMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('logoutselect')
					.setPlaceholder('Select a Logout Time')
					.addOptions(setupLogout),
			);
            offlineEmbed.setColor('#7289DA');
            offlineEmbed.setTitle(`Logout Time!`);
            offlineEmbed.setDescription('Please select when you usually **get off** Hypixel in the drop down below or select \`Advanced\` if you want to select minutes as well. Logins after this time will send an alert, so you may want to add an hour or two.');
        await interaction.reply({ embeds: [offlineEmbed], components: [logoutMenu] }).catch((err) => {return events.errorMsg(interaction, err)});

        function TimeToDecimals(time) {
			let minutesToDecimal = (time.slice(-2) / 60);
			let hourToDecimal = time.slice(0, -3) * 1;
			let result = (hourToDecimal + minutesToDecimal);
			return result;
		};

        let logoutMenuFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id && i.customId === 'logoutselect';
        };
        
        let awaitedReply = await interaction.fetchReply();
        awaitedReply.awaitMessageComponent({ filter: logoutMenuFilter, componentType: 'SELECT_MENU', time: 300000 })
            .then(async selectInteraction => {
                if (selectInteraction.values[0] !== 'custom') {
                    return loginTime(selectInteraction.values[0] * 1);
                }
                offlineEmbed.setColor('#7289DA');
                offlineEmbed.setTitle(`Custom Logout Time!`);
                offlineEmbed.setDescription('Please type when you usually **get off** of Hypixel in the 24 hour format, eg: \`23:45\`, \`00:30\`. You have 5 chances before setup automatically cancels. Logins after this time will send an alert.');
                await interaction.editReply({ embeds: [offlineEmbed], components: [], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)})
	                .then((customLogoutMsg) => {
                        let logoutMsgFilter = m => m.author.id === interaction.user.id;
		                let collector = interaction.channel.createMessageCollector({ filter: logoutMsgFilter, max: 5, time: 300000 })
                        let responses = []
                            collector.on('collect', async collected => {
                                responses.push(collected.content.toLowerCase())
                                if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.content.toLowerCase()) && responses.length < 5) {
                                    offlineEmbed.setColor('#FF5555');
                                    offlineEmbed.setTitle(`Invalid Format!`);
                                    offlineEmbed.setDescription(`Please try again. You have ${5 - responses.length} chances left. Enter your login time in the 24 hour format, eg: \`23:45\`, \`00:30\`.`);
                                    await interaction.editReply({ embeds: [offlineEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
                                } else {
                                    collector.stop()
                                }
                            })
                            collector.on('end', async collected => {
                                if (responses.length === 0) return await interaction.followUp({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                                if (/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.last().content.toLowerCase())) {
                                    return loginTime(TimeToDecimals(collected.last().content.toLowerCase()));
                                }
                                offlineEmbed.setColor('#FF5555');
                                offlineEmbed.setTitle(`Invalid Format!`);
                                offlineEmbed.setDescription('Setup has been canceled as you either did not provide a logout time.');
                                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Step Failed`);
				                return await interaction.editReply({ embeds: [offlineEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
                            });
	                });
            })
            .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedLogoutSelectMenu = new MessageActionRow()
			            .addComponents(
				            new MessageSelectMenu()
					            .setCustomId('updatedLogoutSelectMenu')
					            .setPlaceholder('Select a Logout Time')
                                .setDisabled(true)
                                .addOptions([{label: 'wtf', description: 'lmao hi', value: 'notavalue'}]),
			            );
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Step Failed`);
                    await interaction.followUp({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await interaction.editReply({ embeds: [offlineEmbed], components: [updatedLogoutSelectMenu] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }

    async function loginTime(playerLogoutTime) {
        let setupLogin = assets.setupLogin
        let loginMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('loginselect')
					.setPlaceholder('Select a Login Time')
					.addOptions(setupLogin),
			);
            offlineEmbed.setColor('#7289DA');
            offlineEmbed.setTitle(`Login Time!`);
            offlineEmbed.setDescription('Please select when you usually **get on** Hypixel in the drop down below or select \`Advanced\` if you want to select minutes as well. Logins after this time **will not** send an alert.');
        let loginSelectMenu = await interaction.editReply({ embeds: [offlineEmbed], components: [loginMenu] }).catch((err) => {return events.errorMsg(interaction, err)});

        function TimeToDecimals(time) {
			let minutesToDecimal = (time.slice(-2) / 60);
			let hourToDecimal = time.slice(0, -3) * 1;
			let result = (hourToDecimal + minutesToDecimal);
			return result;
		};

        let loginMenuFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id && i.customId === 'loginselect';
        };

        let awaitedReply = await interaction.fetchReply()
        awaitedReply.awaitMessageComponent({ filter: loginMenuFilter, componentType: 'SELECT_MENU', time: 300000 })
            .then(async selectInteraction => {
                if (selectInteraction.values[0] !== 'custom') {
                    return writeOffline(playerLogoutTime, selectInteraction.values[0] * 1);
                }
                offlineEmbed.setColor('#7289DA');
                offlineEmbed.setTitle(`Custom Login Time!`);
                offlineEmbed.setDescription('Please type when you usually **get on** of Hypixel in the 24 hour format, eg: \`9:15\`, \`11:00\`. You have 5 chances before setup automatically cancels. Logins after this time won\'t be alerts.');
                interaction.editReply({ embeds: [offlineEmbed], components: [], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)})
	                .then((customLoginMsg) => {
                        let loginMsgFilter = m => m.author.id === interaction.user.id;
		                let collector = interaction.channel.createMessageCollector({ filter: loginMsgFilter, max: 5, time: 300000 })
                        let responses = []
                            collector.on('collect', async collected => {
                                responses.push(collected.content.toLowerCase())
                                if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.content.toLowerCase()) && responses.length < 5) {
                                    offlineEmbed.setColor('#FF5555');
                                    offlineEmbed.setTitle(`Invalid Format!`);
                                    offlineEmbed.setDescription(`Please try again. You have ${5 - responses.length} chances left. Enter your login time in the 24 hour format, eg: \`23:45\`, \`00:30\`.`);
                                    await interaction.editReply({ embeds: [offlineEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
                                } else {
                                    collector.stop()
                                }
                            })
                            collector.on('end', async collected => {
                                if (responses.length === 0) return await interaction.editReply({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                                if (/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.last().content.toLowerCase())) {
                                    return writeOffline(playerLogoutTime, TimeToDecimals(collected.last().content.toLowerCase()));
                                }
                                offlineEmbed.setColor('#FF5555');
                                offlineEmbed.setTitle(`Invalid Format!`);
                                offlineEmbed.setDescription('Setup has been canceled as you either did not provide a login time.');
                                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collecotr Step Failed`);
				                return await interaction.editReply({ embeds: [offlineEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
                            });
	                });
            })
            .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedLoginSelectMenu = new MessageActionRow()
			            .addComponents(
				            new MessageSelectMenu()
					            .setCustomId('updatedLoginSelectMenu')
					            .setPlaceholder('Select a Login Time')
                                .setDisabled(true)
                                .addOptions([{label: 'wtf', description: 'lmao hi', value: 'notavalue'}]),
			            );
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Step Failed`);
                    await interaction.followUp({ embeds: [noResponseEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await interaction.editReply({ embeds: [offlineEmbed], components: [updatedLoginSelectMenu] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }

    async function writeOffline(playerLogoutTime, playerLoginTime) {
        try {
            let offlineDecimalInput = playerLogoutTime + " " + playerLoginTime;
            await database.changeData(interaction.user.id, `UPDATE users SET offline = ? WHERE discordID = ?`, offlineDecimalInput);
            offlineEmbed.setColor('#7289DA');
            offlineEmbed.setTitle(`Offline Time Updated!`);
            offlineEmbed.setDescription(`Your offline time on Hypixel is now set to ${twentyFourToTwelve(decimalToTime(playerLogoutTime))} to ${twentyFourToTwelve(decimalToTime(playerLoginTime))}`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Offline Time Set`);
			return await interaction.editReply({ embeds: [offlineEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            events.errorMsg(interaction, err);
        }
    }

    async function currentOffline() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`);
            let offlineArray = response.offline.split(" ");
    
            offlineEmbed.setColor('#7289DA');
            offlineEmbed.setTitle(`Your Offline Time!`);
            offlineEmbed.setDescription(`Your offline time on Hypixel is set to ${twentyFourToTwelve(decimalToTime(offlineArray[0]))} to ${twentyFourToTwelve(decimalToTime(offlineArray[1]))}`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Returned Current Offline Time`);
			return await interaction.reply({ embeds: [offlineEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            events.errorMsg(interaction, err);
        }
    }

    function twentyFourToTwelve(time) {
        time = time.toString().match(/^([01]?\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
        if (time.length > 1) {
          time = time.slice(1);
          time[5] = +time[0] < 12 ? ' am' : ' pm';
          time[0] = +time[0] % 12 || 12;
        }
        return time.join('');
      };
  
      function decimalToTime(decimal) {
        let hour = Math.floor(decimal)
        let min = Math.round((decimal - hour) * 60)
        return hour + ":" + (min / 100).toFixed(2).slice(2)
      };
  },
};