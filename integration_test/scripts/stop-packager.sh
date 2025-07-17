#!/bin/bash

ps aux | grep "$(pwd)" | grep "integration_test" | grep "start" | awk '{print $2}' | xargs -r kill
exit 0
