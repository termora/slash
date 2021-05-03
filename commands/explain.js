const Sentry = require('@sentry/node')
const { SlashCommand, CommandOptionType } = require('slash-create')

module.exports = class ExplainCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'explain',
      description: 'Explain a topic',
      options: [{
        type: CommandOptionType.STRING,
        name: 'topic',
        description: 'Which topic to explain',
        required: true
      }]
    })
    this.filePath = __filename
    this.db = creator.db
  }

  async run (ctx) {
    const sql = 'select id, name, aliases, description, created, as_command from public.explanations where name ilike $1 or $1 ilike any(aliases) order by id desc limit 1'

    let res
    try {
      res = await this.db.query(sql, [ctx.options.topic])
    } catch (e) {
      this.creator.logger.error('Command define:', e)
      Sentry.captureException(e)
      await ctx.send({
        content: 'Internal error occurred.',
        ephemeral: true
      })
      return
    }

    if (res.rows.length === 0 || !res.rows[0]) {
      await ctx.send({
        content: "I couldn't find an explanation with that name.",
        ephemeral: true
      })
      return
    }

    await ctx.send({
      content: res.rows[0].description,
      allowedMentions: {
        everyone: false,
        roles: false,
        users: false
      }
    })
  }
}
