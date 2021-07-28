const funcImports = require( __dirname + '../../../functions'); //reference code, this was added to setup, but was not tested.
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'messageuser',
    aliases: ['msguser'],
  title: 'DMs a user, usually for issues',
	description: 'Dms a user, usually for issues that impact the functions of this bot',
    usage: `\`${prefix}msgusr <userID> <content>\``,
  cooldown: 0,
  ownerReq: true,
  args: true,
  database: false,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
	execute(message, args, client) {

    if (!args[0]) return message.channel.send(`${message.author}, you didn't provide the User ID or Message!`)

    let userID = args.shift();

    let userMessage = args.join(" ");

    checkID();

    async function checkID() {
        try {
          let response = await databaseImports.getData(userID);
      
          if (response.advanced) {
            let advancedSettings = response.advanced.split(" ")
            if (advancedSettings.includes("DM_OPT_OUT")) return message.channel.send(`${message.author}, this user has opted out of recieving DMs, and you must respect that.`)
          }
          
        var d = new Date(),
            h = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, 0, 0, 0),
            e = h - d;
        if (e > 100) {
            setTimeout(send, e);
            message.channel.send(`Your message will be sent in ${new Date(e).toISOString().substr(11, 8)} so that it sends at the top fo the hour.`);
        }
      
        } catch (err) {
          console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while fetching data. ${err}`);
          message.channel.send(`${message.author}, an error occured while fetching data. \`${err}\``);
        }
    };
    
    function send() {
        try {
            client.users.fetch(userID).then(() => {
                    let user = client.users.cache.get(userID)
                    return user.send(userMessage)
                    .then(() => {
                        message.channel.send(`${message.author}, message sent to ${userID}!\n\n${userMessage}`)
                    })
                    .catch(err => {
                        message.channel.send(`${message.author}, ${err} User ID: ${userID}`);
                    });
            })
            .catch(err => {
                message.channel.send(`${message.author}, ${err} User ID: ${userID}`);
            });
            
    
        } catch (err) {
            try {
                message.channel.send(`${message.author}, minor error while attempting to DM a user. ${err}`);
            } catch (err) {
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Major error while attemtping to DM a user. ${err}`);
            }
        }
    }
    },
};

