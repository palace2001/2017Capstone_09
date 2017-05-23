var express = require('express');
var app = express();
var fs = require('fs');
var cheerio = require("cheerio"), req = require("tinyreq");
var forEach = require("async-foreach").forEach;
var Corp = require('./public/javascripts/corp');
var bodyParser = require('body-parser');
// var Data = require('./public/javascripts/data');
var DataStock = require('./public/javascripts/dataStock');
var Users = require('./public/javascripts/user');
var Factor = require('./public/javascripts/factor');
var passport = require('passport');
var session = require('express-session');

// var bodyParser = require('body-parser');
// var errorHandler = require('errorhandler');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var CT = require('./public/modules/country-list');
var AM = require('./public/modules/account-manager');
var EM = require('./public/modules/email-dispatcher');


app.use(cookieParser());


var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;
var dbName = process.env.DB_NAME || 'stock_db';

var dbURL = 'mongodb://'+dbHost+':'+dbPort+'/'+dbName;
if (app.get('env') == 'live'){
// prepend url with authentication credentials //
    dbURL = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+dbHost+':'+dbPort+'/'+dbName;
}

app.use(session({
        secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
        proxy: true,
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({ url: dbURL })
    })
);

// Stock.findOne({_id: "005930" }, function(err, stock){
//     if(err) console.log(err);
//     else  console.log(stock);
// })


app.set('views', __dirname + '/router/views');
app.set('view engine', 'jade');


app.use(passport.initialize());
app.use(passport.session()); //로그인 세션 유지


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./router/routes')(app);


app.use(express.static('public'));



app.get('/', function (req, res) {
    fs.readFile('public/pages/main.html', function (err, data) {
        var html = data.toString();


        if (req.session.user == null){
            html = html.replace('<%LHYPER%>', "login");
            html = html.replace('<%LTEXT%>', "LOGIN");
        }
        else {
            html = html.replace('<%LHYPER%>', "home");
            html = html.replace('<%LTEXT%>', "ACCOUNT");
        }


        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    });
});

app.get('/about', function (req, res) {
    fs.readFile('public/pages/about.html', function (err, data) {
        var html = data.toString();

        if (req.session.user == null){
            html = html.replace('<%LHYPER%>', "login");
            html = html.replace('<%LTEXT%>', "LOGIN");
        }
        else {
            html = html.replace('<%LHYPER%>', "home");
            html = html.replace('<%LTEXT%>', "ACCOUNT");
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(html);
    });
});

app.get('/forecasting', function (req, res) {

    if (req.session.user == null){
        res.redirect('/login');
    } else {
        fs.readFile('public/pages/forecasting.html', function (err, data) {
            Factor.findOne({_id: "001"}, function (err, pdata) {
                Factor.findOne({_id: "101"}, function (err, ddata) {
                    var html = data.toString();
                    var pValue = [], dValue = [];

                    forEach(range(0, pdata.value.length), function (i, index, arr) {

                        pValue.push([i,pdata.value[i].value/100]);
                        dValue.push([i,ddata.value[i].value/100]);

                        if(i == pdata.value.length - 1) {
                            html = html.replace('<%PVALUE%>',JSON.stringify(pValue));
                            html = html.replace('<%DVALUE%>',JSON.stringify(dValue));
                            html = html.replace('<%LHYPER%>', "home");
                            html = html.replace('<%LTEXT%>', "ACCOUNT");
                            res.writeHead(200, {'Content-Type': 'text/html'});
                            res.end(html);
                        }
                    });
                });
            });
        });
    }
});

// app.get('/login', function (req, res) {
//     fs.readFile('public/pages/login.html', function (err, data) {
//         res.writeHead(200, {'Content-Type': 'text/html'});
//         res.end(data);
//     });
// });

app.get('/stock', function (req, res) {
    // console.log(req.query);

    if (req.session.user == null){
        res.redirect('/login');
    } else {
        code = req.query.code;

        DataStock.findOne({_id: code}, function (err, corp) {
            if (err) console.log(err);
            fs.readFile('public/pages/stock.html', function (err, data) {
                // Extract some data from my website
                scrape("http://finance.naver.com/item/main.nhn?code=" + code, {
                    // Get the website title (from the top header)
                    title: ".blind dd"
                }, (err, scrap) => {
                    try {
                        if (typeof scrap.title === "undefined")
                            res.redirect('/stock?code=' + code);
                        var str = scrap.title.replace(/[^0-9 ]/g, '');
                        var dataArray = str.split(' ');

                        for (var i = 0; i < dataArray.length; ++i)
                            if (dataArray[i] == '') dataArray.splice(i--, 1);


                        var html = data.toString();

                        var gap = Number(dataArray[6]) - Number(dataArray[9]);
                        var rStr = "";
                        if(gap > 0) {
                            rStr = '▲' + addCommas(gap);
                            html = html.replace('<%COLOR1%>','red');
                            html = html.replace('<%COLOR2%>','red');
                        } else if(gap < 0) {
                            rStr = '▼' + addCommas(gap*-1);
                            html = html.replace('<%COLOR1%>','blue');
                            html = html.replace('<%COLOR2%>','blue');
                        } else {
                            rStr = addCommas(gap);
                            html = html.replace('<%COLOR1%>','bold');
                            html = html.replace('<%COLOR2%>','bold');
                        }
                        var subDataSet = {
                            currentPrice: addCommas(dataArray[6]),
                            gapPrice: rStr,
                            rate: addCommas(Number(dataArray[8])/100),
                            previousPrice: addCommas(dataArray[9]),
                            marketPrice: addCommas(dataArray[10]),
                            highPrice: addCommas(dataArray[11]),
                            maximumPrice: addCommas(dataArray[12]),
                            lowPrice: addCommas(dataArray[13]),
                            minimumPrice: addCommas(dataArray[14]),
                            volume: addCommas(dataArray[15]),
                            tradeCost: addCommas(dataArray[16])
                        };


                        var priceArray = [];
                        forEach(range(0, corp.pastPrice.length), function (i, index, arr) {
                            priceArray.push([i, corp.pastPrice[i]]);
                            // priceArray.push([i, corp.pastPrice[i], corp.forecastPrice[i]]);

                            if(i == corp.pastPrice.length - 1) {


                                html = html.replace('<%DATA%>', JSON.stringify(priceArray));
                                html = html.replace('<%CNAME%>', corp.name);
                                html = html.replace('<%GAP%>', subDataSet.gapPrice);
                                html = html.replace('<%RATE%>', subDataSet.rate);
                                html = html.replace('<%CURRENTPRICE%>', subDataSet.currentPrice);
                                html = html.replace('<%PREVIOUSPRICE%>', subDataSet.previousPrice);
                                html = html.replace('<%MARKETPRICE%>', subDataSet.marketPrice);
                                html = html.replace('<%HIGHPRICE%>', subDataSet.highPrice);
                                html = html.replace('<%LOWPRICE%>', subDataSet.lowPrice);
                                html = html.replace('<%VOLUME%>', subDataSet.volume);
                                html = html.replace('<%TRADECOST%>', subDataSet.tradeCost);

                                html = html.replace('<%LHYPER%>', "home");
                                html = html.replace('<%LTEXT%>', "ACCOUNT");
                                html = html.replace('<%CODE%>', code);

                                res.end(html);
                            }
                        });



                        //console.log(subDataSet);






                    }
                    catch (e) {
                        console.log(e);
                    }
                    //console.log(html);

                });
                //res.writeHead(200, {'Content-Type': 'text/html'});
                //console.log(data.toString());
            });
        });
    }
});


app.get('/list', function (req, res) {
    if (req.session.user == null){
        res.redirect('/login');
    }
    else {
        fs.readFile('public/pages/list.html', function (err, data) {
            var kospi = "", kosdaq = "";
            var html = data.toString();
            DataStock.find(function (err, stock) {
                console.log(stock.length);
                var count = 0;
                forEach(range(0, stock.length), function (item, index, arr) {
                    var pSize = stock[item].pastPrice.length;
                    kospi += "<tr>";
                    kospi += "<td><a href=\"http://203.246.113.178:3000/stock?code="
                        + stock[item]._id + "\">" + stock[item].name + "</a></td>";
                    var num = -1000;
                    kospi += "<td style=\"color:red\">" + addCommas(num.toString()) + "</td>";
                    kospi += "<td>" + addCommas(stock[item].preDate.close.toString()) + "</td>";

                    var gap = stock[item].preDate.close - stock[item].pastPrice[pSize-2];
                    //console.log(stock[item].pastPrice);
                    if (gap > 0){
                        kospi += "<td style=\"color:red\">" + '▲' + addCommas(gap.toString()) + "</td>";
                    } else if(gap < 0) {
                        kospi += "<td style=\"color:blue\">" + '▼' + addCommas((gap*-1).toString()) + "</td>";
                    } else {
                        kospi += "<td>" + addCommas(gap.toString()) + "</td>";
                    }
                    kospi += "<td>" + addCommas(stock[item].preDate.high.toString()) + "</td>";
                    kospi += "<td>" + addCommas(stock[item].preDate.low.toString()) + "</td>";
                    kospi += "<td>" + addCommas(stock[item].preDate.amount.toString()) + "</td>";
                    kospi += "</tr>";
                    count++;
                    if (count == 101) {
                        html = html.replace('<%KOSPI%>', kospi);
                        html = html.replace('<%LHYPER%>', "home");
                        html = html.replace('<%LTEXT%>', "ACCOUNT");
                        res.end(html);
                    }

                });
            });
        });
    }
});



app.get('/mylist', function (req, res) {
    if (req.session.user == null){
        res.redirect('/login');
    }
    else {
        fs.readFile('public/pages/mylist.html', function (err, data) {
            Users.findOne({name: req.session.user.name}, function (err, user) {
                var kospi = "", kosdaq = "";
                var html = data.toString();
                var count = 0;
                forEach(range(0, user.interested.length), function (item, index, arr) {
                    DataStock.findOne({_id: user.interested[item]}, function (err, stock) {
                        var pSize = stock.pastPrice.length;
                        // console.log(stock.name + item);
                        kospi += "<tr>";
                        kospi += "<td><a href=\"http://203.246.113.178:3000/stock?code="
                            + stock._id + "\">" + stock.name + "</a></td>";
                        var num = -1000;
                        kospi += "<td style=\"color:red\">" + addCommas(num.toString()) + "</td>";
                        kospi += "<td>" + addCommas(stock.preDate.close.toString()) + "</td>";
                        var gap = stock.preDate.close - stock.pastPrice[pSize-2];
                        //console.log(stock[item].pastPrice);
                        if (gap > 0){
                            kospi += "<td style=\"color:red\">" + '▲' + addCommas(gap.toString()) + "</td>";
                        } else if(gap < 0) {
                            kospi += "<td style=\"color:blue\">" + '▼' + addCommas((gap*-1).toString()) + "</td>";
                        } else {
                            kospi += "<td>" + addCommas(gap.toString()) + "</td>";
                        }
                        kospi += "<td>" + addCommas(stock.preDate.high.toString()) + "</td>";
                        kospi += "<td>" + addCommas(stock.preDate.low.toString()) + "</td>";
                        kospi += "<td>" + addCommas(stock.preDate.amount.toString()) + "</td>";
                        kospi += "<td align=\'center\'>" +
                            "<form action=\"http://203.246.113.178:3000/delete\" method=\"GET\">" +
                            "<input type=\"hidden\" name=\"code\" value=\"" + stock._id + "\" />" +
                            "<input type=\"submit\" value=\"↺\" />" + "</form></td>";
                        kospi += "</tr>";
                        count++;
                        if (count == user.interested.length) {
                            html = html.replace('<%KOSPI%>', kospi);
                            html = html.replace('<%LHYPER%>', "home");
                            html = html.replace('<%LTEXT%>', "ACCOUNT");
                            res.end(html);
                        }
                    });
                });
                if(user.interested.length == 0) {
                    html = html.replace('<%KOSPI%>', kospi);
                    html = html.replace('<%LHYPER%>', "home");
                    html = html.replace('<%LTEXT%>', "ACCOUNT");
                    res.end(html);
                }
            });
        });
    }
});




app.get('/insert', function (req, res) {
    if (req.session.user == null){
        res.redirect('/login');
    }
    else {
        Users.update({name: req.session.user.name}, {$push: {interested:req.query.code}}, function (err, user) {
            if(err) console.log(err);
            res.redirect('/mylist');
        });
    }
});



app.get('/delete', function (req, res) {
    if (req.session.user == null){
        res.redirect('/login');
    }
    else {

        Users.update({name: req.session.user.name}, {$pull: {interested:req.query.code}}, function (err, user) {
            if(err) console.log(err);
            console.log(req.query);
            res.redirect('/mylist');
        });
    }
});




app.get('/config', function (req, res) {
    if (req.session.user.name != "master"){
        res.end('Only Access Master');
    } else {
        fs.readFile('public/pages/config.html', function (err, data) {
            var html = data.toString();
            var userList = "";
            var count = 0;
            Users.find( function (err, users) {
                forEach(range(0, users.length), function (i, index, arr) {
                    count++;
                    if (users[i].name != "master") {
                        userList += "<tr>";
                        userList += "<td>" + i + "</td>";
                        userList += "<td>" + users[i].name + "</td>";
                        userList += "<td>" + users[i].email + "</td>";
                        userList += "<td align=\'center\'>" +
                            "<form action=\"http://203.246.113.178:3000/duser\" method=\"GET\">" +
                            "<input type=\"hidden\" name=\"code\" value=\"" + users[i].name + "\" />" +
                            "<input type=\"submit\" value=\"↺\" />" + "</form></td>";
                        userList += "</tr>";
                    }

                    if (count == users.length) {
                        html = html.replace('<%USERS%>', userList);
                        res.end(html);
                    }
                });
            });
        });
    }
});


app.get('/duser', function (req, res) {
    if (req.session.user.name != "master"){
        res.end('Only Access Master');
    }
    else {
        Users.remove({name: req.query.code}, function (err, user) {
            if(err) console.log(err);
            console.log("Master kill the " + req.query.code);
            res.redirect('/config');
        });
    }
});



//
// forEach(range(0,100), function(item, index, arr) {
//     console.log("each", item);
// });

function range(start, count) {
    return Array.apply(0, Array(count))
        .map(function (element, index) {
            return index + start;
        });
}



// Define the scrape function
function scrape(url, data, cb) {
    // 1. Create the request
    req(url, (err, body) => {
        if (err) { return cb(err); }

        // 2. Parse the HTML
        let $ = cheerio.load(body)
        , pageData = {}
    ;
    // 3. Extract the data
    Object.keys(data).forEach(k => {
        pageData[k] = $(data[k]).text();
});

    // Send the data in the callback
    cb(null, pageData);
});
}

function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}




app.listen(3000, function () {
  console.log('Server listening on port 3000!');
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
