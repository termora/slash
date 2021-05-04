const { SlashCommand, CommandOptionType } = require('slash-create')

const { wrapSentry, isBlacklisted } = require('../utils/utils')
const termEmbed = require('../utils/termEmbed')

const sql = `select
  t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.flags, t.tags, t.content_warnings, t.image_url,
  array(select display from public.tags where normalized = any(t.tags)) as display_tags,
  ts_rank_cd(t.searchtext, websearch_to_tsquery('english', $1), 8) as rank,
  ts_headline(t.description, websearch_to_tsquery('english', $1), 'StartSel=**, StopSel=**') as headline
  from public.terms as t, public.categories as c
  where t.searchtext @@ websearch_to_tsquery('english', $1) and t.category = c.id and t.flags & 1 = 0
  order by rank desc
  limit 5`

module.exports = class SearchCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'search',
      description: 'Search for terms (maximum of 5 results)',
      options: [{
        type: CommandOptionType.STRING,
        name: 'query',
        description: 'What to search for',
        required: true
      }]
    })
    this.filePath = __filename
    this.db = creator.db
  }

  async run (ctx) {
    await wrapSentry('query', this.creator.logger, ctx, async () => {
      if (await isBlacklisted(ctx, this.db)) return

      await ctx.defer()

      const res = await this.db.query(sql, [ctx.options.query])

      let resp

      switch (res.rows.length) {
        case 0: {
          resp = 'No results with that name found.' +
          (process.env.WEBSITE ? `\nTry [the website](${process.env.WEBSITE}) for a list of terms and more in-depth search.` : '')
          break
        }
        case 1: {
          const term = res.rows[0]
          resp = { embeds: [termEmbed(term)] }
          break
        }
        default: {
          const respFields = []
          for (const term of res.rows) {
            let headline = term.headline

            if (!term.headline.startsWith(term.description.slice(0, 5))) {
              headline = '...' + headline
            }

            if (!term.headline.endsWith(term.description.slice(term.description.length - 5))) {
              headline = headline + '...'
            }

            respFields.push({
              name: '_ _',
              value: `**▶️ ${term.name}${term.aliases.length > 0 ? ', ' + term.aliases.join(', ') : ''}**\n${headline}`
            })
          }

          respFields.push({
            name: '_ _',
            value: "To get a term's full description, use `/define term`."
          })

          const url = process.env.WEBSITE ? `${process.env.WEBSITE}/search/?q=${encodeURIComponent(ctx.options.query)}` : null

          resp = {
            embeds: [{
              color: 0xd14171,
              title: `Search results for "${ctx.options.query}"`,
              url: url,
              description: url ? `Please use [the website](${url}) for more in-depth search results!` : '',
              fields: respFields
            }]
          }

          break
        }
      }

      await ctx.editOriginal(resp)
    })
  }
}
