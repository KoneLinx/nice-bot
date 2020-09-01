
// nice-bot :: src/Utils.js

// utilities to ease code use and make it more readable

module.exports.modelJson = ( obj, model ) =>
{
    Object.entries( model ).forEach(
        entry =>
        {
            if ( ! obj.hasOwnProperty( entry[ 0 ] )
                || typeof obj[ entry[ 0 ] ] != typeof entry[ 1 ] )
            {
                obj[ entry[ 0 ] ] = entry[ 1 ];
            }
            else if ( typeof entry[ 1 ] == typeof {} )
            {
                this.modelJson( obj[ entry[ 0 ] ], entry[ 1 ] );
            }
        }
    );
}

function getPathArrayOnObject( obj, path )
{
    return path.reduce(
        ( stack, prop ) =>
        {
            return stack[ prop ];
        },
        obj
    );
}

module.exports.getPathOnObject = ( obj, path ) =>
{
    return getPathArrayOnObject( obj, path.split( ' ' ) );
}

module.exports.callPathOnObject = ( obj, path, ...args ) =>
{
    path = path.split( '.' );
    return getPathArrayOnObject( obj, path.slice( 0, -1 ) )[ path.pop() ]( ...args );
}

module.exports.isPadded = ( string, prefix, postfix = prefix ) =>
{
    return string.startsWith( prefix ) && string.endsWith( postfix );
}

module.exports.cutPadding = ( string, prefix, postfix = prefix ) =>
{
    if ( postfix.length == 0 ) return string.substr( prefix.length );
    return string.slice( prefix.length, - postfix.length );
}

module.exports.mapJump = ( array, fn, jumpfn, beginvalue = 0 ) =>
{
    var out = [];
    for ( var index = beginvalue ; index < array.length ; index = jumpfn( index, array[ index ], array ) )
        out.push( fn( array[ index ], index, array ) );

    return out
}

module.exports.legacy_parseCmdArgs = ( input, delimeter = ' ' ) =>
{
    input = input.split( delimeter );
    return [ input.shift( ), input ];
}

const { exec } = require( 'child_process' );
module.exports.parseCmdArgs = ( input, callBack ) =>
{
    exec( `node lib/argentum ${ input }`,
        ( error, stdout, stderr ) =>
        {
            if ( error ) throw 1;
            var object = JSON.parse( stdout );
            callBack( object.args.shift(), object.args, object.opts );
        }
    )
}

module.exports.mention = ( user ) =>
{
    return `<@${ user.bot ? '!': '' }${ user.id }>`;
}