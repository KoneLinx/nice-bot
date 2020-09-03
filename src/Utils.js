
// nice-bot :: src/Utils.js

// utilities to ease code use and make it more readable

/**
 * Model an object to match the model.
 * Obj modified by reference.
 * 
 * @param { {} } obj Object to model.
 * @param { {} } model Model object
 */
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
            return ( stack ?? {} )[ prop ];
        },
        obj
    );
}

/**
 * Get data from path of object.
 *
 * @param { any } obj Object holding the data.
 * @param { string } path Path to apply on the data object.
 * @return { any | undefined } Value found at path. undefined if nonexistent.
 */
module.exports.getPathOnObject = ( obj, path ) =>
{
    return getPathArrayOnObject( obj, path.split( '.' ) );
}

/**
 * Call funtion by path of object.
 *
 * @param { any } obj Object holding the data.
 * @param { string } path Path to apply on the data object.
 * @return { any | undefined } Value returned by the funtion found at path. undefined if nonexistent.
 */
module.exports.callPathOnObject = ( obj, path, ...args ) =>
{
    path = path.split( '.' );
    return ( getPathArrayOnObject( obj, path.slice( 0, -1 ) ) ?? {} )[ path.pop() ]( ...args );
}

/**
 * Check whether the string a padded with a preix and postfix.
 *
 * @param { string } string String to test.
 * @param { string } prefix Prefix.
 * @param { string } postfix Postfix. Prefix if omitted
 * @return { boolean } test result.
 */
module.exports.isPadded = ( string, prefix, postfix = prefix ) =>
{
    return string.startsWith( prefix ) && string.endsWith( postfix );
}

/**
 * Check whether the string a padded with a preix and postfix.
 * Object modified by reference.
 * 
 * @param { string } string String to modify.
 * @param { string } prefix Prefix.
 * @param { string } postfix Postfix. Prefix if omitted
 */
module.exports.cutPadding = ( string, prefix, postfix = prefix ) =>
{
    string = string.slice(
        string.startsWith( prefix ) ? prefix.length : 0,
        string.endsWith( postfix ) ? ( postfix.length == 0 ? ( -1 >>> 0 ) : - postfix.length ) : -1 >>> 0
    );
    return string;
}

/**
 * Similar to Array.prototype.map().
 * Instead, rely on jumpCallBack to sequence indecies 
 * 
 * @param { any[] } array array.
 * @param { } callBack Main callBack function.
 * @param { } jumpCallBack Index jump function. ++index if omitted
 * @param { number } beginValue Starting value. 0 if omitted
 */
module.exports.mapJump = ( array, callBack, jumpCallBack = ( i ) => { ++i; }, beginValue = 0 ) =>
{
    var out = [];
    for ( var index = beginValue ; index < array.length ; index = jumpfn( index, array[ index ], array ) )
        out.push( fn( array[ index ], index, array ) );

    return out
}

//legacy
/*
module.exports.legacy_parseCmdArgs = ( input, delimeter = ' ' ) =>
{
    input = input.split( delimeter );
    return [ input.shift( ), input ];
}
*/

//legacy
/*
const { exec } = require( 'child_process' );
module.exports.legacy2_parseCmdArgs = ( input, callBack ) =>
{
    exec( `node lib/argentum ${ input }`,
        ( error, stdout, stderr ) =>
        {
            if ( error )
            {
                console.log( error );
                throw 1;
            }
            var object = JSON.parse( stdout );
            callBack( object.args.shift(), object.args, object.opts );
        }
    );
}
*/

// Nope
/*
module.exports.devparseCmdArgs = ( input ) =>
{
    var delimeter = ' ', captureChars = [ '"', '"', '`' ], out = [];

    while ( input.length > 0 )
    {
        var capturePairs = captureChars.map( char =>
            {
                return [ char, input.indexOf( char ) >>> 0 ];
            }
        );
        var first = capturePairs.slice( 1 ).reduce(
            ( smallest, pair ) =>
            {
                return smallest[ 1 ] < pair[ 1 ] ? smallest : pair;
            },
            capturePairs[ 0 ]
        );
        
        var part = input.slice( 0, first[ 1 ] );
        out.push( part.slice( part.startsWith( delimeter ), part.endsWith( delimeter ) ? -1 : -1>>>0 ).split( delimeter ) );
        
        input = input.slice( first[ 1 ] + 1 );
        if ( input.length > 0 )
        {
            out.push( input.slice( 0, first[ 1 ] = input.indexOf( first[ 0 ] ) ) );
            input = input.slice( first[ 1 ] + 1 );
        }

        console.log( out );
        console.log( input );
    }

    return out.flat();
}
*/

module.exports.mention = ( user ) =>
{
    return `<@${ user.bot ? '!': '' }${ user.id }>`;
}


const ARGENTUM = require( '../lib/argentum' );
const WORDEXP = require( '../lib/wordexp.js' );
/**
 * Preform word expand on input string and parse it into an object.
 * 
 * @param { string } input Input string to word expand and parse.
 * @return { [ string, string[], any ] } [ cmd, args, opts ]. Parsed values.
 */
module.exports.parseCmdArgs = ( input ) =>
{
    var parsed = ARGENTUM( WORDEXP( input ) );
    return [ parsed.args.shift( ), parsed.args, parsed.opts ];
}


/**
 * Preform word expand on input string and parse it into an object.
 * 
 * @param { input } input Input string to word expand and parse.
 * @return { {} } Object containg parsed input.
 */
module.exports.legacy3parseCmdArgs = ( input ) =>
{

    // the worst code in the universe lies ahead. Only those willing to vomit shall proceed
    // MMMMMMMMMMMMMMMMMMMMMMMNdNMMMMMMMMMMMMMMNNNNNNNNNNNNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMdo/odMMMMMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMMMMmmNMMMMMMMMMMMMMNNNNNNNNNNNNNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNh+/omMMMMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMm+++yNd+++yMMh+:--/smMMd++++No+++hMMMMMNy+:--/odMMd+++oMo+++dMMm+++++oMMMd+++oMMMN////NMMMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMM-  `N:  `mM:   :`  `hMs   `N-   oMMMMM/   :.   hMs   .M`   sMMo      mMMs   `MMMm    dMMMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMd   s`  oMd    N/   /Ms   `N-   oMMMMN`   do```oMs   .M`   sMM:  ``  sMMs   `MMMm    dNMMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMM/  `  .NMd    N/   /Ms   `N-   oMMMMM/   `/ymNNMs   `o`   sMN`  /-  :MMs   `MMMm    ddMMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMMm`    yMMh    N/   -Ms   `N-   oMMMMMNs-    .oNMs         sMh   s/  `NMs   `MMMm    dymMMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMNd+   -MMMd    N/   :Ms   `N-   oMMMMMdhhs+.   /Ms   `h`   sMo   o/   hMs   `MMMm    dsdmMMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMdhs   +MMMd    N/   /My   `N-   oMNmhm:  `mh   .Ms   .M`   sM-        +Ms   `mmNm    hyddNMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMMyms   +MMMN-   +.   yMm`   +`  `hs:-.oo   /:   /Ms   .M`   sN`   yy   .Ms    ``om    ``:NmMMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMmhNh:::sMMMMNo:-..-+dMMMmo:-..-/o:``..-o+:-..-:oyyh:::/M/:::hm::::Nm::::Nh::::::sm::::::+myNMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMMhmMMMMMMMMMMMMMNNNNMMMMMMMNNmmh:..`...``.-::////+ohdNNNMNNNNMMNNNNMMNNNNMMNNNNNNMMNNMMNdhysmMMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMmhNMMMMMMMMMMMMMMMMMMMMMMMMMMmy-.----...``..--:/+/+ohdmNNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNdhyyNMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMMydMMMMMMMMMMMMMMMMMMMMMMMMMNm:..::/:::-.``.-:/++oo+/+shdNNNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNhsohMMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMmsNMMMMMMMMMMMMMMMMMMMMMMMMMNs:-:o+/://::.-:://:++++://shmNNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmyo+mMMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMMyhMMMMMMMMMMMMMMMMMMMMMMMMNNh/--+s+:-:------...-://:-:/oyhmNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNdyoyNMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMNomMMMMMMMMMMMMMMMMMMMMMNNmy+--::oy+:--..---:..---/++::++osymNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmdyomMMMMMMMMMMMMMM
    // MMMMMMMMMMMMMMMMhyNMMMMMMMMMMMMMMMMMMMMNmh/:--//+os+/:-.-+:/o:.-:/ooyo:://oohmmNNNMMMMMMMMMMMMMMMMMMMMMMMMMMMMmhyshyhmNMMMMMMMMM
    // MMMMMMMMMMMMMMMNomMMMMMMMMMMMMMMMMMMMMNho/---:o++++///-.-++++:.-//++oss/:++/oddmNNNMMMMMMMMMMMMMMMMMMMMMMMMMMNmdh+:-+yydNMMMMMMM
    // MMMMMMMMMMMMMMMdoNMMMMMMMMMMMMMMMMMMMMmsyyy+:+///++/:---/++//::--:///so+/+y/:ddmdmNMMMMMMMMMMMMMMMMMMMMMMMMMdosys/:+sooshmMMMMMM
    // MMMMMMMMMMMMMMMddMMMMMMMMMMMMMMMMMMMMMmhmh+///://+/:---:://///:/:/++//o++/yy+yhdmNNMMMMMMMMMMMMMMMMMMMMMMMMMy+++o+::+oossdmMMMMM
    // MMMMMMMMMMMMMMNmmMMMMMMMMMMMMMMMMMNmmmms+:.-//:+///:-----://:--:/:+o++sssoyhyysyhhhddNMMMMMMMMMMMMMMMMMMMMMMdNmd+/////+oshdMMMMM
    // MMMMMMMMMMNmmNhNNMNNMMMMMMMMMMMNNmhsos+:-..::::o+/+/::----:----://oooohhys+syhhyyyyyyhmNMMMMMMMMMMMMMMMMMMMMdNMNy/++++++shdNMMMM
    // MMMMMMMNhyhsomNmdmmhNMMMMMMMNmdddhhhys+/:+oo/:os+o+/:----------::/+ssodhhysyhddhhhyyyhyyhhdNMMMMMMMMMMMMMMMMmdMNds+//oyydddNMMMM
    // MMMMMMmsydyo/+ymNNmNMMMNNmdhhhdhddhhhhso+shy+sy+os+//:-------:--::/ossyhs+oshddddhhhhhyyyyhhmMMMMMMMMMMMMMMMmhNMNmmddydNNmmNMMMM
    // MMMMMNhddsoooo+hNMMMMNdhhhddmmmmmdddmmhhhddhssyoysoo++/+/:::/+////+osyshhysyhdhdddhhddddhddmddmMMMMNNNMMMMMMmhmMNNNdhssdmmmMMMMM
    // MMMMMmdmds+++oshmNNNdMo///mMh///dNNms/---:odNM//////////N/::mo//////oymdmm//////yNdmms/---:+hmdNdo:---:odMNmhhdMMmNNdyshmmNMMMMM
    // MMMMMmdddhsooyydNmdhmM-   :Mo   hMd.   -`  `yM.``    ``.N+::N-    .   /MNs      :MmN.   -`   sMd`   -   `dmddhdNMNNMNhyhmmNMMMMM
    // MMMMMNddddsoyhhmMMNNNM-    so   hMo   `N:   :Mdhy    shsy/::N-   .N.  `NM:   .  `NMh    mo...+Mo   .N:...yNmmhdmMMMMMmhhdNMMMMMM
    // MMMMMMmmmmdhhhdMMMMNNM-    `+   hM/   `M:   .Myhd    yh/::::N-   .N.   NN`  `o   yMN`   -odNNmNh    :sdNNNNmNhddMMMMMNdhhmMMMMMM
    // MMMMMNNMMMMMMMMMMMMMMM-         hM/   `M:   .Mhdd    yh/:://N-    .   -Md   -h   /MNd/`    :yNNMy-`   `/hNNmmhddNMMMNNNdhdNMMMMM
    // MMMMNNMMMMMMMMMMMMMMMM-   .     hM/   `M:   .Mmmd    yh/////N-   `::/odMs   /d   .MNNNdo-    /MNNNh+.    sMNNhddNMMMmdNmhhmMMMMM
    // MMMMNMMMMMNMMMMMMMMMMM-   y     hM/   `M:   -Mhmd    yd+///+N-   -Noo++N:   ``    dN````Ns   `Nh```-N/   :MNNmdmmMMNmdNNdhhNMMMM
    // MMMNNNMMMMNMMMMMMMMMMM-   m+    hMs   `h.   /MmNd    yd+o/++N-   -N//:oN`   ./`   oN`   yo   `Nh   `h:   :MmNNmmmMMNmdmmmdhmMMMM
    // MMMNNNMMMNmMMMMMMMMMMM-   Nm`   hMNo`     `/NNmNd    yhos/++N:   -N/+/yh    yM:   -My.      .yNMo`     `-dMNmNNmNNMMmmdddmhdmMMM
    // MMNNMMMMMmNMMMMMMMMMMMddddMMmdddNNmmNhysyhmNmyddmyhyhms/+///hysssyh///ohsyyhNmdhyyhMNNdyssydNmdhmmdysyhmMNNNNNNmmNMMNmmmmmdddNMM
    // MMNMMMMMNdMMMMMMMMMMMMNMMMMMMMMNNNmdydhydyymhsyhhyhhyhs/+o+///:o/y/+::-:/osdhyhydhdNmddddddddddddddddmMNNNNNNNNNNNMMNmmmmMdhhmMM
    // MMNMMMMNydMMMMMMMMMMMMMMMMMNNNNNNNNNmmmdNmdNddddmdmmmmdyosssoss+ohsyo+::+sddmmmmmmmNNmdddddddddddssyshhydydhdyhhhyhmyshyymdsyosN
    // MMMMMMMMNNMMMMMMMMMMMMMMMMNNNNNNNNMNNNmmmNmNmmmmmmmdmmmdhyysoyhyoshhs++sssdmmNmmmmmmNmmdmddddddddyhhyddddhhohhddddhmhhhhhmmdyyhN

    var
        delimiter = ' ';
        opt = '-';
        captures = [ '"', "'", '`' ],
        out = [],
        idk = '';

    input = delimiter + input;
    
    for ( var index = 0; index < input.length; ++index )
    {
      if ( captures.some( char => { return (idk = input[ index + 1 ]) == char } ) )
      {
          ++index;
          var newIndex = input.indexOf( idk, index + 1 ) >>> 0;
          out.push( input.slice( index + 1, newIndex ) );
          index = newIndex - 1;
      }
      else if ( input.substr( index + 1, 2 ) == opt + opt )
      {
          var newIndex = input.indexOf( '=', index + 1 ) >>> 0;
          if ( newIndex > input.indexOf( delimiter, index + 1 ) )
          {
            newIndex = input.indexOf( delimiter, index + 1 ) >>> 0;
            out.push( input.slice( index + 1, newIndex ) );
            index = newIndex - 1;
          }
          else
          {
            if ( ! captures.some( char => { return (idk = input[ newIndex + 1 ]) == char } ) )
              idk = delimiter;
            newIndex = input.indexOf( idk, newIndex + 2 ) >>> 0;
            out.push( input.slice( index + 1, newIndex ).replace( idk, '' ) );
            index = newIndex - 1;
          }
      }
      else if ( input[ index ] == delimiter )
      {
          var newIndex = input.indexOf( delimiter, index + 1 ) >>> 0;
          out.push( input.slice( index + 1, newIndex ) );
          index = newIndex - 1;
      }
    }

    var obj = ARGENTUM( out );
    callBack( obj.args.shift( ) , obj.args, obj.opts );
}