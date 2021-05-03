const Sentry = require("@sentry/node");
const { SlashCommand, CommandOptionType } = require('slash-create');

const { termEmbed } = require("../termEmbed");

module.exports = class SearchCommand extends SlashCommand {
    constructor(creator) {
        super(creator, {
            name: 'search',
            description: 'Search for terms (maximum of 5 results)',
            options: [{
                type: CommandOptionType.STRING,
                name: 'query',
                description: 'What to search for',
                required: true,
            }]
        });
        this.filePath = __filename;
        this.db = creator.db;
    }

    async run(ctx) {
        const query = `select
        t.id, t.category, c.name as category_name, t.name, t.aliases, t.description, t.note, t.source, t.created, t.last_modified, t.flags, t.tags, t.content_warnings, t.image_url,
        array(select display from public.tags where normalized = any(t.tags)) as display_tags,
        ts_rank_cd(t.searchtext, websearch_to_tsquery('english', $1), 8) as rank,
        ts_headline(t.description, websearch_to_tsquery('english', $1), 'StartSel=**, StopSel=**') as headline
        from public.terms as t, public.categories as c
        where t.searchtext @@ websearch_to_tsquery('english', $1) and t.category = c.id and t.flags & 1 = 0
        order by rank desc
        limit 5`;

        if (ctx.guildID) {
            try {
                let res = await this.db.query("select $1 = any(server.blacklist) as blacklisted from (select * from public.servers where id = $2) as server", [ctx.channelID, ctx.guildID]);

                if (res.rows[0].blacklisted) {
                    await ctx.send({
                        content: "This channel is blacklisted from commands.",
                        ephemeral: true
                    });
                    return;
                }
            } catch (e) {
                this.creator.logger.error("Command define:", e);
                Sentry.captureException(e);
                await ctx.send({
                    content: "Internal error occurred.",
                    ephemeral: true
                });
                return;
            }
        }

        await ctx.defer();

        let res;
        try {
            res = await this.db.query(query, [ctx.options.query]);
        } catch (e) {
            this.creator.logger.error("Command search:", e);
            Sentry.captureException(e);
            await ctx.editOriginal("An internal error occurred.");
            return;
        }

        if (res.rows.length == 0) {
            let text = "No results with that name found.";
            text += process.env.WEBSITE ? `\nTry [the website](${process.env.WEBSITE}) for a list of terms and more in-depth search.` : "";

            await ctx.editOriginal(text);
            return;
        }

        if (res.rows.length == 1) {
            const term = res.rows[0]
            await ctx.editOriginal({
                embeds: [termEmbed(term)]
            })
            return;
        }

        let respFields = [];
        for (const term of res.rows) {
            let headline = term.headline;

            if (!term.headline.startsWith(term.description.slice(0, 5))) {
                headline = "..." + headline
            }

            if (!term.headline.endsWith(term.description.slice(term.description.length - 5))) {
                headline = headline + "..."
            }

            respFields.push({
                name: '_ _',
                value: `**▶️ ${term.name}${term.aliases.length > 0 ? ", " + term.aliases.join(', ') : ''}**\n${headline}`
            });
        }

        respFields.push({
            name: "_ _",
            value: "To get a term's full description, use `/define term`."
        });

        let url = process.env.WEBSITE ? `${process.env.WEBSITE}/search/?q=${encodeURIComponent(ctx.options.query)}` : null;

        let resp = {
            embeds: [{
                color: 0xd14171,
                title: `Search results for "${ctx.options.query}"`,
                url: url,
                description: url ? `Please use [the website](${url}) for more in-depth search results!` : '',
                fields: respFields
            }]
        };

        try {
            await ctx.editOriginal(resp);
        } catch (e) {
            this.creator.logger.error("Command search:", e);
            Sentry.captureException(e);
            await ctx.editOriginal("Internal error occurred.");
        }
        return;
    }
}