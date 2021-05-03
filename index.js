require('dotenv').config();

const { SlashCreator, FastifyServer } = require('slash-create');
const pg = require('pg');
const CatLoggr = require('cat-loggr');
const path = require('path');

const Sentry = require("@sentry/node");

Sentry.init({
    dsn: process.env.SENTRY_URL
});

const creator = new SlashCreator({
    applicationID: process.env.APPLICATION_ID,
    publicKey: process.env.PUBLIC_KEY,
    token: process.env.TOKEN,
    serverPort: process.env.PORT || 8080,
});

const logger = new CatLoggr().setLevel(process.env.COMMANDS_DEBUG === 'true' ? 'debug' : 'info');

creator.logger = logger;

creator.db = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

creator.on('debug', (message) => logger.log(message));
creator.on('warn', (message) => logger.warn(message));
creator.on('error', (error) => logger.error(error));
creator.on('synced', () => logger.info('Commands synced!'));
creator.on('commandRegister', (command) =>
    logger.info(`Registered command ${command.commandName}`));
creator.on('commandError', (command, error) => logger.error(`Command ${command.commandName}:`, error));

creator
    .withServer(new FastifyServer())
    .registerCommandsIn(path.join(__dirname, 'commands'))
    .syncCommands({
        deleteCommands: true,
    })
    .startServer();
