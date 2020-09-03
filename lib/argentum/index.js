
// nice-bot :: argentum/index.js

/**
 * Parse argument value into js object. It parses booleans, integers and strings.
 *
 * @param  {string[]} input argv array to parse, default = process.argv.
 * @return { { input: string , opts: {}[], args: string[] } } Parsed object.
 */
module.exports = ( input = process.argv ) =>
{
    return {
            input: input.join( ' ' ),
            opts: require( './src/argentum' ).parse( input ),
            args: input
    }
}