#!/bin/bash

ps aux | grep "$(pwd)" | grep "integration_test" | grep "start" | awk '{print $2}' | xargs -r kill

# kill process using port 8082 as well
lsof -ti:8082 | xargs -r kill

exit 0
