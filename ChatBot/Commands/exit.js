module.exports = {
    name: 'exit',
    description: 'kills chatbot',
    execute(channel, userstate, params, connection) {
        process.exit();
    },
};