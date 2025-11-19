# @vibe/shared-utils

Common utility functions shared across Vibe-Coding-Apps projects.

## Installation

```bash
pnpm add @vibe/shared-utils
```

## Usage

### String Utilities

```typescript
import { capitalize, kebabCase, camelCase, pascalCase, truncate, randomString } from '@vibe/shared-utils';

capitalize('hello'); // 'Hello'
kebabCase('helloWorld'); // 'hello-world'
camelCase('hello-world'); // 'helloWorld'
pascalCase('hello-world'); // 'HelloWorld'
truncate('Hello World', 8); // 'Hello...'
randomString(10); // 'aB3dE5fG7h'
```

### Array Utilities

```typescript
import { unique, chunk, shuffle, groupBy, intersection, difference } from '@vibe/shared-utils';

unique([1, 2, 2, 3]); // [1, 2, 3]
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4]
groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], 'type');
intersection([1, 2, 3], [2, 3, 4]); // [2, 3]
difference([1, 2, 3], [2, 3, 4]); // [1]
```

### Object Utilities

```typescript
import { deepClone, pick, omit, isEmpty, deepMerge } from '@vibe/shared-utils';

const obj = { a: 1, b: { c: 2 } };
deepClone(obj);
pick(obj, ['a']); // { a: 1 }
omit(obj, ['a']); // { b: { c: 2 } }
isEmpty({}); // true
deepMerge({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
```

### Date Utilities

```typescript
import { formatISO, formatDate, timeAgo, addDays, isValidDate } from '@vibe/shared-utils';

formatISO(new Date());
formatDate(new Date()); // '2025年11月19日'
timeAgo(new Date(Date.now() - 60000)); // '1 分鐘前'
addDays(new Date(), 7);
isValidDate(new Date()); // true
```

### Validation Utilities

```typescript
import { isEmail, isURL, isPhoneTW, isUUID, isJSON, isStrongPassword } from '@vibe/shared-utils';

isEmail('test@example.com'); // true
isURL('https://example.com'); // true
isPhoneTW('0912345678'); // true
isUUID('550e8400-e29b-41d4-a716-446655440000'); // true
isJSON('{"key": "value"}'); // true
isStrongPassword('Abc123!@#'); // true
```

### Async Utilities

```typescript
import { sleep, retry, debounce, throttle, timeout } from '@vibe/shared-utils';

await sleep(1000); // Sleep for 1 second
await retry(() => fetch('/api'), { retries: 3, delay: 1000 });

const debouncedFn = debounce(() => console.log('Called'), 500);
const throttledFn = throttle(() => console.log('Called'), 1000);

await timeout(fetch('/api'), 5000); // Timeout after 5 seconds
```

### Error Utilities

```typescript
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  safeAsync
} from '@vibe/shared-utils';

throw new ValidationError('Invalid input');
throw new NotFoundError('User not found');

const [error, data] = await safeAsync(fetchData());
if (error) {
  console.error(error);
} else {
  console.log(data);
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT
