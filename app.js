var express = require('express');
var app = express();
var fs = require('fs');
var cheerio = require("cheerio"), req = require("tinyreq");
var Stock = require('./public/javascripts/stock');

// Stock.findOne({_id: "005930" }, function(err, stock){
//     if(err) console.log(err);
//     else  console.log(stock);
// })


app.use(express.static('public'));


app.get('/', function (req, res) {
    fs.readFile('public/pages/main.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

app.get('/about', function (req, res) {
    fs.readFile('public/pages/about.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

app.get('/forecasting', function (req, res) {
    fs.readFile('public/pages/forecasting.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

app.get('/login', function (req, res) {
    fs.readFile('public/pages/login.html', function (err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
});

app.get('/stock', function (req, res) {
    // console.log(req.query);
    code = req.query.code;
    Stock.findOne({_id: code }, function(err, stock){
        if(err) console.log(err);
        fs.readFile('public/pages/stock.html', function (err, data) {
            // Extract some data from my website
            scrape("http://finance.naver.com/item/main.nhn?code=" + code, {
                // Get the website title (from the top header)
                title: ".blind dd"
            }, (err, scrap) => {
                var str = scrap.title.replace(/[^0-9 ]/g,'');
                var dataArray = str.split(' ');

                for(var i = 0; i < dataArray.length; ++i)
                    if (dataArray[i] == '') dataArray.splice(i--,1);

                var subDataSet = {
                    currentPrice: addCommas(dataArray[6]),
                    previousPrice: addCommas(dataArray[9]),
                    marketPrice: addCommas(dataArray[10]),
                    highPrice: addCommas(dataArray[11]),
                    maximumPrice: addCommas(dataArray[12]),
                    lowPrice: addCommas(dataArray[13]),
                    minimumPrice: addCommas(dataArray[14]),
                    volume: addCommas(dataArray[15]),
                    tradeCost: addCommas(dataArray[16])
                };

                //console.log(subDataSet);
                var html = data.toString();
                html = html.replace('<%CNAME%>',stock.stockName);
                html = html.replace('<%CURRENTPRICE%>',subDataSet.currentPrice);
                html = html.replace('<%PREVIOUSPRICE%>',subDataSet.previousPrice);
                html = html.replace('<%MARKETPRICE%>',subDataSet.marketPrice);
                html = html.replace('<%HIGHPRICE%>',subDataSet.highPrice);
                html = html.replace('<%LOWPRICE%>',subDataSet.lowPrice);
                html = html.replace('<%VOLUME%>',subDataSet.volume);
                html = html.replace('<%TRADECOST%>',subDataSet.tradeCost);


                //console.log(html);
                res.end(html);
            });
            //res.writeHead(200, {'Content-Type': 'text/html'});
            //console.log(data.toString());
        });
    });
});


//
// app.get('/insert', function (req, res) {
//   req.query.seq = Number(req.query.seq);
//   req.query.value = Number(req.query.value);
//   res.send(req.query); // check data
//   console.log("Get data !!\n" + JSON.stringify(req.query));
// })



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
