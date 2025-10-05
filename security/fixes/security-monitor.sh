#!/bin/zsh
# Simple security monitoring for FANZ

SECURITY_DIR="$(pwd)/security"
MONITOR_LOG="${SECURITY_DIR}/monitoring/monitor-$(date '+%Y%m%d').log"

monitor() {
    while true; do
        # Check disk space
        disk=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        if [[ $disk -gt 90 ]]; then
            echo "$(date) - ALERT: High disk usage: ${disk}%" >> "$MONITOR_LOG"
        fi

        # Log status
        echo "$(date) - Security check - Disk: ${disk}%" >> "$MONITOR_LOG"
        
        sleep 300  # 5 minutes
    done
}

echo "Starting FANZ security monitoring..."
monitor &
echo $! > "${SECURITY_DIR}/monitoring/monitor.pid"
