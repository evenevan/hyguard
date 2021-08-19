# HyGuard - An account safeguard for Hypixel

![](https://i.imgur.com/41sPQS8.png)

The HyGuard project was created to be a warning system to alert users to prevent other nefarious individuals from hijacking your Minecraft account. It works by checking your status on Hypixel, and alerting you on any unusual activity including logins, changes in language, unusual versions of Minecraft, logins while the player should be offline, customizable blacklisted games, and customizable whitelisted games. This bot isn't most user friendly, but used the right way, it works brilliantly and silently in the background until it detects something.

## Why should you care?
Day in and day out, account are compromised and used for "unfair" purposes like cheating. Specifically, no Minecraft server has it worse than Hypixel, the most popular Minecraft server. Even with the best password management and security practices, accounts can be broken into, especially with the recent session ID exploit. The Hypixel forums are notorious for the constant posts of "I got false banned" just for a good Samaritan to show them their previous account activity, where it becomes clear that they were compromised.

This is where HyGuard comes in. At least 10% of all account are AFK at given time on Hypixel, according to data from [HyTrack](https://hytrack.me/). If a player was to be compromised while being AFK, they would have no clue as their account is logged in from another location. With HyGuard, the player would be alerted within an average of 15 seconds*, where they could change their passwords and take back control of their account.

Another common situation is having your account be compromised while you are offline. For this scenario, let's assume you are taking a nap on the couch. Common games that attract cheaters include SkyWars, UHC, Mega Walls, SkyBlock, and more. If you don't play those games, you can set them as blacklisted. If the account was to be detected playing those games, you would receive a ping on Discord, which could wake you up, especially as the blacklisted ping occurs every 30 seconds*.
##### *Subject to change
## I have 2FA, why should I care?
2FA is an incredible piece of technology that is very useful for making an account more secure. However, 2FA would not protect your account to an exploit like the session ID exploit, while HyGuard could give you a heads up. If 2FA is the border control into your account, then HyGuard is a patrol guard within the border looking for suspicious activity. HyGuard is another layer of security that helps keep you in control.
## Setup as a user
The following contains the information for the average individual looking to gain the protection of this project:

 - [Invite](https://discord.com/api/oauth2/authorize?client_id=841021942249422868&permissions=268528656&scope=bot%20applications.commands) my Discord Bot to a server or join a server with it
 - Type **h!setup**
 - Follow the setup instructions
   - You must have joined Hypixel before
   - Use the 24 hour time system for the login time/logout time questions
 - Read over the instructions in the channels that are created
 - Type **h!monitor** to have the bot start monitoring your account
 - Use **h!help < command >** to see its usage and description
 #### Optional
 - Try out **h!whitelist** & **h!blacklist** for added protection and safeguards
 - Try out **h!advanced logintime** which turns offline logins into repeated alerts
## Commands

Use **/help command:<command>** to see details and usage of that specific command

|    Commands   | Cooldown<br>in seconds |                                   Description                                  | Requires<br>setup? |
|:-------------:|:----------------------:|:------------------------------------------------------------------------------|:------------------:|
| /setup        | 5                      | Allows players to begin using HyGuard                                          | N                  |
| /deletedata   | 10                     | Allows users to delete their data                                              | Y                  |
| /blacklist    | 2.5                    | Allows you to set blacklist game(s) on Hypixel                                 | Y                  |
| /whitelist    | 2.5                    | Allows you to set whitelisted game() to play on Hypixel                        | Y                  |
| /language     | 5                      | Allows you to whitelist a language for use on Hypixel                          | Y                  |
| /offlinetime  | 5                      | Allows you to set when logins should not occur                                 | Y                  |
| /version      | 5                      | Allows you to whitelist version(s) of Minecraft for use on Hypixel             | Y                  |
| /timezone     | 5                      | Allows you to set a new timezone for the bot's services that utilise timezones | Y                  |
| /alerts       | 2.5                    | Allows you to toggle individual alert types                                    | Y                  |
| /advanced     | 5                      | Allows you to add or change some special advanced options                      | Y                  |
| /monitor      | 7.5                    | Allows you to toggle the logging and monitoring of your account                | Y                  |
| /server       | 5                      | Allows you to edit the bot settings for this server                            | N                  |
| /mojang       | 10                     | Shows the status of Mojang's services                                          | N                  |
| /ping         | 5                      | Shows the ping of the bot                                                      | N                  |
| /compromised  | 5                      | Shows a copy-pasteable summary of a user's last session                        | N                  |
| /recentgames  | 7.5                    | Shows the recent games of any player                                           | N                  |
| /status       | 7.5                    | Shows the status of any player                                                 | N                  |
| /help         | 1                      | Shows basic info and all commands or detailed info about a specific command    | N                  |

## Issue(s)
#### Bug Reports and Suggestions
You can DM any bug reports/exploits/suggestions to Attituding#6517, or [join](https://discord.gg/NacwrAaWgE) the Discord Server for this bot and create a ticket. If you decide to DM bug reports, join the Hypixel Discord first so that you won't get blocked by Clyde.

## Updates

  HyGuard is now at v2! This breaking change makes the change to Discord's v9 API, which includes slash commands!

## Code

You can and modify my code, as per the MIT license.
## Warning
I reserve the right to terminate any user who I believe is abusing the system. Additionally, please do not delete the channels that the bot creates or attempt to modify the bot's permissions. I can see who deletes and modifies information on my end, and will remove and block your profile from the database. It doesn't crash the bot, and is just annoying.

## Quick Links

[Top.gg Page](https://top.gg/bot/841021942249422868)

[HyGuard Invite Link](https://discord.com/api/oauth2/authorize?client_id=841021942249422868&permissions=268528656&scope=bot%20applications.commands)

[HyGuard Discord Server Invite Link](https://discord.gg/yMdZsdbaEN)

[HyGuard Showcase Video Link](https://www.youtube.com/watch?v=joipDXbhnIU)

## That's all!
