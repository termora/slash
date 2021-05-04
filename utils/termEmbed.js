function termEmbed (term) {
  const embed = {
    title: term.name,
    color: 0xd14171,
    timestamp: term.created,
    footer: {
      text: `ID: ${term.id} | Category: ${term.category_name} (ID: ${term.category})`
    },
    fields: []
  }

  let description = term.description
  let note = term.note
  let cw = term.content_warnings

  if (process.env.WEBSITE) {
    description = description.replaceAll('(##', `(${process.env.WEBSITE}/term/`)
    note = note.replaceAll('(##', `(${process.env.WEBSITE}/term/`)
    cw = cw.replaceAll('(##', `(${process.env.WEBSITE}/term/`)
  }

  embed.url = process.env.WEBSITE ? `${process.env.WEBSITE}/term/${encodeURIComponent(term.name)}` : null

  if (cw !== '') {
    description = `||${description}||`

    if (description.length < 1024) {
      embed.description = `**Content warning: ${cw}**`
      embed.fields.push({
        name: 'Description',
        value: description
      })
    } else {
      embed.description = description
      embed.fields.push({
        name: 'Content warning',
        value: `**Content warning: ${cw}**`
      })
    }
  } else {
    embed.description = description
  }

  if (term.aliases.length > 0) {
    embed.fields.push({
      name: 'Synonyms',
      value: term.aliases.join(', ')
    })
  }

  if (note !== '') {
    embed.fields.push({
      name: 'Note',
      value: note
    })
  }

  embed.fields.push({
    name: 'Source',
    value: term.source
  })

  if (term.display_tags.length > 0) {
    embed.fields.push({
      name: 'Tag(s)',
      value: term.display_tags.join(', ')
    })
  }

  return embed
}

module.exports = termEmbed
