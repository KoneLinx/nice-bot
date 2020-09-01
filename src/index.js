
const Bot = require('./Bot');

module.exports = ( botData ) =>
{

    // no login when in debug mode
    new Bot( botData, botData.debug ? true : ! botData.debug );

};
