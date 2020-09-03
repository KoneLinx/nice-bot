/**
 * perform word expansion like a posix-shell
 *
 * @param  { string } input String to expand.
 * @return { string[] } Expanded string.
 */
module.exports = ( input ) =>
{
    return require( './Release/wordexp.node' ).wordexp( input );
}