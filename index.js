const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

require("dotenv").config();

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// =====================================================
// CONFIG
// =====================================================

const ECONOMY_FILE = path.join(__dirname, "economy.json");

const STAFF_ROLES = [
    "Owner",
    "Co-Owner",
    "Deputy Owner",
    "S1N admins🛡️"
];

// =====================================================
// ECONOMY SYSTEM
// =====================================================

function loadEconomy() {
    try {
        if (!fs.existsSync(ECONOMY_FILE)) {
            fs.writeFileSync(
                ECONOMY_FILE,
                JSON.stringify({ users: {} }, null, 4)
            );
        }

        const data = JSON.parse(
            fs.readFileSync(ECONOMY_FILE, "utf8")
        );

        if (!data.users) {
            data.users = {};
        }

        return data;
    } catch (error) {
        console.error("❌ Failed to load economy.json:", error);
        return { users: {} };
    }
}

let economy = loadEconomy();

function saveEconomy() {
    try {
        fs.writeFileSync(
            ECONOMY_FILE,
            JSON.stringify(economy, null, 4)
        );
    } catch (error) {
        console.error("❌ Failed to save economy.json:", error);
    }
}

function getUser(userId) {
    if (!economy.users[userId]) {
        economy.users[userId] = {
            wallet: 1000,
            bank: 0,
            lastDaily: 0,
            lastWork: 0
        };

        saveEconomy();
    }

    return economy.users[userId];
}

// =====================================================
// HELPERS
// =====================================================

function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US");
}

function random(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function hasStaffRole(member) {
    if (!member) return false;

    return member.roles.cache.some(role =>
        STAFF_ROLES.some(
            staffRole =>
                role.name.toLowerCase() ===
                staffRole.toLowerCase()
        )
    );
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const commands = [

    // LOVE
    new SlashCommandBuilder()
        .setName("love")
        .setDescription(
            "Check the love percentage between you and someone ❤️"
        )
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Who do you love? 👀")
                .setRequired(true)
        ),

    // BALANCE
    new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your Money balance 💰"),

    // DAILY
    new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Claim your daily Money 🎁"),

    // WORK
    new SlashCommandBuilder()
        .setName("work")
        .setDescription("Work and earn Money 💼"),

    // SEND
    new SlashCommandBuilder()
        .setName("send")
        .setDescription("Send Money to another member 💸")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Who should receive the Money?")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        ),

    // DEPOSIT
    new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Put Money into your bank 🏦")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        ),

    // WITHDRAW
    new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("Take Money out of your bank 🏦")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        ),

    // LEADERBOARD
    new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("See the richest members 🏆"),

    // COINFLIP
    new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Bet Money on heads or tails 🪙")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option
                .setName("choice")
                .setDescription("Heads or tails?")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Heads",
                        value: "heads"
                    },
                    {
                        name: "Tails",
                        value: "tails"
                    }
                )
        ),

    // DICE
    new SlashCommandBuilder()
        .setName("dice")
        .setDescription("Roll the dice and bet Money 🎲")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        ),

    // SLOTS
    new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play the S1N slot machine 🎰")
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        ),

    // ADD MONEY
    new SlashCommandBuilder()
        .setName("addmoney")
        .setDescription("Add Money to a member 👑")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Who should receive the Money?")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("How much Money?")
                .setRequired(true)
                .setMinValue(1)
        )

].map(command => command.toJSON());

// =====================================================
// REGISTER COMMANDS
// =====================================================

const rest = new REST({
    version: "10"
}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering S1N Member Bot commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("✅ Commands registered successfully!");
    } catch (error) {
        console.error("❌ Command registration failed:");
        console.error(error);
    }
})();

// =====================================================
// READY
// =====================================================

client.once("clientReady", () => {
    console.log("====================================");
    console.log(`🤖 S1N Member Bot: ${client.user.tag}`);
    console.log("🟢 Bot is online");
    console.log("💰 Economy system loaded");
    console.log("🛡️ Ping protection loaded");
    console.log("====================================");
});

// =====================================================
// MESSAGE / PING PROTECTION
// =====================================================

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.guild) return;

    const member = message.member;

    if (!member) return;

    // Staff can ping freely
    if (member.permissions.has("Administrator")) return;

    if (message.guild.ownerId === message.author.id) return;

    if (hasStaffRole(member)) return;

    // =================================================
    // STAFF MENTION CHECK
    // =================================================

    let pingedStaff = false;

    for (const mentionedMember of message.mentions.members.values()) {

        // Server owner
        if (
            mentionedMember.id ===
            message.guild.ownerId
        ) {
            pingedStaff = true;
            break;
        }

        // Owner / Co-Owner / Deputy / Admin
        if (hasStaffRole(mentionedMember)) {
            pingedStaff = true;
            break;
        }
    }

    // =================================================
    // STAFF WARNING
    // =================================================

    if (pingedStaff) {

        const embed = new EmbedBuilder()
            .setColor(0xff4d88)
            .setTitle("🚨 DON'T PING STAFF")
            .setDescription(
                "## 🛑 **DON'T PING THE OWNER OR STAFF**\n\n" +
                "**bro don't ping the owner or the co-owner big guy 😭**\n\n" +
                "> Please contact staff normally instead of pinging them."
            )
            .setFooter({
                text: "S1N Member Bot • Member Protection"
            })
            .setTimestamp();

        try {
            await message.reply({
                embeds: [embed]
            });
        } catch (error) {
            console.error(
                "❌ Failed to send staff warning:",
                error
            );
        }

        return;
    }

    // =================================================
    // @EVERYONE / @HERE
    // =================================================

    if (!message.mentions.everyone) return;

    const embed = new EmbedBuilder()
        .setColor(0xff4d88)
        .setTitle("🚨 STOP PINGING")
        .setDescription(
            "## 🛑 **STOP PINGING LITTLE BRO 😭**\n\n" +
            "**NO ONE IS GONNA READ YOUR MSG WHEN U PING 😭**\n\n" +
            "> Don't use @everyone or @here unnecessarily."
        )
        .setFooter({
            text: "S1N Member Bot • Member Protection"
        })
        .setTimestamp();

    try {

        await message.reply({
            embeds: [embed]
        });

        await message.channel.send(
            "https://tenor.com/i1mSjD9IcG0.gif"
        );

    } catch (error) {
        console.error(
            "❌ Failed to send @everyone warning:",
            error
        );
    }
});

// =====================================================
// INTERACTION HANDLER
// =====================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // =================================================
    // BALANCE
    // =================================================

    if (interaction.commandName === "balance") {

        const userData =
            getUser(interaction.user.id);

        const total =
            userData.wallet +
            userData.bank;

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("💰 S1N MONEY")
            .setDescription(
                `### ${interaction.user}\n\n` +
                `💵 **Wallet**\n` +
                `\`${formatMoney(userData.wallet)} Money\`\n\n` +
                `🏦 **Bank**\n` +
                `\`${formatMoney(userData.bank)} Money\`\n\n` +
                `💎 **Total**\n` +
                `\`${formatMoney(total)} Money\``
            )
            .setThumbnail(
                interaction.user.displayAvatarURL({
                    extension: "png",
                    size: 256
                })
            )
            .setFooter({
                text: "S1N Member Bot • Economy"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // DAILY
    // =================================================

    if (interaction.commandName === "daily") {

        const userData =
            getUser(interaction.user.id);

        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;

        const remaining =
            cooldown -
            (now - userData.lastDaily);

        if (
            userData.lastDaily &&
            remaining > 0
        ) {

            const hours =
                Math.floor(
                    remaining / 3600000
                );

            const minutes =
                Math.floor(
                    (remaining % 3600000) /
                    60000
                );

            return interaction.reply({
                content:
                    `⏳ **You already claimed your daily!**\n` +
                    `Come back in **${hours}h ${minutes}m**.`
            });
        }

        const reward = random(500, 1500);

        userData.wallet += reward;
        userData.lastDaily = now;

        saveEconomy();

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("🎁 DAILY REWARD")
            .setDescription(
                `## 💰 +${formatMoney(reward)} Money\n\n` +
                `💵 **Wallet:** ` +
                `${formatMoney(userData.wallet)} Money`
            )
            .setFooter({
                text: "Come back tomorrow for another reward!"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // WORK
    // =================================================

    if (interaction.commandName === "work") {

        const userData =
            getUser(interaction.user.id);

        const now = Date.now();
        const cooldown = 60 * 60 * 1000;

        const remaining =
            cooldown -
            (now - userData.lastWork);

        if (
            userData.lastWork &&
            remaining > 0
        ) {

            const minutes =
                Math.ceil(
                    remaining / 60000
                );

            return interaction.reply({
                content:
                    `⏳ **You're tired bro 😭**\n` +
                    `Work again in **${minutes} minutes**.`
            });
        }

        const reward = random(100, 500);

        const jobs = [
            "worked at a gaming store 🎮",
            "fixed someone's PC 💻",
            "developed a Discord bot 🤖",
            "won a Minecraft tournament 🏆",
            "sold some virtual items 💰",
            "worked for S1N 🔥"
        ];

        const job =
            jobs[
                Math.floor(
                    Math.random() * jobs.length
                )
            ];

        userData.wallet += reward;
        userData.lastWork = now;

        saveEconomy();

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("💼 WORK")
            .setDescription(
                `**${job}**\n\n` +
                `💵 You earned **${formatMoney(reward)} Money**!\n\n` +
                `Wallet: **${formatMoney(userData.wallet)} Money**`
            )
            .setFooter({
                text: "S1N Member Bot • Economy"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // SEND
    // =================================================

    if (interaction.commandName === "send") {

        const target =
            interaction.options.getUser("user");

        const amount =
            interaction.options.getInteger("amount");

        if (
            target.id ===
            interaction.user.id
        ) {
            return interaction.reply({
                content:
                    "💀 **Bro you can't send Money to yourself.**"
            });
        }

        if (target.bot) {
            return interaction.reply({
                content:
                    "🤖 **You can't send Money to bots.**"
            });
        }

        const senderData =
            getUser(interaction.user.id);

        const receiverData =
            getUser(target.id);

        if (
            senderData.wallet < amount
        ) {
            return interaction.reply({
                content:
                    `❌ **Not enough Money.**\n` +
                    `You only have **${formatMoney(senderData.wallet)} Money** in your wallet.`
            });
        }

        senderData.wallet -= amount;
        receiverData.wallet += amount;

        saveEconomy();

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("💸 MONEY SENT")
            .setDescription(
                `${interaction.user} sent **${formatMoney(amount)} Money** to ${target}.\n\n` +
                `💵 Your wallet: **${formatMoney(senderData.wallet)} Money**`
            )
            .setFooter({
                text: "S1N Member Bot • Economy"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // DEPOSIT
    // =================================================

    if (interaction.commandName === "deposit") {

        const amount =
            interaction.options.getInteger("amount");

        const userData =
            getUser(interaction.user.id);

        if (userData.wallet < amount) {
            return interaction.reply({
                content:
                    `❌ You only have **${formatMoney(userData.wallet)} Money** in your wallet.`
            });
        }

        userData.wallet -= amount;
        userData.bank += amount;

        saveEconomy();

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("🏦 MONEY DEPOSITED")
            .setDescription(
                `You deposited **${formatMoney(amount)} Money**.\n\n` +
                `💵 Wallet: **${formatMoney(userData.wallet)} Money**\n` +
                `🏦 Bank: **${formatMoney(userData.bank)} Money**`
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // WITHDRAW
    // =================================================

    if (interaction.commandName === "withdraw") {

        const amount =
            interaction.options.getInteger("amount");

        const userData =
            getUser(interaction.user.id);

        if (userData.bank < amount) {
            return interaction.reply({
                content:
                    `❌ You only have **${formatMoney(userData.bank)} Money** in your bank.`
            });
        }

        userData.bank -= amount;
        userData.wallet += amount;

        saveEconomy();

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("🏦 MONEY WITHDRAWN")
            .setDescription(
                `You withdrew **${formatMoney(amount)} Money**.\n\n` +
                `💵 Wallet: **${formatMoney(userData.wallet)} Money**\n` +
                `🏦 Bank: **${formatMoney(userData.bank)} Money**`
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // ADD MONEY
    // =================================================

    if (interaction.commandName === "addmoney") {

        // SERVER OWNER ONLY
        if (
            interaction.guild.ownerId !==
            interaction.user.id
        ) {
            return interaction.reply({
                content:
                    "❌ **Permission denied.**\nOnly the **server owner** can use `/addmoney`.",
                ephemeral: true
            });
        }

        const target =
            interaction.options.getUser("user");

        const amount =
            interaction.options.getInteger("amount");

        if (target.bot) {
            return interaction.reply({
                content:
                    "❌ You can't add Money to a bot.",
                ephemeral: true
            });
        }

        const targetData =
            getUser(target.id);

        targetData.wallet += amount;

        saveEconomy();

        const embed = new EmbedBuilder()
            .setColor(0xffd166)
            .setTitle("👑 MONEY ADDED")
            .setDescription(
                `### 👑 Owner Economy Control\n\n` +
                `${target} received **${formatMoney(amount)} Money**.\n\n` +
                `💵 New wallet balance:\n` +
                `**${formatMoney(targetData.wallet)} Money**`
            )
            .setFooter({
                text: "S1N Member Bot • Owner Only"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // LEADERBOARD
    // =================================================

    if (interaction.commandName === "leaderboard") {

        const entries =
            Object.entries(economy.users);

        if (entries.length === 0) {
            return interaction.reply({
                content:
                    "🏆 **No economy data yet!**"
            });
        }

        entries.sort((a, b) => {

            const aTotal =
                a[1].wallet +
                a[1].bank;

            const bTotal =
                b[1].wallet +
                b[1].bank;

            return bTotal - aTotal;
        });

        const top =
            entries.slice(0, 10);

        let description = "";

        for (
            let i = 0;
            i < top.length;
            i++
        ) {

            const [userId, data] =
                top[i];

            const total =
                data.wallet +
                data.bank;

            let user;

            try {
                user =
                    await client.users.fetch(userId);
            } catch {
                user = null;
            }

            const username =
                user
                    ? user.username
                    : "Unknown User";

            const medals = [
                "🥇",
                "🥈",
                "🥉"
            ];

            const position =
                medals[i] ||
                `**${i + 1}.**`;

            description +=
                `${position} **${username}** — ` +
                `💰 **${formatMoney(total)} Money**\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0xffd166)
            .setTitle("🏆 S1N MONEY LEADERBOARD")
            .setDescription(description)
            .setFooter({
                text: "Wallet + Bank combined"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // =================================================
    // COINFLIP
    // =================================================

    if (interaction.commandName === "coinflip") {

        const amount =
            interaction.options.getInteger("amount");

        const choice =
            interaction.options.getString("choice");

        const userData =
            getUser(interaction.user.id);

        // GAMBLING USES WALLET ONLY
        if (userData.wallet < amount) {
            return interaction.reply({
                content:
                    `❌ You only have **${formatMoney(userData.wallet)} Money** in your wallet.`
            });
        }

        const result =
            Math.random() < 0.5
                ? "heads"
                : "tails";

        if (result === choice) {

            // Player receives original bet + profit
            userData.wallet += amount;

            saveEconomy();

            const embed = new EmbedBuilder()
                .setColor(0x57f287)
                .setTitle("🪙 COINFLIP")
                .setDescription(
                    `🪙 The coin landed on **${result.toUpperCase()}**!\n\n` +
                    `🎉 **YOU WON!**\n` +
                    `💰 Profit: **+${formatMoney(amount)} Money**\n\n` +
                    `Wallet: **${formatMoney(userData.wallet)} Money**`
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });

        } else {

            userData.wallet -= amount;

            saveEconomy();

            const embed = new EmbedBuilder()
                .setColor(0xed4245)
                .setTitle("🪙 COINFLIP")
                .setDescription(
                    `🪙 The coin landed on **${result.toUpperCase()}**!\n\n` +
                    `💀 **YOU LOST!**\n` +
                    `💸 Lost: **${formatMoney(amount)} Money**\n\n` +
                    `Wallet: **${formatMoney(userData.wallet)} Money**`
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }
    }

    // =================================================
    // DICE
    // =================================================

    if (interaction.commandName === "dice") {

        const amount =
            interaction.options.getInteger("amount");

        const userData =
            getUser(interaction.user.id);

        // GAMBLING USES WALLET ONLY
        if (userData.wallet < amount) {
            return interaction.reply({
                content:
                    `❌ You only have **${formatMoney(userData.wallet)} Money** in your wallet.`
            });
        }

        const playerRoll =
            random(1, 6);

        const botRoll =
            random(1, 6);

        if (playerRoll > botRoll) {

            userData.wallet += amount;

            saveEconomy();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x57f287)
                        .setTitle("🎲 DICE")
                        .setDescription(
                            `🎲 **You:** ${playerRoll}\n` +
                            `🤖 **S1N:** ${botRoll}\n\n` +
                            `🏆 **YOU WON!**\n` +
                            `💰 Profit: **+${formatMoney(amount)} Money**\n\n` +
                            `💵 Wallet: **${formatMoney(userData.wallet)} Money**`
                        )
                        .setTimestamp()
                ]
            });

        } else if (playerRoll < botRoll) {

            userData.wallet -= amount;

            saveEconomy();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xed4245)
                        .setTitle("🎲 DICE")
                        .setDescription(
                            `🎲 **You:** ${playerRoll}\n` +
                            `🤖 **S1N:** ${botRoll}\n\n` +
                            `💀 **YOU LOST!**\n` +
                            `💸 Lost: **${formatMoney(amount)} Money**\n\n` +
                            `💵 Wallet: **${formatMoney(userData.wallet)} Money**`
                        )
                        .setTimestamp()
                ]
            });

        } else {

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xffd166)
                        .setTitle("🎲 DICE")
                        .setDescription(
                            `🎲 **You:** ${playerRoll}\n` +
                            `🤖 **S1N:** ${botRoll}\n\n` +
                            `🤝 **DRAW!**\n` +
                            `Your Money was returned.`
                        )
                        .setTimestamp()
                ]
            });
        }
    }

    // =================================================
    // SLOTS
    // =================================================

    if (interaction.commandName === "slots") {

        const amount =
            interaction.options.getInteger("amount");

        const userData =
            getUser(interaction.user.id);

        // GAMBLING USES WALLET ONLY
        if (userData.wallet < amount) {
            return interaction.reply({
                content:
                    `❌ You only have **${formatMoney(userData.wallet)} Money** in your wallet.`
            });
        }

        const symbols = [
            "🍒",
            "🍋",
            "🍉",
            "⭐",
            "💎",
            "7️⃣"
        ];

        const a =
            symbols[
                random(0, symbols.length - 1)
            ];

        const b =
            symbols[
                random(0, symbols.length - 1)
            ];

        const c =
            symbols[
                random(0, symbols.length - 1)
            ];

        let multiplier = 0;

        if (
            a === b &&
            b === c
        ) {

            if (a === "7️⃣") {
                multiplier = 10;
            } else if (a === "💎") {
                multiplier = 7;
            } else if (a === "⭐") {
                multiplier = 5;
            } else {
                multiplier = 3;
            }

        } else if (
            a === b ||
            b === c ||
            a === c
        ) {
            multiplier = 1.5;
        }

        // Remove bet first
        userData.wallet -= amount;

        if (multiplier > 0) {

            const winnings =
                Math.floor(
                    amount * multiplier
                );

            userData.wallet += winnings;

            saveEconomy();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x57f287)
                        .setTitle("🎰 S1N SLOTS")
                        .setDescription(
                            `# ${a} | ${b} | ${c}\n\n` +
                            `🎉 **YOU WON!**\n\n` +
                            `💰 Winnings: **+${formatMoney(winnings)} Money**\n` +
                            `💵 Wallet: **${formatMoney(userData.wallet)} Money**`
                        )
                        .setTimestamp()
                ]
            });

        } else {

            saveEconomy();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xed4245)
                        .setTitle("🎰 S1N SLOTS")
                        .setDescription(
                            `# ${a} | ${b} | ${c}\n\n` +
                            `💀 **YOU LOST!**\n\n` +
                            `💸 Lost: **${formatMoney(amount)} Money**\n` +
                            `💵 Wallet: **${formatMoney(userData.wallet)} Money**`
                        )
                        .setTimestamp()
                ]
            });
        }
    }

    // =================================================
    // LOVE
    // =================================================

    if (interaction.commandName === "love") {

        const user =
            interaction.options.getUser("user");

        if (
            user.id ===
            interaction.user.id
        ) {

            const embed =
                new EmbedBuilder()
                    .setColor(0xff4d88)
                    .setTitle("💗 LOVE MATCH")
                    .setDescription(
                        `### ${interaction.user} ❤️ Themselves\n\n` +
                        `## **∞%**\n` +
                        `💗💗💗💗💗💗💗💗💗💗\n\n` +
                        `**😭 bro is in love with himself**`
                    )
                    .setThumbnail(
                        interaction.user.displayAvatarURL({
                            extension: "png",
                            size: 256
                        })
                    )
                    .setFooter({
                        text: "S1N Member Bot • Love Calculator"
                    })
                    .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        const percentage =
            Math.floor(
                Math.random() * 101
            );

        const filledBlocks =
            Math.round(
                percentage / 10
            );

        const progressBar =
            "❤️".repeat(filledBlocks) +
            "🖤".repeat(
                10 - filledBlocks
            );

        let loveMessage;
        let titleEmoji;

        if (percentage <= 10) {

            titleEmoji = "💀";

            loveMessage = [
                "even S1N can't save this relationship 💀",
                "bro got rejected by the algorithm 😭",
                "there is literally NOTHING here 💀",
                "just move on lil bro 😭"
            ][random(0, 3)];

        } else if (percentage <= 30) {

            titleEmoji = "💔";

            loveMessage = [
                "bro just move on 😭",
                "it's giving just friends 💀",
                "there's barely anything here 😭",
                "the relationship is fighting for its life 💀"
            ][random(0, 3)];

        } else if (percentage <= 50) {

            titleEmoji = "❤️";

            loveMessage = [
                "there's something... but don't get your hopes up 😭",
                "the algorithm is confused about you two 💀",
                "maybe there's a tiny chance 👀",
                "hmm... questionable 😭"
            ][random(0, 3)];

        } else if (percentage <= 70) {

            titleEmoji = "💕";

            loveMessage = [
                "okayyy, there's definitely something going on 👀",
                "you two might actually have something 😭",
                "not bad... not bad at all 👀",
                "S1N sees potential ❤️"
            ][random(0, 3)];

        } else if (percentage <= 89) {

            titleEmoji = "💖";

            loveMessage = [
                "nahhh you two actually got chemistry 👀",
                "bro just marry them already 😭❤️",
                "you two are actually made for each other 💕",
                "okay this is getting serious 😭"
            ][random(0, 3)];

        } else if (percentage <= 98) {

            titleEmoji = "💘";

            loveMessage = [
                "BRO THEY LOVE YOU SO MUCH 😭❤️",
                "stop pretending you're not in love 💀❤️",
                "THIS IS ACTUALLY CRAZY 😭",
                "bro found the one 💘"
            ][random(0, 3)];

        } else {

            titleEmoji = "💍";

            loveMessage = [
                "THIS IS TRUE LOVE. Someone get the wedding invitations ready 😭",
                "BRO JUST MARRY THEM ALREADY 😭❤️",
                "S1N HAS OFFICIALLY APPROVED THE RELATIONSHIP. 😭❤️",
                "100%. THERE IS NO ESCAPE NOW 💍💀"
            ][random(0, 3)];
        }

        const user1Avatar =
            interaction.user.displayAvatarURL({
                extension: "png",
                size: 256
            });

        const user2Avatar =
            user.displayAvatarURL({
                extension: "png",
                size: 256
            });

        const embed =
            new EmbedBuilder()
                .setColor(0xff4d88)
                .setTitle(
                    `${titleEmoji} LOVE MATCH`
                )
                .setDescription(
                    `### ${interaction.user} ❤️ ${user}\n\n` +
                    `## **${percentage}%**\n` +
                    `${progressBar}\n\n` +
                    `**${loveMessage}**`
                )
                .setThumbnail(user1Avatar)
                .setImage(user2Avatar)
                .setFooter({
                    text: "S1N Member Bot • Love Calculator"
                })
                .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
});

// =====================================================
// LOGIN
// =====================================================

client.login(process.env.TOKEN);