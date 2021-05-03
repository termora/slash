const { SlashCommand } = require('slash-create')

module.exports = class InviteCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'invite',
      description: 'Get an invite link for the bot'
    })
    this.filePath = __filename
  }

  async run (ctx) {
    await ctx.send({
      content: `Use this link to add me to your server: <https://discord.com/api/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&permissions=388160&scope=applications.commands%20bot>`,
      ephemeral: true
    })
  }
}
