const { SlashCommand } = require('slash-create')
const sample = require('lodash.sample')

const { wrapSentry, isBlacklisted } = require('../utils/utils')
const termEmbed = require('../termEmbed')

const sql = `select t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.content_warnings, t.flags, t.tags,
array(select display from public.tags where normalized = any(t.tags)) as display_tags
from public.terms as t, public.categories as c
where t.flags & 2 = 0 and t.category = c.id
order by t.id`

module.exports = class RandomCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'random',
      description: 'Show a random term'
    })
    this.filePath = __filename
    this.db = creator.db
  }

  async run (ctx) {
    await wrapSentry('random', ctx, async () => {
      if (await isBlacklisted(ctx, this.db)) return

      await ctx.defer()

      const res = await this.db.query(sql)

      if (res.rows.length === 0) {
        await ctx.editOriginal('No terms found.')
        return
      }

      const term = sample(res.rows)

      await ctx.editOriginal({
        embeds: [termEmbed(term)]
      })
    })
  }
}
