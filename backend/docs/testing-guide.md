# FanzFinance OS - Testing Guide

This comprehensive testing guide covers all aspects of testing the FanzFinance OS system, from unit tests to integration tests and performance testing.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [API Testing](#api-testing)
6. [Database Testing](#database-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Test Data Management](#test-data-management)
10. [Continuous Integration](#continuous-integration)
11. [Test Reporting](#test-reporting)
12. [Troubleshooting](#troubleshooting)

## Testing Strategy

### Test Pyramid

```
       /\
      /  \     E2E Tests (5%)
     /____\    Integration Tests (15%)
    /______\   Unit Tests (80%)
```

- **Unit Tests (80%)**: Fast, isolated tests for individual functions and classes
- **Integration Tests (15%)**: Test interactions between components
- **End-to-End Tests (5%)**: Full workflow testing through the API

### Coverage Goals

- **Overall Code Coverage**: 85%+
- **Critical Payment Logic**: 95%+
- **Financial Calculations**: 100%
- **Security Functions**: 95%+

## Test Environment Setup

### Database Setup

```bash
# Create test database
createdb fanz_ecosystem_test

# Initialize with migrations
./scripts/migrate.sh init --database fanz_ecosystem_test --env test

# Seed with test data
./scripts/migrate.sh seed --database fanz_ecosystem_test
```

### Environment Variables

```bash
# Test environment configuration
export NODE_ENV=test
export DATABASE_URL=postgresql://postgres:password@localhost:5432/fanz_ecosystem_test
export REDIS_URL=redis://localhost:6379/1
export JWT_SECRET=test-jwt-secret-key-for-testing-only
export LOG_LEVEL=error
export ENABLE_RATE_LIMITING=false
```

### Test Dependencies

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/supertest": "^2.0.12",
    "jest": "^29.6.4",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "jest-extended": "^4.0.1",
    "nock": "^13.3.3",
    "faker": "^6.6.6"
  }
}
```

## Unit Testing

### Controller Testing

```typescript
// Example: PaymentController unit test
describe('PaymentController', () => {
  let controller: PaymentController;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  beforeEach(() => {
    mockPaymentService = createMockPaymentService();
    mockTransactionService = createMockTransactionService();
    controller = new PaymentController(mockPaymentService, mockTransactionService);
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const mockTransaction = createMockTransaction();
      const req = createMockRequest({
        body: {
          transaction_type: 'tip',
          amount: 25.00,
          recipient_id: 'creator-id',
          payment_method: 'credit_card'
        }
      });
      const res = createMockResponse();

      mockPaymentService.createTransaction.mockResolvedValue(mockTransaction);

      await controller.createTransaction(req, res);

      expect(mockPaymentService.createTransaction).toHaveBeenCalledWith({
        transaction_type: 'tip',
        amount: 25.00,
        recipient_id: 'creator-id',
        payment_method: 'credit_card',
        sender_id: req.user.id
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTransaction);
    });

    it('should handle validation errors', async () => {
      const req = createMockRequest({
        body: { amount: -10 } // Invalid amount
      });
      const res = createMockResponse();

      await controller.createTransaction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: expect.stringContaining('amount must be positive')
        })
      );
    });
  });
});
```

### Service Testing

```typescript
// Example: Financial calculation testing
describe('PaymentService', () => {
  describe('calculateFees', () => {
    it('should calculate platform fees correctly for tips', () => {
      const service = new PaymentService();
      const amount = 100.00;
      const transactionType = 'tip';

      const fees = service.calculateFees(amount, transactionType);

      expect(fees.platformFee).toBe(3.00); // 3% for tips
      expect(fees.processingFee).toBe(0.30); // Fixed processing fee
      expect(fees.totalFees).toBe(3.30);
      expect(fees.netAmount).toBe(96.70);
    });

    it('should calculate different fees for subscriptions', () => {
      const service = new PaymentService();
      const amount = 100.00;
      const transactionType = 'subscription';

      const fees = service.calculateFees(amount, transactionType);

      expect(fees.platformFee).toBe(7.50); // 7.5% for subscriptions
      expect(fees.processingFee).toBe(0.30);
      expect(fees.totalFees).toBe(7.80);
      expect(fees.netAmount).toBe(92.20);
    });
  });

  describe('validateTransaction', () => {
    it('should validate minimum amounts', () => {
      const service = new PaymentService();
      const transaction = {
        amount: 0.50, // Below $1 minimum
        transaction_type: 'tip'
      };

      expect(() => service.validateTransaction(transaction))
        .toThrow('Minimum transaction amount is $1.00');
    });
  });
});
```

### Model Testing

```typescript
describe('Transaction Model', () => {
  it('should calculate net amount correctly', () => {
    const transaction = new Transaction({
      amount: 100.00,
      fee_amount: 5.00
    });

    expect(transaction.net_amount).toBe(95.00);
  });

  it('should validate transaction types', () => {
    expect(() => new Transaction({
      transaction_type: 'invalid_type'
    })).toThrow('Invalid transaction type');
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// Example: Payment API integration test
describe('Payment API Integration', () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await getTestAuthToken();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/payments/transactions', () => {
    it('should create a transaction end-to-end', async () => {
      const transactionData = {
        transaction_type: 'tip',
        recipient_id: 'creator-123',
        amount: 25.00,
        currency: 'USD',
        payment_method: 'credit_card',
        payment_method_details: {
          card_token: 'test-card-token'
        }
      };

      const response = await request(app)
        .post('/api/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        transaction_type: 'tip',
        amount: 25.00,
        status: 'pending',
        net_amount: expect.any(Number)
      });

      // Verify database state
      const transaction = await db.query(
        'SELECT * FROM transactions WHERE id = $1',
        [response.body.id]
      );
      expect(transaction.rows).toHaveLength(1);

      // Verify journal entry was created
      const journalEntries = await db.query(
        'SELECT * FROM journal_entries WHERE transaction_id = $1',
        [response.body.id]
      );
      expect(journalEntries.rows).toHaveLength(1);
    });

    it('should handle insufficient balance', async () => {
      // Set user balance to $5
      await setUserBalance('user-123', 5.00);

      const transactionData = {
        transaction_type: 'tip',
        recipient_id: 'creator-123',
        amount: 25.00, // More than balance
        payment_method: 'store_credit'
      };

      const response = await request(app)
        .post('/api/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.error).toBe('Insufficient Balance');
    });
  });

  describe('GET /api/payments/dashboard', () => {
    beforeEach(async () => {
      // Seed test data
      await createTestTransactions([
        { type: 'tip', amount: 10.00, date: '2024-01-15' },
        { type: 'subscription', amount: 20.00, date: '2024-01-16' },
        { type: 'content_purchase', amount: 5.00, date: '2024-01-17' }
      ]);
    });

    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/payments/dashboard?period=month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        total_transactions: 3,
        total_volume: 35.00,
        total_fees: expect.any(Number),
        transaction_breakdown: expect.objectContaining({
          tip: 1,
          subscription: 1,
          content_purchase: 1
        }),
        recent_transactions: expect.arrayContaining([
          expect.objectContaining({
            transaction_type: expect.any(String),
            amount: expect.any(Number)
          })
        ])
      });
    });
  });
});
```

### Database Integration Tests

```typescript
describe('Database Operations', () => {
  describe('Transaction Creation with Journal Entries', () => {
    it('should create transaction and journal entries atomically', async () => {
      const transactionData = {
        transaction_type: 'tip',
        sender_id: 'user-123',
        recipient_id: 'creator-456',
        amount: 25.00,
        fee_amount: 1.25
      };

      await db.transaction(async (trx) => {
        const transaction = await createTransaction(transactionData, trx);
        const journalEntry = await createJournalEntry(transaction.id, trx);
        
        expect(transaction.id).toBeTruthy();
        expect(journalEntry.id).toBeTruthy();
        
        // Verify double-entry bookkeeping
        const journalLines = await getJournalEntryLines(journalEntry.id, trx);
        expect(journalLines).toHaveLength(3); // Debit user, credit creator, credit platform
        
        const totalDebits = journalLines.reduce((sum, line) => sum + line.debit_amount, 0);
        const totalCredits = journalLines.reduce((sum, line) => sum + line.credit_amount, 0);
        expect(totalDebits).toBe(totalCredits); // Verify balanced entries
      });
    });

    it('should rollback on journal entry failure', async () => {
      const transactionData = {
        transaction_type: 'tip',
        sender_id: 'user-123',
        recipient_id: 'invalid-creator', // This will cause journal entry to fail
        amount: 25.00,
        fee_amount: 1.25
      };

      await expect(
        db.transaction(async (trx) => {
          const transaction = await createTransaction(transactionData, trx);
          await createJournalEntry(transaction.id, trx); // This will fail
        })
      ).rejects.toThrow();

      // Verify no transaction was created
      const transactions = await db.query(
        'SELECT * FROM transactions WHERE sender_id = $1',
        ['user-123']
      );
      expect(transactions.rows).toHaveLength(0);
    });
  });
});
```

## API Testing

### Authentication Testing

```typescript
describe('Authentication', () => {
  it('should reject requests without token', async () => {
    await request(app)
      .get('/api/payments/transactions')
      .expect(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    
    await request(app)
      .get('/api/payments/transactions')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('should accept valid tokens', async () => {
    const validToken = await generateValidToken();
    
    await request(app)
      .get('/api/payments/transactions')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
```

### Rate Limiting Testing

```typescript
describe('Rate Limiting', () => {
  it('should rate limit payment endpoints', async () => {
    const authToken = await getTestAuthToken();
    
    // Make requests up to the limit
    for (let i = 0; i < 20; i++) {
      await request(app)
        .get('/api/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    
    // Next request should be rate limited
    await request(app)
      .get('/api/payments/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(429);
  });
});
```

## Database Testing

### Migration Testing

```bash
# Test migrations up
./scripts/migrate.sh migrate --database test_migration_db

# Test migrations down (if rollback is implemented)
./scripts/migrate.sh rollback --database test_migration_db

# Test fresh database setup
./scripts/migrate.sh reset --database test_fresh_db --force
./scripts/migrate.sh init --database test_fresh_db
```

### Data Consistency Testing

```typescript
describe('Data Consistency', () => {
  it('should maintain balance consistency after transactions', async () => {
    const userId = 'test-user-123';
    const initialBalance = 100.00;
    
    // Set initial balance
    await setUserBalance(userId, initialBalance);
    
    // Create multiple transactions
    const transactions = [
      { type: 'tip', amount: 10.00 },
      { type: 'tip', amount: 15.00 },
      { type: 'withdrawal', amount: 25.00 }
    ];
    
    for (const tx of transactions) {
      await createTransaction({
        ...tx,
        sender_id: userId
      });
    }
    
    // Verify final balance
    const finalBalance = await getUserBalance(userId);
    const expectedBalance = initialBalance - 50.00; // Total of all transactions
    
    expect(finalBalance.available).toBe(expectedBalance);
    
    // Verify balance change audit trail
    const balanceChanges = await getBalanceChanges(userId);
    expect(balanceChanges).toHaveLength(3);
  });
});
```

## Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent transactions', async () => {
    const concurrentRequests = 50;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      const promise = request(app)
        .post('/api/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transaction_type: 'tip',
          recipient_id: 'creator-123',
          amount: 1.00,
          payment_method: 'store_credit'
        });
      promises.push(promise);
    }
    
    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(201);
    });
    
    // Verify database consistency
    const transactions = await db.query(
      'SELECT COUNT(*) FROM transactions WHERE recipient_id = $1',
      ['creator-123']
    );
    expect(parseInt(transactions.rows[0].count)).toBe(concurrentRequests);
  });

  it('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/payments/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(500); // Should respond within 500ms
  });
});
```

## Security Testing

### Input Validation Testing

```typescript
describe('Security - Input Validation', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE transactions; --";
    
    const response = await request(app)
      .get(`/api/payments/transactions?user_id=${maliciousInput}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
    
    expect(response.body.error).toBe('Validation Error');
    
    // Verify table still exists
    const result = await db.query("SELECT 1 FROM transactions LIMIT 1");
    expect(result).toBeDefined();
  });

  it('should validate transaction amounts', async () => {
    const testCases = [
      { amount: -10, expected: 400 },
      { amount: 0, expected: 400 },
      { amount: 0.001, expected: 400 }, // Below minimum
      { amount: 1000000, expected: 400 }, // Above maximum
      { amount: 'invalid', expected: 400 },
      { amount: null, expected: 400 }
    ];

    for (const testCase of testCases) {
      const response = await request(app)
        .post('/api/payments/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transaction_type: 'tip',
          recipient_id: 'creator-123',
          amount: testCase.amount,
          payment_method: 'credit_card'
        });

      expect(response.status).toBe(testCase.expected);
    }
  });
});
```

### Authorization Testing

```typescript
describe('Security - Authorization', () => {
  it('should prevent users from accessing other users transactions', async () => {
    const user1Token = await generateTokenForUser('user-1');
    const user2Token = await generateTokenForUser('user-2');
    
    // Create transaction for user-1
    const response1 = await request(app)
      .post('/api/payments/transactions')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        transaction_type: 'tip',
        recipient_id: 'creator-123',
        amount: 10.00,
        payment_method: 'credit_card'
      })
      .expect(201);
    
    const transactionId = response1.body.id;
    
    // User-2 tries to access user-1's transaction
    await request(app)
      .get(`/api/payments/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(403);
  });
});
```

## Test Data Management

### Test Data Factory

```typescript
// Test data factory for creating consistent test objects
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      role: 'user',
      created_at: new Date(),
      ...overrides
    };
  }

  static createTransaction(overrides: Partial<Transaction> = {}): Transaction {
    return {
      id: faker.datatype.uuid(),
      transaction_type: 'tip',
      sender_id: faker.datatype.uuid(),
      recipient_id: faker.datatype.uuid(),
      amount: faker.datatype.float({ min: 1, max: 100 }),
      currency: 'USD',
      status: 'completed',
      payment_method: 'credit_card',
      created_at: new Date(),
      ...overrides
    };
  }

  static createSubscriptionPlan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
    return {
      id: faker.datatype.uuid(),
      creator_id: faker.datatype.uuid(),
      name: faker.commerce.productName(),
      price: faker.datatype.float({ min: 5, max: 50 }),
      billing_cycle: 'monthly',
      is_active: true,
      created_at: new Date(),
      ...overrides
    };
  }
}
```

### Database Cleanup

```typescript
// Utility for cleaning test data between tests
export class DatabaseCleaner {
  static async cleanAll(): Promise<void> {
    await db.query('TRUNCATE TABLE transactions RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE user_subscriptions RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE subscription_plans RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE payouts RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE journal_entries RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE journal_entry_lines RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE user_balances RESTART IDENTITY CASCADE');
    await db.query('TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE');
  }

  static async cleanUserData(userId: string): Promise<void> {
    await db.query('DELETE FROM transactions WHERE sender_id = $1 OR recipient_id = $1', [userId]);
    await db.query('DELETE FROM user_balances WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM user_subscriptions WHERE subscriber_id = $1', [userId]);
  }
}
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fanz_ecosystem_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        chmod +x scripts/migrate.sh
        ./scripts/migrate.sh init --database fanz_ecosystem_test --host localhost
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fanz_ecosystem_test
    
    - name: Run lint
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fanz_ecosystem_test
        REDIS_URL: redis://localhost:6379/1
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fanz_ecosystem_test
        REDIS_URL: redis://localhost:6379/1
    
    - name: Generate coverage report
      run: npm run test:coverage
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fanz_ecosystem_test
        REDIS_URL: redis://localhost:6379/1
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## Test Reporting

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Results Dashboard

```typescript
// Custom test reporter for detailed metrics
export class TestMetricsReporter {
  onTestResult(test: Test, testResult: TestResult) {
    const metrics = {
      suiteName: testResult.testFilePath,
      tests: testResult.numPassingTests + testResult.numFailingTests,
      passed: testResult.numPassingTests,
      failed: testResult.numFailingTests,
      duration: testResult.perfStats.runtime,
      coverage: testResult.coverage
    };

    // Send to monitoring system
    this.sendMetrics(metrics);
  }
}
```

## Troubleshooting

### Common Test Issues

#### Database Connection Issues
```bash
# Check if test database exists
psql -l | grep fanz_ecosystem_test

# Recreate test database
dropdb fanz_ecosystem_test
createdb fanz_ecosystem_test
./scripts/migrate.sh init --database fanz_ecosystem_test
```

#### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Clear Redis test data
redis-cli -n 1 FLUSHDB
```

#### Test Timeout Issues
```javascript
// Increase timeout for slow tests
jest.setTimeout(30000); // 30 seconds
```

#### Memory Leaks in Tests
```javascript
// Proper cleanup in tests
afterEach(async () => {
  await DatabaseCleaner.cleanAll();
  await clearRedisCache();
  jest.clearAllMocks();
});
```

### Debug Test Failures

```bash
# Run specific test file
npm test -- payment.controller.test.ts

# Run with verbose output
npm test -- --verbose

# Run in watch mode
npm run test:watch

# Debug with Chrome DevTools
node --inspect-brk node_modules/.bin/jest --runInBand payment.controller.test.ts
```

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Keep tests independent and idempotent

### Mocking Strategy
- Mock external dependencies (APIs, third-party services)
- Use real database for integration tests
- Mock time-sensitive functions (Date.now(), setTimeout)
- Avoid mocking business logic

### Data Management
- Use factories for creating test data
- Clean up data between tests
- Use transactions for test isolation when possible
- Seed consistent test data for integration tests

### Assertion Patterns
```typescript
// Good: Specific assertions
expect(response.body.amount).toBe(25.00);
expect(response.body.status).toBe('completed');

// Avoid: Overly broad assertions
expect(response.body).toMatchSnapshot();
```

---

This testing guide provides comprehensive coverage of all testing aspects for the FanzFinance OS system. Regular testing ensures system reliability and helps catch issues early in the development process.