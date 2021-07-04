# HyGuard - An account safeguard for Hypixel

![enter image description here](https://i.imgur.com/41sPQS8.png)

The HyGuard project was created to be an early warning system to alert users to prevent other nefarious individuals from hijacking your Minecraft account. It works by sending you your status on Hypixel, and alerting you on any unusual activity including logins, changes in language, unusual versions of Minecraft,  logins while the player should be offline, customizable blacklisted games , and customizable whitelisted games. This bot isn't most user friendly, but used the right way, it works silently in the background until needed.
## Why should I care?
Day in and day out, account are compromised and used for "unfair" purposes like cheating. Specifically, no Minecraft server has it worse than Hypixel, the most popular Minecraft server. Even with the best password management and security practices, accounts can be broken into, especially with the recent session ID exploit. The Hypixel forums are notorious for the constant posts of "I got false banned" just for a good Samaritan to show them their previous account activity, where it becomes clear that they were compromised.

This is where HyGuard comes in. Atleast 10% of all account are AFK at given time on Hypixel, according to data from [HyTrack](https://hytrack.me/). If a player was to be compromised while being AFK, they would have no clue as their account is logged in from another location. With HyGuard, the player would be alerted within an average of 15 seconds*, where they could change their passwords and take back control of their account.

Another common situation is having your account be compromised while you are offline. For this scenario, let's assume you are taking a nap on the couch. Common games that attract cheaters include SkyWars, UHC, Mega Walls, SkyBlock, and more. If you don't play those games, you can set them as blacklisted. If the account was to be detected playing those games, you would receive a ping on Discord, which could wake you up (especially as the blacklisted ping occurs every 15 seconds*).
##### *Subject to change
## I have 2FA, why should I care?
2FA is an incredible piece of technology that is very useful for making an account more secure. However, it along with your password only act as the guard at the gate of a prison, while HyGuard is a warden looking for suspicious activity. If 2FA is the defense, then HyGuard is the offence. Regardless, even if you already have 2FA, more security isn't bad!
## Setup as a user
The following contains the information for the average individual looking to gain the protection of this project:

 - [Invite](https://discord.com/api/oauth2/authorize?client_id=841021942249422868&permissions=268528720&scope=bot) my Discord Bot to a server or join a server with it
 - Type **,setup**
   - You can do this in DM's if there is a conflicting bot with the same prefix
 - Follow the setup instructions
   - You must have joined Hypixel before
   - Use the 24 hour time system for the login time/logout time questions
 - Read over the instructions in the channels that are created
 - Type ,log to have the bot start monitoring your account
 - Use **,help <command>** to see its usage and description
 #### Optional
 - Try out **,whitelist** & **,blacklist** for added protection and safeguards
 - Try out **,advanced logintime** which turns offline logins into repeated alerts


## Issue(s)
One major issue currently is the API limit. With the complementary limit of 120 requests per minute, I can only host 30 users, as each user uses a status request and a gametype request twice a minute. This means that slots are quite limited. If this project is successful and many people are interested, I will make some changes and also seek a higher API request limit. This may mean that the current interval of two checks per minute may need to change to 1 per minute, but I have some other ideas in mind too.
#### Bug Reports
For now, please DM any bug reports to Attituding#6517. Join the Hypixel Discord first so that you won't get blocked by Clyde.

## Setup as a host

  Work in Progress

## Code

You can and modify my code, as per the MIT license. The code is barely readable. Good luck lol.
## Warning
I reserve the right to terminate any user who I believe is abusing the system. Additionally, please do not delete the channels that the bot creates or attempt to modify the bot's permissions. I can see who deletes and modifies information on my end, and will remove and block your profile from the database. It doesn't crash the bot, and is just annoying.

## That's all!
