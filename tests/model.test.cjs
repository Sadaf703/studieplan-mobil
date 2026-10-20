const {test}=require('node:test');
const assert=require('node:assert/strict');
const {initialState,reducer,remaining,parseState,validDate}=require('../src/model.ts');
const task={id:'a',title:'Lese kapittel 4',subject:'Studier',due:'2026-10-25',done:false};
test('En oppgave gir én belønning selv etter gjentatt avkryssing og sletting',()=>{
 let state=reducer(initialState,{type:'add',task});
 for(let i=0;i<3;i++)state=reducer(state,{type:'toggle',id:'a'});
 assert.deepEqual(state.earned,['a']);
 state=reducer(state,{type:'delete',id:'a'});
 assert.equal(state.tasks.length,0);assert.deepEqual(state.earned,['a']);
});
test('Låste katter og sløyfe kan ikke velges',()=>{
 assert.equal(reducer(initialState,{type:'cat',cat:'ginger'}).cat,'cream');
 assert.equal(reducer(initialState,{type:'bow'}).bow,false);
 const state={...initialState,earned:['a']};
 assert.equal(reducer(state,{type:'cat',cat:'ginger'}).cat,'ginger');
});
test('Timeren håndterer pause, fortsettelse og tid i bakgrunnen',()=>{
 let state=reducer(initialState,{type:'timer-toggle',now:1000});
 assert.equal(remaining(state.timer,61000),1440);
 state=reducer(state,{type:'timer-toggle',now:61000});
 assert.equal(remaining(state.timer,999999),1440);
 state=reducer(state,{type:'timer-toggle',now:100000});
 state=reducer(state,{type:'timer-finish',now:1600000});
 assert.deepEqual(state.timer,{mode:'break',remaining:300,endsAt:null});
 // Finishing never automatically starts the next session.
 assert.equal(reducer(state,{type:'timer-finish',now:1700000}),state);
});
test('Oppgaver, tema, belønninger og timer overlever lagring',()=>{
 let state=reducer(initialState,{type:'add',task});
 state=reducer(state,{type:'toggle',id:'a'});
 state=reducer(state,{type:'theme',theme:'dark'});
 state=reducer(state,{type:'timer-toggle',now:1000});
 assert.deepEqual(parseState(JSON.stringify(state)),state);
 assert.throws(()=>parseState('{bad json'));
 assert.throws(()=>parseState(JSON.stringify({...state,timer:{...state.timer,remaining:-1}})));
 assert.equal(validDate('2026-02-31'),false);
 assert.equal(validDate('2026-10-25'),true);
});
