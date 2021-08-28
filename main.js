const { Client, Collection, Intents, Permissions, MessageEmbed  } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const sqlite = require('sqlite3').verbose();
const fs = require('fs');

const userConfig = require('./userConfig.json');
const databaseImports = require('./database.js');
const funcImports = require('./functions.js');
const events = require('./events.js');
const log = require('./log.js');

const discordAPIkey = userConfig["discordAPIkey"];
const botOwner = userConfig["BotOwnerID"];
const logInterval = userConfig["logInterval"];
process.env.TZ = userConfig["Timezone"];

client.commands = new Collection();
client.cooldowns = new Collection();

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

let getApp = (guildID) => {
	const app = client.api.applications(client.user.id)
	if (guildID) {
		app.guilds(guildID)
	}
	return app;
}

let isDM = (interaction) => { //Pretty sure "if (!interaction.guild)" works perfectly.. but this works too so I'll probably just keep this
	if (!interaction.channel) return true
	else if (interaction.channel.type === "DM") return true;
	else return false;
}

client.once('ready', () => {
	console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | Logged in as ${client.user.tag}!`);
	client.user.setStatus('dnd');
	let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
	db.serialize(() => {
		db.run(`CREATE TABLE IF NOT EXISTS users(discordID TEXT NOT NULL, discordUsername TEXT NOT NULL, minecraftUUID TEXT NOT NULL, language TEXT NOT NULL, version TEXT NOT NULL, offline INTEGER NOT NULL, blacklist TEXT, whitelist TEXT, loginMS INTEGER, logoutMS INTEGER, timezone INTEGER NOT NULL, daylightSavings INTEGER NOT NULL, alerts TEXT NOT NULL, guildID TEXT NOT NULL, logID TEXT NOT NULL, alertID TEXT NOT NULL, log INTEGER NOT NULL, advanced TEXT)`);
		db.run(`CREATE TABLE IF NOT EXISTS servers(serverID TEXT NOT NULL, channels TEXT, enabled INTEGER NOT NULL)`);
		db.close();
	})
	setTimeout(() => {log.loadBalancer(client)}, 1000); //Setting a timeout of 1 second. The 1 second delay lets the databases generate. Await doesn't seem to work on those expressions, and this is simplier anyways
	setInterval(log.loadBalancer, logInterval * 1000, client); //Starts the main logging function
});

client.on("guildCreate", guild => {
    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Bot has joined a guild. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount} (w/ bot)`);
});

client.on("guildDelete", guild => {
    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Bot has left a guild; joined ${new Date(guild.joinedTimestamp).toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date(guild.joinedTimestamp))}. Guild: ${guild.name} | ${guild.id} Guild Owner: ${guild.ownerId} Guild Member Count: ${guild.memberCount -1} (new count)`);
});

client.on('interactionCreate', async interaction => { //Slash command handler
	if (!interaction.isCommand()) return;

	if (!client.commands.has(interaction.commandName)) return;

	let readData = funcImports.readOwnerSettings();
	let devMode = readData.devMode;

	if (devMode === true && !botOwner.includes(interaction.user.id)) {
		let devModeEmbed = new MessageEmbed()
			.setTitle('Developer Mode!')
			.setColor('#AA0000')
			.setDescription('This bot is in developer only mode, likely due to a major issue or an upgrade that is taking place. Please check back later!')
        	.setTimestamp()
        	.setFooter(`${interaction.id} | ${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`, 'https://i.imgur.com/MTClkTu.png');
		return interaction.reply({ embeds: [devModeEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
	}

	let command = client.commands.get(interaction.commandName);

	requestGuild();

	async function requestGuild() {
	  if (isDM(interaction) === true) return await owner();
	  let checkIfServer = await databaseImports.isInDataBase(interaction.guild.id, `SELECT * FROM servers WHERE serverID = ?`);
	  let requestedGuild = checkIfServer[0] === false ? await createServerRow() : checkIfServer;
	  let serverChannels = requestedGuild[1].channels ? requestedGuild[1].channels.split(" ") : []
	  if (serverChannels.length === 0) return await owner();
	  if (!serverChannels.includes(interaction.channel.id) && interaction.commandName !== 'server') return events.channelConstraint(interaction, serverChannels);
	  return await owner();
	};

	async function createServerRow() {
	  await databaseImports.newRow(`INSERT INTO servers VALUES(?,?,?)`, [interaction.guild.id, null, true]);
	  console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} GuildID: ${interaction.guild.id} Generated a server row`);
	  return await databaseImports.isInDataBase(interaction.guild.id, `SELECT * FROM servers WHERE serverID = ?`);
	}

	function owner() { //Checks for commands that are owner only
	  if (command.ownerReq && !botOwner.includes(interaction.user.id)) return events.ownerConstraint(interaction)
	  checkPermsOfBot();
	};

	async function checkPermsOfBot() { //Permission handler
	  if (isDM(interaction) === true) return await checkPermsOfUser();
		try {
			if (command.botChannelPermissions && command.botGuildPermissions) {
			  let returned = await funcImports.checkPermsOfBot(interaction.channel, command.botChannelPermissions, command.botGuildPermissions, interaction.guild.me);
			  if (returned) return events.permissionConstraint(interaction, returned);
			  return await checkPermsOfUser();
			} else {
			  let configPermError = new Error(`This command is missing a bot permission configuration. Please contact the owner`); configPermError.name = "ConfigError";
			  return events.errorMsg(interaction, configPermError);
			}
		} catch (err) {
		  events.errorMsg(interaction, err);
		}	
	};

	async function checkPermsOfUser() {
		if (isDM(interaction) === true) return await checkDB();
		  try {
			  if (command.commandPermissions) {
				let returned = await funcImports.checkPermsOfUser(interaction, command.commandPermissions);
				if (returned) return events.userPermissionConstraint(interaction, returned);
				return await checkDB();
			  } else {
				let configPermError = new Error(`This command is missing a user permission configuration. Please contact the owner`); configPermError.name = "ConfigError";
				return events.errorMsg(interaction, configPermError);
			  }
		  } catch (err) {
			events.errorMsg(interaction, err);
		  }	
	};

	async function checkDB() { //Checks if the user has used /setup, and will return that data if so
		let isInDB = await databaseImports.isInDataBase(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`);
		let options = ''; //Empty string
		interaction.options._hoistedOptions.forEach((option) => {options += ` ${option.value}`}) //Adds the slash command options to the empty string to display to console
		console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} DB ${isInDB[0]} User: ${interaction.user.username}#${interaction.user.discriminator}${interaction.guild ? ` GuildID: ${interaction.guild.id}` : ``} made a request: ${interaction.commandName}${interaction.options._group ? ` ${interaction.options._group}` : ``}${interaction.options._subcommand ? ` ${interaction.options._subcommand}` : ``}${options}`);
		if (isInDB[0] == false && command.database == true) return events.setupConstraint(interaction);
		dm(isInDB[1]); //Also provides row data so I don't have to request it again later
	};

	function dm(rowData) { //Some commands cannot be used in DMs
		if (command.guildOnly && isDM(interaction) == true) {
			return events.dmConstraint(interaction);
		}
		cooldown(rowData);
	};

	function cooldown(rowData) { //Cooldown handler stolen from the discord.js v12 guide
		let { cooldowns } = client;
	
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Collection());
		}
	
		let now = Date.now(),
		timestamps = cooldowns.get(command.name),
		cooldownAmount = (command.cooldown || 0.5) * 1000;
	
		if (timestamps.has(interaction.user.id) && !botOwner.includes(interaction.user.id)) {
			let expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return events.cooldownConstraint(interaction, timeLeft.toFixed(1));
			}
		}
	
		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
		execute(rowData);
	};

	async function execute(rowData) {
		try {
			await client.commands.get(interaction.commandName).execute(interaction, client, rowData);
			//client can be accessed with interaction.client, so adding the client parameter by itself is unnessessary
		} catch (error) {
			await events.errorMsg(interaction, error);
		}
	};
});

client.on('messageCreate', async message => { //Basiclaly all owner only stuff
	if (message.author.bot) return;
	if (message.content.startsWith('h!')) {
		console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | ${message.author.tag} is using the outdated command method. ${message.content}`)
		return message.channel.send(`This bot has been upgraded to slash commands. Please use them, as message based commands are no longer supported by this bot. If you don't see slash commands, please click the link below, accept the new condition, and select the current server. Note that you must have the "Manage Server" permission to do this. This allows the bot to create slash commands. This process takes ~10 seconds. Thanks! https://discord.com/api/oauth2/authorize?client_id=841021942249422868&permissions=268528656&scope=bot%20applications.commands`);
	}
	if (!botOwner.includes(message.author.id)) return;
	if (!client.application?.owner) await client.application?.fetch();

	if (message.content.toLowerCase() === '.commands' && message.author.id === client.application?.owner.id) {
		console.log(await getApp(`873000534955667496`).commands.get())
		console.log(await getApp(`838544983261839481`).commands.get())
		console.log(await getApp().commands.get())
	} else if (message.content.toLowerCase() === '.delete' && message.author.id === client.application?.owner.id) {
		const deleted = await getApp("873000534955667496").commands('872285536168063016').delete() //commands can deploy on both guild and global
		console.log(deleted)
	} else if (message.content.toLowerCase() === '.perms' && message.author.id === client.application?.owner.id) {
		const command = await client.guilds.cache.get('873000534955667496')?.commands.fetch('877766250934198313');

		const permissions = [
			{
				id: '304778919368982530',
				type: 'USER',
				permission: true,
			},
		];

		await command.permissions.add({ permissions });
	} else if (message.content.toLowerCase() === '.update' && message.author.id === client.application?.owner.id) {
		let assets = funcImports.readAssets();
		let data = assets.localCommands;

		let commands = await client.guilds.cache.get('873000534955667496')?.commands.set(data); //This only works on 1 guild. Read docs discord.js docs on slash commands
		//Global updater is let commands = await client.application.commands.set(data);
		console.log(commands);
	} else if (message.content.toLowerCase() === '.globalupdate' && message.author.id === client.application?.owner.id) {
		let assets = funcImports.readAssets();
		let data = assets.globalCommands;

		let commands = await client.application.commands.set(data); //This only works on 1 guild. Read docs discord.js docs on slash commands
		//Global updater is let commands = await client.application.commands.set(data);
		console.log(commands);
	}
});

process.on('unhandledRejection', error => { //Handles everything that I missed that would cause a crash. Epic.
	console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Unhandled promise rejection:`, error);
});

client.login(discordAPIkey);