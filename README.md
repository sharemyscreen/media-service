# ShareMyScreen Media Service

## Configuration

Media Service configuration can be achieved by two ways.

### package.json config section

You can configure the service by altering properties under the **"config"** section in the root package.json file of the sharemyscreen-media-service module.

```
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

ShareMyScreen Media Service uses [socket.io](socket.io) to communicate data over network.
It is **strongly recommended** to read some of the official documentation to get used to.

Here are some other useful links:
- [socket.io-client-js](https://github.com/socketio/socket.io-client)
- [socket.io-client-java](https://github.com/socketio/socket.io-client-java)
- [socket.io-client-swift](https://github.com/socketio/socket.io-client-swift)

### events
