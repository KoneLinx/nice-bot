module.exports = ( input ) =>
{
    return {
            input: input.join( ' ' ),
            opts: require( './src/argentum' ).parse( input ),
            args: input
    }
}
//module.exports = require( './src/argentum' ).parse;