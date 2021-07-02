async function searchPages (ctx, terms) {
  const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

  let count = 0
  let page = 1
  const embeds = []

  let embed = {
    title: `Search results for "${ctx.options.query}"`,
    color: 0xd14171,
    footer: {
      text: `Results: ${terms.length} | Page ${page}/${Math.ceil(terms.length / 5)}`
    },
    fields: []
  }

  if (terms.length > 5) embed.description = 'Use ⬅️ ➡️ to navigate between pages and the numbers to choose a term.'

  for (const term of terms) {
    if (count >= 5) {
      embeds.push(embed)

      page += 1
      count = 0

      embed = {
        title: `Search results for "${ctx.options.query}"`,
        color: 0xd14171,
        footer: {
          text: `Results: ${terms.length} | Page ${page}/${Math.ceil(terms.length / 5)}`
        },
        fields: []
      }
    }
    count += 1

    let name = term.name
    if (term.aliases && term.aliases.length > 0) name += `, ${term.aliases.join(', ')}`

    let headline = term.headline

    if (!term.headline.startsWith(term.description.slice(0, 5))) {
      headline = '...' + headline
    }

    if (!term.headline.endsWith(term.description.slice(term.description.length - 5))) {
      headline = headline + '...'
    }

    embed.fields.push({
      name: '​',
      value: `${emoji[count - 1]} **${name}**\n${headline}`,
      inline: false
    })
  }

  if (embed.fields.length > 0) embeds.push(embed)

  return embeds
}

module.exports = searchPages
