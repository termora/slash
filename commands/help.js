const { SlashCommand } = require('slash-create');

module.exports = class HelpCommand extends SlashCommand {
    constructor(creator) {
        super(creator, {
            name: 'help',
            description: 'Show information about the bot'
        });
        this.filePath = __filename;
    }

    async run(ctx) {
        let embed = {
            title: "Help",
            color: 0xd14171,
            description: `This is a version of Termora using slash commands! For all features, please use the full version of the bot.\n\nIf you invited the bot using its normal invite link, simply use \`t;help\` for info about that version; otherwise, you can invite the bot with [this link](https://discord.com/api/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&permissions=388160&scope=applications.commands%20bot).`,
            fields: [{
                name: "Commands",
                value: "`/search`: search for terms in the database. This will only show a maximum of 5 results, for more, please use `t;search` or the website." +
                    "\n\n`/define`: define a single term.`" +
                    "\n\n`/explain nv`, `/explain sv`, `/explain plurality`, `/explain typing quirks`: quickly explain non-verbality, semi-verbality, plurality and proxying, and typing quirks."
            }, {
                name: "Source code",
                value: "The source code for the slash commands are available [here](https://github.com/termora/slash), the source code for the rest of the bot is available [here](https://github.com/termora/berry).",
            }]
        }

        await ctx.send({ embeds: [embed] });
        return;
    }
}