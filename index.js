var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var path = require('path');
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
});
var Sentiment = require('sentiment');
var sentiment = new Sentiment();
var gender = require('gender')

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));
app.set('port', process.env.PORT || 3000);

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
                        console.log(error);
                        throw error;
                    });
                    // Close stream, after 20 seconds
                    setTimeout(function() {
                        stream.destroy();
                    }, 50000);
                });

                
            }
        });

    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
});

http.listen(app.get('port'), function(){
    console.log('listening on *:3000 ', app.get('port') );
});
