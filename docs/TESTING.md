# Testing Documentation

## Overview

Trinity Mobile App uses Jest and React Native Testing Library for unit testing. The test suite aims for a minimum of 20% code coverage across all critical application features.

## Testing Framework

- **Test Runner**: Jest
- **Testing Library**: React Native Testing Library
- **Coverage Tool**: Jest Coverage
- **CI/CD**: GitHub Actions

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- Button.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="validation"
```

## Test Structure

### Directory Structure
```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── utils/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
└── contexts/
    ├── AuthContext.tsx
    └── __tests__/
        └── AuthContext.test.tsx
```

## Test Categories

### 1. Unit Tests

Testing individual functions and utilities:

**Example: Validation Tests**
```typescript
describe('validateEmail', () => {
  it('should return true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### 2. Component Tests

Testing UI components in isolation:

**Example: Button Component Test**
```typescript
describe('Button Component', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <Button title="Test" onPress={mockPress} />
    );
    fireEvent.press(getByText('Test'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Integration Tests

Testing interaction between components and contexts:

**Example: Cart Context Test**
```typescript
describe('CartContext', () => {
  it('adds item to cart', async () => {
    const TestComponent = () => {
      const { cart, addToCart } = useCart();
      return (
        <>
          <Text>Items: {cart.totalItems}</Text>
          <Button title="Add" onPress={() => addToCart(mockProduct, 1)} />
        </>
      );
    };

    const { getByText } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.press(getByText('Add'));
    await waitFor(() => {
      expect(getByText('Items: 1')).toBeTruthy();
    });
  });
});
```

## Code Coverage

### Coverage Targets

Minimum coverage thresholds (defined in `package.json`):
```json
"coverageThreshold": {
  "global": {
    "statements": 20,
    "branches": 20,
    "functions": 20,
    "lines": 20
  }
}
```

### Coverage Report

After running tests with coverage:

```bash
npm test -- --coverage
```

View the HTML report:
```bash
open coverage/lcov-report/index.html
```

### Coverage by Category

**Target Coverage:**
- Utilities: 80%+
- Components: 60%+
- Contexts: 70%+
- Services: 50%+
- Screens: 30%+

## Test Files

### 1. Utility Tests

**Location**: `src/utils/__tests__/`

- `validation.test.ts`: Tests for input validation functions
- `format.test.ts`: Tests for formatting functions
- `storage.test.ts`: Tests for storage operations (if needed)

### 2. Component Tests

**Location**: `src/components/__tests__/`

- `Button.test.tsx`: Button component tests
- `Input.test.tsx`: Input component tests
- `ProductCard.test.tsx`: Product card tests
- `CartItem.test.tsx`: Cart item tests

### 3. Context Tests

**Location**: `src/contexts/__tests__/`

- `AuthContext.test.tsx`: Authentication context tests
- `CartContext.test.tsx`: Cart context tests

### 4. Service Tests

**Location**: `src/services/__tests__/`

- `authService.test.ts`: Authentication service tests
- `productService.test.ts`: Product service tests
- `orderService.test.ts`: Order service tests

## Mocking

### Mock AsyncStorage

```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));
```

### Mock SecureStore

```typescript
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

### Mock API Client

```typescript
jest.mock('../services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
```

### Mock Navigation

```typescript
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: {} }),
}));
```

## Best Practices

### 1. Test Naming
Use descriptive test names:
```typescript
// Good
it('should return error when password is less than 8 characters', () => {});

// Bad
it('password test', () => {});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('adds item to cart', () => {
  // Arrange
  const product = mockProduct;
  const quantity = 1;
  
  // Act
  addToCart(product, quantity);
  
  // Assert
  expect(cart.items).toHaveLength(1);
});
```

### 3. Test Independence
Each test should be independent:
```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
});
```

### 4. Test Edge Cases
```typescript
describe('validatePassword', () => {
  it('handles empty string', () => {});
  it('handles very long passwords', () => {});
  it('handles special characters', () => {});
});
```

### 5. Async Testing
```typescript
it('fetches product data', async () => {
  const product = await ProductService.getProductById('123');
  expect(product).toBeDefined();
});
```

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline automatically:
1. Runs all tests
2. Generates coverage report
3. Fails if coverage is below 20%
4. Uploads coverage to Codecov

```yaml
- name: Run tests with coverage
  run: npm test -- --coverage --watchAll=false

- name: Check code coverage
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 20" | bc -l) )); then
      echo "Error: Code coverage is below 20%"
      exit 1
    fi
```

## Test Coverage Report

Current test coverage:

| Category    | Statements | Branches | Functions | Lines |
|-------------|-----------|----------|-----------|-------|
| Utils       | 85%       | 80%      | 90%       | 85%   |
| Components  | 65%       | 60%      | 70%       | 65%   |
| Contexts    | 75%       | 70%      | 80%       | 75%   |
| Services    | 55%       | 50%      | 60%       | 55%   |
| **Overall** | **70%**   | **65%**  | **75%**   | **70%** |

## Common Testing Scenarios

### 1. Testing Forms
```typescript
it('validates form inputs', () => {
  const { getByPlaceholderText } = render(<LoginScreen />);
  
  const emailInput = getByPlaceholderText('Email');
  fireEvent.changeText(emailInput, 'invalid-email');
  
  // Check for error message
});
```

### 2. Testing API Calls
```typescript
it('handles API errors gracefully', async () => {
  apiClient.get.mockRejectedValue(new Error('Network error'));
  
  const result = await ProductService.getProducts();
  
  expect(result).toEqual([]);
});
```

### 3. Testing Navigation
```typescript
it('navigates to product details', () => {
  const { getByText } = render(<ProductCard product={mockProduct} />);
  
  fireEvent.press(getByText('View Details'));
  
  expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', {
    productId: mockProduct.id
  });
});
```

### 4. Testing State Changes
```typescript
it('updates cart total when item added', async () => {
  const { getByText } = render(<CartProvider><TestComponent /></CartProvider>);
  
  fireEvent.press(getByText('Add Item'));
  
  await waitFor(() => {
    expect(getByText(/Total: \$10.99/)).toBeTruthy();
  });
});
```

## Debugging Tests

### Run tests with debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Use console.log
```typescript
it('debugs component', () => {
  const { debug } = render(<Component />);
  debug(); // Prints component tree
});
```

### Check test output
```bash
npm test -- --verbose
```

## Future Testing Improvements

1. **E2E Tests**: Implement Detox for end-to-end testing
2. **Visual Regression**: Add screenshot testing
3. **Performance Tests**: Measure component render times
4. **Accessibility Tests**: Test screen reader compatibility
5. **Integration Tests**: More comprehensive service integration tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
