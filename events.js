const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('./functions.js');
const userConfig = require('./userConfig.json');
const botOwner = userConfig["BotOwnerID"];
const discordConsole = userConfig["consoleID"];

async function errorMsg(interaction, rawError) { //Message for errors
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Error while executing the command "/${interaction.commandName}": ${rawError.stack}`);
    const errorEmbed = new MessageEmbed()
        .setColor('#AA0000')
        .setTitle(`An Error Occured!`)
        .setDescription(`An error occured while executing the command \`/${interaction.commandName}\`! Please contact the owner of the bot if this error occurs for an extended period of time.`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
    if (rawError.name && rawError.message) errorEmbed.addField(rawError.name + ":", rawError.message.replace(/(\r\n|\n|\r)/gm, ""))
    else errorEmbed.addField(`Unknown Error`, rawError.message || rawError)
    if (interaction.id) errorEmbed.addField(`Interaction ID`, interaction.id);
    if (interaction.replied === true) await interaction.followUp({ embeds: [errorEmbed] }).catch((err) => {console.log(`big error`, err)})
    else if (interaction.deferred === true) await interaction.editReply({ embeds: [errorEmbed] }).catch((err) => {console.log(`big error`, err)})
    else await interaction.reply({ embeds: [errorEmbed] }).catch((err) => {console.log(`big error`, err)}) //do something with big error
}

async function logErrorMsg(client, userNumber, rawError, description, consoleStackTraceBoolean, writeToDiscordConsole, pingBoolean) { //Message for errors
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | User: ${userNumber} Error while executing the logging function.${description ? ` Description: ${description}` : ``} ${consoleStackTraceBoolean ? `Stack: ${rawError.stack}` : `Error Message: ${rawError.message ?? rawError}`}`);
    let consoleObject = client.channels.cache.get(discordConsole);
    if (!writeToDiscordConsole) return;
    const logErrorEmbed = new MessageEmbed()
        .setColor('#AA0000')
        .setTitle(`${rawError.name ? `${rawError.name}:` : 'An Unknown Error Occured!'}`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
    if (rawError.message) logErrorEmbed.setDescription(rawError.message.replace(/(\r\n|\n|\r)/gm, ""))
    else logErrorEmbed.setDescription(`Please check the console!`)
    if (pingBoolean) await consoleObject.send({ content: `<@${botOwner[0]}>` })
    await consoleObject.send({ embeds: [logErrorEmbed] }).catch((err) => {console.log(`big error`, err)}) //do something with big error
}

async function collectorError(interaction, rawError, collected, responses) { //Message for collector errors, not used right now
    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Collector error while executing the command "/${interaction.commandName}".${collected ? ` Collected: ${collected.content}` : ``}${responses ? `Responses: ${responses}` : ``}${rawError ? ` Stack: ${rawError.stack}` : ``}`);
}

async function channelConstraint(interaction, whitelistedChannels) { //Message for commands that cannot be used in Dms
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Cannot execute the command "/${interaction.commandName}" in the channel ${interaction.channel.id}`);
    const channelEmbed = new MessageEmbed()
        .setColor('#AA0000')
        .setTitle(`Non-Whitelisted Channel!!`)
        .setDescription(`You cannot use commands in this channel!`)
        .addField(`Whitelisted Channels`, `<#${whitelistedChannels.join(">\n<#")}>`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
        channelEmbed.addField(`Interaction ID`, interaction.id);
    await interaction.reply({ embeds: [channelEmbed], ephemeral: true }).catch((err) => {errorMsg(interaction, err)}); //do something with big error
}

async function ownerConstraint(interaction) { //Message for commands that cannot be used in Dms
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Cannot execute the command "/${interaction.commandName}" without being an owner`);
    const ownerEmbed = new MessageEmbed()
        .setColor('#AA0000')
        .setTitle(`Insufficient Permissions!`)
        .setDescription(`You cannot execute the command \`/${interaction.commandName}\` without being a owner!`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
        ownerEmbed.addField(`Interaction ID`, interaction.id);
    await interaction.reply({ embeds: [ownerEmbed], ephemeral: true }).catch((err) => {errorMsg(interaction, err)}); //do something with big error
}

async function permissionConstraint(interaction, missingPermission) { //Message for missing permissions for a command
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Bot missing the following permissions while executing the command "/${interaction.commandName}": Channel: ${missingPermission[0]} Guild: ${missingPermission[1]}`);
    const permissionEmbed = new MessageEmbed()
        .setColor('#AA0000')
        .setTitle(`Missing Permissions!`)
        .setDescription(`This bot is missing permissions for the command \`/${interaction.commandName}\`!`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
    if (missingPermission[0].length > 0) permissionEmbed.addField(`Missing Permissions:`, missingPermission[0].join(", "))
    if (missingPermission[1].length > 0) permissionEmbed.addField(`Missing Server Permissions:`, `The following permission must be given on a server-wide level: ${missingPermission[1].join(", ")}`)
    permissionEmbed.addField(`Interaction ID`, interaction.id);
    await interaction.reply({ embeds: [permissionEmbed], ephemeral: true }).catch((err) => {errorMsg(interaction, err)}); //do something with big
}

async function userPermissionConstraint(interaction, missingPermission) { //Message for missing permissions for a user
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} User missing the following permissions while executing the command "/${interaction.commandName}": ${missingPermission.join(", ")}`);
    const permissionEmbed = new MessageEmbed()
        .setColor('#AA0000')
        .setTitle(`Missing Permissions!`)
        .setDescription(`You are missing permissions for the command \`/${interaction.commandName}\`!`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
    if (missingPermission.length > 0) permissionEmbed.addField(`Missing Permissions:`, `You are missing the following permissions(s): ${missingPermission.join(", ")}`)
    permissionEmbed.addField(`Interaction ID`, interaction.id);
    await interaction.reply({ embeds: [permissionEmbed], ephemeral: true }).catch((err) => {errorMsg(interaction, err)}); //do something with big
}

async function setupConstraint(interaction) { //Message for commands that cannot be executed without /setup
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Missing setup while executing the command "/${interaction.commandName}"`);
    const setupEmbed = new MessageEmbed()
        .setColor('#FF5555')
        .setTitle(`Missing setup!`)
        .setDescription(`You must use the command \`/setup\` before using the command \`/${interaction.commandName}\`!`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
        setupEmbed.addField(`Interaction ID`, interaction.id);
    await interaction.reply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {errorMsg(interaction, err)}); //do something with big error
}

async function dmConstraint(interaction) { //Message for commands that cannot be used in Dms
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Cannot execute the command "/${interaction.commandName}" inside DMs`);
    const dmEmbed = new MessageEmbed()
        .setColor('#FF5555')
        .setTitle(`Cannot execute this command in DMs!`)
        .setDescription(`You cannot execute the command \`/${interaction.commandName}\` in DMs! Please use a text channel!`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
        dmEmbed.addField(`Interaction ID`, interaction.id);
    await interaction.reply({ embeds: [dmEmbed], ephemeral: true }).catch((err) => {errorMsg(interaction, err)}); //do something with big error
}

async function cooldownConstraint(interaction, cooldownTime) { //Message for commands that cannot be used in Dms
    console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} Cannot execute the command "/${interaction.commandName}" without being a owner`);
    const cooldownEmbed = new MessageEmbed()
        .setColor('#FF5555')
        .setTitle(`Slow Down!`)
        .setDescription(`Please wait ${cooldownTime} second(s) before using \`/${interaction.commandName}\` again! This message will change text and color in ${cooldownTime} seconds to indicate when the cooldown expires.`)
        .setTimestamp()
        .setFooter(`Error at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
        cooldownEmbed.addField(`Interaction ID`, interaction.id)
    await interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
    let wait = ms => new Promise(res => setTimeout(res, ms));
    await wait(cooldownTime * 1000);
    cooldownEmbed.setColor(`#00AA00`);
    cooldownEmbed.setTitle(`Cooldown Over!`);
    cooldownEmbed.setDescription(`You can now use \`/${interaction.commandName}\` again!`);
    cooldownEmbed.setFooter(`Error Resolved at ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())}`, 'https://i.imgur.com/MTClkTu.png');
    await interaction.editReply({ embeds: [cooldownEmbed], ephemeral: true });
}

module.exports = { errorMsg, logErrorMsg, collectorError, channelConstraint, ownerConstraint, permissionConstraint, userPermissionConstraint, setupConstraint, dmConstraint, cooldownConstraint };