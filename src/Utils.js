
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
    return getPathArrayOnObject( obj, path.split( '.' ) );
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

module.exports.mention = ( user ) =>
{
    return `<@${ user.bot ? '!': '' }${ user.id }>`;
}

const ARGENTUM = require( '../lib/argentum' );
module.exports.parseCmdArgs = ( input, callBack ) =>
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