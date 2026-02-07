# Testing Documentation

## Overview

Test coverage for the Peyto application, including frontend (TypeScript/React) and backend (Rust) tests.

## Test Statistics

### Frontend Tests (Vitest)
- **14 tests** in 1 test suite
- Test file: `src/hooks/useClients.test.ts`

### Backend Tests (Rust)
- **5 tests** for credential handling
- Tests validate encoding/decoding, error formatting, and data serialization

## Running Tests

### Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Backend Tests

```bash
# Run Rust tests
cd src-tauri
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_credential_lifecycle
```

## Test Structure

### Frontend Tests

#### `src/hooks/useClients.test.ts` (14 tests)
Tests for the clients hook:

- **loadClients (3 tests)**
  - Loads clients from keyring
  - Returns empty array when none saved
  - Handles errors gracefully

- **saveClients (2 tests)**
  - Saves clients to keyring
  - Throws error if save fails

- **addClient (3 tests)**
  - Adds new client
  - Adds to existing list
  - Uses default fulfillment

- **removeClient (3 tests)**
  - Removes a client
  - Updates selected client
  - Sets selected to null when removing last

- **switchClient (1 test)**
  - Switches to different client

- **State Management (2 tests)**
  - Initializes with empty state
  - Allows manual state updates

### Backend Tests

#### `src-tauri/src/lib.rs` tests module (5 tests)

- **test_credential_lifecycle**
  - Validates command function signatures
  - Tests string to bytes conversion

- **test_utf8_encoding_decoding**
  - Tests various string formats
  - Validates UTF-8 encoding/decoding

- **test_json_serialization**
  - Tests JSON string storage
  - Validates JSON roundtrip

- **test_error_message_formatting**
  - Validates error message formats
  - Tests all error types

- **test_service_and_key_formatting**
  - Validates service name format
  - Validates key name formats

## Test Coverage Details

### Covered Functionality

#### Clients Hook
- Load clients from keyring
- Save clients to keyring
- Add client
- Remove client
- Switch client
- State management
- Error handling

#### Backend Commands
- UTF-8 encoding/decoding
- JSON serialization
- Error message formatting
- Service/key formatting

### Areas Without Tests

The following modules currently lack dedicated test files:
- `useInventory` hook (inventory loading, caching fallback)
- `inventoryCache` service (localStorage cache read/write)
- `keyringService` (OS keyring bridge, migration)
- `syncService` (full sync, partial sync)
- `VinoshipperClient` (API calls, retry logic, normalization)
- `csvParser` (CSV parsing, header detection)

## Mocking Strategy

### Frontend Mocks

1. **Tauri API Mock**
   - Mocks `@tauri-apps/api/core` invoke function
   - Allows testing without Tauri runtime
   - Configured in test setup

2. **localStorage Mock**
   - Full localStorage implementation
   - Persists during test execution
   - Cleared between tests

3. **Window Mock**
   - Mocks `__TAURI_INTERNALS__` for environment detection
   - Configurable for testing different environments

### Backend Tests

Backend tests focus on unit logic:
- String encoding/decoding
- Error formatting
- Data validation
- No mocking required (pure functions)

## CI/CD Integration

### Recommended GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test -- --run
      - run: npm run test:coverage

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cd src-tauri && cargo test
```

## Writing New Tests

### Frontend Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = yourFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Backend Test Template

```rust
#[test]
fn test_your_function() {
    // Arrange
    let input = "test";

    // Act
    let result = your_function(input);

    // Assert
    assert_eq!(result, "expected");
}
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "localStorage is not defined"
**Solution**: Ensure vitest.config.ts has `environment: 'jsdom'`

**Issue**: Mock not working
**Solution**: Clear mocks in beforeEach and check vi.mock() placement

**Issue**: Async hook tests fail
**Solution**: Wrap calls in `act()` and use `async/await`

**Issue**: Rust tests can't find module
**Solution**: Ensure test module has `#[cfg(test)]` attribute

## Best Practices

1. **Test Organization**
   - One test file per source file
   - Group related tests with describe()
   - Use descriptive test names

2. **Assertions**
   - One logical assertion per test
   - Use specific matchers (toBe, toEqual, toMatchObject)
   - Test both success and error cases

3. **Mocking**
   - Mock external dependencies only
   - Clear mocks between tests
   - Don't mock what you're testing

4. **Coverage**
   - Aim for >90% coverage
   - Focus on critical paths
   - Don't test implementation details

5. **Maintenance**
   - Update tests when code changes
   - Remove obsolete tests
   - Keep tests simple and readable
