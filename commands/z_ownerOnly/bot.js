/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const fs = require('fs');
const funcImports = require('../../functions.js');
const database = require('../../database.js');
const events = require('../../events.js');
module.exports = {
  	name: 'bot',
  	title: 'Contains all owner commands',
	description: 'Contains all owner commands',
  	usage: `\`/bot\``,
  	database: false,
  	guildOnly: true,
  	ownerReq: true, //Commands locked behind an owner req
  	cooldown: 1,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, row) {
    let readData = funcImports.readOwnerSettings();
        let api = readData.api,
        userLimit = readData.userLimit,
        blockedUsers = readData.blockedUsers,
        dst = readData.dst,
        devMode = readData.devMode;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    switch (interaction.options.getSubcommand()) {
        case 'api':
            apiCommand(); //Toggles commands that use the Hypixel/Slothpixel API along with the logging function
            break;
        case 'block':
            blockCommand(interaction.options.getString('user')); //Blocks users from using /setup
            break;
        case 'devmode':
            devmode(); //Toggle developer mode
            break;
        case 'dst':
            dstCommand(); //Manually toggles daylight savings. NPM script to update it may work
            break;
        case 'eval':
            evalCommand(interaction.options.getString('string')); //Manually toggles daylight savings. NPM script to update it may work
            break;
        case 'guildinfo':
            guildinfo(interaction.options.getString('guild')); //Returns if a guild is valid
            break;
        case 'leaveguild':
            leaveguildCommand(interaction.options.getString('guild')); //Force leave a guild
            break;
        case 'messageuser':
            messageuser(interaction.options.getString('user'), interaction.options.getString('message')); //Message a user, reserved for system updates or etc
            break;
        case 'reload':
            reloadCommand(interaction.options.getString('command')); //Witchcraft. Reloads a command
            break;
        case 'userlimit':
            userlimitCommand(interaction.options.getInteger('limit')); //Set a user limit for /setup
            break;
    }

    async function apiCommand() {
      let apiEmbed = new MessageEmbed()
        .setTitle(`API State Updated!`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      if (api == false) {
        let api = true;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        apiEmbed.setColor(`#7289DA`);
        apiEmbed.setDescription(`API commands and functions are now on!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | API commands and functions are now on!`);
        return interaction.reply({ embeds: [apiEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      } else if (api == true) {
        let api = false;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        apiEmbed.setColor(`#7289DA`);
        apiEmbed.setDescription(`API commands and functions are now off!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | API commands and functions are now off!`);
        return await interaction.reply({ embeds: [apiEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
    }

    async function blockCommand(userID) {
      let blockEmbed = new MessageEmbed()
        .setColor(`#7289DA`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      if (!blockedUsers.includes(userID)) {
        blockedUsers.push(userID);
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        blockEmbed.setTitle(`User Added!`);
        blockEmbed.setDescription(`${userID} was added to the blacklist!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | User ${userID} was added to the blacklist!`);
        return interaction.reply({ embeds: [blockEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      } else {
        let blockedUserIndex = blockedUsers.indexOf(userID);
        blockedUsers.splice(blockedUserIndex, 1);
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        blockEmbed.setTitle(`User Removed!`);
        blockEmbed.setDescription(`${userID} was removed from the blacklist!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | User ${userID} was removed from the blacklist!`);
        return await interaction.reply({ embeds: [blockEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
    }

    async function devmode() {
      let devModeEmbed = new MessageEmbed()
        .setTitle(`Developer Mode Updated!`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      if (devMode === false) {
        let devMode = true;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        devModeEmbed.setColor(`#7289DA`);
        devModeEmbed.setDescription(`Developer Mode is now on!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Developer Mode is now on!`);
        return interaction.reply({ embeds: [devModeEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      } else if (devMode === true) {
        let devMode = false;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        devModeEmbed.setColor(`#7289DA`);
        devModeEmbed.setDescription(`Developer Mode is now off!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Developer Mode is now off!`);
        return await interaction.reply({ embeds: [devModeEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
    }

    async function dstCommand() {
      let dstEmbed = new MessageEmbed()
        .setTitle(`Daylight Savings State Updated!`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      if (dst === false) {
        let dst = true;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        dstEmbed.setColor(`#7289DA`);
        dstEmbed.setDescription(`Daylight savings is now on!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Daylight savings is now on!`);
        return interaction.reply({ embeds: [dstEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      } else if (dst === true) {
        let dst = false;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst, devMode);
        dstEmbed.setColor(`#7289DA`);
        dstEmbed.setDescription(`Daylight savings is now off!`);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Daylight savings is now off!`);
        return await interaction.reply({ embeds: [dstEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
    }

    async function evalCommand(command) {
      let evalEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      try {
        let output = await eval(command);
        evalEmbed.setColor('#7289DA');
        evalEmbed.setTitle('Executed Eval!');
        evalEmbed.addField(`Input`, `\`${command}\``);
        evalEmbed.addField(`Output`, `\`${output}\``);
        return await interaction.reply({ embeds: [evalEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      } catch (err) {
        evalEmbed.setColor('#FF5555');
        evalEmbed.setTitle('Failed Eval!');
        evalEmbed.addField(`Input`, `\`${command}\``);
        evalEmbed.addField(`${err.name}`, `${err.message}`);
        return await interaction.reply({ embeds: [evalEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
    }

    async function guildinfo(guildID) {
      let guildinfoEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

        let guild = await interaction.client.guilds.fetch(guildID);
        if (!guild) {
          guildinfoEmbed.setColor('#FF5555');
          guildinfoEmbed.setTitle('Invalid Guild ID!');
          guildinfoEmbed.setDescription('That guild ID doesn\'t seem to be valid!');
          return await interaction.reply({ embeds: [guildinfoEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
        }
        guildinfoEmbed.setColor('#7289DA');
        guildinfoEmbed.setTitle(`Guild: ${guild.name}`);
        guildinfoEmbed.setDescription(`Owner ID: ${guild.ownerId}\nGuild Member Count (w/o bot): ${guild.memberCount - 1}\nRegion: ${guild.preferredLocale}\nJoined: ${new Date(guild.joinedTimestamp).toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date(guild.joinedTimestamp))}\nServer Boost Count: ${guild.premiumSubscriptionCount}`);
        console.log(guild)
        return await interaction.reply({ embeds: [guildinfoEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
    }

    async function leaveguildCommand(guildID) {
      let leaveguildEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      leaveGuild().catch((err) => {events.errorMsg(interaction, err)});
      async function leaveGuild() {
        let guild = await interaction.client.guilds.fetch(`${guildID}`);

        if (!guild) {
            leaveguildEmbed.setColor(`#FF5555`);
            leaveguildEmbed.setTitle(`Invalid Guild ID!`);
            leaveguildEmbed.setDescription(`That guild ID doesn't seem to be valid!`);
            return interaction.reply({ embeds: [leaveguildEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
        }
        console.log(guild)
        guild.leave();

        leaveguildEmbed.setColor(`#7289DA`);
        leaveguildEmbed.setTitle(`Guild Left!`);
        leaveguildEmbed.setDescription(`The bot has left the guild "${guild.name}"`);
        leaveguildEmbed.addField(`Guild Information`, `Guild Owner: ${guild.ownerId} - <@${guild.ownerId}>\nNew Member Count: ${guild.memberCount - 1}\nJoined: ${new Date(guild.joinedTimestamp).toLocaleTimeString('en-IN', { hour12: true })} UTC | ${funcImports.epochToCleanDate(new Date(guild.joinedTimestamp))}`);
        return await interaction.reply({ embeds: [leaveguildEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
    }

    async function messageuser(userID, message) {
      let messageuserEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      let response = await database.getData(userID, `SELECT * FROM users WHERE discordID = ?`);
      if (!response) {
          messageuserEmbed.setColor(`#FF5555`);
          messageuserEmbed.setTitle(`Cannot Message User!`);
          messageuserEmbed.setDescription(`User is not signed up!`);
          return await interaction.reply({ embeds: [messageuserEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }
      let advancedSettings = response.advanced ? response.advanced.split(" ") : [];
      if (advancedSettings.includes("DM_OPT_OUT")) {
          messageuserEmbed.setColor(`#FF5555`);
          messageuserEmbed.setTitle(`Cannot Message User!`);
          messageuserEmbed.setDescription(`That user opted out!`);
          return await interaction.reply({ embeds: [messageuserEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
      }

      let userMessage = new MessageEmbed()
            .setTitle('HyGuard Notification!')
            .setDescription(message)
            .setTimestamp()
            .setFooter(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`, 'https://i.imgur.com/MTClkTu.png');

      var d = new Date(),
          h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, 0, 0, 0),
          e = h - d;
      if (e > 100) {
          let timeout = setTimeout(send, e);

          let cancelButton = new MessageActionRow()
			      .addComponents(
				      new MessageButton()
					    .setCustomId('cancel')
					    .setLabel('Cancel')
					    .setStyle('DANGER'),
			    );

          await interaction.reply({ content: `Preview of your message! Your message will be send in ${new Date(e).toISOString().substr(11, 8)}`, embeds: [userMessage], components: [cancelButton], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});

          const filter = i => i.customId === 'cancel' && i.user.id === interaction.user.id;
          const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', max: 1, time: 3600000 });

          collector.on('collect', async i => { //.update provides a way of updating ephermerals without having that stupid (edited) timestamp thing. It's awesome.
            clearTimeout(timeout);
            messageuserEmbed.setTitle(`DM Canceled!`);
            return i.update({ content: 'DM Canceled!', embeds: [messageuserEmbed], components: [] }).catch((err) => {events.errorMsg(interaction, err)});
          });
      }
      function send() {
        interaction.client.users.fetch(userID).then(async () => {
          let user = await interaction.client.users.fetch(userID)
          return await user.send({ embeds: [userMessage] })
            .then(async () => {
              messageuserEmbed.setDescription(message)
              await interaction.followUp({ content: 'Message sent!', embeds: [messageuserEmbed], ephemeral: true })
            }).catch((err) => {events.errorMsg(interaction, err)});
        }).catch((err) => {events.errorMsg(interaction, err)});

      }
    }

    async function reloadCommand(commandName) {
      let reloadEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

		const command = interaction.client.commands.get(commandName.toLowerCase())

		if (!command) {
            reloadEmbed.setColor(`#FF5555`)
            reloadEmbed.setTitle(`Unknown Command!`);
            reloadEmbed.setDescription(`There is no command with the name ${commandName.toLowerCase()}!`)
            return interaction.reply({ embeds: [reloadEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
		}

		const commandFolders = fs.readdirSync('./commands');
		const folderName = commandFolders.find(folder => fs.readdirSync(`./commands/${folder}`).includes(`${command.name}.js`));

		delete require.cache[require.resolve(`../${folderName}/${command.name}.js`)];

		try {
			const newCommand = require(`../${folderName}/${command.name}.js`);
			interaction.client.commands.set(newCommand.name, newCommand);
		} catch (error) {
			events.errorMsg(interaction, error)
		}

        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | "/${commandName.toLowerCase()}" was successfully reloaded!`);
        reloadEmbed.setColor(`#7289DA`)
        reloadEmbed.setTitle(`/${commandName.toLowerCase()} Reloaded!`);
        reloadEmbed.setDescription(`/${commandName.toLowerCase()} was successfully reloaded!` )
        return await interaction.reply({ embeds: [reloadEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
    }

    async function userlimitCommand(limit) {
      let userlimitEmbed = new MessageEmbed()
        .setTitle(`User Limit Updated!`)
        .setColor('#7289DA')
        .setDescription(`User Limit is now ${limit}!`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

        funcImports.saveOwnerSettings(api, limit, blockedUsers, dst);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | User limit updated to ${limit}!`);
        return await interaction.reply({ embeds: [userlimitEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)});
    }
  },
};