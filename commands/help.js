const { SlashCommand } = require('slash-create')

const embed = {
  title: 'Help',
  color: 0xd14171,
  description: `This is a version of Termora using slash commands! For all features, please use the full version of the bot.\n\nIf you invited the bot using its normal invite link, simply use \`t;help\` for info about that version; otherwise, you can invite the bot with [this link](https://discord.com/api/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&permissions=388160&scope=applications.commands%20bot).`,
  fields: [{
    name: 'Commands',
    value: '`/search`: search for terms.' +
                '\n\n`/define`: define a single term.' +
                '\n\n`/random`: show a random term' +
                '\n\n`/explain nv`, `/explain sv`, `/explain plurality`, `/explain typing quirks`: quickly explain non-verbality, semi-verbality, plurality and proxying, and typing quirks.'
  }, {
    name: 'Source code',
    value: 'The source code for the slash commands is available [here](https://github.com/termora/slash), the source code for the rest of the bot is available [here](https://github.com/termora/berry).'
  }]
}

module.exports = class HelpCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'help',
      description: 'Show information about the bot'
    })
    this.filePath = __filename
  }

  async run (ctx) {
    if (process.env.SUPPORT_SERVER) {
      embed.fields.push({
        name: 'Support server',
        value: `Use this link to join the support server, for bot questions and term additions/requests: ${process.env.SUPPORT_SERVER}`
      })
    }

    await ctx.send({ embeds: [embed] })
  }
}
