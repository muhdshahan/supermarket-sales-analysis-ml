#!/bin/bash
# Script to reset PostgreSQL password for supermarket_user

echo "Resetting password for supermarket_user..."
echo "You may be prompted for your PostgreSQL postgres user password"

# Try to reset password
psql -U postgres << EOF
ALTER USER supermarket_user WITH PASSWORD 'hey';
\q
EOF

if [ $? -eq 0 ]; then
    echo "Password reset successfully!"
    echo "You can now run: python manage.py runserver"
else
    echo "Failed to reset password. Try running manually:"
    echo "  sudo -u postgres psql"
    echo "Then run: ALTER USER supermarket_user WITH PASSWORD 'hey';"
fi

