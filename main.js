const spawn = require('child_process').spawn;
const express = require('express');
const app = express();
const fs = require('fs');

try {
        fs.mkdirSync('/tmp/scans');
} catch(e) {
        console.log(e);
}

const scanLinks = `<h1>Black/White Scan</h1>
        <a href="/scan/150/gray">Small</a> (00:45)<br>
        <a href="/scan/300/gray">Medium</a> (01:35)<br>
        <a href="/scan/600/gray">Large</a> (04:55)<br>
        <h1>Color Scan</h1>
        <a href="/scan/150/color">Small</a><br>
        <a href="/scan/300/color">Medium</a><br>
        <a href="/scan/600/color">Large</a><br>
        <hr>
`;

let scans = [];

let curScan = false;

app.get('/', (req, res)=>{

        res.send( renderPage() );
});

function renderPage() {
        return `<html>
        <head>
                <title>Scanner</title>
                ${ (curScan) ? '<meta http-equiv="refresh" content="2">':''}
        </head>
        <body>
                ${ (!curScan) ? scanLinks+'<hr>':'' }
                ${ listScans() }<br>
        </body>
</html>`;
}

const listScans = ()=> scans.sort( (a,b)=>b.date.getTime() - a.date.getTime()).map( s=>`<b>${s.date.toISOString()}</b> ( ${s.dpi} DPI ${s.col} )<br>${ (s.running) ? 'Scanning: '+ s.msg : (s.ok)?'<img src="/img/t'+s.fn+'"><br><a href="/img/'+s.fn+'">Download</a> -- <a href="/del/'+s.date.getTime()+'">Delete</a>':'Failed.' }`).join('<hr>\n');

const validDpi = [150, 300, 600, 1200];
const validCol = ['gray', 'color'];


app.get('/del/:ts', (req, res)=>{
        const ts = parseInt(req.params.ts);

        scans = scans.filter( s=>{
                if( s.date.getTime() === ts) {
                        console.log('deleting '+ts);
                        try {
                                fs.unlinkSync('/tmp/scans/'+ts+'.jpg');
                                fs.unlinkSync('/tmp/scans/t'+ts+'.jpg');
                        } catch(e) {
                                console.log(e);
                        }
                } else {
                        return true;
                }
        });
        res.redirect('/');

});

app.get('/scan/:dpi/:col', (req, res)=>{
        if(!curScan) {
                curScan=true;
                const dpi = parseInt(req.params.dpi);
                const col = req.params.col;

                if( validDpi.indexOf(dpi) === -1 ) {
                        return res.send('invalid dpi');
                }
                if( validCol.indexOf(col) === -1 ) {
                        return res.send('invalid color');
                }

                const date = new Date();
                const fn = date.getTime() + '.jpg';

                const cmd = `hp-scan -r${dpi} -m${col} -f${fn}`;

                const child = spawn('hp-scan', [ '-r', dpi, '-m', col, '-f', fn ], { cwd: '/tmp/scans' });

                const scan = {
                        date,
                        fn,
                        running: true,
                        dpi: dpi,
                        col: col,
                        ok: false,
                };

                scans.push(scan);

                child.on('close', (code)=>{
                        if(code===0) {
                                scan.msg = 'Saving...';
                                scan.running=false;
                                const magick = spawn('convert', [fn, '-resize', '320', '-quality', '25', 't'+fn], {cwd: '/tmp/scans'});
                                magick.on('close', (code)=>{

                                        if(code === 0) {
                                                scan.ok=true;
                                        }
                                        curScan = false;
                                });
                        } else {
                                curScan = false;
                                scan.running=false;
                        }
                });

                child.stdout.on('data', (data)=> {
                        scan.msg = `${data}`;
                });
        }
        res.redirect('/');
});

app.use('/img/', express.static('/tmp/scans/'));


app.listen(3000, ()=>{console.log('listening.')});

