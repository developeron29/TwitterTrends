var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var path = require('path');
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: 'yGO7zVxmfjFIyBYmTrKeXvH7l',
    consumer_secret: 'X5P2qh5yGK9lIxveMfZpWFxrobn4jkRlZZd0FARc8vmrdH24NF',
    access_token_key: '1035408562929852417-IeU9wmnqA0t9sq32IbCQ4JqHhRHJXr',
    access_token_secret: 'XMjrfRKOUtJDtlwmHPKkBkaVQOYUt3EU8hp5yJCWcfSw0'
});
var Sentiment = require('sentiment');
var sentiment = new Sentiment();
var gender = require('gender')

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', function(req, res){
   // res.sendFile(path.join(__dirname, 'dist/index.html'));
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
  //  socket.emit("test", "test");
    socket.on('message', function(msg) {
        console.log('message received', msg);
        socket.emit('message', {
            msg: 'new message from server hi!'
        });
        client.get('geo/search', { query: msg.toString() }, function(error, tweets, response) {
            console.log(tweets['result']['places'],'t', error);
            if (!error) {
                var poly = tweets['result']['places'],
                    coord1 = parseFloat( (poly[0]['centroid'][0]).toFixed(5) ),
                    coord2 = parseFloat( (poly[0]['centroid'][1]).toFixed(5) );

                client.stream('statuses/filter', {locations: ((coord1 - 5) + ',' + (coord2 - 5) + ',' + (coord1 + 5) + ',' + (coord2 + 5))}, function(stream) {
                    stream.on('data', function(event) {
                        // Sentiment analysis
                        var score = sentiment.analyze(event.text).score;
                        if ( score < 0 ) {
                            socket.emit('message', {
                                msg: {
                                    negative: score
                                }
                            });
                        } else if ( score >= 0 ) {
                            socket.emit('message', {
                                msg: {
                                    positive: score
                                }
                            })
                        } 

                        // Gender analysis
                        var detector = gender.guess(event.user.name);

                        if(detector.gender == 'male') {
                            socket.emit('message', {
                                msg: {
                                    male: 1
                                }
                            })
                        } else {
                            socket.emit('message', {
                                msg: {
                                    female: 1
                                }
                            })
                        }

                    });

                    stream.on('error', function( error ) {
                        throw error;
                    });
                    // Close stream, after 20 seconds
                    setTimeout(function() {
                        stream.destroy();
                    }, 20000);
                });

                
            }
        });

    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
