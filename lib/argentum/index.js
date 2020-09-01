console.log( JSON.stringify(
    {
        input: process.argv.slice( 2 ).join( ' ' ),
        opts: require( './src/argentum' ).parse( process.argv ),
        args: process.argv.slice( 2 )
    }
));
