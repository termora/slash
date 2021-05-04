const Sentry = require('@sentry/node')

module.exports = {
  async wrapSentry (name, logger, ctx, func) {
    try {
      return await func()
    } catch (e) {
      logger.error(`Command ${name}`, e)
      Sentry.captureException(e)
      await ctx.send({
        content: 'Internal error occurred.',
        ephemeral: true
      })
    }
  },
  async isBlacklisted (ctx, db) {
    if (!ctx.guildID) return false

    const res = await db.query('select $1 = any(server.blacklist) as blacklisted from (select * from public.servers where id = $2) as server', [ctx.channelID, ctx.guildID])

    if (res.rows[0].blacklisted) {
      await ctx.send({
        content: 'This channel is blacklisted from commands.',
        ephemeral: true
      })
      return true
    }
  }
}
