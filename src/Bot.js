
// nice-bot :: src/Bot.js

const DISCORD = require('discord.js');
const DEFAULTDATA = require( './BotDefault.json' );
const UTILS = require( './Utils' );

module.exports = class Bot extends DISCORD.Client {
    
    constructor( data, login = true )
    {
        super( );
        
        this.token = data.token;
        this.botData = data;

        this.setup( );
        
        if ( login )
            super.login( );
    }

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
        
        this.on( 'ready', this.onReady );
        this.on( 'message', this.onMessage );
    }
    
    onReady( )
    {
        console.log( 'I\'m ready!' );
    }
    
    onMessage( msg )
    {
        if ( msg.author.id == this.user.id && ! msg.content.startsWith( `${ this.botData.cmd.prefix }#` ) )
            return; // do not respond to self

        // log the message
        console.log( `<${ msg.author.username }#${ msg.author.discriminator }> ${ [ msg.content ] }`);

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

        var [ cmd, args ] = UTILS.parseCmdArgs( msg.content );
        if ( cmd.startsWith( '#' ) ) cmd = cmd.substr( 1 );
        switch ( cmd )
        {
            case "add":
                var [ listener, query ] = args.splice( 0, 2 );
                if ( listener == 'help' )
                    msg.channel.send( `\`add <listener> <expression> [-reply] <response>\`` );
                else if ( ! this.botData.hasOwnProperty( listener ) )
                    msg.channel.send( `no listener named: \`${ listener }\`` );
                else if ( query.length < 4 )
                    msg.channel.send( `listen query cannot be less than 4 characters: \`${ query }\`` );
                else
                {
                    var type = "channel.send";
                    if ( args[ 0 ] == '-reply' )
                    {
                        args.shift();
                        type = "reply";
                    }
                    (this.botData[ listener ].entries[ `${ query }` ] = {})[ type ] = args.join( ' ' );
                    console.log( this.botData[ listener ] );
                    msg.channel.send( `response added` );
                }
                break;
            case "say":
                msg.channel.send( args.join( ' ' ) );
                break;
            default:
                msg.channel.send( `Unknown command agruments for \`${ cmd }\`: \`${ args.join( '\` \`' ) }\`` );
        }
    }

    handle_response( msg, entry )
    {
        this.handle_call( msg, entry );
    }

};