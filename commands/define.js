const { SlashCommand, CommandOptionType } = require('slash-create')

const termEmbed = require('../utils/termEmbed')
const { wrapSentry, isBlacklisted } = require('../utils/utils')

const sql = `select
t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.content_warnings, t.flags, t.tags, t.image_url,
array(select display from public.tags where normalized = any(t.tags)) as display_tags
from public.terms as t, public.categories as c where (t.name ilike $1 or $1 ilike any(t.aliases)) and t.category = c.id limit 1`

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
    wrapSentry('define', this.creator.logger, ctx, async () => {
      if (await isBlacklisted(ctx, this.db)) return

      await ctx.defer()

      const res = await this.db.query(sql, [ctx.options.term])

      if (res.rows.length === 0) {
        let text = 'No term with that name found.\nTry `/search term`, perhaps?'
        text += process.env.WEBSITE ? `\nYou can also use [the website](${process.env.WEBSITE}) for a list of terms and more in-depth search.` : ''

        await ctx.editOriginal(text)
        return
      }

      await ctx.editOriginal({
        embeds: [termEmbed(res.rows[0])]
      })
    })
  }
}
