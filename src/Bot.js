
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

        //same functionallity for response and call
        this.handle_response = this.handle_call;
    }
    
    onReady( )
    {
        console.log( 'I\'m ready!' );
    }
    
    onMessage( msg )
    {

        // log the message
        console.log( `'${ msg.channel.guild.name }'#${ msg.channel.name } <${ msg.author.username }#${ msg.author.discriminator }> ${ [ msg.content ] }`);

        if ( msg.author.id == this.user.id && ! msg.content.startsWith( `${ this.botData.cmd.prefix }#` ) )
            return; // do not respond to self

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
        console.log( msg.content );

        UTILS.parseCmdArgs(
            [ '\'' ].reduce(
                ( mod, char ) =>
                {
                    return mod.split( char ).join( '"' );
                },
                msg.content
            ),
            ( cmd, args, opts ) =>
            {
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
                            if ( opts.reply ?? opts.r ?? false )
                                type = "reply";
                            console.log( `added: ${ query }` );
                            (this.botData[ listener ].entries[ `${ query }` ] = {})[ type ] = args.join( ' ' );
                            msg.channel.send( `response added` );
                        }
                        break;
                    case "say":
                        msg.channel.send( args.join( ' ' ) );
                        break;
                    case "mention":
                        msg.channel.send( UTILS.mention( msg.author ) );
                        break;
                    default:
                        msg.channel.send( `Unknown command: \`${ cmd }\`` );
                }
                

            }
        );
    }

};