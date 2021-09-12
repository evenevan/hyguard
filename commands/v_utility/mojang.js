const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const fetch = require('node-fetch');
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...options });
    if (signal) signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
};
module.exports = {
  	name: 'mojang',
  	title: 'Displays the status of Mojang\'s services',
	description: 'Displays the status of Mojang\'s services. Mojang doesn\'nt seem to update it often though.',
  	usage: `\`/mojang\``,
  	database: false,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 10,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, client, row) {
    let readData = funcImports.readOwnerSettings();
        let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let mojangStatus = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
    
    await interaction.deferReply({ ephemeral: true });

    mojangAPIRequest();

    async function mojangAPIRequest(undefinedIfHasntAborted) {
        let controller = new AbortController();
        Promise.all([
            fetchTimeout(`https://status.mojang.com/check`, 5000, {
                signal: controller.signal
              }).then(function(response) {
                if (!response.ok) {let newError = new Error("HTTP status " + response.status); newError.name = "HTTPError"; throw newError;}
                return response.json();
              }),
          ])
          .then((data) => {
            sendData(data[0])
          })
          .catch(async (err) => {
            if (err.name === "AbortError") {
                if (undefinedIfHasntAborted === undefined) {
                  mojangStatus.setColor('#FF5555');
                  mojangStatus.setTitle(`Connection Failed!`);
                  mojangStatus.setDescription('The Mojang API failed to respond, trying again..');
                  await interaction.editReply({ embeds: [mojangStatus], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                  return mojangAPIRequest(true);
                }
                mojangStatus.setColor('#AA0000');
                mojangStatus.setTitle(`Abort Error!`);
                mojangStatus.setDescription('The Mojang API failed to respond, and may be down. Try again later.');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Abort Error`);
              return await interaction.editReply({ embeds: [mojangStatus], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
        });
    }
    
    async function sendData(data) {
        let arr = [
          data[7]["mojang.com"].toUpperCase(),
          data[2]["account.mojang.com"].toUpperCase(),
          data[3]["authserver.mojang.com"].toUpperCase(),
          data[4]["sessionserver.mojang.com"].toUpperCase(),
          data[5]["api.mojang.com"].toUpperCase(),
          data[0]["minecraft.net"].toUpperCase(),
          data[1]["session.minecraft.net"].toUpperCase(),
          data[6]["textures.minecraft.net"].toUpperCase(),
        ];
        
        let cleanData = arr.map(function(item) { return item == 'GREEN' ? ':green_square:' : item == 'YELLOW' ? ':yellow_square:' : ':red_square:'; });

          mojangStatus.setColor('#7289DA')
          mojangStatus.setTitle('Mojang Services Status')
          mojangStatus.setDescription('Checks the status of Mojang\'s services')
          mojangStatus.addFields(
            { name: 'mojang.com', value: `${cleanData[0]}` },
            { name: 'account.mojang.com', value: `${cleanData[1]}` },
            { name: 'authserver.mojang.com', value: `${cleanData[2]}` },
            { name: 'sessionserver.mojang.com', value: `${cleanData[3]}` },
            { name: 'api.mojang.com', value: `${cleanData[4]}` },
            { name: 'minecraft.net', value: `${cleanData[5]}` },
            { name: 'session.minecraft.net', value: `${cleanData[6]}` },
            { name: 'textures.minecraft.net', value: `${cleanData[7]}` },
          )

        return await interaction.editReply({ embeds: [mojangStatus], ephemeral: true })
    }
  },
};