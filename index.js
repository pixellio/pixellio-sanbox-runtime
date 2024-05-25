import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';
import {astFusion as myQuickJSAddon} from "ast-fusion-addon"


if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 3000 + i
    });
  }

  setupPrimary();
} else {
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
    );
  `);

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:8000"
    },
    connectionStateRecovery: {},
    adapter: createAdapter()
  });

  const __dirname = dirname(fileURLToPath(import.meta.url));

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  io.on('connection', async (socket) => {
    socket.on('chat message', async (msg, clientOffset, callback) => {
      console.log({ msg})
      let myfunction;   
      if (msg) {
        myfunction = myQuickJSAddon.myFunction(`${msg}`, "20");
        console.log({ myfunction });
      }
      

      const resul = myQuickJSAddon.processArgs(42,'s36s',6);
      console.log(resul); 


      // Define a JavaScript function to be called from C
      function myCallback(x) {
          console.log('JavaScript function called from C!',x);
          return 'Hello from JavaScript!';
      }

      function AddTwo(num) {
          console.log({ num})
          return num + 23.23 +"HI";
      }

      global.AddTwo = AddTwo;
      // Call the C function from the native addon
      const cb_result = myQuickJSAddon.callBackFunction(myCallback);

      console.log('Result from C:', JSON.stringify(cb_result));


      // Call the C/C++ function from Node.js
      // console.log({ module }, module.children[0])
      const apiResponse =  myQuickJSAddon.callNodeFunction("https://api.example.com/data");
      let result;
      try {
        result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
      } catch (e) {
        if (e.errno === 19 /* SQLITE_CONSTRAINT */ ) {
          callback();
        } else {
          // nothing to do, just let the client retry
        }
        return;
      }
      io.emit('chat message', myfunction, result.lastID);
      callback();
    });

    if (!socket.recovered) {
      try {
        await db.each('SELECT id, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', row.content, row.id);
          }
        )
      } catch (e) {
        // something went wrong
      }
    }
  });

  const port = process.env.PORT;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}
