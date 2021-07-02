const { SlashCommand, CommandOptionType, ComponentType, ButtonStyle } = require('slash-create')

const { wrapSentry, isBlacklisted } = require('../utils/utils')
const termEmbed = require('../utils/termEmbed')
const searchPages = require('../utils/searchPages')

const sql = `select
  t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.flags, t.tags, t.content_warnings, t.image_url,
  array(select display from public.tags where normalized = any(t.tags)) as display_tags,
  ts_rank_cd(t.searchtext, websearch_to_tsquery('english', $1), 8) as rank,
  ts_headline(t.description, websearch_to_tsquery('english', $1), 'StartSel=**, StopSel=**') as headline
  from public.terms as t, public.categories as c
  where t.searchtext @@ websearch_to_tsquery('english', $1) and t.category = c.id and t.flags & 1 = 0
  order by rank desc
  limit 50`

module.exports = class SearchCommand extends SlashCommand {
  constructor (creator) {
    super(creator, {
      name: 'search',
      description: 'Search for terms',
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
      let embeds = []

      switch (res.rows.length) {
        case 0: {
          resp = 'No results with that name found.' +
          (process.env.WEBSITE ? `\nTry [the website](<${process.env.WEBSITE}>) for a list of terms and more in-depth search.` : '')
          break
        }
        case 1: {
          const term = res.rows[0]
          resp = { embeds: [termEmbed(term)] }
          break
        }
        default: {
          embeds = await searchPages(ctx, res.rows)
          let page = 0

          const components = [{
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                custom_id: 'term_1',
                label: '1'
              },
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                custom_id: 'term_2',
                label: '2'
              },
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                custom_id: 'term_3',
                label: '3'
              },
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                custom_id: 'term_4',
                label: '4'
              },
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.PRIMARY,
                custom_id: 'term_5',
                label: '5'
              }
            ]
          }]

          resp = {
            embeds: [embeds[0]],
            components: components
          }

          await ctx.editOriginal({ embeds: [embeds[0]] })

          ctx.registerComponent('term_1', async (btnCtx) => {
            if (ctx.user.id !== btnCtx.user.id) {
              await btnCtx.acknowledge()
              return
            }

            let n = 0
            n += page * 5

            if (n >= res.rows.length) {
              await btnCtx.acknowledge()
              return
            }

            await btnCtx.editParent({
              embeds: [termEmbed(res.rows[n])],
              components: []
            })
          })

          ctx.registerComponent('term_2', async (btnCtx) => {
            if (ctx.user.id !== btnCtx.user.id) {
              await btnCtx.acknowledge()
              return
            }

            let n = 1
            n += page * 5

            if (n >= res.rows.length) {
              await btnCtx.acknowledge()
              return
            }

            await btnCtx.editParent({
              embeds: [termEmbed(res.rows[n])],
              components: []
            })
          })

          ctx.registerComponent('term_3', async (btnCtx) => {
            if (ctx.user.id !== btnCtx.user.id) {
              await btnCtx.acknowledge()
              return
            }

            let n = 2
            n += page * 5

            if (n >= res.rows.length) {
              await btnCtx.acknowledge()
              return
            }

            await btnCtx.editParent({
              embeds: [termEmbed(res.rows[n])],
              components: []
            })
          })

          ctx.registerComponent('term_4', async (btnCtx) => {
            if (ctx.user.id !== btnCtx.user.id) {
              await btnCtx.acknowledge()
              return
            }

            let n = 3
            n += page * 5

            if (n >= res.rows.length) {
              await btnCtx.acknowledge()
              return
            }

            await btnCtx.editParent({
              embeds: [termEmbed(res.rows[n])],
              components: []
            })
          })

          ctx.registerComponent('term_5', async (btnCtx) => {
            if (ctx.user.id !== btnCtx.user.id) {
              await btnCtx.acknowledge()
              return
            }

            let n = 4
            n += page * 5

            if (n >= res.rows.length) {
              await btnCtx.acknowledge()
              return
            }

            await btnCtx.editParent({
              embeds: [termEmbed(res.rows[n])],
              components: []
            })
          })

          if (embeds.length > 1) {
            components.push({
              type: ComponentType.ACTION_ROW,
              components: [
                {
                  type: ComponentType.BUTTON,
                  style: ButtonStyle.PRIMARY,
                  custom_id: 'prev_page',
                  emoji: {
                    name: '⬅️'
                  }
                },
                {
                  type: ComponentType.BUTTON,
                  style: ButtonStyle.PRIMARY,
                  custom_id: 'next_page',
                  emoji: {
                    name: '➡️'
                  }
                }
              ]
            })

            ctx.registerComponent('prev_page', async (btnCtx) => {
              if (ctx.user.id !== btnCtx.user.id) {
                await btnCtx.acknowledge()
                return
              }

              let newPage = page - 1
              if (newPage < 0) {
                newPage = embeds.length - 1
              } else if (newPage > embeds.length - 1) {
                newPage = 0
              }

              page = newPage

              await btnCtx.editParent({
                embeds: [embeds[newPage]],
                components: components
              })
            })

            ctx.registerComponent('next_page', async (btnCtx) => {
              if (ctx.user.id !== btnCtx.user.id) {
                await btnCtx.acknowledge()
                return
              }

              let newPage = page + 1
              if (newPage < 0) {
                newPage = embeds.length - 1
              } else if (newPage > embeds.length - 1) {
                newPage = 0
              }

              page = newPage

              await btnCtx.editParent({
                embeds: [embeds[newPage]],
                components: components
              })
            })
          }

          break
        }
      }

      await ctx.editOriginal(resp)
    })
  }
}
