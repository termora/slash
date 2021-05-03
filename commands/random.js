const Sentry = require("@sentry/node");
const { SlashCommand, CommandOptionType } = require('slash-create');
const sample = require("lodash.sample");

const { termEmbed } = require("../termEmbed");

module.exports = class RandomCommand extends SlashCommand {
    constructor(creator) {
        super(creator, {
            name: 'random',
            description: 'Show a random term'
        });
        this.filePath = __filename;
        this.db = creator.db;
    }

    async run(ctx) {
        const sql = `select t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.content_warnings, t.flags, t.tags,
        array(select display from public.tags where normalized = any(t.tags)) as display_tags
        from public.terms as t, public.categories as c
        where t.flags & 2 = 0 and t.category = c.id
        order by t.id`

        await ctx.defer();

        let res;
        try {
            res = await this.db.query(sql);
        } catch (e) {
            this.creator.logger.error("Command random:", e);
            Sentry.captureException(e);
            await ctx.editOriginal("Internal error occurred.");
            return;
        }

        if (res.rows.length == 0) {
            await ctx.editOriginal("No terms found.");
            return;
        }

        let term = sample(res.rows);

        try {
            await ctx.editOriginal({
                embeds: [termEmbed(term)]
            });
        } catch (e) {
            this.creator.logger.error("Command define:", e);
            Sentry.captureException(e);
            await ctx.editOriginal("Internal error occurred.");
        }
        return;
    }
}