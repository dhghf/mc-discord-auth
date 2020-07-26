# Code Base Moved
Please visit the new MCAuth, it brings better performance, and a better code
base

[Click Here](https://github.com/dhghf/mcauth)

This is the version 1 MCAuth, it started off as a proof of concept, but as it
got tested I realized it's time to adopt a different code base.

# MC Discord Authenticator Server v1
This Discord bot communicates with both Discord and a Minecraft server to
create an authentication whether it be a user has a certain role or that
they are even allowed on the Minecraft server.

LICENSE: [GNU GPLv3](./LICENSE)

## Setup
Install The Requirements:
 * [NodeJS](https://nodejs.org)

Run The Following Commands:
```shell script
# Install all the missing dependencies
npm install

# Run initial setup
npm run setup

# ... configure config/config.yaml
# Required:
# * Set the Discord bot token
# * Set the Discord server (guild_id)
# * Set the required Discord role (role_id)
# * Make sure the webserver port is valid

# Finally run start
npm start
```

Finally add the
[supported plugin](https://github.com/dhghf/mc-discord-auth-client) into
your Spigot Minecraft server plugins directory. In it's config provide it
the right address and port where this server is running, then for the
token take the webserver token from the [config](./config/config.yaml) 
and put it in the plugin's config. 

## Notes
If you need to set a different location for the config.yaml simply add an
environment variable "CONFIG_PATH" to the new location.

Example Shell Script:
```shell script
export CONFIG_PATH="/path/to/config.yaml"

npm start
```
