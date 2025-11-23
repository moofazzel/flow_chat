# 🎯 Flow Chat - Coding Standards (Next.js 16 + React 19.2)

## TypeScript Rules

- ❌ **NO `any` types** - Use proper types or `unknown`
- ✅ Strict mode enabled
- ✅ Explicit return types
- ✅ Const assertions

## React 19.2 + Next.js 16

- ✅ Server Components by default (async)
- ✅ `"use client"` only for interactivity
- ✅ Server Actions for mutations
- ✅ React Compiler (auto-optimizes)
- ✅ Named exports

## Component Patterns

```typescript
// Server Component (default)
export async function Posts() {
  const posts = await db.getPosts();
  return (
    <div>
      {posts.map((p) => (
        <Post key={p.id} {...p} />
      ))}
    </div>
  );
}

// Client Component
("use client");
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// Server Action
async function createPost(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  await db.posts.create({ title });
  revalidatePath("/posts");
}
```

## State Management

- ✅ `useState` - Local client state
- ✅ Server Actions - Mutations
- ✅ `useOptimistic` - Optimistic updates
- ✅ Supabase realtime - Live data

## Data Fetching

- ✅ Server: Direct async DB calls
- ✅ Client: `use()` hook or SWR
- ✅ Suspense for loading
- ✅ Error boundaries

## Error Handling

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: string };

export async function action(): Promise<Result<Data>> {
  try {
    const data = await db.fetch();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
```

## Performance (React 19.2)

- ✅ React Compiler handles memo/callback automatically
- ✅ Dynamic imports for code splitting
- ✅ Suspense boundaries
- ❌ No manual `useMemo`/`useCallback` (compiler does it)

## Security

- ✅ RLS policies in Supabase
- ✅ Validate user input
- ✅ Server Actions for sensitive ops
- ✅ Never expose secrets client-side
