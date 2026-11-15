import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const assets = [
  { id:'AST-1001', name:'Customer Master', domain:'Customer', type:'Table', owner:'Data Platform', score:98, certified:true, description:'Golden customer records used by downstream analytics.' },
  { id:'AST-1002', name:'Sales Transactions', domain:'Finance', type:'Table', owner:'Finance Data', score:91, certified:true, description:'Daily sales transaction facts.' },
  { id:'AST-1003', name:'Product Reference API', domain:'Product', type:'API', owner:'Product Engineering', score:84, certified:false, description:'Product reference data exposed to internal applications.' },
  { id:'AST-1004', name:'Supplier Data Feed', domain:'Procurement', type:'File', owner:'Procurement Ops', score:72, certified:false, description:'Supplier master data from an external partner.' }
];

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (path === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({status:'ok'}));
  }
  if (path === '/api/assets') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({data:assets, total:assets.length}));
  }
  if (path === '/' || path === '/index.html') {
    const html = await readFile(join(process.cwd(), 'public', 'index.html'));
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    return res.end(html);
  }
  res.writeHead(404, {'Content-Type':'application/json'});
  res.end(JSON.stringify({error:'Not found'}));
});
server.listen(4173, '127.0.0.1', () => console.log('Demo app: http://127.0.0.1:4173'));
