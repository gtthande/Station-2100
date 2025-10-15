# MySQL Shadow Database Verification Script
# This script verifies the MySQL shadow database migration

param(
    [string]$Host = "127.0.0.1",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Password = "",
    [string]$Database = "station2100_mysql_shadow"
)

Write-Host "MySQL Shadow Database Verification" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test connection
Write-Host "`nTesting MySQL connection..." -ForegroundColor Yellow
try {
    $connectionString = "Server=$Host;Port=$Port;Database=$Database;Uid=$User;Pwd=$Password;"
    $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
    $connection.Open()
    Write-Host "✓ Connected to MySQL successfully" -ForegroundColor Green
    $connection.Close()
} catch {
    Write-Host "✗ Failed to connect to MySQL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get MySQL version
Write-Host "`nGetting MySQL version..." -ForegroundColor Yellow
try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT VERSION()"
    $version = $command.ExecuteScalar()
    Write-Host "MySQL Version: $version" -ForegroundColor Cyan
    $connection.Close()
} catch {
    Write-Host "✗ Failed to get MySQL version: $($_.Exception.Message)" -ForegroundColor Red
}

# Get table count
Write-Host "`nGetting table information..." -ForegroundColor Yellow
try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = "SHOW TABLES"
    $reader = $command.ExecuteReader()
    
    $tables = @()
    while ($reader.Read()) {
        $tables += $reader[0]
    }
    $reader.Close()
    $connection.Close()
    
    Write-Host "✓ Found $($tables.Count) tables" -ForegroundColor Green
    
    # Get row counts for each table
    Write-Host "`nRow counts by table:" -ForegroundColor Yellow
    foreach ($table in $tables) {
        try {
            $connection.Open()
            $command = $connection.CreateCommand()
            $command.CommandText = "SELECT COUNT(*) FROM `$table"
            $count = $command.ExecuteScalar()
            Write-Host "  $table`: $count rows" -ForegroundColor Cyan
            $connection.Close()
        } catch {
            Write-Host "  $table`: Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "✗ Failed to get table information: $($_.Exception.Message)" -ForegroundColor Red
}

# Check for users table specifically
Write-Host "`nChecking for users (profiles) table..." -ForegroundColor Yellow
try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT COUNT(*) FROM profiles"
    $userCount = $command.ExecuteScalar()
    Write-Host "✓ Users (profiles) table: $userCount rows" -ForegroundColor Green
    
    if ($userCount -gt 0) {
        $command.CommandText = "SELECT id, email, full_name FROM profiles LIMIT 3"
        $reader = $command.ExecuteReader()
        Write-Host "Sample users:" -ForegroundColor Cyan
        while ($reader.Read()) {
            Write-Host "  - $($reader['email']) ($($reader['full_name']))" -ForegroundColor Cyan
        }
        $reader.Close()
    }
    $connection.Close()
} catch {
    Write-Host "✗ Error checking users table: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nVerification completed!" -ForegroundColor Green
