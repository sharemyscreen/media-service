# ShareMyScreen Media Service

## Configuration

Media Service configuration can be achieved by two ways.

### package.json config section

You can configure the service by altering properties under the **"config"** section in the root package.json file of the sharemyscreen-media-service module.

```json
{
  [...],
  "config": {
    "port": 5000,
    "mqMasterUri": "tcp://localhost:7777/",
    "mongoUri": "mongodb://localhost:27017/sms",
    "kurentoUri": "ws://localhost:8888/kurento"
  },
  [...]
}
```

### environment variables

_recommended for production environment_

You can also configure the service by setting environment variables.

| Variable           | Description                   | Example              |
| :-------------     | :-------------                | :-------------       |
| SMS_MEDIA_PORT     | Port to listen on             | 5000                 |
| SMS_MQ_MASTER_URI  | Push notification service URI | tcp://localhost:7777/|
| SMS_MONGO_URI      | MongoDB service URI           | mongodb://localhost:27017/sms |
| SMS_KURENTO_URI    | Kurento Media Server URI | ws://localhost:8888/kurento|

**N.B.:** If environment variable is set, its value will be taken instead of the corresponding propertie under the package.json config section.

## Overview

ShareMyScreen Media Service uses [socket.io](http://socket.io) to communicate data over network.
It is **strongly recommended** to read some of the official documentation to get used to.

Here are some other useful links:
- [socket.io-client-js](https://github.com/socketio/socket.io-client)
- [socket.io-client-java](https://github.com/socketio/socket.io-client-java)
- [socket.io-client-swift](https://github.com/socketio/socket.io-client-swift)

### connection

The media server has **one socket.io namespace per organization**.

```html
<!-- Example for getting a socket connected to an organization namespace -->
<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script type="text/javascript">
  var socket = io.connect('ws://localhost:5000/${organization_public_id}');
</script>
```

Use the [API Service](http://api.sharemyscreen.fr:3000/doc/1.2.1/index.html#routes-organization-v1-organizations-get) to retrieve the organization public ID of the connected user.

### authentication

After having successfully connected the socket, the media service will expect it to authenticate.

```html
<!-- Example for authenticating the client socket -->
<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script type="text/javascript">
  var socket = io.connect('ws://localhost:5000/${organization_public_id}');

  socket.emit('authentication', { access_token: ${access_token} });
  socket.on('authenticated', function () {
    // Authentication successful
    // Use the socket from here
  });

  socket.on('unauthorized', function (err) {
    // Authentication failed
    // An Error object is passed to the callback
  });
</script>
```

The **access_token** is a regular access token given by the [Login Service](http://login.sharemyscreen.fr:3000/doc/1.0.2/index.html#routes-v1-oauth2-token-post).

## Events

### server -> client

Events emitted from server to client are to be listened on as the following example:
```html
<!-- Example for room scope: user_joined: { user_id, room_id } -->
<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script type="text/javascript">
  var socket = io.connect('ws://localhost:5000/${organization_public_id}');
  
  /* ... */
  
  socket.on('room_scope', function (data) {
    /**
     * data.cmd === 'user_joined'
     * data.user_id
     * data.room_id
     */
     
     switch (data.cmd) {
       /* Here is your logic */
     }
  });
  
  /* ... */
</script>
```

##### namespace_scope

* `user_connected: { user_id }` - emitted when a user connects to the namespace.
* `user_disconnected: { user_id }` - emitted when a user disconnects from the namespace.

##### room_scope

* `user_joined: { user_id, room_id }` - emitted when a user joined the room.
* `user_left: { user_id, room_id }` - emitted when a user left the room.
* `user_message: { user_id, room_id, content }` - emitted when a user sent a message to the room.
* `user_call_started: { user_id, room_id, content }` - emitted when a user starts a call.
* `user_call_accepted: { user_id, room_id }` - emitted when a user accepts a call.
* `user_call_rejected: { user_id, room_id }` - emitted when a user accepts a call.
 
##### user_scope

* `room_list: { [rooms] }` - emitted when *list_rooms* is called or you have been just connected to the namespace.
* `invited: { user_id, room_id }` - emitted when you have been added to a room.
* `kicked: { user_id, room_id }` - emitted when you have been removed from a room.
* `called: { user_id, room_id }` - emitted when you are being called from a room.

### client -> server

Events emitted from client to server are to be sent as the following example:
<!-- Example for create_room: { name, [users_id] } -->
<script src="https://cdn.socket.io/socket.io-1.4.5.js"></script>
<script type="text/javascript">
  var socket = io.connect('ws://localhost:5000/${organization_public_id}');
  
  /* ... */
  
  socket.emit('action', {
    cmd: 'create_room',
    name: 'foobar',
    users_id: [user1._id, user2._id, user3._id]
  });
  
  /* ... */
</script>
```

* `list_rooms: {}` - to emit to get all rooms you are in.
* `create_room: { name, [users_id] }` - to emit to create a room.
* `read_room: { room_id }` - to emit to get room properties.
* `update_room: { room_id, name }` - to emit to change a room properties.
* `delete_room: { room_id }` - to emit to delete a room.
* `kick_user: { room_id, user_id | [users_id] }` - to emit to kick a user from a room.
* `invite_user: { room_id, user_id | [users_id] }` - to emit to invite a user in a room.
* `start_call: { room_id }` - to emit to start a call.
* `accept_call: { room_id }` - to emit to accept a call.
* `reject_call: { room_id }` - to emit to reject a call.
* `send_message: { room_id, content }` - to emit to send a message to the room.
