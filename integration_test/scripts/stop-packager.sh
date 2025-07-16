#!/bin/bash
# Stop the packager process for the current directory

ps aux | grep "$(pwd)" | grep launchPackager | awk '{print $2}' | xargs -r kill
exit 0