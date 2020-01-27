var rp = require('request-promise');
var express = require('express');
var bodyparser = require('body-parser');
var cheerio = require('cheerio')
var app = express();
var cors = require('cors');
const port = process.env.PORT || 3000;

app.use(cors());

app.listen(port, () => {
    console.log('Listening on port ' + port);
});

app.use(bodyparser.urlencoded({
    extended: true
}));

app.get('/', function (req, res) {
    if (req.query.id == '' || req.query.pass == '' || req.query.id == undefined || req.query.pass == undefined) {
        res.send({
            'result': 'error',
            'data': 'missing parameters'
        });
    } else {
        rp({
            method : 'GET',
            uri : 'http://edugate.aau.edu.jo/faces/ui/login.xhtml',
            resolveWithFullResponse : true,
            gzip : true,
        }).then(function(response) {
            var $ = cheerio.load(response.body)
            var cookie = response.headers['set-cookie'][0].substr(11).slice(0,-18)
            var jx = $('input[name="javax.faces.ViewState"]').attr('value');
            rp({
                method: 'POST',
                uri: 'http://edugate.aau.edu.jo/faces/ui/login.xhtml', 
                headers:{
                    'Cookie' : `JSESSIONID=${cookie}`
                },
                form:{
                    'lognForm': 'lognForm',
                    'lognForm:j_idt14': req.query.id,
                    'lognForm:j_idt18': req.query.pass,
                    'lognForm:j_idt21': '1',
                    'lognForm:j_idt25': '',
                    'javax.faces.ViewState': jx
                },
                gzip: true,
                resolveWithFullResponse: true,
                followAllRedirects: true,
            }).then(function(response2){
                var $ = cheerio.load(response2.body)
                if (response2.request.uri.href == 'http://edugate.aau.edu.jo/faces/ui/login.xhtml')
                    res.send({'result':'error','data':'invalid credentials'});
                else
                    res.send({'result':'success','data':$('#contents\\:j_idt156_content > ul > li:nth-child(4) > span.project-detail').text().trim()});
            }).catch(function(err){
                res.send({'result':'error','at':'post','data':err.message});
            });
        }).catch(function(err){
            res.send({'result':'error','at':'get','data':err.message});
        });
    }
})

app.get('*', function (req, res) {
    res.send({
        'result': 'error',
        'data': 'page not found'
    })
});