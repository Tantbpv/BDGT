# User Memory Architecture

## 1. Overview

The application should separate **conversation history** from **long-term user memory**.

The main principle is:

> PostgreSQL is the source of truth; the context builder decides what the LLM needs to see.

The architecture consists of:

- **Users** — application users.
- **Conversations** — persistent user-visible threads.
- **Messages** — raw conversation history.
- **Conversation summary** — compact representation of older conversation content.
- **User memory** — curated, persistent facts/preferences/goals that can be useful across conversations.
- **pgvector** — optional but recommended for semantic retrieval of relevant memories.
- **Context service** — assembles the relevant information before an LLM request.

A typical request flow is:

```text
User message
    |
    +--> Load recent conversation messages
    |
    +--> Load conversation summary
    |
    +--> Retrieve relevant user/conversation memories
    |
    v
ContextService
    |
    v
LLM
    |
    +--> Assistant response
    |
    +--> Memory extraction/update (async)
    |
    v
Persist messages
```

---

## 2. Conversation vs User Memory

These concepts should not be mixed.

### Conversation

A conversation is a persistent thread containing the raw interaction history.

Example:

```text
Conversation: "Build my NestJS chatbot"

- User: I'm building a chatbot with NestJS.
- Assistant: ...
- User: I'm using PostgreSQL.
- Assistant: ...
- User: How should I implement memory?
- Assistant: ...
```

The conversation has a stable `conversationId`.

### User memory

User memory contains information that may remain useful across multiple conversations.

Examples:

```text
User is a backend developer.
User primarily uses TypeScript.
User prefers PostgreSQL.
User prefers concise answers.
User is currently building an AI chatbot.
```

The distinction is important:

```text
User
 |
 +-- User memory
 |     +-- prefers TypeScript
 |     +-- backend developer
 |     +-- prefers PostgreSQL
 |
 +-- Conversation A
 |     +-- messages
 |     +-- summary
 |     +-- conversation-specific memories
 |
 +-- Conversation B
       +-- messages
       +-- summary
```

A conversation can be long without all of its content becoming user memory.

---

## 3. Context Management

Do not send the complete conversation to the LLM on every request.

For a long conversation, use three layers:

```text
System instructions
        |
        +-- Conversation summary
        |
        +-- Relevant long-term memories
        |
        +-- Recent messages
        |
        +-- Current user message
```

For example:

```text
System prompt

User memories:
- User is a backend developer.
- User primarily works with TypeScript.
- User prefers PostgreSQL.

Conversation summary:
- The user is implementing persistent memory in a NestJS chatbot.

Recent messages:
- ...
- ...
- ...

Current message:
"How should I handle outdated memories?"
```

This keeps prompt size predictable while retaining important historical information.

---

## 4. Recommended PostgreSQL Model

PostgreSQL should be the source of truth for all persistent conversation data.

Recommended entities:

```text
User
Conversation
Message
UserMemory
```

Optionally, `UserMemory` can be associated with a specific conversation through `conversationId`.

This allows the same table to contain:

- global user memories (`conversationId = null`)
- conversation-specific memories (`conversationId != null`)

---

## 5. Prisma Schema

A starting Prisma schema:

```prisma
model User {
  id            String         @id @default(uuid())
  memories      UserMemory[]
  conversations Conversation[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Conversation {
  id        String       @id @default(uuid())
  userId    String
  user      User         @relation(fields: [userId], references: [id])

  title     String?
  summary   String?

  messages  Message[]
  memories  UserMemory[]

  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([userId, updatedAt])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])

  role           MessageRole
  content        String

  tokenCount     Int?
  metadata       Json?

  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

model UserMemory {
  id             String        @id @default(uuid())

  userId         String
  user           User          @relation(fields: [userId], references: [id])

  // Null = user-level memory.
  // Non-null = memory specific to a conversation.
  conversationId String?
  conversation   Conversation? @relation(fields: [conversationId], references: [id])

  type           MemoryType
  content        String

  importance     Float         @default(0.5)
  confidence     Float         @default(1.0)

  status         MemoryStatus  @default(ACTIVE)

  sourceMessageId String?
  supersededById  String?

  lastConfirmedAt DateTime?
  expiresAt       DateTime?

  metadata        Json?

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([userId, status])
  @@index([conversationId, status])
}

enum MessageRole {
  SYSTEM
  USER
  ASSISTANT
  TOOL
}

enum MemoryType {
  FACT
  PREFERENCE
  GOAL
  PROJECT_CONTEXT
  INSTRUCTION
}

enum MemoryStatus {
  ACTIVE
  SUPERSEDED
  EXPIRED
  DELETED
}
```

### Notes

The exact schema can be simplified initially.

For a first version, the most important fields are:

```text
userId
content
type
importance
confidence
status
createdAt
updatedAt
```

The lifecycle fields become increasingly useful as the memory system matures.

---

# 6. pgvector

pgvector is recommended if semantic retrieval of memories is required.

Because PostgreSQL is already the application's primary database, pgvector avoids introducing a separate vector database for the initial implementation.

Enable it with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The embedding column can be represented in Prisma as:

```prisma
embedding Unsupported("vector(1536)")?
```

The dimension depends on the embedding model.

For example:

```sql
ALTER TABLE "UserMemory"
ADD COLUMN "embedding" vector(1536);
```

For larger memory collections, use an HNSW index:

```sql
CREATE INDEX "UserMemory_embedding_idx"
ON "UserMemory"
USING hnsw ("embedding" vector_cosine_ops);
```

The actual dimension and distance operator should match the selected embedding model and retrieval strategy.

---

## 7. Memory Retrieval

When processing a new user message:

1. Generate an embedding for the current message.
2. Search active memories belonging to the user.
3. Retrieve the most semantically relevant memories.
4. Optionally rerank using importance, confidence, and freshness.
5. Include only the best memories in the LLM context.

Example:

```sql
SELECT
    id,
    content,
    type,
    importance,
    confidence,
    1 - (embedding <=> $1::vector) AS similarity
FROM "UserMemory"
WHERE "userId" = $2
  AND status = 'ACTIVE'
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

The retrieved memories should then be passed to the `ContextService`.

Conceptually:

```text
Current message
      |
      v
Generate embedding
      |
      v
pgvector similarity search
      |
      v
Candidate memories
      |
      v
Filter / rerank
      |
      v
LLM context
```

For small datasets, exact vector search may be sufficient. HNSW can be introduced as the memory dataset grows.

---

# 8. Memory Should Be Atomic

Do not store a whole conversation as one memory embedding.

Bad:

```text
"User is a backend developer, uses NestJS and PostgreSQL,
prefers TypeScript, is building an AI chatbot and recently
debugged a Redis connection."
```

Prefer individual, normalized memories:

```text
User is a backend developer.

User primarily works with NestJS and PostgreSQL.

User prefers TypeScript for new projects.

User is building an AI chatbot.
```

Each memory can have its own embedding.

This makes semantic retrieval much more precise.

A memory should ideally be:

- atomic
- self-contained
- normalized
- useful outside the original conversation
- stable enough to justify persistence

Avoid storing temporary conversational state as long-term memory.

---

# 9. How the LLM Decides What Becomes User Memory

The application should not blindly save every user message as memory.

Instead, use a dedicated **memory extraction step**.

After a conversation turn, a separate LLM call can analyze the interaction and produce memory operations.

Example:

```text
User message:
"I'm a backend developer and I mostly use NestJS and PostgreSQL."

Memory extractor:

CREATE:
- User is a backend developer.
- User primarily works with NestJS and PostgreSQL.
```

For a transient question:

```text
User:
"What does dependency injection mean?"

Memory extractor:

NOOP
```

The memory extractor should be given explicit rules.

### Good memory candidates

- Stable personal/professional facts.
- User preferences.
- Long-term goals.
- Persistent project context.
- Explicit instructions about how the assistant should behave.
- Other information that is likely to be useful in future conversations.

### Usually not memory

- Temporary conversational state.
- One-off questions.
- Generic facts.
- Short-lived debugging state.
- Information that only makes sense in the current message.
- Sensitive information unless the product explicitly supports storing it and has appropriate safeguards.

The LLM should return **structured operations**, rather than directly modifying the database.

For example:

```json
{
  "operations": [
    {
      "action": "CREATE",
      "memory": {
        "type": "PREFERENCE",
        "content": "User prefers PostgreSQL.",
        "importance": 0.8,
        "confidence": 0.95
      }
    }
  ]
}
```

Possible operations:

```text
CREATE
UPDATE
SUPERSEDE
DELETE
NOOP
```

The NestJS application remains responsible for validating and applying these operations.

This gives the application control over persistent state:

```text
LLM
 |
 | proposes memory operation
 v
MemoryService
 |
 +-- validate
 +-- deduplicate
 +-- check conflicts
 +-- apply business rules
 |
 v
PostgreSQL
```

---

# 10. Memory Extraction Input

The memory extractor does not need the entire conversation.

A practical input is:

```text
Current user message
+
Assistant response
+
Relevant existing memories
```

For example:

```text
Existing memories:
- User primarily uses NestJS.
- User prefers PostgreSQL.
- User is a backend developer.

User:
"I've switched to Go for some of my new services."

Assistant:
...

Memory extraction:
CREATE:
- User is also working with Go.
```

This keeps the extraction prompt small.

---

# 11. Memory Deduplication and Updates

Memory should be treated as mutable knowledge rather than an append-only list.

Suppose the database contains:

```text
User prefers MongoDB.
```

Later the user says:

```text
"I've moved all my projects to PostgreSQL. I don't use MongoDB anymore."
```

The extractor should identify this as a contradiction and propose:

```json
{
  "action": "SUPERSEDE",
  "targetMemoryId": "existing-memory-id",
  "newMemory": {
    "type": "PREFERENCE",
    "content": "User prefers PostgreSQL.",
    "confidence": 0.98
  }
}
```

The application can then:

```text
MongoDB preference
    |
    v
SUPERSEDED

PostgreSQL preference
    |
    v
ACTIVE
```

Do not rely on vector similarity alone to detect contradictions. Semantic search can find potentially related memories; memory-management logic should decide whether they are duplicates, compatible facts, or actual conflicts.

---

# 12. Memory Lifecycle

Recommended initial lifecycle:

```text
ACTIVE
  |
  +--> SUPERSEDED
  |
  +--> EXPIRED
  |
  +--> DELETED
```

### ACTIVE

The memory is considered valid and can be retrieved.

### SUPERSEDED

A newer memory replaces it.

Example:

```text
User uses MongoDB.
        |
        v
User uses PostgreSQL.
```

Keep the old record as superseded rather than immediately deleting it.

### EXPIRED

The information had a limited lifetime.

For example:

```text
User is preparing for an interview.
```

could have an `expiresAt` date.

### DELETED

The memory has been explicitly removed or should no longer be used.

Normal retrieval should only use:

```text
status = ACTIVE
```

---

# 13. Memory Freshness

Not every memory needs the same lifetime.

Examples:

| Memory | Typical lifetime |
|---|---|
| User's name | Long |
| Professional role | Long, but changeable |
| Technical preference | Long/medium |
| Current project | Medium |
| Current goal | Medium |
| Temporary task | Short |

Useful fields include:

```text
lastConfirmedAt
expiresAt
confidence
importance
```

A memory can be reinforced when the user confirms or uses the same information again.

For example:

```text
lastConfirmedAt = now()
confidence = 0.95
```

Retrieval can optionally incorporate:

```text
semantic similarity
+
importance
+
confidence
+
freshness
```

Do not make time-based expiration the only mechanism. Explicit user corrections should generally have much stronger priority.

---

# 14. Memory Consolidation

Over time, duplicate or highly similar memories can accumulate:

```text
User likes PostgreSQL.
User prefers PostgreSQL.
User primarily uses PostgreSQL.
User is comfortable with PostgreSQL.
```

A background consolidation process can merge these into:

```text
User primarily uses and prefers PostgreSQL.
```

This is not required for the first version.

A good initial implementation is:

1. Extract memory.
2. Search for similar active memories.
3. Let the extractor determine whether it is new, duplicate, or conflicting.
4. Create/update/supersede accordingly.
5. Add periodic consolidation later if memory volume becomes significant.

---

# 15. NestJS Service Structure

A reasonable module structure:

```text
src/
├── conversations/
│   ├── conversation.controller.ts
│   ├── conversation.service.ts
│   └── conversation.repository.ts
│
├── messages/
│   ├── message.service.ts
│   └── message.repository.ts
│
├── memory/
│   ├── memory.service.ts
│   ├── memory.repository.ts
│   ├── memory-extractor.service.ts
│   ├── memory-retriever.service.ts
│   └── memory-consolidator.service.ts
│
├── summary/
│   └── conversation-summary.service.ts
│
├── context/
│   └── context.service.ts
│
└── llm/
    └── llm.service.ts
```

The central abstraction should be the context builder:

```typescript
const context = await contextService.buildContext({
  userId,
  conversationId,
  input: userMessage,
});

const response = await llmService.generate(context);
```

`ContextService` should be responsible for deciding what information is relevant to the current LLM call.

---

# 16. Recommended Request Pipeline

A production-oriented flow:

```text
POST /conversations/:conversationId/messages
                    |
                    v
             Validate ownership
                    |
                    v
             Save user message
                    |
                    v
          Build LLM context
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
     Summary    Recent       Relevant
               messages      memories
        |           |           |
        +-----------+-----------+
                    |
                    v
                   LLM
                    |
                    v
           Save assistant message
                    |
                    v
          Async memory extraction
                    |
                    v
       Create/update memory records
```

Memory extraction and consolidation should normally be asynchronous so that they do not unnecessarily increase user-visible response latency.

---

# 17. Recommended Initial Implementation

Do not build the entire memory system at once.

A good first version:

### Phase 1

Implement:

```text
User
Conversation
Message
```

with:

- persistent conversation IDs
- raw messages
- recent-message context
- conversation summaries

### Phase 2

Add:

```text
UserMemory
```

with:

- `userId`
- `content`
- `type`
- `importance`
- `confidence`
- `status`

Use an LLM memory extractor to create memories.

### Phase 3

Add pgvector:

```text
UserMemory
    +
embedding
    +
HNSW index
```

Use semantic retrieval to select relevant memories.

### Phase 4

Add lifecycle management:

```text
SUPERSEDED
EXPIRED
DELETED
```

plus contradiction detection and memory consolidation.

This keeps the architecture simple initially while leaving room for a much more sophisticated memory system later.

---

# 18. Core Design Principle

The overall architecture can be summarized as:

```text
                    PostgreSQL
                         |
          +--------------+--------------+
          |                             |
     Conversation                   User Memory
          |                             |
     +----+----+                 +------+------+
     |         |                 |             |
 Messages   Summary           Facts       Preferences
                                   |
                               Embeddings
                                   |
                               pgvector
          |                             |
          +--------------+--------------+
                         |
                         v
                   ContextService
                         |
                         v
                        LLM
```

The most important separation is:

> **Conversation history answers "what happened?"**

> **User memory answers "what should we remember about this user?"**

> **ContextService answers "what does the LLM need to know right now?"**

Keeping these responsibilities separate gives you a persistent, scalable conversation architecture without requiring the LLM to receive the entire history on every request.
