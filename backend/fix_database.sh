#!/bin/bash
# Fix database connection issues

echo "=== Fixing Database Connection ==="
echo ""

# Check if we can connect as postgres
echo "Step 1: Testing PostgreSQL connection..."
if psql -U postgres -l > /dev/null 2>&1; then
    echo "✓ Can connect as postgres user"
    echo ""
    echo "Step 2: Resetting password for supermarket_user..."
    psql -U postgres << 'EOF'
ALTER USER supermarket_user WITH PASSWORD 'hey';
\q
EOF
    if [ $? -eq 0 ]; then
        echo "✓ Password reset successfully!"
    else
        echo "✗ Failed to reset password"
        exit 1
    fi
elif sudo -n true 2>/dev/null; then
    echo "✓ Sudo access available (no password required)"
    echo ""
    echo "Step 2: Resetting password for supermarket_user..."
    sudo -u postgres psql << 'EOF'
ALTER USER supermarket_user WITH PASSWORD 'hey';
\q
EOF
    if [ $? -eq 0 ]; then
        echo "✓ Password reset successfully!"
    else
        echo "✗ Failed to reset password"
        exit 1
    fi
else
    echo "✗ Cannot connect to PostgreSQL automatically"
    echo ""
    echo "Please run this command manually:"
    echo "  sudo -u postgres psql"
    echo ""
    echo "Then in psql, run:"
    echo "  ALTER USER supermarket_user WITH PASSWORD 'hey';"
    echo "  \\q"
    exit 1
fi

echo ""
echo "Step 3: Testing connection with new password..."
export PGPASSWORD=hey
if psql -U supermarket_user -d supermarket_db -h localhost -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection successful!"
    echo ""
    echo "You can now run: python manage.py runserver"
else
    echo "✗ Connection test failed. Please verify:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database 'supermarket_db' exists"
    echo "  3. User 'supermarket_user' exists"
fi

