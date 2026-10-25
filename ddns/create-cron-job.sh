#!/bin/bash

# Define the schedule (e.g., daily at 2:30 AM)
SCHEDULE="30 2 * * *"

# Define the command and its arguments (ensure full paths are used)
COMMAND="/home/erw/codebase/self-host/ddns/update-ip-address.sh"
ARGUMENTS=""

# Construct the full cron line
CRON_LINE="${SCHEDULE} ${COMMAND} ${ARGUMENTS}"

# Update crontab without duplicates and without sorting order changes
(crontab -l 2>/dev/null; echo "$CRON_LINE") | awk '!x[$0]++' | crontab -

# Verify the script is executable (optional but recommended)
chmod +x "$COMMAND"
