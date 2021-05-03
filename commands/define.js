const Sentry = require('@sentry/node')
const { SlashCommand, CommandOptionType } = require('slash-create')

const { termEmbed } = require('../termEmbed')

module.exports = class DefineCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'define',
      description: 'Define a term',
      options: [{
        type: CommandOptionType.STRING,
        name: 'term',
        description: 'Which term to show the definition for',
        required: true
      }]
    })
    this.filePath = __filename
    this.db = creator.db
  }

  async run (ctx) {
    const query = `select
        t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.content_warnings, t.flags, t.tags, t.image_url,
        array(select display from public.tags where normalized = any(t.tags)) as display_tags
        from public.terms as t, public.categories as c where (t.name ilike $1 or $1 ilike any(t.aliases)) and t.category = c.id limit 1`

    if (ctx.guildID) {
      try {
        const res = await this.db.query('select $1 = any(server.blacklist) as blacklisted from (select * from public.servers where id = $2) as server', [ctx.channelID, ctx.guildID])

        if (res.rows[0].blacklisted) {
          await ctx.send({
            content: 'This channel is blacklisted from commands.',
            ephemeral: true
          })
          return
        }
      } catch (e) {
        this.creator.logger.error('Command define:', e)
        Sentry.captureException(e)
        await ctx.send({
          content: 'Internal error occurred.',
          ephemeral: true
        })
        return
      }
    }

    await ctx.defer()

    let res
    try {
      res = await this.db.query(query, [ctx.options.term])
    } catch (e) {
      this.creator.logger.error('Command define:', e)
      Sentry.captureException(e)
      await ctx.editOriginal('Internal error occurred.')
      return
    }

    if (res.rows.length === 0) {
      let text = 'No term with that name found.\nTry `/search term`, perhaps?'
      text += process.env.WEBSITE ? `\nYou can also use [the website](${process.env.WEBSITE}) for a list of terms and more in-depth search.` : ''

      await ctx.editOriginal(text)
      return
    }

    const resp = {
      embeds: [termEmbed(res.rows[0])]
    }

    try {
      await ctx.editOriginal(resp)
    } catch (e) {
      this.creator.logger.error('Command define:', e)
      Sentry.captureException(e)
      await ctx.editOriginal('Internal error occurred.')
    }
  }
}
