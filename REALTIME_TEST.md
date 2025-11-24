# 🧪 Quick Realtime Test

## Test if Supabase Realtime is Working

Add this **temporary test component** to verify realtime is actually working:

### Create Test File: `app/components/RealtimeTest.tsx`

```typescript
"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export function RealtimeTest({ userId }: { userId: string }) {
  const [status, setStatus] = useState("Not connected");
  const [events, setEvents] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    console.log("🧪 TEST: Setting up test subscription for user:", userId);

    const channel = supabase
      .channel(`test-server-invites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "server_members",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🧪 TEST: Received event!", payload);
          setEvents((prev) => [...prev, JSON.stringify(payload.new)]);
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log("🧪 TEST: Subscription status:", subscriptionStatus);
        setStatus(subscriptionStatus);
      });

    return () => {
      console.log("🧪 TEST: Unsubscribing");
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-md z-50">
      <h3 className="font-bold mb-2">🧪 Realtime Test</h3>
      <p className="text-sm">
        Status:{" "}
        <span
          className={
            status === "SUBSCRIBED" ? "text-green-400" : "text-red-400"
          }
        >
          {status}
        </span>
      </p>
      <p className="text-xs mt-2">User ID: {userId}</p>
      {events.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-bold">Events received:</p>
          {events.map((event, i) => (
            <p key={i} className="text-xs text-green-400">
              {event}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Add to `page.tsx`:

Add this import:

```typescript
import { RealtimeTest } from "./components/RealtimeTest";
```

Add this component before `</div>` closing tag (around line 697):

```typescript
{
  /* Temporary Realtime Test */
}
{
  user && <RealtimeTest userId={user.id} />;
}
```

### What You Should See:

**If Realtime is ENABLED:**

```
Status: SUBSCRIBED (in green)
```

**If Realtime is NOT ENABLED:**

```
Status: CHANNEL_ERROR (in red)
```

**Console logs:**

```
🧪 TEST: Setting up test subscription for user: xxxxx
🧪 TEST: Subscription status: SUBSCRIBED
```

---

## Next Step

1. **Add the test component**
2. **Refresh your app**
3. **Check the bottom-left corner** for the test panel
4. **Tell me what status you see**

This will confirm whether realtime is enabled or not!
