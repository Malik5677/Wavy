with open('server.ts', 'r') as f:
    content = f.read()

# Replace block logic to check first
old_block = """    await db.insert(blockedUsers).values({ blockerId, blockedId }).onConflictDoNothing();"""
new_block = """    const existing = await db.select().from(blockedUsers).where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId))).limit(1);
    if (existing.length === 0) {
      await db.insert(blockedUsers).values({ blockerId, blockedId });
    }"""

content = content.replace(old_block, new_block)

with open('server.ts', 'w') as f:
    f.write(content)
print("Patched block logic")
