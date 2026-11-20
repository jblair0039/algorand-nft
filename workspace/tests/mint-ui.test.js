import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import * as sdk from 'algosdk';
import {mount} from '../src/app.js';
import {MAINNET_HASH,from64} from '../src/mint.js';
async function setup(memory=new Map()) {
 const window=new Window({settings:{disableComputedStyleRendering:true,disableJavaScriptEvaluation:true,disableJavaScriptFileLoading:true,disableCSSFileLoading:true,disableIframePageLoading:true}});
 window.document.write(await readFile(new URL('../index.html',import.meta.url),'utf8'));
 const local=sdk.generateAccount(),address=local.addr.toString(),calls=[];
 let signed;
 class Fake {
  on(){return ()=>{};}dispose(){}disconnect(){return Promise.resolve();}connect(){calls.push('connect');return Promise.resolve([address]);}
  signTransaction(groups){calls.push('sign');signed=groups[0][0].txn.signTxn(local.sk);return Promise.resolve([signed]);}
 }
 const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const params={fee:0n,minFee:1000n,firstValid:100n,lastValid:1100n,genesisID:'mainnet-v1.0',genesisHash:from64(MAINNET_HASH)};
 const services={params:async()=>{calls.push('params');return params;},account:async()=>{calls.push('account');return new sdk.modelsv2.Account({address,amount:500000n,minBalance:100000n,amountWithoutPendingRewards:500000n,pendingRewards:0n,rewards:0n,round:100n,status:'Offline',totalAppsOptedIn:0,totalAssetsOptedIn:0,totalCreatedApps:0,totalCreatedAssets:0});},send:async b=>{calls.push('send');return new sdk.modelsv2.PostTransactionsResponse({txid:sdk.decodeSignedTransaction(b).txn.txID()});},pending:async id=>{calls.push(['pending',id]);return new sdk.modelsv2.PendingTransactionResponse({poolError:'',txn:sdk.decodeSignedTransaction(signed),confirmedRound:150n,assetIndex:42n});},asset:async()=>{calls.push('asset');const tx=sdk.decodeSignedTransaction(signed).txn,a=tx.assetConfig;return new sdk.modelsv2.Asset({index:42n,params:new sdk.modelsv2.AssetParams({creator:address,total:1n,decimals:0,defaultFrozen:false,name:a.assetName,unitName:a.unitName,url:a.assetURL})});}};
 const app=mount(window.document,{Connector:Fake,validAddress:sdk.isValidAddress,mintServices:services,storage});
 const $=id=>window.document.getElementById(id),click=id=>$(id).click();
 const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new window.Event('input',{bubbles:true}));};
 const settle=()=>new Promise(resolve=>setTimeout(resolve,20));
 return {window,app,calls,$,click,input,settle,memory};
}
test('four explicit MainNet buttons need no attestations; exact ARC69 note is signed then broadcast once and confirmed',async()=>{
 const f=await setup();const {$,click,input,settle}=f;
 assert.deepEqual(f.calls,[]);assert.equal($('prepare-mint').disabled,true);assert.equal($('sign-mint').disabled,true);assert.equal($('broadcast-mint').disabled,true);
 click('connect');await settle();assert.deepEqual(f.calls,['connect']);click('apply-form');
 assert.equal($('prepare-mint').disabled,false);assert.deepEqual(f.calls,['connect']);click('prepare-mint');await settle();
 assert.match($('mint-review').textContent,/100000/);assert.match($('mint-review').textContent,/arc69/);assert.match($('mint-review').textContent,/unsigned/);assert.equal($('sign-mint').disabled,false);
 const reviewed=sdk.decodeUnsignedTransaction(f.app.mint.review.unsigned);assert.deepEqual(reviewed.note,f.app.doc.bytes);assert.equal(reviewed.assetConfig.assetURL,$('asset-url').value);
 click('sign-mint');await settle();assert.equal(f.calls.filter(x=>x==='sign').length,1);assert.ok(!f.calls.includes('send'));assert.equal($('broadcast-mint').disabled,false);
 click('broadcast-mint');await settle();assert.equal(f.calls.filter(x=>x==='send').length,1);assert.match($('mint-status').textContent,/not confirmed/i);
 assert.deepEqual(f.calls.filter(x=>typeof x==='string'),['connect','params','account','sign','params','account','send']);
 const txid=f.app.mint.receipt.txid;click('disconnect');input('description','changed');await settle();assert.equal(f.app.mint.receipt.txid,txid);assert.equal($('prepare-mint').disabled,true);
 click('check-confirmation');await settle();assert.match($('mint-status').textContent,/Confirmed minted/);assert.match($('mint-status').textContent,/42/);assert.deepEqual(f.calls.find(x=>Array.isArray(x)),['pending',txid]);
 const reload=await setup(f.memory);assert.deepEqual(reload.calls,[]);assert.equal(reload.$('prepare-mint').disabled,true);assert.equal(reload.app.mint.receipt.txid,txid);assert.equal(reload.$('start-another').disabled,true);
 click('start-another');assert.equal(f.app.mint.receipt,null);assert.equal(f.memory.size,0);
 await reload.window.happyDOM.close();await f.window.happyDOM.close();
});
