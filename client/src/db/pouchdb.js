// src/db/pouchdb.js
import PouchDB from 'pouchdb';

const localDB = new PouchDB('disaster_reports');

const remoteDB = new PouchDB('http://admin:admin123@127.0.0.1:5984/disaster_reports');

localDB.sync(remoteDB, {
  live: true,
  retry: true
}).on('change', (info) => {
  console.log('🔄 Sync change:', info);
}).on('paused', (err) => {
  console.log('⏸️ Sync paused:', err || "No error");
}).on('active', () => {
  console.log('▶️ Sync active');
}).on('denied', (err) => {
  console.error('❌ Sync denied:', err);
}).on('error', (err) => {
  console.error('🔥 Sync error:', err);
});

export default localDB;
