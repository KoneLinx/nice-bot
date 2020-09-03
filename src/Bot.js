
// nice-bot :: src/Bot.js

const DATAFILE = './_.json';
const DISCORD = require('discord.js');
const DEFAULTDATA = require( './BotDefault.json' );
const UTILS = require( './Utils' );
const FS = require( 'fs' );

module.exports = class Bot extends DISCORD.Client {
    
    constructor( data, login = true )
    {
        super( );

        this.testmsg = undefined;
        
        this.token = data.token;
        this.botData = data;

        this.setup( );
        
        if ( login )
            super.login( );
    }

    getmsg() {return this.testmsg;}

    setup( )
    {
        UTILS.modelJson(
            this.botData,
            this.botData.listenerSequence.reduce(
                ( model, element ) => 
                {
                    model[ element ] = DEFAULTDATA.listenerDefault;
                    return model;
                },
                DEFAULTDATA
            )
        );
        UTILS.modelJson( this.botData, require( DATAFILE ) );
        
        this.on( 'ready', this.onReady );
        this.on( 'message', this.onMessage );

        //same functionallity for response and call
        this.handle_response = this.handle_call;
        this.handle_block = this.handle_call;
    }
    
    onReady( )
    {
        console.log( 'I\'m ready!' );
    }
    
    onMessage( msg )
    {
        this.testmsg = msg;

        // log the message
        console.log( `'${ msg.channel.guild.name }'#${ msg.channel.name } <${ msg.author.username }#${ msg.author.discriminator }> ${ [ msg.content ] }`);

        if ( msg.author.id == this.user.id && ! msg.content.startsWith( `${ this.botData.cmd.prefix }#` ) )
            return; // do not respond to self

        console.log( msg.member.roles.cache.map( role => { return `id:${ role.id } name:${ role.name }`; } ) );
        console.log( `author.id:${ msg.author.id } guild.id:${ msg.channel.guild.id }` );

        // note to the uninitiated:
        //  array.some( pred ) is like C++'s std::any_of( array.begin, array.end, pred )
        // so basically, it's a for each.
        // But with the twist being: when one 'true' is returned, it stops and returns true itself.
        // Otherwise it continues and eventually returns false
        // So take my advise: LEARN THOSE ALGORITHMS :)

        try
        {
            // test all listeners, in sequence
            this.botData.listenerSequence.some( listenerName =>
            {
                const listener = this.botData[ listenerName ];
                // check if this listener is called
                if ( ! UTILS.isPadded( msg.content, listener.prefix, listener.postfix ) )
                    return false; // nope

                //PERMS
                if ( ! ( listener.require?.some( req =>
                    {
                        return Object.entries( req ).every( entry =>
                        {
                            if ( typeof entry[ 1 ] == typeof [] )
                                return UTILS.callPathOnObject( msg, entry[ 0 ], entry[ 1 ][ 0 ] ) == entry[ 1 ][ 1 ];
                            else
                                return UTILS.getPathOnObject( msg, entry[ 0 ] ) == entry[ 1 ];
                        });
                    }
                ) ?? true ) )
                    if ( listener.require.length != 0 )
                        return false;
                if ( ( listener.deny?.some( req =>
                    {
                        return Object.entries( req ).every( entry =>
                        {
                            if ( typeof entry[ 1 ] == typeof [] )
                                return UTILS.callPathOnObject( msg, entry[ 0 ], entry[ 1 ][ 0 ] ) == entry[ 1 ][ 1 ];
                            else
                                return UTILS.getPathOnObject( msg, entry[ 0 ] ) == entry[ 1 ];
                        });
                    }
                ) ?? false ) )
                    return false;

                msg.content = UTILS.cutPadding( msg.content, listener.prefix, listener.postfix );
                // now check every entry
                // also false if none match
                return Object.keys( listener.entries ).some( name =>
                    {
                        if ( ! RegExp( name ).test( msg.content ) )
                            return false;
                        // for a match, call the handler function
                        this[ `handle_${ listenerName }` ]( msg, listener.entries[ name ] );
                        return true;
                    }
                );
            });
        }
        catch ( e )
        {
            // oh no
            console.log( "a message caused an error:" );
            console.log( e );
        }
    }

    handle_call( msg, entry )
    {
        [ "reply", "channel.send" ].some( type =>
        {
            if ( ! entry.hasOwnProperty( type ) )
                return false; // not present
            // otherwise proceed
            UTILS.callPathOnObject( msg, type, entry[ type ] );
            return true;
        });
    }

    handle_cmd( msg, entry )
    {
        // cmd is in development, totally not finished
        try
        {
            var [ cmd, args, opts ] =
                UTILS.parseCmdArgs(
                    [ '\'' ].reduce(
                        ( mod, char ) =>
                        {
                            return mod.split( char ).join( '"' );
                        },
                        msg.content
                    )
                )
            ;

            if ( cmd.startsWith( '#' ) ) cmd = cmd.substr( 1 );

            switch ( cmd )
            {
                case "add":
                    var [ listener, query ] = args.splice( 0, 2 );
                    if ( listener == 'help' )
                        msg.channel.send( `\`add <listener> [--name=<name>] <expression> [--reply] <response>\`\nAdd a callout` );
                    else if ( ! this.botData.hasOwnProperty( listener ) )
                        msg.channel.send( `no listener named: \`${ listener }\`` );
                    else if ( query.length < 4 )
                        msg.channel.send( `listen query cannot be less than 4 characters: \`${ query }\`` );
                    else
                    {
                        var type = "channel.send";
                        if ( opts.reply ?? opts.r ?? false )
                            type = "reply";
                        console.log( `added: ${ query }` );
                        (this.botData[ listener ].entries[ `${ query }` ] = {})[ type ] = args.join( ' ' );
                        msg.channel.send( `response added` );
                        FS.writeFile( './src/' + DATAFILE, JSON.stringify( this.botData ), e => { console.log( e ); } );
                    }
                    break;

                case "say":
                    msg.channel.send( args.join( ' ' ) );
                    break;

                case "mention":
                    msg.channel.send( UTILS.mention( msg.author ) );
                    break;

                case "get":
                    cmd = args.shift( );
                    if ( cmd == null )
                        msg.channel.send( `\`${ this.botData.listenerSequence.join( '\`\n\`' ) }\``);
                    else if ( cmd == 'help' )
                        msg.channel.send( `\`get <listener> [entry] [-e]\`\nGet all entries of <listener>` );
                    else if ( ! this.botData.hasOwnProperty( cmd ) )
                        msg.channel.send( `no listener named: \`${ cmd }\`` );
                    else
                    {
                        if ( args[ 0 ] == null )
                            msg.channel.send(
                                Object.entries( this.botData[ cmd ].entries ).map(
                                    entry =>
                                    {
                                        return `\`${ entry[ 1 ].name ?? entry[ 0 ] }\`: ${ entry[ 1 ].description ?? '' }`;
                                    }
                                ).join( '\n' )
                            );
                        else if ( !
                            Object.entries( this.botData[ cmd ].entries ).some(
                                entry =>
                                {
                                    if ( entry[ 1 ].name != args[ 0 ] )
                                        return false;
                                    if ( opts.e ?? false )
                                        msg.channel.send( `\`${ entry[ 0 ] }\`` );
                                    else
                                        msg.channel.send( `Try saying:\n> ${ this.botData[ cmd ].prefix }${ entry[ 1 ].example }${ this.botData[ cmd ].postfix }` );
                                    return true;
                                }
                            )
                        )
                            msg.channel.send( `No entry named \`${ args[ 0 ] }\` for \`${ cmd }\`` );
                    }
                    break;

                case "save":
                    FS.writeFile( './src/' + DATAFILE, JSON.stringify( this.botData ), e => { console.log( e ); } );
                    msg.channel.send( "Data saved!" );
                    break;

                case "help":
                    msg.channel.send( 'To which I say, drown.' );
                    break;

                default:
                    msg.channel.send( `Unknown command: \`${ cmd }\`` );
            }
        }
        catch ( e )
        {
            msg.channel.send( `Your command had a syntax error :( I couldn't handle it.\n\`${ e }\`` );
        }
    }

};